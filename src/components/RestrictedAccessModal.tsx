import React from 'react';
import { AlertTriangle, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

interface RestrictedAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RestrictedAccessModal = ({ open, onOpenChange }: RestrictedAccessModalProps) => {
  const { signOut, userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-semibold">Access Restricted</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            You don't have administrator privileges to access this application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current Role:</strong> {userProfile?.role || 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Email:</strong> {userProfile?.email || 'Unknown'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            
            <Button 
              onClick={() => window.location.href = 'mailto:admin@techpinoy.com?subject=Access Request&body=Please grant me administrator access to the TechPinoy application.'}
              variant="secondary"
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};