"""레시피 테스트 — US-004~007, US-010, 소유권/권한, 재료 연결(US-009)."""
from fastapi.testclient import TestClient

from app.main import app


def _mk_ingredient(client, name, unit="g"):
    r = client.post("/api/v1/ingredients", json={"name": name, "default_unit": unit})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _recipe_body(title, ings, category="한식"):
    return {
        "title": title,
        "category": category,
        "steps": ["끓인다", "낸다"],
        "ingredients": ings,
    }


def test_create_requires_auth(client):
    r = client.post("/api/v1/recipes", json=_recipe_body("김치찌개", []))
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_create_recipe_with_ingredients(client):
    client.post("/api/v1/auth/signup", json={"email": "r@navercorp.com", "password": "s3curePass!"})
    ing = _mk_ingredient(client, "김치")
    r = client.post("/api/v1/recipes", json=_recipe_body(
        "김치찌개", [{"ingredient_id": ing, "quantity": 300, "unit": "g"}]))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"].startswith("rcp_")
    assert body["is_owner"] is True
    assert body["ingredients"][0]["name"] == "김치"
    assert body["steps"] == ["끓인다", "낸다"]


def test_create_recipe_missing_title_400(client):
    client.post("/api/v1/auth/signup", json={"email": "r2@navercorp.com", "password": "s3curePass!"})
    r = client.post("/api/v1/recipes", json={"steps": [], "ingredients": []})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_create_recipe_bad_ingredient_400(client):
    client.post("/api/v1/auth/signup", json={"email": "r3@navercorp.com", "password": "s3curePass!"})
    r = client.post("/api/v1/recipes", json=_recipe_body(
        "잘못된재료", [{"ingredient_id": "ing_doesnotexist", "quantity": 1}]))
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_list_and_detail_public(client):
    client.post("/api/v1/auth/signup", json={"email": "r4@navercorp.com", "password": "s3curePass!"})
    ing = _mk_ingredient(client, "두부")
    rid = client.post("/api/v1/recipes", json=_recipe_body(
        "된장찌개", [{"ingredient_id": ing, "quantity": 1, "unit": "모"}])).json()["id"]

    anon = TestClient(app)  # 비로그인
    lst = anon.get("/api/v1/recipes")
    assert lst.status_code == 200
    assert any(item["id"] == rid for item in lst.json()["data"])
    detail = anon.get(f"/api/v1/recipes/{rid}")
    assert detail.status_code == 200
    assert detail.json()["is_owner"] is False
    # 비로그인은 재고 대조 없음
    assert detail.json()["ingredient_availability"] is None


def test_search_filter(client):
    client.post("/api/v1/auth/signup", json={"email": "r5@navercorp.com", "password": "s3curePass!"})
    ing_a = _mk_ingredient(client, "양파")
    ing_b = _mk_ingredient(client, "감자")
    client.post("/api/v1/recipes", json=_recipe_body(
        "카레라이스", [{"ingredient_id": ing_a, "quantity": 1}, {"ingredient_id": ing_b, "quantity": 2}], category="양식"))
    client.post("/api/v1/recipes", json=_recipe_body(
        "양파볶음", [{"ingredient_id": ing_a, "quantity": 1}], category="한식"))

    # q 검색
    r = client.get("/api/v1/recipes", params={"q": "카레"})
    titles = [i["title"] for i in r.json()["data"]]
    assert "카레라이스" in titles and "양파볶음" not in titles

    # category 필터
    r = client.get("/api/v1/recipes", params={"category": "양식"})
    assert all(i["category"] == "양식" for i in r.json()["data"])

    # ingredient AND 필터: 양파+감자 둘 다 있는 레시피만
    r = client.get("/api/v1/recipes", params=[("ingredient_id", ing_a), ("ingredient_id", ing_b)])
    ids_titles = [i["title"] for i in r.json()["data"]]
    assert ids_titles == ["카레라이스"]

    # 결과 없음
    r = client.get("/api/v1/recipes", params={"q": "없는레시피xyz"})
    assert r.json()["data"] == []


def test_pagination(client):
    client.post("/api/v1/auth/signup", json={"email": "r6@navercorp.com", "password": "s3curePass!"})
    for i in range(5):
        client.post("/api/v1/recipes", json=_recipe_body(f"레시피{i}", []))
    p1 = client.get("/api/v1/recipes", params={"limit": 2}).json()
    assert len(p1["data"]) == 2 and p1["has_more"] is True and p1["next_cursor"]
    p2 = client.get("/api/v1/recipes", params={"limit": 2, "cursor": p1["next_cursor"]}).json()
    assert len(p2["data"]) == 2
    # 페이지 간 중복 없음
    assert set(i["id"] for i in p1["data"]).isdisjoint(i["id"] for i in p2["data"])


def test_update_owner_and_forbidden(client):
    client.post("/api/v1/auth/signup", json={"email": "owner@navercorp.com", "password": "s3curePass!"})
    rid = client.post("/api/v1/recipes", json=_recipe_body("원본", [])).json()["id"]

    # 소유자 수정
    upd = client.put(f"/api/v1/recipes/{rid}", json=_recipe_body("수정됨", []))
    assert upd.status_code == 200 and upd.json()["title"] == "수정됨"

    # 타인 수정 시도 -> 403
    other = TestClient(app)
    other.post("/api/v1/auth/signup", json={"email": "intruder@navercorp.com", "password": "s3curePass!"})
    r = other.put(f"/api/v1/recipes/{rid}", json=_recipe_body("해킹", []))
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"


def test_delete_owner_and_forbidden_and_404(client):
    client.post("/api/v1/auth/signup", json={"email": "owner2@navercorp.com", "password": "s3curePass!"})
    rid = client.post("/api/v1/recipes", json=_recipe_body("삭제대상", [])).json()["id"]

    other = TestClient(app)
    other.post("/api/v1/auth/signup", json={"email": "intruder2@navercorp.com", "password": "s3curePass!"})
    assert other.delete(f"/api/v1/recipes/{rid}").status_code == 403

    assert client.delete(f"/api/v1/recipes/{rid}").status_code == 204
    # 삭제 후 상세 404
    assert client.get(f"/api/v1/recipes/{rid}").status_code == 404
    # 목록에서 사라짐
    assert all(i["id"] != rid for i in client.get("/api/v1/recipes").json()["data"])
