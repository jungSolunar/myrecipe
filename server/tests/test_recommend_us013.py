"""US-013 [Could] 보유 재료 기반 추천/필터 테스트.

GET /recipes 의 available_only(bool) / sort=missing_asc / missing_count 를 검증한다.
- 로그인 + 재고: available_only 필터, missing_asc 정렬, missing_count 값
- 비로그인: available_only/missing_asc no-op(기존 recent 동작 보존, missing_count=null)
- 기본 동작 불변(회귀): available_only=false & sort=recent 은 기존과 동일
"""
from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def _ing(c, name, unit="g"):
    return c.post("/api/v1/ingredients", json={"name": name, "default_unit": unit}).json()["id"]


def _recipe(c, title, ings, category="한식"):
    return c.post("/api/v1/recipes", json={
        "title": title, "category": category, "steps": ["조리"], "ingredients": ings,
    }).json()["id"]


def _by_title(data):
    return {i["title"]: i for i in data}


def _setup(c):
    """재료 3종 + 레시피 3종 + 부분 재고 구성.

    - 김치(500g 보유), 돼지고기(재고 없음), 두부(1모 보유)
    레시피:
      - 김치국(김치 300g)                 -> missing 0 (충분)
      - 김치찌개(김치 300g, 돼지고기 200g) -> missing 1 (돼지고기 없음)
      - 종합(김치 300g, 돼지고기 200g, 두부 2모) -> missing 2 (돼지고기 없음 + 두부 부족)
    """
    kimchi = _ing(c, "김치")
    pork = _ing(c, "돼지고기")
    tofu = _ing(c, "두부", unit="모")
    r_soup = _recipe(c, "김치국", [{"ingredient_id": kimchi, "quantity": 300, "unit": "g"}])
    r_stew = _recipe(c, "김치찌개", [
        {"ingredient_id": kimchi, "quantity": 300, "unit": "g"},
        {"ingredient_id": pork, "quantity": 200, "unit": "g"},
    ])
    r_full = _recipe(c, "종합", [
        {"ingredient_id": kimchi, "quantity": 300, "unit": "g"},
        {"ingredient_id": pork, "quantity": 200, "unit": "g"},
        {"ingredient_id": tofu, "quantity": 2, "unit": "모"},
    ])
    c.post("/api/v1/inventory", json={"ingredient_id": kimchi, "quantity": 500, "unit": "g"})
    c.post("/api/v1/inventory", json={"ingredient_id": tofu, "quantity": 1, "unit": "모"})
    return {"soup": r_soup, "stew": r_stew, "full": r_full}


def test_missing_count_values_for_logged_in(client):
    c = _auth("rec1@navercorp.com")
    ids = _setup(c)
    items = _by_title(c.get("/api/v1/recipes").json()["data"])
    assert items["김치국"]["missing_count"] == 0
    assert items["김치찌개"]["missing_count"] == 1
    assert items["종합"]["missing_count"] == 2
    # ids 활용(무시 방지) — 세 레시피가 모두 목록에 존재
    assert {i["id"] for i in items.values()} == set(ids.values())


def test_available_only_filters_for_logged_in(client):
    c = _auth("rec2@navercorp.com")
    _setup(c)
    data = c.get("/api/v1/recipes", params={"available_only": "true"}).json()["data"]
    titles = [i["title"] for i in data]
    assert titles == ["김치국"]  # missing_count==0 만
    assert data[0]["missing_count"] == 0


def test_sort_missing_asc_for_logged_in(client):
    c = _auth("rec3@navercorp.com")
    _setup(c)
    data = c.get("/api/v1/recipes", params={"sort": "missing_asc"}).json()["data"]
    titles = [i["title"] for i in data]
    assert titles == ["김치국", "김치찌개", "종합"]  # 0,1,2 오름차순
    assert [i["missing_count"] for i in data] == [0, 1, 2]


def test_sort_missing_asc_tie_breaks_by_recent(client):
    """동률(missing_count 동일) 시 최신순(id desc)으로 정렬되어야 한다."""
    c = _auth("rec4@navercorp.com")
    kimchi = _ing(c, "김치")
    c.post("/api/v1/inventory", json={"ingredient_id": kimchi, "quantity": 1000, "unit": "g"})
    # 셋 다 missing 0 (김치만 사용, 충분히 보유). 생성 역순(최신)으로 나와야 함.
    _recipe(c, "A", [{"ingredient_id": kimchi, "quantity": 10, "unit": "g"}])
    _recipe(c, "B", [{"ingredient_id": kimchi, "quantity": 10, "unit": "g"}])
    _recipe(c, "C", [{"ingredient_id": kimchi, "quantity": 10, "unit": "g"}])
    data = c.get("/api/v1/recipes", params={"sort": "missing_asc"}).json()["data"]
    titles = [i["title"] for i in data]
    assert titles == ["C", "B", "A"]  # 최신 생성이 앞


def test_guest_available_only_is_noop(client):
    """비로그인은 available_only/missing_asc 무시, 전체 recent 반환 + missing_count=null."""
    owner = _auth("rec5@navercorp.com")
    _setup(owner)
    guest = TestClient(app)  # 비로그인
    resp = guest.get("/api/v1/recipes", params={"available_only": "true", "sort": "missing_asc"})
    data = resp.json()["data"]
    titles = sorted(i["title"] for i in data)
    assert titles == ["김치국", "김치찌개", "종합"]  # 필터/정렬 무시, 전체 반환
    assert all(i["missing_count"] is None for i in data)  # 비로그인은 null


def test_default_behavior_unchanged_regression(client):
    """회귀: 기본(available_only=false & sort=recent)은 기존 최신순 그대로."""
    c = _auth("rec6@navercorp.com")
    ids = _setup(c)
    data = c.get("/api/v1/recipes").json()["data"]
    # 최신순(생성 역순): 종합, 김치찌개, 김치국
    assert [i["title"] for i in data] == ["종합", "김치찌개", "김치국"]
    assert [i["id"] for i in data] == [ids["full"], ids["stew"], ids["soup"]]


def test_recommend_mode_pagination(client):
    """추천 모드에서도 커서 페이지네이션이 동작하고 페이지 간 중복이 없다."""
    c = _auth("rec7@navercorp.com")
    kimchi = _ing(c, "김치")
    c.post("/api/v1/inventory", json={"ingredient_id": kimchi, "quantity": 10000, "unit": "g"})
    for i in range(5):
        _recipe(c, f"레시피{i}", [{"ingredient_id": kimchi, "quantity": 10, "unit": "g"}])
    p1 = c.get("/api/v1/recipes", params={"sort": "missing_asc", "limit": 2}).json()
    assert len(p1["data"]) == 2 and p1["has_more"] is True and p1["next_cursor"]
    p2 = c.get("/api/v1/recipes",
               params={"sort": "missing_asc", "limit": 2, "cursor": p1["next_cursor"]}).json()
    assert len(p2["data"]) == 2
    assert set(i["id"] for i in p1["data"]).isdisjoint(i["id"] for i in p2["data"])


def test_available_only_empty_when_no_inventory(client):
    """재고가 전혀 없는 로그인 사용자는 available_only 시 빈 결과(모든 재료 missing)."""
    c = _auth("rec8@navercorp.com")
    kimchi = _ing(c, "김치")
    _recipe(c, "김치국", [{"ingredient_id": kimchi, "quantity": 300, "unit": "g"}])
    data = c.get("/api/v1/recipes", params={"available_only": "true"}).json()["data"]
    assert data == []
