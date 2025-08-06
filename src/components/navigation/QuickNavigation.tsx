import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Package, Building2, Users, DollarSign, Printer, Monitor, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
interface QuickNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  available: boolean;
}
const quickNavItems: QuickNavItem[] = [{
  title: 'Dashboard',
  href: '/dashboard',
  icon: <Home className="h-4 w-4" />,
  description: 'Main dashboard',
  color: 'bg-blue-600',
  available: true
}, {
  title: 'Homepage Settings',
  href: '/homepage-settings',
  icon: <Settings className="h-4 w-4" />,
  description: 'Configure homepage',
  color: 'bg-emerald-600',
  available: true
}, {
  title: 'Products',
  href: '/products',
  icon: <Package className="h-4 w-4" />,
  description: 'Manage products',
  color: 'bg-purple-600',
  available: true
}, {
  title: 'Suppliers',
  href: '/manage-suppliers',
  icon: <Building2 className="h-4 w-4" />,
  description: 'Manage suppliers',
  color: 'bg-blue-600',
  available: true
}, {
  title: 'Clients',
  href: '/clients',
  icon: <Users className="h-4 w-4" />,
  description: 'Client management',
  color: 'bg-green-600',
  available: true
}, {
  title: 'Pricing',
  href: '/price-comparison',
  icon: <DollarSign className="h-4 w-4" />,
  description: 'Price analysis',
  color: 'bg-orange-600',
  available: true
}, {
  title: 'Printers',
  href: '/printers',
  icon: <Printer className="h-4 w-4" />,
  description: 'Printer database',
  color: 'bg-slate-600',
  available: true
}, {
  title: 'Assets',
  href: '/assets',
  icon: <Monitor className="h-4 w-4" />,
  description: 'Asset tracking',
  color: 'bg-indigo-600',
  available: true
}, {
  title: 'Templates',
  href: '/templates',
  icon: <BarChart3 className="h-4 w-4" />,
  description: 'Manage templates',
  color: 'bg-pink-600',
  available: true
}];
interface QuickNavigationProps {
  compact?: boolean;
  maxItems?: number;
}
export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  compact = false,
  maxItems = 12
}) => {
  const location = useLocation();
  const displayItems = quickNavItems.slice(0, maxItems);
  if (compact) {
    return;
  }
  return <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayItems.map(item => {
          const isActive = location.pathname === item.href;
          return <Link key={item.href} to={item.href}>
                <Button variant="outline" disabled={!item.available} className={cn('h-auto py-3 px-4 flex flex-col items-center gap-2 w-full', isActive && 'ring-2 ring-primary ring-offset-2')}>
                  <div className={cn('p-2 rounded-md', item.color)}>
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
              </Link>;
        })}
        </div>
      </CardContent>
    </Card>;
};