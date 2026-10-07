import { classNames } from '../../lib/format';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={classNames('size-8', className)} aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#10b981" />
      <path
        d="M15 34 L24 13 L33 34"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19.5 26.5 H28.5" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={classNames('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-lg font-black tracking-tight text-ink-900">
        ALEX<span className="text-brand-500">.IO</span>
      </span>
    </span>
  );
}
