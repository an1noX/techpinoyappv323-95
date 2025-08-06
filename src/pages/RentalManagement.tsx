
import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import { PrinterAssignment } from '@/services/assetService';
import { useRentalAssignments } from '@/hooks/useRentalAssignments';

const RentalManagement = () => {
  const { rentalAssignments, loading, loadRentalAssignments } = useRentalAssignments();
  const [selectedRental, setSelectedRental] = useState<PrinterAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRentalSelect = (rental: PrinterAssignment) => {
    setSelectedRental(rental);
    setSearchTerm(rental.client?.name || '');
  };

  const handleRentalUpdate = () => {
    loadRentalAssignments();
    if (selectedRental) {
      // Refresh the selected rental data
      const updatedRental = rentalAssignments.find(r => r.id === selectedRental.id);
      if (updatedRental) {
        setSelectedRental(updatedRental);
      }
    }
  };

  const handleRentalDeleted = () => {
    setSelectedRental(null);
    setSearchTerm('');
    loadRentalAssignments();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading rental assignments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-center py-12">
                <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rental selected</h3>
                <p className="text-gray-600 mb-4">Search and select a rental assignment to view details</p>
                {rentalAssignments.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No rental assignments found. Add printers to rental management to get started.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedRental ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rental selected</h3>
                  <p className="text-gray-600 mb-4">Search and select a rental assignment to view details</p>
                  {rentalAssignments.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No rental assignments found. Add printers to rental management to get started.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rental selected</h3>
                  <p className="text-gray-600 mb-4">Search and select a rental assignment to view details</p>
                  {rentalAssignments.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No rental assignments found. Add printers to rental management to get started.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalManagement;
