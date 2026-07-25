# 프로젝트 상태

현재 단계: v1.2.0 완료 (전체 백로그 US-001~013 구현 완료 · 배포·재베이스라인은 사용자 조치 대기)
v1.0.0: 완료·베이스라인 시딩됨 (2026-07-25)
v1.1.0: 완료·재베이스라인됨 (2026-07-25, reason=US-011)

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
