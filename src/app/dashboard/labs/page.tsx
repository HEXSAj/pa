// // src/app/dashboard/labs/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { labService } from '@/services/labService';
// import { Lab } from '@/types/lab';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Plus, Loader2, Search, Phone, Mail, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
// import LabModal from './LabModal';
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
// import withAuth from '@/components/withAuth'; // Import the withAuth HOC
// import { useAuth } from '@/context/AuthContext'; // Import useAuth
// import { toast } from "sonner";

// function LabsPage() {
//   const { userRole } = useAuth(); // Access user role from auth context
//   const isAdmin = userRole === 'admin'; // Check if user is admin

//   const [labs, setLabs] = useState<Lab[]>([]);
//   const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   const loadLabs = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const data = await labService.getAll();
//       setLabs(Array.isArray(data) ? data : []);
//       setFilteredLabs(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error('Error loading labs:', error);
//       setError("Failed to load labs. Please try again.");
//       setLabs([]);
//       setFilteredLabs([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadLabs();
//   }, []);

//   useEffect(() => {
//     // Apply search filter
//     if (searchQuery.trim() === '') {
//       setFilteredLabs(labs);
//     } else {
//       const query = searchQuery.toLowerCase().trim();
//       const filtered = labs.filter(lab => 
//         (lab.name?.toLowerCase().includes(query) || false) || 
//         (lab.contactNo?.toLowerCase().includes(query) || false) || 
//         (lab.email?.toLowerCase().includes(query) || false) ||
//         (lab.address?.toLowerCase().includes(query) || false)
//       );
//       setFilteredLabs(filtered);
//     }
//   }, [searchQuery, labs]);

//   const handleDelete = async (id: string) => {
//     try {
//       await labService.delete(id);
//       setShowDeleteDialog(false);
//       toast.success("Lab deleted successfully");
//       await loadLabs();
//     } catch (error) {
//       console.error('Error deleting lab:', error);
//       toast.error("Failed to delete lab. Please try again.");
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4 p-6 h-full">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Labs</h1>
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
//               Add Lab
//             </Button>
//           </div>
//         </div>

