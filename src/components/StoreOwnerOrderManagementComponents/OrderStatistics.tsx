import React, { useEffect, useState } from 'react';
import { Tag, Package, Clock, Check, Loader2, CheckCircle2, XCircle as XCircleIcon, RotateCcw, AlertCircle, Truck, ShoppingCart, PackageCheck, AlertTriangle } from 'lucide-react';
import { StoreOrderService } from '../../services/seller/OrderService';
import { getStatusLabel } from '../../utils/orderStatus';

export interface OrderStatisticsProps {
  onStatusChange: (status: string) => void;
}

// Group statuses for better display with icons
const statusGroups: Record<string, { statuses: string[]; icon: React.ReactNode; color: string }> = {
  'Chờ xử lý': {
    statuses: ['UNPAID', 'PENDING', 'CONFIRMED'],
    icon: <Clock className="w-4 h-4" />,
    color: 'text-orange-600'
  },
  'Chuẩn bị giao hàng': {
    statuses: ['GHN_CREATED', 'AWAITING_SHIPMENT', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY'],
    icon: <Package className="w-4 h-4" />,
    color: 'text-blue-600'
  },
  'Đang giao hàng': {
    statuses: ['SHIPPING', 'OUT_FOR_DELIVERY', 'DELIVERED_WAITING_CONFIRM'],
    icon: <Truck className="w-4 h-4" />,
    color: 'text-purple-600'
  },
  'Hoàn thành': {
    statuses: ['DELIVERY_SUCCESS', 'COMPLETED'],
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-600'
  },
  'Vấn đề': {
    statuses: ['DELIVERY_DENIED', 'DELIVERY_FAIL', 'EXCEPTION'],
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600'
  },
  'Trả hàng': {
    statuses: ['RETURN_REQUESTED', 'RETURNING', 'RETURNED'],
    icon: <RotateCcw className="w-4 h-4" />,
    color: 'text-orange-600'
  },
  'Hủy': {
    statuses: ['CANCELLED'],
    icon: <XCircleIcon className="w-4 h-4" />,
    color: 'text-red-600'
  },
};

// Get icon for each status
const getStatusIcon = (status: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    UNPAID: <ShoppingCart className="w-3 h-3" />,
    PENDING: <Clock className="w-3 h-3" />,
    CONFIRMED: <CheckCircle2 className="w-3 h-3" />,
    GHN_CREATED: <Package className="w-3 h-3" />,
    AWAITING_SHIPMENT: <PackageCheck className="w-3 h-3" />,
    READY_FOR_PICKUP: <Package className="w-3 h-3" />,
    READY_FOR_DELIVERY: <Truck className="w-3 h-3" />,
    SHIPPING: <Truck className="w-3 h-3" />,
    OUT_FOR_DELIVERY: <Truck className="w-3 h-3" />,
    DELIVERED_WAITING_CONFIRM: <Clock className="w-3 h-3" />,
    DELIVERY_SUCCESS: <CheckCircle2 className="w-3 h-3" />,
    COMPLETED: <CheckCircle2 className="w-3 h-3" />,
    DELIVERY_DENIED: <XCircleIcon className="w-3 h-3" />,
    DELIVERY_FAIL: <AlertCircle className="w-3 h-3" />,
    EXCEPTION: <AlertTriangle className="w-3 h-3" />,
    RETURN_REQUESTED: <RotateCcw className="w-3 h-3" />,
    RETURNING: <RotateCcw className="w-3 h-3" />,
    RETURNED: <RotateCcw className="w-3 h-3" />,
    CANCELLED: <XCircleIcon className="w-3 h-3" />,
  };
  return iconMap[status] || <Package className="w-3 h-3" />;
};

