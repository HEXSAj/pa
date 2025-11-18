import React from 'react';
import { X } from 'lucide-react';
import { Employee } from '@/types/employee';

interface EmployeeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employeeId: string) => void;
  employees: Employee[];
  serviceName: string;
}

const EmployeeSelectModal = ({ isOpen, onClose, onSelect, employees, serviceName }: EmployeeSelectModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select Employee for {serviceName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-2">
          {employees.map(employee => (
            <button
              key={employee.id}
              onClick={() => {
                onSelect(employee.id!);
                onClose();
              }}
              className="w-full p-4 text-left rounded-lg hover:bg-indigo-50 transition-colors flex justify-between items-center group"
            >
              <span className="font-medium">{employee.name}</span>
              <span className="text-sm text-gray-500 group-hover:text-indigo-600">
                {employee.commission}% commission
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelectModal;