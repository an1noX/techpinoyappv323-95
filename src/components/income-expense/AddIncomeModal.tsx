import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { IncomeEntry } from "@/types/money-tracking";
import { EnhancedIncomeForm } from "./EnhancedIncomeForm";

interface AddIncomeModalProps {
  onAddIncome: (income: Omit<IncomeEntry, 'id' | 'date'>) => void;
}

export const AddIncomeModal = ({ onAddIncome }: AddIncomeModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddIncome = (income: Omit<IncomeEntry, 'id' | 'date'>) => {
    onAddIncome(income);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Income</DialogTitle>
        </DialogHeader>
        <EnhancedIncomeForm onAddIncome={handleAddIncome} />
      </DialogContent>
    </Dialog>
  );
};