
import { useRef, useState, useEffect } from "react";
import { Plus, UserPlus, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddPrinterButtonProps {
  onClick: () => void; // This will be used for 'Add Printer'
  onAssign?: () => void; // Optional: for 'Assign Printer'
}

function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    function listener(event: MouseEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

export const AddPrinterButton = ({ onClick, onAssign }: AddPrinterButtonProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-800 transition border border-orange-200"
        aria-label="Add printer"
        onClick={() => setOpen((v) => !v)}
        style={{ zIndex: 11 }}
      >
        <Plus className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 flex flex-col"
          >
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition"
              onClick={() => {
                setOpen(false);
                onAssign?.();
              }}
            >
              <UserPlus className="h-4 w-4 text-orange-500" /> Assign Printer
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              <Printer className="h-4 w-4 text-orange-500" /> Add Printer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
