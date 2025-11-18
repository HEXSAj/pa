// src/app/dashboard/pos/LoyaltyPoints.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { customerService } from '@/services/customerService';
import { Customer } from '@/types/customer';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Star, 
  Search, 
  X, 
  Loader2, 
  Edit, 
  Trash2, 
  Filter, 
  MoreHorizontal, 
  User, 
  Phone, 
  ArrowUp, 
  ArrowDown, 
  Award,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function LoyaltyPointsPage() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'recent'>('points');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAdjustPointsDialog, setShowAdjustPointsDialog] = useState(false);
  const [pointsToAdjust, setPointsToAdjust] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Stats
  const [totalPoints, setTotalPoints] = useState(0);
  const [customersWithPoints, setCustomersWithPoints] = useState(0);
  const [averagePoints, setAveragePoints] = useState(0);
  
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      
      // Calculate stats
      let pointsSum = 0;
      let customersCount = 0;
      
      data.forEach(customer => {
        if (customer.loyaltyPoints && customer.loyaltyPoints > 0) {
          pointsSum += customer.loyaltyPoints;
          customersCount++;
        }
      });
      
      setTotalPoints(pointsSum);
      setCustomersWithPoints(customersCount);
      setAveragePoints(customersCount > 0 ? pointsSum / customersCount : 0);
      
      setCustomers(data);
      applyFiltersAndSort(data, searchQuery, sortBy, sortDirection);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const applyFiltersAndSort = (
    data: Customer[], 
    query: string, 
    sort: typeof sortBy, 
    direction: typeof sortDirection
  ) => {
    // Filter by search query
    let filtered = data;
    if (query.trim() !== '') {
      const searchLower = query.toLowerCase();
      filtered = data.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) || 
        customer.mobile.toLowerCase().includes(searchLower) ||
        (customer.address && customer.address.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort data
    const sorted = [...filtered].sort((a, b) => {
      const aPoints = a.loyaltyPoints || 0;
      const bPoints = b.loyaltyPoints || 0;
      
      switch (sort) {
        case 'points':
          return direction === 'desc' ? bPoints - aPoints : aPoints - bPoints;
        case 'name':
          return direction === 'desc' 
            ? b.name.localeCompare(a.name) 
            : a.name.localeCompare(b.name);
        case 'recent':
          return direction === 'desc'
            ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredCustomers(sorted);
  };

  // Update when search query or sort changes
  useEffect(() => {
    applyFiltersAndSort(customers, searchQuery, sortBy, sortDirection);
  }, [customers, searchQuery, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleAdjustPoints = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPointsToAdjust('');
    setAdjustmentType('add');
    setAdjustmentNote('');
    setShowAdjustPointsDialog(true);
  };
  
  const submitPointsAdjustment = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;
    
    const points = parseFloat(pointsToAdjust);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid, positive number of points",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      const currentPoints = selectedCustomer.loyaltyPoints || 0;
      let newPointsValue: number;
      
      switch (adjustmentType) {
        case 'add':
          newPointsValue = currentPoints + points;
          break;
        case 'subtract':
          // Check if we're trying to subtract more points than available
          if (points > currentPoints) {
            toast({
              title: "Error",
              description: `Cannot subtract more than the current balance of ${currentPoints.toFixed(2)} points`,
              variant: "destructive",
            });
            setProcessing(false);
            return;
          }
          newPointsValue = currentPoints - points;
          break;
        case 'set':
          newPointsValue = points;
          break;
        default:
          newPointsValue = currentPoints;
      }
      
      // Update the customer with new points value
      await customerService.updateLoyaltyPoints(selectedCustomer.id, newPointsValue);
      
      // Successful update
      toast({
        title: "Points Updated",
        description: `${selectedCustomer.name}'s loyalty points updated successfully`,
        variant: "success",
      });
      
      // Reload customer data
      loadCustomers();
      
      // Close dialog
      setShowAdjustPointsDialog(false);
      
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({
        title: "Error",
        description: "Failed to update loyalty points",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSortChange = (value: typeof sortBy) => {
    if (sortBy === value) {
      // If clicking the same sort option, toggle direction
      toggleSortDirection();
    } else {
      // If changing sort option, default to descending
      setSortBy(value);
      setSortDirection('desc');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Loyalty Points Management</h1>
              <p className="text-purple-100 mt-1">Track and manage customer loyalty points</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={loadCustomers}
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Points</p>
                  <p className="text-3xl font-bold text-purple-600">{totalPoints.toFixed(2)}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Star className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Customers with Points</p>
                  <p className="text-3xl font-bold text-blue-600">{customersWithPoints}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Points per Customer</p>
                  <p className="text-3xl font-bold text-indigo-600">{averagePoints.toFixed(2)}</p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3">
                  <Award className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Info Card about Loyalty Program */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Info className="h-5 w-5 mr-2 text-purple-500" />
              About the Loyalty Program
            </CardTitle>
          </CardHeader>
          {/* <CardContent>
            <div className="space-y-2 text-sm">
              <p className="flex items-center">
                <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Earning</Badge>
                Customers earn <span className="font-semibold mx-1">0.01 points</span> for every Rs 1,000 spent
              </p>
              <p className="flex items-center">
                <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Value</Badge>
                Each loyalty point is worth <span className="font-semibold mx-1">Rs 1</span> in discount value
              </p>
              <p className="flex items-center">
                <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Redemption</Badge>
                Points can be redeemed during checkout by selecting the loyalty points option
              </p>
              <p className="flex items-center">
                <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Restriction</Badge>
                Discounted sales do not earn loyalty points
              </p>
            </div>
          </CardContent> */}
          <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Earning</Badge>
              <span>Customers earn <span className="font-semibold mx-1">0.01 points</span> for every Rs 1,000 spent</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Value</Badge>
              <span>Each loyalty point is worth <span className="font-semibold mx-1">Rs 1</span> in discount value</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Redemption</Badge>
              <span>Points can be redeemed during checkout by selecting the loyalty points option</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">Restriction</Badge>
              <span>Discounted sales do not earn loyalty points</span>
            </div>
          </div>
        </CardContent>
        </Card>
        
        {/* Main Customers with Loyalty Points Table */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Customer Loyalty Points</CardTitle>
                <CardDescription>View and manage loyalty point balances</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 py-2 border-gray-200 focus:ring-purple-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-1" />
                      {sortBy === 'points' 
                        ? 'Sort by Points' 
                        : sortBy === 'name' 
                          ? 'Sort by Name' 
                          : 'Sort by Recent'}
                      {sortDirection === 'desc' 
                        ? <ArrowDown className="h-3 w-3 ml-1" /> 
                        : <ArrowUp className="h-3 w-3 ml-1" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSortChange('points')}>
                      Sort by Points {sortBy === 'points' && (
                        sortDirection === 'desc' 
                          ? <ArrowDown className="h-3 w-3 ml-1" /> 
                          : <ArrowUp className="h-3 w-3 ml-1" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange('name')}>
                      Sort by Name {sortBy === 'name' && (
                        sortDirection === 'desc' 
                          ? <ArrowDown className="h-3 w-3 ml-1" /> 
                          : <ArrowUp className="h-3 w-3 ml-1" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange('recent')}>
                      Sort by Recent {sortBy === 'recent' && (
                        sortDirection === 'desc' 
                          ? <ArrowDown className="h-3 w-3 ml-1" /> 
                          : <ArrowUp className="h-3 w-3 ml-1" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading customer data...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[300px]">Customer</TableHead>
                        <TableHead className="w-[180px]">Contact</TableHead>
                        <TableHead className="w-[120px]">Discount</TableHead>
                        <TableHead className="w-[150px]">Loyalty Points</TableHead>
                        <TableHead className="w-[120px]">Point Value</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-purple-100 p-4 mb-3">
                                <Star className="h-8 w-8 text-purple-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery ? 'No customers match your search criteria' : 'No customers with loyalty points found'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try adjusting your search terms' : 'Customers earn points on non-discounted purchases'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow 
                            key={customer.id} 
                            className={`group hover:bg-purple-50/50 transition-colors ${(customer.loyaltyPoints || 0) > 0 ? 'bg-purple-50/20' : ''}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-xs text-gray-500 mt-1">ID: {customer.id?.substring(0, 8)}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {customer.mobile}
                              </div>
                            </TableCell>
                            <TableCell>
                              {typeof customer.discountPercentage !== 'undefined' ? (
                                <Badge className={`
                                  ${parseFloat(String(customer.discountPercentage)) > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                                `}>
                                  {customer.discountPercentage}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-500">
                                  0%
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1.5 text-purple-500" />
                                <span className={`font-semibold ${(customer.loyaltyPoints || 0) > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                                  {(customer.loyaltyPoints || 0).toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal bg-purple-50 text-purple-700 border-purple-200">
                                Rs{(customer.loyaltyPoints || 0).toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {isAdmin ? (
                                <div 
                                  className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleAdjustPoints(customer)}
                                          className="h-8 w-8 text-purple-600"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Adjust Points</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              ) : (
                                <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                                    Admin Only
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjust Points Dialog */}
      <Dialog open={showAdjustPointsDialog} onOpenChange={setShowAdjustPointsDialog}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-6 px-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white text-xl">Adjust Loyalty Points</DialogTitle>
              <DialogDescription className="text-purple-200 mt-1">
                {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Current Points Balance:</p>
                <p className="text-xl font-bold text-purple-800">
                  {(selectedCustomer?.loyaltyPoints || 0).toFixed(2)} points
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="adjustmentType" className="text-base">Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  className={adjustmentType === 'add' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
                  onClick={() => setAdjustmentType('add')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Points
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                  className={adjustmentType === 'subtract' ? 'bg-amber-600 hover:bg-amber-700 flex-1' : 'flex-1'}
                  onClick={() => setAdjustmentType('subtract')}
                >
                  <MinusCircle className="h-4 w-4 mr-2" />
                  Remove Points
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'set' ? 'default' : 'outline'}
                  className={adjustmentType === 'set' ? 'bg-blue-600 hover:bg-blue-700 flex-1' : 'flex-1'}
                  onClick={() => setAdjustmentType('set')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Set Points
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="pointsToAdjust" className="text-base">Points Value</Label>
              <Input
                id="pointsToAdjust"
                type="number"
                min="0"
                step="0.01"
                value={pointsToAdjust}
                onChange={(e) => setPointsToAdjust(e.target.value)}
                placeholder="Enter points value"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="adjustmentNote" className="text-base">Note (Optional)</Label>
              <Input
                id="adjustmentNote"
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="Add a note about this adjustment"
              />
            </div>
            
            {/* Preview section */}
            {pointsToAdjust && !isNaN(parseFloat(pointsToAdjust)) && parseFloat(pointsToAdjust) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium mb-2">Preview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Balance:</span>
                    <span>{(selectedCustomer?.loyaltyPoints || 0).toFixed(2)} points</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{
                      adjustmentType === 'add' ? 'Points to Add:' : 
                      adjustmentType === 'subtract' ? 'Points to Remove:' :
                      'New Points Value:'
                    }</span>
                    <span>{parseFloat(pointsToAdjust).toFixed(2)} points</span>
                  </div>
                  {adjustmentType !== 'set' && (
                    <>
                      <div className="h-px bg-gray-200 my-1"></div>
                      <div className="flex justify-between font-medium">
                        <span>New Balance:</span>
                        <span>{
                          adjustmentType === 'add' 
                            ? ((selectedCustomer?.loyaltyPoints || 0) + parseFloat(pointsToAdjust)).toFixed(2)
                            : Math.max(0, (selectedCustomer?.loyaltyPoints || 0) - parseFloat(pointsToAdjust)).toFixed(2)
                        } points</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-6 pb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAdjustPointsDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitPointsAdjustment}
              disabled={processing || !pointsToAdjust || isNaN(parseFloat(pointsToAdjust)) || parseFloat(pointsToAdjust) <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Adjustment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}