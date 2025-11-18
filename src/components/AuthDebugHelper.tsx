'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AuthDebugHelper() {
  const { user, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fixAdminRole = async () => {
    if (!user) {
      setMessage('No user is logged in');
      return;
    }

    setIsProcessing(true);
    setMessage('Updating user role...');

    try {
      // Update the role in the Realtime Database
      await set(ref(database, `staff/${user.uid}/role`), 'admin');
      setMessage('Role updated to admin successfully. Please refresh the page.');
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage(`Error updating role: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Hidden button that only shows in development */}
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="outline" 
          size="sm"
          className="fixed bottom-4 right-4 bg-black text-white opacity-70 hover:opacity-100 z-50"
          onClick={() => setIsOpen(true)}
        >
          Auth Debug
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auth Debug Helper</DialogTitle>
            <DialogDescription>
              Fix user permissions and role issues
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-100 p-4 rounded-md">
              <p><strong>User ID:</strong> {user?.uid || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Current Role:</strong> {userRole || 'None'}</p>
            </div>
            
            {message && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-md">
                {message}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={fixAdminRole}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Fix Admin Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}