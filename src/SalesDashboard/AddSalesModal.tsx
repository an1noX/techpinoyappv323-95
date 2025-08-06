
import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Calendar, User, Paperclip, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClients } from "@/hooks/useClients";
import { productService } from '@/services/productService';
import textLogo from '../img/textlogo.png';
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku?: string;
  color?: string;
}

interface AddSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSalesModal = ({
  isOpen,
  onClose,
}: AddSalesModalProps) => {
  const { clients, loading: clientsLoading } = useClients();
  const [saleDate, setSaleDate] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [clientSelectionOpen, setClientSelectionOpen] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState<any[]>([]);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState(false);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(2);
  const [receiptType, setReceiptType] = useState("Sales Invoice");
  const [poNumber, setPONumber] = useState("");
  const [drNumber, setDRNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const [poSearch, setPOSearch] = useState("");
  const poOptions = ["PO-0001", "PO-0002", "PO-0003"];
  const [customerId, setCustomerId] = useState("123");
  const [dueDate, setDueDate] = useState("2020-01-08");
  const [dueDateInputType, setDueDateInputType] = useState<'text' | 'date'>("text");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(receiptType === "Sales Invoice");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  useEffect(() => {
    let cancelled = false;
    setProductSearchLoading(true);

    const fetchProducts = async () => {
      try {
        const results = await productService.searchProducts(productQuery.trim() ? productQuery : "");
        if (!cancelled) setProductResults(results);
      } catch (err) {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setProductSearchLoading(false);
      }
    };

    fetchProducts();

    return () => { cancelled = true; };
  }, [productQuery]);

  const handleAddProductClick = (product: Product) => {
    setQtyPromptProduct(product);
    setQtyInput(1);
    setQtyPromptOpen(true);
    setTimeout(() => { qtyInputRef.current?.focus(); }, 100);
  };

  const handleConfirmQty = () => {
    if (qtyPromptProduct && qtyInput > 0) {
      setAddedProducts(prev => [...prev, { ...qtyPromptProduct, quantity: qtyInput }]);
    }
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  const handleCancelQty = () => {
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  useEffect(() => {
    const fetchPrices = async () => {
      if (!selectedClient) {
        setPricingMap({});
        return;
      }
      const allProductIds = Array.from(new Set(addedProducts.map(p => p.id)));
      const newPricing: Record<string, number> = {};
      for (const productId of allProductIds) {
        try {
          const productWithClients = await productService.getProductWithClients(productId);
          if (productWithClients && productWithClients.clients) {
            const clientEntry = productWithClients.clients.find((c: any) => c.client_id === selectedClient);
            newPricing[productId] = clientEntry ? clientEntry.quoted_price : 0;
          } else {
            newPricing[productId] = 0;
          }
        } catch {
          newPricing[productId] = 0;
        }
      }
      setPricingMap(newPricing);
    };
    fetchPrices();
  }, [selectedClient, addedProducts]);

  const totalSalesAmount = addedProducts.reduce(
    (sum, p) => sum + ((pricingMap[p.id] || 0) * p.quantity),
    0
  );

  const VAT_RATE = 0.12;
  const WITHHOLDING_TAX_RATE = 0.02;

  const vatAmount = totalSalesAmount > 0 ? (totalSalesAmount * VAT_RATE) / (1 + VAT_RATE) : 0;
  const netOfVat = totalSalesAmount - vatAmount;
  const discount = 0;
  const withholdingTax = withholdingTaxEnabled ? netOfVat * (withholdingTaxRate / 100) : 0;
  const totalAmountDue = netOfVat - discount + vatAmount - withholdingTax;

  let receiptNumberLabel = "INVOICE #";
  if (receiptType === "Purchase Order") receiptNumberLabel = "PO #";
  else if (receiptType === "Delivery Receipt") receiptNumberLabel = "DR #";

  useEffect(() => {
    if (receiptType === "Sales Invoice") setConfirmCheckbox(true);
    else setConfirmCheckbox(false);
  }, [receiptType, showConfirm]);

  if (!isOpen) return null;

  // Client selection modal - Mobile optimized
  if (clientSelectionOpen) {
    const filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset w-screen h-screen">
        <div className="flex-1 flex flex-col overflow-y-auto w-full h-full">
          <div className="p-0 flex-1 flex flex-col w-full h-full">
            <div className="bg-card rounded-none shadow-none p-0 flex-1 flex flex-col w-full h-full">
              <div className="sticky top-0 z-10 bg-card flex flex-col gap-2 mb-3 pb-2 w-full">
                <div className="flex justify-between items-center px-4 pt-4">
                  <h2 className="text-lg font-bold text-foreground">Select Client</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="px-4">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full h-11 px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex-1 max-h-full overflow-y-auto mt-3 space-y-1 px-4 pb-4">
                {filteredClients.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8 text-sm">No clients found</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        className="w-full flex flex-col items-start p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-blue-50 active:scale-[0.98] transition-all duration-150"
                        onClick={() => {
                          setSelectedClient(client.id);
                          setClientSelectionOpen(false);
                        }}
                      >
                        <div className="font-medium text-gray-900 text-base truncate w-full">{client.name}</div>
                        {client.address && <div className="text-xs text-gray-500 mt-1 truncate w-full">{client.address}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredProductResults = productResults.filter(product =>
    product.name.toLowerCase().includes(productQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productQuery.toLowerCase()))
  );

  const getStatusForTransaction = () => {
    if (receiptType === "Sales Invoice") return confirmCheckbox ? "paid" : "unpaid";
    if (receiptType === "Delivery Receipt") return confirmCheckbox ? "adv_delivery" : "delivered";
    if (receiptType === "Purchase Order") return confirmCheckbox ? "paid" : "unpaid";
    return "unpaid";
  };

  async function sendSaleToGoogleSheets(status?: string) {
    const month = new Date(saleDate).toLocaleString('en-US', { month: 'long' });
    for (const p of addedProducts) {
      const row = [
        status || "",
        saleDate,
        "",
        selectedClientObj?.name || "",
        p.sku || p.name,
        p.quantity,
        pricingMap[p.id] || 0,
        (pricingMap[p.id] || 0) * p.quantity,
        invoiceNumber || "",
        drNumber || "",
        poNumber || "",
      ];
      const payload = {
        sheet: month,
        data: row,
      };
      try {
        const res = await fetch('https://db.techpinoy.net/functions/v1/google-sheets-handler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error('Failed to write sale to Google Sheets');
        }
      } catch (err) {
        console.error('Network or CORS error sending to Google Sheets');
      }
    }
  }

  const handleComplete = async () => {
    if (!saleDate || isNaN(new Date(saleDate).getTime())) {
      setShowDateModal(true);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSale = async () => {
    const status = getStatusForTransaction();
    await sendSaleToGoogleSheets(status);
    setShowConfirm(false);
    onClose();
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Add Item Modal - Mobile optimized */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col safe-area-inset-bottom">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Add Item to Sale
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <Input
                type="text"
                placeholder="Search products to add..."
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                className="mb-3 h-11 text-sm"
              />
              <div className="bg-background border border-border rounded-lg shadow-sm max-h-64 overflow-y-auto">
                {productSearchLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
                ) : filteredProductResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">No products found</div>
                ) : (
                  filteredProductResults.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted transition cursor-pointer active:bg-muted/70"
                      onClick={() => handleAddProductClick(product)}
                    >
                      <div className="flex items-center gap-3 w-full min-w-0">
                        {product.color && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: product.color }}
                            title={product.color}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-sm truncate">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-muted-foreground truncate">({product.sku})</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <button
                className="w-full h-11 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors"
                onClick={() => setAddItemModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Prompt Modal - Mobile optimized */}
      {qtyPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-xs">
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2 text-foreground">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Enter Quantity
              </h3>
              <input
                ref={qtyInputRef}
                type="number"
                min={1}
                value={qtyInput}
                onChange={e => setQtyInput(Number(e.target.value))}
                className="w-full border border-border rounded-md px-3 py-2 text-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-11"
              />
            </div>
            <div className="flex gap-2 p-4 pt-0">
              <button
                className="flex-1 h-11 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors"
                onClick={handleCancelQty}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors disabled:opacity-50"
                onClick={handleConfirmQty}
                disabled={qtyInput < 1}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sales Modal - Mobile optimized */}
      <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset">
        {/* Sticky Header - Compact for mobile */}
        <div className="flex items-center gap-2 w-full p-3 bg-muted/50 border-b border-border sticky top-0 z-10">
          <span className="text-sm font-semibold text-foreground">New Sale</span>
          <select
            className="h-8 text-xs px-2 py-0 rounded border border-border bg-background text-foreground flex-shrink-0"
            style={{ minWidth: '90px' }}
            value={receiptType}
            onChange={e => setReceiptType(e.target.value)}
          >
            <option value="Sales Invoice">Sales Invoice</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Delivery Receipt">Delivery Receipt</option>
          </select>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded bg-background hover:bg-muted border border-border text-foreground flex-shrink-0"
            aria-label="Select date"
            onClick={() => dateInputRef.current?.click()}
          >
            <Calendar className="h-4 w-4" />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
            className="hidden"
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4 space-y-4">
            {/* Company Info and Bill To - Mobile stacked layout */}
            <div className="space-y-4">
              {/* Company Info */}
              <div className="bg-card rounded-lg p-3 shadow-sm">
                <img src={textLogo} alt="TechPinoy Logo" className="h-8 w-auto mb-2" />
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>2474 Valerio Street</div>
                  <div>Pasay City 1300</div>
                  <div>Phone: +639 7711 88880</div>
                  <div>Website: https://techpinoy.com</div>
                </div>
              </div>

              {/* Bill To and Invoice Info - Mobile stacked */}
              <div className="grid grid-cols-1 gap-4">
                {/* Bill To */}
                {selectedClientObj && (
                  <div className="bg-card rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">BILL TO</div>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border"
                        onClick={() => setClientSelectionOpen(true)}
                        type="button"
                        aria-label="Change client"
                      >
                        <Repeat className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-foreground space-y-0.5">
                      {selectedClientObj.name && <div className="font-medium">{selectedClientObj.name}</div>}
                      {selectedClientObj.address && <div>{selectedClientObj.address}</div>}
                      {selectedClientObj.phone && <div>{selectedClientObj.phone}</div>}
                    </div>
                  </div>
                )}

                {/* Invoice Info */}
                <div className="bg-card rounded-lg p-3 shadow-sm">
                  <div className="text-lg font-bold text-primary tracking-wide mb-2">{receiptType.toUpperCase()}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">DATE</span>
                      <span className="text-xs text-foreground font-medium">{saleDate || "mm/dd/yyyy"}</span>
                    </div>
                    {receiptType === "Sales Invoice" && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">INVOICE #</span>
                        <input
                          type="text"
                          value={invoiceNumber}
                          onChange={e => setInvoiceNumber(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                        />
                      </div>
                    )}
                    {receiptType === "Purchase Order" && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">PO #</span>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={e => setPONumber(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                        />
                      </div>
                    )}
                    {receiptType === "Delivery Receipt" && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">DR #</span>
                          <input
                            type="text"
                            value={drNumber}
                            onChange={e => setDRNumber(e.target.value)}
                            className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">PO #</span>
                          <input
                            type="text"
                            value={poNumber}
                            onChange={e => setPONumber(e.target.value)}
                            className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">CUSTOMER ID</span>
                      <input
                        type="text"
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                      />
                    </div>
                    {receiptType !== "Sales Invoice" && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">DUE DATE</span>
                        <input
                          type={dueDateInputType}
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          onFocus={() => setDueDateInputType('date')}
                          onBlur={() => setDueDateInputType('text')}
                          className="border border-border rounded px-2 py-1 text-xs w-20 bg-background text-foreground"
                          placeholder="mm/dd/yyyy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products List - Mobile optimized */}
            {addedProducts.length > 0 && (
              <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-2 text-left font-medium">Item</th>
                        <th className="px-2 py-2 text-left font-medium">Desc.</th>
                        <th className="px-2 py-2 text-center font-medium">Qty</th>
                        <th className="px-2 py-2 text-right font-medium">Price</th>
                        <th className="px-2 py-2 text-right font-medium">Amt.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedProducts.map((p, idx) => (
                        <tr key={p.id + idx} className="border-b border-border last:border-b-0">
                          <td className="px-2 py-2 text-foreground">{p.sku}</td>
                          <td className="px-2 py-2 text-foreground">
                            <div className="truncate max-w-[80px]" title={p.name}>{p.name}</div>
                          </td>
                          <td className="px-2 py-2 text-center text-foreground">{p.quantity}</td>
                          <td className="px-2 py-2 text-right text-foreground">
                            ₱{(pricingMap[p.id] || 0).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-right text-foreground font-medium">
                            ₱{((pricingMap[p.id] || 0) * p.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Section - Mobile optimized */}
            {receiptType !== "Delivery Receipt" && (
              <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td className="border-b border-border px-3 py-2 font-medium text-foreground">Total (Incl.)</td>
                        <td className="border-b border-border px-3 py-2 text-right font-bold text-green-600">
                          ₱{totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-2 text-foreground">Less: VAT</td>
                        <td className="border-b border-border px-3 py-2 text-right text-foreground">
                          ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-2 text-foreground">Net of VAT</td>
                        <td className="border-b border-border px-3 py-2 text-right text-foreground">
                          ₱{netOfVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-2 text-foreground">Discount</td>
                        <td className="border-b border-border px-3 py-2 text-right text-foreground">
                          ₱{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-2 text-foreground">Add: VAT</td>
                        <td className="border-b border-border px-3 py-2 text-right text-foreground">
                          ₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-2">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={withholdingTaxEnabled}
                              onChange={e => setWithholdingTaxEnabled(e.target.checked)}
                              className="accent-primary"
                            />
                            <span className="text-foreground">Withhold.</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={withholdingTaxRate}
                              onChange={e => setWithholdingTaxRate(Number(e.target.value))}
                              className="w-8 px-1 py-0.5 border border-border rounded text-xs bg-background text-foreground"
                              disabled={!withholdingTaxEnabled}
                            />
                            <span className="text-foreground">%</span>
                          </label>
                        </td>
                        <td className="border-b border-border px-3 py-2 text-right text-foreground">
                          ₱{withholdingTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-border px-3 py-3 font-bold text-base text-center text-foreground" colSpan={2}>
                          TOTAL DUE
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3 font-bold text-lg text-center text-green-600" colSpan={2}>
                          ₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar - Fixed at bottom for mobile */}
        <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border p-3 flex items-center justify-between gap-2 z-20 safe-area-inset-bottom">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    setAttachedFiles(Array.from(e.target.files));
                  }
                }}
              />
              <button
                type="button"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground"
                tabIndex={0}
                aria-label="Attach File"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </label>
            <button
              className="h-9 px-4 text-xs rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={handleComplete}
            >
              Complete
            </button>
          </div>
          <button
            className="h-9 px-4 text-xs rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            onClick={() => setAddItemModalOpen(true)}
          >
            + Add
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-20 left-4 right-4 bg-destructive/10 text-destructive px-4 py-2 rounded-md text-center font-medium text-sm safe-area-inset-bottom">
          {error}
        </div>
      )}

      {/* Confirm Modal - Mobile optimized */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col safe-area-inset-bottom">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-bold text-primary text-center">
                {receiptType}
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-foreground">Date:</span> <span className="text-muted-foreground">{saleDate}</span></div>
                <div><span className="font-medium text-foreground">Client:</span> <span className="text-muted-foreground">{selectedClientObj?.name || "-"}</span></div>
                <div className="font-medium text-foreground">Items:</div>
                <div className="bg-muted rounded-md p-3 space-y-1">
                  {addedProducts.map((p, idx) => (
                    <div key={p.id + idx} className="text-xs text-foreground">
                      {p.sku || p.name} x {p.quantity} = ₱{((pricingMap[p.id] || 0) * p.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  ))}
                </div>
                <div className="font-bold text-primary text-base">
                  Total: ₱{addedProducts.reduce((sum, p) => sum + ((pricingMap[p.id] || 0) * p.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="confirm-checkbox"
                    checked={confirmCheckbox}
                    onChange={e => setConfirmCheckbox(e.target.checked)}
                    className="accent-primary"
                  />
                  <label htmlFor="confirm-checkbox" className="font-medium text-foreground text-sm">
                    {receiptType === "Sales Invoice" && "Paid"}
                    {receiptType === "Delivery Receipt" && "Adv Delivery"}
                    {receiptType === "Purchase Order" && "Paid"}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button 
                className="flex-1 h-11 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium" 
                onClick={handleCancelConfirm}
              >
                Cancel
              </button>
              <button 
                className="flex-1 h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                onClick={handleConfirmSale}
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Modal - Mobile optimized */}
      {showDateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-xs">
            <div className="p-4 text-center">
              <h3 className="text-lg font-bold mb-3 text-foreground">Select Date for this transaction</h3>
              <input
                type="date"
                className="w-full h-11 px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
              />
            </div>
            <div className="p-4 pt-0">
              <button
                className="h-11 w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
                disabled={!saleDate || isNaN(new Date(saleDate).getTime())}
                onClick={() => {
                  setShowDateModal(false);
                  setShowConfirm(true);
                }}
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
