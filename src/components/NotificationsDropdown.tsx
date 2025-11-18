import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { purchaseService } from '@/services/purchaseService';
import { inventoryService } from '@/services/inventoryService';
import { Badge } from "@/components/ui/badge";

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const inventoryItems = await inventoryService.getAll();
      const notifications = [];

      // Load batch details for each item
      for (const item of inventoryItems) {
        if (!item.id) continue;
        
        const batches = await purchaseService.getBatchesByItem(item.id);
        const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
        const availableUnits = item.unitContains 
          ? Math.floor(totalQuantity / item.unitContains.value)
          : totalQuantity;

        // Check for low stock
        if (availableUnits < item.minQuantity) {
          notifications.push({
            id: `low-stock-${item.id}`,
            type: 'low-stock',
            item,
            availableUnits,
            minQuantity: item.minQuantity,
            severity: 'high'
          });
        }

        // Check for expiring batches
        const today = new Date();
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        const sixMonths = new Date();
        sixMonths.setMonth(sixMonths.getMonth() + 6);

        batches.forEach(batch => {
          const expiryDate = new Date(batch.expiryDate);
          
          if (expiryDate <= today) {
            notifications.push({
              id: `expired-${batch.id}`,
              type: 'expired',
              item,
              batch,
              severity: 'critical'
            });
          } else if (expiryDate <= threeMonths) {
            notifications.push({
              id: `expiring-3m-${batch.id}`,
              type: 'expiring-soon',
              item,
              batch,
              severity: 'high'
            });
          } else if (expiryDate <= sixMonths) {
            notifications.push({
              id: `expiring-6m-${batch.id}`,
              type: 'expiring',
              item,
              batch,
              severity: 'medium'
            });
          }
        });
      }

      // Sort notifications by severity
      notifications.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      setNotifications(notifications);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = (e) => {
    e.stopPropagation(); // Prevent closing the dropdown when clicking refresh
    loadNotifications();
  };

  const getNotificationBadge = (severity) => {
    const variants = {
      critical: "destructive",
      high: "warning",
      medium: "secondary"
    };
    return variants[severity] || "default";
  };

  const formatExpiryDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'low-stock':
        return (
          <div className="space-y-1">
            <p className="font-medium">{notification.item.name}</p>
            <p className="text-sm text-gray-600">
              Low stock alert: {notification.availableUnits} units available
              (Minimum: {notification.minQuantity})
            </p>
          </div>
        );
      
      case 'expired':
        return (
          <div className="space-y-1">
            <p className="font-medium">{notification.item.name}</p>
            <p className="text-sm text-gray-600">
              Batch {notification.batch.batchNumber} expired on {formatExpiryDate(notification.batch.expiryDate)}
            </p>
          </div>
        );
      
      case 'expiring-soon':
      case 'expiring':
        return (
          <div className="space-y-1">
            <p className="font-medium">{notification.item.name}</p>
            <p className="text-sm text-gray-600">
              Batch {notification.batch.batchNumber} expires on {formatExpiryDate(notification.batch.expiryDate)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 hover:bg-gray-100 relative"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Inventory Alerts</h3>
              <button 
                onClick={handleRefresh} 
                className={`rounded-full p-1.5 text-gray-600 hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                disabled={isRefreshing}
                title="Refresh notifications"
                aria-label="Refresh notifications"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  {isRefreshing ? 'Refreshing...' : 'Loading...'}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No alerts at this time</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {getNotificationContent(notification)}
                        </div>
                        <Badge variant={getNotificationBadge(notification.severity)} className="ml-2">
                          {notification.type === 'low-stock' ? 'Low Stock' : 
                           notification.type === 'expired' ? 'Expired' : 
                           notification.type === 'expiring-soon' ? 'Expiring Soon' : 
                           'Expiring'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;