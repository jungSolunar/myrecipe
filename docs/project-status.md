# 프로젝트 상태

현재 단계: v2.1.0 진행 중 (v2.0.0 재디자인 후속 과제 · 이슈 ISSUE-20260725-001~004)
v1.0.0: 완료·베이스라인 시딩됨 (2026-07-25)
v1.1.0: 완료·재베이스라인됨 (2026-07-25, reason=US-011)
v1.2.0: 완료 (US-001~013)
v2.0.0: 완료·재베이스라인됨 (2026-07-25, reason=v2.0.0) — FE 전면 재디자인

## v2.1.0 후속 과제 (v2.0.0 재디자인 규격 정합화)
v2.0.0에서 리스크 최소화를 위해 남겨둔 규격 미정합분을 이슈 단위로 정리·수정한다. 대상: FE 시각 레이어만(기능·라우팅·계약·기존 테스트 불변). 완료 후 사용자 재베이스라인(`baseline.sh --approve v2.1.0`).

| 이슈 | 제목 | 심각도 | 상태 |
|---|---|---|---|
| ISSUE-20260725-001 | 레시피 상세 §3.3 2열 sticky 요약·액션 레이아웃 적용 | Minor | ✅ Resolved |
| ISSUE-20260725-002 | 잔여 이모지 → 라인 SVG 아이콘 교체(안티패턴 제거) | Minor | ✅ Resolved |
| ISSUE-20260725-003 | 데스크톱 컨트롤 밀도(32/36) vs 모바일 44px 터치 반응형 분기 | Minor | ✅ Resolved |
| ISSUE-20260725-004 | 다크모드 전화면 QA 및 대비/토큰 누락 수정 | Minor | ✅ Resolved(핵심) |
| ISSUE-20260725-005 | 다크 표면 status(danger/info) 전경 대비 4.5:1 미달 — 정본 토큰 수정 | Minor | ⏳ Open(designer) |

게이트: `npm run build` 성공 · `npm test` 43/43 · lint 클린 (2026-07-25). 하네스는 예상대로 red(파일 동결만) → 사용자 `./harness/baseline.sh --approve v2.1.0` 대기.

### ISSUE-20260725-001 — 레시피 상세 2열 sticky
- 증상: RecipeDetailPage가 design-guide §3.3(좌 미디어 16:9+조리순서 / 우 `position:sticky; top:88px` 요약·액션)이 아닌 단일 컬럼. v2.0.0 토큰만 적용된 상태.
- 계획: grid `repeat(auto-fit,minmax(320px,1fr))`로 2열화, 우측 요약·액션 패널 sticky. 삭제 플로우·기존 테스트(삭제→dialog→목록 복귀) DOM 텍스트/role 보존.
- 진행: ✅ Resolved (2026-07-25). RecipeDetailPage `recipe-detail__grid` 2열화 — 좌: 히어로 16:9+제목+메타+설명+조리단계 / 우(`__side` sticky top:88px): 소유자 액션 카드 + 재료 요약 카드. ≤900px `static` 스택. 삭제→dialog→목록 복귀 테스트 통과.

### ISSUE-20260725-002 — 잔여 이모지 제거
- 증상: EmptyState(🥕/🔍/🍳 아이콘 프롭), GuestBanner(👀), Alert(💡), RecommendFilterToggle(🔒/ⓘ), RecommendRecipeCard(✓) 등 프롭·컴포지션에 이모지 잔존. design-guide §10 안티패턴.
- 계획: 1.5~1.8 stroke 라인 SVG로 교체(공용 아이콘 처리). 접근성: 단독 아이콘 `aria-hidden` 또는 `aria-label` 유지. 기존 테스트가 단언하는 텍스트 불변.
- 진행: ✅ Resolved (2026-07-25). 공용 `components/Icon.tsx`(14종 1.6-stroke 라인 SVG, `label` 유무로 role=img/aria-hidden 분기) 신설. EmptyState/GuestBanner/Alert/ConfirmDialog/Toast/RecommendFilterToggle/RecommendRecipeCard/RecipeCard/TextField/Select/Textarea/IngredientPicker/PhotoUploader/StepList/SearchFilterBar/RecipeListPage의 이모지 전량 교체. UI 잔여 이모지 0(grep 확인). 테스트 단언 텍스트·aria 이름 보존.

