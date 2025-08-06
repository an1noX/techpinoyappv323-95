
// Utility for automatic field mapping from document text/OCR
export interface MappingRule {
  field: string;
  patterns: RegExp[];
  extractValue?: (match: string) => string;
}

// Common patterns for document field extraction
export const FIELD_MAPPING_RULES: MappingRule[] = [
  {
    field: 'poNumber',
    patterns: [
      /(?:PO|P\.O\.|Purchase Order|Order)\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /(?:Order|Reference)\s*(?:Number|No|#)\s*:?\s*([A-Z0-9-]+)/i
    ]
  },
  {
    field: 'date',
    patterns: [
      /(?:Date|Dated)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
    ],
    extractValue: (match) => {
      // Convert to YYYY-MM-DD format
      const parts = match.split(/[\/\-]/);
      if (parts.length === 3) {
        const [month, day, year] = parts;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return match;
    }
  },
  {
    field: 'deliveryDate',
    patterns: [
      /(?:Delivery|Required|Ship)\s*(?:Date|By)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:Need|Required)\s*(?:by|on)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    ],
    extractValue: (match) => {
      const parts = match.split(/[\/\-]/);
      if (parts.length === 3) {
        const [month, day, year] = parts;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return match;
    }
  },
  {
    field: 'clientReference',
    patterns: [
      /(?:Reference|Ref|Job)\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /(?:Project|Job)\s*(?:Number|No|#)\s*:?\s*([A-Z0-9-]+)/i
    ]
  },
  {
    field: 'total',
    patterns: [
      /(?:Total|Grand Total)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i,
      /(?:Amount Due|Total Amount)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i
    ],
    extractValue: (match) => parseFloat(match.replace(/,/g, '')).toString()
  },
  {
    field: 'subtotal',
    patterns: [
      /(?:Subtotal|Sub Total)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i
    ],
    extractValue: (match) => parseFloat(match.replace(/,/g, '')).toString()
  },
  {
    field: 'tax',
    patterns: [
      /(?:Tax|VAT|GST)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i
    ],
    extractValue: (match) => parseFloat(match.replace(/,/g, '')).toString()
  }
];

// Line item patterns for extracting table data
export const LINE_ITEM_PATTERNS = {
  description: /^([A-Za-z0-9\s\-\(\)\.]+?)(?:\s+\d+|\s+\$)/,
  quantity: /\b(\d+(?:\.\d+)?)\s*(?:qty|each|pcs|units?)?\b/i,
  unitPrice: /\$?\s*([\d,]+\.?\d*)\s*(?:each|per|\/)?/i,
  sku: /(?:SKU|Part|Item)\s*#?\s*:?\s*([A-Z0-9-]+)/i
};

export const extractFieldsFromText = (text: string) => {
  const extractedData: any = {};
  
  FIELD_MAPPING_RULES.forEach(rule => {
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();
        if (rule.extractValue) {
          value = rule.extractValue(value);
        }
        extractedData[rule.field] = value;
        break; // Use first match for each field
      }
    }
  });
  
  return extractedData;
};

export const extractLineItemsFromText = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  const items: any[] = [];
  
  lines.forEach((line, index) => {
    // Skip obvious header/footer lines
    if (line.toLowerCase().includes('description') || 
        line.toLowerCase().includes('total') ||
        line.toLowerCase().includes('subtotal') ||
        line.toLowerCase().includes('tax')) {
      return;
    }
    
    // Look for lines that might be items
    const quantityMatch = line.match(LINE_ITEM_PATTERNS.quantity);
    const priceMatch = line.match(LINE_ITEM_PATTERNS.unitPrice);
    const descriptionMatch = line.match(LINE_ITEM_PATTERNS.description);
    
    if (quantityMatch && priceMatch && descriptionMatch) {
      const quantity = parseInt(quantityMatch[1]);
      const unitPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      const description = descriptionMatch[1].trim();
      
      if (quantity > 0 && unitPrice > 0 && description.length > 3) {
        items.push({
          id: `item-${Date.now()}-${index}`,
          description,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          sku: '',
          notes: ''
        });
      }
    }
  });
  
  return items;
};
