
import React from 'react';
import logo from '@/img/logo.png';

interface HeaderLogoProps {
  clientName: string;
  isMainDashboard: boolean;
  onClick: () => void;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
  clientName,
  isMainDashboard,
  onClick
}) => {
  return (
    <div className="flex items-center space-x-2">
      <img 
        src={logo} 
        alt="TechPinoy Logo" 
        className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity" 
        onClick={onClick}
      />
      <span className="font-bold text-lg">
        {isMainDashboard ? 'TechPinoy App' : clientName}
      </span>
    </div>
  );
};
