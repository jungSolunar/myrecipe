import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from '../../components';

export interface AliasInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hideLabel?: boolean;
}

/**
 * [US-016] 별칭(복수) 입력. Enter 또는 쉼표로 칩 추가, 칩의 x 로 삭제.
 * 검색이 별칭도 매칭하므로 자유 문자열을 복수로 저장한다.
 */
export function AliasInput({ value, onChange, label = '별칭', hideLabel }: AliasInputProps) {
  const id = useId();
  const [term, setTerm] = useState('');

  function add(raw: string) {
    const t = raw.trim().replace(/,$/, '').trim();
    if (!t) return;
    if (value.includes(t)) {
      setTerm('');
      return;
    }
    onChange([...value, t]);
    setTerm('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(term);
    } else if (e.key === 'Backspace' && term === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="field">
      <label className={hideLabel ? 'field__label sr-only' : 'field__label'} htmlFor={id}>
        {label} <span className="field__opt">(선택·복수)</span>
      </label>
      {value.length > 0 && (
        <div className="alias-chips">
          {value.map((a) => (
            <span className="alias-chip" key={a}>
              {a}
              <button
                type="button"
                aria-label={`${a} 별칭 삭제`}
                onClick={() => onChange(value.filter((x) => x !== a))}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        className="field__control"
        type="text"
        placeholder="예: 달걀 (Enter로 추가)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(term)}
      />
    </div>
  );
}
