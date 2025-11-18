// // src/app/dashboard/inventory/AddInventoryModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { inventoryService } from '@/services/inventoryService';
// import { medicineTypeService } from '@/services/medicineTypeService';
// import { categoryService } from '@/services/categoryService';
// import { MedicineTypeModel, getMedicineTypeUnit, Category } from '@/types/inventory';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Plus, Loader2, TagIcon, RefreshCw, Info } from 'lucide-react';
// import { toast } from "sonner";
// import Link from 'next/link';

// interface AddInventoryModalProps {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function AddInventoryModal({ onClose, onSuccess }: AddInventoryModalProps) {
//   const [medicineTypes, setMedicineTypes] = useState<MedicineTypeModel[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loadingTypes, setLoadingTypes] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [isGeneratingCode, setIsGeneratingCode] = useState(false);

//   const [isSaving, setIsSaving] = useState(false);
  
//   const [formData, setFormData] = useState({
//     code: '',
//     name: '',
//     genericName: '',
//     type: '',
//     categoryId: '',
//     categoryName: '',
//     hasUnitContains: false,
//     unitContains: {
//       value: 0,
//       unit: ''
//     },
//     minQuantity: 0
//   });

//   const [totalQuantity, setTotalQuantity] = useState('0');

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoadingTypes(true);
//         setLoadingCategories(true);
        
//         // Load both medicine types and categories in parallel
//         const [types, categoryData] = await Promise.all([
//           medicineTypeService.getAll(),
//           categoryService.getAll()
//         ]);
        
//         setMedicineTypes(types);
//         setCategories(categoryData);
        
//         // Set default type if types are available
//         if (types.length > 0) {
//           setFormData(prev => ({
//             ...prev,
//             type: types[0].name,
//             unitContains: {
//               ...prev.unitContains,
//               unit: types[0].defaultUnit
//             }
//           }));
//         }
        
//         // Set default category if available
//         if (categoryData.length > 0) {
//           setFormData(prev => ({
//             ...prev,
//             categoryId: categoryData[0].id!,
//             categoryName: categoryData[0].name
//           }));
//         }
        
//         // Generate initial item code
//         await generateItemCode();
        
//       } catch (error) {
//         console.error("Error loading data:", error);
//         toast.error("Failed to load form data");
//       } finally {
//         setLoadingTypes(false);
//         setLoadingCategories(false);
//       }
//     };
    
//     loadData();
//   }, []);

//   useEffect(() => {
//     if (formData.hasUnitContains) {
//       const total = formData.minQuantity * formData.unitContains.value;
//       setTotalQuantity(`${total} ${formData.unitContains.unit}`);
//     } else {
//       setTotalQuantity(`${formData.minQuantity} units`);
//     }
//   }, [formData.minQuantity, formData.unitContains.value, formData.unitContains.unit, formData.hasUnitContains]);

//   useEffect(() => {
//     if (formData.type) {
//       const unit = getMedicineTypeUnit(formData.type, medicineTypes);
//       setFormData(prev => ({
//         ...prev,
//         unitContains: {
//           ...prev.unitContains,
//           unit: unit
//         }
//       }));
//     }
//   }, [formData.type, medicineTypes]);

//   // Function to generate a unique item code
//   const generateItemCode = async () => {
//     try {
//       setIsGeneratingCode(true);
//       // We'll let the service generate the code automatically
//       setFormData(prev => ({
//         ...prev,
//         code: '' // Clear it so service generates a new one
//       }));
//       toast.success("Item code will be auto-generated on save");
//     } catch (error) {
//       console.error("Error generating item code:", error);
//       toast.error("Failed to generate item code");
//     } finally {
//       setIsGeneratingCode(false);
//     }
//   };

//   // Function to handle category change
//   const handleCategoryChange = (categoryId: string) => {
//     const category = categories.find(c => c.id === categoryId);
//     setFormData(prev => ({
//       ...prev,
//       categoryId: categoryId,
//       categoryName: category?.name || ''
//     }));
//   };

