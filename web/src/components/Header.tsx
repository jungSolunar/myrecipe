import { Link, NavLink } from 'react-router-dom';
import { initialFromEmail } from '../lib/cx';
import { Button } from './Button';
import './Header.css';

export interface HeaderProps {
  authState: 'guest' | 'authed' | 'loading';
  email?: string;
  loggingOut?: boolean;
  onLogout?: () => void;
}

/** 라인 SVG 브랜드 마크(육각형 + 냄비). 이모지 대신 사용. */
function BrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />
      <path d="M8 11h8" />
      <path d="M9 11v3a3 3 0 0 0 6 0v-3" />
      <path d="M7.5 11h9" />
    </svg>
  );
}

function navIcon(path: JSX.Element) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

/**
 * v2.0.0 공통 셸의 좌측 사이드바(aside 256px). 브랜드 → 섹션 그룹 내비 → 사용자 블록.
 * 활성 항목은 mint(--accent-4/--accent-11). 로그인/로그아웃·아바타·라우트·텍스트는 보존.
 */
export function Header({ authState, email, loggingOut, onLogout }: HeaderProps) {
  return (
    <aside className="sidebar" aria-label="주요 내비게이션">
      <Link className="sidebar__brand" to="/">
        <BrandMark />
        레시피 상자
      </Link>

      <nav className="sidebar__nav" aria-label="화면 이동">
        <div className="sidebar__group">
          <div className="sidebar__caption">요리</div>
          <NavLink to="/" end className={navClass}>
            {navIcon(
              <>
                <path d="M4 7h16" />
                <path d="M6 7v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </>,
            )}
            레시피
          </NavLink>
        </div>

        {authState === 'authed' && (
          <div className="sidebar__group">
            <div className="sidebar__caption">식재료</div>
            <NavLink to="/ingredients" className={navClass}>
              {navIcon(
                <>
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h16" />
                </>,
              )}
              식재료 마스터
            </NavLink>
            <NavLink to="/inventory" className={navClass}>
              {navIcon(
                <>
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path d="M4 9h16" />
                  <path d="M9 4v16" />
                </>,
              )}
              내 재고
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar__spacer" />

      {authState === 'authed' && email ? (
        <div className="sidebar__user">
          <span className="sidebar__avatar" aria-hidden="true">
            {initialFromEmail(email)}
          </span>
          <span className="sidebar__email">{email}</span>
          <Button variant="ghost" size="sm" onClick={onLogout} loading={loggingOut}>
            로그아웃
          </Button>
        </div>
      ) : authState === 'guest' ? (
        <div className="sidebar__user">
          <Link className="btn btn--primary btn--sm btn--block" to="/login">
            로그인
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'sidebar__link is-active' : 'sidebar__link';
}
