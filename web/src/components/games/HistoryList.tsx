import { History } from 'lucide-react';

import { formatSigned } from '../../lib/format';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export interface HistoryEntry {
  id: string | number;
  label: string;
  win: boolean;
  profit: number;
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
        <History className="size-4 text-ink-500" />
        <h2 className="text-sm font-bold text-ink-900">Recent plays</h2>
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={History} title="No plays yet" description="Your recent results will appear here." />
      ) : (
        <ul className="divide-y divide-ink-100">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink-700">{entry.label}</span>
              <span
                className={`text-sm font-bold ${entry.win ? 'text-brand-600' : 'text-rose-500'}`}
              >
                {formatSigned(entry.profit)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
