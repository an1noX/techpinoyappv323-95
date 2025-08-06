import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, lazy } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientAccessRoute from "@/components/ClientAccessRoute";
import UserRestrictedRoute from "@/components/UserRestrictedRoute";
import logo from '@/img/logo.png';
import { ClientManagementPage } from './ClientDashboard/ClientManagementPage';

const Index = lazy(() => import('./pages/Index'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MigrationPage = lazy(() => import('./pages/MigrationPage'));
const Auth = lazy(() => import('./pages/Auth'));
const PrinterDashboard = lazy(() => import('./PrinterDashboard/PrinterDashboard'));
const ClientDashboard = lazy(() => import('./ClientDashboard/ClientDashboard'));
const ProductDashboard = lazy(() => import('./ProductDashboard/ProductDashboard'));
const SupplierDashboard = lazy(() => import('./SupplierDashboard/SupplierDashboard'));
const SalePage = lazy(() => import('./SalesDashboard/SalePage').then(module => ({ default: module.SalePage })));
const SalesOverview = lazy(() => import('./SalesDashboard/SalesOverview').then(module => ({ default: module.SalesOverview })));
const TransactionPage = lazy(() => import('./pages/TransactionPage'));
const AdminServiceReports = lazy(() => import('./pages/admin/AdminServiceReports').then(module => ({ default: module.AdminServiceReports })));
const IncomeExpensePage = lazy(() => import('./pages/IncomeExpensePage').then(module => ({ default: module.IncomeExpensePage })));

const queryClient = new QueryClient();

// Loading component with logo and animated dots
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col items-center justify-center">
    <div className="flex flex-col items-center space-y-6">
      {/* Logo */}
      <div className="w-24 h-24 flex items-center justify-center">
        <img
          src={logo}
          alt="Logo"
          className="w-full h-full object-contain"
        />
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingFallback />}>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute requireAdmin={false}>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Navigate to="/" replace />
                  </ProtectedRoute>
                } />
                <Route path="/user" element={
                  <ProtectedRoute requireAdmin={false}>
                    <UserRestrictedRoute />
                  </ProtectedRoute>
                } />
                <Route path="/clients/:clientId" element={
                  <ProtectedRoute>
                    <ClientAccessRoute>
                      <ClientDashboard />
                    </ClientAccessRoute>
                  </ProtectedRoute>
                } />
                <Route path="/printer-dashboard" element={<PrinterDashboard />} />
                <Route path="/product-dashboard" element={<ProductDashboard />} />
                <Route path="/suppliers/:supplierId" element={<SupplierDashboard />} />
                <Route path="/sales-entry" element={<SalePage />} />
                <Route path="/overview" element={
                  <div className="min-h-screen">
                    <SalesOverview />
                  </div>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/migration" element={<MigrationPage />} />
                <Route 
                  path="/clients/:clientId/manage" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <ClientManagementPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/transaction" element={<TransactionPage />} />
                <Route path="/admin/reports" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminServiceReports />
                  </ProtectedRoute>
                } />
                <Route path="/income-expense" element={<IncomeExpensePage />} />
              </Routes>
            </BrowserRouter>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
