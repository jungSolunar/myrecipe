"""SQLite 연결 및 마이그레이션 러너.

스키마는 migrations/*.sql 파일로만 관리한다(수동 변경 금지). 적용 이력은
schema_migrations 테이블에 기록해 중복 적용을 방지한다.
"""
from __future__ import annotations

import glob
import os
import sqlite3
from datetime import datetime, timezone

from .config import settings

_MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


def utcnow() -> str:
    """ISO8601 UTC (초 단위, 'Z' 접미). 응답 date-time 포맷과 일치."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def connect(db_path: str | None = None) -> sqlite3.Connection:
    path = db_path or settings.DB_PATH
    if path != ":memory:":
        os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def run_migrations(conn: sqlite3.Connection) -> None:
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations ("
        " filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
    )
    applied = {row["filename"] for row in conn.execute("SELECT filename FROM schema_migrations")}
    for path in sorted(glob.glob(os.path.join(_MIGRATIONS_DIR, "*.sql"))):
        fname = os.path.basename(path)
        if fname in applied:
            continue
        with open(path, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.execute(
            "INSERT INTO schema_migrations(filename, applied_at) VALUES (?, ?)",
            (fname, utcnow()),
        )
    conn.commit()
