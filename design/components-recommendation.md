# 컴포넌트 스펙 — 추천 필터 (US-013) [Could]

v1.2.0 G2 확장 스펙. **기존 `design/components.md`를 대체하지 않고 보완**한다.
US-013 "보유 재료로 만들 수 있는 레시피 추천/필터"를 **기존 recipe-list 화면의 SearchFilterBar에 필터로 통합**하는 디자인 계약이다.

- 모든 색상·간격·타이포·반경은 **`design/tokens.json`의 기존 토큰만** 사용한다(신규 토큰·하드코딩 금지). 와이어프레임은 토큰을 CSS 커스텀 프로퍼티(`--c-*`, `--s-*`, `--r-*`)로 매핑한다.
- 회귀 방지: 기존 `SearchFilterBar`/`RecipeCard`는 수정하지 않고 **추가 요소(토글·배지·정렬·상태)로 확장(composition)**한다.
- 참고 화면: `design/wireframes/recipe-list-recommend.html`(신규). 기존 `recipe-list.html`은 불변.

---

## 1. RecommendFilterToggle (신규 — SearchFilterBar에 추가)

기존 `.filters` 영역(카테고리/재료 Select 옆)에 **추가되는 단일 토글 항목**. 기존 필터 항목은 그대로 두고 우측(모바일은 아래 줄)에 배치한다.

- **패턴**: 스위치형 체크박스. 시맨틱은 네이티브 `<input type="checkbox" role="switch">` + 연결된 `<label>`. 시각만 스위치 트랙/노브로 스타일링(스크린리더는 on/off 상태 전달).
- **라벨 텍스트**: `만들 수 있는 레시피만` (보조 캡션: `내 재고로 부족 없이 만들 수 있는 것`).
- **props**: `checked`(bool), `disabled`(bool), `disabledReason`(`guest` | `no-inventory` | null), `matchCount?`(number, on일 때 헤더 결과 수와 동기).

### 상태
| 상태 | 조건 | 시각 | 접근성 |
|---|---|---|---|
| off (default) | 로그인 + 재고 보유, 미적용 | 트랙 `neutral.300`, 노브 `neutral.0`(흰), 라벨 `neutral.700` | `aria-checked="false"` |
| on (active) | 필터 적용됨 | 트랙 `primary.600`, 노브 흰, 라벨 `neutral.900` + 좌측 체크 아이콘 | `aria-checked="true"`, 상태 변경 시 결과 수 `aria-live`로 통지 |
| focus | 키보드 포커스 | 전역 포커스 링(`2px solid focus.ring` + 2px offset)을 스위치 전체에 | `:focus-visible` |
| hover | off→트랙 `neutral.400`, on→트랙 `primary.700` | — |
| disabled (비로그인) | `disabledReason="guest"` | 트랙 `neutral.200`, 라벨 `neutral.500`, `cursor:not-allowed`, 좌측 자물쇠 아이콘 | `disabled` + `aria-describedby`→툴팁, 툴팁 텍스트 스크린리더 노출 |
| disabled (재고 없음) | `disabledReason="no-inventory"` | 위와 동일 시각 | `disabled` + `aria-describedby`→툴팁 |

### disabled 안내(툴팁/보조 텍스트)
- 비로그인(`guest`): `로그인하면 내 재료로 만들 수 있는 레시피를 골라줘요` + 인라인 `로그인` 링크(→ `login.html?returnTo=recipe-list`). 툴팁은 hover/focus 양쪽에서 표시(키보드 접근 가능), `role="tooltip"` + `aria-describedby` 연결. GuestBanner(US-003) 패턴과 톤 일치.
- 재고 없음(`no-inventory`, 로그인이나 재고 0건): `재고를 먼저 등록하면 사용할 수 있어요` + `재고 등록`(→ US-011 재고 관리 화면) 링크.
- **주의**: 툴팁만으로 정보 전달 금지 — 토글 아래 항상 보이는 **보조 캡션(hint)** 으로도 같은 사유를 노출(모바일·터치는 hover 없음).

### 반응형
- desktop/tablet: 기존 Select들과 같은 줄, 우측 정렬. 최소 높이 `size.touch-target-min`(44px) 확보(스위치 히트 영역이 노브보다 커야 함).
- mobile(<768px): 필터 줄이 wrap되어 토글이 아래 줄 full-width로 내려가며 라벨+스위치가 `space-between`. 터치 타겟 44px 유지.

### 토큰
`color.primary.600/700`, `color.neutral.0/200/300/400/500/700/900`, `color.focus.ring`, `radius.full`(트랙/노브), `spacing 1/2/3`, `size.touch-target-min`.

---

## 2. 필터 ON 결과 표현

토글 on이면 목록 데이터가 **추천 모드**로 바뀐다. 기존 RecipeCard는 그대로 쓰되 **부족 배지와 정렬만 추가**한다.

### 2.1 정렬 (US-013 AC2)
- **부족 재료 수 오름차순**(0개 → 1개 → …). 동수면 기존 기본 정렬(최신/이름) 유지.
- 결과 수 문구 옆에 정렬 안내: `부족 적은 순` (읽기 전용 텍스트, 정렬 셀렉트가 아닌 고정 라벨 — on일 때만 노출).

