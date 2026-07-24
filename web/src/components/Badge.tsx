import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import './Badge.css';

type BadgeTone = 'neutral' | 'success' | 'warning';

/** design/components.md: Badge. 카테고리 태그=neutral, 재고 부족/보유(US-012)=warning/success. */
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return <span className={cx('badge', `badge--${tone}`)}>{children}</span>;
}