### ISSUE-20260725-003 — 컨트롤 밀도 반응형
- 증상: v2.0.0에서 접근성 위해 전역 44px 터치 타깃 유지 → 데스크톱 밀도(툴바 32/폼 36) 권장치와 상충.
- 계획: 데스크톱 32/36 + 모바일(≤900px) 44px 반응형 분기 또는 hit-padding. design-guide §4.
- 진행: ✅ Resolved (2026-07-25). tokens.css `--control-h-toolbar:32` / `--control-h-form:36` 추가 + `@media(max-width:900px)`에서 둘 다 44로 승격(`--touch=44` 유지). Button/fields/recipes/inventory/ingredients 버튼·입력에 적용. 포커스 링·접근성 이름 불변.

### ISSUE-20260725-004 — 다크모드 QA
- 증상: `data-theme` 토글·토큰은 구현했으나 전 화면 대비/토큰 누락 QA 미수행.
- 계획: light/dark 양쪽에서 전 화면 점검, 리터럴 hex·누락 토큰·대비 4.5:1 미달 지점 수정.
- 진행: ✅ Resolved(핵심) (2026-07-25). FE 코드 결함 수정: primary 버튼/로딩/조리단계 배지의 `#fff` 하드코딩이 다크에서 `--primary-fg` 반전을 우회해 저대비(3.2:1) → `var(--primary-fg)`로 교체(6.1:1). Spinner top-color→`currentColor`. 미정의 토큰 참조 0, 리터럴 hex는 솔리드 위 `#fff` 예외만 잔존. **후속(ISSUE-005)**: danger/info 전경은 정본 tokens.css가 "다크=light 동일"로 고정 → FE 임의 변경 대신 designer 승인 사안으로 분리.

