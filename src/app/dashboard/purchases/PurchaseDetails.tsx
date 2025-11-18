// src/app/dashboard/purchases/PurchaseDetails.tsx

import React, { useState } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails } from '@/types/purchase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader,CardTitle } from "@/components/ui/card";
import { 
  ClipboardList, 
  Edit, 
  Trash2, 
  Loader2, 
  Gift,
  DollarSign
} from 'lucide-react';
import { toast } from "sonner";
import { Label } from '@/components/ui/label';

interface PurchaseDetailsProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

const PurchaseDetails = ({ 
  purchase, 
  onClose, 
  onEdit, 
  onDelete,
  isReadOnly = false
}: PurchaseDetailsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getTotalUnits = (item: PurchaseWithDetails['items'][0]) => {
    if (item.item.unitContains) {
      return Math.floor(item.totalQuantity / item.item.unitContains.value);
    }
    return item.totalQuantity;
  };

  const formatPrice = (price: number | undefined | null) => {
    if (typeof price !== 'number') return '-';
    return `${price.toFixed(2)}`;
  };

  const calculateSubtotal = (item: PurchaseWithDetails['items'][0]) => {
    return item.quantity * item.costPricePerUnit;
  };

  const supplierName = purchase.supplier?.name || 'N/A';
  const supplierPhone = purchase.supplier?.phone || 'N/A';
  const supplierEmail = purchase.supplier?.email || 'N/A';

  const getMarginPercentage = (cost: number, selling: number) => {
    if (cost === 0 || !cost || !selling) return 0;
    return ((selling - cost) / cost * 100).toFixed(1);
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await purchaseService.delete(purchase.id!);
      toast.success('Purchase deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Error deleting purchase. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                {!isReadOnly && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={onEdit}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="gap-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Purchase Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Supplier Information</h3>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{supplierName}</p>
                      <p className="text-sm text-muted-foreground">{supplierPhone}</p>
                      <p className="text-sm text-muted-foreground">{supplierEmail}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Payment Method</Label>
                          <p className="font-medium capitalize">{purchase.paymentMethod?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Payment Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              purchase.paymentStatus === 'paid' ? 'default' : 
                              purchase.paymentStatus === 'partial' ? 'secondary' : 'destructive'
                            }>
                              {purchase.paymentStatus?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Total Amount</Label>
                          <p className="font-medium">Rs{purchase.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Due Amount</Label>
                          <p className={`font-medium ${purchase.dueAmount && purchase.dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            Rs{(purchase.dueAmount || 0).toFixed(2)}
                          </p>
                        </div>
                        {purchase.initialPayment && purchase.initialPayment > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Initial Payment</Label>
                            <p className="font-medium text-green-600">Rs{purchase.initialPayment.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Payment History Summary */}
                      {purchase.paymentHistory && purchase.paymentHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm text-muted-foreground">Payment History</Label>
                          <div className="mt-2 space-y-1">
                            {purchase.paymentHistory.slice(0, 3).map((payment, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{new Date(payment.date).toLocaleDateString()} - {payment.paymentMethod}</span>
                                <span className="text-green-600">Rs{payment.amount.toFixed(2)}</span>
                              </div>
                            ))}
                            {purchase.paymentHistory.length > 3 && (
                              <p className="text-xs text-gray-500">...and {purchase.paymentHistory.length - 3} more payments</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Purchase Information</h3>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Date: </span>
                        {purchase.purchaseDate?.toLocaleDateString() || 'N/A'}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Invoice: </span>
                        {purchase.invoiceNumber || 'N/A'}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Amount: </span>
                        Rs{purchase.totalAmount.toFixed(2)}
                      </div>
                      {/* Creator information */}
                      {purchase.createdByName ? (
                        <div className="text-sm mt-3 pt-3 border-t border-gray-100">
                          <span className="text-muted-foreground">Created by: </span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                              {purchase.createdByName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{purchase.createdByName}</span>
                          </div>
                          {purchase.createdByEmail && (
                            <span className="text-xs text-muted-foreground block mt-0.5 ml-7">
                              {purchase.createdByEmail}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm mt-3 pt-3 border-t border-gray-100">
                          <span className="text-muted-foreground">Created by: </span>
                          <span className="font-medium">Unknown User</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Table */}
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-4">Purchased Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Batch #</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Free Items</TableHead>
                          <TableHead className="text-right">Cost/Unit</TableHead>
                          <TableHead className="text-right">Selling/Unit</TableHead>
                          <TableHead className="text-right">Margin %</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchase.items?.map((item, index) => {
                          if (!item || !item.item) return null;
                          
                          const margin = getMarginPercentage(
                            item.costPricePerUnit,
                            item.sellingPricePerUnit
                          );

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.item.name}</p>
                                  <p className="text-sm text-muted-foreground">Code: {item.item.code}</p>
                                  <div className="mt-1">
                                    <Badge variant="secondary">
                                      {item.item.type}
                                    </Badge>
                                  </div>
                                  {item.item.unitContains && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.item.unitContains.value} {item.item.unitContains.unit} per unit
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{item.batchNumber}</TableCell>
                              <TableCell className="text-right">
                                <div>
                                  <p>{item.quantity} units</p>
                                  {item.item.unitContains && item.unitsPerPack && (
                                    <p className="text-xs text-muted-foreground">
                                      Total: {item.quantity * item.unitsPerPack} {item.item.unitContains?.unit || 'units'}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.freeItemCount && item.freeItemCount > 0 ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <span>{item.freeItemCount}</span>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                      <Gift className="h-3 w-3 mr-1" />
                                      Free
                                    </Badge>
                                  </div>
                                ) : (
                                  <span>-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div>
                                  <p className="font-medium">{formatPrice(item.costPricePerUnit)}</p>
                                  <p className="text-xs text-muted-foreground">per unit</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div>
                                  <p className="font-medium">{formatPrice(item.sellingPricePerUnit)}</p>
                                  <p className="text-xs text-muted-foreground">per unit</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={
                                  parseFloat(margin) >= 30 ? "success" : 
                                  parseFloat(margin) >= 20 ? "default" : 
                                  "destructive"
                                }>
                                  {margin}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.expiryDate ? formatDate(item.expiryDate) : 'Not specified'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(calculateSubtotal(item))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={8}>Total</TableCell>
                          <TableCell className="text-right">
                            Rs{purchase.totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {purchase.notes && (
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isReadOnly && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this purchase? This will permanently remove the purchase
                and all associated batches from the system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Purchase'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default PurchaseDetails;