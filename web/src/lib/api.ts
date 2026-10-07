import axios from 'axios';

import { getToken } from './token';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let tokenProvider: () => string | null | Promise<string | null> = getToken;

export function setTokenProvider(provider: () => string | null | Promise<string | null>): void {
  tokenProvider = provider;
}

api.interceptors.request.use(async (config) => {
  const token = await tokenProvider();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : 'Network error. Is the server running?');
    return Promise.reject(Object.assign(error, { friendlyMessage: message }));
  }
);

export const apiService = {
  health: () => api.get('/health'),

  register: (data: { username?: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),

  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/user/profile', data),
  getWallet: () => api.get('/user/wallet'),
  deposit: (reference: string, amount: number) =>
    api.post('/user/wallet/deposit', { reference, amount }),
  withdraw: (amount: number) => api.post('/user/wallet/withdraw', { amount }),
  payout: (amount: number, account_number: string, bank_code: string) =>
    api.post('/user/wallet/payout', { amount, account_number, bank_code }),
  getTransactions: () => api.get('/user/transactions'),

  coinFlip: (bet: number, choice: 'heads' | 'tails') =>
    api.post('/games/coin-flip', { bet, choice }),
  diceRoll: (bet: number, guess: number) => api.post('/games/dice-roll', { bet, guess }),
  tradeGamble: (bet: number, direction: 'up' | 'down', duration: number) =>
    api.post('/games/trade-gamble', { bet, direction, duration }),
  flappyBird: (data: {
    bet: number;
    completed: boolean;
    timeTarget: number;
    timeSurvived: number;
  }) => api.post('/games/flappy-bird', data),
};

export default api;

export function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    friendlyMessage?: string;
    message?: string;
  };
  return err?.response?.data?.message || err?.friendlyMessage || err?.message || 'Something went wrong';
}

