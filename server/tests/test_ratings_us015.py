"""US-015 레시피 별점(회원별 평점 집계) 테스트.

- PUT upsert(1인 1평점), DELETE 취소(soft delete)
- 평균/평가수 집계, 평가 0건이면 average=null
- 비로그인 응답에도 rating 집계 포함(공개), 입력만 로그인 필수
- sort=rating_desc (평가 없는 항목은 뒤로)
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def _recipe(c, title="레시피"):
    return c.post("/api/v1/recipes", json={
        "title": title, "steps": ["조리"], "ingredients": [],
    }).json()["id"]


def test_put_rating_requires_auth(client):
    owner = _auth("rt0@navercorp.com")
    rid = _recipe(owner)
    guest = TestClient(app)
    r = guest.put(f"/api/v1/recipes/{rid}/rating", json={"score": 5})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_put_rating_creates_and_aggregates(client):
    owner = _auth("rt1@navercorp.com")
    rid = _recipe(owner)
    r = owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 4})
    assert r.status_code == 200
    body = r.json()
    assert body["recipe_id"] == rid
    assert body["my_score"] == 4
    assert body["rating"]["average"] == 4.0
    assert body["rating"]["count"] == 1


def test_put_rating_upsert_keeps_single(client):
    owner = _auth("rt2@navercorp.com")
    rid = _recipe(owner)
    owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 3})
    r = owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 5})
    # 재평가: 갱신되고 평가 수는 여전히 1
    assert r.json()["rating"]["count"] == 1
    assert r.json()["rating"]["average"] == 5.0
    assert r.json()["my_score"] == 5


def test_multi_user_average(client):
    owner = _auth("rt3@navercorp.com")
    rid = _recipe(owner)
    owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 4})
    other = _auth("rt3b@navercorp.com")
    r = other.put(f"/api/v1/recipes/{rid}/rating", json={"score": 5})
    assert r.json()["rating"]["count"] == 2
    assert r.json()["rating"]["average"] == 4.5


def test_delete_rating_recalculates(client):
    owner = _auth("rt4@navercorp.com")
    rid = _recipe(owner)
    owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 4})
    other = _auth("rt4b@navercorp.com")
    other.put(f"/api/v1/recipes/{rid}/rating", json={"score": 2})
    r = other.delete(f"/api/v1/recipes/{rid}/rating")
    assert r.status_code == 200
    assert r.json()["my_score"] is None
    assert r.json()["rating"]["count"] == 1
    assert r.json()["rating"]["average"] == 4.0


def test_delete_rating_last_one_null_average(client):
    owner = _auth("rt5@navercorp.com")
    rid = _recipe(owner)
    owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 5})
    r = owner.delete(f"/api/v1/recipes/{rid}/rating")
    assert r.json()["rating"]["average"] is None
    assert r.json()["rating"]["count"] == 0


def test_delete_without_rating_404(client):
    owner = _auth("rt6@navercorp.com")
    rid = _recipe(owner)
    r = owner.delete(f"/api/v1/recipes/{rid}/rating")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_score_out_of_range_400(client):
    owner = _auth("rt7@navercorp.com")
    rid = _recipe(owner)
    assert owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 6}).status_code == 400
    assert owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 0}).status_code == 400


def test_put_rating_recipe_not_found_404(client):
    owner = _auth("rt8@navercorp.com")
    r = owner.put("/api/v1/recipes/rcp_nope/rating", json={"score": 3})
    assert r.status_code == 404


def test_rating_visible_to_guest(client):
    owner = _auth("rt9@navercorp.com")
    rid = _recipe(owner)
    owner.put(f"/api/v1/recipes/{rid}/rating", json={"score": 4})
    guest = TestClient(app)
    detail = guest.get(f"/api/v1/recipes/{rid}").json()
    assert detail["rating"]["average"] == 4.0
    assert detail["rating"]["count"] == 1
    listed = {i["id"]: i for i in guest.get("/api/v1/recipes").json()["data"]}
    assert listed[rid]["rating"]["count"] == 1


def test_unrated_recipe_rating_null(client):
    owner = _auth("rt10@navercorp.com")
    rid = _recipe(owner)
    detail = owner.get(f"/api/v1/recipes/{rid}").json()
    assert detail["rating"]["average"] is None
    assert detail["rating"]["count"] == 0


def test_sort_rating_desc_unrated_last(client):
    c = _auth("rt11@navercorp.com")
    high = _recipe(c, "고평점")
    low = _recipe(c, "저평점")
    _recipe(c, "무평점")
    c.put(f"/api/v1/recipes/{high}/rating", json={"score": 5})
    c.put(f"/api/v1/recipes/{low}/rating", json={"score": 2})
    data = c.get("/api/v1/recipes", params={"sort": "rating_desc"}).json()["data"]
    titles = [i["title"] for i in data]
    assert titles == ["고평점", "저평점", "무평점"]  # 평가 없는 항목은 뒤로
