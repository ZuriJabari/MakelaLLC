export type PaymentProvider = 'MTN' | 'AIRTEL';

export interface PaymentRequest {
  phone_number: string;
  amount: number;
  provider: PaymentProvider;
  description?: string;
  userId?: string;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    transaction_id: string;
    provider_reference?: string;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  phone_number: string;
  provider: PaymentProvider;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
} 