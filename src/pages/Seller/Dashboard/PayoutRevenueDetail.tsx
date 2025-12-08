import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Button,
  Divider,
  Empty,
  Spin,
  Image,
} from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { Package, Truck } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { PayoutRevenueService } from '../../../services/seller/PayoutRevenueService';
import type { PayoutBill, PayoutBillItem, ShippingOrder, ReturnShipFee } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const { Title, Text } = Typography;

const PayoutRevenueDetail: React.FC = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [payoutBill, setPayoutBill] = useState<PayoutBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayoutBillDetail = useCallback(async () => {
    if (!billId) return;
    
    setIsLoading(true);
    try {
      const data = await PayoutRevenueService.getPayoutBillDetail(billId);
      setPayoutBill(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tải chi tiết hóa đơn thanh toán';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    if (billId) {
      fetchPayoutBillDetail();
    }
  }, [billId, fetchPayoutBillDetail]);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  const formatDateTime = useCallback((dateTime: string): string => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      PENDING: {
        color: 'warning',
        text: 'Chờ thanh toán',
        icon: <ClockCircleOutlined />
      },
      PAID: {
        color: 'success',
        text: 'Đã thanh toán',
        icon: <CheckCircleOutlined />
      },
      CANCELED: {
        color: 'error',
        text: 'Đã hủy',
        icon: <CloseCircleOutlined />
      }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontSize: '14px', padding: '4px 12px' }}>
        {config.text}
      </Tag>
    );
  };

  // Table columns for items
  const itemColumns: ColumnsType<PayoutBillItem> = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 300,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'storeOrderId',
      key: 'storeOrderId',
      width: 200,
      render: (text) => (
        <Text code copyable style={{ fontSize: '12px' }}>
          {text?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'finalLineTotal',
      key: 'finalLineTotal',
      width: 150,
      align: 'right',
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'platformFeeAmount',
      key: 'platformFeeAmount',
      width: 130,
      align: 'right',
      render: (value) => (
        <Text type="danger">{formatCurrency(value || 0)}</Text>
      ),
    },
    {
      title: 'Thực nhận',
      dataIndex: 'netPayout',
      key: 'netPayout',
      width: 150,
      align: 'right',
      fixed: 'right',
      render: (value) => (
        <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
          {formatCurrency(value || 0)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isReturned',
      key: 'isReturned',
      width: 120,
      align: 'center',
      render: (isReturned) => (
        isReturned ? (
          <Tag color="red">Đã hoàn</Tag>
        ) : (
          <Tag color="green">Thành công</Tag>
        )
      ),
    },
  ];

  // Table columns for shipping orders
  const shippingColumns: ColumnsType<ShippingOrder> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'storeOrderId',
      key: 'storeOrderId',
      width: 200,
      render: (text) => (
        <Text code copyable style={{ fontSize: '12px' }}>
          {text?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Mã vận đơn GHN',
      dataIndex: 'ghnOrderCode',
      key: 'ghnOrderCode',
      width: 180,
      render: (text) => (
        <Text code copyable>
          {text}
        </Text>
      ),
    },
    {
      title: 'Loại vận chuyển',
      dataIndex: 'shippingType',
      key: 'shippingType',
      width: 150,
      render: (type) => (
        type === 'SHIPPING' ? (
          <Tag color="blue" icon={<Truck size={14} />}>Giao hàng</Tag>
        ) : (
          <Tag color="orange">Khác</Tag>
        )
      ),
    },
    {
      title: 'Phí vận chuyển',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 150,
      align: 'right',
      render: (value) => (
        <Text type="danger">{formatCurrency(value || 0)}</Text>
      ),
    },
  ];

  // Table columns for return fees
  const returnFeeColumns: ColumnsType<ReturnShipFee> = [
    {
      title: 'Mã yêu cầu hoàn',
      dataIndex: 'returnRequestId',
      key: 'returnRequestId',
      width: 200,
      render: (text) => (
        <Text code copyable style={{ fontSize: '12px' }}>
          {text?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Mã vận đơn GHN',
      dataIndex: 'ghnOrderCode',
      key: 'ghnOrderCode',
      width: 180,
      render: (text) => (
        <Text code copyable>
          {text}
        </Text>
      ),
    },
    {
      title: 'Loại vận chuyển',
      dataIndex: 'shippingType',
      key: 'shippingType',
      width: 150,
      render: () => (
        <Tag color="red">Hoàn hàng</Tag>
      ),
    },
    {
      title: 'Phí vận chuyển',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 130,
      align: 'right',
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: 'Shop chịu phí',
      dataIndex: 'chargedToShop',
      key: 'chargedToShop',
      width: 130,
      align: 'right',
      render: (value) => (
        <Text type="danger" strong>
          {formatCurrency(value || 0)}
        </Text>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải chi tiết hóa đơn..." />
      </div>
    );
  }

  if (!payoutBill) {
    return (
      <Card>
        <Empty description="Không tìm thấy hóa đơn thanh toán" />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="primary" onClick={() => navigate('/seller/dashboard/revenue')}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/seller/dashboard/revenue')}
          >
            Quay lại
          </Button>
        </Space>
        <Title level={3} style={{ marginTop: '16px' }}>
          Chi tiết hóa đơn thanh toán: {payoutBill.billCode}
        </Title>
        {getStatusTag(payoutBill.status)}
      </div>

      {/* Bill Overview */}
      <Card title="Thông tin chung" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Tổng doanh thu"
              value={payoutBill.totalGross || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Phí nền tảng"
              value={payoutBill.totalPlatformFee || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Phí vận chuyển"
              value={payoutBill.totalShippingOrderFee || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Thực nhận"
              value={payoutBill.totalNetPayout || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="Mã Bill" span={3}>
            <Text strong copyable>
              {payoutBill.billCode}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Kỳ thanh toán" span={3}>
            <Space>
              <CalendarOutlined />
              <Text>
                {payoutBill.fromDate ? new Date(payoutBill.fromDate).toLocaleDateString('vi-VN') : 'N/A'}
              </Text>
              <Text>-</Text>
              <Text>
                {payoutBill.toDate ? new Date(payoutBill.toDate).toLocaleDateString('vi-VN') : 'N/A'}
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDateTime(payoutBill.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            {getStatusTag(payoutBill.status)}
          </Descriptions.Item>
          
          {payoutBill.status === 'PAID' && (
            <>
              {payoutBill.transferReference && (
                <Descriptions.Item label="Mã giao dịch" span={3}>
                  <Text code copyable>
                    {payoutBill.transferReference}
                  </Text>
                </Descriptions.Item>
              )}
              {payoutBill.receiptImageUrl && (
                <Descriptions.Item label="Biên lai" span={3}>
                  <Image
                    src={payoutBill.receiptImageUrl}
                    alt="Receipt"
                    style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                  />
                </Descriptions.Item>
              )}
              {payoutBill.adminNote && (
                <Descriptions.Item label="Ghi chú từ Admin" span={3}>
                  <Text type="secondary">{payoutBill.adminNote}</Text>
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>
      </Card>

      {/* Items Table */}
      <Card
        title={
          <Space>
            <Package size={20} />
            <span>Danh sách sản phẩm ({payoutBill.items?.length || 0})</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={itemColumns}
          dataSource={payoutBill.items || []}
          rowKey="orderItemId"
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: <Empty description="Không có sản phẩm" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      </Card>

      {/* Shipping Orders Table */}
      {payoutBill.shippingOrders && payoutBill.shippingOrders.length > 0 && (
        <Card
          title={
            <Space>
              <Truck size={20} />
              <span>Phí vận chuyển giao hàng ({payoutBill.shippingOrders.length})</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Table
            columns={shippingColumns}
            dataSource={payoutBill.shippingOrders}
            rowKey="storeOrderId"
            pagination={false}
            scroll={{ x: 800 }}
            locale={{
              emptyText: <Empty description="Không có phí vận chuyển" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      )}

      {/* Return Fees Table */}
      {payoutBill.returnFees && payoutBill.returnFees.length > 0 && (
        <Card
          title={
            <Space>
              <Truck size={20} />
              <span>Phí vận chuyển hoàn hàng ({payoutBill.returnFees.length})</span>
            </Space>
          }
        >
          <Table
            columns={returnFeeColumns}
            dataSource={payoutBill.returnFees}
            rowKey="returnRequestId"
            pagination={false}
            scroll={{ x: 900 }}
            locale={{
              emptyText: <Empty description="Không có phí hoàn hàng" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default PayoutRevenueDetail;
