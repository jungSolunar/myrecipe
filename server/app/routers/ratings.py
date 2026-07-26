"""레시피 별점 라우터 — US-015 [v2.3.0] 회원별 평점 집계.

여러 회원의 평점(1~5)을 모아 평균·평가수를 집계한다(소유자 단일값이 아님).
1인 1평점: PUT 는 upsert(재평가 시 갱신, 평가 수 불변), DELETE 는 내 평점 취소(soft delete).
입력은 로그인 필수(읽기 집계는 레시피 응답에 공개로 포함됨).
"""
import sqlite3

from fastapi import APIRouter, Depends

from ..db import utcnow
from ..deps import get_db, require_user
from ..errors import AppError, not_found
from ..ids import new_id
from ..schemas import RatingResponse, RatingWriteRequest
from .recipes import _recipe_rating

router = APIRouter(tags=["ratings"])


def _active_recipe(db: sqlite3.Connection, recipe_id: str) -> sqlite3.Row:
    row = db.execute(
        "SELECT id FROM recipes WHERE id = ? AND deleted_at IS NULL", (recipe_id,)
    ).fetchone()
    if row is None:
        raise not_found()
    return row


def _my_active_rating(db: sqlite3.Connection, recipe_id: str, user_id: str):
    return db.execute(
        "SELECT * FROM recipe_ratings "
        "WHERE recipe_id = ? AND user_id = ? AND deleted_at IS NULL",
        (recipe_id, user_id),
    ).fetchone()


@router.put("/recipes/{recipeId}/rating", response_model=RatingResponse)
def put_rating(recipeId: str, body: RatingWriteRequest,
               db: sqlite3.Connection = Depends(get_db), user: sqlite3.Row = Depends(require_user)):
    """[US-015] 내 별점 등록/수정(1인 1평점 upsert). 이미 평점이 있으면 갱신(평가 수 불변)."""
    _active_recipe(db, recipeId)
    now = utcnow()
    existing = _my_active_rating(db, recipeId, user["id"])
    if existing is not None:
        db.execute(
            "UPDATE recipe_ratings SET score = ?, updated_at = ? WHERE id = ?",
            (body.score, now, existing["id"]),
        )
    else:
        db.execute(
            "INSERT INTO recipe_ratings(id, recipe_id, user_id, score, created_at, updated_at) "
            "VALUES (?,?,?,?,?,?)",
            (new_id("rrt"), recipeId, user["id"], body.score, now, now),
        )
    db.commit()
    return RatingResponse(recipe_id=recipeId, rating=_recipe_rating(db, recipeId), my_score=body.score)


@router.delete("/recipes/{recipeId}/rating", response_model=RatingResponse)
def delete_rating(recipeId: str, db: sqlite3.Connection = Depends(get_db),
                  user: sqlite3.Row = Depends(require_user)):
    """[US-015] 내 별점 취소(soft delete). 취소할 내 평점 또는 레시피가 없으면 404."""
    _active_recipe(db, recipeId)
    existing = _my_active_rating(db, recipeId, user["id"])
    if existing is None:
        raise AppError(404, "RESOURCE_NOT_FOUND", "취소할 평점이 없습니다.")
    now = utcnow()
    db.execute(
        "UPDATE recipe_ratings SET deleted_at = ?, updated_at = ? WHERE id = ?",
        (now, now, existing["id"]),
    )
    db.commit()
    return RatingResponse(recipe_id=recipeId, rating=_recipe_rating(db, recipeId), my_score=None)
