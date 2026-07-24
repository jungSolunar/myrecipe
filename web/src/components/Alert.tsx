import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import './Alert.css';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

const ICON: Record<AlertVariant, string> = {
  error: '⚠',
  warning: '⚠',
  success: '✓',
  info: '🔒',
};

export interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  /** 기본: error/warning=alert, success/info=status */
  role?: 'alert' | 'status';
  icon?: ReactNode;
  className?: string;
}

/** design/components.md: Alert. *-bg 배경 + 동명 텍스트 색(4.5:1+). */
export function Alert({ variant, children, role, icon, className }: AlertProps) {
  const resolvedRole = role ?? (variant === 'error' || variant === 'warning' ? 'alert' : 'status');
  return (
    <div className={cx('alert', `alert--${variant}`, className)} role={resolvedRole}>
      <span className="alert__icon" aria-hidden="true">
        {icon ?? ICON[variant]}
      </span>
      <div className="alert__body">{children}</div>
    </div>
  );
}
