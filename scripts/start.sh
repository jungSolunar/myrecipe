#!/usr/bin/env bash
# 로컬에서 Recipe Box(FE + BE)를 함께 띄우는 스크립트.
#   - 백엔드: FastAPI(uvicorn), 기본 :8080  (기동 시 마이그레이션 자동 적용)
#   - 프론트: Vite dev 서버, 기본 :5173, /api 는 백엔드로 프록시
# 두 프로세스를 백그라운드로 띄우고 PID/로그를 deploy/scripts/.run 에 남긴다.
# 중지는 stop.sh 사용.
set -euo pipefail

# --- 경로 계산 ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"   # myrecipe/
SERVER_DIR="$ROOT_DIR/server"
WEB_DIR="$ROOT_DIR/web"
RUN_DIR="$SCRIPT_DIR/.run"
mkdir -p "$RUN_DIR"

# --- 설정(환경변수로 덮어쓰기 가능) ---
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
VENV_PY="$SERVER_DIR/.venv/bin/python"

BE_PID_FILE="$RUN_DIR/backend.pid"
FE_PID_FILE="$RUN_DIR/frontend.pid"
BE_LOG="$RUN_DIR/backend.log"
FE_LOG="$RUN_DIR/frontend.log"

# --- 이미 떠 있는지 확인 ---
is_running() { [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }
if is_running "$BE_PID_FILE" || is_running "$FE_PID_FILE"; then
  echo "이미 실행 중인 프로세스가 있습니다. 먼저 stop.sh 를 실행하세요." >&2
  exit 1
fi

# --- 백엔드 준비 ---
if [ ! -x "$VENV_PY" ]; then
  echo "[backend] .venv 가 없어 생성합니다..."
  python3 -m venv "$SERVER_DIR/.venv"
  "$VENV_PY" -m pip install --quiet --upgrade pip
  "$VENV_PY" -m pip install --quiet -r "$SERVER_DIR/requirements.txt"
fi

# .env 로드(있으면). SECRET_KEY 등 시크릿은 리포에 커밋하지 않고 여기서만 주입.
if [ -f "$SERVER_DIR/.env" ]; then
  echo "[backend] server/.env 로드"
  set -a; . "$SERVER_DIR/.env"; set +a
fi

echo "[backend] uvicorn 기동 → http://localhost:$BACKEND_PORT"
( cd "$SERVER_DIR" && exec "$VENV_PY" -m uvicorn app.main:app \
    --host "$BACKEND_HOST" --port "$BACKEND_PORT" ) >"$BE_LOG" 2>&1 &
echo $! > "$BE_PID_FILE"

# --- 프론트 준비: node 확보 ---
# 비대화형 셸에는 PATH 가 없을 수 있으니 버전매니저를 로드해 본다.
if ! command -v node >/dev/null 2>&1; then
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  command -v fnm >/dev/null 2>&1 && eval "$(fnm env 2>/dev/null)" || true
  [ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"
  for d in /opt/homebrew/bin /usr/local/bin; do
    [ -x "$d/node" ] && export PATH="$d:$PATH"
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo "[frontend] node 를 찾을 수 없습니다. Node.js 를 설치한 뒤 다시 실행하세요." >&2
  echo "           (백엔드는 :$BACKEND_PORT 에서 계속 실행 중 — stop.sh 로 중지 가능)" >&2
  exit 1
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo "[frontend] 의존성 설치(npm ci)..."
  ( cd "$WEB_DIR" && npm ci )
fi

echo "[frontend] vite dev 기동 → http://localhost:$FRONTEND_PORT (/api → :$BACKEND_PORT)"
# npm 래퍼 대신 vite 바이너리를 직접 exec → PID 가 곧 vite 프로세스(종료 깔끔)
( cd "$WEB_DIR" && VITE_API_TARGET="http://localhost:$BACKEND_PORT" \
    exec ./node_modules/.bin/vite --port "$FRONTEND_PORT" ) >"$FE_LOG" 2>&1 &
echo $! > "$FE_PID_FILE"

echo ""
echo "✅ 기동 완료"
echo "   - 앱:      http://localhost:$FRONTEND_PORT"
echo "   - API:     http://localhost:$BACKEND_PORT/api/v1"
echo "   - 로그:    $BE_LOG / $FE_LOG"
echo "   - 중지:    $SCRIPT_DIR/stop.sh"
