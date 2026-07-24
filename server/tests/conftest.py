"""테스트 공통 픽스처. 각 테스트는 격리된 임시 SQLite 파일을 사용한다."""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402


@pytest.fixture()
def client(tmp_path):
    app.state.db_path = str(tmp_path / "test.db")
    from app.config import settings
    settings.UPLOAD_DIR = str(tmp_path / "uploads")
    with TestClient(app) as c:
        yield c


# ---- 헬퍼 ----
def signup(client, email="cook@navercorp.com", password="s3curePass!"):
    return client.post("/api/v1/auth/signup", json={"email": email, "password": password})


def new_client_user(client, email):
    """독립 세션을 위해 새 쿠키 jar 를 쓰는 별도 클라이언트를 반환."""
    from app.main import app as _app
    c = TestClient(_app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c
