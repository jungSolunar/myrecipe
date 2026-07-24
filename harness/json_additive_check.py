#!/usr/bin/env python3
"""baseline JSON의 모든 키·값이 current에 그대로 존재하는지 검사 (추가만 허용).
사용법: python3 json_additive_check.py <baseline.json> <current.json>"""
import json, sys

def check(base, cur, path="$"):
    errs = []
    if isinstance(base, dict):
        if not isinstance(cur, dict):
            return [f"{path}: 구조 변경 (object → {type(cur).__name__})"]
        for k, v in base.items():
            if k not in cur:
                errs.append(f"{path}.{k}: 기존 키 삭제")
            else:
                errs += check(v, cur[k], f"{path}.{k}")
    elif base != cur:
        errs.append(f"{path}: 기존 값 변경 ({base!r} → {cur!r})")
    return errs

base, cur = (json.load(open(f)) for f in sys.argv[1:3])
errors = check(base, cur)
if errors:
    print("❌ 기존 토큰 변경/삭제 발견 (추가만 허용):")
    [print(f"   {e}") for e in errors]
    sys.exit(1)
print("✅ 토큰 add-only 유지")
