import { Outlet, useLocation } from 'react-router-dom';
import { HeaderContainer } from './features/auth/HeaderContainer';
import { useTheme } from './lib/useTheme';

/** 라우트 경로 → 헤더에 표시할 페이지명. */
function titleForPath(pathname: string): string {
  if (pathname === '/') return '레시피';
  if (pathname.startsWith('/recipes/new')) return '새 레시피';
  if (pathname.endsWith('/edit')) return '레시피 수정';
  if (pathname.startsWith('/recipes/')) return '레시피 상세';
  if (pathname.startsWith('/ingredients')) return '식재료 마스터';
  if (pathname.startsWith('/inventory')) return '내 재고';
  return '레시피 상자';
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="topbar__icon-btn"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

/** 앱 공통 셸: skip-link + [사이드바 256px | 헤더 64px + 라우트 콘텐츠]. (로그인/회원가입은 별도 레이아웃) */
export function AppLayout() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <HeaderContainer />
      <div className="app-shell__col">
        <header className="topbar">
          <span className="topbar__title">{titleForPath(location.pathname)}</span>
          <span className="topbar__spacer" />
          <ThemeToggle />
        </header>
        <Outlet />
      </div>
    </div>
  );
}
