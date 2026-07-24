"""인증 라우터 — US-001(회원가입), US-002(로그인/로그아웃), US-003(me 게이트)."""
import sqlite3

from fastapi import APIRouter, Depends, Response

from .. import security
from ..config import settings
from ..db import utcnow
from ..deps import get_db, require_user
from ..errors import AppError
from ..ids import new_id
from ..schemas import AuthResponse, LoginRequest, SignupRequest, User

router = APIRouter(tags=["auth"])


def _user_out(row: sqlite3.Row) -> User:
    return User(id=row["id"], email=row["email"], created_at=row["created_at"], updated_at=row["updated_at"])


def _issue_session(db: sqlite3.Connection, response: Response, user_id: str) -> None:
    token = security.generate_session_token()
    now = utcnow()
    db.execute(
        "INSERT INTO sessions(id, user_id, token, created_at, updated_at) VALUES (?,?,?,?,?)",
        (new_id("ses"), user_id, token, now, now),
    )
    db.commit()
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=security.sign_cookie(token),
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/auth/signup", status_code=201, response_model=AuthResponse)
def signup(body: SignupRequest, response: Response, db: sqlite3.Connection = Depends(get_db)):
    exists = db.execute(
        "SELECT 1 FROM users WHERE email = ? AND deleted_at IS NULL", (body.email,)
    ).fetchone()
    if exists:
        raise AppError(409, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.",
                       [{"field": "email", "reason": "duplicate"}])
    now = utcnow()
    uid = new_id("usr")
    db.execute(
        "INSERT INTO users(id, email, password_hash, created_at, updated_at) VALUES (?,?,?,?,?)",
        (uid, body.email, security.hash_password(body.password), now, now),
    )
    db.commit()
    _issue_session(db, response, uid)
    row = db.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    return AuthResponse(user=_user_out(row))


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest, response: Response, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute(
        "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL", (body.email,)
    ).fetchone()
    if row is None or not security.verify_password(body.password, row["password_hash"]):
        raise AppError(401, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.")
    _issue_session(db, response, row["id"])
    return AuthResponse(user=_user_out(row))


@router.post("/auth/logout", status_code=204)
def logout(response: Response, db: sqlite3.Connection = Depends(get_db),
           user: sqlite3.Row = Depends(require_user)):
    # 현재 사용자의 활성 세션을 소프트 삭제하고 쿠키를 만료시킨다.
    now = utcnow()
    db.execute(
        "UPDATE sessions SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL",
        (now, now, user["id"]),
    )
    db.commit()
    response.delete_cookie(key=settings.COOKIE_NAME, path="/")
    return None


@router.get("/auth/me", response_model=AuthResponse)
def me(user: sqlite3.Row = Depends(require_user)):
    return AuthResponse(user=_user_out(user))
