import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Descriptions, Button, message, List } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Package, Truck } from 'lucide-react';
import type { DeliveryAssignment } from '../../services/staff/OrdersService';
import { StaffOrderService } from '../../services/staff/OrdersService';
import { getStatusLabel, formatCurrency } from '../../utils/orderStatus';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const { Text } = Typography;

const StaffOrderTable: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeliveryAssignment[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 20, total: 0 });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [processingActions, setProcessingActions] = useState<Map<string, string>>(new Map()); // storeOrderId -> action type

  const load = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await StaffOrderService.getOrders({ page: page - 1, size, sort: 'assignedAt' });
      setData(res.content || []);
      setPagination({ current: page, pageSize: size, total: res.totalElements || 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (storeOrderId: string) => {
    setProcessingIds(prev => new Set(prev).add(storeOrderId));
    setProcessingActions(prev => new Map(prev).set(storeOrderId, 'ready'));
    try {
      const response = await StaffOrderService.markAsReadyForDelivery(storeOrderId);
      message.success(response.message || 'Đã đánh dấu sẵn sàng giao hàng thành công');
      // Refresh danh sách
      await load(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error?.message || 'Không thể đánh dấu sẵn sàng giao hàng');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeOrderId);
        return newSet;
      });
      setProcessingActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(storeOrderId);
        return newMap;
      });
    }
  };

  const handleOutForDelivery = async (storeOrderId: string) => {
    setProcessingIds(prev => new Set(prev).add(storeOrderId));
    setProcessingActions(prev => new Map(prev).set(storeOrderId, 'out-for-delivery'));
    try {
      const response = await StaffOrderService.markAsOutForDelivery(storeOrderId);
      message.success(response.message || 'Đã đánh dấu đang giao hàng thành công');
      // Refresh danh sách
      await load(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error?.message || 'Không thể đánh dấu đang giao hàng');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeOrderId);
        return newSet;
      });
      setProcessingActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(storeOrderId);
        return newMap;
      });
    }
  };

  useEffect(() => {
    load(1, 20);
  }, []);

  const columns: ColumnsType<DeliveryAssignment> = [
    {
      title: 'Mã đơn',
      dataIndex: 'storeOrderId',
      key: 'storeOrderId',
      render: (id: string) => <Text code>{id.slice(0, 8)}</Text>,
    },
    {
      title: 'Người nhận',
      key: 'receiver',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-800">{record.shipReceiverName}</div>
          <div className="text-xs text-gray-500">{record.shipPhoneNumber}</div>
        </div>
      )
    },
    {
      title: 'Ngày phân công',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: (v: string) => new Date(v).toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => {
        const label = getStatusLabel(status as any);
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
        return <Tag color={colorMap[status] || 'default'}>{label}</Tag>;
      }
    },
    {
      title: 'Nhân viên giao',
      key: 'deliveryStaff',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-800">{record.deliveryStaffName}</div>
          <div className="text-xs text-gray-500">Chuẩn bị: {record.preparedByName}</div>
        </div>
      )
    },
    {
      title: 'Thời gian',
      key: 'timeline',
      render: (_, record) => (
        <div className="text-xs">
          {record.pickUpAt && (
            <div className="text-gray-600">Lấy: {new Date(record.pickUpAt).toLocaleString('vi-VN')}</div>
          )}
          {record.deliveredAt && (
            <div className="text-green-600">Giao: {new Date(record.deliveredAt).toLocaleString('vi-VN')}</div>
          )}
          {!record.pickUpAt && !record.deliveredAt && (
            <div className="text-gray-400">Chưa lấy hàng</div>
          )}
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      key: 'orderTotal',
      render: (_, record) => (
        <div className="font-semibold text-orange-600">
          {formatCurrency(record.orderTotal || 0)}
        </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const isReadyForPickup = record.orderStatus === 'READY_FOR_PICKUP';
        const isReadyForDelivery = record.orderStatus === 'READY_FOR_DELIVERY';
        const isProcessing = processingIds.has(record.storeOrderId);
        const currentAction = processingActions.get(record.storeOrderId);
        const isProcessingReady = isProcessing && currentAction === 'ready';
        const isProcessingOutForDelivery = isProcessing && currentAction === 'out-for-delivery';
        
        return (
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<Package className="w-4 h-4" />}
              onClick={() => handleMarkAsReady(record.storeOrderId)}
              disabled={!isReadyForPickup || isProcessing}
              loading={isProcessingReady}
              size="small"
              title={!isReadyForPickup ? 'Chỉ có thể xuất kho khi đơn hàng ở trạng thái "Kho đang chuẩn bị"' : 'Đánh dấu sẵn sàng giao hàng'}
            >
              Xuất kho
            </Button>
            <Button
              type="primary"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => handleOutForDelivery(record.storeOrderId)}
              disabled={!isReadyForDelivery || isProcessing}
              loading={isProcessingOutForDelivery}
              size="small"
              title={!isReadyForDelivery ? 'Chỉ có thể giao đơn hàng khi đơn hàng ở trạng thái "Chờ giao hàng"' : 'Đánh dấu đang giao hàng'}
            >
              Giao đơn hàng
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      rowKey={(r) => r.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      expandable={{
        expandRowByClick: true,
        expandedRowRender: (record) => {
          return (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Descriptions title="Thông tin phân công" size="small" column={1} bordered>
                    <Descriptions.Item label="Mã đơn hàng">
                      <Text code>{record.storeOrderId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={record.orderStatus === 'DELIVERY_SUCCESS' ? 'green' : 'default'}>
                        {getStatusLabel(record.orderStatus as any)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày phân công">
                      {new Date(record.assignedAt).toLocaleString('vi-VN')}
                    </Descriptions.Item>
                    {record.pickUpAt && (
                      <Descriptions.Item label="Ngày lấy hàng">
                        {new Date(record.pickUpAt).toLocaleString('vi-VN')}
                      </Descriptions.Item>
                    )}
                    {record.deliveredAt && (
                      <Descriptions.Item label="Ngày giao hàng">
                        {new Date(record.deliveredAt).toLocaleString('vi-VN')}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Descriptions title="Thông tin nhân viên" size="small" column={1} bordered>
                    <Descriptions.Item label="Nhân viên giao hàng">
                      {record.deliveryStaffName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhân viên chuẩn bị">
                      {record.preparedByName}
                    </Descriptions.Item>
                    {record.note && (
                      <Descriptions.Item label="Ghi chú">
                        {record.note}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              </div>

              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <Descriptions title="Thông tin người nhận" size="small" column={1} bordered>
                  <Descriptions.Item label="Tên người nhận">
                    {record.shipReceiverName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {record.shipPhoneNumber}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                <Descriptions title="Thông tin đơn hàng" size="small" column={1} bordered>
                  <Descriptions.Item label="Tổng tiền đơn hàng">
                    <span className="font-semibold text-orange-600 text-lg">
                      {formatCurrency(record.orderTotal || 0)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng sản phẩm">
                    {record.items?.length || 0} sản phẩm
                  </Descriptions.Item>
                </Descriptions>
                
                {record.items && record.items.length > 0 && (
                  <div className="mt-4">
                    <Typography.Text strong className="block mb-2">Danh sách sản phẩm</Typography.Text>
                    <List
                      size="small"
                      bordered
                      dataSource={record.items}
                      renderItem={(item) => (
                        <List.Item>
                          <div className="w-full">
                            <div className="flex justify-between items-start mb-1">
                              <Typography.Text strong className="text-sm">
                                {item.name}
                              </Typography.Text>
                              <Typography.Text className="text-sm font-semibold text-orange-600">
                                {formatCurrency(item.lineTotal)}
                              </Typography.Text>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Số lượng: {item.quantity}</span>
                              <span>Đơn giá: {formatCurrency(item.unitPrice)}</span>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        },
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: (page, pageSize) => load(page, pageSize),
        showSizeChanger: true
      }}
    />
  );
};

export default StaffOrderTable;


