import axios from 'axios';
import { auth } from './firebase';
import { Platform } from 'react-native';

// Use different base URLs for web and mobile
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000'  // For web
  : 'http://10.0.2.2:5000';  // For Android emulator (use your IP for physical device)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - user may need to log in again');
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Game API calls
  coinFlip: (bet, choice) => 
    api.post('/api/games/coin-flip', { bet, choice }),
    
  diceRoll: (bet, guess) => 
    api.post('/api/games/dice-roll', { bet, guess }),
    
  flappyBird: (bet, score) =>
    api.post('/api/games/flappy-bird', { bet, score }),
    
  tradeGamble: (bet, direction, duration) =>
    api.post('/api/games/trade-gamble', { bet, direction, duration }),
    
  tradeGambleSettle: (bet, win) =>
    api.post('/api/games/trade-gamble/settle', { bet, win }),
    
  // User API calls
  getUserProfile: () => 
    api.get('/api/user/profile'),
    
  updateUserProfile: (profileData) => 
    api.put('/api/user/profile', profileData),
    
  getUserWallet: () => 
    api.get('/api/user/wallet'),
    
  // Wallet API calls
  depositWallet: (reference, amount) => 
    api.post('/api/user/wallet/deposit', { reference, amount }),
    
  withdrawWallet: (amount) => 
    api.post('/api/user/wallet/withdraw', { amount }),
    
  payoutWallet: (amount, account_number, bank_code) => 
    api.post('/api/user/wallet/payout', { amount, account_number, bank_code }),
    
  getTransactionHistory: () => 
    api.get('/api/user/transactions'),
};

export default api;