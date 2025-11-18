// // //src/app/dashboard/page.tsx

// // // 'use client';
// // // import React, { useState, useEffect } from 'react';
// // // import { useAuth } from '@/context/AuthContext';
// // // import { useRouter } from 'next/navigation';
// // // import DashboardLayout from '@/components/DashboardLayout';
// // // import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
// // // import { saleService } from '@/services/saleService';
// // // import { purchaseService } from '@/services/purchaseService';
// // // import { inventoryService } from '@/services/inventoryService';
// // // import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
// // // import { Loader2, TrendingUp, ShoppingCart, Receipt, DollarSign, Calendar, AlertCircle, ArrowUpRight, BarChart3 } from 'lucide-react';
// // // import DashboardExtension from '@/components/DashboardExtension';

// // // import { Sale } from '@/types/sale';
// // // import { Purchase } from '@/types/purchase';
// // // import { InventoryItem } from '@/types/inventory';

// // // export default function Dashboard() {
// // //   const { user, loading: authLoading } = useAuth();
// // //   const router = useRouter();
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState<string | null>(null);
  
// // //   // Dashboard data states
// // //   const [todaySales, setTodaySales] = useState(0);
// // //   const [monthSales, setMonthSales] = useState(0);
// // //   const [monthProfit, setMonthProfit] = useState(0);
// // //   const [purchaseCost, setPurchaseCost] = useState(0);
// // //   const [chartData, setChartData] = useState<any[]>([]);
// // //   const [pharmacyItems, setPharmacyItems] = useState<InventoryItem[]>([]);
// // //   const [allSales, setAllSales] = useState<Sale[]>([]);
// // //   const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
// // //   const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
// // //   const [salesGrowth, setSalesGrowth] = useState(0);

// // //   useEffect(() => {
// // //     if (!authLoading && !user) {
// // //       router.push('/login');
// // //     } else if (user) {
// // //       loadDashboardData();
// // //     }
// // //   }, [user, authLoading, router]);

// // //   const loadDashboardData = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError(null);

// // //       const [salesData, purchasesData, inventoryData] = await Promise.all([
// // //         saleService.getAll(),
// // //         purchaseService.getAll(),
// // //         inventoryService.getAll()
// // //       ]);
      
// // //       setAllSales(salesData);
// // //       setAllPurchases(purchasesData);
// // //       setPharmacyItems(inventoryData);

// // //       // Calculate today's sales
// // //       const today = new Date();
// // //       const todaySalesData = salesData.filter(sale => {
// // //         const saleDate = new Date(sale.saleDate);
// // //         return saleDate.getDate() === today.getDate() &&
// // //                saleDate.getMonth() === today.getMonth() &&
// // //                saleDate.getFullYear() === today.getFullYear();
// // //       });
// // //       const todayTotal = todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
// // //       setTodaySales(todayTotal);

// // //       // Calculate month's data
// // //       const monthStart = startOfMonth(today);
// // //       const monthEnd = endOfMonth(today);
      
// // //       const monthSalesData = salesData.filter(sale => {
// // //         const saleDate = new Date(sale.saleDate);
// // //         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
// // //       });

// // //       const monthSalesTotal = monthSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
// // //       const monthCostTotal = monthSalesData.reduce((sum, sale) => sum + sale.totalCost, 0);
      
// // //       setMonthSales(monthSalesTotal);
// // //       setMonthProfit(monthSalesTotal - monthCostTotal);
// // //       setPurchaseCost(purchasesData.reduce((sum, purchase) => sum + purchase.totalAmount, 0));

// // //       // Set low stock items
// // //       const lowStock = inventoryData.filter(item => {
// // //         return item.minQuantity > 0; // Placeholder - implement actual stock calculation
// // //       }).slice(0, 5); // Take top 5 items
// // //       setLowStockItems(lowStock);

// // //       // Calculate sales growth (this is a placeholder - implement actual calculation)
// // //       const previousMonthSales = monthSalesTotal * 0.9; // Mock data - replace with actual previous month data
// // //       const growth = ((monthSalesTotal - previousMonthSales) / previousMonthSales) * 100;
// // //       setSalesGrowth(growth);

// // //       // Prepare chart data
// // //       const chartDataArray = await generateChartData(salesData);
// // //       setChartData(chartDataArray);

// // //     } catch (err) {
// // //       console.error('Error loading dashboard data:', err);
// // //       setError('Failed to load dashboard data');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const generateChartData = async (sales: Sale[]) => {
// // //     const months = [];
// // //     const today = new Date();
    
// // //     for (let i = 11; i >= 0; i--) {
// // //       const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
// // //       const monthStart = startOfMonth(date);
// // //       const monthEnd = endOfMonth(date);
      
// // //       const monthlySales = sales.filter(sale => {
// // //         const saleDate = new Date(sale.saleDate);
// // //         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
// // //       });
      
// // //       const totalSales = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
// // //       const totalCost = monthlySales.reduce((sum, sale) => sum + sale.totalCost, 0);
// // //       const profit = totalSales - totalCost;
      
// // //       months.push({
// // //         month: format(date, 'MMM yy'),
// // //         sales: totalSales,
// // //         profit: profit,
// // //         purchases: totalCost
// // //       });
// // //     }
    
// // //     return months;
// // //   };

// // //   if (authLoading || loading) {
// // //     return (
// // //       <DashboardLayout>
// // //         <div className="flex items-center justify-center h-full">
// // //           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
// // //         </div>
// // //       </DashboardLayout>
// // //     );
// // //   }

// // //   if (error) {
// // //     return (
// // //       <DashboardLayout>
// // //         <div className="flex items-center justify-center h-full">
// // //           <div className="text-center">
// // //             <p className="text-red-600 mb-4">{error}</p>
// // //             <button 
// // //               onClick={loadDashboardData}
// // //               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
// // //             >
// // //               Retry Loading
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </DashboardLayout>
// // //     );
// // //   }

// // //   return (
// // //     <DashboardLayout>
// // //       <div className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gradient-to-b from-indigo-50 to-blue-50">
// // //         <div className="px-6 py-6 space-y-6">
// // //           {/* Header */}
// // //           <div className="flex justify-between items-center mb-8">
// // //             <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
// // //             <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
// // //               <Calendar className="h-5 w-5 text-indigo-500" />
// // //               <span className="text-sm font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
// // //             </div>
// // //           </div>

