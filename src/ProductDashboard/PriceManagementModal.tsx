
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatPHP } from '@/utils/currency';

interface PriceHistoryEntry {
  id: string;
  price: number;
  timestamp: Date;
  note?: string;
}

interface PriceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'supplier' | 'client';
  entityName: string;
  currentPrice: number;
  productName: string;
  onPriceUpdate: (newPrice: number, note?: string) => Promise<void>;
  priceHistory?: PriceHistoryEntry[];
}

const PriceManagementModal: React.FC<PriceManagementModalProps> = ({
  isOpen,
  onClose,
  type,
  entityName,
  currentPrice,
  productName,
  onPriceUpdate,
  priceHistory = []
}) => {
  const [newPrice, setNewPrice] = useState(currentPrice.toString());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewPrice(currentPrice.toString());
    setNote('');
  }, [currentPrice, isOpen]);

  const handleUpdatePrice = async () => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      await onPriceUpdate(priceValue, note);
      toast.success(`${type === 'supplier' ? 'Supplier' : 'Client'} price updated successfully`);
      onClose();
    } catch (error) {
      toast.error('Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  const sortedHistory = [...priceHistory]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manage {type === 'supplier' ? 'Supplier' : 'Client'} Pricing
          </DialogTitle>
          <div className="text-sm text-gray-600">
            {entityName} - {productName}
          </div>
        </DialogHeader>

        <Tabs defaultValue="update" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="update">Update Price</TabsTrigger>
            <TabsTrigger value="history">Price History</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-4">
                  {formatPHP(currentPrice)}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPrice">New Price</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Enter new price"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note about this price change"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdatePrice}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Updating...' : 'Update Price'}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Price History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No price history available
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedHistory.map((entry, index) => {
                      const previousEntry = sortedHistory[index + 1];
                      const isIncrease = previousEntry && entry.price > previousEntry.price;
                      const isDecrease = previousEntry && entry.price < previousEntry.price;
                      const priceDiff = previousEntry ? entry.price - previousEntry.price : 0;
                      
                      return (
                        <div key={entry.id} className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                {formatPHP(entry.price)}
                              </span>
                              {previousEntry && (
                                <div className="flex items-center">
                                  {isIncrease && (
                                    <div className="flex items-center text-red-600 text-sm">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      +{formatPHP(Math.abs(priceDiff))}
                                    </div>
                                  )}
                                  {isDecrease && (
                                    <div className="flex items-center text-green-600 text-sm">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      -{formatPHP(Math.abs(priceDiff))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{entry.note}"</p>
                          )}
                          {index === 0 && (
                            <Badge variant="secondary" className="mt-1">
                              Current
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PriceManagementModal;
