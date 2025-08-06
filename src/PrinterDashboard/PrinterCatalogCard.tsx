import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Eye, PlusCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import { useNavigate } from 'react-router-dom';
import { CompatibleProducts } from './components/CompatibleProducts';
import ViewPrinterModal from './ViewPrinterModal';
import EditPrinterFormModal from '@/components/EditPrinterFormModal';
import { supabase } from '@/integrations/supabase/client';
import AddToInventoryModal from './AddToInventoryModal';
import DeletePrinterModal from './DeletePrinterModal';
import CompatibleProductUpdateModal from './CompatibleProductUpdateModal';


const colorClasses: { [key: string]: string } = {
  black: 'bg-black',
  cyan: 'bg-cyan-500',
  magenta: 'bg-pink-500',
  yellow: 'bg-yellow-400',
};

const ColorDot = ({ color }: { color: string }) => {
  const colorClass = colorClasses[color?.toLowerCase()] || 'bg-gray-400';
  return <div className={`w-3 h-3 rounded-full ${colorClass}`} />;
};

const PrinterCatalogCard = ({ printer, onEdit, onDelete, debug = false }) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToInventory, setShowAddToInventory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompatibleProductUpdate, setShowCompatibleProductUpdate] = useState(false);
  const navigate = useNavigate();

  // Show delete modal when delete button is clicked
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    // Trigger data refresh if onDelete callback is provided
    if (onDelete) {
      onDelete(printer);
    }
  };

  return (
    <div
      className="bg-orange-50/50 border border-orange-200/80 rounded-lg p-3 my-2 shadow-sm w-full hover:bg-orange-100/60 transition"
    >
      {debug && (
        <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-900 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            <div><b>Printer ID:</b> {printer.id}</div>
            <div><b>Printer Name:</b> {printer.name}</div>
            <div><b>Manufacturer:</b> {printer.manufacturer}</div>
            <div><b>Model:</b> {printer.model}</div>
            <div><b>Series:</b> {printer.series}</div>
            <div><b>Image URL:</b> {printer.image_url || 'No image URL'}</div>
            <div className="border-t pt-2 mt-2">
              <b>Raw Printer Object Keys:</b>
              <div className="ml-2 text-xs">
                {Object.keys(printer).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start space-x-4">
        <img
          src={printer.image_url || '/placeholder.svg'}
          alt={printer.name || 'Printer'}
          className="w-24 h-24 object-cover rounded-md flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        <div className="flex-1 pr-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-800">
                  {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
                </h4>
              </div>
              <div className="flex gap-1 mt-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEditModal(true)} title="Edit Printer Details">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete} title="Delete Printer">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowViewModal(true)} title="View Printer">
                  <Eye className="h-4 w-4 text-gray-700" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddToInventory(true)} title="Add to Inventory">
                  <PlusCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCompatibleProductUpdate(true)} title="Update Compatible Products">
                  <Package className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-orange-200/50">
        <CompatibleProducts 
          printerId={printer.id} 
          className="mt-1" 
        />
      </div>
      <ViewPrinterModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        printer={printer}
      />
      <EditPrinterFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        printer={printer}
        onPrinterUpdated={() => setShowEditModal(false)}
        isLoading={false}
      />
      <AddToInventoryModal
        isOpen={showAddToInventory}
        onClose={() => setShowAddToInventory(false)}
        printer={printer}
        onAdded={() => {
          setShowAddToInventory(false);
        }}
      />
      <DeletePrinterModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        printer={printer}
        onSuccess={handleDeleteSuccess}
      />
      <CompatibleProductUpdateModal
        isOpen={showCompatibleProductUpdate}
        onClose={() => setShowCompatibleProductUpdate(false)}
        printer={printer}
        onUpdated={() => {
          setShowCompatibleProductUpdate(false);
          // Optionally trigger a refresh of the compatible products component
        }}
      />
    </div>
  );
};

export default PrinterCatalogCard;
