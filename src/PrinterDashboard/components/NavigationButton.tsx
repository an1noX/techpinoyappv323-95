
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  show?: boolean;
  isInitial?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  label,
  count,
  isActive,
  onClick,
  icon,
  show = true,
  isInitial = false
}) => {
  if (!show) return null;
  
  // If this is a back button, show icon only
  if (label.toLowerCase() === 'back') {
    return (
      <button
        onClick={onClick}
        className="h-12 w-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    );
  }
  
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={onClick}
      className={cn(
        "flex-1 relative h-12 flex flex-col items-center justify-center gap-1 text-xs",
        isActive && "bg-blue-600 text-white"
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge 
          variant="secondary" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
};

export default NavigationButton;
export { NavigationButton };
