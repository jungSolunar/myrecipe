import './Spinner.css';

/** 인라인 로딩 스피너. 장식용이므로 aria-hidden. */
export function Spinner({ label }: { label?: string }) {
  return (
    <>
      <span className="spinner" aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}
