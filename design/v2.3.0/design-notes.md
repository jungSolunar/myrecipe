# v2.3.0 디자인 노트 — 레시피 상자 기능 확장 (G2)

- **버전/브랜치:** v2.3.0 · 정본 규격 `design/v2.0.0/design-guide.md` + `design/tokens.css`(99토큰)
- **원칙:** Additive-Only. `design/v2.0.0/*`는 불변 보존, 신규 산출물은 `design/v2.3.0/`에만 추가.
- **토큰:** 모든 색·간격·타입은 tokens.css `var(--*)`만 사용(리터럴 hex 금지, 예외 `#fff`/`#ffffff` 대비용 아이콘 fill). 각 목업은 리뷰용으로 토큰 블록을 인라인 복사했으며 **값은 변경하지 않음**.
- **테마:** 최상위 `data-theme="light"` 래퍼 + tokens.css. 다크는 토큰이 자동 전환(화면 코드에 다크 분기 없음).
- **비로그인 기본:** 신규 필드/개인화 기능은 로그인 시 노출. 비로그인은 기존 화면 그대로(신규 필드 숨김). 각 화면에 로그인 게이트 상태 표기.

---

## 화면별 US/AC 커버 & 골격

### 1. `wireframes/home.html` — 홈 대시보드 (US-018)
- **골격(§4.1) 대시보드형:** 페이지 헤더 → KPI 그리드 `repeat(auto-fit,minmax(200px,1fr))` → 2열 `dashgrid`(좌: 지금 만들 수 있는 레시피 / 우: 패널 스택).
- **커버 AC:**
  - US-018 AC1 — KPI 4종: 등록 레시피 / 지금 만들 수 있는 레시피(매칭률 100%만, 성공색) / 내 재고 종수 / 임박 재료(D-3, 경고색).
  - US-018 AC2 — 패널 3종: 지금 만들 수 있는 레시피(조리시간·보유 N/N·별점 표기), 유통기한 임박(D-day 배지+보관위치 태그), 최근 추가한 레시피(조리시간+상대시간).
  - US-018 AC3 — 집계 규칙 note(매칭률 100%·D-3, design-guide §6, 하드코딩 금지) 명시.
  - US-018 AC4 — 상태 A: 비로그인 게이트 카드(로그인 필수, 레시피 목록은 열람 가능 안내).
  - 정합화: 조리시간(US-014)·평균 별점(US-015)을 카드/패널에 신규 필드로 표기.
- **상태:** 기본 / 로딩(스켈레톤) / 첫 방문 빈 / 집계 오류(danger) / 비로그인 게이트.

### 2. `wireframes/recipe-detail.html` — 상세 (US-015·019·020·014)
- **골격(§4.3) 상세형:** 좌(미디어16:9 + 제목24px + dmeta + 조리순서 + **평점 카드**) / 우 `sticky top:88px`(재료 준비 상태 = 매칭 진행바 + 재료 리스트 + CTA).
- **커버 AC:**
  - US-014 — dmeta에 "15분" 조리시간 표기.
  - US-015 — 평점 카드: 회원 평균(4.3, 별 아이콘 + "회원 12명 평가") + 내 평점 입력(1~5 radiogroup) + "평점 저장"(secondary) + "1인 1평점, 재저장 시 갱신" 안내. 상태 B: 평가 없음(0건). 상태 E: 저장 실패 + 엔드포인트.
  - US-020 — 매칭 진행바 "보유 X / 필요 Y" + 100%=성공색+"지금 가능" 배지. 상태 A: 75%(warning), 비로그인/재고0은 숨김(상태 C).
  - US-019 — 부족 0: "요리 시작"(primary)만(상태 기본). 부족 有: "부족한 재료 추가하기"(secondary) → `inventory.html?wizard=1&prefill=` 위저드 연결(상태 A).
  - US-003/019 AC4 — 상태 C: 비로그인/비소유자는 재고·평점 입력 숨김, 열람 유지.
- **primary CTA 1개 규칙:** "요리 시작"만 primary. 평점 저장·부족 재료 추가는 secondary.

