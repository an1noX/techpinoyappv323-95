
export interface ClientPriceType {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  price: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  effectiveDate: string;
}
