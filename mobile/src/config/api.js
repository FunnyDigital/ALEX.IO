import axios from 'axios';
import { auth } from './firebase';
import { Platform, Alert } from 'react-native';

// Use different base URLs for web and mobile
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://127.0.0.1:5000'  // For web - use 127.0.0.1 to match server
  : 'http://10.0.2.2:5000';  // For Android emulator (use your IP for physical device)

// Create axios instance with longer timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    console.log('Making API request:', config.method.toUpperCase(), config.url);
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth token to request');
    } else {
      console.log('No authenticated user found');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API error:', error.response?.status, error.response?.data, error.message);
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout - server may be slow or unavailable');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Request timeout. Please check your connection and try again.');
      }
    } else if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - user may need to log in again');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Authentication failed. Please log in again.');
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.log('Network error - server may not be running');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Network error. Please check your internet connection.');
      }
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
    
  flappyBird: (gameData) =>
    api.post('/api/games/flappy-bird', gameData),
    
  tradeGamble: (bet, direction, duration) =>
    api.post('/api/games/trade-gamble', { bet, direction, duration }),
    
  tradeGambleSettle: (bet, win) =>
    api.post('/api/games/trade-gamble/settle', { bet, win }),
    
  // User API calls
  getUserProfile: () => 
    api.get('/api/user/profile'),
    
  updateUserProfile: (profileData) => 
    api.put('/api/user/profile', profileData),
    
  // Wallet API calls - Fixed function names
  getWallet: () => 
    api.get('/api/user/wallet'),
    
  getUserWallet: () => 
    api.get('/api/user/wallet'),
    
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