// // //           {/* Stats Grid */}
// // //           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// // //             <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <p className="text-sm text-blue-100">Today's Sales</p>
// // //                   <p className="text-3xl font-bold">Rs{todaySales.toFixed(2)}</p>
// // //                 </div>
// // //                 <div className="rounded-full bg-white/20 p-3">
// // //                   <ShoppingCart className="h-6 w-6 text-white" />
// // //                 </div>
// // //               </div>
// // //               <div className="mt-4 flex items-center text-sm">
// // //                 <ArrowUpRight className="h-4 w-4 mr-1" />
// // //                 <span>+{(Math.random() * 10).toFixed(1)}% from yesterday</span>
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 shadow-lg text-white">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <p className="text-sm text-purple-100">Monthly Sales</p>
// // //                   <p className="text-3xl font-bold">Rs{monthSales.toFixed(2)}</p>
// // //                 </div>
// // //                 <div className="rounded-full bg-white/20 p-3">
// // //                   <Receipt className="h-6 w-6 text-white" />
// // //                 </div>
// // //               </div>
// // //               <div className="mt-4 flex items-center text-sm">
// // //                 <ArrowUpRight className="h-4 w-4 mr-1" />
// // //                 <span>+{salesGrowth.toFixed(1)}% this month</span>
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-6 shadow-lg text-white">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <p className="text-sm text-emerald-100">Monthly Profit</p>
// // //                   <p className="text-3xl font-bold">Rs{monthProfit.toFixed(2)}</p>
// // //                 </div>
// // //                 <div className="rounded-full bg-white/20 p-3">
// // //                   <TrendingUp className="h-6 w-6 text-white" />
// // //                 </div>
// // //               </div>
// // //               <div className="mt-4 flex items-center text-sm">
// // //                 <ArrowUpRight className="h-4 w-4 mr-1" />
// // //                 <span>{monthSales > 0 ? ((monthProfit / monthSales) * 100).toFixed(1) : 0}% margin</span>
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-lg text-white">
// // //               <div className="flex items-center justify-between">
// // //                 <div>
// // //                   <p className="text-sm text-orange-100">Purchase Cost</p>
// // //                   <p className="text-3xl font-bold">Rs{purchaseCost.toFixed(2)}</p>
// // //                 </div>
// // //                 <div className="rounded-full bg-white/20 p-3">
// // //                   <DollarSign className="h-6 w-6 text-white" />
// // //                 </div>
// // //               </div>
// // //               <div className="mt-4 flex items-center text-sm">
// // //                 <span>Total inventory investment</span>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Charts */}
// // //           <div className="grid gap-6 md:grid-cols-3">
// // //             <div className="rounded-xl bg-white p-6 shadow-lg md:col-span-2">
// // //               <h2 className="text-lg font-semibold mb-4 text-gray-800">Financial Overview</h2>
// // //               <div className="h-80">
// // //                 <ResponsiveContainer width="100%" height="100%">
// // //                   <AreaChart data={chartData}>
// // //                     <defs>
// // //                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
// // //                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
// // //                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
// // //                       </linearGradient>
// // //                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
// // //                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
// // //                         <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
// // //                       </linearGradient>
// // //                     </defs>
// // //                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// // //                     <XAxis dataKey="month" stroke="#6b7280" />
// // //                     <YAxis stroke="#6b7280" />
// // //                     <Tooltip 
// // //                       contentStyle={{
// // //                         backgroundColor: 'rgba(255, 255, 255, 0.8)',
// // //                         borderRadius: '0.5rem',
// // //                         border: 'none',
// // //                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// // //                       }}
// // //                     />
// // //                     <Legend />
// // //                     <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" name="Sales" />
// // //                     <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
// // //                   </AreaChart>
// // //                 </ResponsiveContainer>
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-white p-6 shadow-lg">
// // //               <h2 className="text-lg font-semibold mb-4 text-gray-800">Purchase Analysis</h2>
// // //               <div className="h-80">
// // //                 <ResponsiveContainer width="100%" height="100%">
// // //                   <BarChart data={chartData.slice(-6)}>
// // //                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// // //                     <XAxis dataKey="month" stroke="#6b7280" />
// // //                     <YAxis stroke="#6b7280" />
// // //                     <Tooltip 
// // //                       contentStyle={{
// // //                         backgroundColor: 'rgba(255, 255, 255, 0.8)',
// // //                         borderRadius: '0.5rem',
// // //                         border: 'none',
// // //                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// // //                       }}
// // //                     />
// // //                     <Legend />
// // //                     <Bar dataKey="purchases" fill="#f59e0b" name="Purchases" radius={[4, 4, 0, 0]} />
// // //                     <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
// // //                   </BarChart>
// // //                 </ResponsiveContainer>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Additional Information */}
// // //           <div className="grid gap-6 md:grid-cols-3">
// // //             <div className="rounded-xl bg-white p-6 shadow-lg">
// // //               <div className="flex items-center justify-between mb-4">
// // //                 <h2 className="text-lg font-semibold text-gray-800">Profit Metrics</h2>
// // //                 <BarChart3 className="h-5 w-5 text-indigo-600" />
// // //               </div>
// // //               <div className="space-y-4">
// // //                 <div className="space-y-2">
// // //                   <div className="flex justify-between items-center">
// // //                     <span className="text-sm text-gray-500">Gross Margin</span>
// // //                     <span className="text-sm font-medium">{monthSales > 0 ? ((monthProfit / monthSales) * 100).toFixed(2) : 0}%</span>
// // //                   </div>
// // //                   <div className="w-full bg-gray-200 rounded-full h-2">
// // //                     <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${monthSales > 0 ? ((monthProfit / monthSales) * 100) : 0}%` }}></div>
// // //                   </div>
// // //                 </div>
                
// // //                 <div className="space-y-2">
// // //                   <div className="flex justify-between items-center">
// // //                     <span className="text-sm text-gray-500">Net Profit</span>
// // //                     <span className="text-sm font-medium">{monthSales > 0 ? ((monthProfit * 0.75 / monthSales) * 100).toFixed(2) : 0}%</span>
// // //                   </div>
// // //                   <div className="w-full bg-gray-200 rounded-full h-2">
// // //                     <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${monthSales > 0 ? ((monthProfit * 0.75 / monthSales) * 100) : 0}%` }}></div>
// // //                   </div>
// // //                 </div>
                
// // //                 <div className="space-y-2">
// // //                   <div className="flex justify-between items-center">
// // //                     <span className="text-sm text-gray-500">Return on Investment</span>
// // //                     <span className="text-sm font-medium">{purchaseCost > 0 ? ((monthProfit / purchaseCost) * 100).toFixed(2) : 0}%</span>
// // //                   </div>
// // //                   <div className="w-full bg-gray-200 rounded-full h-2">
// // //                     <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(purchaseCost > 0 ? ((monthProfit / purchaseCost) * 100) : 0, 100)}%` }}></div>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
            
// // //             <div className="rounded-xl bg-white p-6 shadow-lg">
// // //               <div className="flex items-center justify-between mb-4">
// // //                 <h2 className="text-lg font-semibold text-gray-800">Payment Methods</h2>
// // //                 <DollarSign className="h-5 w-5 text-indigo-600" />
// // //               </div>
// // //               <div className="h-64">
// // //                 <ResponsiveContainer width="100%" height="100%">
// // //                   <BarChart
// // //                     data={[
// // //                       { name: 'Cash', value: 65 },
// // //                       { name: 'Card', value: 25 },
// // //                       { name: 'Bank', value: 10 },
// // //                     ]}
// // //                     layout="vertical"
// // //                   >
// // //                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// // //                     <XAxis type="number" stroke="#6b7280" />
// // //                     <YAxis type="category" dataKey="name" stroke="#6b7280" />
// // //                     <Tooltip 
// // //                       contentStyle={{
// // //                         backgroundColor: 'rgba(255, 255, 255, 0.8)',
// // //                         borderRadius: '0.5rem',
// // //                         border: 'none',
// // //                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// // //                       }}
// // //                       formatter={(value) => [`${value}%`, 'Percentage']}
// // //                     />
// // //                     <Bar dataKey="value" radius={[0, 4, 4, 0]}>
// // //                       {[
// // //                         { name: 'Cash', value: 65, fill: '#6366f1' },
// // //                         { name: 'Card', value: 25, fill: '#8b5cf6' },
// // //                         { name: 'Bank', value: 10, fill: '#ec4899' },
// // //                       ].map((entry, index) => (
// // //                         <cell key={`cell-${index}`} fill={entry.fill} />
// // //                       ))}
// // //                     </Bar>
// // //                   </BarChart>
// // //                 </ResponsiveContainer>
// // //               </div>
// // //             </div>
            
// // //             <div className="rounded-xl bg-white p-6 shadow-lg">
// // //               <div className="flex items-center justify-between mb-4">
// // //                 <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
// // //                 <AlertCircle className="h-5 w-5 text-red-500" />
// // //               </div>
// // //               <div className="space-y-4 max-h-64 overflow-y-auto">
// // //                 {lowStockItems.length > 0 ? (
// // //                   lowStockItems.map((item, index) => (
// // //                     <div key={item.id || index} className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
// // //                       <div className="ml-3">
// // //                         <p className="text-sm font-medium text-gray-800">{item.name}</p>
// // //                         <p className="text-xs text-gray-500">{item.type} - Min Qty: {item.minQuantity}</p>
// // //                       </div>
// // //                     </div>
// // //                   ))
// // //                 ) : (
// // //                   <p className="text-center text-gray-500">No low stock items</p>
// // //                 )}
// // //               </div>
// // //             </div>
// // //           </div>

// // //           <DashboardExtension 
// // //             allSales={allSales} 
// // //             allPurchases={allPurchases}
// // //             pharmacyItems={pharmacyItems}
// // //           />
// // //         </div>
// // //       </div>
// // //     </DashboardLayout>
// // //   );
// // // }
// // 'use client';
// // import React, { useState, useEffect } from 'react';
// // import { useAuth } from '@/context/AuthContext';
// // import { useRouter } from 'next/navigation';
// // import DashboardLayout from '@/components/DashboardLayout';
// // import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
// // // import { saleService } from '@/services/saleService';
// // import { purchaseService } from '@/services/purchaseService';
// // import { inventoryService } from '@/services/inventoryService';
// // import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
// // import { Loader2, TrendingUp, ShoppingCart, Receipt, DollarSign, Calendar, AlertCircle, ArrowUpRight, BarChart3, ShieldCheck, Info } from 'lucide-react';
// // import DashboardExtension from '@/components/DashboardExtension';

// // // import { Sale } from '@/types/sale';
// // import { Purchase } from '@/types/purchase';
// // import { InventoryItem } from '@/types/inventory';
// // import { Badge } from '@/components/ui/badge';

// // // Import the withAuth HOC
// // import withAuth from '@/components/withAuth';

// // function Dashboard() {
// //   const { user, userRole, loading: authLoading } = useAuth();
// //   const isAdmin = userRole === 'admin'; // Check if user is admin
  
// //   const router = useRouter();
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
  
// //   // Dashboard data states
// //   const [todaySales, setTodaySales] = useState(0);
// //   const [monthSales, setMonthSales] = useState(0);
// //   const [monthProfit, setMonthProfit] = useState(0);
// //   const [purchaseCost, setPurchaseCost] = useState(0);
// //   const [chartData, setChartData] = useState<any[]>([]);
// //   const [pharmacyItems, setPharmacyItems] = useState<InventoryItem[]>([]);
// //   const [allSales, setAllSales] = useState<Sale[]>([]);
// //   const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
// //   const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
// //   const [salesGrowth, setSalesGrowth] = useState(0);

// //   useEffect(() => {
// //     if (!authLoading && !user) {
// //       router.push('/');
// //     } else if (user) {
// //       loadDashboardData();
// //     }
// //   }, [user, authLoading, router]);

// //   const loadDashboardData = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);

// //       const [salesData, purchasesData, inventoryData] = await Promise.all([
// //         // saleService.getAll(),
// //         purchaseService.getAll(),
// //         inventoryService.getAll()
// //       ]);
      
// //       setAllSales(salesData);
// //       setAllPurchases(purchasesData);
// //       setPharmacyItems(inventoryData);

// //       // Calculate today's sales
// //       const today = new Date();
// //       const todaySalesData = salesData.filter(sale => {
// //         const saleDate = new Date(sale.saleDate);
// //         return saleDate.getDate() === today.getDate() &&
// //                saleDate.getMonth() === today.getMonth() &&
// //                saleDate.getFullYear() === today.getFullYear();
// //       });
// //       const todayTotal = todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
// //       setTodaySales(todayTotal);

// //       // Calculate month's data
// //       const monthStart = startOfMonth(today);
// //       const monthEnd = endOfMonth(today);
      
// //       const monthSalesData = salesData.filter(sale => {
// //         const saleDate = new Date(sale.saleDate);
// //         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
// //       });

// //       const monthSalesTotal = monthSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
// //       const monthCostTotal = monthSalesData.reduce((sum, sale) => sum + sale.totalCost, 0);
      
// //       setMonthSales(monthSalesTotal);
// //       setMonthProfit(monthSalesTotal - monthCostTotal);
// //       setPurchaseCost(purchasesData.reduce((sum, purchase) => sum + purchase.totalAmount, 0));

// //       // Set low stock items
// //       const lowStock = inventoryData.filter(item => {
// //         return item.minQuantity > 0; // Placeholder - implement actual stock calculation
// //       }).slice(0, 5); // Take top 5 items
// //       setLowStockItems(lowStock);

// //       // Calculate sales growth (this is a placeholder - implement actual calculation)
// //       const previousMonthSales = monthSalesTotal * 0.9; // Mock data - replace with actual previous month data
// //       const growth = ((monthSalesTotal - previousMonthSales) / previousMonthSales) * 100;
// //       setSalesGrowth(growth);

// //       // Prepare chart data
// //       const chartDataArray = await generateChartData(salesData);
// //       setChartData(chartDataArray);

// //     } catch (err) {
// //       console.error('Error loading dashboard data:', err);
// //       setError('Failed to load dashboard data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const generateChartData = async (sales: Sale[]) => {
// //     const months = [];
// //     const today = new Date();
    
// //     for (let i = 11; i >= 0; i--) {
// //       const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
// //       const monthStart = startOfMonth(date);
// //       const monthEnd = endOfMonth(date);
      
// //       const monthlySales = sales.filter(sale => {
// //         const saleDate = new Date(sale.saleDate);
// //         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
// //       });
      
// //       const totalSales = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
// //       const totalCost = monthlySales.reduce((sum, sale) => sum + sale.totalCost, 0);
// //       const profit = totalSales - totalCost;
      
// //       months.push({
// //         month: format(date, 'MMM yy'),
// //         sales: totalSales,
// //         profit: profit,
// //         purchases: totalCost
// //       });
// //     }
    
// //     return months;
// //   };

// //   if (authLoading || loading) {
// //     return (
// //       <DashboardLayout>
// //         <div className="flex items-center justify-center h-full">
// //           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <DashboardLayout>
// //         <div className="flex items-center justify-center h-full">
// //           <div className="text-center">
// //             <p className="text-red-600 mb-4">{error}</p>
// //             <button 
// //               onClick={loadDashboardData}
// //               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
// //             >
// //               Retry Loading
// //             </button>
// //           </div>
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   return (
// //     <DashboardLayout>
// //       <div className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gradient-to-b from-indigo-50 to-blue-50">
// //         <div className="px-6 py-6 space-y-6">
// //           {/* Header */}
// //           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
// //             <div>
// //               <div className="flex items-center gap-3">
// //                 <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
// //                 {/* User role badge */}
// //                 <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 capitalize">
// //                   {userRole || 'User'} Mode
// //                 </Badge>
// //               </div>
              
// //               {!isAdmin && (
// //                 <div className="flex items-center text-amber-600 text-sm mt-1 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
// //                   <Info className="h-4 w-4 mr-1" />
// //                   <span>Some financial details are limited in staff view</span>
// //                 </div>
// //               )}
// //             </div>
// //             <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
// //               <Calendar className="h-5 w-5 text-indigo-500" />
// //               <span className="text-sm font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
// //             </div>
// //           </div>

// //           {/* Stats Grid */}
// //           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// //             <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <p className="text-sm text-blue-100">Today's Sales</p>
// //                   <p className="text-3xl font-bold">Rs{todaySales.toFixed(2)}</p>
// //                 </div>
// //                 <div className="rounded-full bg-white/20 p-3">
// //                   <ShoppingCart className="h-6 w-6 text-white" />
// //                 </div>
// //               </div>
// //               <div className="mt-4 flex items-center text-sm">
// //                 <ArrowUpRight className="h-4 w-4 mr-1" />
// //                 <span>+{(Math.random() * 10).toFixed(1)}% from yesterday</span>
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 shadow-lg text-white">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <p className="text-sm text-purple-100">Monthly Sales</p>
// //                   <p className="text-3xl font-bold">Rs{monthSales.toFixed(2)}</p>
// //                 </div>
// //                 <div className="rounded-full bg-white/20 p-3">
// //                   <Receipt className="h-6 w-6 text-white" />
// //                 </div>
// //               </div>
// //               <div className="mt-4 flex items-center text-sm">
// //                 <ArrowUpRight className="h-4 w-4 mr-1" />
// //                 <span>+{salesGrowth.toFixed(1)}% this month</span>
// //               </div>
// //             </div>

// //             {/* Monthly Profit - Only show details to admin */}
// //             <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-6 shadow-lg text-white">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <p className="text-sm text-emerald-100">Monthly Profit</p>
// //                   {isAdmin ? (
// //                     <p className="text-3xl font-bold">Rs{monthProfit.toFixed(2)}</p>
// //                   ) : (
// //                     <div className="flex items-center gap-1 text-lg font-medium mt-1">
// //                       <ShieldCheck className="h-4 w-4" />
// //                       <span>Admin Access</span>
// //                     </div>
// //                   )}
// //                 </div>
// //                 <div className="rounded-full bg-white/20 p-3">
// //                   <TrendingUp className="h-6 w-6 text-white" />
// //                 </div>
// //               </div>
// //               <div className="mt-4 flex items-center text-sm">
// //                 {isAdmin ? (
// //                   <>
// //                     <ArrowUpRight className="h-4 w-4 mr-1" />
// //                     <span>{monthSales > 0 ? ((monthProfit / monthSales) * 100).toFixed(1) : 0}% margin</span>
// //                   </>
// //                 ) : (
// //                   <span>Profit details restricted</span>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-lg text-white">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <p className="text-sm text-orange-100">Purchase Cost</p>
// //                   {isAdmin ? (
// //                     <p className="text-3xl font-bold">Rs{purchaseCost.toFixed(2)}</p>
// //                   ) : (
// //                     <div className="flex items-center gap-1 text-lg font-medium mt-1">
// //                       <ShieldCheck className="h-4 w-4" />
// //                       <span>Admin Access</span>
// //                     </div>
// //                   )}
// //                 </div>
// //                 <div className="rounded-full bg-white/20 p-3">
// //                   <DollarSign className="h-6 w-6 text-white" />
// //                 </div>
// //               </div>
// //               <div className="mt-4 flex items-center text-sm">
// //                 {isAdmin ? (
// //                   <span>Total inventory investment</span>
// //                 ) : (
// //                   <span>Cost details restricted</span>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Charts - Modified to show different detail levels based on role */}
// //           <div className="grid gap-6 md:grid-cols-3">
// //             <div className="rounded-xl bg-white p-6 shadow-lg md:col-span-2">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-semibold text-gray-800">Financial Overview</h2>
// //                 {!isAdmin && (
// //                   <Badge className="bg-blue-50 text-blue-600 border-blue-100">
// //                     Sales Data Only
// //                   </Badge>
// //                 )}
// //               </div>
// //               <div className="h-80">
// //                 <ResponsiveContainer width="100%" height="100%">
// //                   <AreaChart data={chartData}>
// //                     <defs>
// //                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
// //                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
// //                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
// //                       </linearGradient>
// //                       {isAdmin && (
// //                         <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
// //                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
// //                           <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
// //                         </linearGradient>
// //                       )}
// //                     </defs>
// //                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// //                     <XAxis dataKey="month" stroke="#6b7280" />
// //                     <YAxis stroke="#6b7280" />
// //                     <Tooltip 
// //                       contentStyle={{
// //                         backgroundColor: 'rgba(255, 255, 255, 0.8)',
// //                         borderRadius: '0.5rem',
// //                         border: 'none',
// //                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// //                       }}
// //                     />
// //                     <Legend />
// //                     <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" name="Sales" />
// //                     {isAdmin && (
// //                       <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
// //                     )}
// //                   </AreaChart>
// //                 </ResponsiveContainer>
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-white p-6 shadow-lg">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-semibold text-gray-800">Purchase Analysis</h2>
// //                 {!isAdmin && (
// //                   <Badge className="bg-blue-50 text-blue-600 border-blue-100">
// //                     Limited View
// //                   </Badge>
// //                 )}
// //               </div>
// //               <div className="h-80">
// //                 {isAdmin ? (
// //                   <ResponsiveContainer width="100%" height="100%">
// //                     <BarChart data={chartData.slice(-6)}>
// //                       <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// //                       <XAxis dataKey="month" stroke="#6b7280" />
// //                       <YAxis stroke="#6b7280" />
// //                       <Tooltip 
// //                         contentStyle={{
// //                           backgroundColor: 'rgba(255, 255, 255, 0.8)',
// //                           borderRadius: '0.5rem',
// //                           border: 'none',
// //                           boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// //                         }}
// //                       />
// //                       <Legend />
// //                       <Bar dataKey="purchases" fill="#f59e0b" name="Purchases" radius={[4, 4, 0, 0]} />
// //                       <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
// //                     </BarChart>
// //                   </ResponsiveContainer>
// //                 ) : (
// //                   <div className="flex flex-col items-center justify-center h-full">
// //                     <ShieldCheck className="h-12 w-12 text-gray-300 mb-4" />
// //                     <p className="text-gray-500 font-medium">Purchase analysis data</p>
// //                     <p className="text-gray-400 text-sm">Available in admin mode</p>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Additional Information - Some sections modified for role-based access */}
// //           <div className="grid gap-6 md:grid-cols-3">
// //             {/* Profit Metrics - Only for admin */}
// //             {isAdmin ? (
// //               <div className="rounded-xl bg-white p-6 shadow-lg">
// //                 <div className="flex items-center justify-between mb-4">
// //                   <h2 className="text-lg font-semibold text-gray-800">Profit Metrics</h2>
// //                   <BarChart3 className="h-5 w-5 text-indigo-600" />
// //                 </div>
// //                 <div className="space-y-4">
// //                   <div className="space-y-2">
// //                     <div className="flex justify-between items-center">
// //                       <span className="text-sm text-gray-500">Gross Margin</span>
// //                       <span className="text-sm font-medium">{monthSales > 0 ? ((monthProfit / monthSales) * 100).toFixed(2) : 0}%</span>
// //                     </div>
// //                     <div className="w-full bg-gray-200 rounded-full h-2">
// //                       <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${monthSales > 0 ? ((monthProfit / monthSales) * 100) : 0}%` }}></div>
// //                     </div>
// //                   </div>
                  
// //                   <div className="space-y-2">
// //                     <div className="flex justify-between items-center">
// //                       <span className="text-sm text-gray-500">Net Profit</span>
// //                       <span className="text-sm font-medium">{monthSales > 0 ? ((monthProfit * 0.75 / monthSales) * 100).toFixed(2) : 0}%</span>
// //                     </div>
// //                     <div className="w-full bg-gray-200 rounded-full h-2">
// //                       <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${monthSales > 0 ? ((monthProfit * 0.75 / monthSales) * 100) : 0}%` }}></div>
// //                     </div>
// //                   </div>
                  
// //                   <div className="space-y-2">
// //                     <div className="flex justify-between items-center">
// //                       <span className="text-sm text-gray-500">Return on Investment</span>
// //                       <span className="text-sm font-medium">{purchaseCost > 0 ? ((monthProfit / purchaseCost) * 100).toFixed(2) : 0}%</span>
// //                     </div>
// //                     <div className="w-full bg-gray-200 rounded-full h-2">
// //                       <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(purchaseCost > 0 ? ((monthProfit / purchaseCost) * 100) : 0, 100)}%` }}></div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             ) : (
// //               <div className="rounded-xl bg-white p-6 shadow-lg">
// //                 <div className="flex items-center justify-between mb-4">
// //                   <h2 className="text-lg font-semibold text-gray-800">Profit Metrics</h2>
// //                   <ShieldCheck className="h-5 w-5 text-blue-500" />
// //                 </div>
// //                 <div className="flex flex-col items-center justify-center h-48 text-center">
// //                   <div className="bg-blue-50 p-3 rounded-full mb-3">
// //                     <ShieldCheck className="h-8 w-8 text-blue-500" />
// //                   </div>
// //                   <p className="text-gray-600 font-medium">Profit metrics are available in admin mode</p>
// //                   <p className="text-gray-400 text-sm mt-1">These metrics include margin and ROI details</p>
// //                 </div>
// //               </div>
// //             )}
            
// //             <div className="rounded-xl bg-white p-6 shadow-lg">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-semibold text-gray-800">Payment Methods</h2>
// //                 <DollarSign className="h-5 w-5 text-indigo-600" />
// //               </div>
// //               <div className="h-64">
// //                 <ResponsiveContainer width="100%" height="100%">
// //                   <BarChart
// //                     data={[
// //                       { name: 'Cash', value: 65 },
// //                       { name: 'Card', value: 25 },
// //                       { name: 'Bank', value: 10 },
// //                     ]}
// //                     layout="vertical"
// //                   >
// //                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
// //                     <XAxis type="number" stroke="#6b7280" />
// //                     <YAxis type="category" dataKey="name" stroke="#6b7280" />
// //                     <Tooltip 
// //                       contentStyle={{
// //                         backgroundColor: 'rgba(255, 255, 255, 0.8)',
// //                         borderRadius: '0.5rem',
// //                         border: 'none',
// //                         boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
// //                       }}
// //                       formatter={(value) => [`${value}%`, 'Percentage']}
// //                     />
// //                     <Bar dataKey="value" radius={[0, 4, 4, 0]}>
// //                       {[
// //                         { name: 'Cash', value: 65, fill: '#6366f1' },
// //                         { name: 'Card', value: 25, fill: '#8b5cf6' },
// //                         { name: 'Bank', value: 10, fill: '#ec4899' },
// //                       ].map((entry, index) => (
// //                         <cell key={`cell-${index}`} fill={entry.fill} />
// //                       ))}
// //                     </Bar>
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               </div>
// //             </div>
            
// //             <div className="rounded-xl bg-white p-6 shadow-lg">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
// //                 <AlertCircle className="h-5 w-5 text-red-500" />
// //               </div>
// //               <div className="space-y-4 max-h-64 overflow-y-auto">
// //                 {lowStockItems.length > 0 ? (
// //                   lowStockItems.map((item, index) => (
// //                     <div key={item.id || index} className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
// //                       <div className="ml-3">
// //                         <p className="text-sm font-medium text-gray-800">{item.name}</p>
// //                         <p className="text-xs text-gray-500">{item.type} - Min Qty: {item.minQuantity}</p>
// //                       </div>
// //                     </div>
// //                   ))
// //                 ) : (
// //                   <p className="text-center text-gray-500">No low stock items</p>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           <DashboardExtension 
// //             allSales={allSales} 
// //             allPurchases={allPurchases}
// //             pharmacyItems={pharmacyItems}
// //             isAdmin={isAdmin} // Pass isAdmin flag to the extension component
// //           />
// //         </div>
// //       </div>
// //     </DashboardLayout>
// //   );
// // }

// // // Export with withAuth HOC applied
// // export default withAuth(Dashboard);


// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/DashboardLayout';
// import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
// import { saleService } from '@/services/saleService';
// import { purchaseService } from '@/services/purchaseService';
// import { inventoryService } from '@/services/inventoryService';
// import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
// import { Loader2, TrendingUp, ShoppingCart, Receipt, DollarSign, Calendar, AlertCircle, ArrowUpRight, BarChart3, ShieldCheck, Info } from 'lucide-react';
// import DashboardExtension from '@/components/DashboardExtension';

// import { Sale } from '@/types/sale';
// import { Purchase } from '@/types/purchase';
// import { InventoryItem } from '@/types/inventory';
// import { Badge } from '@/components/ui/badge';

// // Import the withAuth HOC
// import withAuth from '@/components/withAuth';

// function Dashboard() {
//   const { user, userRole, loading: authLoading } = useAuth();
//   const isAdmin = userRole === 'admin'; // Check if user is admin
  
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // Dashboard data states
//   const [todaySales, setTodaySales] = useState(0);
//   const [monthSales, setMonthSales] = useState(0);
//   const [monthProfit, setMonthProfit] = useState(0);
//   const [purchaseCost, setPurchaseCost] = useState(0);
//   const [chartData, setChartData] = useState<any[]>([]);
//   const [pharmacyItems, setPharmacyItems] = useState<InventoryItem[]>([]);
//   const [allSales, setAllSales] = useState<Sale[]>([]);
//   const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
//   const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
//   const [salesGrowth, setSalesGrowth] = useState(0);

//   useEffect(() => {
//     if (!authLoading && !user) {
//       router.push('/');
//     } else if (user) {
//       loadDashboardData();
//     }
//   }, [user, authLoading, router]);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Load data with proper error handling
//       const promises = [
//         saleService.getAll().catch(err => {
//           console.warn('Sales service not available:', err);
//           return [];
//         }),
//         purchaseService.getAll().catch(err => {
//           console.warn('Purchase service error:', err);
//           return [];
//         }),
//         inventoryService.getAll().catch(err => {
//           console.warn('Inventory service error:', err);
//           return [];
//         })
//       ];

//       const [salesData, purchasesData, inventoryData] = await Promise.all(promises);
      
//       // Ensure data is always an array
//       const safeSalesData = Array.isArray(salesData) ? salesData : [];
//       const safePurchasesData = Array.isArray(purchasesData) ? purchasesData : [];
//       const safeInventoryData = Array.isArray(inventoryData) ? inventoryData : [];
      
//       setAllSales(safeSalesData);
//       setAllPurchases(safePurchasesData);
//       setPharmacyItems(safeInventoryData);

//       // Calculate today's sales
//       const today = new Date();
//       const todaySalesData = safeSalesData.filter(sale => {
//         const saleDate = new Date(sale.saleDate);
//         return saleDate.getDate() === today.getDate() &&
//                saleDate.getMonth() === today.getMonth() &&
//                saleDate.getFullYear() === today.getFullYear();
//       });
//       const todayTotal = todaySalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
//       setTodaySales(todayTotal);

//       // Calculate month's data
//       const monthStart = startOfMonth(today);
//       const monthEnd = endOfMonth(today);
      
//       const monthSalesData = safeSalesData.filter(sale => {
//         const saleDate = new Date(sale.saleDate);
//         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
//       });

//       const monthSalesTotal = monthSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
//       const monthCostTotal = monthSalesData.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
      
//       setMonthSales(monthSalesTotal);
//       setMonthProfit(monthSalesTotal - monthCostTotal);
//       setPurchaseCost(safePurchasesData.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0));

//       // Set low stock items with proper safety checks
//       if (safeInventoryData && safeInventoryData.length > 0) {
//         const lowStock = safeInventoryData.filter(item => {
//           return item && item.minQuantity && item.minQuantity > 0;
//         }).slice(0, 5); // Take top 5 items
//         setLowStockItems(lowStock);
//       } else {
//         setLowStockItems([]);
//       }

//       // Calculate sales growth (this is a placeholder - implement actual calculation)
//       const previousMonthSales = monthSalesTotal * 0.9; // Mock data - replace with actual previous month data
//       const growth = previousMonthSales > 0 ? ((monthSalesTotal - previousMonthSales) / previousMonthSales) * 100 : 0;
//       setSalesGrowth(growth);

//       // Prepare chart data
//       const chartDataArray = await generateChartData(safeSalesData);
//       setChartData(chartDataArray);

//     } catch (err) {
//       console.error('Error loading dashboard data:', err);
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateChartData = async (sales: Sale[]) => {
//     const months = [];
//     const today = new Date();
    
//     for (let i = 11; i >= 0; i--) {
//       const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
//       const monthStart = startOfMonth(date);
//       const monthEnd = endOfMonth(date);
      
//       const monthlySales = sales.filter(sale => {
//         const saleDate = new Date(sale.saleDate);
//         return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
//       });
      
//       const totalSales = monthlySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
//       const totalCost = monthlySales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
//       const profit = totalSales - totalCost;
      
//       months.push({
//         month: format(date, 'MMM yy'),
//         sales: totalSales,
//         profit: profit,
//         purchases: totalCost
//       });
//     }
    
//     return months;
//   };

//   if (authLoading || loading) {
//     return (
//       <DashboardLayout>
//         <div className="flex items-center justify-center h-full">
//           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (error) {
//     return (
//       <DashboardLayout>
//         <div className="flex items-center justify-center h-full">
//           <div className="text-center">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button 
//               onClick={loadDashboardData}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Retry Loading
//             </button>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gradient-to-b from-indigo-50 to-blue-50">
//         <div className="px-6 py-6 space-y-6">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//             <div>
//               <div className="flex items-center gap-3">
//                 <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
//                 {/* User role badge */}
//                 <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 capitalize">
//                   {userRole || 'User'} Mode
//                 </Badge>
//               </div>
              
//               {!isAdmin && (
//                 <div className="flex items-center text-amber-600 text-sm mt-1 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
//                   <Info className="h-4 w-4 mr-1" />
//                   <span>Some financial details are limited in staff view</span>
//                 </div>
//               )}
//             </div>
//             <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
//               <Calendar className="h-5 w-5 text-indigo-500" />
//               <span className="text-sm font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
//             </div>
//           </div>

//           {/* Stats Grid */}
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//             <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-blue-100">Today's Sales</p>
//                   <p className="text-3xl font-bold">Rs{todaySales.toFixed(2)}</p>
//                 </div>
//                 <div className="rounded-full bg-white/20 p-3">
//                   <DollarSign className="h-6 w-6" />
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 shadow-lg text-white">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-emerald-100">Month Sales</p>
//                   <p className="text-3xl font-bold">Rs{monthSales.toFixed(2)}</p>
//                   {salesGrowth > 0 && (
//                     <div className="flex items-center mt-2">
//                       <ArrowUpRight className="h-4 w-4 mr-1" />
//                       <span className="text-sm text-emerald-100">+{salesGrowth.toFixed(1)}%</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="rounded-full bg-white/20 p-3">
//                   <TrendingUp className="h-6 w-6" />
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-6 shadow-lg text-white">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-purple-100">Month Profit</p>
//                   <p className="text-3xl font-bold">Rs{monthProfit.toFixed(2)}</p>
//                 </div>
//                 <div className="rounded-full bg-white/20 p-3">
//                   <BarChart3 className="h-6 w-6" />
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 shadow-lg text-white">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-orange-100">Purchase Cost</p>
//                   <p className="text-3xl font-bold">Rs{purchaseCost.toFixed(2)}</p>
//                 </div>
//                 <div className="rounded-full bg-white/20 p-3">
//                   <ShoppingCart className="h-6 w-6" />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Charts Section */}
//           <div className="grid gap-6 lg:grid-cols-2">
//             {/* Sales Chart */}
//             <div className="rounded-xl bg-white p-6 shadow-lg">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="month" stroke="#666" fontSize={12} />
//                     <YAxis stroke="#666" fontSize={12} />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: 'white', 
//                         border: 'none', 
//                         borderRadius: '8px', 
//                         boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
//                       }} 
//                     />
//                     <Area 
//                       type="monotone" 
//                       dataKey="sales" 
//                       stroke="#3b82f6" 
//                       fill="url(#salesGradient)" 
//                       strokeWidth={2}
//                     />
//                     <defs>
//                       <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
//                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                       </linearGradient>
//                     </defs>
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Profit Chart */}
//             <div className="rounded-xl bg-white p-6 shadow-lg">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="month" stroke="#666" fontSize={12} />
//                     <YAxis stroke="#666" fontSize={12} />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: 'white', 
//                         border: 'none', 
//                         borderRadius: '8px', 
//                         boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
//                       }} 
//                     />
//                     <Bar dataKey="profit" fill="#10b981" radius={4} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           {/* Summary Cards */}
//           <div className="grid gap-6 lg:grid-cols-3">
//             {/* Recent Sales */}
//             <div className="rounded-xl bg-white p-6 shadow-lg">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
//                 <Receipt className="h-5 w-5 text-gray-500" />
//               </div>
//               <div className="space-y-3">
//                 {allSales.slice(0, 5).map((sale, index) => (
//                   <div key={sale.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                     <div>
//                       <p className="text-sm font-medium text-gray-800">
//                         {sale.invoiceNumber ? `Invoice #${sale.invoiceNumber}` : `Sale #${index + 1}`}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         {format(new Date(sale.saleDate), 'MMM d, yyyy')}
//                       </p>
//                     </div>
//                     <span className="text-sm font-bold text-green-600">
//                       Rs{(sale.totalAmount || 0).toFixed(2)}
//                     </span>
//                   </div>
//                 ))}
//                 {allSales.length === 0 && (
//                   <p className="text-center text-gray-500 py-4">No sales recorded yet</p>
//                 )}
//               </div>
//             </div>

//             {/* Inventory Summary */}
//             <div className="rounded-xl bg-white p-6 shadow-lg">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">Inventory Summary</h3>
//                 <ShoppingCart className="h-5 w-5 text-gray-500" />
//               </div>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
//                   <span className="text-sm text-blue-700">Total Items</span>
//                   <span className="text-lg font-bold text-blue-700">{pharmacyItems.length}</span>
//                 </div>
//                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
//                   <span className="text-sm text-red-700">Low Stock Items</span>
//                   <span className="text-lg font-bold text-red-700">{lowStockItems.length}</span>
//                 </div>
//                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//                   <span className="text-sm text-green-700">Categories</span>
//                   <span className="text-lg font-bold text-green-700">
//                     {new Set(pharmacyItems.map(item => item.categoryName).filter(Boolean)).size}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Low Stock Alert */}
//             <div className="rounded-xl bg-white p-6 shadow-lg">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
//                 <AlertCircle className="h-5 w-5 text-red-500" />
//               </div>
//               <div className="space-y-3 max-h-64 overflow-y-auto">
//                 {lowStockItems.length > 0 ? (
//                   lowStockItems.map((item, index) => (
//                     <div key={item.id || index} className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
//                       <div className="ml-3">
//                         <p className="text-sm font-medium text-gray-800">{item.name}</p>
//                         <p className="text-xs text-gray-500">{item.type} - Min Qty: {item.minQuantity}</p>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-center text-gray-500">No low stock items</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           <DashboardExtension 
//             allSales={allSales} 
//             allPurchases={allPurchases}
//             pharmacyItems={pharmacyItems}
//           />
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// // Export the component wrapped with the withAuth HOC
// export default withAuth(Dashboard);

'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { saleService } from '@/services/saleService';
import { purchaseService } from '@/services/purchaseService';
import { inventoryService } from '@/services/inventoryService';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { staffService } from '@/services/staffService';
import { expenseService } from '@/services/expenseService';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Loader2, TrendingUp, ShoppingCart, Receipt, DollarSign, Calendar, AlertCircle, ArrowUpRight, BarChart3, ShieldCheck, Info, Users, UserCheck, Stethoscope, CreditCard, Clock, Activity, FileText, Heart } from 'lucide-react';
import DashboardExtension from '@/components/DashboardExtension';

