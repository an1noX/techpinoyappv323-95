import React from 'react';
import { BarChart3 } from 'lucide-react';
import { QuickNavigation } from '@/components/navigation/QuickNavigation';

const Dashboard = () => {
  // Example quick actions (can be extended)
  const quickActions = [
    {
      label: 'View Homepage',
      href: '/',
      icon: <BarChart3 className="h-4 w-4" />,
      variant: 'secondary' as const
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-blue-100/90 p-4 flex items-center gap-3 border-b border-blue-200 rounded-b-xl shadow-sm">
        <BarChart3 className="w-6 h-6 text-blue-500" />
        <span className="text-lg font-semibold">Supply Management Dashboard</span>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Navigation */}
        <section className="mb-4">
          <QuickNavigation />
        </section>

        {/* Quick Actions Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-base font-semibold">Quick Actions</span>
          </div>
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer h-12 focus-visible:ring-2 focus-visible:ring-blue-400">
              <div className="p-2 bg-blue-600 rounded-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-sm">Search Products</div>
                <div className="text-xs text-gray-600">Find and compare product prices</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer h-12 focus-visible:ring-2 focus-visible:ring-green-400">
              <div className="p-2 bg-green-600 rounded-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-sm">Price Comparison</div>
                <div className="text-xs text-gray-600">Analyze pricing across suppliers</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer h-12 focus-visible:ring-2 focus-visible:ring-purple-400">
              <div className="p-2 bg-purple-600 rounded-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-sm">View Reports</div>
                <div className="text-xs text-gray-600">Generate business insights (Coming Soon)</div>
              </div>
            </a>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span className="text-base font-semibold">Statistics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-600 rounded-md mx-auto w-fit mb-2">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-bold text-blue-600">Suppliers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="p-3 bg-green-600 rounded-md mx-auto w-fit mb-2">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-bold text-green-600">Clients</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="p-3 bg-purple-600 rounded-md mx-auto w-fit mb-2">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-bold text-purple-600">Products</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="p-3 bg-orange-600 rounded-md mx-auto w-fit mb-2">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-bold text-orange-600">Price Updates</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
