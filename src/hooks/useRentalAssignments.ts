import { useState, useEffect } from 'react';
import { assetService, PrinterAssignment } from '@/services/assetService';

export const useRentalAssignments = () => {
  const [rentalAssignments, setRentalAssignments] = useState<PrinterAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRentalAssignments = async () => {
    try {
      setLoading(true);
      const allAssignments = await assetService.getAllAssignments();
      // Filter for rental assignments - include both active rentals and placeholder entries
      const rentals = allAssignments.filter(assignment => assignment.usage_type === 'rental');
      setRentalAssignments(rentals);
    } catch (error) {
      console.error('Failed to load rental assignments:', error);
      setRentalAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentalAssignments();
  }, []);

  return {
    rentalAssignments,
    loading,
    loadRentalAssignments,
  };
};