import { Sale } from '@/types/sale';
import { Purchase } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import { Appointment } from '@/types/appointment';
import { Doctor } from '@/types/doctor';
import { Badge } from '@/components/ui/badge';

// Import the withAuth HOC
import withAuth from '@/components/withAuth';

function Dashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const isAdmin = userRole === 'admin'; // Check if user is admin
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data states
  const [todaySales, setTodaySales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pharmacyItems, setPharmacyItems] = useState<InventoryItem[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [salesGrowth, setSalesGrowth] = useState(0);

  // New states for additional dashboard data
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [monthAppointments, setMonthAppointments] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  
  // Local patients specific metrics
  const [appointmentRevenue, setAppointmentRevenue] = useState(0);
  const [posSalesCount, setPosSalesCount] = useState(0);
  const [appointmentPaymentsCount, setAppointmentPaymentsCount] = useState(0);
  const [paidAppointments, setPaidAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [todayAppointmentRevenue, setTodayAppointmentRevenue] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data with proper error handling
      const promises = [
        saleService.getAll().catch(err => {
          console.warn('Sales service not available:', err);
          return [];
        }),
        purchaseService.getAll().catch(err => {
          console.warn('Purchase service error:', err);
          return [];
        }),
        inventoryService.getAll().catch(err => {
          console.warn('Inventory service error:', err);
          return [];
        }),
        appointmentService.getAllAppointments().catch(err => {
          console.warn('Appointment service error:', err);
          return [];
        }),
        appointmentService.getAllPatients().catch(err => {
          console.warn('Patient service error:', err);
          return [];
        }),
        doctorService.getAllDoctors().catch(err => {
          console.warn('Doctor service error:', err);
          return [];
        }),
        staffService.getAllStaff().catch(err => {
          console.warn('Staff service error:', err);
          return [];
        }),
        expenseService.getAllExpenses().catch(err => {
          console.warn('Expense service error:', err);
          return [];
        })
      ];

      const [
        salesData, 
        purchasesData, 
        inventoryData, 
        appointmentsData, 
        patientsData, 
        doctorsData, 
        staffData, 
        expensesData
      ] = await Promise.all(promises);
      
      // Ensure data is always an array
      const safeSalesData = Array.isArray(salesData) ? salesData : [];
      const safePurchasesData = Array.isArray(purchasesData) ? purchasesData : [];
      const safeInventoryData = Array.isArray(inventoryData) ? inventoryData : [];
      const safeAppointmentsData = Array.isArray(appointmentsData) ? appointmentsData : [];
      const safePatientsData = Array.isArray(patientsData) ? patientsData : [];
      const safeDoctorsData = Array.isArray(doctorsData) ? doctorsData : [];
      const safeStaffData = Array.isArray(staffData) ? staffData : [];
      const safeExpensesData = Array.isArray(expensesData) ? expensesData : [];
      
      setAllSales(safeSalesData);
      setAllPurchases(safePurchasesData);
      setPharmacyItems(safeInventoryData);
      setAllAppointments(safeAppointmentsData);

      // Set counts
      setTotalPatients(safePatientsData.length);
      setTotalDoctors(safeDoctorsData.filter(doctor => doctor.isActive !== false).length);
      setTotalStaff(safeStaffData.filter(staff => staff.isActive !== false).length);

      // Calculate today's data
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Today's sales
      const todaySalesData = safeSalesData.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= todayStart && saleDate <= todayEnd;
      });
      const todayTotal = todaySalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      setTodaySales(todayTotal);

      // Today's appointments
      const todayAppointmentsData = safeAppointmentsData.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= todayStart && appointmentDate <= todayEnd;
      });
      setTodayAppointments(todayAppointmentsData.length);

      // Today's expenses
      const todayExpensesData = safeExpensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= todayStart && expenseDate <= todayEnd;
      });
      const todayExpensesTotal = todayExpensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTodayExpenses(todayExpensesTotal);

      // Calculate month's data
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      
      const monthSalesData = safeSalesData.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
      });

      const monthAppointmentsData = safeAppointmentsData.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      });

      const monthSalesTotal = monthSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const monthCostTotal = monthSalesData.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
      
      setMonthSales(monthSalesTotal);
      setMonthProfit(monthSalesTotal - monthCostTotal);
      setMonthAppointments(monthAppointmentsData.length);
      setPurchaseCost(safePurchasesData.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0));

      // Set recent expenses (last 5)
      const sortedExpenses = safeExpensesData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentExpenses(sortedExpenses);

      // Calculate appointment-specific metrics for local patients
      const paidAppointmentsData = safeAppointmentsData.filter(appointment => 
        appointment.payment?.isPaid === true
      );
      const pendingAppointmentsData = safeAppointmentsData.filter(appointment => 
        appointment.payment?.isPaid !== true
      );
      
      setPaidAppointments(paidAppointmentsData.length);
      setPendingAppointments(pendingAppointmentsData.length);
      
      // Calculate appointment revenue (only from paid appointments)
      const totalAppointmentRevenue = paidAppointmentsData.reduce((sum, appointment) => 
        sum + (appointment.totalCharge || 0), 0
      );
      setAppointmentRevenue(totalAppointmentRevenue);
      
      // Calculate today's appointment revenue
      const todayPaidAppointments = paidAppointmentsData.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= todayStart && appointmentDate <= todayEnd;
      });
      const todayAppointmentRevenueTotal = todayPaidAppointments.reduce((sum, appointment) => 
        sum + (appointment.totalCharge || 0), 0
      );
      setTodayAppointmentRevenue(todayAppointmentRevenueTotal);
      
      // Count POS vs appointment payments
      const posPaidAppointments = paidAppointmentsData.filter(appointment => 
        appointment.payment?.paidThroughPOS === true
      );
      const appointmentPaidAppointments = paidAppointmentsData.filter(appointment => 
        appointment.payment?.paidInAppointments === true
      );
      
      // Calculate actual POS sales count (pharmacy sales)
      const posSalesCount = safeSalesData.length;
      
      setPosSalesCount(posSalesCount);
      setAppointmentPaymentsCount(appointmentPaidAppointments.length);

      // Set low stock items with proper safety checks
      if (safeInventoryData && safeInventoryData.length > 0) {
        const lowStock = safeInventoryData.filter(item => {
          return item && item.minQuantity && item.minQuantity > 0;
        }).slice(0, 5); // Take top 5 items
        setLowStockItems(lowStock);
      } else {
        setLowStockItems([]);
      }

      // Calculate sales growth
      const previousMonthSales = monthSalesTotal * 0.9; // Mock data - replace with actual previous month data
      const growth = previousMonthSales > 0 ? ((monthSalesTotal - previousMonthSales) / previousMonthSales) * 100 : 0;
      setSalesGrowth(growth);

      // Prepare chart data
      const chartDataArray = await generateChartData(safeSalesData);
      setChartData(chartDataArray);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async (sales: Sale[]) => {
    const months = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Pharmacy sales (local patients only)
      const monthlySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
      });
      
      // Appointment revenue for the same month
      const monthlyAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd }) &&
               appointment.payment?.isPaid === true;
      });
      
      const totalSales = monthlySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const totalCost = monthlySales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
      const totalAppointmentRevenue = monthlyAppointments.reduce((sum, appointment) => 
        sum + (appointment.totalCharge || 0), 0);
      const profit = totalSales - totalCost;
      
      months.push({
        month: format(date, 'MMM yy'),
        sales: totalSales,
        appointments: totalAppointmentRevenue,
        profit: profit,
        purchases: totalCost
      });
    }
    
    return months;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gradient-to-b from-indigo-50 to-blue-50">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Pearls Family Care Dashboard</h1>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 capitalize">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
              
              {!isAdmin && (
                <div className="flex items-center text-amber-600 text-sm mt-1 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                  <Info className="h-4 w-4 mr-1" />
                  <span>Some financial details are limited in staff view</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          {/* Stats Grid - Enhanced for Local Patients System */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {/* Pharmacy Sales */}
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Today's Pharmacy Sales</p>
                  <p className="text-2xl font-bold">Rs{todaySales.toFixed(2)}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Appointment Revenue */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Today's Appointment Revenue</p>
                  <p className="text-2xl font-bold">Rs{todayAppointmentRevenue.toFixed(2)}</p>
                  <p className="text-xs text-emerald-100 mt-1">Total: Rs{appointmentRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Heart className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Total Revenue (LKR)</p>
                  <p className="text-2xl font-bold">Rs{(todaySales + todayAppointmentRevenue).toFixed(2)}</p>
                  <p className="text-xs text-purple-100 mt-1">Local Patients Only</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-100">Today's Appointments</p>
                  <p className="text-2xl font-bold">{todayAppointments}</p>
                  <p className="text-xs text-cyan-100 mt-1">Paid: {paidAppointments} | Pending: {pendingAppointments}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-100">Payment Methods</p>
                  <p className="text-lg font-bold">Pharmacy: {posSalesCount}</p>
                  <p className="text-xs text-teal-100 mt-1">Appointments: {appointmentPaymentsCount}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Staff & Expenses */}
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100">Today's Expenses</p>
                  <p className="text-2xl font-bold">Rs{todayExpenses.toFixed(2)}</p>
                  <p className="text-xs text-orange-100 mt-1">Doctors: {totalDoctors} | Staff: {totalStaff}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section - Updated for Local Patients */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Overview */}
            <div className="rounded-xl bg-white p-6 shadow-lg lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview (LKR)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3b82f6" 
                      fill="url(#pharmacyGradient)" 
                      strokeWidth={2}
                      name="Pharmacy Sales"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#10b981" 
                      fill="url(#appointmentGradient)" 
                      strokeWidth={2}
                      name="Appointment Revenue"
                    />
                    <defs>
                      <linearGradient id="pharmacyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pharmacy Sales', value: posSalesCount, color: '#3b82f6' },
                        { name: 'Appointment Payments', value: appointmentPaymentsCount, color: '#10b981' },
                        { name: 'Pending Appointments', value: pendingAppointments, color: '#f59e0b' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Pharmacy Sales', value: posSalesCount, color: '#3b82f6' },
                        { name: 'Appointment Payments', value: appointmentPaymentsCount, color: '#10b981' },
                        { name: 'Pending Appointments', value: pendingAppointments, color: '#f59e0b' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Pharmacy Sales</p>
                  <p className="text-lg font-bold text-blue-800">{posSalesCount}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Appointment Payments</p>
                  <p className="text-lg font-bold text-green-800">{appointmentPaymentsCount}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-600 font-medium">Pending</p>
                  <p className="text-lg font-bold text-amber-800">{pendingAppointments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Recent Sales */}
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
                <Receipt className="h-5 w-5 text-gray-500" />
              </div>
              <div className="space-y-3">
                {allSales.slice(0, 5).map((sale, index) => {
                  // Get customer name from either customer object or customerInfo
                  const customerName = sale.customer?.name || sale.customerInfo?.name || 'Walk-in Customer';
                  const customerMobile = sale.customer?.mobile || sale.customerInfo?.mobile;
                  
                  return (
                    <div key={sale.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(sale.saleDate), 'MMM d, yyyy')}
                          {customerMobile && ` • ${customerMobile}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {sale.invoiceNumber ? `Invoice #${sale.invoiceNumber}` : `Sale #${index + 1}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        Rs{(sale.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {allSales.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No sales recorded yet</p>
                )}
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
              <div className="space-y-3">
                {allAppointments.slice(0, 5).map((appointment, index) => (
                  <div key={appointment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{appointment.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.doctorName} - {appointment.startTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        Rs{(appointment.totalCharge || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={appointment.payment?.isPaid ? "default" : "secondary"} 
                        className="text-xs mb-1"
                      >
                        {appointment.payment?.isPaid ? 'Paid' : 'Pending'}
                      </Badge>
                      {appointment.payment?.isPaid && (
                        <div className="text-xs text-gray-500">
                          {appointment.payment?.paidThroughPOS ? 'POS' : 'Appointment'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {allAppointments.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No appointments scheduled</p>
                )}
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <CreditCard className="h-5 w-5 text-gray-500" />
              </div>
              <div className="space-y-3">
                {recentExpenses.map((expense, index) => (
                  <div key={expense.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{expense.categoryName}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(expense.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      Rs{(expense.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {recentExpenses.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent expenses</p>
                )}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item, index) => (
                    <div key={item.id || index} className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.type} - Min Qty: {item.minQuantity}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No low stock items</p>
                )}
              </div>
            </div>
          </div>

          <DashboardExtension 
            allSales={allSales} 
            allPurchases={allPurchases}
            pharmacyItems={pharmacyItems}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Export the component wrapped with the withAuth HOC
export default withAuth(Dashboard);