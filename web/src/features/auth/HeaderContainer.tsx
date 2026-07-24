import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { Header } from '../../components';
import { useAuth } from './useAuth';

/** Header 를 인증 컨텍스트와 연결하는 컨테이너. 로그아웃 시 세션 종료→게스트 복귀(US-002 AC3). */
export function HeaderContainer() {
  const { status, user, clearUser } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // 세션이 이미 만료됐더라도 클라이언트는 게스트로 전환한다.
    } finally {
      clearUser();
      setLoggingOut(false);
      navigate('/');
    }
  }

  return (
    <Header
      authState={status}
      email={user?.email}
      loggingOut={loggingOut}
      onLogout={() => void onLogout()}
    />
  );
}
