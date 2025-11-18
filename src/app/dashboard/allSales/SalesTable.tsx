import { Eye, Package, TestTube, Stethoscope } from 'lucide-react';

interface Sale {
  id?: string;
  items?: Array<{
    totalPrice: number;
    totalCost: number;
  }>;
  laboratoryTests?: Array<{
    price: number;
  }>;
  doctorFees?: Array<{
    amount: number;
  }>;
  saleDate: Date;
  customer?: {
    name: string;
    mobile: string;
  };
}

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

export default function SalesTable({ sales, onViewDetails }: SalesTableProps) {
  const sortedSales = [...sales].sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

  // Calculate totals and types for a sale
  const calculateSaleDetails = (sale: Sale) => {
    // Inventory calculations
    const inventoryTotal = sale.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    const inventoryCost = sale.items?.reduce((sum, item) => sum + item.totalCost, 0) || 0;
    const inventoryProfit = inventoryTotal - inventoryCost;
    
    // Lab tests total
    const labTestsTotal = sale.laboratoryTests?.reduce((sum, test) => sum + test.price, 0) || 0;
    
    // Doctor fees total
    const doctorFeesTotal = sale.doctorFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
    
    // Total amount from all sources
    const totalAmount = inventoryTotal + labTestsTotal + doctorFeesTotal;

    // Determine sale types
    const types = {
      hasInventory: (sale.items?.length || 0) > 0,
      hasLabTests: (sale.laboratoryTests?.length || 0) > 0,
      hasDoctorFees: (sale.doctorFees?.length || 0) > 0
    };

    return {
      totalAmount,
      inventoryProfit,
      types
    };
  };

  return (
    <div className="rounded-md border">
      {/* Fixed header */}
      <div className="border-b">
        <div className="w-full table-fixed">
          <div className="bg-muted px-4 py-3">
            <div className="grid grid-cols-6 gap-4">
              <div className="text-sm font-medium">Date</div>
              <div className="text-sm font-medium">Customer</div>
              <div className="text-sm font-medium">Sale Type</div>
              <div className="text-sm font-medium">Total Amount</div>
              <div className="text-sm font-medium">Inventory Profit</div>
              <div className="text-sm font-medium"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
        <div className="w-full table-fixed">
          {sortedSales.map((sale) => {
            const { totalAmount, inventoryProfit, types } = calculateSaleDetails(sale);

            return (
              <div key={sale.id} className="border-b px-4 py-3">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div>
                    {sale.saleDate.toLocaleDateString()}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {sale.saleDate.toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    {sale.customer ? (
                      <div>
                        <p className="font-medium">{sale.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer.mobile}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Walk-in Customer</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {types.hasInventory && (
                        <div className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          <span>{sale.items?.length}</span>
                        </div>
                      )}
                      {types.hasLabTests && (
                        <div className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                          <TestTube className="h-3 w-3 mr-1" />
                          <span>{sale.laboratoryTests?.length}</span>
                        </div>
                      )}
                      {types.hasDoctorFees && (
                        <div className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          <span>{sale.doctorFees?.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-medium">
                    Rs{totalAmount.toFixed(2)}
                  </div>
                  <div>
                    {types.hasInventory ? (
                      <span className="text-green-600 font-medium">
                        Rs{inventoryProfit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div>
                    <button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
                      onClick={() => onViewDetails(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}