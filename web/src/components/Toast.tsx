import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import './Toast.css';

/** design/components.md: Toast. 성공/완료 일시 알림. role=status. duration 후 자동 닫힘. */
export function Toast({
  children,
  onDismiss,
  duration = 3500,
}: {
  children: ReactNode;
  onDismiss?: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!onDismiss) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className="toast" role="status">
      <Icon name="check" size={16} /> {children}
    </div>
  );
}
