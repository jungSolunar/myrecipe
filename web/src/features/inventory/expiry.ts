// features/inventory/expiry.ts — 유통기한 상태 판정 (순수 유틸, US-011 ExpiryBadge).
// 규칙(기준일=오늘): ok "넉넉"=D-3 초과 / soon "임박 D-n"=0..3일 남음 / expired "만료"=오늘 이전 / none "미입력".

export type ExpiryStatus = 'ok' | 'soon' | 'expired' | 'none';

export interface ExpiryInfo {
  status: ExpiryStatus;
  /** 오늘 기준 남은 일수(음수=경과). expiresAt 없으면 null. */
  daysLeft: number | null;
}

const MS_PER_DAY = 86_400_000;

/** YYYY-MM-DD 를 로컬 자정 기준 Date 로 파싱 (시간대 오프셋 영향 제거). */
function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 유통기한 문자열과 기준일로 표시 상태를 계산한다. */
export function getExpiryInfo(
  expiresAt: string | null | undefined,
  today: Date = new Date(),
): ExpiryInfo {
  if (!expiresAt) return { status: 'none', daysLeft: null };
  const expiry = parseDateOnly(expiresAt);
  if (!expiry) return { status: 'none', daysLeft: null };

  const daysLeft = Math.round(
    (startOfDay(expiry).getTime() - startOfDay(today).getTime()) / MS_PER_DAY,
  );
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft <= 3) return { status: 'soon', daysLeft };
  return { status: 'ok', daysLeft };
}
