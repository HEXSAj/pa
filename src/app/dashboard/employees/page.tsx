// src/app/dashboard/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';

import { useAuth } from '@/context/AuthContext';
import NoAccess from '@/components/NoAccess';

export default function EmployeesPage() {

  const { hasPermission } = useAuth();
  
    if (!hasPermission('canManageUsers')) {
              return <NoAccess />;
            }



  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);


  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

 

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await employeeService.delete(id);
      await loadEmployees();
    }
  };

  

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employees</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Mobile</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Commission %</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.mobile}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.role}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.commission}%</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => employee.id && handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadEmployees();
          }}
        />
      )}

      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
            loadEmployees();
          }}
        />
      )}
    </DashboardLayout>
  );
}