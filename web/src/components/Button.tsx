import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Spinner } from './Spinner';
import './Button.css';

type Variant = 'primary' | 'ghost' | 'danger' | 'danger-solid';
type Size = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  fullWidth?: boolean;
}

/** design/components.md: Button. variant/size/disabled/loading 지원, 최소 44px 터치 타겟. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    iconLeft,
    fullWidth = false,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && iconLeft ? <span aria-hidden="true">{iconLeft}</span> : null}
      {children}
    </button>
  );
});
