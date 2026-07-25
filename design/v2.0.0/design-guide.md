# 레시피 상자 — Design Token & Layout Guide

**용도:** 디자이너 에이전트가 이 서비스에 **새 기능 화면을 추가할 때** 읽는 규격서.
**기준 산출물:** `레시피 상자.dc.html`(고충실도 목업) · `RecipeCard.dc.html`(카드) · `tokens.css`(토큰) · `레시피 상자 와이어프레임.dc.html`(기능별 화면 기획).
**상위 시스템:** E2E Test Runner Design System (Radix Themes mint accent + slate gray, Kibana/Grafana 계열 밀도). 이 문서에 없는 값은 임의로 만들지 말고 `tokens.css`에서 찾는다.

---

## 0. 작업 전제 (반드시 준수)

1. **모든 색·간격·타입은 `var(--*)` 토큰으로 쓴다.** 리터럴 hex 금지 (예외: `#fff` 위 대비용 아이콘 fill).
2. `tokens.css`를 `<helmet>`에서 로드하고, 최상위 래퍼에 `data-theme="light|dark"`를 걸어 테마를 전환한다. 다크 값은 토큰이 알아서 바뀌므로 화면 코드에 다크 분기를 만들지 않는다.
3. 스타일은 **인라인 스타일만** 사용한다(클래스 기반 스타일시트 금지). `@font-face`/`@keyframes`/body reset만 `<helmet><style>`.
4. 존재하지 않는 토큰명을 추측하면 `var()`가 조용히 실패한다 → `tokens.css`의 99개 변수 안에서만 고른다.
5. 신규 화면은 기존 7개 화면(홈 / 레시피 목록 / 레시피 상세 / 식재료 마스터 / 마스터 수정 / 내 식재료 / 식재료 추가)의 **패턴을 재사용**한다. 새 레이아웃 유형을 만들기 전에 §4의 5가지 골격 중 맞는 것이 없는지 확인한다.

---

## 1. 색 토큰 사용 규약

### 1.1 역할 분리 (가장 자주 틀리는 부분)

| 역할 | 토큰 | 쓰는 곳 |
|---|---|---|
| **액션(Primary)** = indigo | `--primary` / `--primary-fg` | 화면당 1개의 주요 CTA (`+ 식재료 추가`, `저장`, `냉장고에 추가`) |
| **브랜드/서피스 강조** = mint | `--accent-4`(배경) `--accent-11`(전경) `--accent-9`(아바타) | 활성 내비, 아바타, 카운트 배지, 텍스트 링크, 검색 결과 hover |
| 페이지 배경 | `--background` | 최상위 래퍼 |
| 패널/카드 | `--surface-1` | 카드, 사이드바, 헤더, 입력 배경 |
| 경계선 | `--border` (기본) / `--border-strong` (입력·강조) | 카드 테두리, 구분선, 입력 테두리 |
| 본문/보조/미세 | `--foreground` / `--fg-muted` / `--gray-9` | 제목·본문 / 설명·메타 / 플레이스홀더·아이콘 |
| 중립 칩·트랙 | `--gray-3`(배경) `--gray-11`(전경) `--gray-4`(진행바 트랙) `--gray-7`(보조 버튼 테두리) | 태그, 미선택 칩, 게이지 트랙 |

> mint를 CTA 색으로, indigo를 배경 강조로 쓰지 않는다. **indigo = 누르는 것, mint = 지금 여기 / 브랜드.**

### 1.2 상태 색 (의미 고정)

| 의미 | 전경 / 배경 | 도메인 용법 |
|---|---|---|
| 보유 · 완성 가능 · 성공 | `--status-success` / `--status-success-bg` | 매칭률 100%, 보유 재료 배지, 추가 완료 |
| 임박 · 부족 · 주의 | `--status-warning` / `--status-warning-bg` | 유통기한 D-3~D-5, 부족 재료, 별점 아이콘 |
| 만료 · 오류 · 파괴적 | `--status-danger` / `--status-danger-bg` | D-2 이내, 검증 오류, 삭제 영역 |
| 정보 · 안내 | `--status-info` / `--status-info-bg` | 기획 노트, 비파괴적 안내 |

**색만으로 상태를 전달하지 않는다** — 배지 텍스트(`보유`/`부족`/`D-2`)를 항상 함께 쓴다.

---

## 2. 타입 규격 (목업 실측값)

