import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import './fields.css';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hideLabel, hint, error, className, ...rest }: TextareaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = cx(hint ? hintId : undefined, error ? errId : undefined) || undefined;

  return (
    <div className="field">
      <label className={cx('field__label', hideLabel && 'sr-only')} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={cx('field__control', className)}
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
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
