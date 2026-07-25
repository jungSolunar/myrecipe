import type { CSSProperties } from 'react';

/**
 * design-guide §7/§10: 이모지 금지, 아이콘은 1.5~1.8 stroke 라인 SVG.
 * 공용 인라인 SVG 아이콘. currentColor 로 색을 상속하므로 배치한 곳의 색 토큰을 그대로 따른다.
 *
 * 접근성(§8): 기본은 장식(aria-hidden). 의미가 있는 단독 아이콘이면 `label` 을 넘겨
 * role="img" + aria-label 로 노출한다.
 */
export type IconName =
  | 'carrot'
  | 'search'
  | 'cooking'
  | 'bulb'
  | 'lock'
  | 'info'
  | 'check'
  | 'close'
  | 'trash'
  | 'help'
  | 'warning'
  | 'image'
  | 'box'
  | 'eye';

export interface IconProps {
  name: IconName;
  /** px. 기본 16. 빈 상태 아이콘 등은 32 를 넘긴다. */
  size?: number;
  /** 지정하면 의미 아이콘(role=img, aria-label). 미지정이면 장식(aria-hidden). */
  label?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** viewBox 24 기준 라인 SVG path 정의. */
const PATHS: Record<IconName, JSX.Element> = {
  carrot: (
    <>
      <path d="M2.3 21.7s9.9-3.5 12.7-6.4a4.5 4.5 0 0 0-6.3-6.3C6 11.8 2.3 21.7 2.3 21.7z" />
      <path d="M8.6 14 6.6 12M22 9s-1.3-2-3.5-2S15 9 15 9s1.3 2 3.5 2S22 9 22 9zM15 2s-2 1.3-2 3.5S15 9 15 9s2-1.8 2-3.5S15 2 15 2z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  cooking: (
    <>
      <path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.1 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.8 1.2 1.5 1.4 2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  box: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function Icon({ name, size = 16, label, strokeWidth = 1.6, className, style }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'block', flex: '0 0 auto', ...style }}
      {...a11y}
    >
      {PATHS[name]}
    </svg>
  );
}
