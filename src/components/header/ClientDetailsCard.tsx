
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Client } from '@/types/database';

interface ClientDetailsCardProps {
  client: Client;
  onEdit: () => void;
}

export const ClientDetailsCard: React.FC<ClientDetailsCardProps> = ({
  client,
  onEdit
}) => {
  const hasContactInfo = client.contact_person || client.contact_email || client.phone || client.address;

  return (
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
              <p className="text-sm text-blue-100">
                {client.department_count || 0} department{client.department_count === 1 ? '' : 's'} • 
                {client.location_count || 0} location{client.location_count === 1 ? '' : 's'} • 
                {client.printer_count || 0} printer{client.printer_count === 1 ? '' : 's'}
              </p>
            </div>
            
            {!hasContactInfo && (
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
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
