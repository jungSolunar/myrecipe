"""환경변수 기반 설정. 시크릿은 절대 하드코딩하지 않는다."""
import os


class Settings:
    # 세션 쿠키 서명용 시크릿. 운영에서는 반드시 환경변수로 주입.
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-insecure-secret-change-me")
    # SQLite 파일 경로. 테스트는 별도 임시 경로를 주입한다.
    DB_PATH: str = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "app.db"))
    # Set-Cookie Secure 속성 (HTTPS 배포 시 true). 로컬 개발 기본 false.
    COOKIE_SECURE: bool = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_NAME: str = "session"
    # 업로드 저장 디렉토리 및 공개 base URL
    UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads"))
    UPLOAD_BASE_URL: str = os.environ.get("UPLOAD_BASE_URL", "/api/v1/uploads/files")


settings = Settings()
