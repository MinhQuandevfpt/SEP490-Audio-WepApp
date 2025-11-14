import React, { useState, useMemo } from 'react';
import { Button, Card, Divider, List, Tag, Typography, Collapse, Space, Row, Col, Badge, Modal, Input, Form } from 'antd';
import type { CollapseProps } from 'antd';
import { Calendar, MapPin, Package, Phone, ShieldCheck, ChevronDown, Plus } from 'lucide-react';
import type { StoreOrder } from '../../types/seller';
import type { Warranty } from '../../types/api';
import { formatCurrency, getStatusLabel, formatDate } from '../../utils/orderStatus';
import { SellerWarrantyService } from '../../services/seller/WarrantyService';
import { showCenterSuccess, showCenterError } from '../../utils/notification';

const { TextArea } = Input;

interface WarrantyOrderCardProps {
  order: StoreOrder;
  warranties?: Warranty[]; // Array of warranties for this order (one per product)
  onActivate: (order: StoreOrder) => void;
  isActivating?: boolean;
  activatingOrderId?: string | null;
  onSerialAdded?: () => void; // Callback to refresh data after adding serial
}

const WarrantyOrderCard: React.FC<WarrantyOrderCardProps> = ({ 
  order, 
  warranties = [],
  onActivate, 
  isActivating = false,
  activatingOrderId = null,
  onSerialAdded
}) => {
  const [form] = Form.useForm();
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [isSubmittingSerial, setIsSubmittingSerial] = useState(false);

  const isThisOrderActivating = isActivating && activatingOrderId === order.id;
  // Only render if order status is DELIVERY_SUCCESS
  if (order.status !== 'DELIVERY_SUCCESS') {
    return null;
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusLabel = getStatusLabel(order.status);
  
  // Check warranty status for the order
  const hasWarranties = warranties.length > 0;
  const activatedWarranties = warranties.filter(w => w.id !== null && w.status === 'ACTIVE');
  const pendingWarranties = warranties.filter(w => w.id === null || w.status === 'PENDING_ACTIVATION');
  const isFullyActivated = hasWarranties && activatedWarranties.length === warranties.length && pendingWarranties.length === 0;
  const hasPendingWarranties = pendingWarranties.length > 0;

  // Create collapse items from warranties
  const collapseItems: CollapseProps['items'] = useMemo(() => {
    return warranties.map((warranty, index) => {
      const isActivated = warranty.id !== null && warranty.status === 'ACTIVE';
      const isPending = warranty.id === null || warranty.status === 'PENDING_ACTIVATION';
      
      return {
        key: warranty.id || `pending-${index}`,
        label: (
          <div className="flex items-center justify-between w-full pr-4">
            <Space>
              <Package className="w-4 h-4 text-orange-500" />
              <Typography.Text strong className="text-sm">
                {warranty.productName}
              </Typography.Text>
            </Space>
            <Space>
              {isActivated && (
                <Tag color="green" className="text-xs">Còn hiệu lực</Tag>
              )}
              {isPending && (
                <Tag color="orange" className="text-xs">Chờ kích hoạt</Tag>
              )}
            </Space>
          </div>
        ),
        children: (
          <Row gutter={[16, 12]} className="mt-2">
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Mã bảo hành
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-gray-400" />
                  {warranty.id ? (
                    <Typography.Text code className="text-sm font-medium">
                      {warranty.id}
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary" className="text-sm italic">
                      Chưa có mã
                    </Typography.Text>
                  )}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Số serial
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-gray-400" />
                  {warranty.serialNumber ? (
                    <Typography.Text className="text-sm font-medium font-mono">
                      {warranty.serialNumber}
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary" className="text-sm italic">
                      Chưa có số serial
                    </Typography.Text>
                  )}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Trạng thái
                </Typography.Text>
                <div>
                  <Tag 
                    color={
                      warranty.status === 'ACTIVE' ? 'green' : 
                      warranty.status === 'PENDING_ACTIVATION' ? 'orange' : 
                      'default'
                    }
                    className="text-xs"
                  >
                    {warranty.status === 'ACTIVE' ? 'Còn hiệu lực' : 
                     warranty.status === 'PENDING_ACTIVATION' ? 'Chờ kích hoạt' : 
                     warranty.status}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Ngày bắt đầu
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <Typography.Text className="text-sm">
                    {warranty.startDate ? formatDate(warranty.startDate) : 'Chưa kích hoạt'}
                  </Typography.Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Ngày hết hạn
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <Typography.Text className="text-sm">
                    {warranty.endDate ? formatDate(warranty.endDate) : 'Chưa kích hoạt'}
                  </Typography.Text>
                </div>
              </div>
            </Col>
            {warranty.policyCode && (
              <Col xs={24}>
                <div className="space-y-1 pt-2 border-t border-gray-200">
                  <Typography.Text type="secondary" className="text-xs block mb-1">
                    Mã chính sách
                  </Typography.Text>
                  <Typography.Text code className="text-sm font-medium">
                    {warranty.policyCode}
                  </Typography.Text>
                </div>
              </Col>
            )}
            {/* Add Serial Number Button */}
            {!warranty.serialNumber && warranty.id && (
              <Col xs={24}>
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<Plus className="w-3 h-3" />}
                    onClick={() => handleAddSerialClick(warranty)}
                    className="w-full"
                  >
                    Thêm số serial
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        ),
        className: `mb-2 ${
          isPending 
            ? 'bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100' 
            : 'bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100'
        } transition-colors`,
        style: {
          borderLeft: `4px solid ${isPending ? '#f97316' : '#1890ff'}`,
        },
      };
    });
  }, [warranties]);

  const handleAddSerialClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setIsSerialModalOpen(true);
    form.resetFields();
  };

  const handleSerialModalCancel = () => {
    setIsSerialModalOpen(false);
    setSelectedWarranty(null);
    form.resetFields();
  };

  const handleSerialSubmit = async (values: { serialNumber: string; note?: string }) => {
    if (!selectedWarranty || !selectedWarranty.id) {
      showCenterError('Không tìm thấy thông tin bảo hành', 'Lỗi');
      return;
    }

    try {
      setIsSubmittingSerial(true);
      await SellerWarrantyService.activateSerialNumber(
        selectedWarranty.id,
        values.serialNumber.trim(),
        values.note?.trim()
      );
      showCenterSuccess(
        'Thêm số serial thành công',
        `Số serial ${values.serialNumber} đã được thêm cho sản phẩm ${selectedWarranty.productName}`
      );
      handleSerialModalCancel();
      // Call callback to refresh data
      if (onSerialAdded) {
        onSerialAdded();
      }
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể thêm số serial', 'Lỗi');
    } finally {
      setIsSubmittingSerial(false);
    }
  };

  return (
    <Card
      className="border border-gray-200 hover:border-orange-400 transition-colors shadow-sm"
      styles={{ body: { padding: 24 } }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="flex-1 space-y-4">
          {/* Header with Order Status and Warranty Status */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Tag color="green" className="text-sm">{statusLabel}</Tag>
            {isFullyActivated && (
              <Tag color="blue" icon={<ShieldCheck className="w-3 h-3" />} className="text-sm">
                Đã kích hoạt bảo hành
              </Tag>
            )}
            {hasPendingWarranties && (
              <Tag color="orange" icon={<ShieldCheck className="w-3 h-3" />} className="text-sm">
                Chờ kích hoạt bảo hành
              </Tag>
            )}
            {hasWarranties && (
              <Badge 
                count={warranties.length} 
                showZero 
                style={{ backgroundColor: '#1890ff' }}
                title={`${warranties.length} sản phẩm có bảo hành`}
              >
                <Tag color="default" className="text-sm">
                  {warranties.length} bảo hành
                </Tag>
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
              <Calendar className="w-4 h-4" />
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          {/* Warranties Collapse Section */}
          {hasWarranties && warranties.length > 0 && (
            <div className="mb-4">
              <Typography.Text strong className="text-sm text-gray-700 mb-2 block">
                Thông tin bảo hành sản phẩm
              </Typography.Text>
              <Collapse
                ghost
                items={collapseItems}
                expandIcon={({ isActive }) => (
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} 
                  />
                )}
                className="warranty-collapse"
                style={{ 
                  background: 'transparent',
                }}
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Typography.Text className="text-sm font-semibold text-gray-700">
                Khách hàng
              </Typography.Text>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">{order.customerName}</div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {order.customerPhone || '—'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Typography.Text className="text-sm font-semibold text-gray-700">
                Địa chỉ giao hàng
              </Typography.Text>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>
                  {[order.shipStreet, order.shipWard, order.shipDistrict, order.shipProvince]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            </div>
          </div>

          <Divider className="my-2" />

          <div>
            <Typography.Text className="text-sm font-semibold text-gray-700">
              Sản phẩm ({totalItems})
            </Typography.Text>
            <List
              dataSource={order.items}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ padding: '8px 0' }}>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-gray-500">× {item.quantity}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có sản phẩm' }}
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:min-w-[220px]">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tổng tiền</span>
              <span className="font-semibold text-gray-900">{formatCurrency(order.grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
          </div>
          {!isFullyActivated ? (
            <Button
              type="primary"
              size="large"
              onClick={() => onActivate(order)}
              className="w-full"
              loading={isThisOrderActivating}
              disabled={isThisOrderActivating}
              icon={!isThisOrderActivating && <ShieldCheck className="w-4 h-4" />}
            >
              {isThisOrderActivating ? 'Đang kích hoạt...' : 'Kích hoạt bảo hành'}
            </Button>
          ) : (
            <Button
              type="default"
              size="large"
              className="w-full"
              disabled
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Đã kích hoạt bảo hành
            </Button>
          )}
        </div>
      </div>

      {/* Modal for adding serial number */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span>Thêm số serial cho sản phẩm</span>
          </div>
        }
        open={isSerialModalOpen}
        onCancel={handleSerialModalCancel}
        footer={null}
        width={520}
      >
        {selectedWarranty && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Typography.Text type="secondary" className="text-xs block mb-1">
                Sản phẩm
              </Typography.Text>
              <Typography.Text strong className="text-sm">
                {selectedWarranty.productName}
              </Typography.Text>
              {selectedWarranty.id && (
                <div className="mt-2">
                  <Typography.Text type="secondary" className="text-xs block mb-1">
                    Mã bảo hành
                  </Typography.Text>
                  <Typography.Text code className="text-xs">
                    {selectedWarranty.id}
                  </Typography.Text>
                </div>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSerialSubmit}
              autoComplete="off"
            >
              <Form.Item
                label={<span className="text-sm font-medium">Số serial <span className="text-red-500">*</span></span>}
                name="serialNumber"
                rules={[
                  { required: true, message: 'Vui lòng nhập số serial' },
                  { whitespace: true, message: 'Số serial không được để trống' },
                ]}
              >
                <Input
                  placeholder="Nhập số serial của sản phẩm"
                  size="large"
                  className="font-mono"
                  maxLength={100}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium">Ghi chú (tùy chọn)</span>}
                name="note"
              >
                <TextArea
                  placeholder="Nhập ghi chú (nếu có)"
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={handleSerialModalCancel}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmittingSerial}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {isSubmittingSerial ? 'Đang thêm...' : 'Thêm số serial'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default WarrantyOrderCard;


