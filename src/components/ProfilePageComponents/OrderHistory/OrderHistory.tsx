import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Empty, Spin, Typography, Space, Descriptions, Divider } from 'antd';
import { Package, ArrowRight, ExternalLink, Calendar, Store, Eye } from 'lucide-react';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { getStatusLabel, formatCurrency, formatDate } from '../../../utils/orderStatus';

const { Text, Title } = Typography;

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent orders (3 most recent)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await OrderHistoryService.list({ page: 0, size: 3 });
        setOrders(response.data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải danh sách đơn hàng');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleViewAll = () => {
    navigate('/orders');
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders`, { state: { orderId } });
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      COMPLETED: 'green',
      CONFIRMED: 'blue',
      SHIPPING: 'purple',
      AWAITING_SHIPMENT: 'gold',
      UNPAID: 'orange',
      CANCELLED: 'red',
      RETURN_REQUESTED: 'orange',
      RETURNED: 'default',
      PENDING: 'default',
      READY_FOR_PICKUP: 'cyan',
      OUT_FOR_DELIVERY: 'processing',
      DELIVERED_WAITING_CONFIRM: 'gold',
      DELIVERY_SUCCESS: 'green',
      DELIVERY_DENIED: 'red',
      READY_FOR_DELIVERY: 'cyan',
    };
    return colorMap[status] || 'default';
  };

  return (
    <Card
      title={
        <div>
          <Title level={4} className="!mb-1">Đơn hàng gần đây</Title>
          <Text type="secondary" className="text-sm">3 đơn hàng mới nhất của bạn</Text>
        </div>
      }
      extra={
        orders.length > 0 && (
          <Button
            type="default"
            icon={<ExternalLink className="w-4 h-4" />}
            onClick={handleViewAll}
            className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
          >
            Xem tất cả
          </Button>
        )
      }
      className="shadow-sm"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <Spin size="large" style={{ color: '#f97316' }} />
          <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : orders.length === 0 ? (
        <Empty
          image={<Package className="w-16 h-16 text-gray-300 mx-auto" />}
          description={
            <div>
              <p className="text-gray-500 mb-2">Bạn chưa có đơn hàng nào.</p>
              <p className="text-sm text-gray-400">Hãy bắt đầu mua sắm ngay!</p>
            </div>
          }
        />
      ) : (
        <Space direction="vertical" size="middle" className="w-full">
          {orders.map((order) => {
            const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);
            
            return (
              <Card
                key={order.id}
                hoverable
                className="border-orange-200 hover:border-orange-400 transition-all"
                actions={[
                  <Button
                    type="primary"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => handleViewDetail(order.id)}
                    className="w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
                    style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
                  >
                    Xem chi tiết
                  </Button>
                ]}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Space className="mb-3">
                      <Space className="bg-gray-50 px-3 py-1 rounded-lg">
                        <Package className="w-4 h-4 text-orange-500" />
                        <Text className="text-xs text-gray-500">Mã đơn:</Text>
                        <Text code className="text-sm">{order.id.slice(0, 8)}...</Text>
                      </Space>
                      <Tag color={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Tag>
                    </Space>
                    
                    <Descriptions size="small" column={3} className="mt-2">
                      <Descriptions.Item label={<><Calendar className="w-3 h-3 inline mr-1" />Ngày đặt</>}>
                        {formatDate(order.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><Store className="w-3 h-3 inline mr-1" />Sản phẩm</>}>
                        {totalItems} sản phẩm
                      </Descriptions.Item>
                      <Descriptions.Item label={<><Store className="w-3 h-3 inline mr-1" />Cửa hàng</>}>
                        {order.storeOrders.length} {order.storeOrders.length === 1 ? 'cửa hàng' : 'cửa hàng'}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                      <Text className="text-xs text-gray-600">Tổng tiền</Text>
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(order.grandTotal)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {orders.length > 0 && (
            <>
              <Divider />
              <Button
                type="primary"
                block
                size="large"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleViewAll}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-500 hover:border-orange-600 shadow-md hover:shadow-lg transition-all"
                style={{ 
                  backgroundColor: '#f97316', 
                  borderColor: '#f97316',
                  backgroundImage: 'linear-gradient(to right, #f97316, #ea580c)'
                }}
              >
                Xem tất cả đơn hàng
              </Button>
            </>
          )}
        </Space>
      )}
    </Card>
  );
};

export default OrderHistory;


