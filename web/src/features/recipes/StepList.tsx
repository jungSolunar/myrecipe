import { Button, Icon, Textarea } from '../../components';

export interface StepListProps {
  steps: string[];
  onChange: (steps: string[]) => void;
}

/** US-004/006 조리 단계 편집. 번호 배지 + Textarea + 단계 추가/삭제. */
export function StepList({ steps, onChange }: StepListProps) {
  function update(index: number, value: string) {
    onChange(steps.map((s, i) => (i === index ? value : s)));
  }
  function add() {
    onChange([...steps, '']);
  }
  function remove(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div style={{ marginTop: 'var(--s-3)' }}>
        {steps.map((step, i) => (
          <div className="step-edit-row" key={i}>
            <span className="step-edit-row__num" aria-hidden="true">
              {i + 1}
            </span>
            <Textarea
              label={`${i + 1}단계 설명`}
              hideLabel
              value={step}
              placeholder="예: 계란을 볼에 풀고 소금으로 간한다."
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              type="button"
              className="step-edit-row__del"
              aria-label={`${i + 1}단계 삭제`}
              onClick={() => remove(i)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 'var(--s-2)' }}>
        <Button type="button" variant="ghost" size="sm" onClick={add}>
          + 단계 추가
        </Button>
      </p>
    </div>
  );
}
