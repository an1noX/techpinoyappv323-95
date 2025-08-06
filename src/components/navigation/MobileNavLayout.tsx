
import React from 'react';

interface MobileNavLayoutProps {
  leftSection?: React.ReactNode;
  centerSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  className?: string;
}

export const MobileNavLayout = ({ 
  leftSection, 
  centerSection, 
  rightSection, 
  className = '' 
}: MobileNavLayoutProps) => {
  return (
    <nav className={`fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl transition-all ${className}`}>
      <div className="flex items-center px-2 py-2 min-h-[60px]">
        {/* Left section - fixed width */}
        {leftSection && (
          <div className="flex-shrink-0 w-12 flex justify-center">
            {leftSection}
          </div>
        )}
        
        {/* Center section - takes remaining space */}
        {centerSection && (
          <div className="flex-1 flex items-center min-w-0">
            {centerSection}
          </div>
        )}
        
        {/* Right section - make it stretch responsively */}
        {rightSection && rightSection}
      </div>
    </nav>
  );
};
