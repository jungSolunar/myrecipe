"""레시피 라우터 — US-004~007(CRUD), US-005(목록/상세), US-010(검색/필터), US-009(재료 연결).

상세 조회 시 로그인+재고가 있으면 US-012 부족 재료 대조를 함께 반환한다.
"""
import json
import sqlite3
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..db import utcnow
from ..deps import get_current_user, get_db, require_user
from ..errors import forbidden, not_found, validation_error
from ..ids import new_id
from ..pagination import decode_cursor, encode_cursor
from ..schemas import (
    IngredientAvailability,
    MissingIngredient,
    RecipeDetail,
    RecipeIngredient,
    RecipeListItem,
    RecipeListResponse,
    RecipeWriteRequest,
)

router = APIRouter(tags=["recipes"])


# --------------------------------------------------------------------------
# US-013: 목록 응답에 optional `missing_count` 를 부가한 확장 모델.
# 기존 RecipeListItem/RecipeListResponse(schemas.py)를 건드리지 않고 하위호환 상위집합으로
# 확장한다(nullable 필드 1개 추가). openapi.yaml RecipeListItem 계약과 1:1.
# --------------------------------------------------------------------------
class RecipeListItemV2(RecipeListItem):
    missing_count: Optional[int] = None


class RecipeListResponseV2(BaseModel):
    data: List[RecipeListItemV2]
    next_cursor: Optional[str] = None
    has_more: bool


# --------------------------------------------------------------------------
# 직렬화 헬퍼
# --------------------------------------------------------------------------
def _load_recipe_ingredients(db: sqlite3.Connection, recipe_id: str) -> List[sqlite3.Row]:
    return db.execute(
        "SELECT ri.*, i.name AS ing_name FROM recipe_ingredients ri "
        "LEFT JOIN ingredients i ON i.id = ri.ingredient_id AND i.deleted_at IS NULL "
        "WHERE ri.recipe_id = ? AND ri.deleted_at IS NULL "
        "ORDER BY ri.position ASC, ri.id ASC",
        (recipe_id,),
    ).fetchall()


def _compute_availability(db: sqlite3.Connection, user_id: str, ri_rows: List[sqlite3.Row]):
    """US-012: 로그인+재고 존재 시 부족 재료 대조. 없으면 (None, {}) 반환.

    단위 환산 미지원(PRD Open Question) — 동일 단위 기준으로만 판정.
    반환: (IngredientAvailability | None, {recipe_ingredient_id: status})
    """
    has_inventory = db.execute(
        "SELECT 1 FROM inventory_items WHERE owner_id = ? AND deleted_at IS NULL LIMIT 1",
        (user_id,),
    ).fetchone()
    if not has_inventory:
        return None, {}

    statuses: dict = {}
    missing: List[MissingIngredient] = []
    for ri in ri_rows:
        inv_rows = db.execute(
            "SELECT quantity, unit FROM inventory_items "
            "WHERE owner_id = ? AND ingredient_id = ? AND deleted_at IS NULL",
            (user_id, ri["ingredient_id"]),
        ).fetchall()
        if not inv_rows:
            status = "missing"
        else:
            available_same_unit = sum(r["quantity"] for r in inv_rows if r["unit"] == ri["unit"])
            status = "sufficient" if available_same_unit >= ri["quantity"] else "insufficient"
        statuses[ri["id"]] = status
        if status in ("missing", "insufficient"):
            missing.append(MissingIngredient(
                ingredient_id=ri["ingredient_id"],
                name=ri["ing_name"] or "",
                required_quantity=ri["quantity"],
                unit=ri["unit"],
            ))
    availability = IngredientAvailability(
        status="sufficient" if not missing else "insufficient",
        missing_count=len(missing),
        missing_ingredients=missing,
    )
    return availability, statuses


