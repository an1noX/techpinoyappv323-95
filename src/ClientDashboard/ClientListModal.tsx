import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { Client } from '@/types/database';
import { useClients } from '@/hooks/useClients';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected: (client: Client) => void;
  title?: string;
  description?: string;
}

const ClientListModal: React.FC<ClientListModalProps> = ({
  isOpen,
  onClose,
  onClientSelected,
  title = "Select a Client",
  description = "Choose a client to view their details.",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { clients, loading } = useClients();
  const { user, userProfile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', contact_email: '', address: '', phone: '' });
  const [addingClient, setAddingClient] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Query to fetch client access for the current user
  const { data: clientAccess, isLoading: clientAccessLoading } = useQuery({
    queryKey: ['client-access', user?.id],
    queryFn: async () => {
      if (!user?.id || userProfile?.role !== 'client') return [];
      
      const { data, error } = await supabase
        .from('client_access' as any)
        .select('client_id')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching client access:', error);
        throw error;
      }
      
      // Ensure data exists and is an array before mapping
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      return data.map((access: any) => access.client_id);
    },
    enabled: !!user?.id && userProfile?.role === 'client',
  });

  // Filter clients based on user role and access
  const getAccessibleClients = () => {
    // Admin, sales_admin, and superadmin can see all clients
    if (userProfile?.role === 'admin' || userProfile?.role === 'sales_admin' || userProfile?.role === 'superadmin') {
      return clients;
    }
    
    // For client role users, filter by client_access table
    if (userProfile?.role === 'client' && clientAccess) {
      return clients.filter(client => clientAccess.includes(client.id));
    }
    
    // Default case - show all clients
    return clients;
  };
  
  const accessibleClients = getAccessibleClients();
  const isLoadingData = loading || (userProfile?.role === 'client' && clientAccessLoading);

  // Focus management: focus search on open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const input = modalRef.current.querySelector('input');
      if (input) (input as HTMLInputElement).focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, [isOpen]);

  // Keyboard accessibility: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Add client handler
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim() || !newClient.contact_email.trim() || !newClient.address.trim() || !newClient.phone.trim()) {
      toast({ title: 'All fields required', description: 'Please fill in Company Name, Email, Address, and Phone.', variant: 'destructive' });
      return;
    }
    setAddingClient(true);
    try {
      await clientService.createClient({
        name: newClient.name.trim(),
        contact_email: newClient.contact_email.trim(),
        address: newClient.address.trim(),
        phone: newClient.phone.trim(),
      });
      toast({ title: 'Client added', description: 'Client was added successfully.' });
      setShowAddClient(false);
      setNewClient({ name: '', contact_email: '', address: '', phone: '' });
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add client', variant: 'destructive' });
    } finally {
      setAddingClient(false);
    }
  };

  const filteredClients = accessibleClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col bg-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-list-modal-title"
      aria-describedby="client-list-modal-desc"
    >
      {/* Mobile-first full-screen modal */}
      <div
        ref={modalRef}
        className="relative flex flex-col h-full w-full bg-white animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Compact sticky header */}
        <div className="sticky top-0 z-20 bg-blue-50/95 backdrop-blur-sm border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 id="client-list-modal-title" className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
                <p id="client-list-modal-desc" className="text-xs text-gray-600 truncate">{description}</p>
              </div>
            </div>
          </div>
          
          {/* Compact search */}
          <div className="relative mt-3">
            <div tabIndex={0} aria-hidden="true" style={{ width: 0, height: 0, overflow: 'hidden' }} />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Search clients..."
              aria-label="Search clients"
            />
          </div>
        </div>

        {/* Scrollable content with mobile optimization */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {isLoadingData ? (
            <CustomLoading message="Loading clients" />
          ) : filteredClients.length > 0 ? (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white active:scale-[0.98] touch-target"
                  onClick={() => {
                    onClientSelected(client);
                    onClose();
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select client ${client.name}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onClientSelected(client);
                      onClose();
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">{client.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {client.contact_email && `${client.contact_email}`}
                      {client.phone && client.contact_email && ` • `}
                      {client.phone && `${client.phone}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'No clients match your search' : 
                 userProfile?.role === 'client' ? 'No clients assigned to you' : 'No clients available'}
              </p>
            </div>
          )}
        </div>

        {/* Sticky bottom action */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 space-y-2">
          {/* Only show Add Client button for non-client roles */}
          {userProfile?.role !== 'client' && (
            <button
              className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-200 active:scale-[0.98] touch-target"
              onClick={() => setShowAddClient(true)}
              aria-label="Add Client"
            >
              Add Client
            </button>
          )}
          <button
            ref={cancelBtnRef}
            className="w-full h-12 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium text-sm transition-all duration-200 active:scale-[0.98] touch-target"
            onClick={onClose}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/40">
            <form
              className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto space-y-4"
              onSubmit={handleAddClient}
            >
              <h3 className="text-lg font-semibold mb-2">Add New Client</h3>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Company Name*"
                value={newClient.name}
                onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
                required
                autoFocus
              />
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                placeholder="Email*"
                value={newClient.contact_email}
                onChange={e => setNewClient(c => ({ ...c, contact_email: e.target.value }))}
                required
              />
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Address*"
                value={newClient.address}
                onChange={e => setNewClient(c => ({ ...c, address: e.target.value }))}
                required
              />
              <input
                type="tel"
                className="w-full border rounded px-3 py-2"
                placeholder="Phone*"
                value={newClient.phone}
                onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))}
                required
              />
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="flex-1 h-10 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={() => setShowAddClient(false)}
                  disabled={addingClient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={addingClient}
                >
                  {addingClient ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientListModal;
