"""식재료 개인 마스터 라우터 — US-008 (CRUD, 중복 409, 참조중 409).

전 회원 공용이 아니라 회원 개인별 목록이므로 목록 조회부터 로그인이 필요하다.
"""
import sqlite3
from typing import Optional

from fastapi import APIRouter, Depends, Query

from ..db import utcnow
from ..deps import get_db, require_user
from ..errors import AppError, forbidden, not_found
from ..ids import new_id
from ..pagination import decode_cursor, encode_cursor
from ..schemas import Ingredient, IngredientListResponse, IngredientWriteRequest

router = APIRouter(tags=["ingredients"])


def _out(row: sqlite3.Row) -> Ingredient:
    return Ingredient(
        id=row["id"], name=row["name"], category=row["category"],
        default_unit=row["default_unit"], owner_id=row["owner_id"],
        created_at=row["created_at"], updated_at=row["updated_at"],
    )


def _get_owned(db: sqlite3.Connection, ingredient_id: str, user_id: str) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM ingredients WHERE id = ? AND deleted_at IS NULL", (ingredient_id,)
    ).fetchone()
    if row is None:
        raise not_found()
    if row["owner_id"] != user_id:
        raise forbidden()
    return row


def _name_conflict(db: sqlite3.Connection, user_id: str, name: str, exclude_id: Optional[str] = None) -> bool:
    sql = "SELECT 1 FROM ingredients WHERE owner_id=? AND name=? AND deleted_at IS NULL"
    params: list = [user_id, name]
    if exclude_id:
        sql += " AND id <> ?"
        params.append(exclude_id)
    return db.execute(sql, params).fetchone() is not None


def _name_exists_error() -> AppError:
    return AppError(409, "INGREDIENT_NAME_EXISTS", "이미 등록된 식재료입니다.",
                    [{"field": "name", "reason": "duplicate"}])


@router.get("/ingredients", response_model=IngredientListResponse)
def list_ingredients(
    db: sqlite3.Connection = Depends(get_db),
    user: sqlite3.Row = Depends(require_user),
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
):
    where = ["owner_id = ?", "deleted_at IS NULL"]
    params: list = [user["id"]]
    if q:
        where.append("name LIKE ?")
        params.append(f"%{q}%")
    if category:
        where.append("category = ?")
        params.append(category)
    cursor_id = decode_cursor(cursor)
    if cursor_id:
        where.append("id < ?")
        params.append(cursor_id)
    params.append(limit + 1)
    rows = db.execute(
        f"SELECT * FROM ingredients WHERE {' AND '.join(where)} ORDER BY id DESC LIMIT ?", params
    ).fetchall()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor(rows[-1]["id"]) if has_more and rows else None
    return IngredientListResponse(data=[_out(r) for r in rows], next_cursor=next_cursor, has_more=has_more)


@router.post("/ingredients", status_code=201, response_model=Ingredient)
def create_ingredient(body: IngredientWriteRequest, db: sqlite3.Connection = Depends(get_db),
                      user: sqlite3.Row = Depends(require_user)):
    if _name_conflict(db, user["id"], body.name):
        raise _name_exists_error()
    now = utcnow()
    iid = new_id("ing")
    db.execute(
        "INSERT INTO ingredients(id, name, category, default_unit, owner_id, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (iid, body.name, body.category, body.default_unit, user["id"], now, now),
    )
    db.commit()
    return _out(db.execute("SELECT * FROM ingredients WHERE id=?", (iid,)).fetchone())


@router.get("/ingredients/{ingredientId}", response_model=Ingredient)
def get_ingredient(ingredientId: str, db: sqlite3.Connection = Depends(get_db),
                   user: sqlite3.Row = Depends(require_user)):
    return _out(_get_owned(db, ingredientId, user["id"]))


@router.put("/ingredients/{ingredientId}", response_model=Ingredient)
def update_ingredient(ingredientId: str, body: IngredientWriteRequest,
                      db: sqlite3.Connection = Depends(get_db), user: sqlite3.Row = Depends(require_user)):
    _get_owned(db, ingredientId, user["id"])
    if _name_conflict(db, user["id"], body.name, exclude_id=ingredientId):
        raise _name_exists_error()
    now = utcnow()
    db.execute(
        "UPDATE ingredients SET name=?, category=?, default_unit=?, updated_at=? WHERE id=?",
        (body.name, body.category, body.default_unit, now, ingredientId),
    )
    db.commit()
    return _out(db.execute("SELECT * FROM ingredients WHERE id=?", (ingredientId,)).fetchone())


@router.delete("/ingredients/{ingredientId}", status_code=204)
def delete_ingredient(ingredientId: str, db: sqlite3.Connection = Depends(get_db),
                      user: sqlite3.Row = Depends(require_user),
                      force: bool = Query(False)):
    _get_owned(db, ingredientId, user["id"])
    now = utcnow()
    recipe_refs = db.execute(
        "SELECT COUNT(DISTINCT recipe_id) AS c FROM recipe_ingredients "
        "WHERE ingredient_id=? AND deleted_at IS NULL", (ingredientId,),
    ).fetchone()["c"]
    inv_refs = db.execute(
        "SELECT COUNT(*) AS c FROM inventory_items WHERE ingredient_id=? AND deleted_at IS NULL",
        (ingredientId,),
    ).fetchone()["c"]

    if (recipe_refs or inv_refs) and not force:
        details = []
        if recipe_refs:
            details.append({"field": "recipes", "reason": f"referenced_by_{recipe_refs}"})
        if inv_refs:
            details.append({"field": "inventory", "reason": f"referenced_by_{inv_refs}"})
        raise AppError(
            409, "INGREDIENT_IN_USE",
            "레시피/재고에서 참조 중인 식재료입니다. 강제 삭제하려면 force=true 를 사용하세요.",
            details,
        )

    if force:
        db.execute(
            "UPDATE recipe_ingredients SET deleted_at=?, updated_at=? WHERE ingredient_id=? AND deleted_at IS NULL",
            (now, now, ingredientId),
        )
        db.execute(
            "UPDATE inventory_items SET deleted_at=?, updated_at=? WHERE ingredient_id=? AND deleted_at IS NULL",
            (now, now, ingredientId),
        )
    db.execute("UPDATE ingredients SET deleted_at=?, updated_at=? WHERE id=?", (now, now, ingredientId))
    db.commit()
    return None
