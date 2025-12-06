import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { AdminPayoutService } from '../../../services/admin/AdminPayoutService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { PayoutBill, PayoutBillItem, ShippingOrder, ReturnShipFee } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const { Title, Text } = Typography;

const PayoutBillDetail: React.FC = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [payoutBill, setPayoutBill] = useState<PayoutBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>('');


  const fetchPayoutBillDetail = useCallback(async () => {
    if (!billId) return;
    
    setIsLoading(true);
    try {
      const data = await AdminPayoutService.getPayoutBillDetail(billId);
      setPayoutBill(data);
      
      // Load store name
      if (data.shopId) {
        const storeInfo = await AdminStoreService.getStoreById(data.shopId);
        if (storeInfo && storeInfo.name) {
          setStoreName(storeInfo.name);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tải chi tiết hóa đơn payout';
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
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const itemColumns: ColumnsType<PayoutBillItem> = useMemo(() => [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
      render: (productName: string, record: PayoutBillItem) => (
        <div>
          <div className="font-medium text-gray-900">{productName}</div>
          <div className="text-xs text-gray-500 font-mono">
            Order Item ID: {record.orderItemId || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (quantity: number, record: PayoutBillItem) => (
        <div>
          <span className="font-medium">{quantity}</span>
          {record.isReturned && (
            <Tag color="red" className="ml-2">Đã hoàn</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Tổng tiền hàng',
      dataIndex: 'finalLineTotal',
      key: 'finalLineTotal',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <span className="font-medium">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Phí nền tảng (%)',
      dataIndex: 'platformFeePercentage',
      key: 'platformFeePercentage',
      width: 130,
      align: 'right',
      render: (percentage: number) => (
        <span className="text-gray-600">{percentage}%</span>
      ),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'platformFeeAmount',
      key: 'platformFeeAmount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <span className="text-orange-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Số tiền nhận',
      dataIndex: 'netPayout',
      key: 'netPayout',
      width: 180,
      align: 'right',
      render: (amount: number) => (
        <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
      ),
    },
  ], [formatCurrency]);

  const shippingColumns: ColumnsType<ShippingOrder> = useMemo(() => [
    {
      title: 'Mã đơn GHN',
      dataIndex: 'ghnOrderCode',
      key: 'ghnOrderCode',
      width: 200,
      render: (code: string) => (
        <span className="font-mono text-blue-600">{code}</span>
      ),
    },
    {
      title: 'Store Order ID',
      dataIndex: 'storeOrderId',
      key: 'storeOrderId',
      width: 300,
      render: (id: string) => (
        <span className="text-xs text-gray-500 font-mono">{id || 'N/A'}</span>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'shippingType',
      key: 'shippingType',
      width: 120,
      render: (type: string) => (
        <Tag>{type}</Tag>
      ),
    },
    {
      title: 'Phí vận chuyển',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 150,
      align: 'right',
      render: (fee: number) => (
        <span className="font-medium">{formatCurrency(fee)}</span>
      ),
    },
  ], [formatCurrency]);

  const returnShipColumns: ColumnsType<ReturnShipFee> = useMemo(() => [
    {
      title: 'Mã đơn GHN',
      dataIndex: 'ghnOrderCode',
      key: 'ghnOrderCode',
      width: 200,
      render: (code: string) => (
        <span className="font-mono text-red-600">{code}</span>
      ),
    },
    {
      title: 'Return Request ID',
      dataIndex: 'returnRequestId',
      key: 'returnRequestId',
      width: 320,
      render: (id: string) => (
        <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{id || 'N/A'}</span>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'shippingType',
      key: 'shippingType',
      width: 120,
      render: (type: string) => (
        <Tag color="red">{type}</Tag>
      ),
    },
    {
      title: 'Phí ship',
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 150,
      align: 'right',
      render: (fee: number) => (
        <span className="font-medium text-red-600">{formatCurrency(fee)}</span>
      ),
    },
    {
      title: 'Phí tính cho shop',
      dataIndex: 'chargedToShop',
      key: 'chargedToShop',
      width: 150,
      align: 'right',
      render: (fee: number) => (
        <span className="font-medium text-red-700">{formatCurrency(fee)}</span>
      ),
    },
  ], [formatCurrency]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Spin size="large" tip="Đang tải chi tiết hóa đơn..." />
        </div>
      </div>
    );
  }

  if (!payoutBill) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Empty
            description="Không tìm thấy hóa đơn payout"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/admin/reports/payout')}>
              Quay lại danh sách
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/reports/payout')}
          className="mb-4"
        >
          Quay lại danh sách
        </Button>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <Title level={3} style={{ margin: 0 }}>
              Chi tiết hóa đơn thanh toán
            </Title>
            <Text type="secondary">
              Mã hóa đơn: {payoutBill.billCode}
            </Text>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            {getStatusTag(payoutBill.status)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={payoutBill.totalGross}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Phí nền tảng"
              value={payoutBill.totalPlatformFee}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Phí vận chuyển"
              value={payoutBill.totalShippingOrderFee + payoutBill.totalReturnShippingFee}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số tiền thanh toán"
              value={payoutBill.totalNetPayout}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Bill Information */}
          <Card title="Thông tin hóa đơn" className="mb-6">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Mã hóa đơn">
                <Text strong className="text-blue-600 font-mono">{payoutBill.billCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="ID hóa đơn">
                <Text className="font-mono text-xs">{payoutBill.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cửa hàng">
                <div>
                  <Text strong>{storeName || 'Đang tải...'}</Text>
                  <div className="text-xs text-gray-500 mt-1 font-mono">Shop ID: {payoutBill.shopId}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Khoảng thời gian">
                <Space>
                  <CalendarOutlined />
                  <Text>
                    {formatDateTime(payoutBill.fromDate)} - {formatDateTime(payoutBill.toDate)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {formatDateTime(payoutBill.createdAt)}
              </Descriptions.Item>
              {payoutBill.updatedAt && (
                <Descriptions.Item label="Ngày cập nhật">
                  {formatDateTime(payoutBill.updatedAt)}
                </Descriptions.Item>
              )}
              {payoutBill.transferReference && (
                <Descriptions.Item label="Mã tham chiếu chuyển khoản">
                  <Text className="font-mono">{payoutBill.transferReference}</Text>
                </Descriptions.Item>
              )}
              {payoutBill.adminNote && (
                <Descriptions.Item label="Ghi chú admin">
                  <Text>{payoutBill.adminNote}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Order Items */}
          <Card
            title={
              <Space>
                <Package className="w-4 h-4" />
                <span>Sản phẩm trong hóa đơn ({payoutBill.items.length})</span>
              </Space>
            }
            className="mb-6"
          >
            <Table
              columns={itemColumns}
              dataSource={payoutBill.items}
              rowKey={(record, index) => record.id || record.orderItemId || `item-${index}`}
              pagination={false}
              scroll={{ x: 1000 }}
              size="small"
            />
          </Card>

          {/* Shipping Orders */}
          {payoutBill.shippingOrders && payoutBill.shippingOrders.length > 0 && (
            <Card
              title={
                <Space>
                  <Truck className="w-4 h-4" />
                  <span>Phí vận chuyển giao hàng ({payoutBill.shippingOrders.length})</span>
                </Space>
              }
              className="mb-6"
            >
              <Table
                columns={shippingColumns}
                dataSource={payoutBill.shippingOrders}
                rowKey={(record, index) => record.id || record.ghnOrderCode || `shipping-${index}`}
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            </Card>
          )}

          {/* Return Ship Fees */}
          {((payoutBill.returnShipFees && payoutBill.returnShipFees.length > 0) || 
            (payoutBill.returnFees && payoutBill.returnFees.length > 0)) && (
            <Card
              title={
                <Space>
                  <Truck className="w-4 h-4" />
                  <span>Phí vận chuyển hoàn hàng ({payoutBill.returnShipFees?.length || payoutBill.returnFees?.length || 0})</span>
                </Space>
              }
            >
              <Table
                columns={returnShipColumns}
                dataSource={payoutBill.returnShipFees || payoutBill.returnFees || []}
                rowKey={(record, index) => record.id || record.ghnOrderCode || `return-${index}`}
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            </Card>
          )}
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Summary */}
          <Card title="Tóm tắt thanh toán" className="mb-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Text>Tổng doanh thu:</Text>
                <Text strong>{formatCurrency(payoutBill.totalGross)}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="flex justify-between">
                <Text type="secondary">Trừ: Phí nền tảng</Text>
                <Text type="secondary">-{formatCurrency(payoutBill.totalPlatformFee)}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Trừ: Phí vận chuyển giao</Text>
                <Text type="secondary">-{formatCurrency(payoutBill.totalShippingOrderFee)}</Text>
              </div>
              {payoutBill.totalReturnShippingFee > 0 && (
                <div className="flex justify-between">
                  <Text type="secondary">Trừ: Phí vận chuyển hoàn</Text>
                  <Text type="secondary">-{formatCurrency(payoutBill.totalReturnShippingFee)}</Text>
                </div>
              )}
              <Divider style={{ margin: '12px 0' }} />
              <div className="flex justify-between">
                <Text strong className="text-lg">Số tiền thanh toán:</Text>
                <Text strong className="text-lg text-green-600">
                  {formatCurrency(payoutBill.totalNetPayout)}
                </Text>
              </div>
            </div>
          </Card>

          {/* Receipt Image */}
          {payoutBill.receiptImageUrl && (
            <Card title="Ảnh biên lai" className="mb-6">
              <Image
                src={payoutBill.receiptImageUrl}
                alt="Receipt"
                className="w-full rounded-lg"
                preview={{
                  mask: 'Xem ảnh',
                }}
              />
            </Card>
          )}

          {/* Status Info */}
          <Card title="Trạng thái">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Trạng thái hiện tại:</Text>
                <div className="mt-2">{getStatusTag(payoutBill.status)}</div>
              </div>
              {payoutBill.status === 'PAID' && payoutBill.transferReference && (
                <div className="mt-4">
                  <Text type="secondary">Mã tham chiếu:</Text>
                  <div className="mt-1">
                    <Text className="font-mono text-sm">{payoutBill.transferReference}</Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PayoutBillDetail;

