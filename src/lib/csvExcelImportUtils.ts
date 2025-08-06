
export interface ParsedRow {
  name: string;
  sku: string;
  category: string;
  description?: string;
  color?: string;
  alias?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
  client_id?: string;
  product_id?: string;
  quoted_price?: string;
  margin_percentage?: string;
  supplier_id?: string;
  current_price?: string;
  [key: string]: any;
}

export const parseCSV = (csvText: string): ParsedRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const skuIndex = headers.findIndex(h => h.includes('sku'));
  const categoryIndex = headers.findIndex(h => h.includes('category'));
  const descriptionIndex = headers.findIndex(h => h.includes('description'));
  const colorIndex = headers.findIndex(h => h.includes('color'));
  const aliasIndex = headers.findIndex(h => h.includes('alias'));
  const emailIndex = headers.findIndex(h => h.includes('email'));
  const phoneIndex = headers.findIndex(h => h.includes('phone'));

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return {
      name: values[nameIndex] || '',
      sku: values[skuIndex] || '',
      category: values[categoryIndex] || '',
      description: values[descriptionIndex] || undefined,
      color: values[colorIndex] || undefined,
      alias: values[aliasIndex] || undefined,
      email: values[emailIndex] || undefined,
      phone: values[phoneIndex] || undefined,
    };
  }).filter(row => row.name && row.sku && row.category);
};

export const parseExcel = (jsonData: any[]): ParsedRow[] => {
  if (!jsonData || jsonData.length === 0) return [];

  return jsonData.map(row => ({
    name: row.name || row.Name || '',
    sku: row.sku || row.SKU || row.Sku || '',
    category: row.category || row.Category || '',
    description: row.description || row.Description || undefined,
    color: row.color || row.Color || undefined,
    alias: row.alias || row.Alias || undefined,
    email: row.email || row.Email || undefined,
    phone: row.phone || row.Phone || undefined,
  })).filter(row => row.name && row.sku && row.category);
};

export const parseCSVText = parseCSV;
export const parseExcelFile = parseExcel;

export const downloadTemplate = (type: 'products' | 'clients' | 'suppliers') => {
  const templates = {
    products: 'name,sku,category,description,color,alias\n',
    clients: 'name,email,phone,address,contact_person,notes\n',
    suppliers: 'name,email,phone,notes\n'
  };
  
  const blob = new Blob([templates[type]], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const validateFileType = (file: File): boolean => {
  const validTypes = ['.csv', '.xlsx', '.xls'];
  return validTypes.some(type => file.name.toLowerCase().endsWith(type));
};
