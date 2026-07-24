---
name: prd-writing
description: PRD와 유저스토리 작성 템플릿·규칙. 기획 문서, 요구사항 정의, 백로그 작성 시 사용.
---

# PRD 작성 스킬

## docs/prd.md 템플릿

```markdown
# <프로젝트명> PRD
버전: | 작성일: | 상태: Draft/Review/Approved

## 1. 문제 정의
- 누가, 어떤 상황에서, 무엇이 불편한가

## 2. 목표 & 성공 지표
- 목표: (정성)
- 지표: (정량 — 측정 방법 포함)

## 3. Non-goals (이번에 하지 않는 것)
- 반드시 1개 이상 명시

## 4. 유저스토리
### US-001: <제목> [Must]
As a <사용자>, I want <행동>, so that <가치>.
**수용 기준**
- Given <전제> When <행동> Then <결과>

## 5. 확인 필요 (Open Questions)
```

## 규칙
- 유저스토리 ID는 US-001 형식으로 부여하고, 이후 디자인/구현/테스트에서 이 ID로 추적한다
- 수용 기준 없는 스토리는 백로그에 넣을 수 없다
- 우선순위는 MoSCoW: Must(없으면 출시 불가) / Should / Could / Won't
- 한 스토리가 3일 이상 걸릴 크기면 분할한다
