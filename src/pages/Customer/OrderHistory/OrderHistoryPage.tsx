import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Select, 
  Pagination, 
  Empty, 
  Spin, 
  Space, 
  Typography, 
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import { Home, ShoppingBag, DollarSign, FileText } from 'lucide-react';
import Layout from '../../../components/Layout';
import { OrderCard, OrderDetailModal, OrderStatusTabs } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { formatCurrency } from '../../../utils/orderStatus';

const { Option } = Select;
const { Title, Text } = Typography;

const OrderHistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    orders,
    isLoading,
    error,
    selectedOrder,
    setSelectedOrder,
    viewDetail,
    reload,
    total,
    ghnOrderData,
  } = useOrderHistory();


  // Auto-open order detail modal if orderId is passed via navigation state
  useEffect(() => {
    const state = location.state as { orderId?: string } | null;
    if (state?.orderId) {
      viewDetail(state.orderId);
      // Clear the state to avoid reopening on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, viewDetail, navigate]);

  // Calculate statistics
  const totalAmount = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  const totalItems = orders.reduce((sum, order) => {
    if (!order.storeOrders || !Array.isArray(order.storeOrders)) {
      return sum;
    }
    const orderItems = order.storeOrders.reduce((s, so) => {
      if (!so.items || !Array.isArray(so.items)) {
        return s;
      }
      return s + so.items.reduce((i, item) => i + (item.quantity || 0), 0);
    }, 0);
    return sum + orderItems;
  }, 0);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            className="mb-6"
            items={[
              { 
                title: (
                  <Space>
                    <Home className="w-4 h-4" />
                    <span>Tài khoản</span>
                  </Space>
                )
              },
              { title: 'Đơn hàng của tôi' },
            ]}
            style={{ fontSize: '14px' }}
          />

          <div className="space-y-6">
            {/* Header */}
            <div>
              <Title level={2} className="!mb-2 !text-gray-900">Đơn hàng của tôi</Title>
              <Text type="secondary" className="text-base">
                Quản lý và theo dõi tất cả đơn hàng của bạn
              </Text>
            </div>

            {/* Statistics Cards - Shopee Style */}
            {!isLoading && orders.length > 0 && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #FF6A00',
                    }}
                  >
                    <Statistic
                      title={<><FileText className="w-4 h-4 inline mr-1" />Tổng đơn hàng</>}
                      value={total || 0}
                      valueStyle={{ color: '#FF6A00', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #2D9CDB',
                    }}
                  >
                    <Statistic
                      title={<><ShoppingBag className="w-4 h-4 inline mr-1" />Tổng sản phẩm</>}
                      value={totalItems}
                      suffix="sản phẩm"
                      valueStyle={{ color: '#2D9CDB', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #27AE60',
                    }}
                  >
                    <Statistic
                      title={<><DollarSign className="w-4 h-4 inline mr-1" />Tổng giá trị</>}
                      value={totalAmount}
                      formatter={(value) => formatCurrency(Number(value))}
                      valueStyle={{ color: '#27AE60', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Status Tabs Section - Horizontal Tabs Style */}
            <OrderStatusTabs
              value={status}
              onChange={setStatus}
              search={search}
              onSearchChange={setSearch}
            />

            {/* Orders List */}
            {isLoading ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div className="py-16 text-center">
                  <Spin size="large" style={{ color: '#FF6A00' }} />
                  <p className="mt-4 text-gray-500 text-base">Đang tải đơn hàng...</p>
                </div>
              </Card>
            ) : error ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div className="py-8 text-center">
                  <Text type="danger" className="text-base">{error}</Text>
                </div>
              </Card>
            ) : orders.length === 0 ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p className="text-gray-600 font-medium text-base mb-1">Chưa có đơn hàng nào</p>
                      <p className="text-sm text-gray-500">
                        {search || status !== 'ALL' 
                          ? 'Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.' 
                          : 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!'}
                      </p>
                    </div>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    ghnOrderData={ghnOrderData}
                    onOrderCancelled={reload}
                  />
                ))}
              </div>
            )}

            {/* Pagination & Page Size Selector */}
            {orders.length > 0 && (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                styles={{ 
                  body: { padding: '20px 24px' }
                }}
              >
                <Row gutter={[24, 16]} align="middle" justify="space-between">
                  {/* Page Size Selector */}
                  <Col xs={24} sm={12} md={8}>
                    <Space size="middle" className="w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-700">Hiển thị:</Text>
                        <Select
                          value={pageSize}
                          onChange={setPageSize}
                          style={{ 
                            width: 150, 
                            borderRadius: '8px',
                            minWidth: '150px'
                          }}
                          size="large"
                        >
                          <Option value={5}>5 đơn hàng</Option>
                          <Option value={10}>10 đơn hàng</Option>
                          <Option value={15}>15 đơn hàng</Option>
                          <Option value={20}>20 đơn hàng</Option>
                        </Select>
                        <Text className="text-sm text-gray-500 hidden sm:inline">/ trang</Text>
                      </div>
                    </Space>
                  </Col>

                  {/* Pagination */}
                  <Col xs={24} sm={12} md={16}>
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                      {/* Total Info */}
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <Text className="text-sm text-gray-600">
                          Trang <strong className="text-gray-900">{page}</strong> / <strong className="text-gray-900">{totalPages}</strong>
                        </Text>
                        <Divider type="vertical" style={{ height: '16px', margin: '0 8px' }} />
                        <Text className="text-sm text-gray-600">
                          Tổng: <strong className="text-orange-600">{total || 0}</strong> đơn hàng
                        </Text>
                      </div>

                      {/* Pagination Component */}
                      {totalPages > 1 && (
                        <Pagination
                          current={page}
                          total={totalPages * pageSize}
                          pageSize={pageSize}
                          onChange={(newPage) => setPage(newPage)}
                          showSizeChanger={false}
                          showQuickJumper={totalPages > 5}
                          showTotal={(total, range) => (
                            <span className="text-sm text-gray-600 hidden lg:inline">
                              Hiển thị <strong className="text-gray-900">{range[0]}-{range[1]}</strong> của <strong className="text-gray-900">{total}</strong> đơn hàng
                            </span>
                          )}
                          style={{ 
                            textAlign: 'right',
                          }}
                          className="custom-pagination"
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        ghnOrderData={ghnOrderData}
        onOrderCancelled={reload}
      />
    </Layout>
  );
};

export default OrderHistoryPage;

