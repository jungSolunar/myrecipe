"""US-017 재고 보관위치(storage_location) 테스트.

- 저장/조회, nullable
- 냉장실/냉동실/실온 3종만 허용(그 외 400)
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def _ing(c, name="우유"):
    return c.post("/api/v1/ingredients", json={"name": name, "default_unit": "ml"}).json()["id"]


def test_create_with_storage_location(client):
    c = _auth("st1@navercorp.com")
    ing = _ing(c)
    r = c.post("/api/v1/inventory", json={
        "ingredient_id": ing, "quantity": 1000, "unit": "ml", "storage_location": "냉장실",
    })
    assert r.status_code == 201
    assert r.json()["storage_location"] == "냉장실"


def test_storage_location_nullable(client):
    c = _auth("st2@navercorp.com")
    ing = _ing(c)
    r = c.post("/api/v1/inventory", json={"ingredient_id": ing, "quantity": 500, "unit": "ml"})
    assert r.status_code == 201
    assert r.json()["storage_location"] is None


def test_update_storage_location(client):
    c = _auth("st3@navercorp.com")
    ing = _ing(c)
    iv = c.post("/api/v1/inventory", json={"ingredient_id": ing, "quantity": 1, "storage_location": "실온"}).json()
    upd = c.put(f"/api/v1/inventory/{iv['id']}", json={
        "ingredient_id": ing, "quantity": 1, "storage_location": "냉동실",
    })
    assert upd.status_code == 200 and upd.json()["storage_location"] == "냉동실"
    listed = c.get("/api/v1/inventory").json()["data"]
    assert listed[0]["storage_location"] == "냉동실"


def test_invalid_storage_location_400(client):
    c = _auth("st4@navercorp.com")
    ing = _ing(c)
    # 마스터용 값(냉장)은 재고 storage_location 에서 허용되지 않음(냉장실/냉동실/실온만)
    r = c.post("/api/v1/inventory", json={
        "ingredient_id": ing, "quantity": 1, "storage_location": "냉장",
    })
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"
