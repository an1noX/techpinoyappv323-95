import React, { useState } from 'react';
import { ProductSetsList } from './ProductSetsList';
import { ProductSetForm } from './ProductSetForm';

export const ProductSetsTab: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      <ProductSetsList onCreateNew={() => setShowCreateForm(true)} />
      
      <ProductSetForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
    </div>
  );
};