#!/usr/bin/env bash
# start.sh 로 띄운 FE/BE 의 기동 상태를 확인한다.
#   - .run/*.pid 로 프로세스 생존 여부(kill -0)
#   - HTTP 로 실제 응답 여부(백엔드 /api/v1/recipes, 프론트 루트)
# 둘 다 정상이면 exit 0, 하나라도 문제면 exit 1 (CI/헬스체크에 활용 가능).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"

# start.sh 와 동일한 기본값(환경변수로 덮어쓰기 가능)
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
HTTP_HOST="${HTTP_HOST:-localhost}"

BE_PID_FILE="$RUN_DIR/backend.pid"
FE_PID_FILE="$RUN_DIR/frontend.pid"

overall=0  # 0=정상, 1=문제

# --- PID 파일 기반 프로세스 상태 ---
pid_status() {
  local name="$1" pid_file="$2"
  if [ ! -f "$pid_file" ]; then
    echo "no-pidfile"
    return
  fi
  local pid; pid="$(cat "$pid_file" 2>/dev/null)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "running(pid $pid)"
  else
    echo "dead(pid ${pid:-?})"
  fi
}

# --- HTTP 응답 상태 ---
http_status() {
  local url="$1"
  if ! command -v curl >/dev/null 2>&1; then
    echo "n/a(curl 없음)"
    return
  fi
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$url" 2>/dev/null)"
  echo "$code"
}

# 상태 한 줄 출력 + overall 갱신
report() {
  local name="$1" pid_state="$2" http_code="$3" url="$4"
  local ok="✅" mark

  # 프로세스가 정상(running)이고 HTTP 코드가 2xx/3xx/4xx(=응답은 함) 이면 OK 로 간주
  #  - 401/404 등도 "서버는 응답 중"이므로 기동 판정에는 성공으로 본다
  if [[ "$pid_state" == running* ]] && [[ "$http_code" =~ ^[234][0-9][0-9]$ ]]; then
    mark="✅"
  elif [[ "$pid_state" == running* ]] || [[ "$http_code" =~ ^[234][0-9][0-9]$ ]]; then
    mark="⚠️"    # 프로세스/HTTP 중 하나만 정상 (기동 중이거나 PID 파일 불일치)
    overall=1
  else
    mark="❌"
    overall=1
  fi

  printf "  %s  %-9s  프로세스=%-18s  HTTP=%-14s  %s\n" \
    "$mark" "$name" "$pid_state" "${http_code:-없음}" "$url"
}

echo "🔎 서버 기동 상태 확인 (host=$HTTP_HOST, BE=$BACKEND_PORT, FE=$FRONTEND_PORT)"

BE_URL="http://$HTTP_HOST:$BACKEND_PORT/api/v1/recipes?limit=1"
FE_URL="http://$HTTP_HOST:$FRONTEND_PORT/"

report "backend"  "$(pid_status backend "$BE_PID_FILE")"  "$(http_status "$BE_URL")"  "$BE_URL"
report "frontend" "$(pid_status frontend "$FE_PID_FILE")" "$(http_status "$FE_URL")"  "$FE_URL"

echo ""
if [ "$overall" -eq 0 ]; then
  echo "✅ 모두 정상 기동 중"
else
  echo "⚠️  일부 미기동/이상 — 기동은 scripts/start.sh, 중지는 scripts/stop.sh"
fi
exit "$overall"
