import type { LucideIcon } from 'lucide-react';

import { Card } from './Card';

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'brand' | 'sky' | 'amber' | 'rose';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  } as const;

  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <p className="truncate text-lg font-bold text-ink-900">{value}</p>
      </div>
    </Card>
  );
}
