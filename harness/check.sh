#!/usr/bin/env bash
# =============================================================================
# harness/check.sh — 회귀 방지 통합 검사
#
# 3가지 검사를 순서대로 실행:
#   1. 보호 파일 무결성  — 기존 화면/기능 파일이 변경되지 않았는가
#   2. API 계약 호환성   — openapi.yaml에 breaking change가 없는가
#   3. 특성화 테스트     — 기존 테스트가 전부 통과하는가
#
# 사용법: ./harness/check.sh          # 전체 검사
#         ./harness/check.sh --fast   # 테스트 제외 (파일+계약만)
# 종료코드 0 = 통과. 실패 시 harness/last-report.md에 상세 리포트 생성.
# =============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

REPORT="harness/last-report.md"
FAIL=0
echo "# 하네스 검사 리포트 — $(date -Iseconds)" > "$REPORT"

if [[ ! -d harness/baselines ]]; then
  echo "❌ 베이스라인 없음. 먼저 실행: ./harness/baseline.sh"
  exit 2
fi

# ---------- 1. 보호 파일 무결성 ----------
echo ""
echo "═══ [1/3] 보호 파일 무결성 검사 ═══"
python3 - <<'PY'
import json, hashlib, os, fnmatch, sys

mf = json.load(open("harness/manifest.json"))
baseline = json.load(open("harness/baselines/checksums.json"))
excludes = mf.get("exclude_patterns", [])

def excluded(path):
    return any(fnmatch.fnmatch(os.path.basename(path), p) or p in path for p in excludes)

modified, deleted = [], []
for fp, old_hash in baseline.items():
    if not os.path.exists(fp):
        deleted.append(fp)
        continue
    new_hash = hashlib.sha256(open(fp, "rb").read()).hexdigest()
    if new_hash != old_hash:
        modified.append(fp)

lines = []
if modified:
    lines.append("## ❌ 보호 파일이 변경됨 (기존 화면/기능 침범)")
    lines += [f"- MODIFIED: {f}" for f in modified]
if deleted:
    lines.append("## ❌ 보호 파일이 삭제됨")
    lines += [f"- DELETED: {f}" for f in deleted]

with open("harness/last-report.md", "a") as r:
    if lines:
        r.write("\n".join(lines) + "\n")
        r.write("\n> 의도된 변경이라면 사용자 승인 후: ./harness/baseline.sh --approve <사유>\n")
    else:
        r.write("\n## ✅ 보호 파일 무결성: 통과\n")

if modified or deleted:
    print(f"❌ 보호 파일 침범: 변경 {len(modified)}건, 삭제 {len(deleted)}건")
    for f in (modified + deleted)[:10]:
        print(f"   - {f}")
    sys.exit(1)
print(f"✅ 보호 파일 {len(baseline)}개 무결성 확인")
PY
[[ $? -ne 0 ]] && FAIL=1

# ---------- 2. API 계약 호환성 ----------
echo ""
echo "═══ [2/3] API 계약 호환성 검사 ═══"
OPENAPI=$(python3 -c "import json;print(json.load(open('harness/manifest.json'))['semantic_paths']['openapi'])")
if [[ -f "harness/baselines/openapi.baseline.yaml" && -f "$OPENAPI" ]]; then
  if python3 harness/openapi_diff.py harness/baselines/openapi.baseline.yaml "$OPENAPI" >> "$REPORT" 2>&1; then
    echo "✅ API 계약 하위 호환 유지"
  else
    echo "❌ API breaking change 발견 (상세: $REPORT)"
    FAIL=1
  fi
else
  echo "ℹ️  API 베이스라인 없음 — 스킵"
  echo -e "\n## ℹ️ API 계약 검사: 스킵 (베이스라인 없음)" >> "$REPORT"
fi

# ---------- 2b. 디자인 토큰 add-only 검사 ----------
echo ""
echo "═══ [2b/3] 디자인 토큰 add-only 검사 ═══"
TOKENS=$(python3 -c "import json;print(json.load(open('harness/manifest.json'))['semantic_paths']['tokens'])")
if [[ -f "harness/baselines/tokens.baseline.json" && -f "$TOKENS" ]]; then
  if python3 harness/json_additive_check.py harness/baselines/tokens.baseline.json "$TOKENS" >> "$REPORT" 2>&1; then
    echo "✅ 토큰 add-only 유지"
  else
    echo "❌ 기존 토큰 변경/삭제 발견 (상세: $REPORT)"
    FAIL=1
  fi
else
  echo "ℹ️  토큰 베이스라인 없음 — 스킵"
fi

# ---------- 3. 특성화 테스트 (기존 테스트 전체) ----------
if [[ "${1:-}" != "--fast" ]]; then
  echo ""
  echo "═══ [3/3] 특성화 테스트 실행 ═══"
  python3 - <<'PY'
import json, subprocess, sys, os

mf = json.load(open("harness/manifest.json"))
failed = []
for name, cmd in mf.get("test_commands", {}).items():
    target_dir = cmd.split("&&")[0].replace("cd", "").strip()
    if not os.path.isdir(target_dir):
        print(f"ℹ️  {name}: 디렉토리 없음 — 스킵")
        continue
    print(f"▶ {name}: {cmd}")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        failed.append(name)
        print(f"❌ {name} 테스트 실패")
        with open("harness/last-report.md", "a") as f:
            f.write(f"\n## ❌ 테스트 실패: {name}\n```\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}\n```\n")
    else:
        print(f"✅ {name} 테스트 통과")

sys.exit(1 if failed else 0)
PY
  [[ $? -ne 0 ]] && FAIL=1
fi

# ---------- 결과 ----------
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "════════════════════════════════════"
  echo "✅ 하네스 전체 통과 — 기존 화면/기능 보존 확인"
  echo -e "\n# 최종: ✅ 통과" >> "$REPORT"
  exit 0
else
  echo "════════════════════════════════════"
  echo "❌ 하네스 실패 — 기존 기능 침범 가능성. 상세: $REPORT"
  echo -e "\n# 최종: ❌ 실패" >> "$REPORT"
  exit 1
fi
