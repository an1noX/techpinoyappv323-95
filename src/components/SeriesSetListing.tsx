import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { SeriesSet, SeriesSetItem, getColorDisplayName, getColorBadgeClass } from "@/utils/seriesSetGrouping";
import { cn } from "@/lib/utils";

interface SeriesSetListingProps {
  seriesSets: SeriesSet[];
  title?: string;
  className?: string;
}

interface SeriesSetCardProps {
  seriesSet: SeriesSet;
  isExpanded: boolean;
  onToggle: () => void;
}

const SeriesSetCard = ({ seriesSet, isExpanded, onToggle }: SeriesSetCardProps) => {
  const { sku, items } = seriesSet;
  
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader 
        className="cursor-pointer p-4" 
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold">{sku} Series Set</CardTitle>
              <p className="text-sm text-muted-foreground">
                {items.length} items • Complete 4-color set
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete Set
            </Badge>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <div className="space-y-3">
            {items.map((item) => (
              <SeriesSetItemRow key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const SeriesSetItemRow = ({ item }: { item: SeriesSetItem }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge className={cn("text-xs font-medium", getColorBadgeClass(item.color))}>
          {getColorDisplayName(item.color)}
        </Badge>
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          {item.alias && (
            <p className="text-xs text-muted-foreground">Alias: {item.alias}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="font-medium">Qty: {item.quantity}</p>
        </div>
        <div className="text-center">
          <Badge 
            variant={item.status === 'fulfilled' ? 'default' : 'secondary'}
            className={item.status === 'fulfilled' ? 'bg-green-600' : ''}
          >
            {item.status}
          </Badge>
        </div>
        {item.poReference && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">PO:</p>
            <p className="font-medium text-xs text-primary">{item.poReference}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SeriesSetListing({ 
  seriesSets, 
  title = "Product Series Sets",
  className 
}: SeriesSetListingProps) {
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

  const toggleExpanded = (sku: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku);
    } else {
      newExpanded.add(sku);
    }
    setExpandedSets(newExpanded);
  };

  const expandAll = () => {
    setExpandedSets(new Set(seriesSets.map(set => set.sku)));
  };

  const collapseAll = () => {
    setExpandedSets(new Set());
  };

  if (seriesSets.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No complete series sets found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Series sets require all 4 colors (Black, Cyan, Yellow, Magenta) with quantity of 1 each.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          <p className="text-muted-foreground">
            {seriesSets.length} complete series set{seriesSets.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={expandAll}
            disabled={expandedSets.size === seriesSets.length}
          >
            Expand All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={collapseAll}
            disabled={expandedSets.size === 0}
          >
            Collapse All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {seriesSets.map((seriesSet) => (
          <SeriesSetCard
            key={seriesSet.sku}
            seriesSet={seriesSet}
            isExpanded={expandedSets.has(seriesSet.sku)}
            onToggle={() => toggleExpanded(seriesSet.sku)}
          />
        ))}
      </div>
    </div>
  );
}