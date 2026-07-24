#!/usr/bin/env python3
"""
harness/openapi_diff.py — API 계약 하위 호환성 검사

베이스라인 대비 현재 openapi.yaml에서 breaking change를 탐지한다:
  B1. 엔드포인트(path) 삭제
  B2. HTTP 메서드 삭제
  B3. 응답 스키마에서 필드 삭제
  B4. 필드 타입 변경
  B5. 요청에 필수(required) 필드/파라미터 추가
  B6. enum 값 삭제

추가(additive) 변경 — 새 엔드포인트, 새 optional 필드 — 는 허용.
사용법: python3 harness/openapi_diff.py <baseline.yaml> <current.yaml>
종료코드: 0 = 호환 / 1 = breaking change 발견
"""
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}
breaking = []


def resolve(node, spec, depth=0):
    """$ref를 따라가 실제 스키마 반환 (순환 방지용 depth 제한)"""
    if depth > 20 or not isinstance(node, dict):
        return node
    if "$ref" in node:
        parts = node["$ref"].lstrip("#/").split("/")
        target = spec
        for p in parts:
            target = target.get(p, {}) if isinstance(target, dict) else {}
        return resolve(target, spec, depth + 1)
    return node


def diff_schema(base, cur, base_spec, cur_spec, path, depth=0):
    if depth > 15:
        return
    base, cur = resolve(base, base_spec), resolve(cur, cur_spec)
    if not isinstance(base, dict) or not isinstance(cur, dict):
        return

    bt, ct = base.get("type"), cur.get("type")
    if bt and ct and bt != ct:
        breaking.append(f"[B4] 타입 변경 {path}: {bt} → {ct}")

    b_enum, c_enum = base.get("enum"), cur.get("enum")
    if b_enum and c_enum:
        removed = set(map(str, b_enum)) - set(map(str, c_enum))
        if removed:
            breaking.append(f"[B6] enum 값 삭제 {path}: {sorted(removed)}")

    b_props = base.get("properties", {})
    c_props = cur.get("properties", {})
    for name, b_sub in b_props.items():
        if name not in c_props:
            breaking.append(f"[B3] 필드 삭제 {path}.{name}")
        else:
            diff_schema(b_sub, c_props[name], base_spec, cur_spec,
                        f"{path}.{name}", depth + 1)

    if "items" in base and "items" in cur:
        diff_schema(base["items"], cur["items"], base_spec, cur_spec,
                    f"{path}[]", depth + 1)


def required_request_additions(base_op, cur_op, base_spec, cur_spec, where):
    # 파라미터
    b_params = {p.get("name") for p in base_op.get("parameters", [])
                if resolve(p, base_spec).get("required")}
    for p in cur_op.get("parameters", []):
        rp = resolve(p, cur_spec)
        if rp.get("required") and rp.get("name") not in b_params:
            breaking.append(f"[B5] 필수 파라미터 추가 {where}: {rp.get('name')}")
    # requestBody required 필드
    def req_fields(op, spec):
        body = resolve(op.get("requestBody", {}), spec)
        out = set()
        for media in resolve(body.get("content", {}), spec).values():
            schema = resolve(media.get("schema", {}), spec)
            out |= set(schema.get("required", []))
        return out
    added = req_fields(cur_op, cur_spec) - req_fields(base_op, base_spec)
    for f in sorted(added):
        breaking.append(f"[B5] 요청 필수 필드 추가 {where}: {f}")


def main(base_file, cur_file):
    base_spec = yaml.safe_load(open(base_file)) or {}
    cur_spec = yaml.safe_load(open(cur_file)) or {}
    b_paths = base_spec.get("paths", {}) or {}
    c_paths = cur_spec.get("paths", {}) or {}

    for path, b_item in b_paths.items():
        if path not in c_paths:
            breaking.append(f"[B1] 엔드포인트 삭제: {path}")
            continue
        c_item = c_paths[path]
        for method in HTTP_METHODS & set(b_item):
            if method not in c_item:
                breaking.append(f"[B2] 메서드 삭제: {method.upper()} {path}")
                continue
            where = f"{method.upper()} {path}"
            b_op, c_op = b_item[method], c_item[method]
            required_request_additions(b_op, c_op, base_spec, cur_spec, where)
            # 응답 스키마 비교
            for status, b_resp in (b_op.get("responses") or {}).items():
                c_resp = (c_op.get("responses") or {}).get(status)
                if c_resp is None:
                    breaking.append(f"[B3] 응답 삭제 {where} → {status}")
                    continue
                b_content = resolve(b_resp, base_spec).get("content", {})
                c_content = resolve(c_resp, cur_spec).get("content", {})
                for media, b_media in b_content.items():
                    c_media = c_content.get(media, {})
                    diff_schema(b_media.get("schema", {}),
                                c_media.get("schema", {}),
                                base_spec, cur_spec,
                                f"{where} {status}")

    if breaking:
        print("❌ API 계약 breaking change 발견:")
        for b in breaking:
            print(f"   {b}")
        sys.exit(1)
    print("✅ API 계약 하위 호환 유지")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
