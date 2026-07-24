# 레시피 상자 — 웹 프론트엔드 (web/)

React + TypeScript + Vite. 세션 쿠키(HttpOnly) 인증, API 경로 `/api/v1`.
1차 출시 범위: Must 유저스토리 US-001~US-010.

## 요구 사항
- Node.js 20+ (개발 시 18.18+ 이상 권장), npm 10+

## 개발 서버
```bash
cd web
npm install
npm run dev          # http://localhost:5173
```
- 백엔드가 없을 때: `VITE_API_TARGET` 미설정이면 **MSW 브라우저 목**이 자동 활성화되어
  (`api/openapi.yaml` 기반 인메모리 데이터) 전 화면을 데모할 수 있다.
  시드 계정: `chef@example.com` / `password1`
- 실제 백엔드 연결: `VITE_API_TARGET=http://localhost:8080 npm run dev`
  (Vite dev 프록시가 `/api` 를 대상 서버로 전달)

## 검증
```bash
npm run lint     # ESLint (flat config)
npm test         # Vitest + Testing Library (+ MSW node 목)
npm run build    # tsc -b + vite build
```

## 폴더 구조 (frontend-conventions)
```
src/
  api/         openapi.yaml 기반 클라이언트 (네트워크 호출은 여기서만)
  components/  재사용 UI (도메인 지식 없음)
  features/    도메인 화면+로직 (auth / recipes / ingredients)
  lib/         순수 유틸 (검증, className, returnTo)
  styles/      tokens.json → CSS 변수 (tokens.css) + 전역
  mocks/       MSW 핸들러/데이터 (dev 브라우저 + 테스트 노드 공용)
  test/        테스트 setup + 렌더 헬퍼
```

## 규칙 준수
- 스타일 값은 `styles/tokens.css` 변수만 사용(하드코딩 없음).
- `api/openapi.yaml` 계약에 없는 필드/엔드포인트 미사용.
- 모든 데이터 화면에 loading / error / empty 3상태.
- 반응형(mobile-first) + 접근성(포커스 표시, label 연결, 44px 터치 타겟).
