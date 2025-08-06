import { useMemo, useState } from 'react';

interface UseSearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  searchQuery: string;
}

export const useSearch = <T>({ data, searchFields, searchQuery }: UseSearchOptions<T>) => {
  return useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        
        // Handle nested objects (e.g., locations array)
        if (Array.isArray(value)) {
          return value.some(nestedItem => 
            typeof nestedItem === 'object' 
              ? Object.values(nestedItem).some(val => 
                  String(val).toLowerCase().includes(query)
                )
              : String(nestedItem).toLowerCase().includes(query)
          );
        }
        
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchFields, searchQuery]);
};

export const useSearchState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const clearSearch = () => setSearchQuery('');
  
  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
  };
}; 