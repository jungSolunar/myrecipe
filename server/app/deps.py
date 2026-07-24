"""요청 스코프 의존성: DB 커넥션, 현재 사용자, 로그인 필수 게이트."""
import sqlite3
from typing import Optional

from fastapi import Depends, Request

from . import db as dbmod
from .config import settings
from .errors import auth_required
from .security import unsign_cookie


def get_db(request: Request):
    """요청마다 커넥션을 열고 닫는다. db_path는 app.state에서 주입(테스트 오버라이드 가능)."""
    conn = dbmod.connect(getattr(request.app.state, "db_path", None) or settings.DB_PATH)
    try:
        yield conn
    finally:
        conn.close()


def get_current_user(request: Request, db: sqlite3.Connection = Depends(get_db)) -> Optional[sqlite3.Row]:
    raw = request.cookies.get(settings.COOKIE_NAME)
    token = unsign_cookie(raw) if raw else None
    if not token:
        return None
    row = db.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ? AND s.deleted_at IS NULL AND u.deleted_at IS NULL",
        (token,),
    ).fetchone()
    return row


def require_user(user: Optional[sqlite3.Row] = Depends(get_current_user)) -> sqlite3.Row:
    if user is None:
        raise auth_required()
    return user
