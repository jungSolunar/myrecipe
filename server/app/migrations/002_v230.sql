-- =============================================================================
-- 002_v230.sql — v2.3.0 레시피 상자 기능 확장 (US-014~018), Additive-Only
--
-- 규칙(regression-harness / db-schema.md v2.3.0):
--   - 모든 신규 컬럼은 ALTER TABLE ... ADD COLUMN (nullable). 백필 없음(기존 행 NULL).
--   - 기존 컬럼/테이블/인덱스 변경·삭제 없음.
--   - enum 값(default_storage=냉장/냉동/실온, storage_location=냉장실/냉동실/실온)은
--     앱 계층(Pydantic Literal)에서 검증한다(그 외 값 400). CHECK 제약은 신규 테이블에만.
-- =============================================================================

-- US-014 조리시간(분). 미입력 시 NULL, 정렬은 NULL 뒤로.
ALTER TABLE recipes ADD COLUMN cook_time_minutes INTEGER;

-- US-016 식재료 마스터 확장 필드.
ALTER TABLE ingredients ADD COLUMN aliases_json    TEXT;  -- 별칭 배열(JSON). 미입력 시 NULL(응답은 []).
ALTER TABLE ingredients ADD COLUMN kcal_per_100g   REAL;  -- 100g당 칼로리(참고 필드).
ALTER TABLE ingredients ADD COLUMN default_storage TEXT;  -- 냉장/냉동/실온 (앱 검증).
ALTER TABLE ingredients ADD COLUMN memo            TEXT;  -- 자유 메모.

-- US-017 재고 보관위치. 냉장실/냉동실/실온 (앱 검증). 매칭 판정 미반영.
ALTER TABLE inventory_items ADD COLUMN storage_location TEXT;

-- US-015 레시피 회원별 별점 집계 (신규 테이블).
--   레시피 소유자 단일값이 아니라 여러 회원의 평점(1~5)을 모은 집계.
--   1인 1평점: UNIQUE(recipe_id, user_id) WHERE deleted_at IS NULL.
CREATE TABLE IF NOT EXISTS recipe_ratings (
    id         TEXT PRIMARY KEY,
    recipe_id  TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    score      INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- 1인 1평점(활성 행 기준). 취소(soft delete) 후 재평가 시 신규 행 삽입 안전.
CREATE UNIQUE INDEX IF NOT EXISTS ux_recipe_ratings_recipe_user_active
    ON recipe_ratings(recipe_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_recipe_ratings_recipe ON recipe_ratings(recipe_id);
