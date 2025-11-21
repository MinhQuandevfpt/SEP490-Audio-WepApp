import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Empty, Spin, Typography, Space, Divider, message } from 'antd';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { OrderCard, OrderDetailModal } from '../../OrderHistoryComponents';

const { Text, Title } = Typography;

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadRecentOrders = useCallback(async () => {
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
  }, []);

  // Load recent orders (3 most recent)
  useEffect(() => {
    loadRecentOrders();
  }, [loadRecentOrders]);

  const handleViewAll = () => {
    navigate('/orders');
  };

  const handleViewDetail = async (orderId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const detail = await OrderHistoryService.getById(orderId);
      setDetailOrder(detail);
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải chi tiết đơn hàng');
      setDetailOrder(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailOrder(null);
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="!mb-1 !text-gray-900">Đơn hàng gần đây</Title>
            <Text type="secondary" className="text-sm">3 đơn hàng mới nhất của bạn</Text>
          </div>
          {orders.length > 0 && (
            <Button
              type="default"
              icon={<ExternalLink className="w-4 h-4 text-orange-500" />}
              onClick={handleViewAll}
              style={{ 
                backgroundColor: 'transparent',
                borderColor: '#f97316',
                color: '#f97316',
                borderRadius: '999px',
                paddingInline: '20px',
                fontWeight: 600
              }}
            >
              Xem tất cả
            </Button>
          )}
        </div>
      }
      className="shadow-sm border-gray-200"
      styles={{ body: { padding: '24px' } }}
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" style={{ color: '#f97316' }} />
          <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <Text type="danger" className="text-base">{error}</Text>
        </div>
      ) : orders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p className="text-gray-600 font-medium mb-1">Bạn chưa có đơn hàng nào</p>
              <p className="text-sm text-gray-400">Hãy bắt đầu mua sắm ngay!</p>
            </div>
          }
        />
      ) : (
        <Space direction="vertical" size="large" className="w-full">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onViewDetail={handleViewDetail} />
          ))}
          
          {orders.length > 0 && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Button
                type="primary"
                block
                size="large"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleViewAll}
                style={{ 
                  backgroundColor: '#f97316', 
                  borderColor: '#f97316',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Xem tất cả đơn hàng
              </Button>
            </>
          )}
        </Space>
      )}

      {isDetailModalOpen && (
        <>
          {isDetailLoading ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <Spin size="large" style={{ color: '#f97316' }} />
            </div>
          ) : (
            detailOrder && (
              <OrderDetailModal
                order={detailOrder}
                onClose={closeDetailModal}
                onOrderCancelled={loadRecentOrders}
              />
            )
          )}
        </>
      )}
    </Card>
  );
};

export default OrderHistory;


