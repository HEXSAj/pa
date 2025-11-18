// src/app/dashboard/returns/ReturnDetails.tsx

'use client';

import React from 'react';
import { ReturnWithDetails } from '@/types/return';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, User, FileText, Package, X } from 'lucide-react';

interface ReturnDetailsProps {
  returnItem: ReturnWithDetails;
  onClose: () => void;
}

export default function ReturnDetails({ returnItem, onClose }: ReturnDetailsProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return Details</DialogTitle>
          <DialogDescription>
            Return ID: {returnItem.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Return Information */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4">Return Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Return Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {returnItem.returnDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {returnItem.patientDetails && (
                  <div>
                    <label className="text-sm text-muted-foreground">Patient Details</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{returnItem.patientDetails}</span>
                    </div>
                  </div>
                )}
                {returnItem.createdByName && (
                  <div>
                    <label className="text-sm text-muted-foreground">Created By</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                        {returnItem.createdByName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{returnItem.createdByName}</div>
                        {returnItem.createdByEmail && (
                          <div className="text-xs text-muted-foreground">{returnItem.createdByEmail}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {returnItem.createdByRole && (
                  <div>
                    <label className="text-sm text-muted-foreground">Role</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {returnItem.createdByRole}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              {returnItem.notes && (
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <div className="flex items-start gap-2 mt-1">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{returnItem.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Returned Items */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4">Returned Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItem.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Code: {item.item.code}
                            </div>
                            {item.item.genericName && item.item.genericName !== item.item.name && (
                              <div className="text-xs text-blue-600">
                                Generic: {item.item.genericName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.batchNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                          {item.unitsPerPack && (
                            <span className="text-xs text-muted-foreground block">
                              ({item.totalQuantity} {item.item.unitContains?.unit || 'units'})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs{item.costPricePerUnit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs{item.sellingPricePerUnit.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate instanceof Date 
                            ? item.expiryDate.toLocaleDateString()
                            : new Date(item.expiryDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-medium">{returnItem.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <span className="font-medium">
                    {returnItem.items.reduce((sum, item) => sum + item.totalQuantity, 0)} units
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}






