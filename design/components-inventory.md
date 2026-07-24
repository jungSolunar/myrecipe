# 컴포넌트 스펙 — 재고 관리 (US-011 / US-012)

v1.1.0 G2 Should 범위 신규 컴포넌트 스펙. 기존 `design/components.md`의 규약(터치 44px, 전역 포커스 링, mobile-first, 대비 4.5:1+)과 `design/tokens.json` 토큰만 사용한다. **기존 컴포넌트는 재사용/확장**하며 수정하지 않는다.

관련 와이어프레임: `design/wireframes/inventory.html`

## 재사용하는 기존 컴포넌트
- **Header + UserMenu**: 상단 내비에 "내 재고"(`aria-current="page"`) 추가만.
- **Table**(US-008 스펙): 목록 레이아웃·모바일 카드 전환·`caption`/`th scope`/행 액션 `aria-label` 규칙 동일 적용.
- **TextField / Select**: 추가·수정 폼 입력.
- **Button**(primary/ghost/danger + danger-solid): 추가/수정/소진.
- **Alert**(warning/info/error), **EmptyState**, **Skeleton**, **ErrorState**: 상태 화면.

---

## InventoryTable (US-011)
- **props**: `rows[]`(id, ingredientName, category, qty, unit, expiryDate?, expiryStatus), `sort`(기본 유통기한 임박순), `onEdit`, `onDeplete`.
- **컬럼**: 재료명 / 분류(중립 pill) / 보유 수량(수량+단위, `tabular-nums`) / 유통기한(날짜 + ExpiryBadge, 미입력 시 "미입력" `neutral.500`) / 작업.
- **상태**: default / 인라인 행 편집(InventoryEditRow) / 빈 목록(EmptyState) / 로딩(Skeleton) / 에러(ErrorState).
- **반응형**: `<768px` 카드형 전환(각 셀 `data-th`), 헤더 시각 숨김.
- **접근성**: `<caption>` 건수 안내, `<th scope="col">`, 행 액션 버튼 `aria-label="{재료} 수정/소진 처리"`.
- **토큰**: neutral.50/100/500/600/700, surface.border, radius.md/full.

## InventoryAddForm (US-011 AC1)
- **props**: `masterOptions[]`(마스터 재료; name·category·defaultUnit), `onSubmit(ingredientId, qty, expiryDate?)`.
- **필드**:
  - 재료(Select, 필수) — **마스터에서만 선택**(자유 입력 금지). placeholder "마스터에서 선택…", hint에 마스터 등록 링크.
  - 수량(number, 필수) — `min=0`, `step` 단위별, `inputmode=decimal`.
  - 단위(readonly) — 선택한 마스터 재료의 기본 단위 자동 표시(입력 아님).
  - 유통기한(date, **선택**) — 비우면 "미입력" 저장, 만료 배지 계산 제외.
- **검증**: 재료 미선택/수량 공란·음수 → `aria-invalid` + `role="alert"` 에러 메시지. 동일 재료 재고 중복 시 기존 행 수량 갱신 안내(Alert).
- **반응형**: 데스크톱 5열(재료 2.2 / 수량 1 / 단위 .8 / 유통기한 1.4 / 버튼 auto), 모바일 1열 스택. 제출 버튼 모바일 full-width.
- **마스터 비어있음**: Select 대신 info Alert + "마스터에서 등록하기" 링크(상태 C).
- **토큰**: primary.600/700/800, surface.border-strong, semantic.error, neutral.500, radius.md, size.touch-target-min.

## InventoryEditRow (US-011 AC2)
- 행을 인라인 편집: 재료명·단위는 readonly, **수량·유통기한만 수정**. 저장/취소 버튼.
- **수량 0 저장** → DepleteConfirm(소진 처리 확인)로 위임.
- **토큰**: 폼 필드와 동일.

