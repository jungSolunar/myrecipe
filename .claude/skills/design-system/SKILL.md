---
name: design-system
description: 디자인 토큰 구조, 와이어프레임 제작 규칙, 접근성 체크리스트. UI 설계, 화면 목업, 컴포넌트 스펙 작업 시 사용.
---

# 디자인 시스템 스킬

## design/tokens.json 구조

```json
{
  "color": {
    "primary": {"50": "#...", "500": "#...", "900": "#..."},
    "semantic": {"success": "#...", "error": "#...", "warning": "#..."}
  },
  "typography": {
    "heading-1": {"size": "32px", "weight": 700, "lineHeight": 1.3},
    "body": {"size": "16px", "weight": 400, "lineHeight": 1.6}
  },
  "spacing": {"unit": "4px", "scale": [4, 8, 12, 16, 24, 32, 48, 64]},
  "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
  "breakpoint": {"mobile": "0", "tablet": "768px", "desktop": "1200px"}
}
```

## 와이어프레임 규칙
- 화면 1개 = HTML 파일 1개, CSS는 `<style>` 인라인 — 브라우저에서 바로 열림
- 파일 상단 주석에 대응하는 유저스토리 ID 기재 (`<!-- US-001, US-003 -->`)
- 실데이터 예시 사용, 로딩/에러/빈 상태 화면도 별도 섹션으로 포함

## components.md 스펙 형식 (FE와의 계약)
컴포넌트마다: 이름 / props / 상태(default, hover, focus, disabled, loading) /
반응형 동작 / 사용하는 토큰 목록

## 접근성 체크리스트
- [ ] 텍스트 대비율 4.5:1 이상 (큰 텍스트 3:1)
- [ ] 모든 인터랙티브 요소 키보드 접근 가능 + 포커스 표시
- [ ] 이미지 대체 텍스트, 폼 라벨 연결
- [ ] 터치 타겟 최소 44×44px
