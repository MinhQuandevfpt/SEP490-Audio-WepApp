import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Empty, Spin, Typography, Space, Divider, Modal, Descriptions, List, message } from 'antd';
import { Package, ArrowRight, ExternalLink, Calendar, Store, Eye, ShoppingBag, DollarSign, MapPin, Phone, User2 } from 'lucide-react';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { getStatusLabel, formatCurrency, formatDate, getStatusBadgeClass } from '../../../utils/orderStatus';

const { Text, Title } = Typography;

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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
          {orders.map((order) => {
            const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);
            const displayOrderCode = order.orderCode ?? ' - ';
            
            return (
              <Card
                key={order.id}
                className="border-0 shadow-[0_3px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_18px_rgba(255,107,0,0.15)] hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  borderRadius: 16,
                  padding: 0,
                  background: '#fff'
                }}
              >
                <div className="flex flex-col gap-4 p-5">
                  {/* Header */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-3"
                    style={{
                      background: '#FFF0E1',
                      borderRadius: 12,
                      padding: '12px 16px'
                    }}
                  >
                    <Space size="small">
                      <Package className="w-4 h-4 text-orange-500" />
                      <Text className="text-sm font-medium text-gray-700">
                        Mã đơn:
                      </Text>
                      <Text code className="text-sm font-semibold text-gray-900">
                        {displayOrderCode}
                      </Text>
                    </Space>
                    <Tag
                      className={`${getStatusBadgeClass(order.status)} shadow-sm`}
                      style={{
                        margin: 0,
                        borderRadius: 12,
                        background: '#FFE7D4',
                        color: '#FF6B00',
                        border: 'none',
                        padding: '4px 12px',
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </Tag>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                        <Calendar className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">Ngày đặt</p>
                        <p className="text-sm font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                        <ShoppingBag className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">Sản phẩm</p>
                        <p className="text-sm font-medium text-gray-800">
                          {totalItems} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                        <Store className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">Cửa hàng</p>
                        <p className="text-sm font-medium text-gray-800">
                          {order.storeOrders.length} cửa hàng
                        </p>
                      </div>
                    </div>
                  </div>

                  <Divider style={{ margin: '4px 0 0', borderColor: '#FFE0C7' }} />

                  {/* Footer */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
                        Tổng tiền
                      </p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-[#FF6B00]">
                        <DollarSign className="w-5 h-5" />
                        {formatCurrency(order.grandTotal)}
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => handleViewDetail(order.id)}
                      size="large"
                      style={{
                        backgroundColor: '#FF6B00',
                        borderColor: '#FF6B00',
                        borderRadius: 12,
                        paddingInline: 28,
                        boxShadow: '0 10px 20px rgba(255,107,0,0.25)'
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
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

      <Modal
        title={
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-gray-900">Chi tiết đơn hàng</span>
            {detailOrder?.orderCode && (
              <span className="text-sm text-gray-500">Mã đơn: {detailOrder.orderCode}</span>
            )}
          </div>
        }
        open={isDetailModalOpen}
        onCancel={closeDetailModal}
        footer={null}
        centered
        width={720}
      >
        {isDetailLoading ? (
          <div className="py-12 text-center">
            <Spin size="large" style={{ color: '#f97316' }} />
          </div>
        ) : detailOrder ? (
          <Space direction="vertical" size="large" className="w-full">
            <div className="flex flex-wrap items-center gap-2">
              {detailOrder.status && (
                <Tag className={getStatusBadgeClass(detailOrder.status)}>{getStatusLabel(detailOrder.status)}</Tag>
              )}
              <span className="text-sm text-gray-500">
                {detailOrder.createdAt ? formatDate(detailOrder.createdAt) : '—'}
              </span>
            </div>

            <Descriptions
              column={1}
              size="small"
              bordered
              styles={{
                label: { fontWeight: 600, color: '#555' },
                content: { color: '#111' }
              }}
            >
              <Descriptions.Item label={<span className="flex items-center gap-1"><User2 className="w-4 h-4 text-orange-500" />Người nhận</span>}>
                {detailOrder.receiverName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="flex items-center gap-1"><Phone className="w-4 h-4 text-orange-500" />Số điện thoại</span>}>
                {detailOrder.phoneNumber || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-500" />Địa chỉ</span>}>
                {[
                  detailOrder.addressLine,
                  detailOrder.street,
                  detailOrder.ward,
                  detailOrder.district,
                  detailOrder.province
                ].filter(Boolean).join(', ') || '—'}
              </Descriptions.Item>
              {detailOrder.note && (
                <Descriptions.Item label="Ghi chú">{detailOrder.note}</Descriptions.Item>
              )}
            </Descriptions>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Tổng tiền hàng', value: formatCurrency(detailOrder.totalAmount ?? 0) },
                { label: 'Phí vận chuyển', value: formatCurrency(detailOrder.shippingFeeTotal ?? 0) },
                { label: 'Thành tiền', value: formatCurrency(detailOrder.grandTotal ?? 0), emphasize: true },
              ].map(info => (
                <Card
                  key={info.label}
                  className={`border rounded-xl ${info.emphasize ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'border-gray-100'}`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{info.label}</p>
                  <p className={`text-lg font-semibold ${info.emphasize ? 'text-[#FF6B00]' : 'text-gray-900'}`}>{info.value}</p>
                </Card>
              ))}
            </div>

            <Space direction="vertical" className="w-full">
              {detailOrder.storeOrders?.map(storeOrder => (
                <Card
                  key={storeOrder.id}
                  title={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold">{storeOrder.storeName}</p>
                        <p className="text-xs text-gray-500">Mã sub-order: {storeOrder.orderCode || ' - '}</p>
                      </div>
                      <Tag className={getStatusBadgeClass(storeOrder.status)}>{getStatusLabel(storeOrder.status)}</Tag>
                    </div>
                  }
                  className="border-gray-100 rounded-xl"
                >
                  <List
                    itemLayout="vertical"
                    dataSource={storeOrder.items || []}
                    renderItem={item => (
                      <List.Item>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">Số lượng: {item.quantity}</span>
                          <span className="text-sm text-gray-500">Đơn giá: {formatCurrency(item.unitPrice)}</span>
                          <span className="text-sm font-semibold text-gray-900">Thành tiền: {formatCurrency(item.lineTotal)}</span>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              ))}
            </Space>
          </Space>
        ) : (
          <Empty description="Không có dữ liệu đơn hàng" />
        )}
      </Modal>
    </Card>
  );
};

export default OrderHistory;


