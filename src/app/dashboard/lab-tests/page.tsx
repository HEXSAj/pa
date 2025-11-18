// // // src/app/dashboard/lab-tests/page.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { labTestService } from '@/services/labTestService';
// // import { labService } from '@/services/labService';
// // import { LabTest } from '@/types/labTest';
// // import { Lab } from '@/types/lab';
// // import DashboardLayout from '@/components/DashboardLayout';
// // import { Plus, Loader2, Search, Filter, Edit, Trash2, CheckCircle2, XCircle, Building2, FlaskConical } from 'lucide-react';
// // import LabTestModal from './LabTestModal';
// // import {
// //   AlertDialog,
// //   AlertDialogAction,
// //   AlertDialogCancel,
// //   AlertDialogContent,
// //   AlertDialogDescription,
// //   AlertDialogFooter,
// //   AlertDialogHeader,
// //   AlertDialogTitle,
// // } from "@/components/ui/alert-dialog";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Badge } from "@/components/ui/badge";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectGroup,
// //   SelectItem,
// //   SelectLabel,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import withAuth from '@/components/withAuth'; // Import the withAuth HOC
// // import { useAuth } from '@/context/AuthContext'; // Import useAuth
// // import { toast } from "sonner";
// // import Link from 'next/link';

// // function LabTestsPage() {
// //   const { userRole } = useAuth(); // Access user role from auth context
// //   const isAdmin = userRole === 'admin'; // Check if user is admin

// //   const [tests, setTests] = useState<LabTest[]>([]);
// //   const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
// //   const [labs, setLabs] = useState<Lab[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [showAddModal, setShowAddModal] = useState(false);
// //   const [showEditModal, setShowEditModal] = useState(false);
// //   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
// //   const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [labFilter, setLabFilter] = useState('all');

// //   const loadData = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);

// //       // Load both tests and labs in parallel
// //       const [testsData, labsData] = await Promise.all([
// //         labTestService.getAll(),
// //         labService.getAll()
// //       ]);
      
// //       setTests(Array.isArray(testsData) ? testsData : []);
// //       setFilteredTests(Array.isArray(testsData) ? testsData : []);
// //       setLabs(Array.isArray(labsData) ? labsData : []);
// //     } catch (error) {
// //       console.error('Error loading data:', error);
// //       setError("Failed to load lab tests. Please try again.");
// //       setTests([]);
// //       setFilteredTests([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   useEffect(() => {
// //     // Apply search and lab filters
// //     let filtered = [...tests];
    
// //     if (searchQuery.trim() !== '') {
// //       const query = searchQuery.toLowerCase().trim();
// //       filtered = filtered.filter(test => 
// //         (test.name?.toLowerCase().includes(query) || false) || 
// //         (test.description?.toLowerCase().includes(query) || false)
// //       );
// //     }
    
// //     if (labFilter !== 'all') {
// //       filtered = filtered.filter(test => test.labId === labFilter);
// //     }
    
// //     setFilteredTests(filtered);
// //   }, [searchQuery, labFilter, tests]);

// //   const handleDelete = async (id: string) => {
// //     try {
// //       await labTestService.delete(id);
// //       setShowDeleteDialog(false);
// //       toast.success("Lab test deleted successfully");
// //       await loadData();
// //     } catch (error) {
// //       console.error('Error deleting lab test:', error);
// //       toast.error("Failed to delete lab test. Please try again.");
// //     }
// //   };

// // //  const formatPrice = (price: number) => {
// // //   return `Rs. ${price.toFixed(2)}`;
// // // };

// //   const formatPrices = (test: LabTest) => {
// //     return `Local: Rs ${test.localPatientCharge?.toFixed(2) || '0.00'} | Foreign: $${test.foreignPatientCharge?.toFixed(2) || '0.00'}`;
// //   };

// //   return (
// //     <DashboardLayout>
// //       <div className="space-y-4 p-6 h-full">
// //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
// //           <div>
// //             <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
// //             <div className="flex items-center mt-1">
// //               <Badge variant="outline" className="capitalize bg-blue-50 text-blue-600">
// //                 {userRole} Access
// //               </Badge>
// //             </div>
// //           </div>

// //           <div className="flex items-center gap-4 mt-2 sm:mt-0">
// //             <Link href="/dashboard/labs">
// //               <Button variant="outline" className="gap-2">
// //                 <Building2 className="h-4 w-4" />
// //                 Manage Labs
// //               </Button>
// //             </Link>
            
// //             <Button
// //               onClick={() => setShowAddModal(true)}
// //               className="gap-2"
// //             >
// //               <Plus className="h-4 w-4" />
// //               Add Test
// //             </Button>
// //           </div>
// //         </div>

