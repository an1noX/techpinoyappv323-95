import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/database';
import ProductsTab from '@/components/admin-dashboard/components/ProductsTab';
import AddProductModal from '@/components/AddProductModal';
import { CustomLoading } from '@/components/ui/CustomLoading';

interface ProductTabContentProps {
  isLoading: boolean;
  filteredData: Product[];
  searchQuery: string;
  onDataRefresh: () => void;
}

const ProductTabContent: React.FC<ProductTabContentProps> = ({
  isLoading,
  filteredData,
  searchQuery,
  onDataRefresh,
}) => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleAddNew = () => {
    setShowAddProduct(true);
  };

  return (
    <>
      {isLoading ? (
        <CustomLoading message="Loading products..." />
      ) : (
        <ProductsTab
          products={filteredData}
          onEditClientPrice={() => {}}
          onEditSupplierPrice={() => {}}
          onRequestQuote={() => {}}
        />
      )}
      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={() => {
          setShowAddProduct(false);
          onDataRefresh();
        }}
        searchTerm={searchQuery}
      />
    </>
  );
};

export default ProductTabContent; 