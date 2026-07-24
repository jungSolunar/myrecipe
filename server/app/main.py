"""FastAPI 앱 구성. 모든 라우트는 /api/v1 프리픽스 하위(openapi servers.url).

- 세션 쿠키 인증(HttpOnly)
- 표준 에러 포맷: {error:{code,message,details}}
- 검증 실패(pydantic 422)를 계약의 400 VALIDATION_ERROR 로 매핑
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import db as dbmod
from .config import settings
from .errors import AppError, app_error_handler, error_body
from .routers import auth, ingredients, inventory, recipes, uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    conn = dbmod.connect(getattr(app.state, "db_path", None) or settings.DB_PATH)
    try:
        dbmod.run_migrations(conn)
    finally:
        conn.close()
    yield


app = FastAPI(title="레시피 & 식재료 관리 API", version="1.0.0", lifespan=lifespan)

API_PREFIX = "/api/v1"
for r in (auth.router, recipes.router, ingredients.router, inventory.router, uploads.router):
    app.include_router(r, prefix=API_PREFIX)


# ---- 예외 핸들러 (표준 에러 포맷) ----
app.add_exception_handler(AppError, app_error_handler)


@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query", "path")]
        details.append({"field": ".".join(loc) or None, "reason": err.get("type", "invalid")})
    return JSONResponse(status_code=400, content=error_body("VALIDATION_ERROR", "입력값을 확인해주세요.", details))


@app.exception_handler(StarletteHTTPException)
async def _http_handler(request: Request, exc: StarletteHTTPException):
    code_map = {401: "AUTH_REQUIRED", 403: "FORBIDDEN", 404: "RESOURCE_NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    message = exc.detail if isinstance(exc.detail, str) else "요청을 처리할 수 없습니다."
    return JSONResponse(status_code=exc.status_code, content=error_body(code, message))


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content=error_body("INTERNAL_ERROR", "서버 오류가 발생했습니다."))
