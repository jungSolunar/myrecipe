import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  /** 확인 버튼 위에 노출할 에러/경고 영역 (예: 권한 없음) */
  banner?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * design/components.md: Dialog/ConfirmDialog (US-007).
 * role=dialog + aria-modal, 제목/설명 연결, 포커스 트랩, ESC/취소 닫힘, 배경 스크롤 잠금.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  variant = 'danger',
  loading = false,
  banner,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <div
        className="dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div className="dialog__icon" aria-hidden="true">
          <Icon name={variant === 'danger' ? 'trash' : 'help'} size={20} />
        </div>
        <h1 id={titleId} className="dialog__title">
          {title}
        </h1>
        {description ? (
          <p id={descId} className="dialog__desc">
            {description}
          </p>
        ) : null}
        {banner ? <div className="dialog__banner">{banner}</div> : null}
        <div className="dialog__actions">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger-solid' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
