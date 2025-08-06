import React from 'react';

interface GenericNavProps {
  leftSection?: React.ReactNode;
  centerSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  className?: string;
}

export const GenericNav = ({ leftSection, centerSection, rightSection, className }: GenericNavProps) => {
  return (
    <nav className={`fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl flex items-center px-1 sm:px-2 py-1 sm:py-2 transition-all ${className || ''}`}>
      {/* Left section (e.g., back button) */}
      {leftSection && <div className="flex-shrink-0 sm:mr-2">{leftSection}</div>}
      {/* Center section (e.g., search/filter) */}
      {centerSection && <div className="flex-1 flex items-center min-w-0 justify-center">{centerSection}</div>}
      {/* Right section (e.g., add/menu button) */}
      {rightSection && <div className="flex-shrink-0 sm:ml-2">{rightSection}</div>}
    </nav>
  );
};