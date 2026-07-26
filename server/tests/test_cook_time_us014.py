"""US-014 조리시간(cook_time_minutes) 테스트.

- 생성/수정/조회 반영, nullable, 목록/상세 표기
- sort=cook_time_asc (값 없는 항목은 뒤로)
- 비로그인 응답에도 조리시간 포함(공개 정보, 2026-07-26 결정)
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def _recipe(c, title, cook_time=None):
    body = {"title": title, "category": "한식", "steps": ["조리"], "ingredients": []}
    if cook_time is not None:
        body["cook_time_minutes"] = cook_time
    return c.post("/api/v1/recipes", json=body).json()


def test_create_with_cook_time(client):
    c = _auth("ct1@navercorp.com")
    r = _recipe(c, "김치찌개", cook_time=15)
    assert r["cook_time_minutes"] == 15
    detail = c.get(f"/api/v1/recipes/{r['id']}").json()
    assert detail["cook_time_minutes"] == 15


def test_create_without_cook_time_is_null(client):
    c = _auth("ct2@navercorp.com")
    r = _recipe(c, "간장계란밥")
    assert r["cook_time_minutes"] is None


def test_update_cook_time(client):
    c = _auth("ct3@navercorp.com")
    rid = _recipe(c, "된장찌개", cook_time=20)["id"]
    upd = c.put(f"/api/v1/recipes/{rid}", json={
        "title": "된장찌개", "steps": ["조리"], "ingredients": [], "cook_time_minutes": 25,
    })
    assert upd.status_code == 200 and upd.json()["cook_time_minutes"] == 25


def test_sort_cook_time_asc_nulls_last(client):
    c = _auth("ct4@navercorp.com")
    _recipe(c, "느린요리", cook_time=30)
    _recipe(c, "빠른요리", cook_time=10)
    _recipe(c, "시간없음")  # null
    _recipe(c, "중간요리", cook_time=20)
    data = c.get("/api/v1/recipes", params={"sort": "cook_time_asc"}).json()["data"]
    titles = [i["title"] for i in data]
    # 오름차순 10,20,30 후 값 없는 항목(null) 뒤로
    assert titles == ["빠른요리", "중간요리", "느린요리", "시간없음"]


def test_cook_time_visible_to_guest(client):
    c = _auth("ct5@navercorp.com")
    rid = _recipe(c, "공개레시피", cook_time=12)["id"]
    guest = TestClient(app)  # 비로그인
    detail = guest.get(f"/api/v1/recipes/{rid}").json()
    assert detail["cook_time_minutes"] == 12
    listed = {i["id"]: i for i in guest.get("/api/v1/recipes").json()["data"]}
    assert listed[rid]["cook_time_minutes"] == 12


def test_cook_time_negative_rejected(client):
    c = _auth("ct6@navercorp.com")
    r = c.post("/api/v1/recipes", json={
        "title": "음수", "steps": [], "ingredients": [], "cook_time_minutes": -5,
    })
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"
