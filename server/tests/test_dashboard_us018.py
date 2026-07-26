"""US-018 홈 대시보드(GET /dashboard) 테스트.

- 로그인 필수
- KPI 4종: 등록 레시피 수 / 매칭률 100% 레시피 수 / 재고 종수 / 임박(D-3) 수
- 패널 3종: 만들 수 있는 레시피 / 임박 재고 / 최근 레시피
- 매칭 판정은 v1 US-012 규칙(동일 단위, 유통기한·보관위치 미반영) 재사용
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app


def _auth(email):
    c = TestClient(app)
    c.post("/api/v1/auth/signup", json={"email": email, "password": "s3curePass!"})
    return c


def _ing(c, name, unit="g"):
    return c.post("/api/v1/ingredients", json={"name": name, "default_unit": unit}).json()["id"]


def _recipe(c, title, ings, category="한식", cook_time=None):
    body = {"title": title, "category": category, "steps": ["조리"], "ingredients": ings}
    if cook_time is not None:
        body["cook_time_minutes"] = cook_time
    return c.post("/api/v1/recipes", json=body).json()["id"]


def _date(offset_days):
    return (datetime.now(timezone.utc).date() + timedelta(days=offset_days)).isoformat()


def test_dashboard_requires_auth(client):
    guest = TestClient(app)
    r = guest.get("/api/v1/dashboard")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_REQUIRED"


def test_dashboard_summary(client):
    c = _auth("db1@navercorp.com")
    kimchi = _ing(c, "김치")
    pork = _ing(c, "돼지고기")
    milk = _ing(c, "우유", unit="ml")

    # 레시피 A(김치 300g): 재고 김치 500g → 매칭 100%
    ra = _recipe(c, "김치국", [{"ingredient_id": kimchi, "quantity": 300, "unit": "g"}], cook_time=10)
    # 레시피 B(김치 300 + 돼지고기 200): 돼지고기 재고 없음 → 매칭 미달
    _recipe(c, "김치찌개", [
        {"ingredient_id": kimchi, "quantity": 300, "unit": "g"},
        {"ingredient_id": pork, "quantity": 200, "unit": "g"},
    ])

    # 재고: 김치 500g(임박 D+2), 우유(임박 아님 D+10)
    c.post("/api/v1/inventory", json={"ingredient_id": kimchi, "quantity": 500, "unit": "g",
                                      "expires_at": _date(2)})
    c.post("/api/v1/inventory", json={"ingredient_id": milk, "quantity": 1000, "unit": "ml",
                                      "expires_at": _date(10)})

    d = c.get("/api/v1/dashboard").json()

    # KPI
    assert d["registered_recipe_count"] == 2
    assert d["makeable_recipe_count"] == 1
    assert d["inventory_ingredient_count"] == 2
    assert d["expiring_soon_count"] == 1

    # 패널① 만들 수 있는 레시피 = 김치국(A)
    assert [r["id"] for r in d["makeable_recipes"]] == [ra]
    assert d["makeable_recipes"][0]["cook_time_minutes"] == 10
    assert d["makeable_recipes"][0]["missing_count"] == 0

    # 패널② 임박 재고 = 김치(D+2)만
    assert [iv["ingredient_name"] for iv in d["expiring_ingredients"]] == ["김치"]

    # 패널③ 최근 레시피(최신순): 김치찌개, 김치국
    assert [r["title"] for r in d["recent_recipes"]] == ["김치찌개", "김치국"]

    # KPI① 부가: 카테고리 분포
    assert d["category_distribution"] == [{"category": "한식", "count": 2}]


def test_dashboard_empty(client):
    c = _auth("db2@navercorp.com")
    d = c.get("/api/v1/dashboard").json()
    assert d["registered_recipe_count"] == 0
    assert d["makeable_recipe_count"] == 0
    assert d["inventory_ingredient_count"] == 0
    assert d["expiring_soon_count"] == 0
    assert d["makeable_recipes"] == []
    assert d["expiring_ingredients"] == []
    assert d["recent_recipes"] == []


def test_dashboard_scoped_to_owner(client):
    c = _auth("db3@navercorp.com")
    _recipe(c, "내레시피", [])
    other = _auth("db3b@navercorp.com")
    _recipe(other, "남레시피", [])
    d = c.get("/api/v1/dashboard").json()
    # 내 레시피만 집계
    assert d["registered_recipe_count"] == 1
    assert [r["title"] for r in d["recent_recipes"]] == ["내레시피"]
