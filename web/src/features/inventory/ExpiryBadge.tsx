import { getExpiryInfo } from './expiry';

export interface ExpiryBadgeProps {
  expiresAt?: string | null;
  /** 기준일(테스트 주입용). 기본은 현재 시각. */
  today?: Date;
}

/**
 * 재고 유통기한 상태 배지 (US-011).
 * 색상에만 의존하지 않도록 항상 텍스트("넉넉"/"임박 D-n"/"만료"/"미입력")를 동반한다.
 */
export function ExpiryBadge({ expiresAt, today }: ExpiryBadgeProps) {
  const { status, daysLeft } = getExpiryInfo(expiresAt, today);

  if (status === 'none') {
    return <span className="inv-exp-empty">미입력</span>;
  }
  if (status === 'expired') {
    return <span className="expiry-badge expiry-badge--expired">만료</span>;
  }
  if (status === 'soon') {
    return <span className="expiry-badge expiry-badge--soon">임박 D-{daysLeft}</span>;
  }
  return <span className="expiry-badge expiry-badge--ok">넉넉</span>;
}
