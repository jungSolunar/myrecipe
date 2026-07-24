"""표준 에러 응답 (api-conventions 스킬).

포맷: { "error": { "code": SCREAMING_SNAKE_CASE, "message": str, "details": [{field, reason}] } }
"""
from typing import Any, Optional

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: Optional[list] = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)


def error_body(code: str, message: str, details: Optional[list] = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or []}}


# --- 자주 쓰는 헬퍼들 ---
def auth_required() -> AppError:
    return AppError(401, "AUTH_REQUIRED", "로그인이 필요합니다.")


def forbidden() -> AppError:
    return AppError(403, "FORBIDDEN", "이 리소스에 대한 권한이 없습니다.")


def not_found() -> AppError:
    return AppError(404, "RESOURCE_NOT_FOUND", "요청한 리소스를 찾을 수 없습니다.")


def validation_error(details: list) -> AppError:
    return AppError(400, "VALIDATION_ERROR", "입력값을 확인해주세요.", details)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message, exc.details))
