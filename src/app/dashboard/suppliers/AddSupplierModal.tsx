// src/app/dashboard/suppliers/AddSupplierModal.tsx
'use client';
import { useState } from 'react';
import { supplierService } from '@/services/supplierService';
import { 
  Building2,
  Phone, 
  Mail, 
  User, 
  MapPin, 
  FileText, 
  AlertCircle, 
  Check,
  X,
  Briefcase,
  Loader2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive'])
});

type FormValues = z.infer<typeof formSchema>;

interface AddSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddSupplierModal({ open, onOpenChange, onSuccess }: AddSupplierModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      contactPerson: '',
      notes: '',
      status: 'active'
    }
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setDuplicateError(null);
      
      // First check if a supplier with the same name already exists
      const suppliers = await supplierService.getAll();
      const isDuplicate = suppliers.some(
        supplier => supplier.name.toLowerCase() === values.name.toLowerCase()
      );
      
      if (isDuplicate) {
        setDuplicateError(`A supplier with the name "${values.name}" already exists.`);
        setIsSubmitting(false);
        return;
      }
      
      // If no duplicate, proceed with creating the new supplier
      await supplierService.create(values);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Error adding supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear duplicate error when modal is closed or form is reset
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDuplicateError(null);
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl border-0 shadow-xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
          <DialogHeader className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Add New Supplier
            </DialogTitle>
            <p className="text-indigo-100 font-normal">
              Fill in the details to add a new supplier to your directory
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 200px)" }}>
          {duplicateError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{duplicateError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                          Supplier Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter supplier name" 
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Clear duplicate error when name field is changed
                              if (duplicateError) setDuplicateError(null);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active" className="text-emerald-600 font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive" className="text-slate-600">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                Inactive
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-slate-500">
                          Determines if this supplier is available for selection in orders
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  Contact Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-indigo-500" />
                          Phone Number
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number" 
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-indigo-500" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter email address" 
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <User className="h-3.5 w-3.5 text-indigo-500" />
                          Contact Person
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter primary contact name" 
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter supplier address" 
                            className="resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                            rows={1}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-indigo-500" />
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter additional notes or terms" 
                          className="resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-white">
          <div className="flex gap-2 justify-end w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md"
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Add Supplier
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}