---
name: frontend-conventions
description: 프론트엔드 폴더 구조, 컴포넌트 작성 규칙, API 연동·테스트 규칙. FE 코드 작성/수정 시 사용.
---

# 프론트엔드 컨벤션 스킬

## 폴더 구조
```
web/src/
  components/    # 재사용 UI (도메인 지식 없음)
  features/      # 도메인별 화면+로직 (features/auth, features/board ...)
  api/           # openapi.yaml 기반 API 클라이언트 (이 폴더에서만 fetch)
  styles/        # tokens.json → CSS 변수 변환
  lib/           # 순수 유틸
```

## 핵심 규칙
1. **토큰만 사용**: 색상·간격·폰트 값 하드코딩 금지, CSS 변수(`var(--color-primary-500)`)만
2. **API 격리**: 네트워크 호출은 `api/` 안에서만. 컴포넌트는 훅을 통해 데이터 사용
3. **계약 준수**: openapi.yaml에 없는 필드를 임의로 기대하지 않는다. 필요하면 BE에 스펙 변경 요청
4. **3-상태 원칙**: 데이터 화면은 반드시 loading / error / empty 상태를 구현
5. **파일당 하나의 컴포넌트**, 200줄 넘으면 분리 검토

## 테스트
- 컴포넌트: 렌더링 + 사용자 인터랙션 중심 (구현 세부사항 테스트 금지)
- API 연동: mock 서버(openapi.yaml 기반)로 통합 테스트
- 커밋 전 `lint + test + build` 통과 필수
