import { createContext } from 'react';
import type { User } from '../../api/types';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** 로그인/회원가입 성공 후 컨텍스트에 사용자 반영 */
  setUser: (user: User) => void;
  /** 로그아웃 후 게스트로 전환 */
  clearUser: () => void;
  /** /auth/me 재조회 */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
