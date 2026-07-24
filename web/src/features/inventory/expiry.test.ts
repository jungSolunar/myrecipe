import { describe, expect, it } from 'vitest';
import { getExpiryInfo } from './expiry';

const TODAY = new Date(2026, 6, 25); // 2026-07-25 (로컬 자정)

describe('getExpiryInfo (US-011 유통기한 판정)', () => {
  it('유통기한이 없으면 none', () => {
    expect(getExpiryInfo(undefined, TODAY)).toEqual({ status: 'none', daysLeft: null });
    expect(getExpiryInfo(null, TODAY)).toEqual({ status: 'none', daysLeft: null });
    expect(getExpiryInfo('', TODAY)).toEqual({ status: 'none', daysLeft: null });
  });

  it('오늘 이전이면 expired', () => {
    expect(getExpiryInfo('2026-07-24', TODAY)).toEqual({ status: 'expired', daysLeft: -1 });
  });

  it('오늘 포함 3일 이내면 soon', () => {
    expect(getExpiryInfo('2026-07-25', TODAY)).toEqual({ status: 'soon', daysLeft: 0 });
    expect(getExpiryInfo('2026-07-27', TODAY)).toEqual({ status: 'soon', daysLeft: 2 });
    expect(getExpiryInfo('2026-07-28', TODAY)).toEqual({ status: 'soon', daysLeft: 3 });
  });

  it('3일 초과면 ok', () => {
    expect(getExpiryInfo('2026-07-29', TODAY)).toEqual({ status: 'ok', daysLeft: 4 });
    expect(getExpiryInfo('2026-08-10', TODAY).status).toBe('ok');
  });
});
