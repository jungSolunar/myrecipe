"""접두사 + ULID 형식의 정렬 가능한 식별자 생성.

예) usr_01HZX2K..., rcp_01HZX2K..., ing_..., inv_..., rin_..., ses_...
ULID는 시간 기반이라 사전식 정렬 = 생성순 정렬이 되어 커서 페이지네이션에 유리하다.
"""
import os
import time

_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def _encode(value: int, length: int) -> str:
    chars = []
    for _ in range(length):
        chars.append(_CROCKFORD[value & 0x1F])
        value >>= 5
    return "".join(reversed(chars))


def _ulid() -> str:
    ms = int(time.time() * 1000)
    rand = int.from_bytes(os.urandom(10), "big")
    return _encode(ms, 10) + _encode(rand, 16)


def new_id(prefix: str) -> str:
    return f"{prefix}_{_ulid()}"
