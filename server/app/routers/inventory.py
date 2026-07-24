"""재고 라우터 — US-011 [Should, 확장].

1차 출시 필수 범위는 아니나, 계약(openapi) 엔드포인트를 1:1로 채우고
US-012 부족 재료 대조의 데이터 소스가 되도록 CRUD 를 구현한다.
"""
import sqlite3
from typing import Optional

from fastapi import APIRouter, Depends, Query

from ..db import utcnow
from ..deps import get_db, require_user
from ..errors import forbidden, not_found, validation_error
from ..ids import new_id
from ..pagination import decode_cursor, encode_cursor
from ..schemas import InventoryItem, InventoryListResponse, InventoryWriteRequest

router = APIRouter(tags=["inventory"])


def _out(row: sqlite3.Row) -> InventoryItem:
    return InventoryItem(
        id=row["id"], ingredient_id=row["ingredient_id"], ingredient_name=row["ing_name"],
        quantity=row["quantity"], unit=row["unit"], expires_at=row["expires_at"],
        owner_id=row["owner_id"], created_at=row["created_at"], updated_at=row["updated_at"],
    )


def _fetch(db: sqlite3.Connection, inv_id: str) -> sqlite3.Row:
    return db.execute(
        "SELECT iv.*, i.name AS ing_name FROM inventory_items iv "
        "LEFT JOIN ingredients i ON i.id = iv.ingredient_id AND i.deleted_at IS NULL "
        "WHERE iv.id = ? AND iv.deleted_at IS NULL", (inv_id,),
    ).fetchone()


def _require_owned_ingredient(db: sqlite3.Connection, ingredient_id: str, user_id: str) -> None:
    ok = db.execute(
        "SELECT 1 FROM ingredients WHERE id=? AND owner_id=? AND deleted_at IS NULL",
        (ingredient_id, user_id),
    ).fetchone()
    if not ok:
        raise validation_error([{"field": "ingredient_id", "reason": "not_found"}])


@router.get("/inventory", response_model=InventoryListResponse)
def list_inventory(db: sqlite3.Connection = Depends(get_db), user: sqlite3.Row = Depends(require_user),
                   cursor: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100)):
    where = ["iv.owner_id = ?", "iv.deleted_at IS NULL"]
    params: list = [user["id"]]
    cursor_id = decode_cursor(cursor)
    if cursor_id:
        where.append("iv.id < ?")
        params.append(cursor_id)
    params.append(limit + 1)
    rows = db.execute(
        "SELECT iv.*, i.name AS ing_name FROM inventory_items iv "
        "LEFT JOIN ingredients i ON i.id = iv.ingredient_id AND i.deleted_at IS NULL "
        f"WHERE {' AND '.join(where)} ORDER BY iv.id DESC LIMIT ?", params,
    ).fetchall()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor(rows[-1]["id"]) if has_more and rows else None
    return InventoryListResponse(data=[_out(r) for r in rows], next_cursor=next_cursor, has_more=has_more)


@router.post("/inventory", status_code=201, response_model=InventoryItem)
def create_inventory(body: InventoryWriteRequest, db: sqlite3.Connection = Depends(get_db),
                     user: sqlite3.Row = Depends(require_user)):
    _require_owned_ingredient(db, body.ingredient_id, user["id"])
    now = utcnow()
    iid = new_id("inv")
    db.execute(
        "INSERT INTO inventory_items(id, ingredient_id, owner_id, quantity, unit, expires_at, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (iid, body.ingredient_id, user["id"], body.quantity, body.unit, body.expires_at, now, now),
    )
    db.commit()
    return _out(_fetch(db, iid))


@router.put("/inventory/{inventoryId}", response_model=InventoryItem)
def update_inventory(inventoryId: str, body: InventoryWriteRequest,
                     db: sqlite3.Connection = Depends(get_db), user: sqlite3.Row = Depends(require_user)):
    row = _fetch(db, inventoryId)
    if row is None:
        raise not_found()
    if row["owner_id"] != user["id"]:
        raise forbidden()
    _require_owned_ingredient(db, body.ingredient_id, user["id"])
    now = utcnow()
    db.execute(
        "UPDATE inventory_items SET ingredient_id=?, quantity=?, unit=?, expires_at=?, updated_at=? WHERE id=?",
        (body.ingredient_id, body.quantity, body.unit, body.expires_at, now, inventoryId),
    )
    db.commit()
    return _out(_fetch(db, inventoryId))


@router.delete("/inventory/{inventoryId}", status_code=204)
def delete_inventory(inventoryId: str, db: sqlite3.Connection = Depends(get_db),
                     user: sqlite3.Row = Depends(require_user)):
    row = _fetch(db, inventoryId)
    if row is None:
        raise not_found()
    if row["owner_id"] != user["id"]:
        raise forbidden()
    now = utcnow()
    db.execute("UPDATE inventory_items SET deleted_at=?, updated_at=? WHERE id=?", (now, now, inventoryId))
    db.commit()
    return None
