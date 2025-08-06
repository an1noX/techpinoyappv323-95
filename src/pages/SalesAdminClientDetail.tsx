
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Building2, Edit, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';

import EditClientModal from '@/components/EditClientModal';
import AssignPrinterToClientModal from '@/PrinterDashboard/AssignPrinterToClientModal';

const SalesAdminClientDetail: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('departments');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [isDepartmentDetailsView, setIsDepartmentDetailsView] = useState(false);

  // Fetch client details
  const { data: client, isLoading: clientLoading, refetch } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID required');
      const clients = await clientService.getClients();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId,
  });

  const handleClientUpdated = (updatedClient: any) => {
    refetch();
    setShowEditModal(false);
  };

  if (loading || clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Client Details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile || (userProfile.role !== 'sales_admin' && userProfile.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Client not found</p>
          <Button onClick={() => navigate('/sales-dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Sales admin components are being developed.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-blue-600 text-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-blue-700"
                onClick={() => navigate('/sales-dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{client.name}</h1>
                <p className="text-blue-100 text-sm">Client Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <button onClick={() => setInfoExpanded(v => !v)} className="ml-2 p-1 rounded hover:bg-blue-700">
                {infoExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Company Details Section */}
          {infoExpanded && (
            <div className="px-4 pb-4">
              <div className="bg-blue-500/30 rounded-lg p-3 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="space-y-1">
                      {client.contact_person && (
                        <p className="text-white text-sm">
                          <span className="text-blue-100">Contact:</span> {client.contact_person}
                        </p>
                      )}
                      {client.contact_email && (
                        <p className="text-white text-sm">
                          <span className="text-blue-100">Email:</span> {client.contact_email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="text-white text-sm">
                          <span className="text-blue-100">Phone:</span> {client.phone}
                        </p>
                      )}
                      {client.address && (
                        <p className="text-white text-sm">
                          <span className="text-blue-100">Address:</span> {client.address}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-white text-sm">
                          <span className="text-blue-100">Departments:</span> {client.department_count || 0}
                        </span>
                        <span className="text-white text-sm">
                          <span className="text-blue-100">Printers:</span> {client.printer_count || 0}
                        </span>
                      </div>
                      
                      {!client.contact_person && !client.contact_email && !client.phone && !client.address && (
                        <p className="text-white/90 text-sm">
                          No contact details available. Click edit to add information.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-blue-700"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className={`p-4 ${isDepartmentDetailsView ? 'pb-4' : 'pb-24'}`}>
          {renderTabContent()}
        </div>



        {/* Edit Client Modal */}
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onClientUpdated={handleClientUpdated}
          client={client}
        />
      </div>
    </div>
  );
};

export default SalesAdminClientDetail;
