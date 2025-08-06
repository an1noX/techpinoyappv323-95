
import { useState } from "react";
import { Plus, UserPlus, Printer, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddButtonNavigationProps {
  onAssignPrinter: () => void;
  onAddPrinter: () => void;
  onAddToInventory: () => void;
}

export const AddButtonNavigation = ({ onAssignPrinter, onAddPrinter, onAddToInventory }: AddButtonNavigationProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleAssignPrinter = () => {
    setShowMenu(false);
    onAssignPrinter();
  };

  const handleAddPrinter = () => {
    setShowMenu(false);
    onAddPrinter();
  };

  const handleAddToInventory = () => {
    setShowMenu(false);
    onAddToInventory();
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Menu positioned above the button */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 w-72 sm:w-80 max-w-[90vw]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add Options</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Menu Options */}
              <div className="space-y-2">
                <button
                  onClick={handleAssignPrinter}
                  className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Assign Printer</h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Assign an existing printer to a client</p>
                  </div>
                </button>

                <button
                  onClick={handleAddPrinter}
                  className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Add New Printer</h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Add a new printer model to the catalog</p>
                  </div>
                </button>

                <button
                  onClick={handleAddToInventory}
                  className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Add to Inventory</h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Add a physical printer unit to inventory</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Add Button */}
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition border border-orange-700 ml-2 hidden sm:flex"
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Add</span>
      </button>

      {/* Mobile Add Button */}
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 sm:p-2 rounded-lg sm:rounded-full bg-orange-600 hover:bg-orange-700 text-white transition border border-orange-700 flex sm:hidden ml-2"
        aria-label="Add"
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
};
