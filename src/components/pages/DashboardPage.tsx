
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShoppingCart, Package, ChevronRight, Building2, Printer, DollarSign, CreditCard, FileText, TrendingUp } from "lucide-react";
import { DashboardProductSearch } from "@/components/ui/DashboardProductSearch";
import { useClients } from "@/hooks/useClients";
import { useNavigate } from "react-router-dom";
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/hooks/useAuth';
import TopMobileHeader from '@/includes/TopMobileHeader';
import DatabaseSummary from '@/components/DatabaseSummary';
import ClientListModal from "@/ClientDashboard/ClientListModal";
import SupplierListModal from "@/SupplierDashboard/SupplierListModal";

interface DashboardPageProps {
  onNavigateToSection: (section: "management" | "sales" | "products") => void;
}

export const DashboardPage = ({
  onNavigateToSection
}: DashboardPageProps) => {
  const [selectedCard, setSelectedCard] = useState<string>("management");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<boolean>(false);
  const [expandedSuppliersCard, setExpandedSuppliersCard] = useState<boolean>(false);
  const [showClientListModal, setShowClientListModal] = useState(false);
  const [showSupplierListModal, setShowSupplierListModal] = useState(false);
  
  const { clients, loading: clientsLoading } = useClients();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const menuCards = [
    {
      id: "printers-dashboard",
      title: "Printers",
      icon: Printer,
      description: "Printer fleet dashboard",
      color: "bg-indigo-50 border-indigo-200",
      activeColor: "bg-indigo-100 border-indigo-300 shadow-md",
      iconColor: "text-indigo-600",
      onClick: () => navigate('/printer-dashboard')
    },
    {
      id: "clients",
      title: "Clients",
      icon: Users,
      description: "Client directory",
      color: "bg-orange-50 border-orange-200",
      activeColor: "bg-orange-100 border-orange-300 shadow-md",
      iconColor: "text-orange-600",
      onClick: () => setShowClientListModal(true)
    },
    {
      id: "suppliers-dashboard",
      title: "Suppliers",
      icon: Building2,
      description: "Supplier management",
      color: "bg-blue-50 border-blue-200",
      activeColor: "bg-blue-100 border-blue-300 shadow-md",
      iconColor: "text-blue-600",
      onClick: () => setShowSupplierListModal(true)
    },
    {
      id: "transaction",
      title: "Transaction",
      icon: CreditCard,
      description: "Transaction management",
      color: "bg-green-50 border-green-200",
      activeColor: "bg-green-100 border-green-300 shadow-md",
      iconColor: "text-green-600",
      onClick: () => navigate('/transaction')
    },
    {
      id: "products",
      title: "Products",
      icon: Package,
      description: "Product catalog",
      color: "bg-purple-50 border-purple-200",
      activeColor: "bg-purple-100 border-purple-300 shadow-md",
      iconColor: "text-purple-600",
      onClick: () => navigate('/product-dashboard')
    },
    {
      id: "reports",
      title: "View Reports",
      icon: FileText,
      description: "Service reports",
      color: "bg-gray-50 border-gray-200",
      activeColor: "bg-gray-100 border-gray-300 shadow-md",
      iconColor: "text-gray-600",
      onClick: () => navigate('/admin/reports')
    },
    {
      id: "income-expense",
      title: "Income & Expense",
      icon: TrendingUp,
      description: "Financial tracking",
      color: "bg-emerald-50 border-emerald-200",
      activeColor: "bg-emerald-100 border-emerald-300 shadow-md",
      iconColor: "text-emerald-600",
      onClick: () => navigate('/income-expense')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <TopMobileHeader
          client={{
            id: 'dashboard',
            name: 'TechPinoy App',
            contact_email: '',
            phone: '',
            notes: '',
            address: '',
            department_count: 0,
            location_count: 0,
            printer_count: 0,
            created_at: '',
            updated_at: '',
          }}
          onBack={() => navigate('/')}
          onEdit={() => {}}
          appVersion="1.0.0"
        />
        
        {/* Database Summary - Compact for mobile */}
        <div className="px-3 pb-2">
          <DatabaseSummary />
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="px-1 pt-2 pb-20 space-y-3">
        {/* Product Search - Mobile Optimized */}
        <div className="mb-4">
          <DashboardProductSearch />
        </div>

        {/* Menu Cards Grid - Mobile First */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 px-1">Quick Access</h2>
          <div className="grid grid-cols-1 gap-3">
            {menuCards.filter(card => {
              // Client users can only see Printers and Clients
              if (userProfile?.role === 'client') {
                return card.id === 'printers-dashboard' || card.id === 'clients';
              }
              // All other users see everything
              return true;
            }).map(card => {
              const Icon = card.icon;
              const isSelected = selectedCard === card.id;
              
              return (
                <Card 
                  key={card.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? card.activeColor : card.color
                  } hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border-2`} 
                  onClick={() => {
                    setSelectedCard(card.id);
                    setExpandedCard(null);
                    card.onClick();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${card.color} shadow-sm`}>
                          <Icon className={`h-7 w-7 ${card.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">{card.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-6 w-6 transition-transform duration-200 flex-shrink-0 ${
                        isSelected ? 'rotate-90 text-gray-700' : 'text-gray-400'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientListModal
        isOpen={showClientListModal}
        onClose={() => setShowClientListModal(false)}
        onClientSelected={client => navigate(`/clients/${client.id}`)}
        title="Select a Client"
        description="Choose a client to view their details."
      />
      
      <SupplierListModal
        isOpen={showSupplierListModal}
        onClose={() => setShowSupplierListModal(false)}
        onSupplierSelected={supplier => navigate(`/suppliers/${supplier.id}`)}
        title="Select a Supplier"
        description="Choose a supplier to view their details."
      />
    </div>
  );
};