//   // Sync generic name with trade name (if generic name is empty)
//   const handleTradeNameChange = (value: string) => {
//     setFormData(prev => {
//       // Only auto-update generic name if it's empty or matches previous trade name
//       if (!prev.genericName || prev.genericName === prev.name) {
//         return {
//           ...prev,
//           name: value,
//           genericName: value
//         };
//       }
//       return {
//         ...prev,
//         name: value
//       };
//     });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     setIsSaving(true);
    
//     try {
//       // Make sure generic name is not empty
//       if (!formData.genericName) {
//         setFormData(prev => ({
//           ...prev,
//           genericName: formData.name // Default to trade name
//         }));
//       }
      
//       const submitData = {
//         ...formData,
//         unitContains: formData.hasUnitContains ? formData.unitContains : undefined
//       };
      
//       // Let the service handle code generation if empty
//       await inventoryService.create(submitData);
//       toast.success("Item added successfully");
//       onSuccess();
//     } catch (error: any) {
//       console.error("Error adding item:", error);
//       toast.error(error.message || "Failed to add item");
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Add New Item</DialogTitle>
//         </DialogHeader>
        
//         <form onSubmit={handleSubmit}>
//           <Card>
//             <CardContent className="space-y-4 pt-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <Label htmlFor="code">Item Code</Label>
//                     <Button 
//                       type="button" 
//                       variant="ghost" 
//                       size="sm" 
//                       onClick={generateItemCode}
//                       disabled={isGeneratingCode}
//                       className="h-8 px-2 gap-1 text-xs"
//                     >
//                       {isGeneratingCode ? (
//                         <Loader2 className="h-3 w-3 animate-spin" />
//                       ) : (
//                         <RefreshCw className="h-3 w-3" />
//                       )}
//                       Auto-generate
//                     </Button>
//                   </div>
//                   <Input
//                     id="code"
//                     placeholder="Enter code or leave empty for auto-generation"
//                     value={formData.code}
//                     onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
//                   />
//                   <p className="text-xs text-muted-foreground mt-1">
//                     If left empty, a unique code will be auto-generated on save
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="name">Trade Name *</Label>
//                   <Input
//                     id="name"
//                     required
//                     value={formData.name}
//                     onChange={(e) => handleTradeNameChange(e.target.value)}
//                     placeholder="Enter brand/trade name"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="genericName">Generic Name *</Label>
//                   <Input
//                     id="genericName"
//                     required
//                     value={formData.genericName}
//                     onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
//                     placeholder="Enter generic medicine name"
//                   />
//                   <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
//                     <Info className="h-3 w-3" />
//                     Generic name auto-fills based on trade name until manually changed
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <Label htmlFor="type">Type *</Label>
//                     <Link href="/dashboard/inventory/types">
//                       <Button 
//                         type="button" 
//                         variant="ghost" 
//                         size="sm" 
//                         className="h-8 px-2 gap-1 text-xs"
//                       >
//                         <Plus className="h-3 w-3" />
//                         Manage Types
//                       </Button>
//                     </Link>
//                   </div>
                  
//                   {loadingTypes ? (
//                     <div className="flex items-center space-x-2 p-2">
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Loading types...</span>
//                     </div>
//                   ) : (
//                     <>
//                       {medicineTypes.length === 0 ? (
//                         <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
//                           No medicine types found. Please <Link href="/dashboard/inventory/types" className="underline font-medium">create a type</Link> first.
//                         </div>
//                       ) : (
//                         <Select
//                           value={formData.type}
//                           onValueChange={(value: string) => 
//                             setFormData(prev => ({ ...prev, type: value }))
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select type" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {medicineTypes.map((type) => (
//                               <SelectItem key={type.id} value={type.name}>
//                                 {type.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       )}
//                     </>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <Label htmlFor="category">Category *</Label>
//                     <Link href="/dashboard/inventory/categories">
//                       <Button 
//                         type="button" 
//                         variant="ghost" 
//                         size="sm" 
//                         className="h-8 px-2 gap-1 text-xs"
//                       >
//                         <Plus className="h-3 w-3" />
//                         Manage Categories
//                       </Button>
//                     </Link>
//                   </div>
                  
