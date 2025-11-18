import React from 'react';
import { 
  Package2, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Sale } from '@/types/sale';
import { Purchase, PurchaseWithDetails } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import DuePaymentsDashboard from '../app/dashboard/DuePaymentsDashboard';

// Custom Progress Component
const Progress = ({ value = 0 }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface DashboardExtensionProps {
  allSales: Sale[];
  allPurchases: Purchase[];
  pharmacyItems: InventoryItem[];
}

const DashboardExtension: React.FC<DashboardExtensionProps> = ({ 
  allSales, 
  allPurchases, 
  pharmacyItems 
}) => {
  // Calculate payment method distribution
  const paymentMethodStats = allSales.reduce((acc, sale) => {
    if (sale) {
      const method = sale.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalSales = allSales.length;
  const paymentDistribution = Object.entries(paymentMethodStats).map(([method, count]) => ({
    method: method.toUpperCase(),
    percentage: (count / totalSales) * 100
  }));

  // Calculate low stock items
  const lowStockItems = pharmacyItems
    .filter(item => {
      const itemBatches = allPurchases.flatMap(p => 
        p.items.filter(i => i.itemId === item.id)
      );
      const totalQuantity = itemBatches.reduce((sum, batch) => sum + batch.totalQuantity, 0);
      return totalQuantity <= item.minQuantity;
    })
    .slice(0, 5);

  // Calculate top selling products
  const productSales = allSales.reduce((acc, sale) => {
    // Add null check for sale.items
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (item && item.item && item.item.name) {
          acc[item.item.name] = (acc[item.item.name] || 0) + (item.unitQuantity || 0);
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  // Calculate customer statistics - consider both customerId and customerInfo
  const uniqueCustomers = new Set(
    allSales
      .map(sale => {
        // Use customerId if available, otherwise use customerInfo.name + mobile as unique identifier
        if (sale.customerId) {
          return sale.customerId;
        } else if (sale.customerInfo?.name && sale.customerInfo?.mobile) {
          return `${sale.customerInfo.name}-${sale.customerInfo.mobile}`;
        } else if (sale.customer?.name && sale.customer?.mobile) {
          return `${sale.customer.name}-${sale.customer.mobile}`;
        }
        return null;
      })
      .filter(Boolean)
  ).size;

  const repeatCustomers = allSales.reduce((acc, sale) => {
    let customerKey = null;
    
    if (sale.customerId) {
      customerKey = sale.customerId;
    } else if (sale.customerInfo?.name && sale.customerInfo?.mobile) {
      customerKey = `${sale.customerInfo.name}-${sale.customerInfo.mobile}`;
    } else if (sale.customer?.name && sale.customer?.mobile) {
      customerKey = `${sale.customer.name}-${sale.customer.mobile}`;
    }
    
    if (customerKey) {
      acc[customerKey] = (acc[customerKey] || 0) + 1;
    }
    
    return acc;
  }, {} as Record<string, number>);
  
  const loyalCustomerCount = Object.values(repeatCustomers)
    .filter(count => count > 3).length;

  // Calculate payment stats
  const unpaidPurchases = allPurchases.filter(p => p.paymentStatus === 'unpaid' || p.paymentStatus === 'partial');
  const totalDueAmount = unpaidPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

  return (
    <div className="mt-6 space-y-6">
      {/* Additional Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{pharmacyItems.length}</p>
            </div>
            <div className="rounded-full bg-purple-50 p-3">
              <Package2 className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold">{lowStockItems.length}</p>
            </div>
            <div className="rounded-full bg-amber-50 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Customers</p>
              <p className="text-2xl font-bold">{uniqueCustomers}</p>
            </div>
            <div className="rounded-full bg-green-50 p-3">
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold">
                Rs{(allSales.length > 0 ? (allSales.reduce((sum, sale) => sum + (sale?.totalAmount || 0), 0) / allSales.length).toFixed(2) : '0.00')}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Due Payments and Payment Methods Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Due Payments Dashboard */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              Pending Supplier Payments
            </h3>
            <div className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded-full">
              {unpaidPurchases.length} unpaid
            </div>
          </div>

          {unpaidPurchases.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No pending payments found
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600">Total Due Amount</p>
                  <p className="text-xl font-bold text-red-700">Rs{totalDueAmount.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600">Unpaid Invoices</p>
                  <p className="text-xl font-bold text-amber-700">{unpaidPurchases.length}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {unpaidPurchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 border">
                    <div>
                      <p className="font-medium">{purchase.supplier?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {purchase.purchaseDate.toLocaleDateString()} 
                        {purchase.invoiceNumber && ` • Invoice #${purchase.invoiceNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">Rs{(purchase.dueAmount || 0).toFixed(2)}</p>
                      <p className="text-xs">
                        {purchase.paymentStatus === 'partial' ? 'Partially Paid' : 'Unpaid'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods Distribution</h3>
          <div className="space-y-4">
            {paymentDistribution.map(({ method, percentage }) => (
              <div key={method} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{method}</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <Progress value={percentage} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products and Low Stock Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Top Selling Products
          </h3>
          <div className="space-y-4">
            {topProducts.map(({ name, quantity }) => (
              <div key={name} className="flex justify-between items-center">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-sm text-gray-500">{quantity} units sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </h3>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-500">
                    Low Stock
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No items are running low on stock</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Insights
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Unique Customers</p>
            <p className="text-2xl font-bold">{uniqueCustomers}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Loyal Customers</p>
            <p className="text-2xl font-bold">{loyalCustomerCount}</p>
            <p className="text-xs text-gray-500">(More than 3 purchases)</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Recent Transactions</p>
            <p className="text-2xl font-bold">
              {allSales.filter(sale => {
                if (!sale || !sale.saleDate) return false;
                const saleDate = new Date(sale.saleDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return saleDate >= thirtyDaysAgo;
              }).length}
            </p>
            <p className="text-xs text-gray-500">(Last 30 days)</p>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Sales
        </h3>
        <div className="space-y-4">
          {allSales.slice(0, 5).map((sale) => {
            // Get customer name from either customer object or customerInfo
            const customerName = sale.customer?.name || sale.customerInfo?.name || 'Walk-in Customer';
            const customerMobile = sale.customer?.mobile || sale.customerInfo?.mobile;
            
            return (
              <div key={sale.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(sale.saleDate).toLocaleDateString()}
                    {customerMobile && ` • ${customerMobile}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Rs{sale.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{sale.items?.length || 0} items</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardExtension;