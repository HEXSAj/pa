// src/app/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/components/withAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search, X, Loader2, Edit, Trash2, MoreHorizontal, User, Mail, ShieldCheck, Lock } from 'lucide-react';
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
  CardDescription
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
// import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';
import DeleteStaffDialog from './DeleteStaffDialog';
import ResetPasswordModal from './ResetPasswordModal';
import { staffService } from '@/services/staffService';
import { StaffUser } from '@/types/staff';

import AddStaffWithDoctorModal from './AddStaffWithDoctorModal';

function StaffManagementPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getAllStaff();
      setStaffUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error loading staff users:', err);
      setError('Failed to load staff users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStaffUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(staffUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = staffUsers.filter(user => 
        user.displayName?.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, staffUsers]);

  const handleDelete = async (id: string) => {
    try {
      await staffService.deleteStaff(id);
      await loadStaffUsers();
    } catch (error) {
      console.error('Error deleting staff user:', error);
      setError('Failed to delete staff user. Please try again.');
    }
  };

  const openDeleteDialog = (user: StaffUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openResetPasswordModal = (user: StaffUser) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // If not admin, redirect or show unauthorized
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">
              Only administrators have access to the user management area.
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-red-600 hover:bg-red-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Staff Management</h1>
              <p className="text-indigo-100 mt-1">Create and manage staff accounts</p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff User
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Main Staff Users Table */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Staff Users</CardTitle>
                <CardDescription>Manage employee accounts and access</CardDescription>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 py-2 border-gray-200 focus:ring-indigo-500 w-full"
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
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading staff users...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[250px]">User</TableHead>
                        <TableHead className="w-[250px]">Email</TableHead>
                        <TableHead className="w-[120px]">Role</TableHead>
                        <TableHead className="w-[150px]">Created</TableHead>
                        <TableHead className="text-right w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-gray-100 p-4 mb-3">
                                <User className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery ? 'No staff users match your search' : 'No staff users found'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try adjusting your search terms' : 'Add your first staff user to get started'}
                              </p>
                              {!searchQuery && (
                                <Button 
                                  onClick={() => setShowAddModal(true)}
                                  className="mt-4"
                                  variant="outline"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Staff User
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow 
                            key={user.uid}
                            className="group hover:bg-indigo-50/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                  {user.displayName 
                                    ? user.displayName.charAt(0).toUpperCase() 
                                    : user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{user.displayName || 'No Name'}</p>
                                  <p className="text-xs text-gray-500">ID: {user.uid.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {user.email}
                              </div>
                            </TableCell>
                            {/* <TableCell>
                              <Badge className={`
                                ${user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'}
                              `}>
                                {user.role || 'staff'}
                              </Badge>
                            </TableCell> */}
                            <TableCell>
                              <Badge className={`
                                ${user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : user.role === 'doctor'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'}
                              `}>
                                {user.role || 'staff'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-500">
                                {user.createdAt && typeof user.createdAt.toDate === 'function' 
                                  ? user.createdAt.toDate().toLocaleDateString()
                                  : user.createdAt 
                                    ? new Date(user.createdAt).toLocaleDateString() 
                                    : 'Unknown'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-indigo-600"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowEditModal(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openResetPasswordModal(user)}
                                    >
                                      <Lock className="h-4 w-4 mr-2" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(user)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
      {/* {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStaffUsers();
          }}
        />
      )} */}

      {showAddModal && (
        <AddStaffWithDoctorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStaffUsers();
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditStaffModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            loadStaffUsers();
          }}
        />
      )}

      {showDeleteDialog && selectedUser && (
        <DeleteStaffDialog
          isOpen={showDeleteDialog}
          user={selectedUser}
          onDelete={handleDelete}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Wrap with withAuth HOC to enforce access control
export default withAuth(StaffManagementPage);