---
name: api-conventions
description: API 설계 표준(URL, 에러 포맷, 페이지네이션, 버저닝)과 DB 스키마 규칙. 백엔드 API 설계·구현 시 사용.
---

# API 컨벤션 스킬

## URL 설계
- 리소스는 복수 명사: `GET /api/v1/posts`, `GET /api/v1/posts/{id}`
- 동사 금지 (예외: 명확한 액션은 하위 경로 — `POST /posts/{id}/publish`)
- 버전은 경로에: `/api/v1/`

## 표준 에러 포맷 (모든 에러 응답 공통)
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "사람이 읽을 수 있는 설명",
    "details": [{"field": "email", "reason": "invalid_format"}]
  }
}
```
- 4xx: 클라이언트 잘못 / 5xx: 서버 잘못. 200에 에러 담지 않기
- code는 SCREAMING_SNAKE_CASE 고정 문자열 (FE가 분기 처리에 사용)

## 페이지네이션
- 커서 기반 기본: `?cursor=...&limit=20`
- 응답: `{"data": [...], "next_cursor": "...", "has_more": true}`

## OpenAPI 관리
- 구현 전에 openapi.yaml 수정이 먼저 (Contract-First)
- 모든 스키마에 example 값 포함 (FE mock 서버가 사용)
- 하위 호환 깨는 변경은 새 버전 경로로

## DB 규칙
- 테이블: 복수 snake_case, 모든 테이블에 `id, created_at, updated_at`
- 스키마 변경은 마이그레이션 파일로만, 수동 변경 금지
- 삭제는 기본 soft delete (`deleted_at`)
