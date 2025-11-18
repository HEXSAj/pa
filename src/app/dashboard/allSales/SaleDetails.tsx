import React, { useState } from 'react';
import { Sale } from '@/types/sale';
import { CustomerSelector } from './CustomerSelector';
import { Customer } from '@/types/customer';
import { saleService } from '@/services/saleService';
import { Calendar, User, Package, DollarSign, Loader2, Stethoscope, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SaleDetailsProps {
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
    sale.customer
  );

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
      onUpdate();
      setEditing(false);
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Error updating sale customer');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
  const doctorFeesTotal = sale.doctorFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
  const labTestsTotal = sale.laboratoryTests?.reduce((sum, test) => sum + test.price, 0) || 0;
  const totalProfit = inventoryTotal - inventoryCost;

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Header */}
      <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
          <div className="flex items-center text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(sale.saleDate)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">Rs{sale.totalAmount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            Total Profit: Rs{totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Customer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <CustomerSelector
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setSelectedCustomer(sale.customer);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateCustomer}
                      disabled={loading || !selectedCustomer}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Customer'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    {sale.customer ? (
                      <>
                        <p className="font-medium">{sale.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer.mobile}
                        </p>
                        {sale.customer.address && (
                          <p className="text-sm text-muted-foreground">
                            {sale.customer.address}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Walk-in Customer</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Items */}
          {sale.items && sale.items.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle>Inventory Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.item.code}
                        </p>
                        <div className="mt-2">
                          <Badge variant="secondary">
                            Batch #{item.batch.batchNumber}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
                        <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                          {item.unitQuantity > 0 && (
                            <p>{item.unitQuantity} units</p>
                          )}
                          {item.subUnitQuantity > 0 && item.item.unitContains && (
                            <p>
                              {item.subUnitQuantity} {item.item.unitContains.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Doctor Fees */}
          {sale.doctorFees && sale.doctorFees.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  <CardTitle>Doctor Fees</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.doctorFees.map((fee, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{fee.fee.name}</p>
                        {fee.fee.description && (
                          <p className="text-sm text-muted-foreground">
                            {fee.fee.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs{fee.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Laboratory Tests */}
          {sale.laboratoryTests && sale.laboratoryTests.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  <CardTitle>Laboratory Tests</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.laboratoryTests.map((test, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{test.test.name}</p>
                        {test.test.description && (
                          <p className="text-sm text-muted-foreground">
                            {test.test.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs{test.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventoryTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inventory Total</span>
                    <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
                  </div>
                )}
                {doctorFeesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor Fees</span>
                    <span className="font-medium">Rs{doctorFeesTotal.toFixed(2)}</span>
                  </div>
                )}
                {labTestsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Laboratory Tests</span>
                    <span className="font-medium">Rs{labTestsTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold">Rs{sale.totalAmount.toFixed(2)}</span>
                </div>
                {inventoryTotal > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inventory Cost</span>
                      <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Net Profit</span>
                      <span className="font-bold text-green-600">
                        Rs{totalProfit.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-4 bg-background">
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}