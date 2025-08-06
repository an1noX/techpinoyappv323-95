export interface SeriesSetItem {
  id: string;
  sku: string;
  color: string;
  name: string;
  quantity: number;
  status: string;
  poReference?: string;
  alias?: string;
}

export interface SeriesSet {
  sku: string;
  items: SeriesSetItem[];
  isComplete: boolean;
}

const REQUIRED_COLORS = ['black', 'cyan', 'yellow', 'magenta'];

export const normalizeColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'k': 'black',
    'bk': 'black',
    'black': 'black',
    'c': 'cyan',
    'cyan': 'cyan',
    'm': 'magenta',
    'magenta': 'magenta',
    'y': 'yellow',
    'yellow': 'yellow'
  };
  
  return colorMap[color.toLowerCase()] || color.toLowerCase();
};

export const groupIntoSeriesSets = (items: SeriesSetItem[]): SeriesSet[] => {
  // Group items by SKU
  const skuGroups = new Map<string, SeriesSetItem[]>();
  
  items.forEach(item => {
    if (!skuGroups.has(item.sku)) {
      skuGroups.set(item.sku, []);
    }
    skuGroups.get(item.sku)!.push(item);
  });

  // Convert to SeriesSet objects and filter for complete sets
  const seriesSets: SeriesSet[] = [];
  
  skuGroups.forEach((groupItems, sku) => {
    // Check if this group can form complete sets
    const colorQuantities = new Map<string, SeriesSetItem[]>();
    
    groupItems.forEach(item => {
      const normalizedColor = normalizeColor(item.color);
      if (!colorQuantities.has(normalizedColor)) {
        colorQuantities.set(normalizedColor, []);
      }
      colorQuantities.get(normalizedColor)!.push(item);
    });

    // Check if all required colors are present with qty of 1
    const hasAllColors = REQUIRED_COLORS.every(color => {
      const colorItems = colorQuantities.get(color) || [];
      return colorItems.length > 0 && colorItems.every(item => item.quantity === 1);
    });

    if (hasAllColors) {
      // Create complete sets by taking one item of each color
      const maxSets = Math.min(
        ...REQUIRED_COLORS.map(color => 
          (colorQuantities.get(color) || []).filter(item => item.quantity === 1).length
        )
      );

      for (let i = 0; i < maxSets; i++) {
        const setItems: SeriesSetItem[] = [];
        REQUIRED_COLORS.forEach(color => {
          const availableItems = colorQuantities.get(color) || [];
          const validItems = availableItems.filter(item => item.quantity === 1);
          if (validItems[i]) {
            setItems.push(validItems[i]);
          }
        });

        if (setItems.length === 4) {
          seriesSets.push({
            sku,
            items: setItems,
            isComplete: true
          });
        }
      }
    }
  });

  return seriesSets.sort((a, b) => a.sku.localeCompare(b.sku));
};

export const getColorDisplayName = (color: string): string => {
  const normalized = normalizeColor(color);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const getColorBadgeClass = (color: string): string => {
  const normalized = normalizeColor(color);
  const colorClasses: { [key: string]: string } = {
    'black': 'bg-slate-800 text-white',
    'cyan': 'bg-cyan-500 text-white',
    'yellow': 'bg-yellow-400 text-black',
    'magenta': 'bg-pink-500 text-white'
  };
  
  return colorClasses[normalized] || 'bg-gray-500 text-white';
};