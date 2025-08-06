import { useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientTaxInfo {
  tax: string;
  wht: string;
}

interface DeliveryReceiptData {
  [poNumber: string]: string[];
}

interface SalesInvoiceData {
  [poNumber: string]: string[];
}

interface DrNumbersMap {
  [drId: string]: string;
}

export const usePurchaseOrderData = (filteredPOs: { [key: string]: any[] }, purchaseOrders: any[]) => {
  const [deliveryReceiptsByPO, setDeliveryReceiptsByPO] = useState<DeliveryReceiptData>({});
  const [salesInvoicesByPO, setSalesInvoicesByPO] = useState<SalesInvoiceData>({});
  const [drNumbers, setDrNumbers] = useState<DrNumbersMap>({});
  const [clientTaxData, setClientTaxData] = useState<Record<string, ClientTaxInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Memoize PO IDs to prevent unnecessary re-renders
  const poIds = useMemo(() => {
    return Object.values(filteredPOs)
      .flat()
      .map(po => po.id)
      .filter(Boolean);
  }, [filteredPOs]);

  // Memoize unique client IDs
  const uniqueClientIds = useMemo(() => {
    return Array.from(new Set(
      purchaseOrders
        .filter(po => po.supplier_client_id)
        .map(po => po.supplier_client_id)
    ));
  }, [purchaseOrders]);

  // Load DR numbers mapping once
  const loadDRNumbers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_receipt_number');

      if (error) throw error;
      
      const drNumberMap: DrNumbersMap = {};
      (data || []).forEach(dr => {
        drNumberMap[dr.id] = dr.delivery_receipt_number;
      });
      
      setDrNumbers(drNumberMap);
      return drNumberMap;
    } catch (error) {
      console.error('Error loading DR numbers:', error);
      return {};
    }
  }, []);

  // Load client tax information
  const loadClientTaxInfo = useCallback(async () => {
    if (uniqueClientIds.length === 0) return;
    
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .in('id', uniqueClientIds);
        
      if (error) throw error;
      
      const taxDataMap: Record<string, ClientTaxInfo> = {};
      (clientsData || []).forEach((client: any) => {
        taxDataMap[client.id] = {
          tax: client.tax || '12',
          wht: client.wht || '0'
        };
      });
      
      setClientTaxData(taxDataMap);
    } catch (error) {
      console.error('Error loading client tax info:', error);
    }
  }, [uniqueClientIds]);

  // Batch load delivery receipts and sales invoices
  const loadBatchedData = useCallback(async (drNumbersMap: DrNumbersMap) => {
    if (poIds.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Batch query for fulfillments
      const { data: fulfillmentData, error: fulfillmentError } = await supabase
        .from('fulfillments')
        .select('po_id, dr_id')
        .in('po_id', poIds);

      if (fulfillmentError) throw fulfillmentError;

      // Batch query for sales invoices
      const { data: salesInvoiceData, error: siError } = await supabase
        .from('sales_invoice')
        .select('purchase_order_id, invoice_number')
        .in('purchase_order_id', poIds)
        .order('invoice_date', { ascending: false });

      if (siError) throw siError;

      // Process data
      const drByPO: DeliveryReceiptData = {};
      const siByPO: SalesInvoiceData = {};

      // Group fulfillments by PO ID
      const fulfillmentsByPO: { [poId: string]: string[] } = {};
      (fulfillmentData || []).forEach(fulfillment => {
        if (!fulfillmentsByPO[fulfillment.po_id]) {
          fulfillmentsByPO[fulfillment.po_id] = [];
        }
        const drNumber = drNumbersMap[fulfillment.dr_id];
        if (drNumber && !fulfillmentsByPO[fulfillment.po_id].includes(drNumber)) {
          fulfillmentsByPO[fulfillment.po_id].push(drNumber);
        }
      });

      // Group sales invoices by PO ID
      const invoicesByPO: { [poId: string]: string[] } = {};
      (salesInvoiceData || []).forEach(invoice => {
        if (!invoicesByPO[invoice.purchase_order_id]) {
          invoicesByPO[invoice.purchase_order_id] = [];
        }
        if (invoice.invoice_number) {
          invoicesByPO[invoice.purchase_order_id].push(invoice.invoice_number);
        }
      });

      // Map results to PO numbers
      Object.entries(filteredPOs).forEach(([poNumber, poGroup]) => {
        if (poGroup && poGroup.length > 0) {
          const firstPO = poGroup[0];
          
          // Set DR numbers
          if (fulfillmentsByPO[firstPO.id]?.length > 0) {
            drByPO[poNumber] = fulfillmentsByPO[firstPO.id];
          }
          
          // Set sales invoice numbers
          if (invoicesByPO[firstPO.id]?.length > 0) {
            siByPO[poNumber] = invoicesByPO[firstPO.id];
          }
        }
      });

      setDeliveryReceiptsByPO(drByPO);
      setSalesInvoicesByPO(siByPO);
    } catch (error) {
      console.error('Error loading batched data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [poIds, filteredPOs]);

  // Initialize DR numbers on mount
  useEffect(() => {
    loadDRNumbers();
  }, [loadDRNumbers]);

  // Load client tax info when client IDs change
  useEffect(() => {
    loadClientTaxInfo();
  }, [loadClientTaxInfo]);

  // Load batched data when PO IDs or DR numbers change
  useEffect(() => {
    if (Object.keys(drNumbers).length > 0 && poIds.length > 0) {
      loadBatchedData(drNumbers);
    }
  }, [loadBatchedData, drNumbers, poIds]);

  // Memoized calculation function for tax-adjusted total
  const calculateTaxAdjustedTotal = useCallback((po: any) => {
    const subtotal = po.total_amount || 0;
    const clientInfo = clientTaxData[po.supplier_client_id];
    
    if (!clientInfo) return subtotal;
    
    const getVATRate = () => {
      if (clientInfo?.tax) {
        const match = clientInfo.tax.match(/(\d+(?:\.\d+)?)/);
        if (match) return parseFloat(match[1]) / 100;
      }
      return 0.12;
    };
    
    const getWHTRate = () => {
      if (clientInfo?.wht) {
        const whtValue = parseFloat(clientInfo.wht);
        if (!isNaN(whtValue)) return whtValue / 100;
      }
      return 0;
    };
    
    const vatRate = getVATRate();
    const whtRate = getWHTRate();
    const vatAmount = subtotal * (vatRate / (1 + vatRate));
    const netOfVat = subtotal - vatAmount;
    const withholdingTax = netOfVat * whtRate;
    const totalAmountDue = subtotal - withholdingTax;
    
    return totalAmountDue;
  }, [clientTaxData]);

  return {
    deliveryReceiptsByPO,
    salesInvoicesByPO,
    drNumbers,
    clientTaxData,
    isLoading,
    calculateTaxAdjustedTotal,
    refreshData: () => loadBatchedData(drNumbers)
  };
};