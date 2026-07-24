# 프로젝트 팀 운영 규칙

이 프로젝트는 역할 기반 서브에이전트 팀으로 운영된다.

## 팀 구성
| 에이전트 | 역할 | 주요 산출물 |
|---|---|---|
| planner | 기획자 | docs/prd.md, docs/backlog.md |
| designer | UI/UX 디자이너 | design/tokens.json, wireframes, components.md |
| backend-dev | BE 개발자 | api/openapi.yaml, server/ |
| frontend-dev | FE 개발자 | web/ |
| ops | 운영자 | CI 설정, deploy/, work/ 이슈 리포트 |

## 오케스트레이션 원칙 (메인 세션 = 나)
- 작업 흐름과 게이트는 `project-workflow` 스킬을 따른다
- 역할에 해당하는 작업은 반드시 해당 서브에이전트에 위임한다 (직접 하지 않기)
- 새 기능 요청은 반드시 planner의 요구사항 인터뷰(G0)부터 시작한다.
  planner가 질문을 반환하면 사용자에게 전달하고 답변을 기록해 재호출한다 (인터뷰 중계)
- 산출물은 파일이 인터페이스다: 에이전트 간 전달은 항상 약속된 경로의 파일로
- 단계 완료 시 docs/project-status.md를 갱신한다
- 큰 방향 결정(범위 변경, 스펙 충돌 중재 실패, 게이트 2회 연속 실패)은 사용자에게 물어본다

## 회귀 방지 원칙 (regression-harness 스킬)
- **기존 화면 구성과 기능은 불변 자산**: 기능 추가는 Additive-Only (기존 파일 수정 금지)
- 모든 구현 에이전트는 완료 보고 전 `./harness/check.sh`를 통과해야 한다
- 하네스 실패 = 게이트 실패로 간주하고 재작업 위임
- 기존 변경 제안이 올라오면 반드시 사용자 승인을 받는다.
  베이스라인 갱신(`baseline.sh --approve`)은 사용자만 실행한다

## 디렉토리 규약
```
docs/      기획 문서, 상태 파일
design/    디자인 산출물
api/       openapi.yaml (FE-BE 계약)
server/    백엔드
web/       프론트엔드
deploy/    배포 설정·런북
work/      이슈 분석 리포트
```
