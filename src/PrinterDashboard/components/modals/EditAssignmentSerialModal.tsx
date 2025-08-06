
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface EditAssignmentSerialModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSerialUpdated: (newSerial: string) => void;
}

const EditAssignmentSerialModal: React.FC<EditAssignmentSerialModalProps> = ({ 
  assignmentId, 
  isOpen, 
  onClose, 
  onSerialUpdated 
}) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!assignmentId || !isOpen) return;
    
    const fetchSerial = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('printer_assignments')
          .select('serial_number')
          .eq('id', assignmentId)
          .single();
        
        if (error) {
          console.error('Error fetching serial number:', error);
          setError('Failed to fetch serial number');
        } else {
          setSerialNumber(data?.serial_number || '');
        }
      } catch (err) {
        console.error('Error fetching serial number:', err);
        setError('Failed to fetch serial number');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSerial();
  }, [assignmentId, isOpen]);

  const handleSave = async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('printer_assignments')
        .update({ 
          serial_number: serialNumber, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', assignmentId);
      
      if (error) {
        console.error('Error updating serial number:', error);
        setError('Failed to update serial number');
        toast({ 
          title: 'Error', 
          description: 'Failed to update serial number', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Success', 
          description: 'Serial number updated successfully' 
        });
        onSerialUpdated(serialNumber);
      }
    } catch (err) {
      console.error('Error updating serial number:', err);
      setError('Failed to update serial number');
      toast({ 
        title: 'Error', 
        description: 'Failed to update serial number', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Serial Number</DialogTitle>
        </DialogHeader>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Serial Number</label>
          <Input
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
            disabled={loading}
            placeholder="Enter serial number"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !serialNumber.trim()}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssignmentSerialModal;
