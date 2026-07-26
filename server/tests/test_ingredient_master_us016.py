"""US-016 식재료 마스터 확장(aliases·kcal_per_100g·default_storage·memo) 테스트.

- 신규 필드 저장/조회
- 별칭(aliases) 검색 매칭
- default_storage 는 냉장/냉동/실온 3종만 허용(그 외 400)
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def test_create_with_extended_fields(client):
    c = _auth("im1@navercorp.com")
    r = c.post("/api/v1/ingredients", json={
        "name": "양파", "category": "채소", "default_unit": "개",
        "aliases": ["둥근양파", "onion"], "kcal_per_100g": 40,
        "default_storage": "냉장", "memo": "봉지째 냉장 보관",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["aliases"] == ["둥근양파", "onion"]
    assert body["kcal_per_100g"] == 40
    assert body["default_storage"] == "냉장"
    assert body["memo"] == "봉지째 냉장 보관"


def test_defaults_when_omitted(client):
    c = _auth("im2@navercorp.com")
    body = c.post("/api/v1/ingredients", json={"name": "소금"}).json()
    assert body["aliases"] == []
    assert body["kcal_per_100g"] is None
    assert body["default_storage"] is None
    assert body["memo"] is None


def test_alias_search_matches(client):
    c = _auth("im3@navercorp.com")
    c.post("/api/v1/ingredients", json={"name": "대파", "aliases": ["쪽파", "green onion"]})
    c.post("/api/v1/ingredients", json={"name": "마늘"})
    # 별칭으로 검색
    names = [i["name"] for i in c.get("/api/v1/ingredients", params={"q": "쪽파"}).json()["data"]]
    assert names == ["대파"]
    # 영문 별칭도 매칭
    names = [i["name"] for i in c.get("/api/v1/ingredients", params={"q": "green"}).json()["data"]]
    assert names == ["대파"]
    # 이름 검색은 기존대로 동작
    names = [i["name"] for i in c.get("/api/v1/ingredients", params={"q": "마늘"}).json()["data"]]
    assert names == ["마늘"]


def test_update_extended_fields(client):
    c = _auth("im4@navercorp.com")
    iid = c.post("/api/v1/ingredients", json={"name": "우유"}).json()["id"]
    upd = c.put(f"/api/v1/ingredients/{iid}", json={
        "name": "우유", "aliases": ["milk"], "kcal_per_100g": 60, "default_storage": "냉장",
    })
    assert upd.status_code == 200
    assert upd.json()["aliases"] == ["milk"]
    assert upd.json()["default_storage"] == "냉장"


def test_invalid_default_storage_400(client):
    c = _auth("im5@navercorp.com")
    # 재고용 값(냉장실)은 마스터 default_storage 에서 허용되지 않음(냉장/냉동/실온만)
    r = c.post("/api/v1/ingredients", json={"name": "치즈", "default_storage": "냉장실"})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"
