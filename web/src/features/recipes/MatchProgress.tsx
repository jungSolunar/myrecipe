import { Icon } from '../../components';

export interface MatchProgressProps {
  /** 필요한 재료 총수. */
  total: number;
  /** 부족 재료 수. */
  missing: number;
}

/**
 * [US-020] 상세 매칭률 진행 바. home .matchrow 패턴 재사용.
 * "보유 X / 필요 Y" 수치 병기 + 색 규칙(§6): 100%→success + "지금 가능" 배지 / 60~99%→warning / <60%→gray.
 * 색만으로 전달하지 않도록 항상 수치·텍스트 병기.
 */
export function MatchProgress({ total, missing }: MatchProgressProps) {
  const held = Math.max(0, total - missing);
  const pct = total > 0 ? Math.round((held / total) * 100) : 0;
  const complete = missing === 0 && total > 0;
  const color = complete
    ? 'var(--status-success)'
    : pct >= 60
      ? 'var(--status-warning)'
      : 'var(--gray-9)';

  return (
    <div className="matchprog">
      <div className="matchprog__row">
        <span className="matchprog__nums" aria-label={`보유 ${held}, 필요 ${total}`}>
          가진 재료 {held} / 필요 {total}
        </span>
        {complete ? (
          <span className="badge badge--success" aria-label="모든 재료 보유, 지금 만들 수 있음">
            <Icon name="check" size={12} /> 지금 가능
          </span>
        ) : (
          <span className="matchprog__pct">{pct}%</span>
        )}
      </div>
      <span className="matchprog__track">
        <span className="matchprog__fill" style={{ width: `${pct}%`, background: color }} />
      </span>
    </div>
  );
}
