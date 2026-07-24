import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidPassword, validateLogin, validateSignup } from './validation';
import { safeReturnTo } from './returnTo';

describe('validation', () => {
  it('이메일 형식을 판별한다', () => {
    expect(isValidEmail('chef@example.com')).toBe(true);
    expect(isValidEmail('chef@')).toBe(false);
    expect(isValidEmail('nope')).toBe(false);
  });

  it('비밀번호는 8자 이상이어야 한다', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
  });

  it('회원가입 검증: 형식/불일치 오류를 잡는다', () => {
    const errors = validateSignup({ email: 'bad', password: 'short', passwordConfirm: 'diff' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.passwordConfirm).toBeTruthy();
  });

  it('로그인 검증: 정상 입력은 오류 없음', () => {
    const errors = validateLogin({ email: 'chef@example.com', password: 'x' });
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeUndefined();
  });
});

describe('safeReturnTo (오픈 리다이렉트 방지)', () => {
  it('내부 경로만 허용한다', () => {
    expect(safeReturnTo('%2Frecipes%2Fnew')).toBe('/recipes/new');
    expect(safeReturnTo('/recipes/new')).toBe('/recipes/new');
  });
  it('외부/프로토콜-상대 URL 은 fallback', () => {
    expect(safeReturnTo('https://evil.com')).toBe('/');
    expect(safeReturnTo('//evil.com')).toBe('/');
    expect(safeReturnTo(null)).toBe('/');
  });
});
