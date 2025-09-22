import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = 'http://localhost:5000';

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
    api.post('/api/games/coinflip', { bet, choice }),
    
  diceRoll: (bet, guess) => 
    api.post('/api/games/dice-roll', { bet, guess }),
    
  // User API calls
  getUserProfile: () => 
    api.get('/api/user/profile'),
    
  updateUserProfile: (profileData) => 
    api.put('/api/user/profile', profileData),
    
  getUserWallet: () => 
    api.get('/api/user/wallet'),
    
  // Wallet API calls
  deposit: (amount, paymentMethod) => 
    api.post('/api/user/deposit', { amount, paymentMethod }),
    
  withdraw: (amount, bankDetails) => 
    api.post('/api/user/withdraw', { amount, bankDetails }),
    
  getTransactionHistory: () => 
    api.get('/api/user/transactions'),
};

export default api;