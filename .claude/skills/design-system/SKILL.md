---
name: design-system
description: 디자인 토큰 구조, 와이어프레임 제작 규칙, 접근성 체크리스트. UI 설계, 화면 목업, 컴포넌트 스펙 작업 시 사용. 기준은 v2.0.0(Radix mint + slate, tokens.css).
---

# 디자인 시스템 스킬 (v2.0.0)

**기준 산출물:** `design/v2.0.0/design-guide.md`(규격서) · `design/v2.0.0/레시피 상자.html`(고충실도 목업) · `design/v2.0.0/레시피 상자 와이어프레임.html`(기능별 화면 기획) · `design/tokens.css`(토큰).
**상위 시스템:** E2E Test Runner Design System — Radix Themes **mint accent + slate gray**, Kibana/Grafana 계열 밀도.
이 문서에 없는 값은 임의로 만들지 말고 `design/tokens.css`(99개 변수)에서 찾는다. 자세한 규칙은 항상 `design-guide.md`를 먼저 읽는다.

## 0. 작업 전제 (반드시 준수)
1. 모든 색·간격·타입은 `var(--*)` 토큰으로 쓴다. 리터럴 hex 금지 (예외: `#fff` 위 대비용 아이콘 fill).
2. `tokens.css`를 `<head>`에서 로드하고 최상위 래퍼에 `data-theme="light|dark"`를 건다. 다크 값은 토큰이 알아서 바뀌므로 화면 코드에 다크 분기를 만들지 않는다.
3. 스타일은 **인라인 스타일만** 사용한다(클래스 기반 스타일시트 금지). `@font-face`/`@keyframes`/body reset만 `<style>`에 둔다.
4. 존재하지 않는 토큰명을 추측하면 `var()`가 조용히 실패한다 → tokens.css의 99개 변수 안에서만 고른다.
5. 신규 화면은 기존 화면 패턴을 재사용한다. 새 레이아웃 유형을 만들기 전에 §3의 골격 5종 중 맞는 것이 없는지 확인한다.

## 1. 토큰 소스 (canonical vs legacy)
- **canonical = `design/tokens.css`** — 신규 v2.0.0 화면은 전부 이것을 참조한다. 값 변경·삭제 금지, 추가만 허용.
- **legacy = `design/tokens.json`** — 기존 emerald/mobile-first 자산. 보존만 하고 신규 작업에 쓰지 않는다.
- 산출물로 `tokens.json`을 계속 갱신할 때도 **tokens.css의 값과 어긋나게 만들지 않는다**(중복 정의 시 tokens.css가 정본).

### 1.1 색 역할 분리 (가장 자주 틀리는 부분)
| 역할 | 토큰 | 쓰는 곳 |
|---|---|---|
| **액션(Primary)** = indigo | `--primary` / `--primary-fg` | 화면당 1개의 주요 CTA(`저장`, `추가`) |
| **브랜드/서피스 강조** = mint | `--accent-4`(배경) `--accent-11`(전경) `--accent-9`(아바타) | 활성 내비, 아바타, 카운트 배지, 텍스트 링크, hover |
| 페이지 배경 | `--background` | 최상위 래퍼 |
| 패널/카드 | `--surface-1` | 카드, 사이드바, 헤더, 입력 배경 |
| 경계선 | `--border` / `--border-strong`(입력·강조) | 카드 테두리, 구분선, 입력 테두리 |
| 본문/보조/미세 | `--foreground` / `--fg-muted` / `--gray-9` | 제목·본문 / 설명·메타 / 플레이스홀더·아이콘 |
| 중립 칩·트랙 | `--gray-3`(배경) `--gray-11`(전경) `--gray-4`(트랙) `--gray-7`(보조 버튼 테두리) | 태그, 미선택 칩, 게이지 트랙 |

> **indigo = 누르는 것, mint = 지금 여기 / 브랜드.** mint를 CTA로, indigo를 배경 강조로 쓰지 않는다.

### 1.2 상태 색 (의미 고정)
| 의미 | 전경 / 배경 | 도메인 용법 |
|---|---|---|
| 보유·완성 가능·성공 | `--status-success` / `--status-success-bg` | 매칭률 100%, 보유 배지, 추가 완료 |
| 임박·부족·주의 | `--status-warning` / `--status-warning-bg` | 유통기한 D-3~D-5, 부족 재료, 별점 |
| 만료·오류·파괴적 | `--status-danger` / `--status-danger-bg` | D-2 이내, 검증 오류, 삭제 영역 |
| 정보·안내 | `--status-info` / `--status-info-bg` | 기획 노트, 비파괴적 안내 |

**색만으로 상태를 전달하지 않는다** — 배지 텍스트(`보유`/`부족`/`D-2`)를 항상 함께 쓴다.

