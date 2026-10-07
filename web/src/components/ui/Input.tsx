import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { classNames } from '../../lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, className, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500"
        >
          {label}
        </label>
      )}
      <div
        className={classNames(
          'flex items-center rounded-xl border bg-white px-3 transition-colors focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100',
          error ? 'border-rose-300' : 'border-ink-100'
        )}
      >
        {prefix && <span className="mr-1 text-sm font-semibold text-ink-500">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            'h-11 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300',
            className
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
