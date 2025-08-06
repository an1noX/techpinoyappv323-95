
import { useState, useEffect } from 'react';
import { MaintenanceSchedule, assetService } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';

export const useMaintenanceSchedules = (printerId?: string) => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSchedules = async () => {
    if (!printerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await assetService.getMaintenanceSchedule(printerId);
    setSchedules(data);
    setLoading(false);
  };

  const createSchedule = async (schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    await assetService.createMaintenanceSchedule(schedule);
    await loadSchedules();
    toast({
      title: "Success",
      description: "Maintenance schedule created successfully.",
    });
  };

  const updateSchedule = async (id: string, updates: Partial<MaintenanceSchedule>) => {
    await assetService.updateMaintenanceSchedule(id, updates);
    await loadSchedules();
    toast({
      title: "Success",
      description: "Maintenance schedule updated successfully.",
    });
  };

  useEffect(() => {
    if (printerId) {
      loadSchedules().catch((error) => {
        console.error('Failed to load maintenance schedules:', error);
        toast({
          title: "Error",
          description: "Failed to load maintenance schedules. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      });
    }
  }, [printerId]);

  return {
    schedules,
    loading,
    loadSchedules,
    createSchedule,
    updateSchedule,
  };
};
