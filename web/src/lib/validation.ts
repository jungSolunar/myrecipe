// lib/validation.ts — 순수 폼 검증 유틸 (도메인 지식 없음, 네트워크 없음).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** 회원가입 비밀번호 규칙: 8자 이상 (계약 minLength=8). */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export interface SignupErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

export function validateSignup(values: {
  email: string;
  password: string;
  passwordConfirm: string;
}): SignupErrors {
  const errors: SignupErrors = {};
  if (!values.email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!isValidEmail(values.email)) errors.email = '올바른 이메일 형식이 아닙니다.';

  if (!values.password) errors.password = '비밀번호를 입력해 주세요.';
  else if (!isValidPassword(values.password)) errors.password = '비밀번호는 8자 이상이어야 합니다.';

  if (!values.passwordConfirm) errors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
  else if (values.password !== values.passwordConfirm)
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';

  return errors;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export function validateLogin(values: { email: string; password: string }): LoginErrors {
  const errors: LoginErrors = {};
  if (!values.email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!isValidEmail(values.email)) errors.email = '올바른 이메일 형식이 아닙니다.';
  if (!values.password) errors.password = '비밀번호를 입력해 주세요.';
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined> | object): boolean {
  return Object.values(errors).some(Boolean);
}
