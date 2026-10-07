import { classNames, formatSigned } from '../../lib/format';

export interface HistoryEntry {
  id: string | number;
  label: string;
  win: boolean;
  profit: number;
}

export function RecentStrip({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto no-scrollbar">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-ink-500">
        Recent
      </span>
      {entries.slice(0, 6).map((entry) => (
        <span
          key={entry.id}
          title={entry.label}
          className={classNames(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
            entry.win ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-500'
          )}
        >
          {formatSigned(entry.profit)}
        </span>
      ))}
    </div>
  );
}
