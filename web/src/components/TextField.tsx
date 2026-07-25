import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import { Icon } from './Icon';
import './fields.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  /** 라벨을 시각적으로 숨기고 스크린리더에만 노출 */
  hideLabel?: boolean;
}

/** design/components.md: TextField. label 연결 필수, invalid 시 aria-invalid + role=alert 에러. */
export function TextField({
  label,
  required,
  optional,
  hint,
  error,
  hideLabel,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = cx(hint ? hintId : undefined, error ? errId : undefined) || undefined;

  return (
    <div className="field">
      <label className={cx('field__label', hideLabel && 'sr-only')} htmlFor={id}>
        {label}{' '}
        {required && (
          <>
            <span className="field__req" aria-hidden="true">
              *
            </span>
            <span className="sr-only">필수</span>
          </>
        )}
        {optional && <span className="field__opt">(선택)</span>}
      </label>
      <input
        id={id}
        className={cx('field__control', className)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="field__error" role="alert">
          <Icon name="warning" size={14} /> {error}
        </p>
      )}
    </div>
  );
}
