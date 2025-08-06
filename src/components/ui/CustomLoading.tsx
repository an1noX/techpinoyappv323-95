import React from 'react';
import logo from '@/img/logo.png';

interface CustomLoadingProps {
  message?: string;
  fullscreen?: boolean;
}

export const CustomLoading: React.FC<CustomLoadingProps> = ({ message, fullscreen }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullscreen ? 'fixed inset-0 z-50' : 'py-8'}`}>
      <div className="flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="w-24 h-24 flex items-center justify-center">
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {/* Animated loading dots */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}; 