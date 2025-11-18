// // src/app/dashboard/procedures/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { procedureService } from '@/services/procedureService';
// import { Procedure } from '@/types/procedure';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Plus, Loader2, Search, Filter, Edit, Trash2, CheckCircle2, XCircle, Clock, Tag } from 'lucide-react';
// import ProcedureModal from './ProcedureModal';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import withAuth from '@/components/withAuth'; // Import the withAuth HOC
// import { useAuth } from '@/context/AuthContext'; // Import useAuth
// import { toast } from "sonner";

// function ProceduresPage() {
//   const { userRole } = useAuth(); // Access user role from auth context
//   const isAdmin = userRole === 'admin'; // Check if user is admin

//   const [procedures, setProcedures] = useState<Procedure[]>([]);
//   const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
//   const [categories, setCategories] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('all');

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Load procedures
//       const proceduresData = await procedureService.getAll();
//       setProcedures(Array.isArray(proceduresData) ? proceduresData : []);
//       setFilteredProcedures(Array.isArray(proceduresData) ? proceduresData : []);
      
//       // Load categories
//       const categoriesData = await procedureService.getCategories();
//       setCategories(categoriesData);
//     } catch (error) {
//       console.error('Error loading data:', error);
//       setError("Failed to load procedures. Please try again.");
//       setProcedures([]);
//       setFilteredProcedures([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   useEffect(() => {
//     // Apply search and category filters
//     let filtered = [...procedures];
    
//     if (searchQuery.trim() !== '') {
//       const query = searchQuery.toLowerCase().trim();
//       filtered = filtered.filter(procedure => 
//         (procedure.name?.toLowerCase().includes(query) || false) || 
//         (procedure.description?.toLowerCase().includes(query) || false)
//       );
//     }
    
//     if (categoryFilter !== 'all') {
//       if (categoryFilter === 'uncategorized') {
//         filtered = filtered.filter(procedure => !procedure.category);
//       } else {
//         filtered = filtered.filter(procedure => procedure.category === categoryFilter);
//       }
//     }
    
//     setFilteredProcedures(filtered);
//   }, [searchQuery, categoryFilter, procedures]);

//   const handleDelete = async (id: string) => {
//     try {
//       await procedureService.delete(id);
//       setShowDeleteDialog(false);
//       toast.success("Procedure deleted successfully");
//       await loadData();
//     } catch (error) {
//       console.error('Error deleting procedure:', error);
//       toast.error("Failed to delete procedure. Please try again.");
//     }
//   };

//   // const formatPrice = (price: number) => {
//   //   return `Rs. ${price.toFixed(2)}`;
//   // };

//   const formatPrice = (price: number, currency: 'LKR' | 'USD' = 'LKR') => {
//   if (currency === 'USD') {
//     return `$${price.toFixed(2)}`;
//   }
//   return `Rs. ${price.toFixed(2)}`;
// };

//   const formatDuration = (minutes: number) => {
//     if (!minutes) return '-';
    
//     if (minutes < 60) {
//       return `${minutes} min`;
//     } else {
//       const hours = Math.floor(minutes / 60);
//       const mins = minutes % 60;
//       return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4 p-6 h-full">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Procedures</h1>
//             <div className="flex items-center mt-1">
//               <Badge variant="outline" className="capitalize bg-blue-50 text-blue-600">
//                 {userRole} Access
//               </Badge>
//             </div>
//           </div>

//           <div className="flex items-center gap-4 mt-2 sm:mt-0">
//             <Button
//               onClick={() => setShowAddModal(true)}
//               className="gap-2"
//             >
//               <Plus className="h-4 w-4" />
//               Add Procedure
//             </Button>
//           </div>
//         </div>

//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle>Medical Procedures</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Search and Filter Controls */}
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
//               <div className="relative flex-1">
//                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                 <Input
//                   type="text"
//                   placeholder="Search by name or description..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
              