### ISSUE-20260725-005 — 다크 status 전경 대비 (designer 스코프)
- 증상: 다크 표면 위 `--status-danger`(#dc2626, 3.64:1)·`--status-info`(#2563eb, 3.40:1) 전경이 4.5:1 미달(Alert/Toast/Badge/GuestBanner). success(5.33)/warning(5.52)는 통과. 정본 `design/tokens.css`가 다크에서 이 두 색을 light와 동일하게 명시.
- 계획: 다크용 status 전경 명도 상향을 `design/tokens.css`(canonical)에 반영할지 designer 결정 필요. design-guide §12 "다크모드 지원범위 미확정"과 연동 → 사용자/디자이너 판단 대기.
- 진행: ⏳ Open (designer). FE는 정본 토큰 변경 전까지 override 안 함.


## 문서
- 화면 가이드: docs/screen-guide.md — 화면별 동작 위치·방식을 버전별로 추적(v1.2.0 기준 작성). 스킬 `screen-guide`로 관리, workflow G3 직후~G4에 갱신.

## v2.0.0 디자인 리뉴얼 승인 사항 (2026-07-25)
- 기존 FE(web/src, 하네스 protected)를 v2.0.0 디자인 시스템(레시피 상자 · Radix mint accent + slate)으로 **풀 재디자인** 착수 승인됨. 셸까지 교체(256px 사이드바 + 64px 헤더 + design-guide §3 골격 5종).
- 이는 Additive-Only 예외: 토큰(web/src/styles/tokens.css)·global.css·컴포넌트/화면 CSS·AppLayout/Header 등 protected 파일 다수 변경 불가피 → 사용자가 명시 승인.
- **기능·동작·접근성 계약(라우팅, 텍스트/role/label, 기존 테스트)** 은 불변 유지. 기존 테스트 파일 수정 금지, 전부 통과 상태로만 완료.
- 완료 후 회귀 하네스는 예상대로 실패(재디자인이므로) → 사용자가 `./harness/baseline.sh --approve v2.0.0` 로 재베이스라인 예정. 에이전트는 approve를 직접 실행하지 않음.
- 기준 규격: design/v2.0.0/design-guide.md(정본) · design/tokens.css · design/v2.0.0/wireframes/ · design-system 스킬.
- **FE 구현 완료 (2026-07-25):** 토큰 레이어 v2.0.0 재정의(호환 레이어로 기존 `--c-*` 이름 유지) + 셸 재구성(상단 Header→256px 좌측 사이드바, 라인 SVG 브랜드, data-theme 다크 토글) + 화면/공용 컴포넌트 리스타일. `npm run build` 성공 · `npm test` 43/43 통과 · 기능/라우팅/계약 불변. 하네스는 예상대로 red(파일 동결 위반만, 기능 회귀 없음) → 사용자 `./harness/baseline.sh --approve v2.0.0` 대기.
- **후속 과제:** 레시피 상세 §3.3 2열 sticky 미적용(단일 컬럼 유지) · 잔여 이모지(EmptyState/GuestBanner/Alert/추천 토글 등 프롭 분산분) 라인 SVG 교체 · 데스크톱 밀도(현 44px 터치 유지) · 다크모드 전화면 QA 미수행.

## v1.2.0 승인 사항
- US-013 추천은 PRD 의도대로 기존 레시피 목록에 '만들 수 있는 레시피' 필터로 구현. 이를 위해 기존 보호 파일 수정 승인됨 (2026-07-25): server/app/routers/recipes.py(available_only/missing_asc 로직), FE 목록/필터바(RecipeListPage·SearchFilterBar·useRecipes·api/recipes.ts·types.ts). 기본 동작(필터 off)은 기존과 동일 보장. 구현 후 사용자가 baseline.sh --approve US-013로 재베이스라인 예정.
- 계약(openapi.yaml)에 available_only/sort 파라미터 기존재 → API 계약 변경 없음

## v1.1.0 승인 사항
- US-011 재고 화면 추가를 위해 보호 파일 2개(web/src/App.tsx 라우트, web/src/components/Header.tsx 네비)에 순수 추가 편집 승인됨 (2026-07-25). 구현 후 사용자가 baseline.sh --approve US-011로 재베이스라인 예정.
- US-012는 v1.0.0에서 이미 FE(상세 배지)·BE(재고대조)로 구현됨 → 재고 데이터로 활성화

## 프로젝트 개요
레시피 등록·관리 및 식재료 관리 웹서비스 (여러 일반 회원 / 열람 자유, 등록·수정 로그인 / 소규모 / PC·모바일 반응형)

## 게이트
- [x] G0 요구사항 인터뷰 CLOSED (2026-07-24)
- [x] G1 PRD 승인 (2026-07-24) — 계층화 동의, 식재료 마스터=개인별
- [x] G2 디자인 + API 계약 (2026-07-24) — 와이어프레임 7종, openapi 20스키마/example, 교차검증 통과
- [x] G3 구현 (2026-07-24) — BE pytest 25 통과(직접확인), FE lint/test/build 통과·계약 위반필드 없음(직접확인)
- [x] G4 배포 (2026-07-24) — CI(3잡, 하네스 스텝) 그린, deploy 런북·롤백·v1.0.0 릴리스 노트
## 스토리별 진행
| ID | 기획 | 디자인 | API | FE | BE | 배포 |
|---|---|---|---|---|---|---|
| US-001 회원가입 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-002 로그인/로그아웃 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-003 비로그인 열람·게이트 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-004 레시피 등록 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-005 레시피 목록·상세 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-006 레시피 수정 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-007 레시피 삭제 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-008 식재료 마스터 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-009 레시피-식재료 연결 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-010 레시피 검색·필터 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-011 재고 관리 (Should) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(v1.1.0) |
| US-012 부족 재료 표시 (Should) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(v1.1.0) |
| US-013 보유재료 추천 (Could) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(v1.2.0) |

## 확정 사항
- 범위 계층화: Must(US-001~010) 1차 → Should(US-011~012) → Could(US-013)
- 식재료 마스터: 회원 개인별
- 기술 스택: FE React+TypeScript+Vite / BE Python+FastAPI / DB SQLite (2026-07-24)
- 인증: 세션 쿠키(HttpOnly) 방식 (backend-dev 계약)
- 회귀 하네스: greenfield 최초 구축 — 보호 베이스라인 미존재(check.sh exit 2 정상). 베이스라인은 G4 이후 사용자 승인 하에 첫 버전 편입

## 블로커
- (없음)
