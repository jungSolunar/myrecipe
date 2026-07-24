"""이미지 업로드 라우터 — US-004 사진(선택) 지원.

소규모 기준: 로컬 파일시스템에 저장하고 공개 URL을 반환한다. 반환된 url 을
레시피의 photo_url 에 넣어 저장한다. 저장된 파일은 GET /uploads/files/{name} 로 서빙.
"""
import os
import sqlite3

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from ..config import settings
from ..deps import require_user
from ..errors import not_found, validation_error
from ..ids import new_id
from ..schemas import UploadResponse

router = APIRouter(tags=["uploads"])

_ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png"}


@router.post("/uploads/images", status_code=201, response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...), user: sqlite3.Row = Depends(require_user)):
    ext = _ALLOWED.get(file.content_type or "")
    if ext is None:
        raise validation_error([{"field": "file", "reason": "unsupported_type"}])
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    name = f"{new_id('img')}{ext}"
    dest = os.path.join(settings.UPLOAD_DIR, name)
    with open(dest, "wb") as out:
        out.write(await file.read())
    return UploadResponse(url=f"{settings.UPLOAD_BASE_URL}/{name}")


@router.get("/uploads/files/{name}")
def serve_file(name: str):
    # 경로 조작 방지: basename 만 허용
    safe = os.path.basename(name)
    path = os.path.join(settings.UPLOAD_DIR, safe)
    if not os.path.isfile(path):
        raise not_found()
    return FileResponse(path)
