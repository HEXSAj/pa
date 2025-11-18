// src/components/PriceHistoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { priceHistoryService } from '@/services/priceHistoryService';
import { PriceHistory } from '@/types/priceHistory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, TrendingUp, TrendingDown, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PriceHistoryModalProps {
  labTestId: string;
  labTestName: string;
  onClose: () => void;
}

export default function PriceHistoryModal({ labTestId, labTestName, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const historyData = await priceHistoryService.getHistoryByLabTest(labTestId);
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading price history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [labTestId]);

  const formatPrice = (price: number) => `Rs ${price.toFixed(2)}`;

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (newPrice < oldPrice) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getPriceChangeBadge = (oldPrice: number, newPrice: number) => {
    const difference = newPrice - oldPrice;
    const percentage = ((difference / oldPrice) * 100).toFixed(1);
    
    if (difference > 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
          +{percentage}%
        </Badge>
      );
    } else if (difference < 0) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
          {percentage}%
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Price History - {labTestName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No price changes recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getPriceChangeIcon(entry.oldPrice, entry.newPrice)}
                          <span className="font-medium">
                            {formatPrice(entry.oldPrice)} → {formatPrice(entry.newPrice)}
                          </span>
                          {getPriceChangeBadge(entry.oldPrice, entry.newPrice)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{entry.changedByName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(entry.changedAt, 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                        
                        {entry.reason && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Reason: </span>
                            {entry.reason}
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

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}