//                   {loadingCategories ? (
//                     <div className="flex items-center space-x-2 p-2">
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Loading categories...</span>
//                     </div>
//                   ) : (
//                     <>
//                       {categories.length === 0 ? (
//                         <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
//                           No categories found. Please <Link href="/dashboard/inventory/categories" className="underline font-medium">create a category</Link> first.
//                         </div>
//                       ) : (
//                         <Select
//                           value={formData.categoryId}
//                           onValueChange={handleCategoryChange}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select category" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {categories.map((category) => (
//                               <SelectItem 
//                                 key={category.id} 
//                                 value={category.id!}
//                                 className="flex items-center"
//                               >
//                                 <div className="flex items-center gap-2">
//                                   <div 
//                                     className="w-3 h-3 rounded-full" 
//                                     style={{ backgroundColor: category.color || '#6b7280' }} 
//                                   />
//                                   {category.name}
//                                 </div>
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       )}
//                     </>
//                   )}
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="hasUnitContains"
//                     checked={formData.hasUnitContains}
//                     onCheckedChange={(checked) => 
//                       setFormData(prev => ({ 
//                         ...prev, 
//                         hasUnitContains: checked as boolean 
//                       }))
//                     }
//                   />
//                   <Label htmlFor="hasUnitContains">Specify contents per unit</Label>
//                 </div>

//                 {formData.hasUnitContains && (
//                   <div className="space-y-2">
//                     <Label htmlFor="unitContains">
//                       Contains per Unit * ({formData.unitContains.unit})
//                     </Label>
//                     <Input
//                       id="unitContains"
//                       type="number"
//                       required
//                       min="0"
//                       step="0.01"
//                       value={formData.unitContains.value}
//                       onChange={(e) => setFormData(prev => ({
//                         ...prev,
//                         unitContains: {
//                           ...prev.unitContains,
//                           value: parseFloat(e.target.value)
//                         }
//                       }))}
//                     />
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="minQuantity">Minimum Stock Level (Units/Bottles) *</Label>
//                   <Input
//                     id="minQuantity"
//                     type="number"
//                     required
//                     min="0"
//                     value={formData.minQuantity}
//                     onChange={(e) => setFormData(prev => ({ 
//                       ...prev, 
//                       minQuantity: parseInt(e.target.value) 
//                     }))}
//                   />
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Total minimum quantity: {totalQuantity}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="flex justify-end gap-3 mt-6">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onClose}
//             >
//               Cancel
//             </Button>
//             {/* <Button
//               type="submit"
//               disabled={medicineTypes.length === 0 || categories.length === 0}
//             >
//               Add Item
//             </Button> */}

//               <Button
//                 type="submit"
//                 disabled={medicineTypes.length === 0 || categories.length === 0 || isSaving}
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   "Add Item"
//                 )}
//               </Button>

//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


// src/app/dashboard/inventory/AddInventoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { medicineTypeService } from '@/services/medicineTypeService';
import { categoryService } from '@/services/categoryService';
import { counterService } from '@/services/counterService';
import { MedicineTypeModel, getMedicineTypeUnit, Category } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, TagIcon, RefreshCw, Info } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';

