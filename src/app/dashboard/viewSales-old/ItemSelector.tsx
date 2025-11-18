import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Package, X } from "lucide-react";
import { InventoryItem } from '@/types/inventory';

interface ItemSelectorProps {
  onSelectItem: (item: InventoryItem | undefined) => void;
  selectedItem?: InventoryItem;
  items: InventoryItem[];
  loading?: boolean;
}

export function ItemSelector({ onSelectItem, selectedItem, items, loading = false }: ItemSelectorProps) {
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.code.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-2">
      <Label>Product</Label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => {
            setShowSearchDialog(true);
            setSearchQuery('');
          }}
        >
          {selectedItem ? (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{selectedItem.name}</span>
              <span className="text-muted-foreground">({selectedItem.code})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search product...</span>
            </div>
          )}
        </Button>
        
        {selectedItem && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectItem(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading products...
                </p>
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      className="w-full px-4 py-3 text-left rounded-lg hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => {
                        onSelectItem(item);
                        setShowSearchDialog(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.code}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}