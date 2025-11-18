# Enhanced Appointments System

This enhanced appointments system provides a modern timeline view with drag-and-drop functionality, similar to Google Calendar.

## Features

### ✅ Completed Features

1. **Duration Support**
   - Added `duration` field to appointment types
   - Automatic duration calculation from start/end times
   - Predefined duration options (15min, 30min, 45min, 1h, 1.5h, 2h, 3h)

2. **Enhanced Appointment Modal**
   - Duration selection with predefined options
   - Auto-calculation of end time based on start time and duration
   - Improved form validation
   - Better user experience with visual feedback

3. **Timeline View**
   - Google Calendar-like timeline interface
   - Visual representation of appointment durations
   - Color-coded status indicators
   - Time grid with 30-minute intervals

4. **Drag and Drop Functionality**
   - Drag appointments to reschedule
   - Real-time conflict detection
   - Visual feedback during dragging
   - Automatic time slot calculation

5. **Enhanced Appointments Page**
   - Toggle between timeline and list views
   - Date navigation with statistics
   - Real-time appointment management
   - Responsive design

## Files Created/Modified

### New Files
- `EnhancedAppointmentModal.tsx` - Enhanced appointment creation/editing modal
- `AppointmentTimeline.tsx` - Timeline view with drag-and-drop
- `EnhancedAppointmentsPage.tsx` - Main appointments page with both views
- `README_Enhanced_Appointments.md` - This documentation

### Modified Files
- `src/types/appointment.ts` - Added duration field and helper functions
- `src/services/appointmentService.ts` - Updated to handle duration field

## How to Use

### 1. Replace Existing Appointments Page

To use the enhanced appointments system, replace your existing appointments page with the new enhanced version:

```tsx
// In your main appointments route file
import EnhancedAppointmentsPage from './EnhancedAppointmentsPage';

export default function AppointmentsPage() {
  return <EnhancedAppointmentsPage />;
}
```

### 2. Creating Appointments

1. Click "New Appointment" button
2. Fill in patient information
3. Select doctor and date
4. Choose start time and duration
5. End time is automatically calculated
6. Select procedures and add notes
7. Save appointment

### 3. Timeline View

- **View Mode**: Toggle between "Timeline View" and "List View"
- **Navigation**: Use Previous/Next buttons or "Go to Today"
- **Drag & Drop**: Click and drag appointments to reschedule
- **Edit**: Click edit button on any appointment
- **Delete**: Click delete button to remove appointments

### 4. Drag and Drop

1. Click and hold on any appointment card
2. Drag to desired time slot
3. Release to reschedule
4. System automatically checks for conflicts
5. Updates are saved automatically

## Technical Details

### Duration Calculation

```typescript
// Helper functions available
calculateEndTime(startTime: string, duration: number): string
calculateDuration(startTime: string, endTime: string): number
formatDuration(duration: number): string
```

### Timeline Grid

- 30-minute time slots from 8:00 AM to 6:00 PM
- 60px height per 30-minute slot
- Visual appointment blocks with proportional heights

### Conflict Detection

The system automatically detects conflicts when:
- Dragging appointments to occupied time slots
- Creating new appointments
- Editing existing appointments

## Customization

### Duration Options

Modify the `DURATION_OPTIONS` array in `EnhancedAppointmentModal.tsx`:

```typescript
const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  // Add more options as needed
];
```

### Time Grid

Adjust the `TIME_SLOTS` array in `AppointmentTimeline.tsx`:

```typescript
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', // Add/remove time slots
  // ...
];
```

### Colors and Styling

Modify the `getStatusColor` function to change appointment colors:

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
    // Customize colors here
  }
};
```

## Benefits

1. **Better User Experience**: Intuitive drag-and-drop interface
2. **Visual Clarity**: Timeline view shows appointment durations clearly
3. **Efficient Scheduling**: Quick rescheduling with conflict detection
4. **Flexible Duration**: Support for various appointment lengths
5. **Responsive Design**: Works on desktop and mobile devices
6. **Real-time Updates**: Immediate feedback and validation

## Future Enhancements

Potential improvements for future versions:

1. **Multi-doctor Timeline**: Show multiple doctors in parallel columns
2. **Recurring Appointments**: Support for repeating appointments
3. **Appointment Templates**: Save common appointment configurations
4. **Advanced Filtering**: Filter by doctor, status, or patient type
5. **Calendar Integration**: Export to external calendar systems
6. **Notifications**: Reminder system for upcoming appointments

## Support

For any issues or questions about the enhanced appointments system, please refer to the code comments or contact the development team.
