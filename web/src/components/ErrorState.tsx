import { Button } from './Button';
import './states.css';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** design/components.md: ErrorState. 목록/상세/마스터 로드 실패 공통. "다시 시도" 제공. */
export function ErrorState({
  title = '불러오지 못했어요',
  description = '네트워크를 확인하고 다시 시도해 주세요.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-box state-box--error" role="alert">
      <h2 className="state-box__title">{title}</h2>
      <p>{description}</p>
      {onRetry ? (
        <div className="state-box__actions">
          <Button variant="danger" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      ) : null}
    </div>
  );
}
