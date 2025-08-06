import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: any;
  onClientUpdated?: (client: any) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onClientUpdated,
}) => {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  
  // State for email change
  const [newEmail, setNewEmail] = useState(userProfile?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // State for password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleEmailChange = async () => {
    if (!user) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail.trim() 
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Email update confirmation has been sent to your new email.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update email.',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    try {
      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        setPwError('Current password is incorrect.');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      setPwSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPwError('Failed to update password.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Edit className="h-5 w-5 text-white" />
            </div>
            <span>Update Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Change Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
              />
              <Button 
                onClick={handleEmailChange}
                disabled={emailLoading || newEmail === userProfile?.email}
              >
                {emailLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Change Password</h4>
            <form onSubmit={handlePasswordChange} className="space-y-2">
              <Input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Current Password"
              />
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
              />
              {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 text-sm">{pwSuccess}</p>}
              <Button type="submit" className="w-full" variant="secondary">
                Change Password
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;
