// Shared tax calculation utility to ensure consistency across components

export interface TaxCalculationInput {
  subtotal: number;
  clientTaxInfo?: {
    tax: string;
    wht: string;
  };
  discount?: number;
  withholdingTaxEnabled?: boolean;
  withholdingTaxRate?: number;
}

export interface TaxCalculationResult {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  netOfVat: number;
  whtRate: number;
  withholdingTax: number;
  discount: number;
  totalAmountDue: number;
}

export function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
  const { 
    subtotal, 
    clientTaxInfo, 
    discount = 0, 
    withholdingTaxEnabled = false, 
    withholdingTaxRate = 2 
  } = input;

  // Get VAT rate from client tax info or default to 12%
  const getVATRate = () => {
    if (clientTaxInfo?.tax) {
      const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]) / 100;
      }
    }
    return 0.12; // Default VAT 12%
  };
  
  // Get WHT rate from client info or default to 0%
  const getWHTRate = () => {
    if (clientTaxInfo?.wht) {
      const whtValue = parseFloat(clientTaxInfo.wht);
      if (!isNaN(whtValue)) {
        return whtValue / 100;
      }
    }
    return withholdingTaxEnabled ? (withholdingTaxRate / 100) : 0;
  };
  
  const vatRate = getVATRate();
  const whtRate = getWHTRate();
  
  // Calculate assuming subtotal is VAT-inclusive
  const vatAmount = subtotal * vatRate;
  const netOfVat = subtotal - vatAmount;
  const withholdingTax = netOfVat * whtRate;
  const totalAmountDue = netOfVat - discount + vatAmount - withholdingTax;
  
  return {
    subtotal,
    vatRate,
    vatAmount,
    netOfVat,
    whtRate,
    withholdingTax,
    discount,
    totalAmountDue
  };
}