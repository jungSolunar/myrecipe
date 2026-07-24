// lib/returnTo.ts — 로그인 게이트 복귀 경로(returnTo) 안전 해석.
// 오픈 리다이렉트 방지: 내부 절대경로("/...")만 허용, 아니면 fallback.
export function safeReturnTo(raw: string | null, fallback = '/'): string {
  if (!raw) return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  // 스킴/프로토콜-상대(//) 차단, 반드시 단일 '/'로 시작
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback;
  return decoded;
}
