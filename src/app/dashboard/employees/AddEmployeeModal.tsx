// src/app/dashboard/employees/AddEmployeeModal.tsx
'use client';

import { useState } from 'react';
import { employeeService } from '@/services/employeeService';
import { X } from 'lucide-react';

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    role: '',
    commission: 0
});
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await employeeService.create(formData);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Employee</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile *</label>
            <input
              type="tel"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            />
          </div>

          

          <div>
            <label className="block text-sm font-medium text-gray-700">Role *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Commission % *</label>
            <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.commission}
                onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) }))}
            />
        </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}