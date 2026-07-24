#!/usr/bin/env bash
# =============================================================================
# harness/baseline.sh — 현재 상태를 "보호 기준선"으로 캡처
#
# 사용법:
#   ./harness/baseline.sh                  # 최초 캡처 (베이스라인 없을 때만)
#   ./harness/baseline.sh --approve US-007 # 의도된 변경 승인 후 기준선 갱신
#
# 규칙: --approve 없이 기존 베이스라인을 덮어쓸 수 없다.
#       에이전트는 이 스크립트를 --approve로 실행할 수 없다 (사용자 전용).
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_DIR="harness/baselines"
MANIFEST="harness/manifest.json"

if [[ -d "$BASE_DIR" && "${1:-}" != "--approve" ]]; then
  echo "❌ 베이스라인이 이미 존재합니다."
  echo "   의도된 변경을 승인하려면: ./harness/baseline.sh --approve <스토리ID 또는 사유>"
  exit 1
fi

if [[ "${1:-}" == "--approve" ]]; then
  REASON="${2:-}"
  if [[ -z "$REASON" ]]; then
    echo "❌ 승인 사유(스토리 ID 등)를 함께 기록해야 합니다."
    echo "   예: ./harness/baseline.sh --approve US-007"
    exit 1
  fi
fi

mkdir -p "$BASE_DIR"

# 1. 보호 파일 체크섬 캡처
python3 - <<'PY'
import json, hashlib, os, fnmatch

with open("harness/manifest.json") as f:
    mf = json.load(f)

excludes = mf.get("exclude_patterns", [])

def excluded(path):
    return any(fnmatch.fnmatch(os.path.basename(path), p) or p in path for p in excludes)

checksums = {}
for root_path in mf["protected_paths"]:
    if os.path.isfile(root_path):
        files = [root_path]
    elif os.path.isdir(root_path):
        files = []
        for r, _, fs in os.walk(root_path):
            files += [os.path.join(r, x) for x in fs]
    else:
        continue  # 아직 없는 경로는 스킵 (프로젝트 초기)
    for fp in sorted(files):
        if excluded(fp):
            continue
        with open(fp, "rb") as fh:
            checksums[fp] = hashlib.sha256(fh.read()).hexdigest()

with open("harness/baselines/checksums.json", "w") as f:
    json.dump(checksums, f, indent=2, ensure_ascii=False)
print(f"✅ 보호 파일 {len(checksums)}개 체크섬 캡처")
PY

# 2. OpenAPI 계약 스냅샷
OPENAPI=$(python3 -c "import json;print(json.load(open('$MANIFEST'))['semantic_paths']['openapi'])")
if [[ -f "$OPENAPI" ]]; then
  cp "$OPENAPI" "$BASE_DIR/openapi.baseline.yaml"
  echo "✅ API 계약 스냅샷 캡처: $OPENAPI"
else
  echo "ℹ️  $OPENAPI 없음 — API 계약 검사는 파일 생성 후 활성화됩니다"
fi

# 2b. 토큰 스냅샷 (add-only 검사용)
TOKENS=$(python3 -c "import json;print(json.load(open('$MANIFEST'))['semantic_paths']['tokens'])")
if [[ -f "$TOKENS" ]]; then
  cp "$TOKENS" "$BASE_DIR/tokens.baseline.json"
  echo "✅ 디자인 토큰 스냅샷 캡처: $TOKENS"
fi

# 3. 캡처 메타데이터 기록 (감사 이력)
{
  echo "captured_at: $(date -Iseconds)"
  echo "reason: ${2:-initial}"
  echo "git_ref: $(git rev-parse HEAD 2>/dev/null || echo 'no-git')"
} > "$BASE_DIR/meta.txt"
cat "$BASE_DIR/meta.txt" >> harness/baseline-history.log
echo "---" >> harness/baseline-history.log

echo ""
echo "✅ 베이스라인 캡처 완료 → $BASE_DIR/"