| 역할 | size / weight / letter-spacing | 비고 |
|---|---|---|
| 페이지 타이틀 | `22px / 700 / -0.02em` | 본문 영역 좌상단. 헤더가 아니라 콘텐츠 안에 둔다 |
| 페이지 설명 | `13px / 400`, `--fg-muted` | 타이틀 아래 `margin-top:4px`, 1줄 |
| 헤더 페이지명 / 서브 타이틀 | `16px / 600 / -0.01em` | 헤더 breadcrumb(`11px`, `--fg-muted`) 아래 |
| 섹션 제목 | `14px / 600` | 카드 헤더, 리스트 패널 헤더 |
| 카드 제목 | `15px / 600 / -0.01em`, `line-height:1.35` | 레시피·재료 카드 |
| 본문 | `13~14px / 400`, `line-height:1.55` | 기본 14px, 밀집 영역 13px |
| 메타·캡션 | `11~12px`, `--fg-muted` | 카드 하단, 배지, 힌트 |
| 그룹 캡션(ALL CAPS) | `11px / 500`, `text-transform:uppercase`, `letter-spacing:0.06em`, `--gray-10` | 사이드바 섹션, 카테고리 그룹 헤더 |
| KPI 값 | `24px / 700 / -0.02em`, `font-variant-numeric:tabular-nums` | 화면에서 가장 큰 글자. 이보다 큰 타입은 만들지 않는다 |

- 폰트: `--font-sans`(Pretendard). 숫자·코드성 라벨은 `--font-mono`.
- **모든 수치(수량·D-day·매칭률·개수)에 `font-variant-numeric:tabular-nums`.**
- 단위는 값에 붙여 쓰고 별 span으로 `13px`, `--fg-muted` 처리: `12` + `종`.
- 긴 설명문에는 `text-wrap:pretty`.

---

## 3. 형태 · 간격 · 모션

- **라운드:** 카드/패널 `8px`, 버튼·입력·작은 컨트롤 `6px`, 배지·칩·아바타 `9999px`, 페이지 레벨 큰 컨테이너 `12px`.
- **테두리 > 그림자.** 기본 상태는 `1px solid var(--border)`, 그림자 없음. 클릭 가능한 카드만 hover에서 `--shadow-3` + `--border-strong`.
- **간격 스케일:** 4 / 8 / 12 / 16 / 20 / 24 (`--space-*`). 섹션 간 `24px`, 카드 내부 패딩 `14~16px`, 카드 내 요소 `gap 9~10px`, 리스트 행 `10px 16px`.
- **레이아웃은 flex/grid + `gap`으로만.** margin으로 형제 간격을 만들지 않는다.
- **모션:** `200ms cubic-bezier(.4,0,.2,1)`(= `--duration-normal` / `--ease-out`)로 `box-shadow, border-color, background-color`만. 스케일·바운스·글로우 없음.
- **컨트롤 높이:** 헤더/툴바 `32px`, 폼 입력·폼 버튼 `36px`, 칩 `28px`, 카드 내 아이콘 버튼 `26px`. 모바일 대응 화면은 44px 확보.
- **포커스:** `:focus-visible { outline:2px solid var(--accent-8); outline-offset:2px }` — 모든 인터랙티브 요소에서 제거하지 않는다.

---

## 4. 레이아웃 골격

### 4.0 공통 셸
```
[aside 240px sticky, surface-1, border-right]  [ header 64px sticky top z-40 | main ]
```
- 사이드바: 로고(26px hexagon+냄비) → 조직 스위처 → 섹션 그룹(`개요` / `요리` / `식재료`) → flex:1 → 사용자 블록. 내비 아이템 `padding:7px 12px`, `radius 6px`, 활성 = `--accent-4` 배경 + `--accent-11` 전경 + 600, 우측 카운트 배지(`10px`, pill).
- 헤더: 좌측 breadcrumb+페이지명, `flex:1` 스페이서, 우측 검색(`220x32`)·테마 토글(`32x32`)·아바타(`30px`).
- 본문: `padding:24px; gap:24px; max-width:1400px`.
- **상단 내비 변형(top nav)**도 지원한다 — 신규 화면은 두 변형 모두에서 깨지지 않게 본문만 설계한다.

### 4.1 대시보드형 (홈)
`페이지 헤더(타이틀+액션 2버튼)` → `KPI 그리드 repeat(auto-fit,minmax(200px,1fr)) gap16` → `2열 repeat(auto-fit,minmax(320px,1fr)) gap24; align-items:start` (좌: 카드 그리드 섹션 / 우: 리스트 패널 스택).

### 4.2 목록·탐색형 (레시피 목록, 마스터)
`페이지 헤더(+ primary CTA)` → **필터 바 카드**(검색 `flex:1 min-width:220px` + select + 토글, 그 아래 카테고리 칩 행) → `결과 요약 + 필터 초기화` → `카드 그리드 repeat(auto-fill,minmax(230~250px,1fr)) gap16~20`.
빈 결과: 점선 카드 `border:1px dashed var(--border-strong)`, `padding:48px 16px`, 아이콘 32px `--gray-8`, 제목 15/600, 설명 13 muted, 1차 액션 버튼.

