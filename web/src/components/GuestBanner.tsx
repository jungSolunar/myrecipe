import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import './GuestBanner.css';

/** design/components.md: GuestBanner (US-003). 비로그인 열람 안내 + 로그인 링크. role=status. */
export function GuestBanner() {
  return (
    <div className="guest-banner" role="status">
      <Icon name="eye" size={18} />
      <span>
        로그인 없이 둘러보는 중입니다. 등록·수정하려면{' '}
        <Link to="/login">로그인</Link>하세요.
      </span>
    </div>
  );
}
