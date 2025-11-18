// src/app/dashboard/viewSales/EnhancedSaleDetails.tsx
import React, { useState } from 'react';
// import { Sale } from '@/types/sale';
import { CustomerSelector } from './CustomerSelector';
import { Customer } from '@/types/customer';
// import { saleService } from '@/services/saleService';
import { format } from 'date-fns';
import { 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  Loader2, 
  Edit, 
  Plane, 
  FileText, 
  ShieldCheck, 
  ShieldX,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaleEditDialog } from './SaleEditDialog';
import { toast } from "sonner";

interface EnhancedSaleDetailsProps {
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

export function EnhancedSaleDetails({ sale, onClose, onUpdate }: EnhancedSaleDetailsProps) {
  if (!sale.items || sale.items.length === 0) {
    return null;
  }

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(sale.customer);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const patientType = sale.patientType || 'local';
  const isForeignPatient = patientType === 'foreign';

  // Calculate pharmacy totals
  // For free bills, selling price should be 0
  const inventoryTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
  const profit = inventoryTotal - inventoryCost;
  
  // For free bills, use original amount for profit margin calculation
  const originalAmount = sale.originalAmount || inventoryTotal;
  const profitMargin = originalAmount > 0 ? (profit / originalAmount) * 100 : 0;

  // Get USD totals for foreign patients
  const usdTotal = sale.pharmacyItemsUSD?.reduce((sum, item) => sum + item.totalUSD, 0) || 0;

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
      onUpdate();
      setEditing(false);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Error updating sale customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleEdited = () => {
    onUpdate();
    setShowEditDialog(false);
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="shrink-0 border-b p-6 bg-gradient-to-r from-background to-muted/20 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant={isForeignPatient ? 'default' : 'secondary'} 
                className="flex items-center gap-1"
              >
                {isForeignPatient ? <Plane className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {isForeignPatient ? 'Foreign Patient' : 'Local Patient'}
              </Badge>
              {sale.isInsurancePatient !== undefined && (
                <Badge variant={sale.isInsurancePatient ? 'default' : 'outline'} className="flex items-center gap-1">
                  {sale.isInsurancePatient ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                  {sale.isInsurancePatient ? 'Insurance' : 'Non-Insurance'}
                </Badge>
              )}
              {sale.isFreeBill && (
                <Badge variant="outline" className="flex items-center gap-1 border-2 font-semibold border-green-500 text-green-700">
                  <FileText className="h-3 w-3" />
                  FREE BILL (100% Discount)
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sale Details</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(sale.saleDate, 'PPP p')}
              </div>
              <div className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                Sale #{sale.id?.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="shadow-sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable with custom scrollbar */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-6 space-y-6 bg-muted/10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales (LKR)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(inventoryTotal)}</div>
              {sale.isFreeBill && sale.originalAmount && sale.originalAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Original: {formatCurrency(sale.originalAmount)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(inventoryCost)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {profitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          {isForeignPatient && usdTotal > 0 && (
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">USD Amount</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatUSD(usdTotal)}</div>
                <p className="text-xs text-muted-foreground">
                  Recorded USD total
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Customer Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {editing ? (
              <div className="space-y-4">
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={setSelectedCustomer}
                  placeholder="Select or create customer..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateCustomer} 
                    disabled={loading}
                    size="sm"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditing(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Name</span>
                    <p className="text-lg font-semibold">{sale.customerInfo?.name || sale.customer?.name || 'Walk-in Customer'}</p>
                  </div>
                  {(sale.customerInfo?.mobile || sale.customer?.phone) && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</span>
                      <p className="text-base font-medium">{sale.customerInfo?.mobile || sale.customer?.phone}</p>
                    </div>
                  )}
                  {sale.customer?.email && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</span>
                      <p className="text-base font-medium">{sale.customer.email}</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="ml-4 shadow-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pharmacy Items */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Pharmacy Items ({sale.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sale.items.map((item, index) => {
                if (item.isSecondaryItem) return null;
                
                const totalQty = item.unitQuantity + (item.subUnitQuantity / (item.item.unitContains?.value || 1));
                
                // For free bills, display prices should be 0
                const displayUnitPrice = sale.isFreeBill ? 0 : item.unitPrice;
                const displayTotalPrice = sale.isFreeBill ? 0 : item.totalPrice;
                const itemProfit = displayTotalPrice - item.totalCost;
                
                // For free bills, use original prices for profit margin calculation
                const originalItemPrice = item.totalPrice;
                const itemProfitMargin = originalItemPrice > 0 ? (itemProfit / originalItemPrice) * 100 : 0;
                
                // Get USD amount for this item if foreign patient
                const itemUSD = sale.pharmacyItemsUSD?.find(usdItem => usdItem.itemId === item.itemId);
                
                return (
                  <div key={index} className="border rounded-lg p-5 space-y-3 bg-card hover:bg-muted/20 transition-colors duration-150 shadow-sm">
                    <div className="flex justify-between items-start pb-3 border-b">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-semibold text-foreground">{item.item?.name || 'Unknown Item'}</h4>
                          {sale.isFreeBill && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-700">Free Bill</Badge>
                          )}
                        </div>
                        {item.item?.genericName && (
                          <p className="text-sm text-muted-foreground font-medium">{item.item.genericName}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {item.batch?.batchNumber && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              <Package className="h-3 w-3" />
                              Batch: {item.batch.batchNumber}
                            </span>
                          )}
                          {item.batch?.expiryDate && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                              <Calendar className="h-3 w-3" />
                              Exp: {new Date(item.batch.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-4 text-sm py-1 px-3">
                        Qty: {totalQty.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-3 mt-3">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Price</span>
                        <p className="text-base font-semibold">{formatCurrency(displayUnitPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</span>
                        <p className="text-base font-semibold">{formatCurrency(displayTotalPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost</span>
                        <p className="text-base font-semibold text-red-600">{formatCurrency(item.totalCost)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profit</span>
                        <p className={`text-base font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(itemProfit)}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {itemProfitMargin.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                    
                    {isForeignPatient && itemUSD && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 text-blue-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">USD Amount: {formatUSD(itemUSD.totalUSD)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Created By Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Sale Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                <p className="text-lg font-semibold">{sale.createdBy?.displayName || sale.createdBy?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{sale.createdBy?.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Role:</span>
                <p className="text-lg font-semibold capitalize">{sale.createdBy?.role || 'cashier'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer - Fixed */}
      <div className="shrink-0 border-t p-4 bg-background shadow-lg">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            Close
          </Button>
        </div>
      </div>

      {/* Sale Edit Dialog */}
      {showEditDialog && (
        <SaleEditDialog
          sale={sale}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSaleUpdated={handleSaleEdited}
        />
      )}
    </div>
  );
}