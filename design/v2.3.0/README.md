# design/v2.3.0 — 레시피 상자 기능 확장 (디자인 산출물)

v2.3.0 신규/변경 화면의 와이어프레임 목업 집합입니다. 정본 규격은 `design/v2.0.0/design-guide.md` + `design/tokens.css`(99토큰)이며, 이 폴더는 **Additive-Only**로 그 위에 얹습니다.

> **FE 미변경 · 계약 확정 후 구현 예정.** 본 산출물은 화면 설계(HTML 목업)까지입니다. `web/`(프론트엔드) 코드는 이 단계에서 건드리지 않습니다. 조리시간·별점·정렬 옵션 등 신규 필드는 backend-dev의 API 계약(`api/openapi.yaml`) 확정 이후 frontend-dev(G4)가 구현합니다.

## 원칙
- `design/v2.0.0/*`는 **불변 보존**(수정 금지). 신규 목업은 `design/v2.3.0/wireframes/`에만 추가.
- `design/tokens.css`는 **추가만 허용**(값 변경·삭제 금지). 본 릴리스는 신규 토큰 없이 기존 99토큰만 사용.
- 각 목업: `data-theme` 래퍼 + tokens.css 인라인(값 불변) + 인라인 스타일. light/dark 자동, 브라우저로 바로 열림.

## 화면 매핑 (US ↔ 화면 ↔ 골격)

| US | 내용 | 화면(v2.3.0/wireframes) | 골격(§4) | 계층 |
|---|---|---|---|---|
| US-014 | 레시피 조리시간(분) | `recipe-form.html`(입력) · `recipe-detail.html`·`home.html`(표기) · 정렬옵션(사양) | 폼·상세·대시보드 | Must |
| US-015 | 별점(회원 평균+내 평점 1~5) | `recipe-detail.html`(입력·평균) · `home.html`(카드 표기) · 정렬옵션(사양) | 상세·대시보드 | Must |
| US-016 | 마스터 확장(별칭·kcal·기본보관·메모) | `ingredient-master.html`(+수정) | 목록·표 | Must |
| US-017 | 재고 보관위치(냉장실/냉동실/실온) | `inventory.html` | 목록·표 | Must |
| US-018 | 홈 대시보드(KPI 4·패널 3) | `home.html` | 대시보드형 §4.1 | Must |
| US-019 | 요리시작 + 부족재료→재고추가 연결 | `recipe-detail.html` → `inventory.html`(위저드) | 상세→플로우 | Should |
| US-020 | 상세 매칭률 진행바 | `recipe-detail.html` | 상세형 §4.3 | Should |
| US-021 | 재고행 역탐색("이 재료로 만들 수 있는 레시피") | `inventory.html` → `recipe-list.html?ingredient_id=` | 목록·표 | Should |
| US-022 | 재고 추가 다단계 위저드 + 완료 추천 | `inventory.html`(위저드 4스텝) | 플로우형 §4.5 | Could |

- **정렬옵션(사양만):** `recipe-list.html`은 v2.0.0 보존 화면이라 v2.3.0 목업을 신설하지 않았습니다. 기존 필터바 sort select에 `조리시간 짧은순`·`평점 높은순` **옵션만 additive**로 추가하는 사양을 `design-notes.md`에 명세했습니다.
- **미신설 링크 대상:** 목업이 링크하는 `recipe-list.html`·`login.html`·`recipe-delete-confirm.html`은 **v2.0.0에서 변경 없이 유지**되는 화면이라 v2.3.0 폴더에 없습니다(리뷰 시 v2.0.0/wireframes 참조).

## 파일
- `wireframes/home.html` — 홈 대시보드(US-018) + 조리시간·별점 정합
- `wireframes/recipe-detail.html` — 별점·매칭 진행바·요리시작/부족재료 추가(US-015·019·020·014)
- `wireframes/recipe-form.html` — 조리시간 입력(US-014)
- `wireframes/ingredient-master.html` — 마스터 확장 필드(US-016)
- `wireframes/inventory.html` — 보관위치·역탐색·재고 추가 위저드(US-017·021·022)
- `design-notes.md` — US/AC 커버, 신규 컴포넌트 스펙, 상태·접근성 체크, 계약 접점
- `README.md` — 본 문서

## backend-dev 정합 필요 (계약 접점 요약)
`design-notes.md` 상세 참조. 핵심:
- 신규 필드명: `cook_time_minutes`(recipes), `recipe_ratings{score 1..5}` + 읽기 `rating{average,count}`, ingredients `aliases[]`·`kcal_per_100g`·`default_storage`(냉장/냉동/실온)·`memo`, inventory_items `storage_location`(냉장실/냉동실/실온). 전부 nullable·백필 없음.
- 별점 입력 엔드포인트: 로그인 필수 1인 1평점 upsert (후보 `PUT /recipes/{id}/rating`).
- 정렬 옵션명: `cook_time_asc`·`rating_desc`(값 없음은 뒤로 정렬).
- 대시보드 집계: KPI 4종·패널 3종 반환(후보 `GET /dashboard`), 로그인 필수. 매칭률 100%·D-3 규칙.
- 역탐색: 기존 `GET /recipes?ingredient_id=` 활용(신규 계약 불필요).
