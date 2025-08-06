import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DeliveryReceipts from "./pages/DeliveryReceipts";
import PurchaseOrders from "./pages/PurchaseOrders";
import Products from "./pages/Products";
import TransactionRecord from "./pages/TransactionRecord";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/delivery-receipts" element={<DeliveryReceipts />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/transaction-record" element={<TransactionRecord editMode={false} toggleEditMode={() => {}} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
