"""커서 페이지네이션 유틸.

커서는 base64url(json({"id": <last_id>})) 형식. ID가 ULID라 사전식 정렬이
생성순과 일치하므로, 최신순(recent)은 id 내림차순으로 페이지를 넘긴다.
"""
import base64
import json
from typing import Optional


def encode_cursor(last_id: str) -> str:
    raw = json.dumps({"id": last_id}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: Optional[str]) -> Optional[str]:
    if not cursor:
        return None
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded).decode())
        cid = data.get("id")
        return cid if isinstance(cid, str) else None
    except Exception:
        return None
