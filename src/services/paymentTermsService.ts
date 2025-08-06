import { PaymentTerms } from '@/types/database';

// For now, we'll use predefined payment terms
const predefinedTerms: PaymentTerms[] = [
  {
    id: 'due-on-receipt',
    name: 'Due upon Receipt',
    description: 'Payment due immediately upon receipt',
    days_due: 0,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'net-15',
    name: 'NET 15',
    description: 'Payment due within 15 days',
    days_due: 15,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'net-30',
    name: 'NET 30',
    description: 'Payment due within 30 days',
    days_due: 30,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const paymentTermsService = {
  async getPaymentTerms(): Promise<PaymentTerms[]> {
    return predefinedTerms;
  },

  async getDefaultPaymentTerms(): Promise<PaymentTerms | null> {
    return predefinedTerms.find(term => term.is_default) || null;
  },

  getPaymentTermById(id: string): PaymentTerms | null {
    return predefinedTerms.find(term => term.id === id) || null;
  }
};