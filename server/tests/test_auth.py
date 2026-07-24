"""인증 테스트 — US-001, US-002, US-003."""


def test_signup_success_sets_cookie(client):
    r = client.post("/api/v1/auth/signup", json={"email": "a@navercorp.com", "password": "s3curePass!"})
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["email"] == "a@navercorp.com"
    assert body["user"]["id"].startswith("usr_")
    assert "session" in r.cookies


def test_signup_duplicate_email_409(client):
    client.post("/api/v1/auth/signup", json={"email": "dup@navercorp.com", "password": "s3curePass!"})
    r = client.post("/api/v1/auth/signup", json={"email": "dup@navercorp.com", "password": "s3curePass!"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"


def test_signup_short_password_400(client):
    r = client.post("/api/v1/auth/signup", json={"email": "x@navercorp.com", "password": "short"})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_signup_invalid_email_400(client):
    r = client.post("/api/v1/auth/signup", json={"email": "not-an-email", "password": "s3curePass!"})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_login_success_and_invalid(client):
    client.post("/api/v1/auth/signup", json={"email": "b@navercorp.com", "password": "s3curePass!"})
    client.post("/api/v1/auth/logout")
    ok = client.post("/api/v1/auth/login", json={"email": "b@navercorp.com", "password": "s3curePass!"})
    assert ok.status_code == 200
    bad = client.post("/api/v1/auth/login", json={"email": "b@navercorp.com", "password": "wrong"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_requires_auth(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_logout_flow(client):
    client.post("/api/v1/auth/signup", json={"email": "c@navercorp.com", "password": "s3curePass!"})
    assert client.get("/api/v1/auth/me").status_code == 200
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401
