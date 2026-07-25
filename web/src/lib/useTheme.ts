import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'recipe-box-theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage 접근 불가 시 기본값 */
  }
  return 'light';
}

/**
 * data-theme 토글. 최상위 <html> 에 data-theme 를 걸어 v2.0.0 다크 토큰을 전환한다.
 * (다크 값은 tokens.css 가 담당 — 화면 코드에 다크 분기 없음.)
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}
