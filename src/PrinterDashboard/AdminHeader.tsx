import React from 'react';
import { LogOut, Bell, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 p-2 rounded-xl backdrop-blur-sm transition-all duration-200 mr-2"
            title="Back to Dashboard"
          >
             Back
          </Button>
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Admin Hub</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10 p-2 rounded-xl backdrop-blur-sm transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10 p-2 rounded-xl backdrop-blur-sm transition-all duration-200"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader; 