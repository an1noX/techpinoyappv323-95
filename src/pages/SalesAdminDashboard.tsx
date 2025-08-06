
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePrinters } from '@/hooks/usePrinters';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';

const SalesAdminDashboard: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Sales Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile || (userProfile.role !== 'sales_admin' && userProfile.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-lg font-bold">Sales Admin Dashboard</h1>
          <p className="text-blue-100 text-sm">Manage sales operations</p>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 pb-24 overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">Sales admin dashboard coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAdminDashboard;
