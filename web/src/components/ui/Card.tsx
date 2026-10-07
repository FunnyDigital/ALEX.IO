import type { HTMLAttributes } from 'react';

import { classNames } from '../../lib/format';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classNames('rounded-3xl border border-ink-100 bg-white shadow-card', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
