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
    <Card className="flex flex-col items-center gap-1 p-3 text-center">
      <span className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="size-4" />
      </span>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="w-full truncate text-sm font-black text-ink-900">{value}</p>
    </Card>
  );
}
