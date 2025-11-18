import { ShieldAlert } from 'lucide-react';

export default function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <ShieldAlert className="w-16 h-16 text-pink-600" />
      <h2 className="text-2xl font-semibold text-gray-900">Access Restricted</h2>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  );
}