## 2. 타입 규격 (목업 실측값 · tokens.css `--fs-*`)
| 역할 | size / weight / letter-spacing | 비고 |
|---|---|---|
| 페이지 타이틀 | `22px / 700 / -0.02em` | 콘텐츠 안 좌상단(헤더가 아님) |
| 페이지 설명 | `13px / 400` `--fg-muted` | 타이틀 아래 `margin-top:4px`, 1줄 |
| 섹션 제목 | `14px / 600` | 카드/리스트 패널 헤더 |
| 카드 제목 | `15px / 600 / -0.01em` `line-height:1.35` | 레시피·재료 카드 |
| 본문 | `13~14px / 400` `line-height:1.55` | 기본 14px, 밀집 영역 13px |
| 메타·캡션 | `11~12px` `--fg-muted` | 카드 하단, 배지, 힌트 |
| 그룹 캡션(ALL CAPS) | `11px / 500` `uppercase` `letter-spacing:0.06em` `--gray-10` | 사이드바 섹션, 그룹 헤더 |
| KPI 값 | `24px / 700 / -0.02em` `tabular-nums` | 화면에서 가장 큰 글자. 24px 초과 금지 |

- 폰트 `--font-sans`(Pretendard), 수치·코드성 라벨은 `--font-mono`.
- **모든 수치(수량·D-day·매칭률·개수)에 `font-variant-numeric:tabular-nums`.** 단위는 값에 붙여 `13px`/`--fg-muted` span 처리.
- 긴 설명문에 `text-wrap:pretty`.

## 3. 레이아웃 골격 (신규 화면은 5종 중 하나를 고른다)
**공통 셸:** `[aside 256px sticky, surface-1, border-right] [header 64px sticky | main]`. 본문 `padding:24px; gap:24px; max-width:1400px`. 상단 내비 변형(top nav)에서도 본문이 깨지지 않게 설계한다.
1. **대시보드형(홈):** 페이지 헤더 → KPI 그리드 `repeat(auto-fit,minmax(200px,1fr)) gap16` → 2열 `repeat(auto-fit,minmax(320px,1fr)) gap24; align-items:start`.
2. **목록·탐색형(레시피 목록/마스터):** 페이지 헤더(+primary CTA) → 필터 바 카드(검색 `flex:1` + select + 칩 행) → 결과 요약 + 필터 초기화 → 카드 그리드 `repeat(auto-fill,minmax(230~250px,1fr)) gap16~20`. 빈 결과 = 점선 카드.
3. **상세형(레시피 상세):** `← 뒤로` → `grid repeat(auto-fit,minmax(320px,1fr))` 좌: 미디어 16:9 + 제목(24px) + 조리 순서 / 우: `position:sticky; top:88px` 요약·액션 패널.
4. **폼·편집형(마스터 수정):** `max-width:900px` → `← 뒤로` → 헤더 → `grid repeat(auto-fit,minmax(300px,1fr))` 좌: 폼 카드 / 우: 참조 패널 + **위험 영역**(`border:1px solid var(--status-danger)`).
5. **플로우형(식재료 추가):** `max-width:760px; margin:0 auto` 단일 컬럼 → 스텝 인디케이터 → 단계별 카드 1개 → 하단 `이전 / 주요 액션` → 완료 = 중앙 성공 카드.

## 4. 형태·간격·모션
- 라운드: 카드/패널 `--radius-4`(8), 버튼·입력 `--radius-3`(6), 배지·칩·아바타 `--radius-full`, 페이지 큰 컨테이너 `--radius-5`(12).
- **테두리 > 그림자.** 기본은 `1px solid var(--border)`, 그림자 없음. 클릭 가능한 카드만 hover에서 `--shadow-3` + `--border-strong`.
- 간격은 `--space-*`. 섹션 간 24, 카드 패딩 14~16, 카드 내 gap 9~10, 리스트 행 `10px 16px`. **flex/grid + gap으로만** (margin으로 형제 간격 금지).
- 모션: `--duration-normal` + `--ease-out`로 `box-shadow/border-color/background-color`만. 스케일·바운스·글로우 없음.
- 컨트롤 높이: 헤더/툴바 32, 폼 36, 칩 28, 카드 내 아이콘 버튼 26. 모바일 대응 화면은 44px 확보.
- 포커스: `:focus-visible { outline:2px solid var(--accent-8); outline-offset:2px }` — 어디서도 제거하지 않는다.

## 5. 컴포넌트 레시피 (요약 — 전체는 design-guide.md §5)
- **카드:** `surface-1` + `1px solid var(--border)` + `radius-4` + `padding 14~16` + `flex column gap 10`. 클릭 가능 시 hover 그림자.
- **버튼:** Primary=`--primary`/`--primary-fg`, Secondary=`transparent`/`--gray-12`/`border --gray-7`, Quiet=`--accent-11` 텍스트. 높이 32(툴바)/36(폼), `radius-3`.
- **칩:** `height:28; radius-full`. 선택=`--accent-4`/`--accent-11`/`border --accent-7`, 미선택=`transparent`/`--gray-11`/`border --border`.
- **배지:** `padding:2px 8px; radius-full; 11/600`. 상태=`status-*`+`status-*-bg`, 중립=`--gray-3`+`--gray-11`.
- **진행 바:** 트랙 `height:5~6; radius-full; --gray-4`, 필 `width:{pct}%`+상태 색. 항상 `보유 6 / 8` 텍스트 병기.
- **리스트 패널 / 표 / 수량 스테퍼 / 세그먼트 토글:** design-guide.md §5 참조.

