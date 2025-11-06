import React, { useState } from 'react';
import { Table, Tag, Typography, Descriptions, List, Divider, Empty, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Package, Users } from 'lucide-react';
import { StoreOrderFilter, AssignDeliveryModal } from '../../../components/StoreOwnerOrderManagementComponents';
import useStoreOrders from '../../../hooks/useStoreOrders';
import type { StoreOrder } from '../../../types/seller';
import { formatCurrency, getStatusLabel } from '../../../utils/orderStatus';

const { Text } = Typography;

const OrderManageForStoreOwner: React.FC = () => {
  const {
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    orders,
    isLoading,
    error,
    total,
    refresh,
  } = useStoreOrders();

  const [assignModalOrderId, setAssignModalOrderId] = useState<string | null>(null);

  const columns: ColumnsType<StoreOrder> = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id.slice(0, 8)}</Text>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (v: string, record) => (
        <div>
          <div className="font-medium text-gray-800">{v}</div>
          <div className="text-xs text-gray-500">{record.customerPhone || ''}</div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
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
        };
        return <Tag color={colorMap[status] || 'default'}>{label}</Tag>;
      }
    },
    {
      title: 'Tổng tiền',
      key: 'grandTotal',
      render: (_, r) => (
        <div>
          <div className="font-semibold text-gray-800">{formatCurrency(r.grandTotal)}</div>
          <div className="text-xs text-gray-500">SP: {r.items?.reduce((s, i) => s + i.quantity, 0) || 0}</div>
        </div>
      )
    },
    {
      title: 'Địa chỉ giao',
      key: 'shipAddress',
      render: (_, r) => {
        const addr = [r.shipStreet, r.shipWard, r.shipDistrict, r.shipProvince].filter(Boolean).join(', ');
        return (
          <div className="max-w-xs truncate">
            <div className="font-medium text-gray-800">{r.shipReceiverName}</div>
            <div className="text-xs text-gray-500 truncate">{addr}</div>
          </div>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Button
            type="primary"
            icon={<Users className="w-4 h-4" />}
            onClick={() => setAssignModalOrderId(record.id)}
            disabled={!isPending}
            size="small"
            title={!isPending ? 'Chỉ có thể phân công đơn hàng ở trạng thái "Chờ xử lý"' : 'Phân công nhân viên tiếp nhận'}
          >
            Phân công
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-1">Xem và quản lý tất cả đơn hàng của cửa hàng</p>
      </div>

      <StoreOrderFilter
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
      />

      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <Table
          rowKey={(r) => r.id}
          loading={isLoading}
          columns={columns}
          dataSource={orders}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => {
              const addr = [record.shipStreet, record.shipWard, record.shipDistrict, record.shipProvince].filter(Boolean).join(', ');
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Thông tin khách hàng" size="small" column={1} bordered>
                        <Descriptions.Item label="Tên">{record.customerName}</Descriptions.Item>
                        <Descriptions.Item label="SĐT">{record.customerPhone || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú KH">{record.customerMessage || '-'}</Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Giao hàng" size="small" column={1} bordered>
                        <Descriptions.Item label="Người nhận">{record.shipReceiverName || '-'}</Descriptions.Item>
                        <Descriptions.Item label="SĐT nhận">{record.shipPhoneNumber || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{addr || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{record.shipNote || '-'}</Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Thanh toán" size="small" column={1} bordered>
                        <Descriptions.Item label="Tạm tính">{formatCurrency(record.totalAmount)}</Descriptions.Item>
                        <Descriptions.Item label="Giảm giá">{formatCurrency(record.discountTotal)}</Descriptions.Item>
                        <Descriptions.Item label="Phí vận chuyển">{formatCurrency(record.shippingFee)}</Descriptions.Item>
                        <Descriptions.Item label="Tổng cộng">{formatCurrency(record.grandTotal)}</Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2">Sản phẩm ({record.items?.length || 0})</div>
                    <List
                      dataSource={record.items || []}
                      renderItem={(item: any) => (
                        <List.Item>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-500">SL: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                            </div>
                            <div className="text-right font-semibold">{formatCurrency(item.lineTotal)}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </div>
              );
            },
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
              }
            },
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '15', '20', '25'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div>
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                    <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.</p>
                  </div>
                }
              />
            ),
          }}
        />
      </div>

      {assignModalOrderId && (
        <AssignDeliveryModal
          orderId={assignModalOrderId}
          onClose={() => setAssignModalOrderId(null)}
          onSuccess={() => {
            refresh();
            setAssignModalOrderId(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderManageForStoreOwner;
