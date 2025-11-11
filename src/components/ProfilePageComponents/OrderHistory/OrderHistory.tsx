import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Empty, Spin, Typography, Space, Divider, Row, Col, Statistic } from 'antd';
import { Package, ArrowRight, ExternalLink, Calendar, Store, Eye, ShoppingBag, DollarSign } from 'lucide-react';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { getStatusLabel, formatCurrency, formatDate, getStatusBadgeClass } from '../../../utils/orderStatus';

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
              type="primary"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={handleViewAll}
              style={{ 
                backgroundColor: '#f97316', 
                borderColor: '#f97316',
                borderRadius: '8px'
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
          {orders.map((order) => {
            const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);
            
            return (
              <Card
                key={order.id}
                hoverable
                className="border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
                styles={{ 
                  body: { padding: '20px' },
                  header: { borderBottom: '1px solid #f0f0f0', padding: '16px 20px' }
                }}
              >
                <Row gutter={[16, 16]}>
                  {/* Order Info */}
                  <Col xs={24} lg={16}>
                    <Space direction="vertical" size="middle" className="w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Space size="middle">
                          <Space className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                            <Package className="w-4 h-4 text-orange-500" />
                            <Text className="text-xs font-medium text-gray-700">Mã đơn:</Text>
                            <Text code className="text-sm font-semibold text-gray-900">{order.id.slice(0, 8)}...</Text>
                          </Space>
                          <Tag className={getStatusBadgeClass(order.status)} style={{ margin: 0 }}>
                            {getStatusLabel(order.status)}
                          </Tag>
                        </Space>
                      </div>

                      {/* Statistics */}
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title={<><Calendar className="w-3 h-3 inline mr-1" />Ngày đặt</>}
                            value={formatDate(order.createdAt)}
                            valueStyle={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title={<><ShoppingBag className="w-3 h-3 inline mr-1" />Sản phẩm</>}
                            value={totalItems}
                            suffix="sản phẩm"
                            valueStyle={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title={<><Store className="w-3 h-3 inline mr-1" />Cửa hàng</>}
                            value={order.storeOrders.length}
                            suffix={order.storeOrders.length === 1 ? 'cửa hàng' : 'cửa hàng'}
                            valueStyle={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}
                          />
                        </Col>
                      </Row>
                    </Space>
                  </Col>

                  {/* Total Amount & Action */}
                  <Col xs={24} lg={8}>
                    <div className="flex flex-col items-end lg:items-start gap-4 h-full">
                      <Card
                        className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 w-full"
                        styles={{ body: { padding: '16px' } }}
                      >
                        <Statistic
                          title={<Text className="text-gray-600">Tổng tiền</Text>}
                          value={order.grandTotal}
                          formatter={(value) => formatCurrency(Number(value))}
                          valueStyle={{ 
                            fontSize: '20px', 
                            fontWeight: 700, 
                            color: '#ea580c' 
                          }}
                          prefix={<DollarSign className="w-4 h-4" />}
                        />
                      </Card>
                      <Button
                        type="primary"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => handleViewDetail(order.id)}
                        block
                        size="large"
                        style={{ 
                          backgroundColor: '#f97316', 
                          borderColor: '#f97316',
                          borderRadius: '8px',
                          height: '40px'
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
            );
          })}
          
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
    </Card>
  );
};

export default OrderHistory;


