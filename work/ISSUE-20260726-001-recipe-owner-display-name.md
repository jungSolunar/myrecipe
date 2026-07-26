# ISSUE-20260726-001: recipe-detail 작성자 카드 — 표시명 데이터 부재

상태: Open
심각도: Minor
관련: US-023(신규, docs/backlog.md 후속 백로그), US-005(레시피 상세 조회)

## 증상

- 발생 시점: 2026-07-26, recipe-detail 화면의 "작성자 카드"를
  와이어프레임(`design/v2.3.0/wireframes/recipe-detail.html`)에 맞춰 구현 시도 중.
- 증상: 와이어프레임의 작성자 카드는 작성자 이름/아바타를 표기하나,
  API 계약에 작성자 표시명(이름) 필드가 없어 카드를 완성할 수 없다.
- 현재 카드는 등록 시각·소유 여부만 표기하고 이름/아바타는 생략된 상태.

## 원인 분석

- 직접 원인: `RecipeDetail` 응답 스키마에 표시명 필드가 정의되어 있지 않음.
  - `api/openapi.yaml` `RecipeDetail`: `required: [id, title, steps, ingredients, owner_id, created_at, updated_at]`,
    존재하는 소유자 관련 필드는 `owner_id`, `is_owner` 뿐.
  - `web/src/api/types.ts` `RecipeDetail`: 동일하게 `owner_id`, `is_owner?` 만 존재.
- 근본 원인: 상세 계약 설계 시 소유자 식별용 `owner_id`/`is_owner`(수정·삭제 UI 판단용)까지만 정의했고,
  사람이 읽을 수 있는 표시명(이름/아바타) 노출 요구가 계약에 반영되지 않음.
- 확인한 것: openapi·types.ts 양쪽 모두 표시명 필드 부재 확인.
- 배제한 것: 이번 노트에서 다른 화면·엔드포인트 영향은 조사 범위 아님(상세 작성자 카드 한정).

## 해결 방법

- 코드 수정은 이번 작업 범위 아님(planner 역할). 후속 백로그 US-023으로 정식 등록함.
- 제안 방향(구현은 backend-dev/frontend-dev 위임):
  - BE: `RecipeDetail`에 표시명 필드를 optional/additive로 추가 + server/app 응답 채우기.
  - FE: 작성자 카드에 이름/아바타 표시.
- 검증 방법: 필드 추가 후 recipe-detail 카드가 와이어프레임과 일치하는지 확인,
  회귀 하네스(`./harness/check.sh`) 통과.

## 작업 이력

- 2026-07-26 — recipe-detail 작성자 카드 구현 중 표시명 필드 부재 확인.
- 2026-07-26 — openapi.yaml·types.ts에서 `RecipeDetail` 필드 부재 사실 검증.
- 2026-07-26 — docs/backlog.md 후속 백로그에 US-023 신규 등록, 본 이슈 노트 작성.

## 확인 필요 (개인정보)

- 표시명으로 노출할 값 미정: 이메일 전체 vs 표시명(닉네임) vs 이니셜.
  개인정보 최소 노출 원칙과 상충 가능 → 필드 정의 전 사용자 확인 필요.

## 재발 방지

- 화면(와이어프레임)이 요구하는 표시 데이터가 API 계약에 존재하는지
  계약 검토 게이트에서 화면-계약 대조 확인 권장.
