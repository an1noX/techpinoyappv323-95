
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

interface PrinterDashboardHeaderProps {
  debugMode: boolean;
  onToggleDebug: () => void;
}

const PrinterDashboardHeader = React.memo(({ debugMode, onToggleDebug }: PrinterDashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-blue-600 text-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-blue-700"
            onClick={() => navigate('/')}
            title="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">Printer Fleet</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-blue-700 ${debugMode ? 'bg-blue-700' : ''}`}
            onClick={onToggleDebug}
            title="Toggle Debug Mode"
          >
            <Bug className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

PrinterDashboardHeader.displayName = 'PrinterDashboardHeader';

export default PrinterDashboardHeader;
