import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Typography, List, Divider } from 'antd';
import {
  WarrantySummary,
  WarrantyOrderList,
} from '../../../components/StoreOwnerWarrantyComponents';
import type { StoreOrder } from '../../../types/seller';
import type { Warranty } from '../../../types/api';
import { StoreOrderService } from '../../../services/seller/OrderService';
import { SellerWarrantyService } from '../../../services/seller/WarrantyService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import { formatCurrency } from '../../../utils/orderStatus';

const { Title, Paragraph, Text } = Typography;

// Extended warranty with order information
interface WarrantyWithOrder extends Warranty {
  storeOrderId: string;
  orderCreatedAt: string;
  orderGrandTotal: number;
}

const StoreOwnerWarranty: React.FC = () => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [warranties, setWarranties] = useState<WarrantyWithOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const loadWarranties = useCallback(async (term?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Get orders with DELIVERY_SUCCESS status
      const keyword = term && term.trim().length > 0 ? term.trim() : undefined;
      const response = await StoreOrderService.getOrders({
        status: 'DELIVERY_SUCCESS',
        search: keyword,
        orderCodeKeyword: keyword,
        page: 0,
        size: 50,
      });

      const deliverySuccessOrders = response.data;
      setOrders(deliverySuccessOrders);

      // Step 2: For each order, get warranties
      const allWarranties: WarrantyWithOrder[] = [];
      
      await Promise.all(
        deliverySuccessOrders.map(async (order) => {
          try {
            const orderWarranties = await SellerWarrantyService.getWarrantiesByStoreOrder(order.id);
            // Add order information to each warranty
            const warrantiesWithOrder = orderWarranties.map((warranty) => ({
              ...warranty,
              storeOrderId: order.id,
              orderCreatedAt: order.createdAt,
              orderGrandTotal: order.grandTotal,
            }));
            allWarranties.push(...warrantiesWithOrder);
          } catch (err) {
            // If order has no warranties yet, skip it
            console.warn(`No warranties found for order ${order.id}`);
          }
        })
      );

      setWarranties(allWarranties);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bảo hành');
      setOrders([]);
      setWarranties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (value === '') {
      loadWarranties();
    }
  };

  const handleSearch = (value: string) => {
    const cleaned = value.trim();
    setSearchValue(cleaned);
    loadWarranties(cleaned);
  };

  const handleRefresh = () => {
    loadWarranties(searchValue);
  };

  const handleActivate = (order: StoreOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleConfirmActivation = async () => {
    if (!selectedOrder) return;
    try {
      setIsActivating(true);
      await SellerWarrantyService.activateWarrantyByStoreOrder(selectedOrder.id);
      showCenterSuccess(
        'Kích hoạt bảo hành thành công',
        `Đơn hàng ${selectedOrder.id.slice(0, 8)} đã được chuyển tới hệ thống bảo hành.`
      );
      closeModal();
      loadWarranties(searchValue);
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể kích hoạt bảo hành', 'Lỗi');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Title level={2} className="!mb-0">
          Bảo hành sản phẩm
        </Title>
        <Paragraph className="text-gray-500 !mb-0">
          Theo dõi các đơn hàng đã giao thành công và kích hoạt bảo hành cho khách hàng ngay tại đây.
        </Paragraph>
      </div>

      <WarrantySummary orders={orders} warranties={warranties} />

      <WarrantyOrderList
        orders={orders}
        warranties={warranties}
        isLoading={isLoading}
        error={error}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onActivate={handleActivate}
        isActivating={isActivating}
        activatingOrderId={selectedOrder?.id || null}
        onSerialAdded={handleRefresh}
      />

      <Modal
        open={isModalOpen}
        title="Kích hoạt bảo hành"
        okText="Xác nhận kích hoạt"
        cancelText="Hủy"
        confirmLoading={isActivating}
        onCancel={closeModal}
        onOk={handleConfirmActivation}
        width={640}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div>
              <Paragraph className="font-medium text-gray-800 !mb-1">
                Đơn hàng {selectedOrder.id.slice(0, 8)}
              </Paragraph>
              <Text className="text-sm text-gray-500">
                Khách hàng: {selectedOrder.customerName} · SĐT: {selectedOrder.customerPhone || '—'}
              </Text>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Giá trị đơn hàng</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedOrder.grandTotal)}
                </span>
              </div>
            </div>

            <div>
              <Text className="font-medium text-gray-700">Sản phẩm</Text>
              <List
                dataSource={selectedOrder.items}
                renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <div className="flex w-full justify-between text-sm">
                      <span className="font-medium text-gray-800">
                        {item.name}{' '}
                        <span className="text-gray-500 font-normal">× {item.quantity}</span>
                      </span>
                      <span className="text-gray-700">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: 'Không có sản phẩm' }}
              />
            </div>

            <Divider className="my-0" />

            <Paragraph className="text-sm text-gray-500 !mb-0">
              Sau khi xác nhận, thông tin bảo hành sẽ được tạo và gửi tới khách hàng.
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StoreOwnerWarranty;

