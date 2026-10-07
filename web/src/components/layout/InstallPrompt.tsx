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

    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) return;

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
      className={`relative rounded-2xl border border-brand-100 bg-brand-50 p-4 ${className ?? ''}`}
    >
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-lg p-1 text-brand-700/70 transition-colors hover:bg-brand-100"
        aria-label="Dismiss install prompt"
      >
        <X className="size-4" />
      </button>
      <p className="pr-6 text-sm font-semibold text-brand-800">Install ALEX.IO</p>
      <p className="mt-1 text-xs text-brand-700/90">
        Add it to your home screen for a full-screen, app-like experience.
      </p>
      <Button size="sm" className="mt-3" onClick={install}>
        <Download className="size-4" />
        Install
      </Button>
    </div>
  );
}
