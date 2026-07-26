import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface RatingInputProps {
  /** 현재 내 평점 (없으면 0). */
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
}

/**
 * [US-015] 내 평점 입력 (role=radiogroup, 1~5).
 * design-notes: 로빙 tabindex(선택 항목만 tabindex=0), 좌/우·상/하 화살표 이동, Space/Enter 확정.
 * 별 아이콘은 aria-hidden, 각 버튼 aria-label="별 N개". 색만으로 전달하지 않도록 라벨 텍스트 제공.
 */
export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  const labelId = useId();
  // 키보드 포커스 위치(선택값 없으면 1을 기본 포커스로).
  const [focusIndex, setFocusIndex] = useState(value || 1);

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    let next = focusIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, focusIndex + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, focusIndex - 1);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(focusIndex);
      return;
    } else return;
    e.preventDefault();
    setFocusIndex(next);
    onChange(next);
  }

  return (
    <div className="rateinput-wrap">
      <span id={labelId} className="rateinput__label">
        내 평점
      </span>
      <div
        className="rateinput"
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleKey}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const checked = value === n;
          const on = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`별 ${n}개`}
              tabIndex={(value || 1) === n ? 0 : -1}
              className={`rateinput__star${on ? ' on' : ''}`}
              disabled={disabled}
              onFocus={() => setFocusIndex(n)}
              onClick={() => onChange(n)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={
                  on
                    ? { fill: 'var(--status-warning)', stroke: 'none' }
                    : { fill: 'none', stroke: 'var(--gray-8)', strokeWidth: 1.6 }
                }
              >
                <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3Z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
