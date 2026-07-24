import { Link } from 'react-router-dom';
import { initialFromEmail } from '../lib/cx';
import { Button } from './Button';
import './Header.css';

export interface HeaderProps {
  authState: 'guest' | 'authed' | 'loading';
  email?: string;
  loggingOut?: boolean;
  onLogout?: () => void;
}

/**
 * design/components.md: Header(AppBar) + UserMenu.
 * guest: 로그인 버튼 / authed: 아바타 이니셜 + 로그아웃. sticky, z-index 10.
 */
export function Header({ authState, email, loggingOut, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__in">
        <Link className="app-header__brand" to="/">
          🥕 레시피 상자
        </Link>

        {authState === 'authed' && email ? (
          <div className="user-menu">
            <Link className="user-menu__nav" to="/ingredients">
              식재료 마스터
            </Link>
            <Link className="user-menu__nav" to="/inventory">
              내 재고
            </Link>
            <span className="user-menu__avatar" aria-hidden="true">
              {initialFromEmail(email)}
            </span>
            <span className="user-menu__email">{email}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} loading={loggingOut}>
              로그아웃
            </Button>
          </div>
        ) : authState === 'guest' ? (
          <Link className="btn btn--primary btn--sm" to="/login">
            로그인
          </Link>
        ) : null}
      </div>
    </header>
  );
}
