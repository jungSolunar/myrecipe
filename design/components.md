# 컴포넌트 스펙 (FE 계약 문서)

레시피 & 식재료 관리 웹서비스 — Must 범위(US-001~US-010) 재사용 컴포넌트.
모든 색상·간격·타이포는 `design/tokens.json` 값만 사용한다(하드코딩 금지). 와이어프레임은 토큰을 CSS 커스텀 프로퍼티(`--c-*`, `--s-*`, `--r-*`)로 매핑해 사용한다.

## 공통 규칙
- **터치 타겟**: 모든 인터랙티브 요소 최소 44×44px (`size.touch-target-min`).
- **포커스**: 전역 `:focus-visible` = `2px solid color.focus(#059669)` + `2px offset`.
- **반응형**: mobile-first. breakpoint tablet=768px, desktop=1200px. 컨테이너 최대폭 `size.container-max`.
- **대비**: 본문 텍스트 `neutral.900`, 보조 `neutral.600`(둘 다 흰 배경 4.5:1+). `neutral.400`은 placeholder/보더 전용(본문 텍스트 금지).

---

## Button
- **props**: `variant`(primary | ghost | danger), `size`(md=44px 기본 | sm=36px), `disabled`, `loading`, `iconLeft`, `as`(button | a).
- **상태**:
  - default: primary=`primary.700`/흰 텍스트, ghost=흰 배경/`primary.700` 텍스트+`surface.border-strong` 보더, danger=흰 배경/`semantic.error` 텍스트+error 보더(파괴적 확정 버튼은 배경 `semantic.error`+흰 텍스트).
  - hover: primary→`primary.800`, danger(solid)→brightness 92%.
  - focus: 전역 포커스 링.
  - disabled: `neutral.200` 배경/`neutral.500` 텍스트, `cursor:not-allowed`.
  - loading: `aria-busy="true"` + 스피너, 클릭 비활성.
- **반응형**: 폼 제출/다이얼로그 버튼은 모바일에서 full-width, 데스크톱에서 auto.
- **토큰**: color.primary.700/800, color.neutral.200/500, color.semantic.error, radius.md, spacing 3/4, typography.label.

## TextField / Select / Textarea
- **props**: `label`(필수, `for` 연결), `type`, `required`, `optional`, `placeholder`, `hint`, `error`, `value`, `autocomplete`.
- **상태**: default(보더 `surface.border-strong`) / focus(보더 `primary.600` + 포커스 링) / invalid(`aria-invalid="true"`, 보더 `semantic.error`, `error` 메시지 `role="alert"`로 연결 `aria-describedby`) / disabled.
- **접근성**: label 반드시 연결, 필수는 `*`(aria-hidden) + 시각/스크린리더 텍스트, hint/error는 `aria-describedby`.
- **반응형**: 폰트 16px 고정(iOS 확대 방지), 높이 44px, 모바일 1열 스택.
- **토큰**: color.neutral.400(placeholder)/900, surface.border-strong, semantic.error, radius.md, size.touch-target-min.

## Header (AppBar) + UserMenu
- **props**: `authState`(guest | authed), `user`.
- **상태**:
  - guest: 우측 "로그인" 버튼 + 목록 상단 GuestBanner 노출.
  - authed: 우측 UserMenu(아바타 이니셜 + 로그아웃). 로그아웃 시 세션 종료→guest 복귀(US-002 AC3).
- **동작**: sticky top, z-index 10. 브랜드 클릭→목록.
- **토큰**: surface.card, surface.border, color.primary.100/700/800, radius.full.

## GuestBanner (US-003)
- 비로그인 열람 안내 + 로그인 링크. `role="status"`. `semantic.info` 계열.
- 등록/수정 CTA는 노출하되 클릭 시 로그인 게이트로 유도.

## LoginGate (게이트 패턴, US-003)
- 등록/수정/삭제 진입점에서 비로그인 감지 시 로그인 화면으로 리다이렉트, `returnTo`로 원화면 복귀.
- login 화면 상단 안내 배너(`alert-info`)로 컨텍스트 표시.

## RecipeCard (US-005)
- **props**: `title`, `thumbnail?`, `category`, `ingredientCount`, `cookTime?`.
- **상태**: default / hover(그림자 sm→md) / focus(카드 전체 링) / loading(skeleton) / thumbnail 없음→플레이스홀더("🍳 사진 없음").
- **반응형**: 그리드 1열(mobile) → 2열(tablet) → 3열(desktop).
- **접근성**: 카드 전체가 링크, 대표 이미지 `alt` 필수(없으면 텍스트 플레이스홀더).
- **토큰**: surface.card/border, neutral.100/400/700/900, radius.lg, shadow.sm/md, spacing 4.

