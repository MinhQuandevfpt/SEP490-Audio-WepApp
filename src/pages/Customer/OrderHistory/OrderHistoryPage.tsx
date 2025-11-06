import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Select, Input, Button, Pagination, Empty, Spin, Modal, message, Space, Typography, Breadcrumb } from 'antd';
import { Home, Package, Search } from 'lucide-react';
import Layout from '../../../components/Layout';
import { OrderCard, OrderDetailModal } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

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
  } = useOrderHistory();

  // Cancel modal state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
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

  const statusOptions = [
    { value: 'ALL', label: 'Tất cả đơn hàng' },
    { value: 'UNPAID', label: 'Chờ thanh toán' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'AWAITING_SHIPMENT', label: 'Chờ lấy hàng' },
    { value: 'SHIPPING', label: 'Đang giao hàng' },
    { value: 'COMPLETED', label: 'Đã giao hàng' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
    { value: 'RETURNED', label: 'Đã trả hàng' },
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            className="mb-4"
            items={[
              { title: <><Home className="w-4 h-4 inline mr-1" />Tài khoản</> },
              { title: 'Đơn hàng của tôi' },
            ]}
          />

          <div className="space-y-4">
            <Title level={2} className="!mb-0">Đơn hàng của tôi</Title>
            
            <Card>
              <Space direction="vertical" size="middle" className="w-full">
                <Space className="w-full" size="middle" wrap>
                  <Select
                    value={status}
                    onChange={setStatus}
                    style={{ width: 250 }}
                    placeholder="Lọc theo trạng thái"
                  >
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                  
                  <Input
                    placeholder="Tìm theo mã đơn hàng..."
                    prefix={<Search className="w-4 h-4" />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                  />
                </Space>
              </Space>
            </Card>

            {isLoading ? (
              <Card>
                <div className="py-16 text-center">
                  <Spin size="large" style={{ color: '#f97316' }} />
                  <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
                </div>
              </Card>
            ) : error ? (
              <Card>
                <div className="p-3 text-center">
                  <Typography.Text type="danger">{error}</Typography.Text>
                </div>
              </Card>
            ) : (
              <Space direction="vertical" size="middle" className="w-full">
                {orders.map(order => (
                  <div key={order.id}>
                    <OrderCard order={order} />
                    {order.status === 'PENDING' && (
                      <div className="flex justify-end mt-2">
                        <Button
                          danger
                          onClick={() => {
                            setCancelTargetId(order.id);
                            setCancelReason('CHANGE_OF_MIND');
                            setCancelNote('');
                          }}
                        >
                          Hủy đơn hàng
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {orders.length === 0 && (
                  <Card>
                    <Empty
                      image={<Package className="w-16 h-16 text-gray-300 mx-auto" />}
                      description={
                        <div>
                          <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                          <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.</p>
                        </div>
                      }
                    />
                  </Card>
                )}
              </Space>
            )}

            {/* Pagination & Page Size Selector */}
            {orders.length > 0 && (
              <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Space>
                    <span className="text-sm text-gray-600">Hiển thị:</span>
                    <Select
                      value={pageSize}
                      onChange={setPageSize}
                      style={{ width: 120 }}
                    >
                      <Option value={5}>5 đơn hàng</Option>
                      <Option value={10}>10 đơn hàng</Option>
                      <Option value={15}>15 đơn hàng</Option>
                      <Option value={20}>20 đơn hàng</Option>
                    </Select>
                    <span className="text-sm text-gray-500">/ trang</span>
                  </Space>

                  {totalPages > 1 && (
                    <Pagination
                      current={page}
                      total={totalPages * pageSize}
                      pageSize={pageSize}
                      onChange={(newPage) => setPage(newPage)}
                      showSizeChanger={false}
                      showTotal={() => `Trang ${page} / ${totalPages}`}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* Cancel Order Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={!!cancelTargetId}
        onCancel={() => !isCancelling && setCancelTargetId(null)}
        footer={[
          <Button key="cancel" onClick={() => !isCancelling && setCancelTargetId(null)} disabled={isCancelling}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            danger
            loading={isCancelling}
            onClick={async () => {
              if (!cancelTargetId) return;
              try {
                setIsCancelling(true);
                await OrderHistoryService.cancel(cancelTargetId, cancelReason, cancelNote);
                message.success('Hủy đơn hàng thành công');
                setCancelTargetId(null);
                await reload();
              } catch (err: any) {
                message.error(err?.message || 'Hủy đơn hàng thất bại');
              } finally {
                setIsCancelling(false);
              }
            }}
          >
            Xác nhận hủy
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" className="w-full">
          <Typography.Text type="secondary">Chỉ có thể hủy khi trạng thái đơn là PENDING.</Typography.Text>
          
          <div>
            <Typography.Text strong className="block mb-2">Lý do hủy</Typography.Text>
            <Select
              value={cancelReason}
              onChange={setCancelReason}
              className="w-full"
            >
              <Option value="CHANGE_OF_MIND">Đổi ý</Option>
              <Option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</Option>
              <Option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</Option>
              <Option value="ORDERED_BY_ACCIDENT">Đặt nhầm</Option>
              <Option value="OTHER">Khác</Option>
            </Select>
          </div>
          
          <div>
            <Typography.Text strong className="block mb-2">Ghi chú</Typography.Text>
            <TextArea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder="VD: Đặt nhầm phiên bản"
              rows={4}
            />
            <Typography.Text type="secondary" className="text-xs mt-1 block">Ghi chú sẽ gửi kèm yêu cầu hủy.</Typography.Text>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default OrderHistoryPage;