const OrderStatistics: React.FC<OrderStatisticsProps> = ({ onStatusChange }) => {
  // Order statistics by status
  const [orderStats, setOrderStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Selected status group for sidebar
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Auto-rotate group when no group is selected
  const [autoRotateIndex, setAutoRotateIndex] = useState(0);

  // Load order statistics by status
  useEffect(() => {
    const loadOrderStats = async () => {
      setLoadingStats(true);
      const statuses: string[] = [
        'UNPAID', 'PENDING', 'CONFIRMED', 'GHN_CREATED', 'AWAITING_SHIPMENT',
        'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'SHIPPING', 'OUT_FOR_DELIVERY',
        'DELIVERED_WAITING_CONFIRM', 'DELIVERY_SUCCESS', 'DELIVERY_DENIED',
        'DELIVERY_FAIL', 'EXCEPTION', 'RETURN_REQUESTED', 'RETURNING', 'RETURNED',
        'COMPLETED', 'CANCELLED'
      ];
      
      try {
        const statsPromises = statuses.map(async (status) => {
          try {
            const result = await StoreOrderService.getOrders({
              status: status as any,
              page: 0,
              size: 1, // Chỉ cần totalElements, không cần data
            });
            return { status, count: result.total };
          } catch (error) {
            console.error(`Error loading stats for ${status}:`, error);
            return { status, count: 0 };
          }
        });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, number> = {};
        statsResults.forEach(({ status, count }) => {
          statsMap[status] = count;
        });
        setOrderStats(statsMap);
      } catch (error) {
        console.error('Error loading order statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadOrderStats();
  }, []); // Load once on mount

  // Auto-rotate through status groups when no group is selected (5 seconds per group)
  useEffect(() => {
    if (selectedGroup !== null) {
      // If a group is selected, stop auto-rotation
      return;
    }

    const groupNames = Object.keys(statusGroups);
    if (groupNames.length === 0) {
      return;
    }

    // Auto-rotate every 5 seconds
    const interval = setInterval(() => {
      setAutoRotateIndex((prev) => (prev + 1) % groupNames.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGroup, autoRotateIndex]);

  // Calculate total orders
  const totalOrders = Object.values(orderStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Thống kê đơn hàng theo trạng thái</h2>
            <p className="text-sm text-gray-500">Tổng số đơn hàng: <span className="font-semibold text-gray-700">{totalOrders}</span></p>
          </div>
        </div>
      </div>
      {loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Đang tải thống kê...</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Sidebar - Danh sách nhóm trạng thái (nằm ngang) */}
          <div className="border-b border-gray-200 bg-gray-50 min-h-[72px]">
            <div className="p-4">
              <div className="flex flex-wrap gap-2 items-center">
                {Object.entries(statusGroups).map(([groupName, groupData]) => {
                  const { statuses, icon, color } = groupData;
                  const totalInGroup = statuses.reduce((sum, status) => sum + (orderStats[status] || 0), 0);
                  const groupNames = Object.keys(statusGroups);
                  const displayGroup = selectedGroup || (groupNames.length > 0 ? groupNames[autoRotateIndex % groupNames.length] : null);
                  const isActive = displayGroup === groupName;
                  
                  return (
                    <div
                      key={groupName}
                      className={`flex items-center gap-2 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'px-4 py-2.5 bg-blue-100 border-2 border-blue-400 shadow-sm min-h-[44px]'
                          : 'px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 opacity-70 min-h-[44px]'
                      }`}
                      onClick={() => setSelectedGroup(isActive ? null : groupName)}
                    >
                      <div className={`flex-shrink-0 transition-all flex items-center justify-center ${
                        isActive 
                          ? `${color} w-4 h-4` 
                          : 'text-gray-400 w-3.5 h-3.5'
                      }`}>
                        {icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`whitespace-nowrap font-medium transition-all ${
                          isActive 
                            ? 'text-sm text-blue-700' 
                            : 'text-xs text-gray-500'
                        }`}>
                          {groupName}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full transition-all ${
                          isActive 
                            ? 'text-xs bg-blue-200 text-blue-700' 
                            : 'text-[10px] bg-gray-100 text-gray-500'
                        }`}>
                          {totalInGroup} đơn
                        </div>
                      </div>
                      <div className={`flex-shrink-0 transition-all ${
                        isActive ? 'w-4 h-4' : 'w-0 h-4'
                      }`}>
                        {isActive && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area - Chi tiết trạng thái của nhóm được chọn */}
          <div className="flex-1 p-6">
            {(() => {
              // Determine which group to display
              const groupNames = Object.keys(statusGroups);
              const displayGroup = selectedGroup || (groupNames.length > 0 ? groupNames[autoRotateIndex % groupNames.length] : null);

              if (!displayGroup) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có dữ liệu thống kê</h3>
                  </div>
                );
              }

              const groupData = statusGroups[displayGroup];
              const { statuses, icon, color } = groupData;
              const totalInGroup = statuses.reduce((sum, status) => sum + (orderStats[status] || 0), 0);
              
              return (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 bg-blue-50 rounded-lg ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">{displayGroup}</h3>
                        {!selectedGroup && (
                          <Tag color="blue" className="text-xs">
                            Tự động chuyển đổi
                          </Tag>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Tổng: {totalInGroup} đơn hàng</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {statuses.map((status) => {
                      const count = orderStats[status] || 0;
                      const label = getStatusLabel(status as any);
                      const statusIcon = getStatusIcon(status);
                      const colorMap: Record<string, string> = {
                        COMPLETED: 'green',
                        CONFIRMED: 'blue',
                        SHIPPING: 'purple',
                        AWAITING_SHIPMENT: 'gold',
                        GHN_CREATED: 'blue',
                        UNPAID: 'orange',
                        CANCELLED: 'red',
                        RETURN_REQUESTED: 'orange',
                        RETURNING: 'orange',
                        RETURNED: 'default',
                        PENDING: 'default',
                        READY_FOR_PICKUP: 'cyan',
                        READY_FOR_DELIVERY: 'cyan',
                        OUT_FOR_DELIVERY: 'processing',
                        DELIVERED_WAITING_CONFIRM: 'gold',
                        DELIVERY_SUCCESS: 'green',
                        DELIVERY_DENIED: 'red',
                        DELIVERY_FAIL: 'red',
                        EXCEPTION: 'volcano',
                      };
                      
                      return (
                        <div
                          key={status}
                          className={`flex flex-col p-4 rounded-lg border transition-all cursor-pointer ${
                            count > 0
                              ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50'
                              : 'bg-gray-50 border-gray-100 opacity-60'
                          }`}
                          onClick={() => onStatusChange(status)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {statusIcon}
                            </div>
                            <Tag color={colorMap[status] || 'default'} className="text-xs">
                              {label}
                            </Tag>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${
                              count > 0 ? 'text-gray-800' : 'text-gray-400'
                            }`}>
                              {count}
                            </span>
                            <span className="text-sm text-gray-500">đơn hàng</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatistics;