def _missing_count(db: sqlite3.Connection, user_id: str, recipe_id: str) -> int:
    """US-013: 레시피 재료 중 '내 재고에 없거나(=missing) 동일 단위 수량이 부족한(=insufficient)'
    재료 수를 센다. US-012와 동일한 동일-단위 기준(단위 환산 없음)으로 판정한다.
    """
    ri_rows = db.execute(
        "SELECT ingredient_id, quantity, unit FROM recipe_ingredients "
        "WHERE recipe_id = ? AND deleted_at IS NULL",
        (recipe_id,),
    ).fetchall()
    count = 0
    for ri in ri_rows:
        inv_rows = db.execute(
            "SELECT quantity, unit FROM inventory_items "
            "WHERE owner_id = ? AND ingredient_id = ? AND deleted_at IS NULL",
            (user_id, ri["ingredient_id"]),
        ).fetchall()
        if not inv_rows:
            count += 1  # missing
        else:
            available_same_unit = sum(r["quantity"] for r in inv_rows if r["unit"] == ri["unit"])
            if available_same_unit < ri["quantity"]:
                count += 1  # insufficient
    return count


def _recipe_detail(db: sqlite3.Connection, row: sqlite3.Row, current_user: Optional[sqlite3.Row]) -> RecipeDetail:
    ri_rows = _load_recipe_ingredients(db, row["id"])
    availability = None
    statuses: dict = {}
    if current_user is not None:
        availability, statuses = _compute_availability(db, current_user["id"], ri_rows)
    ingredients = [
        RecipeIngredient(
            ingredient_id=ri["ingredient_id"],
            name=ri["ing_name"],
            quantity=ri["quantity"],
            unit=ri["unit"],
            status=statuses.get(ri["id"]),
        )
        for ri in ri_rows
    ]
    return RecipeDetail(
        id=row["id"],
        title=row["title"],
        category=row["category"],
        description=row["description"],
        photo_url=row["photo_url"],
        steps=json.loads(row["steps_json"]),
        ingredients=ingredients,
        ingredient_availability=availability,
        owner_id=row["owner_id"],
        is_owner=bool(current_user and current_user["id"] == row["owner_id"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _get_active_recipe(db: sqlite3.Connection, recipe_id: str) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL", (recipe_id,)
    ).fetchone()
    if row is None:
        raise not_found()
    return row


def _validate_and_write_ingredients(db: sqlite3.Connection, recipe_id: str,
                                    user_id: str, body: RecipeWriteRequest) -> None:
    """재료 연결 검증(소유한 활성 마스터인지) 후 recipe_ingredients 를 전체 교체한다."""
    details = []
    for idx, ing in enumerate(body.ingredients):
        exists = db.execute(
            "SELECT 1 FROM ingredients WHERE id = ? AND owner_id = ? AND deleted_at IS NULL",
            (ing.ingredient_id, user_id),
        ).fetchone()
        if not exists:
            details.append({"field": f"ingredients[{idx}].ingredient_id", "reason": "not_found"})
    if details:
        raise validation_error(details)

    now = utcnow()
    # 기존 활성 연결 소프트 삭제
    db.execute(
        "UPDATE recipe_ingredients SET deleted_at = ?, updated_at = ? "
        "WHERE recipe_id = ? AND deleted_at IS NULL",
        (now, now, recipe_id),
    )
    for pos, ing in enumerate(body.ingredients):
        db.execute(
            "INSERT INTO recipe_ingredients(id, recipe_id, ingredient_id, quantity, unit, position, created_at, updated_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (new_id("rin"), recipe_id, ing.ingredient_id, ing.quantity, ing.unit, pos, now, now),
        )


# --------------------------------------------------------------------------
# 엔드포인트
# --------------------------------------------------------------------------
def _list_item(r: sqlite3.Row, missing_count: Optional[int]) -> RecipeListItemV2:
    return RecipeListItemV2(
        id=r["id"], title=r["title"], category=r["category"], photo_url=r["photo_url"],
        ingredient_count=r["ingredient_count"], owner_id=r["owner_id"],
        created_at=r["created_at"], updated_at=r["updated_at"],
        missing_count=missing_count,
    )


@router.get("/recipes", response_model=RecipeListResponseV2)
def list_recipes(
    db: sqlite3.Connection = Depends(get_db),
    current_user: Optional[sqlite3.Row] = Depends(get_current_user),
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    ingredient_id: Optional[List[str]] = Query(None),
    available_only: bool = Query(False),
    sort: str = Query("recent"),
):
    """US-005 목록 / US-010 검색·필터 / US-013 추천. 비로그인 열람 가능(US-003).

    US-013 추천(로그인 사용자 한정):
      - `missing_count`: 각 레시피의 부족 재료 수(US-012와 동일한 동일-단위 기준). 로그인 시 부가.
        비로그인은 null.
      - `available_only=true`: missing_count==0 인 레시피만. **로그인 사용자 한정**,
        비로그인 시 UI가 토글을 비활성화하므로 서버는 no-op(전체 반환).
      - `sort=missing_asc`: missing_count 오름차순, 동률은 최신순(id desc). 로그인 사용자 한정.

    기본 동작 보존: available_only=false & sort=recent(기본) 이거나 비로그인일 때는
    기존 커서 기반(id 내림차순) 쿼리/페이지네이션을 그대로 사용한다.
    추천 모드(로그인 + available_only 또는 missing_asc)에서는 커서-id 규칙과 재정렬이
    충돌하므로, 필터 매칭 전체를 계산·정렬한 뒤 커서 id 를 목록 내 위치 마커로 사용해
    페이지네이션한다(계약의 커서 포맷 유지, 소규모 기준 Q6-a).
    """
    where = ["r.deleted_at IS NULL"]
    params: list = []
    if q:
        where.append("r.title LIKE ?")
        params.append(f"%{q}%")
    if category:
        where.append("r.category = ?")
        params.append(category)
    # 재료 AND 필터: 지정한 모든 ingredient_id 를 포함하는 레시피만
    if ingredient_id:
        ids = [i for i in ingredient_id if i]
        if ids:
            placeholders = ",".join("?" for _ in ids)
            where.append(
                "r.id IN (SELECT recipe_id FROM recipe_ingredients "
                f"WHERE deleted_at IS NULL AND ingredient_id IN ({placeholders}) "
                "GROUP BY recipe_id HAVING COUNT(DISTINCT ingredient_id) = ?)"
            )
            params.extend(ids)
            params.append(len(ids))

    select_prefix = (
        "SELECT r.*, (SELECT COUNT(*) FROM recipe_ingredients ri "
        "WHERE ri.recipe_id = r.id AND ri.deleted_at IS NULL) AS ingredient_count "
        f"FROM recipes r WHERE {' AND '.join(where)} "
    )

    # 추천 모드는 로그인 사용자에게만 의미가 있다. 비로그인은 no-op(기본 경로).
    recommend = current_user is not None and (available_only or sort == "missing_asc")

    if not recommend:
        # ---- 기본 경로(기존 동작 완전 보존): id 내림차순 + 커서 id<? ----
        cursor_id = decode_cursor(cursor)
        params2 = list(params)
        sql = select_prefix
        if cursor_id:
            sql += "AND r.id < ? "
            params2.append(cursor_id)
        sql += "ORDER BY r.id DESC LIMIT ?"
        params2.append(limit + 1)
        rows = db.execute(sql, params2).fetchall()

        has_more = len(rows) > limit
        rows = rows[:limit]
        uid = current_user["id"] if current_user is not None else None
        data = [
            _list_item(r, _missing_count(db, uid, r["id"]) if uid else None)
            for r in rows
        ]
        next_cursor = encode_cursor(rows[-1]["id"]) if has_more and rows else None
        return RecipeListResponseV2(data=data, next_cursor=next_cursor, has_more=has_more)

    # ---- 추천 모드(로그인 + available_only/missing_asc): 전체 계산 후 정렬·페이지네이션 ----
    uid = current_user["id"]
    all_rows = db.execute(select_prefix + "ORDER BY r.id DESC", params).fetchall()
    enriched = [(r, _missing_count(db, uid, r["id"])) for r in all_rows]  # 이미 id desc

    if available_only:
        enriched = [e for e in enriched if e[1] == 0]
    if sort == "missing_asc":
        # 안정 정렬: missing_count 오름차순, 동률은 기존 id desc 순서 유지.
        enriched.sort(key=lambda e: e[1])

    start = 0
    cursor_id = decode_cursor(cursor)
    if cursor_id:
        for idx, (r, _) in enumerate(enriched):
            if r["id"] == cursor_id:
                start = idx + 1
                break
    window = enriched[start:start + limit + 1]
    has_more = len(window) > limit
    window = window[:limit]
    data = [_list_item(r, mc) for r, mc in window]
    next_cursor = encode_cursor(window[-1][0]["id"]) if has_more and window else None
    return RecipeListResponseV2(data=data, next_cursor=next_cursor, has_more=has_more)


@router.post("/recipes", status_code=201, response_model=RecipeDetail)
def create_recipe(body: RecipeWriteRequest, db: sqlite3.Connection = Depends(get_db),
                  user: sqlite3.Row = Depends(require_user)):
    now = utcnow()
    rid = new_id("rcp")
    db.execute(
        "INSERT INTO recipes(id, title, category, description, photo_url, steps_json, owner_id, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (rid, body.title, body.category, body.description, body.photo_url,
         json.dumps(body.steps, ensure_ascii=False), user["id"], now, now),
    )
    _validate_and_write_ingredients(db, rid, user["id"], body)
    db.commit()
    row = _get_active_recipe(db, rid)
    return _recipe_detail(db, row, user)


@router.get("/recipes/{recipeId}", response_model=RecipeDetail)
def get_recipe(recipeId: str, db: sqlite3.Connection = Depends(get_db),
               current_user: Optional[sqlite3.Row] = Depends(get_current_user)):
    row = _get_active_recipe(db, recipeId)
    return _recipe_detail(db, row, current_user)


@router.put("/recipes/{recipeId}", response_model=RecipeDetail)
def update_recipe(recipeId: str, body: RecipeWriteRequest, db: sqlite3.Connection = Depends(get_db),
                  user: sqlite3.Row = Depends(require_user)):
    row = _get_active_recipe(db, recipeId)
    if row["owner_id"] != user["id"]:
        raise forbidden()
    now = utcnow()
    db.execute(
        "UPDATE recipes SET title=?, category=?, description=?, photo_url=?, steps_json=?, updated_at=? "
        "WHERE id=?",
        (body.title, body.category, body.description, body.photo_url,
         json.dumps(body.steps, ensure_ascii=False), now, recipeId),
    )
    _validate_and_write_ingredients(db, recipeId, user["id"], body)
    db.commit()
    return _recipe_detail(db, _get_active_recipe(db, recipeId), user)


@router.delete("/recipes/{recipeId}", status_code=204)
def delete_recipe(recipeId: str, db: sqlite3.Connection = Depends(get_db),
                  user: sqlite3.Row = Depends(require_user)):
    row = _get_active_recipe(db, recipeId)
    if row["owner_id"] != user["id"]:
        raise forbidden()
    now = utcnow()
    db.execute("UPDATE recipes SET deleted_at=?, updated_at=? WHERE id=?", (now, now, recipeId))
    db.execute(
        "UPDATE recipe_ingredients SET deleted_at=?, updated_at=? WHERE recipe_id=? AND deleted_at IS NULL",
        (now, now, recipeId),
    )
    db.commit()
    return None
