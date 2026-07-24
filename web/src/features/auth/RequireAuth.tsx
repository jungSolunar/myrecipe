import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import { useAuth } from './useAuth';

/**
 * 로그인 게이트 (US-003). 비로그인 시 /login 으로 리다이렉트하며
 * returnTo 에 원래 가려던 경로(등록/수정/삭제 등)를 담아 로그인 후 복귀시킨다.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 'var(--s-16)' }}>
        <Spinner label="확인 중" />
      </div>
    );
  }

  if (status === 'guest') {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace state={{ gated: true }} />;
  }

  return <Outlet />;
}