### 4.3 상세형 (레시피 상세)
`← 뒤로` → `grid repeat(auto-fit,minmax(320px,1fr))` 좌: 미디어 16:9 + 메타/제목(24px) + 조리 순서 패널 / 우: **`position:sticky; top:88px`** 요약·액션 패널(진행 바 + 항목 리스트 + CTA) + 작성자 카드.
사진 자리는 `--gray-3` 배경 + 아이콘 + `사진 없음` 라벨(현재 전 화면 플레이스홀더).

### 4.4 폼·편집형 (마스터 수정)
`max-width:900px` → `← 뒤로` → `헤더(제목 + 영향 범위 설명 + 취소/저장)` → `grid repeat(auto-fit,minmax(300px,1fr))` 좌: 기본 정보 폼 카드(라벨 `12px/500 muted` + 필드 `36px`, 2열은 `1fr 1fr gap12`) / 우: 참조 정보 패널 + 보조 액션 + **위험 영역**(`border:1px solid var(--status-danger)`, 사유 명시, 불가 시 비활성).

### 4.5 플로우형 (식재료 추가)
`max-width:760px; margin:0 auto` 단일 컬럼 → 스텝 인디케이터(원형 22px 번호 + 라벨 12px + `flex:1` 연결선) → 단계별 카드 1개만 노출 → 하단 `이전 / 주요 액션`(좌우 분리, 상단 `border-top`) → 완료 단계는 중앙 정렬 성공 카드(44px 원형 아이콘 `--status-success-bg`) + 후속 제안 카드 그리드.

---

## 5. 컴포넌트 레시피

**카드(기본)**
```
background:var(--surface-1); border:1px solid var(--border); border-radius:8px; padding:14~16px;
display:flex; flex-direction:column; gap:10px
/* 클릭 가능 시 */ cursor:pointer; transition:box-shadow 200ms var(--ease-out)
style-hover="box-shadow:var(--shadow-3);border-color:var(--border-strong)"
```

**KPI 카드** — 라벨 `13/500 muted` + 우상단 델타(`11/600`, 증가 success·감소 danger) → 값 `24/700 tabular-nums` + 단위 → 각주 `11 muted`.

**리스트 패널** — `overflow:hidden` 카드 안에 `헤더(padding:12px 16px; border-bottom)` + 행(`padding:10px 16px; border-bottom`) 반복 + 마지막 `푸터 액션(32px 보조 버튼, width:100%)`. 행 hover는 `--gray-2`.

**버튼**
- Primary: `background:var(--primary); color:var(--primary-fg); border:1px solid var(--primary)`
- Secondary: `background:transparent; color:var(--gray-12); border:1px solid var(--gray-7)`
- Quiet(텍스트): `background:none; border:none; color:var(--accent-11); font-size:12px`
- 공통: `height:32px(툴바)/36px(폼); padding:0 12~14px; border-radius:6px; font-size:13px; font-weight:500~600`

**입력/셀렉트** — `height:32/36px; padding:0 10px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface-1); font-size:13~14px`. 검색은 좌측 15~16px 아이콘 + `padding-left:30~34px`.

**칩(카테고리 필터)** — `height:28px; padding:0 12px; radius:9999px; font-size:12/500`. 선택 = `--accent-4`/`--accent-11`/`border --accent-7`, 미선택 = `transparent`/`--gray-11`/`border --border`.

**배지** — `padding:2px 8px; radius:9999px; font-size:11/600`. 상태 배지는 `status-*-bg` + `status-*`, 중립 태그는 `--gray-3` + `--gray-11`.

**진행 바(매칭률·잔여기간)** — 트랙 `height:5~6px; radius:9999px; background:var(--gray-4); overflow:hidden`, 필 `width:{pct}%` + 상태 색. 바 위에는 항상 `보유 6 / 8` 같은 텍스트를 병기한다.

**세그먼트 토글(카드/표)** — `border:1px solid var(--gray-7); radius:6px; overflow:hidden`, 내부 버튼 `height:32px; padding:0 10px`, 선택 = `--accent-4`/`--accent-11`, 구분선 `border-left`.

**표** — 카드 안 `display:grid` 행. 헤더 `background:var(--gray-2); font-size:11; uppercase; letter-spacing:0.04em; --fg-muted`, 데이터 행 `padding:10px 16px; font-size:13; border-bottom`. 행 높이 약 40px, 숫자 tabular-nums.