## DepleteConfirm (US-011 AC2 — 소진/삭제 확인)
- 기존 ConfirmDialog 패턴(US-007) 재사용. `role="alertdialog"`, 제목/설명 `aria-labelledby`/`aria-describedby` 연결, 포커스 트랩, ESC/취소 닫힘.
- **문구**: "'{재료}'를 재고에서 제거할까요? 보유 목록에서 소진 처리됩니다. 식재료 마스터 항목은 그대로 유지돼요." → 마스터 삭제와 구분(재고 소진은 마스터에 영향 없음).
- **확인 버튼**: danger-solid("소진 처리"). loading 시 `aria-busy`.
- **토큰**: surface.overlay/card, semantic.error/error-bg, warning-bg, radius.lg, shadow.lg.

## ExpiryBadge (재고 유통기한 상태 표시)
- **props**: `expiryDate?`, `today`.
- **variant / 규칙**(기준일=오늘):
  | variant | 조건 | 토큰(배경/텍스트/보더) |
  |---|---|---|
  | ok "넉넉" | D-3 초과 | success-bg / success / primary.200 |
  | soon "임박 D-n" | 0 ≤ 잔여일 ≤ 3 | warning-bg / warning / warning |
  | expired "만료" | 유통기한 < 오늘 | error-bg / error / error |
  | (없음) "미입력" | expiryDate 없음 | 배지 없이 neutral.500 텍스트 |
- **접근성**: 색상에만 의존하지 않고 텍스트("만료"/"임박 D-2"/"넉넉") 동반. 대비 4.5:1+ (`*-bg` 위 동명 텍스트 토큰).

---

## US-012 부족재료 표시 규칙 (별도 화면 아님 — recipe-detail의 Badge)
US-012는 이미 recipe-detail에 Badge placeholder로 존재. 재고 데이터와 대조해 표시하는 **규칙만** 아래로 확정한다(신규 와이어프레임 불필요).

- **판정(동일 단위 기준)** — 단위 환산은 이후 과제(PRD Open Question):
  - 재고에 해당 재료가 없음 → **부족**(전량).
  - 재고 수량 < 레시피 요구 수량(동일 단위) → **부족**(부족분 표기 가능).
  - 재고 수량 ≥ 요구 수량 → **보유**.
  - 단위가 다르면(환산 불가) → **확인 필요**(중립 배지, 부족으로 단정하지 않음).
- **배지 매핑**(기존 Badge 컴포넌트 재사용):
  - 보유/충족 → success("보유").
  - 부족 → warning("부족").
  - 확인 필요(단위 상이) → 중립 pill("단위 확인").
- **상세 헤더 요약**: 모든 재료 충족 시 success Alert "재료 충족", 부족 있으면 warning Alert "부족 재료 N개"(`aria-live="polite"`).
- **비로그인(US-012 AC3)**: 부족/보유 배지 숨김. 대신 GuestBanner/info Alert로 "로그인하면 내 재고와 대조해 부족 재료를 표시합니다" 안내 + 로그인 링크.
- **재고 없음(로그인이나 재고 0건)**: 배지 숨김 + "내 재고를 등록하면 부족 재료를 알려드려요" 안내 → inventory.html 링크.

## 화면 ↔ 컴포넌트 매핑(추가분)
| 화면 | 주요 컴포넌트 |
|---|---|
| inventory | Header, InventoryAddForm, InventoryTable, InventoryEditRow, DepleteConfirm, ExpiryBadge, EmptyState, Skeleton, ErrorState, Alert |
| recipe-detail (US-012) | 기존 + Badge(보유/부족), Alert(요약), GuestBanner(비로그인) — 신규 화면 없음 |

## FE/BE 협의 필요
- **단위 환산**: g↔개 등 환산 정책 미정(PRD Open Question). 현재 판정은 동일 단위 한정, 상이 단위는 "단위 확인"으로 표시(부족 오판 방지).
- **유통기한 임박 임계값**: 본 스펙은 D-3(3일 이내)을 soon 기준으로 제안 — 확정 필요.
