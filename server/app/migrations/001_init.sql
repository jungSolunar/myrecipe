-- =============================================================================
-- 001_init.sql — 최초 스키마 (레시피 & 식재료 관리, US-001~US-010 + Should 확장)
--
-- DB 규칙(api-conventions):
--   - 테이블: 복수 snake_case
--   - 모든 테이블에 id, created_at, updated_at
--   - soft delete: deleted_at (NULL이면 활성)
--   - 스키마 변경은 마이그레이션 파일로만 (수동 변경 금지)
-- 타임스탬프는 ISO8601 UTC 문자열('YYYY-MM-DDTHH:MM:SSZ')로 저장한다.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    deleted_at    TEXT
);
-- 이메일 유니크는 활성 행에 대해서만 (soft delete 재가입 허용)
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_active
    ON users(email) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS ix_sessions_token ON sessions(token);

CREATE TABLE IF NOT EXISTS ingredients (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT,
    default_unit TEXT,
    owner_id     TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
-- 개인별 마스터: 같은 소유자 내에서 이름 중복 금지 (활성 행 기준)
CREATE UNIQUE INDEX IF NOT EXISTS ux_ingredients_owner_name_active
    ON ingredients(owner_id, name) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS recipes (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    category    TEXT,
    description TEXT,
    photo_url   TEXT,
    steps_json  TEXT NOT NULL DEFAULT '[]',  -- 조리 단계 문자열 배열 (JSON)
    owner_id    TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS ix_recipes_owner ON recipes(owner_id);

-- 레시피-식재료 연결 (US-009). 본문 임베드로 관리, 레시피 저장 시 전체 교체.
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id            TEXT PRIMARY KEY,
    recipe_id     TEXT NOT NULL,
    ingredient_id TEXT NOT NULL,
    quantity      REAL NOT NULL,
    unit          TEXT,
    position      INTEGER NOT NULL DEFAULT 0,  -- 표시 순서 보존
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    deleted_at    TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);
CREATE INDEX IF NOT EXISTS ix_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS ix_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- 보유 재고 (US-011 [Should]). 부족 재료 대조(US-012)에 사용.
CREATE TABLE IF NOT EXISTS inventory_items (
    id            TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL,
    owner_id      TEXT NOT NULL,
    quantity      REAL NOT NULL,
    unit          TEXT,
    expires_at    TEXT,   -- date (YYYY-MM-DD)
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    deleted_at    TEXT,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS ix_inventory_owner ON inventory_items(owner_id);
CREATE INDEX IF NOT EXISTS ix_inventory_ingredient ON inventory_items(ingredient_id);