### 2.2 MissingIngredientBadge (신규 Badge variant)
RecipeCard의 `.meta` 영역에 **재료 개수 태그 옆으로 추가**되는 상태 배지. 기존 카테고리 tag(중립)와 구분된다.

| 케이스 | 표기 | 색 | 접근성 |
|---|---|---|---|
| 모두 충족 (부족 0) | `✓ 지금 만들 수 있어요` | `semantic.success` 텍스트 / `success-bg` 배경 | 배지에 `aria-label="모든 재료 보유, 지금 만들 수 있음"` |
| 부족 있음 (1+) | `부족 N개` | `semantic.warning` 텍스트 / `warning-bg` 배경 | `aria-label="부족한 재료 N개"` |

- 기존 components.md의 Badge 규칙("부족"=warning / "보유"=success) 및 US-012의 부족/충족 개념과 **동일 시맨틱 재사용**.
- 배지는 카드 상단(제목 아래 meta 첫 줄)에 배치해 스캔 용이. 색만으로 구분하지 않도록 `✓`/`부족` **텍스트 라벨 항상 동반**.
- (선택) 부족 재료명 툴팁/aria: `부족: 대파, 두부`처럼 `aria-label`에 상세 포함 가능(구현 시 backend가 부족 목록 제공 시).

### 2.3 결과 헤더
- on일 때 `.count`(기존 `aria-live="polite"`) 문구를 확장: `만들 수 있는 레시피 12건 · 부족 적은 순`. 필터 토글 on/off 전환 시 이 문구가 갱신되어 스크린리더가 변화를 인지.

### 반응형/토큰
- 배지: `radius.full`, `spacing 2`, `typography` 12px(meta와 동일). `semantic.success/success-bg/warning/warning-bg`.
- 카드 그리드·hover·focus는 기존 RecipeCard 스펙 그대로(변경 없음).

---

## 3. 상태 화면 (추천 모드)

| 상태 | 조건 | UI |
|---|---|---|
| E — 추천 결과 있음 | on + 매칭 1건+ | 부족 0개 카드가 상단, 이어 부족 오름차순. success/warning 배지 노출. |
| F — 모두 충족만 있음 | 부족 0 레시피만 존재 | 상단 성공 톤 안내(`info`/`success-bg`) `지금 바로 만들 수 있는 레시피 N개예요` + 카드들. |
| G — 완전 충족 0건, 근접만 | 부족 0은 없고 부족 1+만 | 안내 `딱 맞는 레시피는 없지만, 재료 1~2개만 더 있으면 돼요` + 부족 오름차순 카드. (US-013의 "거의 만들 수 있는" 대응) |
| H — 추천 결과 빈 목록 | 매칭 0건 | EmptyState: 제목 `보유 재료로 만들 수 있는 레시피가 아직 없어요`, 설명 `재고를 더 등록하거나 필터를 꺼서 전체 레시피를 보세요`, CTA `필터 끄기`(토글 off) + `재고 등록`. 기존 빈 결과 EmptyState 패턴 재사용. |
| I — 재고 없음(토글 비활성 상태의 목록) | 로그인·재고 0 | 토글 disabled + 목록은 일반 모드. 상단 hint에 재고 등록 유도. |

- 모든 안내 박스는 기존 `.state-box`/Alert 톤(`info-bg`/`success-bg`/`warning-bg`)만 사용.

---

## 4. 접근성 체크리스트 (US-013)
- [x] 토글: `<input type=checkbox role=switch>` + `<label for>` 연결, `aria-checked` 상태 노출.
- [x] disabled 사유를 **툴팁(`role=tooltip`+`aria-describedby`)과 항상 보이는 hint** 이중 제공(색·hover 의존 금지).
- [x] 필터 on/off·결과 변화는 `.count`의 `aria-live="polite"`로 통지.
- [x] 부족/충족 배지: 색 + 텍스트(`✓`/`부족 N개`) 병기, `aria-label`로 의미 명시. success/warning 배경 위 텍스트 대비 4.5:1+ (tokens 검증값).
- [x] 포커스: 스위치·링크·CTA 모두 전역 포커스 링. 키보드로 토글 조작(Space) 가능.
- [x] 터치 타겟 44×44px 이상(스위치 히트 영역·링크).
- [x] 로그인 유도 링크는 `returnTo`로 원화면 복귀(US-003 게이트 패턴).

## 5. 데이터·구현 메모 (FE/BE 협의)
- 부족 판정·부족 재료 수·정렬은 **backend가 계산해 제공**(재고 vs 레시피 재료 대조). 단위 환산 미해결(PRD Open Question) → US-012와 동일하게 **동일 단위 기준** 우선, 환산은 이후 과제.
- 목록 API에 optional 파라미터 `makeable=true`(추천 모드) + 응답 카드에 optional 필드 `missingCount`(number), `missingNames?`(string[]) 추가 형태 권장(하위 호환 additive). 최종 계약은 backend openapi에서 확정.
- 비로그인·재고 0건은 클라이언트에서 토글 disabled 처리(서버 호출 없이).

## 6. 화면 ↔ 컴포넌트 매핑 (추가분)
| 화면 | 추가 컴포넌트 |
|---|---|
| recipe-list (추천 모드) | RecommendFilterToggle, MissingIngredientBadge, (기존)SearchFilterBar·RecipeCard·EmptyState 재사용 |