//         <Card>
//           <CardHeader className="pb-3">
//             <CardTitle>Lab List</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Search Box */}
//             <div className="relative flex-1 mb-4">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//               <Input
//                 type="text"
//                 placeholder="Search by name, contact, email..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-9"
//               />
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
//                     onClick={loadLabs}
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
//                         <TableHead>Contact</TableHead>
//                         <TableHead>Email</TableHead>
//                         <TableHead>Address</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredLabs.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="h-24 text-center">
//                             No labs found.
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredLabs.map((lab) => (
//                           <TableRow key={lab.id}>
//                             <TableCell className="font-medium">{lab.name}</TableCell>
//                             <TableCell>
//                               <div className="flex items-center gap-1">
//                                 <Phone className="h-3 w-3 text-gray-500" />
//                                 {lab.contactNo}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               {lab.email ? (
//                                 <div className="flex items-center gap-1">
//                                   <Mail className="h-3 w-3 text-gray-500" />
//                                   {lab.email}
//                                 </div>
//                               ) : (
//                                 <span className="text-gray-400">-</span>
//                               )}
//                             </TableCell>
//                             <TableCell>
//                               {lab.address || <span className="text-gray-400">-</span>}
//                             </TableCell>
//                             <TableCell>
//                               {lab.isActive ? (
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
//                                   setSelectedLab(lab);
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
//                                     setSelectedLab(lab);
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
//               This action cannot be undone. This will permanently delete{' '}
//               <span className="font-medium">{selectedLab?.name}</span> from the labs list.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-600 hover:bg-red-700"
//               onClick={() => selectedLab?.id && handleDelete(selectedLab.id)}
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {showAddModal && (
//         <LabModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadLabs();
//           }}
//         />
//       )}

//       {showEditModal && selectedLab && (
//         <LabModal
//           lab={selectedLab}
//           onClose={() => {
//             setShowEditModal(false);
//             setSelectedLab(null);
//           }}
//           onSuccess={() => {
//             setShowEditModal(false);
//             setSelectedLab(null);
//             loadLabs();
//           }}
//         />
//       )}
//     </DashboardLayout>
//   );
// }

// // Wrap the component with the withAuth HOC
// export default withAuth(LabsPage);


// src/app/dashboard/labs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { labService } from '@/services/labService';
import { Lab } from '@/types/lab';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Loader2, Search, Phone, Mail, Edit, Trash2, CheckCircle2, XCircle, FlaskConical, ArrowRight } from 'lucide-react';
import LabModal from './LabModal';
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
import withAuth from '@/components/withAuth'; // Import the withAuth HOC
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { toast } from "sonner";
import Link from 'next/link';

function LabsPage() {
  const { userRole } = useAuth(); // Access user role from auth context
  const isAdmin = userRole === 'admin'; // Check if user is admin

  const [labs, setLabs] = useState<Lab[]>([]);
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLabs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await labService.getAll();
      setLabs(Array.isArray(data) ? data : []);
      setFilteredLabs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading labs:', error);
      setError("Failed to load labs. Please try again.");
      setLabs([]);
      setFilteredLabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim() === '') {
      setFilteredLabs(labs);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = labs.filter(lab => 
        (lab.name?.toLowerCase().includes(query) || false) || 
        (lab.contactNo?.toLowerCase().includes(query) || false) || 
        (lab.email?.toLowerCase().includes(query) || false) ||
        (lab.address?.toLowerCase().includes(query) || false)
      );
      setFilteredLabs(filtered);
    }
  }, [searchQuery, labs]);

  const handleDelete = async (id: string) => {
    try {
      await labService.delete(id);
      setShowDeleteDialog(false);
      toast.success("Lab deleted successfully");
      await loadLabs();
    } catch (error) {
      console.error('Error deleting lab:', error);
      toast.error("Failed to delete lab. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Laboratory Management</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">Manage laboratories and their services</p>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/lab-tests">
                <Button 
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Manage Lab Tests
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lab
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Labs</p>
                  <p className="text-3xl font-bold text-emerald-600">{labs.length}</p>
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
                  <p className="text-sm text-gray-500 font-medium">Active Labs</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {labs.filter(lab => lab.isActive !== false).length}
                  </p>
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
                  <p className="text-sm text-gray-500 font-medium">Inactive Labs</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {labs.filter(lab => lab.isActive === false).length}
                  </p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <XCircle className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Labs Table Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Laboratory Database</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Manage all laboratories in one place</p>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search labs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 py-2 border-gray-200 focus:ring-blue-500 w-full"
                  />
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
                    <p className="mt-2 text-sm text-gray-500">Loading labs...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-red-500 font-medium">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={loadLabs}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[150px]">Contact</TableHead>
                        <TableHead className="w-[200px]">Email</TableHead>
                        <TableHead className="w-[200px]">Address</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLabs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-gray-100 p-4 mb-3">
                                <FlaskConical className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery ? 'No labs match your search criteria' : 'No labs found'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try adjusting your search terms' : 'Add your first lab to get started'}
                              </p>
                              {!searchQuery && (
                                <Button 
                                  onClick={() => setShowAddModal(true)}
                                  className="mt-4"
                                  variant="outline"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Lab
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLabs.map((lab) => (
                          <TableRow 
                            key={lab.id}
                            className="group hover:bg-blue-50/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                                  {lab.name?.charAt(0).toUpperCase()}
                                </div>
                                {lab.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="truncate">{lab.contactNo}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {lab.email ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="truncate">{lab.email}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="truncate">
                                {lab.address || <span className="text-gray-400">-</span>}
                              </span>
                            </TableCell>
                            <TableCell>
                              {lab.isActive ? (
                                <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center gap-1 w-fit">
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedLab(lab);
                                    setShowEditModal(true);
                                  }}
                                  className="h-8 w-8 text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedLab(lab);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="h-8 w-8 text-red-600"
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
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-medium">{selectedLab?.name}</span> from the labs list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedLab?.id && handleDelete(selectedLab.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddModal && (
        <LabModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadLabs();
          }}
        />
      )}

      {showEditModal && selectedLab && (
        <LabModal
          lab={selectedLab}
          onClose={() => {
            setShowEditModal(false);
            setSelectedLab(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedLab(null);
            loadLabs();
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Wrap the component with the withAuth HOC
export default withAuth(LabsPage);