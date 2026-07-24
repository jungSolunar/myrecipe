import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../../api';
import type { User } from '../../api/types';
import { AuthContext } from './AuthContext';
import type { AuthStatus } from './AuthContext';

/**
 * 세션 쿠키(HttpOnly) 기반 인증 상태를 앱 전역에 제공한다.
 * 최초 마운트 시 /auth/me 로 로그인 상태를 판별(US-003 게이트 판별).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUserState(res.user);
      setStatus('authed');
    } catch {
      setUserState(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    setStatus('authed');
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ status, user, setUser, clearUser, refresh }),
    [status, user, setUser, clearUser, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
