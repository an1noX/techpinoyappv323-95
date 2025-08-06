
import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - replace with actual data from your suppliers hook
  const suppliers = [
    { id: "1", name: "Meyink", type: "supplier" },
    { id: "2", name: "Starink", type: "supplier" },
    { id: "3", name: "TonerPro", type: "supplier" },
    { id: "4", name: "ZK Import", type: "supplier" }
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Suppliers</h2>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm ? "No suppliers found" : "No suppliers yet"}
          </h3>
          <p className="text-gray-400 mb-4">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Start by adding your first supplier"
            }
          </p>
          {!searchTerm && (
            <Button>
              <Plus size={16} className="mr-2" />
              Add Your First Supplier
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
