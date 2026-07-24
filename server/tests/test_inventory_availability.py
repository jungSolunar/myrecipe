"""재고(US-011) + 레시피 상세 부족 재료 대조(US-012) 테스트.

이번 1차 출시 필수 범위는 아니나(Should) 계약 엔드포인트 동작을 검증한다.
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def test_inventory_crud(client):
    c = _auth("inv1@navercorp.com")
    ing = c.post("/api/v1/ingredients", json={"name": "우유", "default_unit": "ml"}).json()["id"]
    created = c.post("/api/v1/inventory", json={"ingredient_id": ing, "quantity": 1000, "unit": "ml"})
    assert created.status_code == 201
    iv = created.json()
    assert iv["id"].startswith("inv_") and iv["ingredient_name"] == "우유"
    lst = c.get("/api/v1/inventory").json()
    assert len(lst["data"]) == 1
    upd = c.put(f"/api/v1/inventory/{iv['id']}", json={"ingredient_id": ing, "quantity": 500, "unit": "ml"})
    assert upd.status_code == 200 and upd.json()["quantity"] == 500
    assert c.delete(f"/api/v1/inventory/{iv['id']}").status_code == 204


def test_recipe_detail_availability(client):
    c = _auth("inv2@navercorp.com")
    kimchi = c.post("/api/v1/ingredients", json={"name": "김치", "default_unit": "g"}).json()["id"]
    pork = c.post("/api/v1/ingredients", json={"name": "돼지고기", "default_unit": "g"}).json()["id"]
    rid = c.post("/api/v1/recipes", json={
        "title": "김치찌개", "steps": ["끓인다"],
        "ingredients": [
            {"ingredient_id": kimchi, "quantity": 300, "unit": "g"},
            {"ingredient_id": pork, "quantity": 200, "unit": "g"},
        ],
    }).json()["id"]
    # 김치만 충분히 보유 -> 돼지고기 부족
    c.post("/api/v1/inventory", json={"ingredient_id": kimchi, "quantity": 500, "unit": "g"})

    detail = c.get(f"/api/v1/recipes/{rid}").json()
    avail = detail["ingredient_availability"]
    assert avail is not None
    assert avail["status"] == "insufficient"
    assert avail["missing_count"] == 1
    assert avail["missing_ingredients"][0]["name"] == "돼지고기"
    statuses = {i["name"]: i["status"] for i in detail["ingredients"]}
    assert statuses["김치"] == "sufficient"
    assert statuses["돼지고기"] == "missing"


def test_availability_hidden_without_inventory(client):
    c = _auth("inv3@navercorp.com")
    ing = c.post("/api/v1/ingredients", json={"name": "소금", "default_unit": "g"}).json()["id"]
    rid = c.post("/api/v1/recipes", json={
        "title": "소금물", "steps": ["섞는다"],
        "ingredients": [{"ingredient_id": ing, "quantity": 5, "unit": "g"}],
    }).json()["id"]
    # 재고 없음 -> availability 생략
    detail = c.get(f"/api/v1/recipes/{rid}").json()
    assert detail["ingredient_availability"] is None
    assert detail["ingredients"][0]["status"] is None
