import { useState } from 'react';
import { Plus, X } from 'lucide-react';
// import AddAppointmentModal from '@/app/dashboard/appointments/AddAppointmentModal';
// import AddBridalModal from '@/app/dashboard/bridals/AddBridalModal';
// import CombinedRentalBookingForm from '@/components/RentalBookingForm';

export default function QuickActions({ onSuccess }: { onSuccess: () => void }) {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showBridalModal, setShowBridalModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);

  return (
    <>
      <div className="bg-white shadow-sm mb-4 rounded-lg p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Quick Appointment
          </button>
          <button
            onClick={() => setShowBridalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Quick Bridal
          </button>
          <button
            onClick={() => setShowRentalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Quick Rental
          </button>
        </div>
      </div>

      {showAppointmentModal && (
        <AddAppointmentModal
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            setShowAppointmentModal(false);
            onSuccess();
          }}
        />
      )}

      {showBridalModal && (
        <AddBridalModal
          onClose={() => setShowBridalModal(false)}
          onSuccess={() => {
            setShowBridalModal(false);
            onSuccess();
          }}
        />
      )}

      {showRentalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-hidden">
          <div className="bg-white rounded-lg w-full max-w-4xl my-4 h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Quick Rental</h2>
              <button
                onClick={() => setShowRentalModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CombinedRentalBookingForm
                onSuccess={() => {
                  setShowRentalModal(false);
                  onSuccess();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}