"""식재료 마스터 테스트 — US-008 (CRUD, 중복 409, 참조중 409, 소유권)."""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def test_list_requires_auth(client):
    r = client.get("/api/v1/ingredients")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_create_and_duplicate_409(client):
    client.post("/api/v1/auth/signup", json={"email": "i1@navercorp.com", "password": "s3curePass!"})
    r = client.post("/api/v1/ingredients", json={"name": "양파", "category": "채소", "default_unit": "개"})
    assert r.status_code == 201
    assert r.json()["id"].startswith("ing_")
    dup = client.post("/api/v1/ingredients", json={"name": "양파"})
    assert dup.status_code == 409
    assert dup.json()["error"]["code"] == "INGREDIENT_NAME_EXISTS"


def test_duplicate_scoped_per_owner(client):
    # 개인별 마스터: 다른 회원은 같은 이름을 등록할 수 있다
    c1 = _auth("i2a@navercorp.com")
    c2 = _auth("i2b@navercorp.com")
    assert c1.post("/api/v1/ingredients", json={"name": "마늘"}).status_code == 201
    assert c2.post("/api/v1/ingredients", json={"name": "마늘"}).status_code == 201


def test_get_put_ownership(client):
    owner = _auth("i3@navercorp.com")
    iid = owner.post("/api/v1/ingredients", json={"name": "대파"}).json()["id"]
    # 수정
    upd = owner.put(f"/api/v1/ingredients/{iid}", json={"name": "쪽파", "default_unit": "단"})
    assert upd.status_code == 200 and upd.json()["name"] == "쪽파"
    # 타인 접근 403
    other = _auth("i3b@navercorp.com")
    assert other.get(f"/api/v1/ingredients/{iid}").status_code == 403
    assert other.put(f"/api/v1/ingredients/{iid}", json={"name": "x"}).status_code == 403
    # 없는 리소스 404
    assert owner.get("/api/v1/ingredients/ing_nope").status_code == 404


def test_delete_in_use_409_then_force(client):
    owner = _auth("i4@navercorp.com")
    iid = owner.post("/api/v1/ingredients", json={"name": "김치"}).json()["id"]
    owner.post("/api/v1/recipes", json={
        "title": "김치볶음밥", "steps": ["볶는다"],
        "ingredients": [{"ingredient_id": iid, "quantity": 200, "unit": "g"}],
    })
    # 참조 중 -> 409
    r = owner.delete(f"/api/v1/ingredients/{iid}")
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "INGREDIENT_IN_USE"
    assert any(d["field"] == "recipes" for d in r.json()["error"]["details"])
    # force=true -> 204
    r = owner.delete(f"/api/v1/ingredients/{iid}", params={"force": "true"})
    assert r.status_code == 204
    assert owner.get(f"/api/v1/ingredients/{iid}").status_code == 404


def test_search_ingredients(client):
    owner = _auth("i5@navercorp.com")
    owner.post("/api/v1/ingredients", json={"name": "양송이버섯", "category": "채소"})
    owner.post("/api/v1/ingredients", json={"name": "돼지고기", "category": "육류"})
    r = owner.get("/api/v1/ingredients", params={"q": "버섯"})
    names = [i["name"] for i in r.json()["data"]]
    assert names == ["양송이버섯"]
    r = owner.get("/api/v1/ingredients", params={"category": "육류"})
    assert all(i["category"] == "육류" for i in r.json()["data"])
