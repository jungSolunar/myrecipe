# 화면 흐름 (User Flows)

레시피 & 식재료 관리 웹서비스 — Must 범위(US-001~US-010). 각 흐름은 PRD 4절 수용 기준과 연결된다.

## 1. 전체 IA / 내비게이션

```mermaid
graph TD
  List[레시피 목록<br/>recipe-list] -->|카드 클릭| Detail[레시피 상세<br/>recipe-detail]
  List -->|검색·필터| List
  List -->|+ 새 레시피| Gate{로그인?}
  Detail -->|수정| Gate2{본인?}
  Detail -->|삭제| Gate2
  Gate -->|No| Login[로그인<br/>login]
  Gate -->|Yes| Form[레시피 등록/수정<br/>recipe-form]
  Gate2 -->|Yes| Form
  Gate2 -->|No| Blocked[권한 없음 안내]
  Login -->|계정 없음| Signup[회원가입<br/>signup]
  Login -->|성공 returnTo| Form
  Signup -->|성공 자동로그인| List
  Form -->|저장| Detail
  Detail -->|삭제 확인| Del[삭제 확인<br/>recipe-delete-confirm]
  Del -->|삭제 완료| List
  Header[헤더/UserMenu] --> Master[식재료 마스터<br/>ingredient-master]
  Form -.재료 검색·선택.-> Master
```

## 2. 비로그인 열람 + 로그인 게이트 (US-003)

```mermaid
flowchart LR
  V[비로그인 방문자] -->|목록/상세 조회| OK[열람 성공]
  V -->|등록·수정·삭제 시도| G[로그인 게이트]
  G --> L[로그인 login]
  L -->|성공| R[원래 화면 복귀 returnTo]
```
- 목록/상세는 게이트 없이 열람 (US-003 AC1).
- 등록/수정/삭제 진입 시 100% 로그인 화면으로 유도, 동작은 수행 안 됨 (US-003 AC2, PRD 지표).

## 3. 회원가입 → 로그인 (US-001, US-002)

```mermaid
flowchart TD
  S[signup 입력] -->|유효| Created[계정 생성 + 자동 로그인] --> List[목록]
  S -->|이메일 중복| DupErr[중복 안내, 가입 거부]
  S -->|형식/불일치| ValErr[검증 오류 인라인]
  Login[login 입력] -->|성공| Auth[인증됨: 등록·수정 활성화]
  Login -->|실패| LErr[실패 안내]
  Auth -->|로그아웃| Guest[열람 전용 복귀]
```

## 4. 레시피 등록 + 식재료 연결 (US-004, US-009)

```mermaid
flowchart TD
  F[recipe-form] --> T{제목 입력?}
  T -->|없음| E[검증 오류: 제목 필수]
  T -->|있음| IngPick[재료: 마스터 검색·선택 + 수량]
  IngPick -->|마스터에 있음| Link[레시피에 연결]
  IngPick -->|마스터에 없음| NewIng[새 재료 만들기 제안 → 마스터 등록 후 연결]
  Link --> Save[저장]
  NewIng --> Save
  Save --> Detail[상세로 이동]
```

## 5. 레시피 검색·필터 (US-010)

```mermaid
flowchart LR
  Q[이름 키워드] --> Res[결과 목록]
  C[카테고리 필터] --> Res
  I[재료 필터] --> Res
  Res -->|일치 없음| Empty[빈 결과 안내 + 필터 초기화]
```

## 6. 식재료 마스터 관리 (US-008)

```mermaid
flowchart TD
  M[ingredient-master] --> Add[추가: 이름·분류·단위]
  Add -->|중복 이름| Dup[중복 안내]
  Add -->|정상| Added[마스터에 추가]
  M --> Edit[수정]
  M --> DelTry{참조 중?}
  DelTry -->|Yes| Impact[영향 안내 후 삭제]
  DelTry -->|No| DelOk[바로 삭제]
```

## 확장 여지 (이번 Must 범위 아님)
- **US-011/012 (Should)**: 재고 관리 화면 신설, 레시피 상세에 "부족/충족" 배지(상세 wireframe에 placeholder 존재).
- **US-013 (Could)**: 목록/검색 필터에 "내 재료로 만들 수 있는 레시피" 토글 추가.
