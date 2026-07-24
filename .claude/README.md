# Claude Code CLI 역할 기반 팀 구성 가이드

기획자 → 디자이너 → BE → FE → 운영자 파이프라인을 Claude Code 서브에이전트 + 스킬로 자동화하는 스캐폴드입니다.

## 1. 구조

```
프로젝트루트/
├── CLAUDE.md                        # 메인 세션(오케스트레이터)의 운영 규칙
├── .claude/
│   ├── agents/                     # 역할 = 서브에이전트
│   │   ├── planner.md              # 기획자
│   │   ├── designer.md             # UI/UX 디자이너
│   │   ├── backend-dev.md          # BE 개발자
│   │   ├── frontend-dev.md         # FE 개발자
│   │   └── ops.md                  # 운영자
│   └── skills/                     # 작업 방법 = 스킬
│       ├── prd-writing/            # PRD 템플릿·규칙 (planner용)
│       ├── design-system/          # 토큰·와이어프레임·접근성 (designer용)
│       ├── api-conventions/        # API·DB 표준 (backend용)
│       ├── frontend-conventions/   # 폴더구조·API격리·테스트 (frontend용)
│       ├── issue-logging/          # 이슈 리포트 포맷 (ops용)
│       └── project-workflow/       # 파이프라인·게이트 (오케스트레이터용)
├── docs/  design/  api/  server/  web/  deploy/  work/
```

핵심 설계: **에이전트 = 역할(누가, 어떤 권한으로)**, **스킬 = 방법(어떤 포맷·규칙으로)**.
에이전트끼리는 대화가 아니라 **약속된 경로의 파일**로 소통합니다 (파일 = 계약).

## 2. 설치

```bash
# 이 스캐폴드를 프로젝트 루트에 복사한 뒤
cd 프로젝트루트
claude
```

Claude Code는 `.claude/agents/`와 `.claude/skills/`를 자동 인식합니다.
- `/agents` 명령으로 에이전트 목록 확인
- 개인 전역으로 쓰려면 `~/.claude/agents/`에 두어도 됩니다 (프로젝트 것이 우선)

## 3. 사용법

### 기본: 오케스트레이터에게 맡기기
```
> 회원가입/로그인 기능을 만들고 싶어. 워크플로우대로 진행해줘.
```
메인 세션이 project-workflow 스킬을 따라 planner → designer/backend(병렬)
→ frontend/backend 구현 → ops 순으로 서브에이전트를 호출하고,
각 게이트에서 산출물을 검증한 뒤 docs/project-status.md를 갱신합니다.

### 특정 역할만 호출
```
> planner 에이전트로 이 요구사항을 PRD로 정리해줘
> backend-dev 에이전트에게 US-003의 API 스펙을 먼저 잡게 해줘
> ops 에이전트로 방금 버그 원인 분석해서 work/에 기록해줘
```

### 단계별 승인 모드 (초기에 권장)
CLAUDE.md에 "각 게이트 통과 전 사용자 승인을 받아라"가 이미 반영되어 있어,
G1(기획 승인) 등 주요 지점에서 확인을 요청합니다. 익숙해지면 완화하세요.

## 4. 역할별 핵심 스킬 요약

| 역할 | 스킬 | 핵심 내용 |
|---|---|---|
| 기획자 | prd-writing | PRD 템플릿, Given/When/Then 수용 기준, MoSCoW 우선순위, Non-goals 강제 |
| 디자이너 | design-system | 디자인 토큰 JSON 구조, HTML 와이어프레임 규칙, 접근성 체크리스트 |
| BE | api-conventions | Contract-First(openapi.yaml 먼저), 표준 에러 포맷, 페이지네이션, 마이그레이션 규칙 |
| FE | frontend-conventions | 폴더 구조, 토큰만 사용, API 격리, loading/error/empty 3-상태 원칙 |
| 운영자 | issue-logging | 이슈 리포트 표준 포맷(증상→원인→해결→재발방지), work/ 이력 관리 |
| 공통 | project-workflow | 단계 순서, 4개 검증 게이트(G1~G4), 상태 파일, 재작업/에스컬레이션 규칙 |

## 5. 자동화 품질을 좌우하는 5가지

1. **게이트 검증은 파일로**: 오케스트레이터가 에이전트의 자기 보고를 믿지 않고
   산출물 파일을 직접 열어 완료 조건을 확인하게 되어 있습니다.