### 3. `wireframes/recipe-form.html` — 등록/수정 폼 (US-014)
- **골격(§4.4) 폼·편집형:** `max-width:900px`, 좌 폼 스택 / 우 참조 패널.
- **커버 AC:** US-014 — 기본 정보 카드에 카테고리+조리시간(분) 2열. `type=number min=0 step=1` + "분" suffix + "정수(분)·비우면 표시 생략" 힌트(nullable). 상태 A: 음수/소수 검증 오류(danger). 계약 note(`cook_time_minutes`, types.ts 주석 갱신 예정).
- **부수 정합:** 재료 검색 placeholder를 "재료 이름·별칭 검색"으로, picker에 별칭 표기(US-016 연계).
- **상태:** 기본 / 조리시간 오류 / 제목 누락 / 저장 중(스피너) / 비로그인 게이트.

### 4. `wireframes/ingredient-master.html` — 마스터 + 수정 (US-016)
- **골격(§4.2 목록·탐색형 + §5 표).**
- **커버 AC:**
  - US-016 AC1 — 새 식재료 추가 폼에 100g당 kcal·기본 보관방법(냉장/냉동/실온 select)·별칭(칩 복수 입력)·메모(textarea). 목록 표에 별칭·kcal·기본 보관 컬럼 추가.
  - US-016 AC2 — 검색 placeholder "재료명 또는 별칭으로 검색", picker 별칭 노출(별칭 검색).
  - US-016 AC3 — 미입력 필드는 "미입력/별칭 없음"으로 표기(모두 nullable, 백필 없음 note).
  - US-016 AC4 — 보관방법은 냉장/냉동/실온 3종 select로만 저장(그 외 거부 안내).
  - 마스터 수정 — 상태 A: 인라인 행 편집에 확장 필드 전부 노출.
- **상태:** 기본 / 인라인 수정 / 중복 이름(danger) / 참조 중 삭제 영향(warning) / 빈 마스터 / 로딩·실패.
- **용어 가드:** "기본 보관방법(마스터)" ≠ "보관위치(재고)"를 note로 명시(§6 마스터≠내 식재료).

### 5. `wireframes/inventory.html` — 내 재고 (US-017·021·022)
- **골격(§4.2 표 + §4.5 플로우형 위저드).**
- **커버 AC:**
  - US-017 — 빠른 추가 폼 + 표에 보관위치(냉장실/냉동실/실온) 컬럼. 미선택 "미입력"(nullable). "표시·관리용, 매칭 판정 미반영" 힌트. 인라인 수정(상태 B)에도 보관위치 select.
  - US-021 — 재고 각 행 돋보기 아이콘 링크 = "이 재료로 만들 수 있는 레시피"(`recipe-list.html?ingredient_id=`). 상태 A: 역탐색 결과 없음 빈 상태.
  - US-022 — 재고 추가 위저드: Step1 재료선택 → Step2 수량·단위 → Step3 유통기한·보관위치 → 완료 "이제 이런 레시피를 만들 수 있어요"(매칭률 100%로 새로 가능해진 레시피 카드). AC3: 새로 가능해진 레시피 없으면 추천 생략 note. US-019 연계: 부족 재료 프리필 note.
- **상태:** 기본 / 위저드 4스텝 / 역탐색 결과 없음 / 인라인 수정 / 마스터 없음 / 빈 재고 / 로딩·실패.

---

## 신규 컴포넌트 스펙 (FE 계약 관점)

### 별점 — 표시 (`.rating`)
- 구조: `.stars`(라인 SVG 별 5개, 채움=`fill:var(--status-warning)`, 빈=`stroke:var(--gray-8)`) + `.ratingval`(평균, tabular-nums) + `.ratingcount`("평가 N개"/"(N)"). 0건은 `.ratingnone` "평가 없음".
- **색만으로 전달 금지:** 별 아이콘 옆에 숫자 평균 + 평가 수 텍스트를 **항상** 병기. 별 묶음은 `aria-hidden`, 수치 텍스트가 접근성 소스.
- 반올림: 별 채움은 반올림 표시, **숫자 평균이 authoritative**(정밀값).

