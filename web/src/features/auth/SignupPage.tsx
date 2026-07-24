import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, ApiError } from '../../api';
import { Alert, Button, TextField } from '../../components';
import { validateSignup, hasErrors } from '../../lib/validation';
import type { SignupErrors } from '../../lib/validation';
import { useAuth } from './useAuth';
import './auth.css';

/** US-001 회원가입. 성공 시 자동 로그인 → 목록으로 이동. 이메일 중복은 인라인 안내. */
export function SignupPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validateSignup({ email, password, passwordConfirm });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      const res = await authApi.signup({ email, password });
      setUser(res.user); // 계약: 가입 즉시 세션 쿠키 발급 → 자동 로그인
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors((prev) => ({ ...prev, email: '이미 가입된 이메일입니다.' }));
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        const emailReason = err.detailFor('email');
        if (emailReason) setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
        else setFormError(err.message);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('가입에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">🥕 레시피 상자</div>
      <main className="auth-card" aria-labelledby="signup-title">
        <h1 id="signup-title">회원가입</h1>
        <p className="auth-sub">
          이메일과 비밀번호만으로 시작할 수 있어요. 가입하면 내 레시피와 식재료를 저장할 수
          있습니다.
        </p>

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
            hint="로그인 시 사용됩니다."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            required
            hint="8자 이상 입력해 주세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <TextField
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={errors.passwordConfirm}
          />
          <Button type="submit" fullWidth loading={submitting}>
            {submitting ? '가입 처리 중…' : '가입하고 시작하기'}
          </Button>
        </form>

        <p className="auth-foot">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </main>
    </div>
  );
}
