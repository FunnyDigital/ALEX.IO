import { classNames } from '../../lib/format';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={classNames(
        'inline-block size-5 animate-spin rounded-full border-2 border-ink-100 border-t-brand-500',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
