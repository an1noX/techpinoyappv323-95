
import { useState, useEffect } from "react";
import { Printer, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { CustomLoading } from "@/components/ui/CustomLoading";

type PrinterWithProducts = {
  id: string;
  name: string;
  model: string | null;
  status: string | null;
  manufacturer: string | null;
  printer_type: string | null;
  products: {
    id: string;
    name: string;
  }[];
};

type PrinterWithAssignments = {
  id: string;
  name: string;
  model: string | null;
  status: string | null;
  manufacturer: string | null;
  printer_type: string | null;
  assignedClients: {
    clientName: string;
    count: number;
  }[];
  products: {
    id: string;
    name: string;
  }[];
};

export const PrintersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allPrinters, setAllPrinters] = useState<PrinterWithProducts[]>([]);
  const [assignedPrinters, setAssignedPrinters] = useState<PrinterWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assigned" | "all">("assigned");

  const fetchAllPrinters = async () => {
    try {
      const { data, error } = await supabase
        .from('printers')
        .select(`
          id,
          name,
          model,
          status,
          manufacturer,
          printer_type,
          product_printers(
            products(
              id,
              name
            )
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching all printers:', error);
        return;
      }

      const transformedData: PrinterWithProducts[] = (data || []).map(printer => ({
        id: printer.id,
        name: printer.name,
        model: printer.model,
        status: printer.status,
        manufacturer: printer.manufacturer,
        printer_type: printer.printer_type,
        products: printer.product_printers?.map(pp => pp.products).filter(Boolean) || []
      }));

      setAllPrinters(transformedData);
    } catch (error) {
      console.error('Error fetching all printers:', error);
    }
  };

  const fetchAssignedPrinters = async () => {
    try {
      // First get all printers with their products
      const { data: printersData, error: printersError } = await supabase
        .from('printers')
        .select(`
          id,
          name,
          model,
          status,
          manufacturer,
          printer_type,
          product_printers(
            products(
              id,
              name
            )
          )
        `)
        .order('name');

      if (printersError) {
        console.error('Error fetching printers:', printersError);
        return;
      }

      // Then get all assignments with client info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('printer_assignments')
        .select(`
          printer_id,
          status,
          clients(
            name
          )
        `)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return;
      }

      // Group assignments by printer_id and count clients
      const assignmentsByPrinter = assignmentsData?.reduce((acc, assignment) => {
        if (!assignment.printer_id || !assignment.clients?.name) return acc;
        
        if (!acc[assignment.printer_id]) {
          acc[assignment.printer_id] = {};
        }
        
        const clientName = assignment.clients.name;
        acc[assignment.printer_id][clientName] = (acc[assignment.printer_id][clientName] || 0) + 1;
        
        return acc;
      }, {} as Record<string, Record<string, number>>) || {};

      // Transform the data
      const transformedData: PrinterWithAssignments[] = (printersData || []).map(printer => {
        const assignments = assignmentsByPrinter[printer.id] || {};
        const assignedClients = Object.entries(assignments).map(([clientName, count]) => ({
          clientName,
          count
        }));

        return {
          id: printer.id,
          name: printer.name,
          model: printer.model,
          status: printer.status,
          manufacturer: printer.manufacturer,
          printer_type: printer.printer_type,
          assignedClients,
          products: printer.product_printers?.map(pp => pp.products).filter(Boolean) || []
        };
      });

      setAssignedPrinters(transformedData);
    } catch (error) {
      console.error('Error fetching assigned printers:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === "all") {
        await fetchAllPrinters();
      } else {
        await fetchAssignedPrinters();
      }
      setLoading(false);
    };

    loadData();
  }, [activeTab]);

  const getFilteredPrinters = () => {
    if (activeTab === "all") {
      return allPrinters.filter(printer =>
        printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (printer.model && printer.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (printer.manufacturer && printer.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        printer.products.some(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      return assignedPrinters.filter(printer =>
        printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (printer.model && printer.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (printer.manufacturer && printer.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        printer.assignedClients.some(client => 
          client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        printer.products.some(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  };

  const filteredPrinters = getFilteredPrinters();

  return (
    <div className="p-4 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Printers</h2>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Add Printer
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search printers, models, clients, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={activeTab === "assigned" ? "default" : "outline"} 
          size="sm" 
          className={activeTab === "assigned" ? "bg-blue-600 hover:bg-blue-700 px-6" : "px-6"}
          onClick={() => setActiveTab("assigned")}
        >
          Assigned
        </Button>
        <Button 
          variant={activeTab === "all" ? "default" : "outline"} 
          size="sm" 
          className={activeTab === "all" ? "bg-blue-600 hover:bg-blue-700 px-6" : "px-6"}
          onClick={() => setActiveTab("all")}
        >
          All Printers
        </Button>
      </div>

      {/* Printers List */}
      {loading ? (
        <CustomLoading message="Loading printers" />
      ) : filteredPrinters.length === 0 ? (
        <div className="text-center py-12">
          <Printer size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm ? "No printers found" : "No printers yet"}
          </h3>
          <p className="text-gray-400 mb-4">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Start by adding your first printer"
            }
          </p>
          {!searchTerm && (
            <Button>
              <Plus size={16} className="mr-2" />
              Add Your First Printer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrinters.map((printer) => (
            <Card key={printer.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Printer size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header with Name and Model */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                        {printer.model && (
                          <span className="text-sm text-gray-500">({printer.model})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {printer.manufacturer && (
                          <Badge variant="outline" className="text-xs">
                            {printer.manufacturer}
                          </Badge>
                        )}
                        {printer.printer_type && (
                          <Badge variant="secondary" className="text-xs">
                            {printer.printer_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Assigned Clients or Status */}
                    {activeTab === "assigned" ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Assigned To:</p>
                        {(printer as PrinterWithAssignments).assignedClients.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(printer as PrinterWithAssignments).assignedClients.map((client, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {client.clientName} ({client.count})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Status:</p>
                        <Badge 
                          className={
                            printer.status === 'active' 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {printer.status || 'Unknown'}
                        </Badge>
                      </div>
                    )}

                    {/* Compatible Products */}
                    {printer.products.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Compatible Products:</p>
                        <div className="flex flex-wrap gap-1">
                          {printer.products.map((product) => (
                            <Badge key={product.id} variant="secondary" className="text-xs">
                              {product.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
