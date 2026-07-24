import type { ReactNode } from 'react';
import './states.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** design/components.md: EmptyState. 목록·검색·마스터 공통 빈 상태. */
export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="state-box" role="status">
      {icon ? (
        <div className="state-box__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="state-box__title">{title}</h2>
      {description ? <p>{description}</p> : null}
      {actions ? <div className="state-box__actions">{actions}</div> : null}
    </div>
  );
}
