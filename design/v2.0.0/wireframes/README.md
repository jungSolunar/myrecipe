# v2.0.0 와이어프레임 (레시피 상자)

기존 화면을 **v2.0.0 디자인 시스템**(Radix mint accent + slate gray, 데스크톱 셸)으로 재구성한 리뷰용 산출물입니다.
규격서 [`../design-guide.md`](../design-guide.md) · 토큰 [`../../tokens.css`](../../tokens.css) 준수. **[index.html](index.html)** 을 브라우저에서 열면 전체를 둘러볼 수 있습니다.

## 공통 셸
모든 앱 화면은 동일한 셸을 공유합니다: `사이드바 256px(로고→조직 스위처→개요/요리/식재료 내비→사용자 블록)` + `헤더 64px(breadcrumb·검색·테마 토글·아바타)` + `본문(padding 24 · gap 24 · max-width 1400)`. 셸 정본은 [recipe-list.html](recipe-list.html)이며 나머지 화면이 이를 그대로 복제합니다. 인증(로그인/회원가입)·삭제 확인은 셸 밖 중앙 정렬/모달입니다.

## 화면 매핑

| v2.0.0 화면 | 골격 (design-guide §4) | 기존 화면 | 관련 US |
|---|---|---|---|
| [home.html](home.html) | 대시보드형 | (신규 · 기존 데이터 집계) | 요약 |
| [recipe-list.html](recipe-list.html) | 목록·탐색형 | recipe-list | US-005, US-010, US-003 |
| [recipe-detail.html](recipe-detail.html) | 상세형 | recipe-detail | US-005~007, US-012 |
| [recipe-form.html](recipe-form.html) | 폼·편집형 | recipe-form | US-004, US-006, US-009 |
| [recipe-list-recommend.html](recipe-list-recommend.html) | 목록·탐색형(변형) | recipe-list-recommend | US-013 (Could) |
| [recipe-delete-confirm.html](recipe-delete-confirm.html) | 모달 | recipe-delete-confirm | US-007 |
| [ingredient-master.html](ingredient-master.html) | 목록·탐색형(표) | ingredient-master | US-008 |
| [inventory.html](inventory.html) | 목록·탐색형(표) | inventory | US-011 |
| [login.html](login.html) | 인증형 | login | US-002, US-003 |
| [signup.html](signup.html) | 인증형 | signup | US-001 |

## 적용된 v2.0.0 규칙 (기존 대비 변화)
- **토큰:** emerald primary(tokens.json) → **indigo primary + mint accent + slate gray**(tokens.css). indigo=CTA, mint=브랜드/활성.
- **레이아웃:** 모바일 우선 단일 컬럼 헤더 → **데스크톱 사이드바 셸** + 5종 골격.
- **타입:** 최대 24px(KPI), 페이지 타이틀 22/700. 모든 수치 tabular-nums.
- **형태:** 테두리 > 그림자, 라운드 카드 8·컨트롤 6·칩/배지 9999. 이모지 제거 → 라인 SVG 아이콘.
- **테마:** `data-theme="light|dark"` 지원(토큰 자동 전환).
- **도메인:** 매칭률(100%만 “지금 가능”)·유통기한 D-day 규칙을 실데이터로 계산.
- **상태:** 화면마다 기본/로딩(스켈레톤)/빈/오류 4상태 포함.

## 회귀/범위
- 기존 `design/wireframes/*` 와 `design/tokens.json` 은 **수정하지 않고 보존**(legacy).
- 본 폴더는 **신규 추가** 산출물. FE(`web/`) 는 변경하지 않았습니다 — 이 디자인 확정 후 구현 예정.
