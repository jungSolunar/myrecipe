// lib/cx.ts — 조건부 className 결합 유틸.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 아바타/UserMenu 이니셜 (이메일 첫 글자 대문자). */
export function initialFromEmail(email: string): string {
  return (email.trim()[0] ?? '?').toUpperCase();
}
