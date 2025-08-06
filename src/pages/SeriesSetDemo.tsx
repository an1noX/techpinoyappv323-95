import { useMemo } from "react";
import SeriesSetListing from "@/components/SeriesSetListing";
import { SeriesSetItem, groupIntoSeriesSets } from "@/utils/seriesSetGrouping";

// Mock data based on the image provided
const mockDeliveryItems: SeriesSetItem[] = [
  { id: '1', sku: 'CF403A', color: 'magenta', name: 'CF403A Magenta Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '2', sku: 'CF402A', color: 'yellow', name: 'CF402A Yellow Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '3', sku: 'TN261', color: 'black', name: 'TN261 Black Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '4', sku: 'TN261', color: 'cyan', name: 'TN261 Cyan Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '5', sku: 'TN261', color: 'yellow', name: 'TN261 Yellow Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '6', sku: 'TN261', color: 'magenta', name: 'TN261 Magenta Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '7', sku: 'CF400A', color: 'black', name: 'CF400A Black Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '8', sku: 'CF401A', color: 'cyan', name: 'CF401A Cyan Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '9', sku: 'CF402A', color: 'yellow', name: 'CF402A Yellow Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  { id: '10', sku: 'CF403A', color: 'magenta', name: 'CF403A Magenta Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-369' },
  
  // Complete set for CF40X series
  { id: '11', sku: 'CF400A', color: 'black', name: 'CF400A Black Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-370' },
  { id: '12', sku: 'CF401A', color: 'cyan', name: 'CF401A Cyan Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-370' },
  { id: '13', sku: 'CF402A', color: 'yellow', name: 'CF402A Yellow Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-370' },
  { id: '14', sku: 'CF403A', color: 'magenta', name: 'CF403A Magenta Toner', quantity: 1, status: 'fulfilled', poReference: 'PO#25-370' },
  
  // Incomplete set (missing black)
  { id: '15', sku: 'HP128', color: 'cyan', name: 'HP128 Cyan Toner', quantity: 1, status: 'pending', poReference: 'PO#25-371' },
  { id: '16', sku: 'HP128', color: 'yellow', name: 'HP128 Yellow Toner', quantity: 1, status: 'pending', poReference: 'PO#25-371' },
  { id: '17', sku: 'HP128', color: 'magenta', name: 'HP128 Magenta Toner', quantity: 1, status: 'pending', poReference: 'PO#25-371' },
  
  // Items with wrong quantities (should not be grouped)
  { id: '18', sku: 'CANON', color: 'black', name: 'Canon Black Toner', quantity: 2, status: 'fulfilled', poReference: 'PO#25-372' },
  { id: '19', sku: 'CANON', color: 'cyan', name: 'Canon Cyan Toner', quantity: 2, status: 'fulfilled', poReference: 'PO#25-372' },
  { id: '20', sku: 'CANON', color: 'yellow', name: 'Canon Yellow Toner', quantity: 2, status: 'fulfilled', poReference: 'PO#25-372' },
  { id: '21', sku: 'CANON', color: 'magenta', name: 'Canon Magenta Toner', quantity: 2, status: 'fulfilled', poReference: 'PO#25-372' },
];

export default function SeriesSetDemo() {
  const seriesSets = useMemo(() => {
    return groupIntoSeriesSets(mockDeliveryItems);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Delivery Items & Fulfillments</h1>
        <p className="text-muted-foreground">
          Products automatically grouped into complete 4-color series sets. Only sets with Black, Cyan, Yellow, and Magenta (quantity 1 each) are displayed.
        </p>
      </div>
      
      <SeriesSetListing 
        seriesSets={seriesSets}
        title="Complete Series Sets"
        className="mb-8"
      />
      
      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-2">Grouping Rules:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Groups products by identical SKU</li>
          <li>Requires exactly 4 colors: Black, Cyan, Yellow, Magenta</li>
          <li>Each color must have quantity of 1</li>
          <li>Incomplete sets are excluded from display</li>
          <li>Click any set to expand and view individual item details</li>
        </ul>
      </div>
    </div>
  );
}