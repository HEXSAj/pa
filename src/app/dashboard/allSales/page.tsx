'use client';
import React, { useState, useEffect } from 'react';
import { saleService } from '@/services/saleService';
import { Sale } from '@/types/sale';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import SalesAnalysis from './SalesAnalysis';
import SalesFilters from './SalesFilters';
import SalesTable from './SalesTable';
import { SaleDetails } from './SaleDetails';
import ExportSalesButton from './ExportSalesButton';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function EnhancedSalesViewPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [saleType, setSaleType] = useState('all');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await saleService.getAll();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
      alert('Error loading sales data');
    } finally {
      setLoading(false);
    }
  };

  const filterSales = (sales: Sale[]) => {
    let filteredSales = [...sales];
    
    // Date filtering
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
  
    switch (filterType) {
      case 'today':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfDay
        );
        break;
      case 'thisWeek':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfWeek
        );
        break;
      case 'thisMonth':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfMonth
        );
        break;
      case 'thisYear':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfYear
        );
        break;
      case 'custom':
        if (dateRange.from && dateRange.to) {
          filteredSales = filteredSales.filter(sale => 
            sale.saleDate >= dateRange.from && sale.saleDate <= dateRange.to
          );
        }
        break;
    }

    // Sale type filtering
    switch (saleType) {
      case 'inventory':
        filteredSales = filteredSales.filter(sale => sale.items.length > 0);
        break;
      case 'labTests':
        filteredSales = filteredSales.filter(sale => 
          sale.laboratoryTests && sale.laboratoryTests.length > 0
        );
        break;
      case 'doctorFees':
        filteredSales = filteredSales.filter(sale => 
          sale.doctorFees && sale.doctorFees.length > 0
        );
        break;
    }
  
    return filteredSales;
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsDialog(false);
    setSelectedSale(null);
  };

  const filteredSales = filterSales(sales);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
          <ExportSalesButton 
            sales={filteredSales}
            isFiltered={filterType !== 'all' || saleType !== 'all'}
            allSales={sales}
          />
        </div>

        <SalesFilters
          filterType={filterType}
          setFilterType={setFilterType}
          dateRange={dateRange}
          setDateRange={setDateRange}
          saleType={saleType}
          setSaleType={setSaleType}
        />

        <SalesAnalysis sales={filteredSales} />

        <div className="rounded-lg border">
          <SalesTable 
            sales={filteredSales}
            onViewDetails={handleViewDetails}
          />
        </div>

        <Dialog 
          open={showDetailsDialog} 
          onOpenChange={setShowDetailsDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            {selectedSale && (
              <SaleDetails 
                sale={selectedSale}
                onClose={handleCloseDetails}
                onUpdate={loadSales}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}