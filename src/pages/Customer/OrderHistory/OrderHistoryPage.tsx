import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Card, 
  Select, 
  Input, 
  Button, 
  Pagination, 
  Empty, 
  Spin, 
  Modal, 
  message, 
  Space, 
  Typography, 
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import { Home, Package, ShoppingBag, DollarSign, FileText } from 'lucide-react';
import Layout from '../../../components/Layout';
import { OrderCard, OrderDetailModal, OrderFilterTabs } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import { formatCurrency } from '../../../utils/orderStatus';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const OrderHistoryPage: React.FC = () => {
  const location = useLocation();
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

  // Cancel modal state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelTargetStatus, setCancelTargetStatus] = useState<string | null>(null); // Track order status for cancel type
  const [cancelReason, setCancelReason] = useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Auto-open order detail modal if orderId is passed via navigation state
  useEffect(() => {
    const state = location.state as { orderId?: string } | null;
    if (state?.orderId) {
      viewDetail(state.orderId);
      // Clear the state to avoid reopening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, viewDetail]);

  // Calculate statistics
  const totalAmount = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const totalItems = orders.reduce((sum, order) => {
    const orderItems = order.storeOrders.reduce((s, so) => 
      s + so.items.reduce((i, item) => i + item.quantity, 0), 0
    );
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

            {/* Statistics Cards */}
            {!isLoading && orders.length > 0 && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card className="border-gray-200 shadow-sm">
                    <Statistic
                      title={<><FileText className="w-4 h-4 inline mr-1" />Tổng đơn hàng</>}
                      value={total || 0}
                      valueStyle={{ color: '#f97316', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="border-gray-200 shadow-sm">
                    <Statistic
                      title={<><ShoppingBag className="w-4 h-4 inline mr-1" />Tổng sản phẩm</>}
                      value={totalItems}
                      suffix="sản phẩm"
                      valueStyle={{ color: '#3b82f6', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="border-gray-200 shadow-sm">
                    <Statistic
                      title={<><DollarSign className="w-4 h-4 inline mr-1" />Tổng giá trị</>}
                      value={totalAmount}
                      formatter={(value) => formatCurrency(Number(value))}
                      valueStyle={{ color: '#10b981', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Filter Section */}
            <Card className="border-gray-200 shadow-sm">
              <OrderFilterTabs
                value={status}
                onChange={setStatus}
                search={search}
                onSearchChange={setSearch}
              />
            </Card>

            {/* Orders List */}
            {isLoading ? (
              <Card className="border-gray-200 shadow-sm">
                <div className="py-16 text-center">
                  <Spin size="large" style={{ color: '#f97316' }} />
                  <p className="mt-4 text-gray-500 text-base">Đang tải đơn hàng...</p>
                </div>
              </Card>
            ) : error ? (
              <Card className="border-gray-200 shadow-sm">
                <div className="py-8 text-center">
                  <Text type="danger" className="text-base">{error}</Text>
                </div>
              </Card>
            ) : (
              <Space direction="vertical" size="large" className="w-full">
                {orders.map(order => (
                  <div key={order.id}>
                    <OrderCard order={order} ghnOrderData={ghnOrderData} />
                    {(order.status === 'PENDING' || order.status === 'AWAITING_SHIPMENT') && (
                      <Card 
                        className="mt-3 border-orange-200 bg-orange-50"
                        styles={{ body: { padding: '12px 16px' } }}
                      >
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="large"
                            onClick={() => {
                              setCancelTargetId(order.id);
                              setCancelTargetStatus(order.status);
                              setCancelReason('CHANGE_OF_MIND');
                              setCancelNote('');
                            }}
                            style={{ borderRadius: '8px' }}
                          >
                            {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
                {orders.length === 0 && (
                  <Card className="border-gray-200 shadow-sm">
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
                )}
              </Space>
            )}

            {/* Pagination & Page Size Selector */}
            {orders.length > 0 && (
              <Card 
                className="border-gray-200 shadow-sm"
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

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} ghnOrderData={ghnOrderData} />

      {/* Cancel Order Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-semibold">
              {cancelTargetStatus === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
            </span>
          </div>
        }
        open={!!cancelTargetId}
        onCancel={() => {
          if (!isCancelling) {
            setCancelTargetId(null);
            setCancelTargetStatus(null);
          }
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              if (!isCancelling) {
                setCancelTargetId(null);
                setCancelTargetStatus(null);
              }
            }} 
            disabled={isCancelling}
            size="large"
            style={{ borderRadius: '8px' }}
          >
            Đóng
          </Button>,
          <Button
            key="confirm"
            danger
            loading={isCancelling}
            size="large"
            onClick={async () => {
              if (!cancelTargetId) return;
              try {
                setIsCancelling(true);
                
                // Use different API based on order status
                if (cancelTargetStatus === 'AWAITING_SHIPMENT') {
                  await OrderHistoryService.requestCancel(cancelTargetId, cancelReason, cancelNote);
                  message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng. Vui lòng chờ cửa hàng xem xét.');
                } else {
                  await OrderHistoryService.cancel(cancelTargetId, cancelReason, cancelNote);
                  message.success('Hủy đơn hàng thành công');
                }
                
                setCancelTargetId(null);
                setCancelTargetStatus(null);
                await reload();
              } catch (err: any) {
                message.error(err?.message || (cancelTargetStatus === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy đơn hàng thất bại' : 'Hủy đơn hàng thất bại'));
              } finally {
                setIsCancelling(false);
              }
            }}
            style={{ borderRadius: '8px' }}
          >
            {cancelTargetStatus === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
          </Button>,
        ]}
        styles={{ 
          body: { padding: '24px' },
          header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }
        }}
      >
        <Space direction="vertical" size="large" className="w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Text type="secondary" className="text-sm">
              {cancelTargetStatus === 'AWAITING_SHIPMENT' ? (
                <>
                  <strong>Lưu ý:</strong> Đơn hàng đang ở trạng thái <strong>Chờ lấy hàng</strong>. 
                  Yêu cầu hủy đơn sẽ được gửi đến cửa hàng để xem xét. Cửa hàng sẽ quyết định có chấp nhận yêu cầu hủy hay không.
                </>
              ) : (
                <>
                  <strong>Lưu ý:</strong> Chỉ có thể hủy khi trạng thái đơn là <strong>PENDING</strong>.
                </>
              )}
            </Text>
          </div>
          
          <div>
            <Text strong className="block mb-2 text-base">Lý do hủy</Text>
            <Select
              value={cancelReason}
              onChange={setCancelReason}
              className="w-full"
              size="large"
              style={{ borderRadius: '8px' }}
            >
              <Option value="CHANGE_OF_MIND">Đổi ý</Option>
              <Option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</Option>
              <Option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</Option>
              <Option value="ORDERED_BY_ACCIDENT">Đặt nhầm</Option>
              <Option value="OTHER">Khác</Option>
            </Select>
          </div>
          
          <div>
            <Text strong className="block mb-2 text-base">Ghi chú</Text>
            <TextArea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder="VD: Đặt nhầm phiên bản, muốn đổi sang sản phẩm khác..."
              rows={4}
              style={{ borderRadius: '8px' }}
            />
            <Text type="secondary" className="text-xs mt-2 block">
              Ghi chú sẽ được gửi kèm yêu cầu hủy đơn hàng.
            </Text>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default OrderHistoryPage;

