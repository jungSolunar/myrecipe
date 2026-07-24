---
name: project-workflow
description: 기획→디자인→API계약→구현→운영 파이프라인의 단계 순서, 검증 게이트, 상태 관리 규칙. 새 기능 개발을 시작하거나 다음 단계로 진행할 때 사용.
---

# 프로젝트 워크플로우 스킬 (오케스트레이션)

## 파이프라인
```
0. planner      → 요구사항 인터뷰 루프       [게이트 G0]
   (planner가 질문 생성 → 오케스트레이터가 사용자에게 질문하고
    답변을 인터뷰 파일에 기록 → planner 재호출. 최대 2라운드)
1. planner      → docs/prd.md 승인          [게이트 G1]
2. designer     → design/* 완성              [게이트 G2]
   backend-dev  → api/openapi.yaml 확정      [게이트 G2]  (2단계는 병렬 가능)
3. frontend-dev → web/ 구현                  [게이트 G3]
   backend-dev  → server/ 구현               [게이트 G3]  (3단계도 병렬 가능)
4. ops          → CI/배포/릴리스 노트         [게이트 G4]
```

## 검증 게이트 (다음 단계 진입 조건)
- **G0**: docs/requirements-interview.md가 CLOSED 상태
  (모든 질문에 답변 또는 명시적 기본 가정 채택)
- **G1**: 모든 Must 스토리에 수용 기준 존재, Non-goals 명시, 사용자 승인
- **G2**: Must 스토리 전 화면 와이어프레임 + openapi.yaml에 example 포함 전체 스키마
- **G3**: lint/test/build 전체 통과, FE가 계약에 없는 필드 미사용,
  **`./harness/check.sh` 통과 (기존 화면/기능 무변경 확인)** ← 회귀 방지 하네스
- **G4**: CI 그린(하네스 스텝 포함), 배포·롤백 절차 문서 존재
- **G4 이후**: 사용자 승인 하에 `./harness/baseline.sh --approve <스토리ID>`로
  새 기능을 보호 대상에 편입

## 상태 파일: docs/project-status.md
```markdown
# 프로젝트 상태
현재 단계: 3 (구현)
## 게이트
- [x] G1 (2026-07-20)
- [x] G2 (2026-07-21)
- [ ] G3
## 스토리별 진행
| ID | 기획 | 디자인 | API | FE | BE | 배포 |
|US-001| ✅ | ✅ | ✅ | 🔄 | ✅ | - |
## 블로커
- (없음)
```

## 오케스트레이터(메인 세션) 규칙
0. **인터뷰 중계**: planner가 WAITING_FOR_USER로 보고하면,
   인터뷰 파일의 질문을 사용자에게 전달한다.
   - 선택지형 질문은 Claude Code의 질문 UI(AskUserQuestion)가 가능하면 활용,
     아니면 채팅으로 번호를 붙여 질문
   - 답변을 인터뷰 파일의 "답변" 섹션에 기록하고 상태를 ANSWERED로 변경 후
     planner를 재호출
   - 사용자가 "알아서 해줘"라고 하면: 모든 질문을 기본 가정으로 채우고
     상태를 ANSWERED로 변경 (가정 채택 사실을 기록)
1. 새 기능 요청이 오면 project-status.md부터 읽어 현재 단계 확인
2. 각 단계는 해당 서브에이전트에 위임하고, 완료 보고를 받으면 게이트 조건을 **직접 파일을 열어 검증**한다 (에이전트의 "완료했습니다" 자기 보고만 믿지 않기)
3. 게이트 통과 시 project-status.md 갱신 후 다음 단계 진행
4. 게이트 실패 시 실패 사유를 명시해 같은 에이전트에 재작업 위임 (최대 2회, 이후 사용자에게 에스컬레이션)
5. 스펙 충돌(디자인↔API 등) 발견 시 planner에게 중재 위임