## 6. 도메인 규칙 (신규 화면도 동일 계산)
- **매칭률** `= 보유 재료 / 전체 재료 × 100`. `100%→success`, `60~99%→warning`, `<60%→--gray-9`. 100%만 "만들 수 있는 레시피".
- **유통기한 D-day** `d<=2→danger`, `d<=5→warning`, 그 외 `success`. 라벨 `d<=0→오늘` 아니면 `D-{d}`. 임박 기준 D-3, 항상 실데이터에서 계산(하드코딩 금지).
- **식재료 마스터 ≠ 내 식재료** — 마스터=표준 사전(이름·별칭·카테고리·기본 단위·kcal), 내 식재료=실제 보유(수량·유통기한·위치). 문구에서 섞지 않는다.

## 7. 카피 규칙
- 해요체 + 명령형 버튼 동사(`저장`/`추가`/`요리 시작`). 상태를 사실대로 서술.
- 단위 붙여쓰기(`12종`, `15분`, `320 kcal`, `D-2`), 상대 시간(`12분 전`).
- **이모지·감탄사·마케팅 형용사 금지.** 아이콘은 1.5~1.8 stroke 라인 SVG. 조사(`을/를`, `이/가`, `으로/로`) 자동 분기.

## 8. 산출물 규칙 (기존 출력 contract 유지 · v2.0.0으로 채운다)
디자이너의 출력 파일 집합은 그대로 유지하되 내용을 v2.0.0으로 맞춘다.
- **design/tokens.css** — canonical 토큰(v2.0.0). 추가만 허용.
- **design/tokens.json** — legacy 보존(신규 값 tokens.css와 어긋나지 않게).
- **design/user-flows.md** — 화면 흐름(mermaid) + 화면 목록.
- **design/wireframes/<화면명>.html** — 화면별 와이어프레임. 파일 상단 주석에 유저스토리 ID(`<!-- US-001 -->`)와 골격 유형·버전(`<!-- skeleton: 목록형 / v2.0.0 -->`)을 기재. `data-theme` 래퍼 + tokens.css 참조 + 인라인 스타일. 실데이터 예시, **기본/로딩(스켈레톤)/빈 상태(아이콘 32px + 1차 액션)/오류(danger 테두리 + 재시도)** 4상태 포함.
- **design/components.md** — 컴포넌트 스펙(FE 계약): 이름 / props / 상태(default·hover·focus·disabled·loading) / 반응형 / 사용 토큰 목록.

### 기능 단위 화면 기획 포맷 (와이어프레임 문서와 동일)
각 기능 블록은 아래 4항목을 명시한다 — **화면 흐름(IA)** / **주요 요소** / **상태·예외** / **기획 노트**. 공통 규칙은 모든 블록에 동일 적용.

## 9. 신규 화면 추가 체크리스트
1. §3 골격 5종 중 하나 선택. 2. 페이지 헤더(타이틀 22/700 + 설명 1줄 + 우측 액션)로 시작.
3. 데이터 위젯마다 4상태 정의. 4. 새 색·새 폰트 크기·새 라운드 값을 만들지 않았는지 확인.
5. 사이드바 진입점 섹션(`개요`/`요리`/`식재료`) 결정. 6. light/dark 두 테마 확인(토큰만 썼다면 자동).

## 10. 안티패턴
그라디언트·글로우·스케일/바운스 · 24px 초과 디스플레이 타입 · 화면당 2개 이상 primary CTA · 그림자로 카드 띄우기(테두리를 쓴다) · 임의 hex · 클래스 스타일시트 · 이모지/직접 그린 일러스트 · 마스터/내 식재료 용어 혼용 · 부분 매칭을 "만들 수 있는 레시피"로 표기.

## 11. 접근성 체크리스트
- [ ] 텍스트 대비율 4.5:1 이상(큰 텍스트 3:1)
- [ ] 모든 인터랙티브 요소 키보드 접근 + `:focus-visible` 포커스 링 유지
- [ ] 이미지 대체 텍스트, 폼 라벨 연결, 아이콘 단독 버튼에 `title`/`aria-label`
- [ ] 터치 타겟 최소 44×44px(모바일), 데스크톱 26px + hit padding
- [ ] 상태는 색 + 텍스트 병기, 진행 바는 수치 병기

## 12. 미확정 항목 (가정하지 말고 표시)
① 레시피 실사진 소스(현재 전부 플레이스홀더) ② 카드 스타일 확정(사진형/컴팩트) ③ 다크 모드 지원 범위 ④ 영양 정보 노출 여부 ⑤ 로그인·권한 게이트 UI.
