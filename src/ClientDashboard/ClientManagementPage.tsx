import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, UserPlus, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const ClientManagementPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [tax, setTax] = useState<string>('');
  const [wht, setWht] = useState<string>('');
  const [isSavingTax, setIsSavingTax] = useState(false);

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single(); // Removed .format('json') to avoid 406 error
      return data as any; // Type assertion to handle dynamic columns
    },
  });

  // client_access table
  // id = unique id
  // user_id = fk to profiles.id
  // client_id = fk to clients.id

  // Fetch users with access to this client
  const { data: clientUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['client-users', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_access' as any)
        .select('id, user_id, client_id, profiles(id, email, role)') // user_id is FK to profiles.id, client_id is FK to clients.id
        .eq('client_id', clientId);
      return data;
    },
  });

  // Fetch available users to add
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users', showAddUserModal],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email'); // Directly fetch all users, no filtering
      return data;
    },
    enabled: showAddUserModal,
  });

  // Load tax data when client data is available
  useEffect(() => {
    if (client) {
      setTax(client.tax || '');
      setWht(client.wht || '');
    }
  }, [client]);

  const handleSaveTax = async () => {
    setIsSavingTax(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          tax: tax || null,
          wht: wht || null,
        } as any)
        .eq('id', clientId);

      if (error) {
        toast({
          title: 'Error saving tax information',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Tax information saved successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error saving tax information',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTax(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    const { error } = await supabase
      .from('client_access' as any)
      .insert({
        user_id: userId, // FK to profiles.id
        client_id: clientId, // FK to clients.id
      });

    if (error) {
      toast({
        title: 'Error adding user',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'User added successfully',
      variant: 'default',
    });
    refetchUsers();
    setShowAddUserModal(false);

    // If the added user is the currently logged-in user, redirect to /clients/{clientId}
    if (userId === user?.id) {
      navigate(`/clients/${clientId}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase
      .from('client_access' as any)
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId); // user_id instead of profile_id

    if (error) {
      toast({
        title: 'Error removing user',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'User removed successfully',
      variant: 'default',
    });
    refetchUsers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-blue-100/95 backdrop-blur-sm border-b border-blue-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${clientId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Client Management</h1>
            <p className="text-sm text-gray-600">{client?.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Access</h2>
            <Button
              onClick={() => setShowAddUserModal(true)}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* User List */}
          <div className="space-y-2">
            {clientUsers?.map((access: any) => (
              <div
                key={access.user_id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium">{access.profiles.email}</p>
                  <p className="text-xs text-gray-500">{access.profiles.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUser(access.user_id)} // user_id instead of profile_id
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Management Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tax Management</h2>
            <Button
              onClick={handleSaveTax}
              disabled={isSavingTax}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingTax ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax</Label>
              <Input
                id="tax"
                type="text"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="Enter tax information"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wht">Withholding Tax</Label>
              <Input
                id="wht"
                type="text"
                value={wht}
                onChange={(e) => setWht(e.target.value)}
                placeholder="Enter withholding tax information"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (selectedUserId) handleAddUser(selectedUserId);
              }}
              disabled={!selectedUserId}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};