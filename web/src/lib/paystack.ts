export const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
export const isPaystackEnabled = Boolean(paystackPublicKey);

interface PaystackHandler {
  openIframe: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => PaystackHandler;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load the payment provider'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function payWithPaystack(options: {
  email: string;
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}): Promise<void> {
  await loadScript();
  if (!window.PaystackPop) throw new Error('Payment provider unavailable');

  const handler = window.PaystackPop.setup({
    key: paystackPublicKey,
    email: options.email,
    amount: Math.round(options.amount * 100),
    currency: 'NGN',
    ref: `alexio_${Date.now()}`,
    callback: (response: { reference: string }) => options.onSuccess(response.reference),
    onClose: options.onClose,
  });
  handler.openIframe();
}