//               <div>
//                 <Select
//                   value={categoryFilter}
//                   onValueChange={(value) => setCategoryFilter(value)}
//                 >
//                   <SelectTrigger className="min-w-[200px]">
//                     <div className="flex items-center gap-2">
//                       <Filter className="h-4 w-4 text-muted-foreground" />
//                       <SelectValue placeholder="Filter by category" />
//                     </div>
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectGroup>
//                       <SelectLabel>Categories</SelectLabel>
//                       <SelectItem value="all">All Procedures</SelectItem>
//                       <SelectItem value="uncategorized">Uncategorized</SelectItem>
//                       {categories.map((category) => (
//                         <SelectItem key={category} value={category}>
//                           {category}
//                         </SelectItem>
//                       ))}
//                     </SelectGroup>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="relative">
//               {loading ? (
//                 <div className="flex justify-center items-center h-48">
//                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//                 </div>
//               ) : error ? (
//                 <div className="flex flex-col items-center justify-center h-48 text-center">
//                   <p className="text-red-500 font-medium">{error}</p>
//                   <Button 
//                     variant="outline" 
//                     className="mt-4"
//                     onClick={loadData}
//                   >
//                     Retry
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="rounded-md border">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Name</TableHead>
//                         <TableHead>Category</TableHead>
//                         <TableHead className="text-right">Local Patient Charge</TableHead>
//                         <TableHead className="text-right">Foreign Patient Charge</TableHead>
//                         <TableHead>Duration</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredProcedures.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={7} className="h-24 text-center">
//                             No procedures found.
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredProcedures.map((procedure) => (
//                           <TableRow key={procedure.id}>
//                             <TableCell className="font-medium">
//                               {procedure.name}
//                             </TableCell>
//                             <TableCell>
//                               {procedure.category ? (
//                                 <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center gap-1 w-fit">
//                                   <Tag className="h-3 w-3" />
//                                   {procedure.category}
//                                 </Badge>
//                               ) : (
//                                 <span className="text-gray-400">-</span>
//                               )}
//                             </TableCell>
//                             <TableCell className="text-right font-medium">
//                                {formatPrice(procedure.localPatientCharge, 'LKR')}
//                             </TableCell>
//                             <TableCell className="text-right font-medium">
//                               {formatPrice(procedure.foreignPatientCharge, 'USD')}
//                             </TableCell>
//                             <TableCell>
//                               {procedure.duration ? (
//                                 <div className="flex items-center gap-1">
//                                   <Clock className="h-3 w-3 text-gray-500" />
//                                   {formatDuration(procedure.duration)}
//                                 </div>
//                               ) : (
//                                 <span className="text-gray-400">-</span>
//                               )}
//                             </TableCell>
//                             <TableCell>
//                               {procedure.isActive ? (
//                                 <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
//                                   <CheckCircle2 className="h-3 w-3" />
//                                   Active
//                                 </Badge>
//                               ) : (
//                                 <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center gap-1">
//                                   <XCircle className="h-3 w-3" />
//                                   Inactive
//                                 </Badge>
//                               )}
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => {
//                                   setSelectedProcedure(procedure);
//                                   setShowEditModal(true);
//                                 }}
//                                 className="h-8 w-8 p-0"
//                               >
//                                 <Edit className="h-4 w-4" />
//                               </Button>
//                               {isAdmin && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => {
//                                     setSelectedProcedure(procedure);
//                                     setShowDeleteDialog(true);
//                                   }}
//                                   className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
//                                 >
//                                   <Trash2 className="h-4 w-4" />
//                                 </Button>
//                               )}
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Modals */}
//       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This action cannot be undone. This will permanently delete the procedure{' '}
//               <span className="font-medium">{selectedProcedure?.name}</span>.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-600 hover:bg-red-700"
//               onClick={() => selectedProcedure?.id && handleDelete(selectedProcedure.id)}
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {showAddModal && (
//         <ProcedureModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadData();
//           }}
//         />
//       )}

//       {showEditModal && selectedProcedure && (
//         <ProcedureModal
//           procedure={selectedProcedure}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedProcedure(null);
//           }}
//           onSuccess={() => {
//             setShowEditModal(false);
//             setSelectedProcedure(null);
//             loadData();
//           }}
//         />
//       )}
//     </DashboardLayout>
//   );
// }

// // Wrap the component with the withAuth HOC
// export default withAuth(ProceduresPage);

'use client';

import { useState, useEffect } from 'react';
import { procedureService } from '@/services/procedureService';
import { Procedure } from '@/types/procedure';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Loader2, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Tag, 
  Activity,
  DollarSign,
  Lock,
  ShieldAlert
} from 'lucide-react';
import ProcedureModal from './ProcedureModal';
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
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";

function ProceduresPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const proceduresData = await procedureService.getAll();
      setProcedures(Array.isArray(proceduresData) ? proceduresData : []);
      setFilteredProcedures(Array.isArray(proceduresData) ? proceduresData : []);
      
      const categoriesData = await procedureService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError("Failed to load procedures. Please try again.");
      setProcedures([]);
      setFilteredProcedures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...procedures];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(procedure => 
        (procedure.name?.toLowerCase().includes(query) || false) || 
        (procedure.description?.toLowerCase().includes(query) || false)
      );
    }
    
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        filtered = filtered.filter(procedure => !procedure.category);
      } else {
        filtered = filtered.filter(procedure => procedure.category === categoryFilter);
      }
    }
    
    setFilteredProcedures(filtered);
  }, [searchQuery, categoryFilter, procedures]);

  const handleDelete = async (id: string) => {
    try {
      await procedureService.delete(id);
      setShowDeleteDialog(false);
      toast.success("Procedure deleted successfully");
      await loadData();
    } catch (error) {
      console.error('Error deleting procedure:', error);
      toast.error("Failed to delete procedure. Please try again.");
    }
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
  };

  // Count active procedures
  const activeProcedures = procedures.filter(p => p.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Medical Procedures</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">Manage your medical procedures and pricing</p>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="bg-white/80 text-blue-600 hover:bg-blue-50 cursor-not-allowed opacity-70"
                        disabled
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Add Procedure
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only admin can add procedures</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Procedures</p>
                  <p className="text-3xl font-bold text-emerald-600">{procedures.length}</p>
                </div>
                <div className="rounded-full bg-emerald-100 p-3">
                  <Activity className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Procedures</p>
                  <p className="text-3xl font-bold text-blue-600">{activeProcedures}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Categories</p>
                  <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Tag className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              In staff mode, you can view procedure information but cannot add, edit, or delete procedures.
            </p>
          </div>
        )}

        {/* Main Procedures Table Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Procedure Database</CardTitle>
                <CardDescription>Manage all your medical procedures in one place</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                 <Input
                   type="text"
                   placeholder="Search procedures..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9 pr-9 py-2 border-gray-200 focus:ring-blue-500 w-full"
                 />
                 {searchQuery && (
                   <button
                     onClick={() => setSearchQuery('')}
                     className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                   >
                     <X className="h-4 w-4" />
                   </button>
                 )}
               </div>
               
               <div>
                 <Select
                   value={categoryFilter}
                   onValueChange={(value) => setCategoryFilter(value)}
                 >
                   <SelectTrigger className="min-w-[200px] border-gray-200 focus:ring-blue-500">
                     <div className="flex items-center gap-2">
                       <Filter className="h-4 w-4 text-muted-foreground" />
                       <SelectValue placeholder="Filter by category" />
                     </div>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectGroup>
                       <SelectLabel>Categories</SelectLabel>
                       <SelectItem value="all">All Procedures</SelectItem>
                       <SelectItem value="uncategorized">Uncategorized</SelectItem>
                       {categories.map((category) => (
                         <SelectItem key={category} value={category}>
                           {category}
                         </SelectItem>
                       ))}
                     </SelectGroup>
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </div>
         </CardHeader>
         
         <CardContent className="p-0">
           <div className="relative">
             {loading ? (
               <div className="flex justify-center items-center h-48">
                 <div className="text-center">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                   <p className="mt-2 text-sm text-gray-500">Loading procedures...</p>
                 </div>
               </div>
             ) : error ? (
               <div className="flex flex-col items-center justify-center h-48 text-center">
                 <p className="text-red-500 font-medium">{error}</p>
                 <Button 
                   variant="outline" 
                   className="mt-4"
                   onClick={loadData}
                 >
                   Retry
                 </Button>
               </div>
             ) : (
               <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                 <Table>
                   <TableHeader className="sticky top-0 bg-white z-10">
                     <TableRow className="bg-gray-50">
                       <TableHead className="w-[250px]">Procedure</TableHead>
                       <TableHead className="w-[150px]">Category</TableHead>
                       <TableHead className="w-[150px]">Charge</TableHead>
                       <TableHead className="w-[120px]">Duration</TableHead>
                       <TableHead className="w-[100px]">Status</TableHead>
                       <TableHead className="text-right w-[100px]">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredProcedures.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                           <div className="flex flex-col items-center">
                             <div className="rounded-full bg-gray-100 p-4 mb-3">
                               <Activity className="h-8 w-8 text-gray-400" />
                             </div>
                             <p className="text-lg text-gray-500">
                               {searchQuery ? 'No procedures match your search criteria' : 'No procedures found'}
                             </p>
                             <p className="text-sm text-gray-400 mt-1">
                               {searchQuery ? 'Try adjusting your search terms' : 'Add your first procedure to get started'}
                             </p>
                             {!searchQuery && isAdmin && (
                               <Button 
                                 onClick={() => setShowAddModal(true)}
                                 className="mt-4"
                                 variant="outline"
                               >
                                 <Plus className="h-4 w-4 mr-2" />
                                 Add Procedure
                               </Button>
                             )}
                           </div>
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredProcedures.map((procedure) => (
                         <TableRow 
                           key={procedure.id} 
                           className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                           onClick={() => {
                             if (isAdmin) {
                               setSelectedProcedure(procedure);
                               setShowEditModal(true);
                             }
                           }}
                         >
                           <TableCell>
                             <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                 {procedure.name.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                 <p className="font-medium">{procedure.name}</p>
                                 {procedure.description && (
                                   <p className="text-xs text-gray-500 truncate max-w-xs">
                                     {procedure.description}
                                   </p>
                                 )}
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             {procedure.category ? (
                               <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center gap-1 w-fit">
                                 <Tag className="h-3 w-3" />
                                 {procedure.category}
                               </Badge>
                             ) : (
                               <span className="text-gray-400 italic text-sm">-</span>
                             )}
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center text-sm font-medium">
                               <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                               {formatPrice(procedure.charge)}
                             </div>
                           </TableCell>
                           <TableCell>
                             {procedure.duration ? (
                               <div className="flex items-center gap-1 text-sm">
                                 <Clock className="h-3 w-3 text-gray-500" />
                                 {formatDuration(procedure.duration)}
                               </div>
                             ) : (
                               <span className="text-gray-400 italic text-sm">-</span>
                             )}
                           </TableCell>
                           <TableCell>
                             {procedure.isActive ? (
                               <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
                                 <CheckCircle2 className="h-3 w-3" />
                                 Active
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center gap-1">
                                 <XCircle className="h-3 w-3" />
                                 Inactive
                               </Badge>
                             )}
                           </TableCell>
                           <TableCell className="text-right">
                             {isAdmin ? (
                               <div 
                                 className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedProcedure(procedure);
                                     setShowEditModal(true);
                                   }}
                                   className="h-8 w-8 text-blue-600"
                                 >
                                   <Edit className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedProcedure(procedure);
                                     setShowDeleteDialog(true);
                                   }}
                                   className="h-8 w-8 text-red-600"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                             ) : (
                               <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         className="h-8 w-8 text-gray-400 cursor-not-allowed"
                                         disabled
                                       >
                                         <Lock className="h-4 w-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Only admin can modify procedures</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
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

     {/* Delete Confirmation Dialog */}
     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
       <AlertDialogContent className="max-w-md rounded-xl overflow-hidden p-0">
         <div className="bg-red-50 p-6">
           <AlertDialogHeader className="text-left space-y-3">
             <div className="mx-auto rounded-full bg-red-100 w-14 h-14 flex items-center justify-center">
               <Trash2 className="h-7 w-7 text-red-600" />
             </div>
             <AlertDialogTitle className="text-xl text-center text-red-700">Delete Procedure</AlertDialogTitle>
             <AlertDialogDescription className="text-center text-red-600">
               Are you sure you want to delete <span className="font-semibold">{selectedProcedure?.name}</span>?
               <br />
               This action cannot be undone and will permanently remove the procedure
               from your database.
             </AlertDialogDescription>
           </AlertDialogHeader>
         </div>
         
         <div className="p-6">
           <AlertDialogFooter className="flex-col sm:flex-row-reverse gap-2">
             <AlertDialogAction
               className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 rounded-lg"
               onClick={() => selectedProcedure?.id && handleDelete(selectedProcedure.id)}
             >
               <Trash2 className="h-4 w-4 mr-2" />
               Delete Procedure
             </AlertDialogAction>
             <AlertDialogCancel className="w-full sm:w-auto rounded-lg border-gray-200">
               Cancel
             </AlertDialogCancel>
           </AlertDialogFooter>
         </div>
       </AlertDialogContent>
     </AlertDialog>

     {/* Only render modals for admin */}
     {isAdmin && showAddModal && (
       <ProcedureModal
         onClose={() => setShowAddModal(false)}
         onSuccess={() => {
           setShowAddModal(false);
           loadData();
         }}
       />
     )}

     {isAdmin && showEditModal && selectedProcedure && (
       <ProcedureModal
         procedure={selectedProcedure}
         onClose={() => {
           setShowEditModal(false);
           setSelectedProcedure(null);
         }}
         onSuccess={() => {
           setShowEditModal(false);
           setSelectedProcedure(null);
           loadData();
         }}
       />
     )}
   </DashboardLayout>
 );
}

export default withAuth(ProceduresPage);