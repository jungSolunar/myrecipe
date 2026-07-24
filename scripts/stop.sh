#!/usr/bin/env bash
# start.sh 로 띄운 FE/BE 프로세스를 중지한다.
# .run/*.pid 를 읽어 정상 종료(TERM) 후, 남으면 강제 종료(KILL).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"

stop_one() {
  local name="$1" pid_file="$2"
  if [ ! -f "$pid_file" ]; then
    echo "[$name] PID 파일 없음 — 건너뜀"
    return 0
  fi
  local pid; pid="$(cat "$pid_file")"
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "[$name] 이미 종료됨 (pid $pid)"
    rm -f "$pid_file"
    return 0
  fi
  echo "[$name] 종료 중 (pid $pid)..."
  # 프로세스 그룹까지 정리(자식 uvicorn/vite/node 포함)
  kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "[$name] 강제 종료(KILL)"
    kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
  echo "[$name] 종료 완료"
}

stop_one "frontend" "$RUN_DIR/frontend.pid"
stop_one "backend"  "$RUN_DIR/backend.pid"

echo "✅ 중지 완료"
