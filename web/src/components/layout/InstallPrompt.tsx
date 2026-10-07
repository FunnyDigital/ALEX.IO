import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

import { Button } from '../ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'alexio.installDismissed';

export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      /* ignore */
    }

    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2.5 ${className ?? ''}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Download className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-brand-800">Install ALEX.IO</p>
        <p className="truncate text-[11px] text-brand-700/90">Add to your home screen</p>
      </div>
      <Button size="sm" className="shrink-0" onClick={install}>
        Install
      </Button>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1 text-brand-700/70 transition-colors hover:bg-brand-100"
        aria-label="Dismiss install prompt"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