**수량 스테퍼** — `26x26` 보조 버튼 `−`/`+`, 값은 `13/600 tabular-nums`, 카드 하단 `border-top:1px solid var(--border); padding-top:10px` 영역에 배치.

---

## 6. 도메인 규칙 (신규 화면에서도 동일하게 계산)

- **매칭률** `pct = 보유 재료 수 / 전체 재료 수 × 100`.
  색: `100% → --status-success`, `60~99% → --status-warning`, `<60% → --gray-9`(배경 `--gray-3`).
  100%일 때 카드에 `지금 바로 만들 수 있어요`, 미달이면 `부족 · {재료명}`.
- **유통기한 D-day** `d<=2 → danger`, `d<=5 → warning`, 그 외 `success`. 라벨은 `d<=0 → 오늘`, 그 외 `D-{d}`.
  **임박 목록/카운트 기준은 D-3 이내**이며 항상 실데이터에서 계산한다(하드코딩 금지).
  잔여기간 게이지 = `days / shelfLife`, 최소 4% 최대 100%.
- **"만들 수 있는 레시피"는 매칭률 100%만.** 추가 완료·홈 추천에 부분 매칭을 섞지 않는다.
- **식재료 마스터 ≠ 내 식재료.** 마스터는 레시피가 참조하는 표준 사전(이름·별칭·카테고리·기본 단위·kcal·기본 보관), 내 식재료는 실제 보유(수량·유통기한·보관 위치). 화면 문구에서 두 개념을 섞지 않는다.
- **데이터 방향:** 내 식재료 → 매칭률 → (홈 KPI·추천 / 목록 정렬 / 상세 재료 패널). 새 기능도 이 흐름에 접속시킨다.

---

## 7. 카피 규칙

- 해요체(`~하세요`, `~합니다`), 명령형 버튼 동사(`저장`, `추가`, `요리 시작`).
- 상태를 사실대로: `조건에 맞는 레시피가 없습니다.` / `레시피 4개에서 사용 중이라 삭제할 수 없습니다.`
- 단위 붙여쓰기(`12종`, `15분`, `320 kcal`, `D-2`), 상대 시간(`12분 전`).
- **이모지·감탄사·마케팅 형용사 금지.** 아이콘은 1.5~1.8 stroke의 라인 SVG.
- 한국어 조사 자동 처리: `을/를`, `이/가`, `으로/로`는 앞 글자 종성으로 결정 — 문장을 문자열로 조립할 때 반드시 분기한다.

---

## 8. 접근성

- 터치 타깃 44px(모바일 화면), 데스크톱 최소 26px + 충분한 hit padding.
- 포커스 링 유지, 키보드만으로 전 플로우 이동 가능.
- 상태는 색 + 텍스트 병기, 진행 바는 수치 병기.
- 아이콘 단독 버튼에는 `title`/`aria-label`.

---

## 9. 신규 화면 추가 체크리스트

1. §4의 골격 5종 중 하나를 고른다(대시보드 / 목록 / 상세 / 폼 / 플로우).
2. 페이지 헤더(타이틀 22/700 + 설명 1줄 + 우측 액션)로 시작한다.
3. 데이터 위젯마다 **기본 / 로딩(형태 유지 스켈레톤) / 빈 상태(아이콘 32px + 1차 액션) / 오류(danger 테두리 + 재시도)** 4상태를 정의한다.
4. 새 색·새 폰트 크기·새 라운드 값을 만들지 않았는지 확인한다.
5. 사이드바 내비에 진입점이 필요한지, 어느 섹션(`개요`/`요리`/`식재료`)에 들어가는지 정한다.
6. light/dark 두 테마에서 확인한다(토큰만 썼다면 자동).
7. 레시피 카드가 필요하면 `RecipeCard.dc.html`을 재사용한다(props: `recipe`, `variant`(photo|compact), `showNutrition`, `onOpen`).

## 10. 안티패턴

- 그라디언트 배경, 글로우, 스케일/바운스 애니메이션
- 24px보다 큰 디스플레이 타입, 화면당 2개 이상의 primary CTA
- 그림자로 카드를 띄우기(테두리를 쓴다), 임의 hex, 클래스 스타일시트
- 이모지·SVG 일러스트 직접 그리기(사진은 플레이스홀더 유지 — 실사진은 미확정 항목)
- 마스터/내 식재료 용어 혼용, 부분 매칭 레시피를 "만들 수 있는 레시피"로 표기

---

## 11. 미확정 항목 (디자인 시 가정하지 말고 표시)

① 레시피 실사진 소스(현재 전부 플레이스홀더) ② 카드 스타일 확정(사진형/컴팩트) ③ 다크 모드 지원 범위 ④ 영양 정보 노출 여부 ⑤ 로그인·권한 게이트 UI.
