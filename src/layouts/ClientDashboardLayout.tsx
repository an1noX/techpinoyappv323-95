import React from 'react';

const ClientDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="max-w-4xl mx-auto px-4 py-8">
      {children}
    </div>
  </div>
);

export default ClientDashboardLayout; 