// //         <Card>
// //           <CardHeader className="pb-3">
// //             <CardTitle>Lab Tests</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             {/* Search and Filter Controls */}
// //             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
// //               <div className="relative flex-1">
// //                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
// //                 <Input
// //                   type="text"
// //                   placeholder="Search by test name or description..."
// //                   value={searchQuery}
// //                   onChange={(e) => setSearchQuery(e.target.value)}
// //                   className="pl-9"
// //                 />
// //               </div>
              
// //               <div>
// //                 <Select
// //                   value={labFilter}
// //                   onValueChange={(value) => setLabFilter(value)}
// //                 >
// //                   <SelectTrigger className="min-w-[200px]">
// //                     <div className="flex items-center gap-2">
// //                       <Filter className="h-4 w-4 text-muted-foreground" />
// //                       <SelectValue placeholder="Filter by lab" />
// //                     </div>
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectGroup>
// //                       <SelectLabel>Labs</SelectLabel>
// //                       <SelectItem value="all">All Labs</SelectItem>
// //                       {labs.map((lab) => (
// //                         <SelectItem key={lab.id} value={lab.id!}>
// //                           {lab.name}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectGroup>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //             </div>

// //             <div className="relative">
// //               {loading ? (
// //                 <div className="flex justify-center items-center h-48">
// //                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
// //                 </div>
// //               ) : error ? (
// //                 <div className="flex flex-col items-center justify-center h-48 text-center">
// //                   <p className="text-red-500 font-medium">{error}</p>
// //                   <Button 
// //                     variant="outline" 
// //                     className="mt-4"
// //                     onClick={loadData}
// //                   >
// //                     Retry
// //                   </Button>
// //                 </div>
// //               ) : (
// //                 <div className="rounded-md border">
// //                   <Table>
// //                     <TableHeader>
// //                       <TableRow>
// //                         <TableHead>Test Name</TableHead>
// //                         <TableHead>Lab</TableHead>
// //                         <TableHead>Price</TableHead>
// //                         <TableHead>Description</TableHead>
// //                         <TableHead>Status</TableHead>
// //                         <TableHead className="text-right">Actions</TableHead>
// //                       </TableRow>
// //                     </TableHeader>
// //                     <TableBody>
// //                       {filteredTests.length === 0 ? (
// //                         <TableRow>
// //                           <TableCell colSpan={6} className="h-24 text-center">
// //                             No lab tests found.
// //                           </TableCell>
// //                         </TableRow>
// //                       ) : (
// //                         filteredTests.map((test) => (
// //                           <TableRow key={test.id}>
// //                             <TableCell className="font-medium">
// //                               <div className="flex items-center gap-2">
// //                                 <FlaskConical className="h-4 w-4 text-blue-500" />
// //                                 {test.name}
// //                               </div>
// //                             </TableCell>
// //                             <TableCell>
// //                               <div className="flex items-center gap-1">
// //                                 <Building2 className="h-4 w-4 text-gray-500" />
// //                                 {test.labName}
// //                               </div>
// //                             </TableCell>
// //                             <TableCell className="font-medium">
// //                               {formatPrice(test.price)}
// //                             </TableCell>
// //                             <TableCell>
// //                               {test.description || <span className="text-gray-400">-</span>}
// //                             </TableCell>
// //                             <TableCell>
// //                               {test.isActive ? (
// //                                 <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
// //                                   <CheckCircle2 className="h-3 w-3" />
// //                                   Active
// //                                 </Badge>
// //                               ) : (
// //                                 <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center gap-1">
// //                                   <XCircle className="h-3 w-3" />
// //                                   Inactive
// //                                 </Badge>
// //                               )}
// //                             </TableCell>
// //                             <TableCell className="text-right">
// //                               <Button
// //                                 variant="ghost"
// //                                 size="sm"
// //                                 onClick={() => {
// //                                   setSelectedTest(test);
// //                                   setShowEditModal(true);
// //                                 }}
// //                                 className="h-8 w-8 p-0"
// //                               >
// //                                 <Edit className="h-4 w-4" />
// //                               </Button>
// //                               {isAdmin && (
// //                                 <Button
// //                                   variant="ghost"
// //                                   size="sm"
// //                                   onClick={() => {
// //                                     setSelectedTest(test);
// //                                     setShowDeleteDialog(true);
// //                                   }}
// //                                   className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
// //                                 >
// //                                   <Trash2 className="h-4 w-4" />
// //                                 </Button>
// //                               )}
// //                             </TableCell>
// //                           </TableRow>
// //                         ))
// //                       )}
// //                     </TableBody>
// //                   </Table>
// //                 </div>
// //               )}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Modals */}
// //       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
// //             <AlertDialogDescription>
// //               This action cannot be undone. This will permanently delete the test{' '}
// //               <span className="font-medium">{selectedTest?.name}</span> from {selectedTest?.labName}.
// //             </AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel>Cancel</AlertDialogCancel>
// //             <AlertDialogAction
// //               className="bg-red-600 hover:bg-red-700"
// //               onClick={() => selectedTest?.id && handleDelete(selectedTest.id)}
// //             >
// //               Delete
// //             </AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>

