import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select, Input, message, Alert } from 'antd';
import type { CustomerOrder, OrderItem, ReturnReasonType } from '../../types/api';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';
import { formatCurrency } from '../../utils/orderStatus';

const { Option } = Select;
const { TextArea } = Input;

interface ReturnRequestModalProps {
  open: boolean;
  order: CustomerOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const reasonTypeOptions: { value: ReturnReasonType; label: string }[] = [
  { value: 'CUSTOMER_FAULT', label: 'Khách hàng lỗi' },
  { value: 'SHOP_FAULT', label: 'Lỗi từ cửa hàng' },
];

const mapOrderItems = (order: CustomerOrder | null): OrderItem[] => {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  if (Array.isArray(order.storeOrders) && order.storeOrders.length > 0) {
    return order.storeOrders.flatMap((storeOrder) => storeOrder.items || []);
  }
  return [];
};

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ open, order, onClose, onSuccess }) => {
  const orderItems = useMemo(() => mapOrderItems(order), [order]);
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [reasonType, setReasonType] = useState<ReturnReasonType>('CUSTOMER_FAULT');
  const [reason, setReason] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedItemId(orderItems[0]?.id);
      setReason('');
      setVideoUrl('');
      setImagesInput('');
      setReasonType('CUSTOMER_FAULT');
    }
  }, [open, orderItems]);

  const selectedItem = orderItems.find((item) => item.id === selectedItemId) || orderItems[0];
  const derivedPrice =
    selectedItem?.lineTotal ??
    selectedItem?.unitPrice ??
    order?.totalAmount ??
    order?.grandTotal ??
    0;

  const handleSubmit = async () => {
    if (!selectedItem) {
      message.warning('Vui lòng chọn sản phẩm cần hoàn trả');
      return;
    }
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do hoàn trả');
      return;
    }

    const imageUrls = imagesInput
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean);

    try {
      setSubmitting(true);
      await OrderHistoryService.requestReturn({
        orderItemId: selectedItem.id,
        productId: selectedItem.refId,
        itemPrice: derivedPrice,
        reasonType,
        reason: reason.trim(),
        customerVideoUrl: videoUrl.trim() || undefined,
        customerImageUrls: imageUrls.length ? imageUrls : undefined,
      });
      message.success('Đã gửi yêu cầu hoàn trả sản phẩm');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      message.error(error?.message || 'Không thể gửi yêu cầu hoàn trả');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Yêu cầu hoàn trả sản phẩm"
      open={open}
      onCancel={() => {
        if (!submitting) {
          onClose();
        }
      }}
      okText="Gửi yêu cầu"
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      {orderItems.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy sản phẩm hợp lệ trong đơn hàng này."
          description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
        />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</p>
            <Select
              value={selectedItem?.id}
              onChange={(value) => setSelectedItemId(value)}
              className="w-full"
              disabled={orderItems.length === 0}
            >
              {orderItems.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name} • SL: {item.quantity}
                </Option>
              ))}
            </Select>
            {selectedItem && (
              <p className="text-xs text-gray-500 mt-1">
                Mã sản phẩm: <span className="font-mono">{selectedItem.refId}</span>
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Giá trị hoàn trả</p>
            <Input value={formatCurrency(derivedPrice)} disabled />
            <p className="text-xs text-gray-500 mt-1">
              Sử dụng số tiền theo yêu cầu (từ totalAmount của đơn hoặc giá sản phẩm).
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Loại lý do</p>
            <Select value={reasonType} onChange={setReasonType} className="w-full">
              {reasonTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Lý do chi tiết</p>
            <TextArea
              rows={3}
              placeholder="Mô tả lý do hoàn trả sản phẩm..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Link video (tùy chọn)</p>
            <Input
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Link hình ảnh (tùy chọn)</p>
            <TextArea
              rows={3}
              placeholder="Nhập mỗi link trên một dòng hoặc phân tách bằng dấu phẩy"
              value={imagesInput}
              onChange={(e) => setImagesInput(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReturnRequestModal;


