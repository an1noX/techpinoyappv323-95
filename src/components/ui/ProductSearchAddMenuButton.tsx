import React from 'react';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductSearchAddMenuButtonProps {
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
  onShowSalesModal: () => void;
  // Add more handlers as needed
}

export const ProductSearchAddMenuButton: React.FC<ProductSearchAddMenuButtonProps> = ({
  showAddMenu,
  setShowAddMenu,
  onShowSalesModal
}) => (
  <div className="flex-shrink-0 sm:ml-2 relative">
    <button
      type="button"
      onClick={() => setShowAddMenu(!showAddMenu)}
      className="p-1.5 sm:p-2 rounded-lg sm:rounded-full bg-orange-600 hover:bg-orange-700 text-white transition border border-orange-700 flex items-center justify-center"
      aria-label="Add"
    >
      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
    <AnimatePresence>
      {showAddMenu && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-full right-0 mb-2 z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-80 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Options</h3>
              <button
                onClick={() => setShowAddMenu(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setShowAddMenu(false); onShowSalesModal(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-orange-600 text-lg">S</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Sales</h4>
                </div>
              </button>
              <button
                onClick={() => { setShowAddMenu(false); /* TODO: handle Purchase Order */ }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600 text-lg">P</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Purchase Order</h4>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
); 