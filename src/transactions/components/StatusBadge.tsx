import { Badge } from "@/components/ui/badge";
import { FulfillmentStatus } from "../types";

interface StatusBadgeProps {
  status: FulfillmentStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusConfig = (status: FulfillmentStatus) => {
    switch (status) {
      case 'fulfilled':
        return {
          label: 'Fulfilled',
          className: 'bg-business-green text-white hover:bg-business-green/90'
        };
      case 'partial':
        return {
          label: 'Partial',
          className: 'bg-business-amber text-white hover:bg-business-amber/90'
        };
      case 'unfulfilled':
        return {
          label: 'Unfulfilled',
          className: 'bg-muted text-muted-foreground hover:bg-muted/90'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={`${config.className} ${className}`}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
};