2. **계약 우선**: openapi.yaml과 components.md가 FE-BE, 디자인-FE 간 계약.
   충돌 시 구현 중단 후 보고하도록 각 에이전트에 명시.
3. **상태 파일**: docs/project-status.md 덕분에 세션이 끊겨도 이어서 진행 가능.
4. **도구 최소 권한**: planner는 Bash 없음, 개발자만 Edit/Bash 보유 등
   역할별로 tools를 제한해 사고 범위를 줄입니다.
5. **재작업 한도**: 게이트 실패 시 최대 2회 재시도 후 사용자 에스컬레이션 —
   무한 루프 방지.

## 6. 커스터마이징 포인트

- 기술 스택 확정 시: frontend-conventions/api-conventions에 프레임워크별 규칙 추가
- 팀 컨벤션이 있다면: 각 SKILL.md에 병합 (스킬은 길어지면 참고 파일로 분할 가능)
- CI 환경: ops.md의 출력 경로를 실제 사용하는 CI(.github, Jenkins 등)에 맞게 수정
- 커밋 규칙, PR 템플릿 등을 추가 스킬로 확장 가능

## 7. 회귀 방지 하네스 (기존 화면·기능 보존)

기능 추가 시 기존 화면 구성과 기능이 변경되지 않도록 강제하는 3중 방어 장치입니다.

```
harness/
├── manifest.json           # 보호 경로·테스트 명령 설정
├── baseline.sh             # 기준선 캡처 (--approve는 사용자 전용)
├── check.sh                # 통합 검사 (에이전트가 완료 보고 전 필수 실행)
├── openapi_diff.py         # API breaking change 탐지 (PyYAML 필요)
├── json_additive_check.py  # 디자인 토큰 add-only 검사
└── baselines/              # 캡처된 기준선 (git 커밋 대상)
```

### 3중 방어
| 층 | 대상 | 검사 방식 | 허용 |
|---|---|---|---|
| 1. 체크섬 동결 | web/src, server, wireframes | SHA-256 비교 | 새 파일 추가만 |
| 2. API 계약 | api/openapi.yaml | breaking change diff | 새 엔드포인트·optional 필드 추가 |
| 2b. 토큰 | design/tokens.json | add-only 검사 | 새 토큰 추가 |
| 3. 특성화 테스트 | 기존 테스트 전체 | 실행·통과 확인 | 테스트 수정 금지 |

### 운영 흐름
```bash
# 최초 1회 (또는 릴리스 직후): 현재 상태를 "기존"으로 동결
./harness/baseline.sh

# 에이전트가 기능 구현 시 (자동 — 에이전트 규칙에 내장됨)
./harness/check.sh --fast   # 시작 전
./harness/check.sh          # 완료 보고 전 (실패 시 완료 불가)

# 기존 변경이 정말 필요할 때 (사용자만)
./harness/baseline.sh --approve US-007   # 승인 이력 자동 기록
```

에이전트 규칙에 이미 반영되어 있습니다: 구현 에이전트는 Additive-Only로만 작업하고,
기존 변경이 필요하면 직접 수정하는 대신 변경 제안서를 올려 사용자 승인을 받습니다.
`baseline.sh --approve`는 에이전트가 실행할 수 없으며(규칙상 금지), CI에도
check.sh가 필수 스텝으로 들어가 이중으로 막습니다.

## 8. 요구사항 인터뷰 루프 (planner)

새 기능 요청 시 planner는 바로 PRD를 쓰지 않고 **인터뷰부터** 시작합니다.

```
사용자: "찜하기 기능 추가해줘"
  → planner: 질문 5~8개를 docs/requirements-interview.md에 생성
     (각 질문에 선택지 + 무응답 시 기본 가정 명시)
  → 오케스트레이터: 질문을 사용자에게 전달 (선택지형 UI 활용)
  → 사용자 답변 → 파일에 기록 → planner 재호출
  → planner: 답변 기반 PRD 작성 (최대 2라운드, 이후엔 기본 가정으로 진행)
```

- 질문 카테고리: 사용자 / 문제 / 범위 / 데이터 / 제약 / 성공지표 (이미 파악된 건 질문 안 함)
- "알아서 해줘"라고 하면 기본 가정으로 즉시 진행 — 인터뷰가 블로커가 되지 않음
- 미해결 질문은 PRD의 "확인 필요" 섹션으로 이관되어 추적됨
