import { PaymentRequest, PaymentResponse } from '../types/payment';
import { supabase } from '../lib/supabase';

const MTN_API_KEY = process.env.EXPO_PUBLIC_MTN_API_KEY;
const MTN_API_SECRET = process.env.EXPO_PUBLIC_MTN_API_SECRET;
const AIRTEL_API_KEY = process.env.EXPO_PUBLIC_AIRTEL_API_KEY;
const AIRTEL_API_SECRET = process.env.EXPO_PUBLIC_AIRTEL_API_SECRET;

const COMMISSION_RATE = 0.02; // 2% commission

class PaymentService {
  private async generateReference(): Promise<string> {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateCommission(amount: number): number {
    return amount * COMMISSION_RATE;
  }

  private async createTransaction(data: {
    amount: number;
    phone_number: string;
    provider: string;
    reference: string;
    user_id?: string;
    description?: string;
  }) {
    const { error } = await supabase.from('transactions').insert({
      ...data,
      status: 'pending',
      metadata: {
        commission: this.calculateCommission(data.amount),
      },
    });

    if (error) throw error;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const reference = await this.generateReference();
      
      // Create transaction record
      await this.createTransaction({
        amount: request.amount,
        phone_number: request.phone_number,
        provider: request.provider,
        reference,
        user_id: request.userId,
        description: request.description,
      });

      // In sandbox/development mode, we'll simulate a successful payment
      if (process.env.EXPO_PUBLIC_PAYMENT_MODE === 'sandbox') {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            metadata: {
              provider_reference: `SANDBOX_${reference}`,
              commission: this.calculateCommission(request.amount),
            },
          })
          .eq('reference', reference);

        // Update wallet balance
        if (request.userId) {
          await supabase.rpc('update_wallet_balance', {
            p_user_id: request.userId,
            p_amount: request.amount,
          });
        }

        return {
          status: 'success',
          message: 'Payment processed successfully',
          data: {
            transaction_id: reference,
            provider_reference: `SANDBOX_${reference}`,
          },
        };
      }

      // In production, we would integrate with actual MTN and Airtel APIs here
      throw new Error('Production payment processing not implemented yet');
    } catch (error: any) {
      console.error('Payment Error:', error);
      return {
        status: 'error',
        message: error.message || 'Payment processing failed',
      };
    }
  }
}

export const paymentService = new PaymentService(); 