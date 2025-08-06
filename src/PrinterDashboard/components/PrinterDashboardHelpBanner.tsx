
import React from 'react';

interface PrinterDashboardHelpBannerProps {
  printerFilter: 'assigned' | 'available' | 'catalog' | 'inventory' | 'all';
}

const PrinterDashboardHelpBanner = React.memo(({ printerFilter }: PrinterDashboardHelpBannerProps) => {
  const getHelpText = () => {
    switch (printerFilter) {
      case 'assigned':
        return null;
      case 'available':
        return '🛈 Available Tab: List of Printers with Status = Available';
      case 'catalog':
        return '🛈 Catalog Tab: List of Printers Supported by Our Products';
      default:
        return null;
    }
  };

  const helpText = getHelpText();
  
  if (!helpText) return null;

  return (
    <div className="w-full bg-blue-50 border-b border-blue-100 py-2 px-4 text-sm text-blue-900 flex items-center gap-2">
      <span><b>{helpText}</b></span>
    </div>
  );
});

PrinterDashboardHelpBanner.displayName = 'PrinterDashboardHelpBanner';

export default PrinterDashboardHelpBanner;
