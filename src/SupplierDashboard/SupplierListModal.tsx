
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Building2, Loader2 } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Supplier } from '@/types/database';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface SupplierListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierSelected: (supplier: Supplier) => void;
  title?: string;
  description?: string;
}

const SupplierListModal: React.FC<SupplierListModalProps> = ({
  isOpen,
  onClose,
  onSupplierSelected,
  title = "Select a Supplier",
  description = "Choose a supplier to view their details.",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { suppliers, loading } = useSuppliers();
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus management: focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, [isOpen]);

  // Keyboard accessibility: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-list-modal-title"
      aria-describedby="supplier-list-modal-desc"
    >
      {/* Backdrop - removed as we're using solid white background */}
      
      
      {/* Mobile-First Modal Container */}
      <div
        ref={modalRef}
        className="relative z-10 flex flex-col h-full w-full bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Search */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Building2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 id="supplier-list-modal-title" className="text-base font-semibold text-gray-900 truncate">{title}</h2>
                <p id="supplier-list-modal-desc" className="text-xs text-gray-600">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-green-200 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-green-500" />
            </button>
          </div>
          <div className="relative">
            <div tabIndex={0} aria-hidden="true" style={{ width: 0, height: 0, overflow: 'hidden' }} />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              placeholder="Search suppliers..."
              aria-label="Search suppliers"
            />
          </div>
        </div>

        {/* Scrollable Content with Mobile Optimization */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <CustomLoading message="Loading suppliers" />
          ) : filteredSuppliers.length > 0 ? (
            <div className="space-y-2">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 border-gray-200 hover:border-green-400 hover:bg-green-50 bg-white active:scale-[0.98] touch-target"
                  onClick={() => {
                    onSupplierSelected(supplier);
                    onClose();
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select supplier ${supplier.name}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSupplierSelected(supplier);
                      onClose();
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">{supplier.name}</div>
                    {(supplier.contact_email || supplier.phone) && (
                      <div className="text-xs text-gray-600 truncate mt-0.5">
                        {supplier.contact_email && `${supplier.contact_email}`}
                        {supplier.phone && supplier.contact_email && ' • '}
                        {supplier.phone && `${supplier.phone}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'No suppliers found matching your search' : 'No suppliers available'}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Mobile Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 safe-area-bottom space-y-2">
          <button
            className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-all duration-200 active:scale-[0.98] touch-target"
            onClick={() => {/* TODO: Implement add supplier modal */}}
            aria-label="Add Supplier"
          >
            Add Supplier
          </button>
          <button
            ref={cancelBtnRef}
            className="w-full h-12 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium text-sm transition-all duration-200 active:scale-[0.98] touch-target"
            onClick={onClose}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierListModal;
