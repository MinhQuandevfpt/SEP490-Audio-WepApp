import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Descriptions, List, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StoreOrder } from '../../types/seller';
import { StaffOrderService } from '../../services/staff/OrdersService';
import { formatCurrency, getStatusLabel } from '../../utils/orderStatus';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const { Text } = Typography;

const StaffOrderTable: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StoreOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 20, total: 0 });

  const load = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await StaffOrderService.getOrders({ page: page - 1, size });
      setData(res.items || []);
      setPagination({ current: page, pageSize: size, total: res.totalElements || 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, 20);
  }, []);

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
          <div className="text-xs text-gray-500">{/* optional phone if available */}{(record as any).customerPhone || ''}</div>
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
        const anyR = r as any;
        const top = `${anyR.shipReceiverName || ''} ${anyR.shipPhoneNumber ? '- ' + anyR.shipPhoneNumber : ''}`.trim();
        const addr = [anyR.shipStreet, anyR.shipWard, anyR.shipDistrict, anyR.shipProvince].filter(Boolean).join(', ');
        return (
          <div className="max-w-xs truncate">
            {top}
            <div className="text-xs text-gray-500 truncate">{addr}</div>
          </div>
        );
      }
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
          const r: any = record as any;
          const addr = [r.shipStreet, r.shipWard, r.shipDistrict, r.shipProvince].filter(Boolean).join(', ');
          return (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Descriptions title="Thông tin khách hàng" size="small" column={1} bordered>
                    <Descriptions.Item label="Tên">{r.customerName}</Descriptions.Item>
                    <Descriptions.Item label="SĐT">{r.customerPhone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú KH">{r.customerMessage || '-'}</Descriptions.Item>
                  </Descriptions>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Descriptions title="Giao hàng" size="small" column={1} bordered>
                    <Descriptions.Item label="Người nhận">{r.shipReceiverName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="SĐT nhận">{r.shipPhoneNumber || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">{addr || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú">{r.shipNote || '-'}</Descriptions.Item>
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


