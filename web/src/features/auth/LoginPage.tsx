import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, ApiError } from '../../api';
import { Alert, Button, TextField } from '../../components';
import { validateLogin, hasErrors } from '../../lib/validation';
import type { LoginErrors } from '../../lib/validation';
import { safeReturnTo } from '../../lib/returnTo';
import { useAuth } from './useAuth';
import './auth.css';

/** US-002 로그인 + US-003 게이트 복귀(returnTo). */
export function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gated = params.get('returnTo') !== null;
  const returnTo = safeReturnTo(params.get('returnTo'), '/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setFormError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />
          <path d="M9 11v3a3 3 0 0 0 6 0v-3" />
          <path d="M7.5 11h9" />
        </svg>
        레시피 상자
      </div>
      <main className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">로그인</h1>
        <p className="auth-sub">
          등록·수정 기능을 사용하려면 로그인하세요. 열람은 로그인 없이도 가능합니다.
        </p>

        {gated && (
          <Alert variant="info" className="auth-gate-banner" role="status">
            레시피를 등록·수정하려면 로그인이 필요합니다. 로그인 후 작성하던 화면으로
            돌아갑니다.
          </Alert>
        )}
        {formError && (
          <Alert variant="error" className="auth-gate-banner">
            {formError}
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate>
          <TextField
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="chef@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" fullWidth loading={submitting}>
            {submitting ? '로그인 중…' : '로그인'}
          </Button>
        </form>

        <p className="auth-foot">
          계정이 없나요? <Link to="/signup">회원가입</Link> ·{' '}
          <Link to="/">로그인 없이 둘러보기</Link>
        </p>
      </main>
    </div>
  );
}