### 별점 — 입력 (`.rateinput`, `role="radiogroup"`)
- 5개 `button[role=radio]`, 선택 값에 `aria-checked="true"`, 나머지 false. 시각적으로 선택값 이하 별은 `.on`(warning) 채움.
- **키보드:** 로빙 tabindex(선택 항목만 `tabindex=0`), 좌/우(또는 상/하) 화살표로 1~5 이동, Space/Enter 확정. `aria-labelledby`로 "내 평점" 라벨 연결, 각 별 `aria-label="별 N개"`.
- 저장 버튼은 secondary(상세 primary는 "요리 시작"). "1인 1평점 · 재저장 시 갱신" 안내 문구.

### 매칭 진행바 (`.matchrow/.track/.fill`)
- home 정본 패턴 재사용. 트랙 `height:6px; --gray-4`, 필 `width:{pct}%` + 상태색. **항상 "보유 X / 필요 Y" 수치 병기.**
- 색 규칙(§6): 100%→success + "지금 가능" 배지, 60~99%→warning, <60%→`--gray-9`. **100%만** "만들 수 있는 레시피".

### 위저드 스텝 (`.stepper` / `.stepnode` / `.stepdot` / `.stepline`)
- §4.5 플로우형. 원형 22px 번호 + 라벨 12px + `flex:1` 연결선. 상태: 기본(gray-3) / active(accent-4+accent-11) / done(success-bg + 체크 아이콘). 하단 `.wizfoot` = 이전/다음(주요 액션) 좌우 분리 + `border-top`.
- 완료 단계 = `.successcard`(44px 원형 `--status-success-bg` 아이콘) + 후속 추천 카드 그리드. `max-width:760px; margin:0 auto`.
- 보관위치 선택은 세그먼트 토글(`.seg`, `role=group`, `aria-pressed`) — 3종 고정 값.

### 대시보드 KPI 카드 (`.kpicard`)
- 라벨 `13/500 muted` + (선택)우상단 델타(`11/600` 증가=success) → 값 `24/700 tabular-nums`+단위 → 각주 `11 muted`. 값 색: "지금 만들 수 있는"=success, "임박 재료"=warning.

### 정렬 옵션 (필터바 sort select — 기존 recipe-list.html 필터바에 additive)
- 기존 정렬 select에 **옵션만 추가**: `조리시간 짧은순`, `평점 높은순`. 값 없는 레시피(조리시간 null·평가 0건)는 **뒤로 배치**. 별도 UI 신설 없음. (recipe-list는 v2.0.0 보존 화면이라 v2.3.0 목업 미신설 — 옵션 사양만 명세; backend-dev sort 파라미터와 정합 필요.)

---

## 접근성 체크
- 색+텍스트 병기: 매칭 배지("지금 가능"/"부족·{재료}"), D-day("D-2"/"만료"), 별점(숫자+평가수), 보관위치/보관방법 태그 텍스트.
- 별점 입력: radiogroup + 화살표 키 + `aria-checked` + 별당 `aria-label`. 별 표시는 `aria-hidden`, 수치가 접근성 값.
- 포커스: 전 인터랙티브 요소 `:focus-visible {outline:2px solid var(--accent-8)}` 유지(공통 셸).
- 아이콘 단독 컨트롤: 역탐색 돋보기·테마 토글·별칭 삭제 등에 `title`+`aria-label`.
- 대비: 본문·배지 전경/배경 tokens.css 조합(4.5:1) 유지. 표·KPI 수치 tabular-nums.
- 터치: 데스크톱 컨트롤 26~36px, 별점 입력 버튼 34px hit area.

## 규격 준수 확인
- indigo=CTA(`--primary`), mint=브랜드/활성(`--accent-*`), 상태색 의미 고정. 리터럴 hex 없음(대비용 `#fff` 예외).
- 화면당 primary CTA 1개(상세=요리 시작, 폼=저장, 재고=추가). 24px 초과 디스플레이 타입 없음. 그라디언트·글로우·스케일 애니메이션 없음.
- 매칭 판정 단일 규칙(매칭률 100%·동일 단위 비교) 대시보드·상세·위저드 공유. 보관위치·유통기한은 매칭 미반영.
