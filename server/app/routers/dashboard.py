"""홈 대시보드 라우터 — US-018 [v2.3.0]. KPI 4종 + 패널 3종 집계(로그인 필수).

매칭률 100% 판정은 v1 US-012 부족판정 규칙을 그대로 재사용한다(recipes._missing_count):
동일 단위 비교, 유통기한·보관위치 미반영(Q3-a). 대시보드·상세 진행바·위저드 추천이 단일 규칙 공유.
임박(D-3)은 오늘 기준 유통기한 D-day ≤ 3(오늘=D-0 포함, 문자열 날짜 비교)인 활성 재고를 센다.
"""
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_db, require_user
from ..schemas import CategoryDistributionItem, InventoryItem
from .inventory import _out as _inv_out
from .recipes import RecipeListItemV2, _list_item, _missing_count, _recipe_rating

router = APIRouter(tags=["dashboard"])

RECENT_LIMIT = 5  # 패널③ 최근 추가 레시피 노출 개수


# DashboardSummary 를 RecipeListItemV2(missing_count 포함)로 채우기 위한 라우터 로컬 모델.
# 계약의 DashboardSummary 와 1:1(makeable_recipes/recent_recipes 는 RecipeListItem 상위집합).
class DashboardSummaryV2(BaseModel):
    registered_recipe_count: int
    makeable_recipe_count: int
    inventory_ingredient_count: int
    expiring_soon_count: int
    category_distribution: List[CategoryDistributionItem] = []
    makeable_recipes: List[RecipeListItemV2] = []
    expiring_ingredients: List[InventoryItem] = []
    recent_recipes: List[RecipeListItemV2] = []


@router.get("/dashboard", response_model=DashboardSummaryV2)
def get_dashboard(db: sqlite3.Connection = Depends(get_db), user: sqlite3.Row = Depends(require_user)):
    uid = user["id"]

    # 내 레시피(활성) 전체 — id desc(최신순). ingredient_count 동봉.
    recipe_rows = db.execute(
        "SELECT r.*, (SELECT COUNT(*) FROM recipe_ingredients ri "
        "WHERE ri.recipe_id = r.id AND ri.deleted_at IS NULL) AS ingredient_count "
        "FROM recipes r WHERE r.owner_id = ? AND r.deleted_at IS NULL ORDER BY r.id DESC",
        (uid,),
    ).fetchall()

    registered_recipe_count = len(recipe_rows)

    # KPI② 매칭률 100%(부족 재료 0) 레시피 — v1 US-012 규칙 승계.
    makeable_rows = [r for r in recipe_rows if _missing_count(db, uid, r["id"]) == 0]
    makeable_recipes = [_list_item(db, r, 0, rating=_recipe_rating(db, r["id"])) for r in makeable_rows]

    # 패널③ 최근 추가 레시피(최신순 상위 N).
    recent_recipes = [
        _list_item(db, r, _missing_count(db, uid, r["id"]), rating=_recipe_rating(db, r["id"]))
        for r in recipe_rows[:RECENT_LIMIT]
    ]

    # KPI① 부가 — 카테고리 분포(미분류는 None).
    dist: dict = {}
    for r in recipe_rows:
        dist[r["category"]] = dist.get(r["category"], 0) + 1
    category_distribution = [CategoryDistributionItem(category=c, count=n) for c, n in dist.items()]

    # KPI③ 내 재고 종수(활성).
    inventory_ingredient_count = db.execute(
        "SELECT COUNT(*) AS c FROM inventory_items WHERE owner_id = ? AND deleted_at IS NULL",
        (uid,),
    ).fetchone()["c"]

    # KPI④/패널② 임박(D-3): 유통기한 D-day ≤ 3(오늘 포함). 문자열 날짜 비교(YYYY-MM-DD).
    threshold = (datetime.now(timezone.utc).date() + timedelta(days=3)).isoformat()
    expiring_rows = db.execute(
        "SELECT iv.*, i.name AS ing_name FROM inventory_items iv "
        "LEFT JOIN ingredients i ON i.id = iv.ingredient_id AND i.deleted_at IS NULL "
        "WHERE iv.owner_id = ? AND iv.deleted_at IS NULL "
        "AND iv.expires_at IS NOT NULL AND iv.expires_at <= ? "
        "ORDER BY iv.expires_at ASC, iv.id DESC",
        (uid, threshold),
    ).fetchall()
    expiring_ingredients = [_inv_out(r) for r in expiring_rows]

    return DashboardSummaryV2(
        registered_recipe_count=registered_recipe_count,
        makeable_recipe_count=len(makeable_recipes),
        inventory_ingredient_count=inventory_ingredient_count,
        expiring_soon_count=len(expiring_ingredients),
        category_distribution=category_distribution,
        makeable_recipes=makeable_recipes,
        expiring_ingredients=expiring_ingredients,
        recent_recipes=recent_recipes,
    )
