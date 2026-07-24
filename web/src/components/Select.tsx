import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import './fields.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  options: SelectOption[];
  /** 라벨을 시각적으로 숨기고 스크린리더에만 노출 */
  hideLabel?: boolean;
}

export function Select({
  label,
  required,
  hint,
  error,
  options,
  hideLabel,
  className,
  ...rest
}: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = cx(hint ? hintId : undefined, error ? errId : undefined) || undefined;

  return (
    <div className="field">
      <label className={cx('field__label', hideLabel && 'sr-only')} htmlFor={id}>
        {label}{' '}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        className={cx('field__control', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="field__error" role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
