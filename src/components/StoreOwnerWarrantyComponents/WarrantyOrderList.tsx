import React, { useMemo } from 'react';
import { Button, Card, Empty, Input, Space, Spin, Typography } from 'antd';
import { RefreshCw } from 'lucide-react';
import type { StoreOrder } from '../../types/seller';
import type { Warranty } from '../../types/api';
import WarrantyOrderCard from './WarrantyOrderCard';

const { Search } = Input;
const { Text } = Typography;

// Extended warranty with order information
interface WarrantyWithOrder extends Warranty {
  storeOrderId: string;
  orderCreatedAt: string;
  orderGrandTotal: number;
}

interface WarrantyOrderListProps {
  orders: StoreOrder[];
  warranties: WarrantyWithOrder[];
  isLoading: boolean;
  error?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: (value: string) => void;
  onRefresh: () => void;
  onActivate: (order: StoreOrder) => void;
  isActivating?: boolean;
  activatingOrderId?: string | null;
  onSerialAdded?: () => void; // Callback to refresh data after adding serial
}

const WarrantyOrderList: React.FC<WarrantyOrderListProps> = ({
  orders,
  warranties,
  isLoading,
  error,
  searchValue,
  onSearchChange,
  onSearch,
  onRefresh,
  onActivate,
  isActivating = false,
  activatingOrderId = null,
  onSerialAdded,
}) => {
  // Filter orders that don't have activated warranties yet (need activation)
  // Orders with PENDING_ACTIVATION warranties should still show "Kích hoạt bảo hành" button
  const ordersWithoutActivatedWarranties = useMemo(() => {
    const orderIdsWithActivatedWarranties = new Set(
      warranties
        .filter(w => w.id !== null && w.status === 'ACTIVE')
        .map(w => w.storeOrderId)
    );
    return orders.filter(order => !orderIdsWithActivatedWarranties.has(order.id));
  }, [orders, warranties]);

  // Separate warranties into activated
  const activatedWarranties = useMemo(() => {
    return warranties.filter(w => w.id !== null && w.status === 'ACTIVE');
  }, [warranties]);

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleSearchSubmit = (value: string) => {
    onSearch(value);
  };

  const hasData = ordersWithoutActivatedWarranties.length > 0 || warranties.length > 0;

  return (
    <Card className="shadow-sm border border-gray-100">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Search
            placeholder="Tìm theo mã đơn, khách hàng hoặc số điện thoại..."
            enterButton="Tìm kiếm"
            value={searchValue}
            onChange={handleSearchInput}
            onSearch={handleSearchSubmit}
            allowClear
            size="large"
          />
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onRefresh}
            size="large"
            loading={isLoading}
          >
            Làm mới
          </Button>
        </div>

        {error && (
          <Text type="danger" className="text-sm">
            {error}
          </Text>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <Spin size="large" />
            <p className="mt-3 text-sm text-gray-500">Đang tải danh sách bảo hành...</p>
          </div>
        ) : !hasData ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có đơn hàng giao thành công cần kích hoạt bảo hành"
            className="py-10"
          />
        ) : (
          <div className="space-y-4">
            {/* Show orders without activated warranties (need activation) */}
            {ordersWithoutActivatedWarranties.length > 0 && (
              <div className="space-y-4">
                <Text strong className="text-base text-gray-700">
                  Đơn hàng cần kích hoạt bảo hành
                   {/* ({ordersWithoutActivatedWarranties.length}) */}
                </Text>
                {ordersWithoutActivatedWarranties.map((order) => {
                  // Get all warranties for this order
                  const orderWarranties = warranties.filter(w => w.storeOrderId === order.id);
                  
                  return (
                    <WarrantyOrderCard 
                      key={order.id} 
                      order={order} 
                      warranties={orderWarranties}
                      onActivate={onActivate} 
                      isActivating={isActivating}
                      activatingOrderId={activatingOrderId}
                      onSerialAdded={onSerialAdded}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Show activated warranties - Group by order */}
            {activatedWarranties.length > 0 && (
              <div className="space-y-4 mt-6">
                <Text strong className="text-base text-gray-700">
                  Bảo hành đã kích hoạt
                </Text>
                {Array.from(new Set(activatedWarranties.map(w => w.storeOrderId))).map((orderId) => {
                  // Find the order
                  const order = orders.find(o => o.id === orderId);
                  if (!order) return null;
                  
                  // Get all warranties for this order
                  const orderWarranties = warranties.filter(w => w.storeOrderId === orderId);
                  
                  return (
                    <WarrantyOrderCard 
                      key={orderId} 
                      order={order} 
                      warranties={orderWarranties}
                      onActivate={onActivate} 
                      isActivating={isActivating}
                      activatingOrderId={activatingOrderId}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default WarrantyOrderList;


