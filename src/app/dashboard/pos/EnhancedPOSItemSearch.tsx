// src/app/dashboard/pos/EnhancedPOSItemSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '@/types/inventory';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Tag, Package2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedPOSItemSearchProps {
  inventory: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const EnhancedPOSItemSearch: React.FC<EnhancedPOSItemSearchProps> = ({
  inventory,
  onSelectItem,
  inputRef
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const localInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // Use provided ref or local ref
  const searchInputRef = inputRef || localInputRef;
  
  // Clear search when Escape is pressed
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setFocusedIndex(-1);
    searchInputRef.current?.focus();
  };
  
  // Update search results when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setFocusedIndex(-1);
      return;
    }
    
    const filtered = inventory.filter(item => {
      const termLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(termLower) ||
        (item.genericName && item.genericName.toLowerCase().includes(termLower)) ||
        (item.code && item.code.toLowerCase().includes(termLower))
      );
    });
    
    // Sort results by relevance and type of match
    const sorted = [...filtered].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aGeneric = (a.genericName || '').toLowerCase();
      const bGeneric = (b.genericName || '').toLowerCase();
      const aCode = (a.code || '').toLowerCase();
      const bCode = (b.code || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      
      // Exact matches have highest priority
      if (aName === term) return -1;
      if (bName === term) return 1;
      
      if (aGeneric === term) return -1;
      if (bGeneric === term) return 1;
      
      if (aCode === term) return -1;
      if (bCode === term) return 1;
      
      // Starts with has second highest priority
      if (aName.startsWith(term)) return -1;
      if (bName.startsWith(term)) return 1;
      
      if (aGeneric.startsWith(term)) return -1;
      if (bGeneric.startsWith(term)) return 1;
      
      // Otherwise sort alphabetically by name
      return aName.localeCompare(bName);
    });
    
    setSearchResults(sorted.slice(0, 12)); // Limit to 12 results for better UX
    setFocusedIndex(sorted.length > 0 ? 0 : -1);
  }, [searchTerm, inventory]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleSelectItem(searchResults[focusedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        clearSearch();
        break;
    }
  };
  
  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && resultsContainerRef.current) {
      const container = resultsContainerRef.current;
      const focusedElement = container.children[focusedIndex] as HTMLElement;
      
      if (focusedElement) {
        // Check if element is not fully visible
        const containerRect = container.getBoundingClientRect();
        const focusedRect = focusedElement.getBoundingClientRect();
        
        if (focusedRect.bottom > containerRect.bottom) {
          // Need to scroll down
          container.scrollTop += focusedRect.bottom - containerRect.bottom;
        } else if (focusedRect.top < containerRect.top) {
          // Need to scroll up
          container.scrollTop -= containerRect.top - focusedRect.top;
        }
      }
    }
  }, [focusedIndex]);
  
  const handleSelectItem = (item: InventoryItem) => {
    onSelectItem(item);
    setSearchTerm('');
    setSearchResults([]);
  };
  
  // Highlight matching text in search results
  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => (
          regex.test(part) ? 
            <span key={i} className="bg-yellow-200 text-gray-900">{part}</span> : 
            <span key={i}>{part}</span>
        ))}
      </>
    );
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search by trade name, generic name or code... (F1)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-6 text-lg"
        />
        
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={clearSearch}
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            ref={resultsContainerRef}
            className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
          >
            {searchResults.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: index * 0.03 }}
                className={`p-3 cursor-pointer transition-all border-l-4 ${
                  index === focusedIndex 
                    ? 'bg-primary/10 border-l-primary' 
                    : 'hover:bg-gray-50 border-l-transparent'
                }`}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setFocusedIndex(index)}
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <div className={`text-lg ${index === focusedIndex ? 'font-medium text-primary' : 'font-medium'}`}>
                      {highlightMatch(item.name, searchTerm)}
                    </div>
                    
                    {item.genericName && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span>Generic: {highlightMatch(item.genericName, searchTerm)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="font-normal">
                      Code: {item.code}
                    </Badge>
                    <Badge variant="secondary" className="mt-1 font-normal text-xs">
                      <Package2 className="h-3 w-3 mr-1" />
                      {item.type}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {searchTerm && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-6 text-center"
          >
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No items found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try searching by trade name, generic name, or code
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};