interface AddInventoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInventoryModal({ onClose, onSuccess }: AddInventoryModalProps) {
  const [medicineTypes, setMedicineTypes] = useState<MedicineTypeModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    type: '',
    categoryId: '',
    categoryName: '',
    hasUnitContains: false,
    unitContains: {
      value: 0,
      unit: ''
    },
    minQuantity: 0,
    brand: '',
    supplier: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: ''
  });

  const [totalQuantity, setTotalQuantity] = useState('0');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingTypes(true);
        setLoadingCategories(true);
        
        // Load both medicine types and categories in parallel
        const [types, categoryData] = await Promise.all([
          medicineTypeService.getAll(),
          categoryService.getAll()
        ]);
        
        setMedicineTypes(types);
        setCategories(categoryData);
        
        // Generate initial item code
        await generateItemCode();
        
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoadingTypes(false);
        setLoadingCategories(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (formData.hasUnitContains) {
      const total = formData.minQuantity * formData.unitContains.value;
      setTotalQuantity(`${total} ${formData.unitContains.unit}`);
    } else {
      setTotalQuantity(`${formData.minQuantity} units`);
    }
  }, [formData.minQuantity, formData.unitContains.value, formData.unitContains.unit, formData.hasUnitContains]);

  useEffect(() => {
    if (formData.type) {
      const unit = getMedicineTypeUnit(formData.type, medicineTypes);
      setFormData(prev => ({
        ...prev,
        unitContains: {
          ...prev.unitContains,
          unit
        }
      }));
    }
  }, [formData.type, medicineTypes]);

  const generateItemCode = async () => {
    try {
      setIsGeneratingCode(true);
      const generatedCode = await counterService.generateCode('inventory', '', 4);
      setFormData(prev => ({ ...prev, code: generatedCode }));
      toast.success("Item code generated successfully");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate item code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please fill in the medicine name");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || formData.name.trim(),
        type: formData.type || undefined,
        categoryId: formData.categoryId || undefined,
        categoryName: formData.categoryName || undefined,
        unitContains: formData.hasUnitContains ? formData.unitContains : undefined,
        brand: formData.brand.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        currentStock: formData.currentStock ? parseFloat(formData.currentStock) : undefined
      };
      
      // Let the service handle code generation if empty
      await inventoryService.create(submitData);
      toast.success("Item added successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error(error.message || "Failed to add item");
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="code">Item Code</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={generateItemCode}
                        disabled={isGeneratingCode}
                        className="h-8 px-2 gap-1 text-xs"
                      >
                        {isGeneratingCode ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="AUTO-GENERATED"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter medicine name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genericName">Generic Name</Label>
                    <Input
                      id="genericName"
                      value={formData.genericName}
                      onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
                      placeholder="Enter generic name (defaults to medicine name)"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="type">Medicine Type</Label>
                      {medicineTypes.length === 0 && (
                        <Link 
                          href="/dashboard/inventory/types" 
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3 w-3" />
                          Add Type
                        </Link>
                      )}
                    </div>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      disabled={loadingTypes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTypes ? "Loading types..." : "Select medicine type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {medicineTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name} ({type.defaultUnit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {medicineTypes.length === 0 && !loadingTypes && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                        <Info className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-700">
                          No medicine types found. Please add types in Settings.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category</Label>
                      {categories.length === 0 && (
                        <Link 
                          href="/dashboard/inventory/categories" 
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <TagIcon className="h-3 w-3" />
                          Add Category
                        </Link>
                      )}
                    </div>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(c => c.id === value);
                        setFormData(prev => ({ 
                          ...prev, 
                          categoryId: value,
                          categoryName: selectedCategory?.name || ''
                        }));
                      }}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categories.length === 0 && !loadingCategories && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                        <Info className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-700">
                          No categories found. Please add categories in Settings.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasUnitContains"
                      checked={formData.hasUnitContains}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        hasUnitContains: !!checked 
                      }))}
                    />
                    <Label htmlFor="hasUnitContains">Specify contents per unit</Label>
                  </div>

                  {formData.hasUnitContains && (
                    <div className="space-y-2">
                      <Label htmlFor="unitContains">
                        Contains per Unit * ({formData.unitContains.unit})
                      </Label>
                      <Input
                        id="unitContains"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unitContains.value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          unitContains: {
                            ...prev.unitContains,
                            value: parseFloat(e.target.value)
                          }
                        }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Minimum Stock Level (Units/Bottles) *</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      required
                      min="0"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        minQuantity: parseInt(e.target.value) 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Total minimum quantity: {totalQuantity}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Enter brand name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Selling Price</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Current Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                      placeholder="Enter current stock quantity (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t bg-background sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Item"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}