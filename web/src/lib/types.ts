export interface Profile {
  id: string;
  username?: string;
  email?: string;
  wallet: number;
  gamesPlayed?: number;
  wins?: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  type: 'game' | 'deposit' | 'withdraw' | 'payout';
  amount?: number;
  bet?: number;
  profit?: number;
  win?: boolean;
  game?: string;
  balance?: number;
  createdAt: string;
}

export interface GameOutcome {
  success: boolean;
  win: boolean;
  profit: number;
  wallet: number;
  bet: number;
  result?: string | number;
  choice?: string;
  guess?: number;
  direction?: string;
  duration?: number;
  message?: string;
}
