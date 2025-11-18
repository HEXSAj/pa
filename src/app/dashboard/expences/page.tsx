// src/app/dashboard/expenses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Settings, 
  Search,
  Filter,
  CalendarIcon,
  ArrowUpDown,
  MoreHorizontal,
  LogIn,
  ChevronDown,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import ExpenseModal from './ExpenseModal';
import CategoryModal from './CategoryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation'; 
import { useAuth } from '@/context/AuthContext'; // Import the Auth Context
import withAuth from '@/components/withAuth'; // Import the withAuth HOC

function ExpensesPage() {
  const router = useRouter();
  const { userRole } = useAuth(); // Get the user role from our Auth Context
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense | null;
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc',
  });
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const uniqueCategories = Array.from(
    new Set(expenses.map(expense => expense.categoryName))
  );

  // Check if user has ADMIN role - expenses is only for admin
  const hasAccess = userRole === 'admin';

  useEffect(() => {
    // Check authentication state using Firebase (existing code)
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      
      if (user && hasAccess) { // Only load data if the user has admin role
        console.log("User is authenticated and has admin access:", user.email);
        loadExpenses();
      } else {
        console.log("User is not authenticated or doesn't have admin access");
        setLoading(false);
        setExpenses([]);
        setFilteredExpenses([]);
      }
    });
    
    return () => unsubscribe();
  }, [hasAccess]);

  useEffect(() => {
    filterAndSortExpenses();
  }, [searchQuery, expenses, dateRange, categoryFilter, sortConfig]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error: any) {
      console.error("Error loading expenses:", error);
      toast({
        variant: "destructive",
        title: "Error loading expenses",
        description: error?.message || "There was a problem loading your expenses.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    // Apply date filter
    if (dateRange?.from) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        if (dateRange.from && dateRange.to) {
          return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
        } else if (dateRange.from) {
          return expenseDate >= dateRange.from;
        }
        return true;
      });
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => 
        expense.categoryName === categoryFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.details.toLowerCase().includes(query) ||
        expense.categoryName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key!] === undefined || b[sortConfig.key!] === undefined) {
          return 0;
        }
        
        let comparison = 0;
        
        if (sortConfig.key === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          comparison = dateA - dateB;
        } else if (sortConfig.key === 'amount') {
          comparison = a.amount - b.amount;
        } else {
          const aValue = String(a[sortConfig.key!]).toLowerCase();
          const bValue = String(b[sortConfig.key!]).toLowerCase();
          comparison = aValue.localeCompare(bValue);
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredExpenses(filtered);
  };

  const handleSort = (key: keyof Expense) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    });
  };

  const confirmDelete = (id: string) => {
    setExpenseToDelete(id);
    setDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await expenseService.deleteExpense(expenseToDelete);
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      await loadExpenses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting expense",
        description: error?.message || "There was a problem deleting the expense.",
      });
    } finally {
      setDeleteAlertOpen(false);
      setExpenseToDelete(null);
    }
  };

  const calculateTotal = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateCategoryTotals = () => {
    const totals: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      totals[expense.categoryName] = (totals[expense.categoryName] || 0) + expense.amount;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1]) // Sort by amount descending
      .slice(0, 5); // Top 5 categories
  };

  const dateRangeText = () => {
    if (!dateRange?.from) return "Select date range";
    if (!dateRange.to) return format(dateRange.from, "PPP");
    return `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`;
  };

  // Date filter presets
  const setDateRangePreset = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "thisWeek":
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        setDateRange({ from: thisWeekStart, to: today });
        break;
      case "thisMonth":
        setDateRange({
          from: startOfMonth(today),
          to: today
        });
        break;
      case "lastMonth":
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        });
        break;
      case "clear":
        setDateRange(undefined);
        break;
      default:
        break;
    }
  };

  // Redirect to dashboard for staff users
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Display unauthorized message if not admin
  if (isAuthenticated && userRole && userRole !== 'admin') {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <div className="text-center mb-6">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">Access Restricted</h2>
              <p className="text-gray-500 mt-2">
                This page is only accessible to administrators.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-6">
              <p>Your current role: <span className="font-bold capitalize">{userRole}</span></p>
              <p className="mt-2">Please contact an administrator if you need access to this feature.</p>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={handleBackToDashboard}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Display authentication required message if not logged in
  if (isAuthenticated === false) {
    return (
      <DashboardLayout>
        <div className="h-full  flex flex-col items-center justify-center">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <div className="text-center mb-6"><div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-gray-500 mt-2">
                You need to be logged in to access the expenses dashboard.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-6">
              <p>To manage expenses, please sign in to your account first.</p>
              <p className="mt-2">Categories can be managed without authentication.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button onClick={() => setShowCategoryModal(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
              
              <Button variant="outline" onClick={() => window.location.href = '/login'}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
        
        {/* Category Modal */}
        {showCategoryModal && (
          <CategoryModal
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
          />
        )}
      </DashboardLayout>
    );
  }

  // Loading state when checking authentication
  if (isAuthenticated === null) {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Admin user with access - show the full expenses page
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col pt-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-600 capitalize">
              Admin Access
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryModal(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button
              onClick={() => {
                setSelectedExpense(null);
                setShowExpenseModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => setOpenDatePicker(!openDatePicker)}
                className="w-full justify-between text-left font-normal"
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {dateRange?.from ? (
                    dateRangeText()
                  ) : (
                    <span className="text-muted-foreground">Select date range</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
              
              {openDatePicker && (
                <div className="absolute z-50 top-full mt-2 bg-background border rounded-md shadow-md w-auto right-0">
                  <div className="border-b p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm">Date Range</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setDateRange(undefined);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          setDateRangePreset("today");
                        }}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setDateRangePreset("thisWeek");
                        }}
                      >
                        This Week
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setDateRangePreset("thisMonth");
                        }}
                      >
                        This Month
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setDateRangePreset("yesterday");
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs col-span-2"
                        onClick={() => {
                          setDateRangePreset("lastMonth");
                        }}
                      >
                        Last Month
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from || new Date()}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="border-t p-3 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setOpenDatePicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setOpenDatePicker(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || categoryFilter !== 'all' || dateRange?.from) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-3 w-3 ml-1" 
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </Button>
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categoryFilter}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-3 w-3 ml-1" 
                  onClick={() => setCategoryFilter('all')}
                >
                  ✕
                </Button>
              </Badge>
            )}
            {dateRange?.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {dateRangeText()}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-3 w-3 ml-1" 
                  onClick={() => setDateRange(undefined)}
                >
                  ✕
                </Button>
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs" 
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setDateRange(undefined);
              }}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                Rs{calculateTotal().toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calculateCategoryTotals().length > 0 ? (
                calculateCategoryTotals().map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="text-sm">{category}</div>
                    <div className="font-medium">
                      Rs{total.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No expenses to analyze</div>
              )}
              {calculateCategoryTotals().length > 0 && calculateCategoryTotals().length < Object.keys(
                filteredExpenses.reduce((acc, curr) => {
                  acc[curr.categoryName] = true;
                  return acc;
                }, {} as Record<string, boolean>)
              ).length && (
                <div className="text-xs text-muted-foreground">
                  Showing top {calculateCategoryTotals().length} categories
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExpenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {expense.categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      Rs{expense.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                ))}
                {filteredExpenses.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No recent expenses
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>
              Manage and review your expense records
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative flex flex-col h-full">
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 600px)', minHeight: '300px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <Button 
                          variant="ghost" 
                          className="flex items-center gap-1 px-0 hover:bg-transparent"
                          onClick={() => handleSort('date')}
                        >
                          Date
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <Button 
                          variant="ghost" 
                          className="flex items-center gap-1 px-0 hover:bg-transparent"
                          onClick={() => handleSort('categoryName')}
                        >
                          Category
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-[120px] text-right">
                        <Button 
                          variant="ghost" 
                          className="flex items-center gap-1 px-0 hover:bg-transparent ml-auto"
                          onClick={() => handleSort('amount')}
                        >
                          Amount
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
                          <div className="text-xs text-muted-foreground mt-2">
                            Loading expenses...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="text-muted-foreground">No expenses found</div>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {
                              setSelectedExpense(null);
                              setShowExpenseModal(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.categoryName}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {expense.details || <span className="text-muted-foreground italic">No details</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rs{expense.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setShowExpenseModal(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => expense.id && confirmDelete(expense.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t py-4 px-6 flex justify-between items-center bg-muted/50">
                <div className="text-sm text-muted-foreground">
                  {filteredExpenses.length === 0 ? 'No expenses' : (
                    `Showing ${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`
                  )}
                </div>
                <div className="font-medium">
                  Total: Rs{calculateTotal().toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense || undefined}
          onSuccess={() => {
            loadExpenses();
            setShowExpenseModal(false);
            setSelectedExpense(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Wrap the component with the withAuth HOC for protection
export default withAuth(ExpensesPage);