## SearchFilterBar (US-010)
- **props**: `query`, `category`, `ingredient`, `activeFilters[]`.
- **구성**: 검색 input(`type=search`, `role=search`) + 카테고리/재료 Select + FilterChip 목록(제거 버튼) + 결과 수(`aria-live="polite"`).
- **상태**: 입력/필터 적용 → 결과 갱신, 결과 0건 → EmptyState(빈 결과) + "필터 초기화".
- **토큰**: primary.50/100/800(칩), neutral.100(중립 칩), radius.full/md.

## IngredientPicker (US-009)
- **props**: `linkedIngredients[]`(name, qty), `masterOptions[]`.
- **동작**: 재료명 검색 → 마스터 결과 리스트(`role=listbox`/`option`) → 선택 시 행 추가 + 수량 입력. 마스터에 없으면 "+ 새 재료 만들기" 옵션(US-009 AC2) → 마스터 등록 후 연결.
- **상태**: 결과 있음 / 없음(새 재료 제안만) / 선택된 재료 행(수량 입력 + 삭제).
- **접근성**: 각 행 재료명·수량 input에 `aria-label`, 삭제 버튼 `aria-label="{재료} 삭제"`.
- **토큰**: primary.50(hover)/700, surface.border-strong, radius.md, size.touch-target-min.

## PhotoUploader (US-004, 선택 항목)
- **props**: `value?`, `accept`(png/jpeg), `maxSize`(5MB — G2 확정: 소규모 기준).
- **상태**: empty(드롭존 + 파일선택 버튼, "없어도 저장됨" 안내) / preview / error(형식·용량 초과).
- **참고**: 사진은 선택 항목(PRD Q6-a). 저장 방식은 backend와 협의(Open Question 해소 필요 — 아래 참조).

## StepList (조리 단계, US-004/US-005)
- 편집: 번호 배지 + Textarea + "단계 추가" / 보기: 번호 배지 + 텍스트(`<ol>`).
- **토큰**: primary.100/700/800, radius.full.

## Table (IngredientMaster, US-008)
- **props**: `rows[]`(name, category, unit, refInfo), `onEdit`, `onDelete`.
- **상태**: default / 인라인 행 편집 / 빈 목록(EmptyState) / 로딩(skeleton) / 에러.
- **반응형**: `<768px`에서 카드형으로 전환(각 셀 `data-th` 라벨 표시), 헤더 시각 숨김.
- **접근성**: `<caption>`, `<th scope="col">`, 행 액션 버튼 `aria-label`.
- **토큰**: neutral.50/100/600/700, surface.border, radius.md/full.

## Dialog / ConfirmDialog (US-007)
- **props**: `title`, `description`, `confirmLabel`, `variant`(danger 기본), `loading`.
- **동작**: `role="dialog"` + `aria-modal="true"`, 제목/설명 `aria-labelledby`/`aria-describedby` 연결, 포커스 트랩, ESC/취소 닫힘, 배경 스크롤 잠금. 파괴적 동작은 danger 확인 버튼.
- **상태**: default / loading(확인 버튼 `aria-busy`) / 권한 없음(error alert).
- **반응형**: 모바일 bottom-sheet 변형 허용.
- **토큰**: surface.overlay/card, semantic.error/error-bg, radius.lg, shadow.lg.

## Alert / Toast / Badge
- **Alert**: `variant`(error | warning | success | info), `role`(alert | status). bg는 `*-bg` 토큰 + 동명 텍스트 색(모두 4.5:1+).
- **Toast**: 성공/완료 일시 알림, `role="status"`.
- **Badge**: 상태 표시(카테고리 tag=중립, [Should US-012] "부족"=warning / "보유"=success).

## EmptyState / SkeletonLoader / ErrorState
- **EmptyState**: 아이콘/제목/설명 + 주요 CTA. 목록·검색·마스터 공통.
- **Skeleton**: `neutral.100` + pulse 애니메이션, `aria-hidden`.
- **ErrorState**: error 색 + "다시 시도" 버튼. 목록/상세/마스터 로드 실패 공통.

---

## 화면 ↔ 컴포넌트 매핑
| 화면 | 주요 컴포넌트 |
|---|---|
| signup / login | TextField, Button, Alert, UserMenu(로그인 상태) |
| recipe-list | Header, GuestBanner, SearchFilterBar, RecipeCard, EmptyState, Skeleton, ErrorState |
| recipe-detail | Header, Badge, Button(수정/삭제), StepList, Alert, ConfirmDialog 진입, [US-012 placeholder] |
| recipe-form | TextField/Select/Textarea, PhotoUploader, IngredientPicker, StepList, Button, Alert |
| recipe-delete-confirm | ConfirmDialog, Toast, Alert |
| ingredient-master | Table, TextField/Select, Button, Alert(중복/영향), EmptyState |

## FE 협의 필요 (미해결)
- **사진 저장 방식·URL 스키마**: backend와 계약 필요(PRD Open Question). PhotoUploader는 선택 항목이므로 사진 없이도 전 플로우 동작 보장.
- **재고 단위 환산**: US-012 "부족" 판정은 동일 단위 기준(PRD Open Question) — 이번 Must UI에는 미반영(placeholder만).