// //       {showAddModal && (
// //         <LabTestModal
// //           onClose={() => setShowAddModal(false)}
// //           onSuccess={() => {
// //             setShowAddModal(false);
// //             loadData();
// //           }}
// //         />
// //       )}

// //       {showEditModal && selectedTest && (
// //         <LabTestModal
// //           test={selectedTest}
// //           onClose={() => {
// //             setShowEditModal(false);
// //             setSelectedTest(null);
// //           }}
// //           onSuccess={() => {
// //             setShowEditModal(false);
// //             setSelectedTest(null);
// //             loadData();
// //           }}
// //         />
// //       )}
// //     </DashboardLayout>
// //   );
// // }

// // // Wrap the component with the withAuth HOC
// // export default withAuth(LabTestsPage);

// // src/app/dashboard/lab-tests/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { labTestService } from '@/services/labTestService';
// import { labService } from '@/services/labService';
// import { LabTest } from '@/types/labTest';
// import { Lab } from '@/types/lab';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Plus, Loader2, Search, Filter, Edit, Trash2, CheckCircle2, XCircle, Building2, FlaskConical } from 'lucide-react';
// import LabTestModal from './LabTestModal';
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
// import Link from 'next/link';
// import PriceHistoryModal from './PriceHistoryModal';
// import { History } from 'lucide-react';

// function LabTestsPage() {
//   const { userRole } = useAuth(); // Access user role from auth context
//   const isAdmin = userRole === 'admin'; // Check if user is admin

//   const [tests, setTests] = useState<LabTest[]>([]);
//   const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
//   const [labs, setLabs] = useState<Lab[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [labFilter, setLabFilter] = useState('all');

//   const [showHistoryModal, setShowHistoryModal] = useState(false);
//   const [selectedTestForHistory, setSelectedTestForHistory] = useState<LabTest | null>(null);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Load both tests and labs in parallel
//       const [testsData, labsData] = await Promise.all([
//         labTestService.getAll(),
//         labService.getAll()
//       ]);
      
//       setTests(Array.isArray(testsData) ? testsData : []);
//       setFilteredTests(Array.isArray(testsData) ? testsData : []);
//       setLabs(Array.isArray(labsData) ? labsData : []);
//     } catch (error) {
//       console.error('Error loading data:', error);
//       setError("Failed to load lab tests. Please try again.");
//       setTests([]);
//       setFilteredTests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   useEffect(() => {
//     // Apply search and lab filters
//     let filtered = [...tests];
    
//     if (searchQuery.trim() !== '') {
//       const query = searchQuery.toLowerCase().trim();
//       filtered = filtered.filter(test => 
//         (test.name?.toLowerCase().includes(query) || false) || 
//         (test.description?.toLowerCase().includes(query) || false)
//       );
//     }
    
//     if (labFilter !== 'all') {
//       filtered = filtered.filter(test => test.labId === labFilter);
//     }
    
//     setFilteredTests(filtered);
//   }, [searchQuery, labFilter, tests]);

//   const handleDelete = async (id: string) => {
//     try {
//       await labTestService.delete(id);
//       setShowDeleteDialog(false);
//       toast.success("Lab test deleted successfully");
//       await loadData();
//     } catch (error) {
//       console.error('Error deleting lab test:', error);
//       toast.error("Failed to delete lab test. Please try again.");
//     }
//   };

//   // const formatPrices = (test: LabTest) => {
//   //   return (
//   //     <div className="space-y-1">
//   //       <div className="text-sm">
//   //         <span className="text-green-600 font-medium">Local:</span> Rs {test.localPatientCharge?.toFixed(2) || '0.00'}
//   //       </div>
//   //       <div className="text-sm">
//   //         <span className="text-blue-600 font-medium">Foreign:</span> ${test.foreignPatientCharge?.toFixed(2) || '0.00'}
//   //       </div>
//   //     </div>
//   //   );
//   // };

