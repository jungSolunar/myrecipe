import { useId } from 'react';
import { Link } from 'react-router-dom';
import './recommend.css';

export type RecommendDisabledReason = 'guest' | 'no-inventory' | null;

export interface RecommendFilterToggleProps {
  /** 필터 적용(on) 여부 */
  checked: boolean;
  /** 비활성 사유. null 이면 사용 가능(로그인 + 재고 보유). */
  disabledReason: RecommendDisabledReason;
  onChange: (checked: boolean) => void;
}

/**
 * US-013 "만들 수 있는 레시피만" 추천 토글.
 * design/components-recommendation.md 1절: 스위치형 체크박스(role=switch) + 항상 보이는 hint + 툴팁 이중 안내.
 * 비로그인/재고 없음 시 disabled 처리(클라이언트 판정, 추가 서버 호출 없음).
 */
export function RecommendFilterToggle({
  checked,
  disabledReason,
  onChange,
}: RecommendFilterToggleProps) {
  const inputId = useId();
  const captionId = useId();
  const hintId = useId();

  const disabled = disabledReason !== null;
  // 툴팁/hint 를 aria-describedby 로 연결(색·hover 에만 의존하지 않도록)
  const describedBy = disabled ? hintId : captionId;

  return (
    <>
      <div className={`rec-toggle${disabled ? ' is-disabled' : ''}`}>
        <label className="rec-toggle__switch">
          <input
            id={inputId}
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={disabled}
            aria-checked={checked}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="rec-toggle__track" aria-hidden="true">
            <span className="rec-toggle__knob" />
          </span>
        </label>
        <label className="rec-toggle__text" htmlFor={inputId}>
          {disabledReason === 'guest' ? '🔒 ' : ''}만들 수 있는 레시피만
          <small id={captionId} className="rec-toggle__caption">
            내 재고로 부족 없이 만들 수 있는 것
          </small>
        </label>
      </div>

      {disabledReason === 'guest' && (
        <p className="rec-hint" id={hintId}>
          <span className="rec-tip" tabIndex={0} aria-label="안내">
            ⓘ
            <span className="rec-tip__bubble" role="tooltip">
              로그인하면 내 재료로 만들 수 있는 레시피를 골라줘요.
            </span>
          </span>
          로그인하면 내 재료로 만들 수 있는 레시피를 골라줘요.{' '}
          <Link to={`/login?returnTo=${encodeURIComponent('/')}`}>로그인</Link>
        </p>
      )}

      {disabledReason === 'no-inventory' && (
        <p className="rec-hint" id={hintId}>
          <span className="rec-tip" tabIndex={0} aria-label="안내">
            ⓘ
            <span className="rec-tip__bubble" role="tooltip">
              재고를 먼저 등록하면 사용할 수 있어요.
            </span>
          </span>
          재고를 먼저 등록하면 사용할 수 있어요. <Link to="/inventory">재고 등록</Link>
        </p>
      )}
    </>
  );
}
