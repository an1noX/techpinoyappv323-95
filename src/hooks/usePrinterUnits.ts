
import { useState, useEffect } from 'react';
import { PrinterUnit } from '@/types/printer-unit';
import { printerUnitService } from '@/services/printerUnitService';
import { useToast } from '@/hooks/use-toast';

export const usePrinterUnits = (status?: PrinterUnit['status']) => {
  const [printerUnits, setPrinterUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPrinterUnits = async () => {
    try {
      setLoading(true);
      let data: any[] = [];
      
      if (status) {
        // For specific status, use enhanced data
        const basicData = await printerUnitService.getPrinterUnitsByStatus(status);
        const enhancedData = await printerUnitService.getEnhancedPrinterUnits();
        data = enhancedData.filter(unit => unit && unit.status === status);
      } else {
        // For all data, use enhanced data
        data = await printerUnitService.getEnhancedPrinterUnits();
      }
      
      // Filter out null/undefined units and ensure printer data exists
      const validUnits = (data || []).filter(unit => {
        if (!unit) return false;
        // Add a fallback printer object if missing
        if (!unit.printer) {
          unit.printer = {
            id: '',
            name: 'Unknown Printer',
            manufacturer: '',
            model: '',
            series: '',
            image_url: ''
          };
        }
        return true;
      });
      
      setPrinterUnits(validUnits);
    } catch (error) {
      console.error('Failed to load printer units:', error);
      setPrinterUnits([]); // Set to empty array on error
      toast({
        title: "Error",
        description: "Failed to load printer units. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinterUnits();
  }, [status]);

  return {
    printerUnits,
    loading,
    loadPrinterUnits,
  };
};

export const useInventorySummary = () => {
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    retired: 0,
    rented: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await printerUnitService.getInventorySummary();
      setSummary(data || {
        total: 0,
        available: 0,
        assigned: 0,
        maintenance: 0,
        retired: 0,
        rented: 0,
      });
    } catch (error) {
      console.error('Failed to load inventory summary:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return {
    summary,
    loading,
    loadSummary,
  };
};
