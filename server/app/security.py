"""비밀번호 해시(bcrypt) 및 세션 토큰 서명(HMAC, 시크릿은 환경변수)."""
from __future__ import annotations

import hashlib
import hmac
import secrets

import bcrypt

from .config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_session_token() -> str:
    """DB에 저장할 불투명 토큰."""
    return secrets.token_urlsafe(32)


def sign_cookie(token: str) -> str:
    """쿠키 값 = token.signature. 시크릿으로 서명해 위변조를 탐지한다."""
    sig = hmac.new(settings.SECRET_KEY.encode(), token.encode(), hashlib.sha256).hexdigest()
    return f"{token}.{sig}"


def unsign_cookie(value: str) -> str | None:
    """서명 검증 후 원 토큰 반환. 실패 시 None."""
    if not value or "." not in value:
        return None
    token, _, sig = value.rpartition(".")
    expected = hmac.new(settings.SECRET_KEY.encode(), token.encode(), hashlib.sha256).hexdigest()
    if hmac.compare_digest(sig, expected):
        return token
    return None