//   const formatPrice = (test: LabTest) => {
//     const price = test.price || test.localPatientCharge || 0;
//     return `Rs ${price.toFixed(2)}`;
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4 p-6 h-full">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
//             <div className="flex items-center mt-1">
//               <Badge variant="outline" className="capitalize bg-blue-50 text-blue-600">
//                 {userRole} Access
//               </Badge>
//             </div>
//           </div>

//           <div className="flex items-center gap-4 mt-2 sm:mt-0">
//             <Link href="/dashboard/labs">
//               <Button variant="outline" className="gap-2">
//                 <Building2 className="h-4 w-4" />
//                 Manage Labs
//               </Button>
//             </Link>
            
//             <Button
//               onClick={() => setShowAddModal(true)}
//               className="gap-2"
//             >
//               <Plus className="h-4 w-4" />
//               Add Test
//             </Button>
//           </div>
//         </div>

//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle>Lab Tests</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Search and Filter Controls */}
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
//               <div className="relative flex-1">
//                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                 <Input
//                   type="text"
//                   placeholder="Search by test name or description..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
              
//               <div>
//                 <Select
//                   value={labFilter}
//                   onValueChange={(value) => setLabFilter(value)}
//                 >
//                   <SelectTrigger className="min-w-[200px]">
//                     <div className="flex items-center gap-2">
//                       <Filter className="h-4 w-4 text-muted-foreground" />
//                       <SelectValue placeholder="Filter by lab" />
//                     </div>
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectGroup>
//                       <SelectLabel>Labs</SelectLabel>
//                       <SelectItem value="all">All Labs</SelectItem>
//                       {labs.map((lab) => (
//                         <SelectItem key={lab.id} value={lab.id!}>
//                           {lab.name}
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
//                         <TableHead>Test Name</TableHead>
//                         <TableHead>Lab</TableHead>
//                         <TableHead>Pricing</TableHead>
//                         <TableHead>Description</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredTests.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="h-24 text-center">
//                             No lab tests found.
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredTests.map((test) => (
//                           <TableRow key={test.id}>
//                             <TableCell className="font-medium">
//                               <div className="flex items-center gap-2">
//                                 <FlaskConical className="h-4 w-4 text-blue-500" />
//                                 {test.name}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <div className="flex items-center gap-1">
//                                 <Building2 className="h-4 w-4 text-gray-500" />
//                                 {test.labName}
//                               </div>
//                             </TableCell>
//                             <TableCell className="font-medium">
//                               {formatPrice(test)}
//                             </TableCell>
//                             <TableCell>
//                               {test.description || <span className="text-gray-400">-</span>}
//                             </TableCell>
//                             <TableCell>
//                               {test.isActive ? (
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
//                                 <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => {
//                                   setSelectedTestForHistory(test);
//                                   setShowHistoryModal(true);
//                                 }}
//                                 className="h-8 w-8 p-0"
//                                 title="View Price History"
//                               >
//                                 <History className="h-4 w-4" />
//                               </Button>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => {
//                                   setSelectedTest(test);
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
//                                     setSelectedTest(test);
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
//               This action cannot be undone. This will permanently delete the test{' '}
//               <span className="font-medium">{selectedTest?.name}</span> from {selectedTest?.labName}.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-600 hover:bg-red-700"
//               onClick={() => selectedTest?.id && handleDelete(selectedTest.id)}
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {showAddModal && (
//         <LabTestModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadData();
//           }}
//         />
//       )}

//       {showEditModal && selectedTest && (
//         <LabTestModal
//           test={selectedTest}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedTest(null);
//           }}
//           onSuccess={() => {
//             setShowEditModal(false);
//             setSelectedTest(null);
//             loadData();
//           }}
//         />
//       )}

//       {showHistoryModal && selectedTestForHistory && (
//         <PriceHistoryModal
//           labTestId={selectedTestForHistory.id!}
//           labTestName={selectedTestForHistory.name}
//           onClose={() => {
//             setShowHistoryModal(false);
//             setSelectedTestForHistory(null);
//           }}
//         />
//       )}
//     </DashboardLayout>
//   );
// }

// // Wrap the component with the withAuth HOC
// export default withAuth(LabTestsPage);

// src/app/dashboard/lab-tests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { labTestService } from '@/services/labTestService';
import { labService } from '@/services/labService';
import { LabTest } from '@/types/labTest';
import { Lab } from '@/types/lab';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Loader2, Search, Filter, Edit, Trash2, CheckCircle2, XCircle, Building2, FlaskConical, History } from 'lucide-react';
import LabTestModal from './LabTestModal';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import Link from 'next/link';
import PriceHistoryModal from './PriceHistoryModal';

function LabTestsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState('all');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTestForHistory, setSelectedTestForHistory] = useState<LabTest | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both tests and labs in parallel
      const [testsData, labsData] = await Promise.all([
        labTestService.getAll(),
        labService.getAll()
      ]);
      
      setTests(Array.isArray(testsData) ? testsData : []);
      setFilteredTests(Array.isArray(testsData) ? testsData : []);
      setLabs(Array.isArray(labsData) ? labsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError("Failed to load lab tests. Please try again.");
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply search and lab filters
    let filtered = [...tests];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(test => 
        (test.name?.toLowerCase().includes(query) || false) || 
        (test.description?.toLowerCase().includes(query) || false)
      );
    }
    
    if (labFilter !== 'all') {
      filtered = filtered.filter(test => test.labId === labFilter);
    }
    
    setFilteredTests(filtered);
  }, [searchQuery, labFilter, tests]);

  const handleDelete = async (id: string) => {
    try {
      await labTestService.delete(id);
      setShowDeleteDialog(false);
      toast.success("Lab test deleted successfully");
      await loadData();
    } catch (error) {
      console.error('Error deleting lab test:', error);
      toast.error("Failed to delete lab test. Please try again.");
    }
  };

  const formatPrice = (test: LabTest) => {
    return `Rs ${test.price.toFixed(2)}`;
  };

  // Stats calculations
  const totalTests = tests.length;
  const activeTests = tests.filter(test => test.isActive !== false).length;
  const inactiveTests = totalTests - activeTests;
  const averagePrice = tests.length > 0 ? (tests.reduce((sum, test) => sum + test.price, 0) / tests.length) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Lab Tests Management</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">Manage lab tests and their pricing</p>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Access
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/labs">
                <Button 
                  variant="outline" 
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Labs
                </Button>
              </Link>
              
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Tests</p>
                  <p className="text-3xl font-bold text-emerald-600">{totalTests}</p>
                </div>
                <div className="rounded-full bg-emerald-100 p-3">
                  <FlaskConical className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Tests</p>
                  <p className="text-3xl font-bold text-blue-600">{activeTests}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Inactive Tests</p>
                  <p className="text-3xl font-bold text-orange-600">{inactiveTests}</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <XCircle className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Price</p>
                  <p className="text-3xl font-bold text-purple-600">Rs {averagePrice.toFixed(0)}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                  Lab Tests Database
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage all your lab tests and pricing</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Search and Filter Controls */}
            <div className="p-6 border-b bg-white">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search by test name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div>
                  <Select
                    value={labFilter}
                    onValueChange={(value) => setLabFilter(value)}
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by lab" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Labs</SelectLabel>
                        <SelectItem value="all">All Labs</SelectItem>
                        {labs.map((lab) => (
                          <SelectItem key={lab.id} value={lab.id!}>
                            {lab.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading lab tests...</p>
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
                <div className="overflow-auto max-h-[calc(100vh-25rem)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[250px]">Test Name</TableHead>
                        <TableHead className="w-[200px]">Lab</TableHead>
                        <TableHead className="w-[120px]">Price</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-gray-100 p-4 mb-3">
                                <FlaskConical className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery || labFilter !== 'all' ? 'No lab tests match your filters' : 'No lab tests found'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery || labFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first lab test to get started'}
                              </p>
                              {!searchQuery && labFilter === 'all' && (
                                <Button 
                                  onClick={() => setShowAddModal(true)}
                                  className="mt-4"
                                  variant="outline"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Lab Test
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTests.map((test) => (
                          <TableRow 
                            key={test.id}
                            className="group hover:bg-blue-50/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                  {test.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{test.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-gray-500" />
                                <span className="truncate">{test.labName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatPrice(test)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600 truncate">
                                {test.description || <span className="text-gray-400 italic">No description</span>}
                              </span>
                            </TableCell>
                            <TableCell>
                              {test.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTestForHistory(test);
                                    setShowHistoryModal(true);
                                  }}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                                  title="View Price History"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setShowEditModal(true);
                                  }}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTest(test);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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

      {/* Modals */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test{' '}
              <span className="font-medium">{selectedTest?.name}</span> from {selectedTest?.labName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedTest?.id && handleDelete(selectedTest.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddModal && (
        <LabTestModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}

      {showEditModal && selectedTest && (
        <LabTestModal
          test={selectedTest}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTest(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTest(null);
            loadData();
          }}
        />
      )}

      {showHistoryModal && selectedTestForHistory && (
        <PriceHistoryModal
          labTestId={selectedTestForHistory.id!}
          labTestName={selectedTestForHistory.name}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedTestForHistory(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(LabTestsPage);