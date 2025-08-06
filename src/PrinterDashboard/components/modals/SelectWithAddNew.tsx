
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface SelectWithAddNewProps {
  label: string;
  placeholder: string;
  options: Array<{ id: string; name: string }>;
  value: string;
  onValueChange: (value: string) => void;
  newItemValue: string;
  onNewItemChange: (value: string) => void;
  showNewItemInput: boolean;
  onShowNewItemInput: (show: boolean) => void;
  newItemPlaceholder: string;
  disabled?: boolean;
}

const SelectWithAddNew: React.FC<SelectWithAddNewProps> = ({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  newItemValue,
  onNewItemChange,
  showNewItemInput,
  onShowNewItemInput,
  newItemPlaceholder,
  disabled = false
}) => {
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'add_new') {
      onShowNewItemInput(true);
      onValueChange('');
    } else {
      onShowNewItemInput(false);
      onValueChange(selectedValue);
      onNewItemChange('');
    }
  };

  if (showNewItemInput) {
    return (
      <div>
        <Label>{label} *</Label>
        <Input
          value={newItemValue}
          onChange={(e) => onNewItemChange(e.target.value)}
          placeholder={newItemPlaceholder}
          disabled={disabled}
          className="mt-1"
        />
        <button
          type="button"
          onClick={() => {
            onShowNewItemInput(false);
            onNewItemChange('');
          }}
          className="text-sm text-gray-500 mt-1 hover:text-gray-700"
          disabled={disabled}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <Label>{label} *</Label>
      <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
          <SelectItem value="add_new">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New {label}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectWithAddNew;
