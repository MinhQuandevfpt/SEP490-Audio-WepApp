import React, { useState } from 'react';
import { Card, Table, Tag, Empty, Spin, Alert, Row, Col, Statistic, Button, Modal, Form, InputNumber, message, Input, Select, Tabs, Image, Descriptions } from 'antd';
import { WalletOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, MinusOutlined, HistoryOutlined, DashboardOutlined, TransactionOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { WalletTransaction, WithdrawRequest } from '../../types/api';
import { useWalletTransactions } from '../../hooks/useWalletTransactions';
import { useWalletInfo } from '../../hooks/useWalletInfo';
import { useWithdrawRequests } from '../../hooks/useWithdrawRequests';
import { formatCurrency } from '../../utils/orderStatus';
import WalletService from '../../services/customer/WalletService';
import { vietnamBanks } from '../../data/vietnamBanks';

interface WalletPageProps {
  customerId: string | null;
}

// Mapping transaction types to Vietnamese
const getTransactionTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'REFUND': 'Hoàn tiền',
    'QR': 'Thanh toán QR',
    'DEPOSIT': 'Nạp tiền',
    'TOPUP': 'Nạp tiền vào ví',
    'WITHDRAW': 'Rút tiền',
    'WITHDRAW_REQUEST': 'Rút tiền',
    'PENDING_HOLD': 'Giữ tiền chờ',
    'RELEASE_PENDING': 'Giải phóng tiền chờ',
    'ADJUSTMENT': 'Điều chỉnh',
    'PAYMENT': 'Thanh toán',
    'TRANSFER': 'Chuyển khoản',
    'RETURN_REFUND_CUSTOMER_CREDIT': 'Hoàn tiền yêu cầu trả hàng',
  };
  return typeMap[type] || type;
};

// Get transaction type color
const getTransactionTypeColor = (type: string): string => {
  if (type === 'WITHDRAW_REQUEST' || type === 'WITHDRAW') return 'red';
  return 'blue';
};

// Mapping transaction status to Vietnamese
const getTransactionStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'SUCCESS': 'Thành công',
    'COMPLETED': 'Hoàn thành',
    'PENDING': 'Đang xử lý',
    'FAILED': 'Thất bại',
    'CANCELLED': 'Đã hủy',
    'PROCESSING': 'Đang xử lý',
  };
  return statusMap[status] || status;
};

// Get status color
const getStatusColor = (status: string): string => {
  if (status === 'SUCCESS' || status === 'COMPLETED') return 'green';
  if (status === 'PENDING' || status === 'PROCESSING') return 'orange';
  if (status === 'FAILED' || status === 'CANCELLED') return 'red';
  return 'default';
};

// Mapping wallet status to Vietnamese
const getWalletStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Đang hoạt động',
    'INACTIVE': 'Không hoạt động',
    'SUSPENDED': 'Đã tạm khóa',
  };
  return statusMap[status] || status;
};

// Get wallet status color
const getWalletStatusColor = (status: string): string => {
  if (status === 'ACTIVE') return 'green';
  if (status === 'INACTIVE') return 'default';
  if (status === 'SUSPENDED') return 'red';
  return 'default';
};

const WalletPage: React.FC<WalletPageProps> = ({ customerId }) => {
  const { walletInfo, loading: walletLoading, error: walletError, reload: reloadWalletInfo } = useWalletInfo(customerId);
  const { transactions, loading: transactionsLoading, error: transactionsError, page, pageSize, total, setPage, setPageSize } =
    useWalletTransactions(customerId);
  const { withdrawRequests, loading: withdrawRequestsLoading, error: withdrawError, page: withdrawPage, pageSize: withdrawPageSize, total: withdrawTotal, setPage: setWithdrawPage, setPageSize: setWithdrawPageSize, reload: reloadWithdrawRequests } = 
    useWithdrawRequests(customerId);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositForm] = Form.useForm();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm] = Form.useForm();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Handle deposit
  const handleDeposit = async (values: { amount: number }) => {
    if (!customerId) {
      message.error('Không tìm thấy thông tin khách hàng');
      return;
    }

    setDepositLoading(true);
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const response = await WalletService.createDepositCheckout(customerId, {
        amount: values.amount,
        returnUrl: currentUrl,
        cancelUrl: currentUrl,
      });

      if (response?.data?.checkoutUrl) {
        message.success('Đang chuyển đến trang thanh toán...');
        // Redirect to PayOS checkout page
        window.location.href = response.data.checkoutUrl;
      } else {
        message.error('Không thể tạo liên kết thanh toán');
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi nạp tiền');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleOpenDepositModal = () => {
    depositForm.resetFields();
    setIsDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false);
    depositForm.resetFields();
  };

  // Handle withdraw
  const handleWithdraw = async (values: any) => {
    if (!customerId) {
      message.error('Không tìm thấy thông tin khách hàng');
      return;
    }

    if (!walletInfo || values.amount > walletInfo.balance) {
      message.error('Số dư không đủ để thực hiện giao dịch');
      return;
    }

    setWithdrawLoading(true);
    try {
      await WalletService.createWithdrawRequest(customerId, {
        amount: values.amount,
        bankCode: values.bankCode,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
      });

      // Reload wallet info to get accurate balance from backend
      // (backend may apply fees or other adjustments that affect the actual balance)
      if (reloadWalletInfo) {
        await reloadWalletInfo();
      }
      
      // Show success message without balance to avoid showing incorrect client-calculated value
      // The UI will automatically update with the correct balance from backend after reload
      message.success('Rút tiền thành công! Số dư của bạn đã được cập nhật.');
      
      setIsWithdrawModalOpen(false);
      withdrawForm.resetFields();
      reloadWithdrawRequests();
    } catch (error: any) {
      console.error('Withdraw error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi rút tiền');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleOpenWithdrawModal = () => {
    withdrawForm.resetFields();
    setIsWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
    withdrawForm.resetFields();
  };

  const handleBankChange = (value: string) => {
    const selectedBank = vietnamBanks.find(bank => bank.code === value);
    if (selectedBank) {
      withdrawForm.setFieldsValue({ bankName: selectedBank.name });
    }
  };

  // Handle view withdraw request detail
  const handleViewDetail = async (requestId: string) => {
    if (!customerId) {
      message.error('Không tìm thấy thông tin khách hàng');
      return;
    }

    setDetailLoading(true);
    setIsDetailModalOpen(true);
    
    try {
      const detail = await WalletService.getWithdrawRequestDetail(customerId, requestId);
      setSelectedRequest(detail);
    } catch (error: any) {
      console.error('Get detail error:', error);
      message.error(error?.message || 'Không thể tải chi tiết yêu cầu');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  const columns: ColumnsType<WalletTransaction> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      render: (value) => (
        <Tag color={getTransactionTypeColor(value)}>
          {getTransactionTypeLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={getStatusColor(value)}>
          {getTransactionStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number, record: WalletTransaction) => {
        const isWithdraw = record.type === 'WITHDRAW_REQUEST' || record.type === 'WITHDRAW';
        // For withdrawals: always red (money going out)
        // For non-withdrawals: check actual value sign - positive = blue (money in), negative = red (money out)
        const isPositive = isWithdraw ? false : value > 0;
        // For withdrawals: display as negative (money going out)
        // If backend sends positive value, negate it; if backend already sends negative, use as-is
        // This ensures withdrawals always display as negative regardless of backend format
        const displayValue = isWithdraw ? Math.abs(value) * -1 : value;
        return (
          <span className={isPositive ? 'text-blue-600 font-semibold' : 'text-red-500 font-semibold'}>
            {isPositive ? '+' : ''}{formatCurrency(displayValue)}
          </span>
        );
      },
    },
    {
      title: 'Số dư sau GD',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (value: number) => <span>{formatCurrency(value)}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (value) => {
        if (!value) return '—';
        
        // Parse withdraw request description
        // Format: "Customer withdraw request id=xxx" or "Customer withdraw (auto) id=xxx"
        if (value.toLowerCase().includes('customer withdraw')) {
          return (
            <div className="whitespace-normal">
              <div>Giao dịch rút tiền</div>
            </div>
          );
        }
        
        // Parse description if it contains orderCode
        // Format: "Top up via PayOS, orderCode=1765960905776"
        if (value.includes('orderCode=')) {
          const parts = value.split(',');
          let mainText = parts[0].trim();
          let orderCode = '';
          
          // Extract order code
          const orderPart = parts.find((p: string) => p.includes('orderCode='));
          if (orderPart) {
            orderCode = orderPart.split('=')[1]?.trim();
          }
          
          // Convert main text to Vietnamese
          if (mainText.toLowerCase().includes('top up via payos')) {
            mainText = 'Nạp tiền qua PayOS';
          }
          
          return (
            <div className="whitespace-normal">
              <div>{mainText}</div>
              {orderCode && <div className="text-gray-500 text-xs mt-1">Mã giao dịch: {orderCode}</div>}
            </div>
          );
        }
        
        return <div className="whitespace-normal">{value}</div>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        defaultActiveKey="overview"
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span className="flex items-center gap-2">
                <DashboardOutlined />
                Tổng quan ví
              </span>
            ),
            children: (
              <Card 
                className="shadow-sm border border-gray-200"
                extra={
                  <div className="flex gap-2">
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={handleOpenDepositModal}
                      disabled={!customerId || walletInfo?.status !== 'ACTIVE'}
                    >
                      Nạp tiền
                    </Button>
                    <Button 
                      icon={<MinusOutlined />} 
                      onClick={handleOpenWithdrawModal}
                      disabled={!customerId || walletInfo?.status !== 'ACTIVE' || (walletInfo?.balance || 0) < 10000}
                    >
                      Rút tiền
                    </Button>
                  </div>
                }
              >
        {!customerId ? (
          <Empty description="Không tìm thấy thông tin khách hàng" />
        ) : walletError ? (
          <Alert type="error" message={walletError} showIcon />
        ) : walletLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
          </div>
        ) : walletInfo ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Số dư hiện tại"
                value={walletInfo.balance}
                prefix={<WalletOutlined className="text-blue-500" />}
                suffix={walletInfo.currency}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Trạng thái ví"
                value={getWalletStatusLabel(walletInfo.status)}
                prefix={
                  walletInfo.status === 'ACTIVE' ? (
                    <CheckCircleOutlined className="text-green-500" />
                  ) : (
                    <ClockCircleOutlined className="text-orange-500" />
                  )
                }
                valueStyle={{ fontSize: '18px' }}
              />
              <Tag color={getWalletStatusColor(walletInfo.status)} className="mt-2">
                {getWalletStatusLabel(walletInfo.status)}
              </Tag>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Giao dịch cuối"
                value={walletInfo.lastTransactionAt ? new Date(walletInfo.lastTransactionAt).toLocaleString('vi-VN') : 'Chưa có'}
                valueStyle={{ fontSize: '14px', color: '#666' }}
              />
            </Col>
          </Row>
        ) : (
          <Empty description="Không có thông tin ví" />
        )}
              </Card>
            ),
          },
          {
            key: 'transactions',
            label: (
              <span className="flex items-center gap-2">
                <TransactionOutlined />
                Lịch sử giao dịch
              </span>
            ),
            children: (
              <Card className="shadow-sm border border-gray-200">
        {!customerId ? (
          <Empty description="Không tìm thấy thông tin khách hàng" />
        ) : transactionsError ? (
          <Alert type="error" message={transactionsError} showIcon />
        ) : (
          <>
            {transactionsLoading ? (
              <div className="py-8 text-center">
                <Spin size="large" />
              </div>
            ) : transactions.length === 0 ? (
              <Empty description="Chưa có giao dịch" />
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={transactions}
                scroll={{ x: 'max-content' }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps || pageSize);
                  },
                  showSizeChanger: true,
                }}
              />
            )}
          </>
        )}
              </Card>
            ),
          },
          {
            key: 'withdrawRequests',
            label: (
              <span className="flex items-center gap-2">
                <HistoryOutlined />
                Lịch sử rút tiền
              </span>
            ),
            children: (
              <Card className="shadow-sm border border-gray-200">
        {!customerId ? (
          <Empty description="Không tìm thấy thông tin khách hàng" />
        ) : withdrawError ? (
          <Alert type="error" message={withdrawError} showIcon />
        ) : (
          <>
            {withdrawRequestsLoading ? (
              <div className="py-8 text-center">
                <Spin size="large" />
              </div>
            ) : withdrawRequests.length === 0 ? (
              <Empty description="Chưa có yêu cầu rút tiền" />
            ) : (
              <Table
                rowKey="id"
                dataSource={withdrawRequests}
                scroll={{ x: 'max-content' }}
                pagination={{
                  current: withdrawPage,
                  pageSize: withdrawPageSize,
                  total: withdrawTotal,
                  onChange: (p, ps) => {
                    setWithdrawPage(p);
                    setWithdrawPageSize(ps || withdrawPageSize);
                  },
                  showSizeChanger: true,
                }}
                columns={[
                  {
                    title: 'Thời gian',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (value) => new Date(value).toLocaleString('vi-VN'),
                  },
                  {
                    title: 'Số tiền',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (value: number) => (
                      <span className="font-semibold text-red-500">{formatCurrency(value)}</span>
                    ),
                  },
                  {
                    title: 'Ngân hàng',
                    dataIndex: 'bankName',
                    key: 'bankName',
                    render: (value, record: WithdrawRequest) => (
                      <div>
                        <div className="font-medium">{record.bankCode}</div>
                        <div className="text-xs text-gray-500">{value}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => {
                      const statusConfig: Record<string, { color: string; text: string }> = {
                        PENDING: { color: 'orange', text: 'Chờ xử lý' },
                        APPROVED: { color: 'blue', text: 'Đã duyệt' },
                        REJECTED: { color: 'red', text: 'Từ chối' },
                        PAID: { color: 'green', text: 'Thành công' },
                      };
                      const config = statusConfig[status] || { color: 'default', text: status };
                      return <Tag color={config.color}>{config.text}</Tag>;
                    },
                  },
                  {
                    title: 'Hành động',
                    key: 'action',
                    width: 120,
                    render: (_, record: WithdrawRequest) => (
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record.id)}
                      >
                        Xem chi tiết
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </>
        )}
              </Card>
            ),
          },
        ]}
      />

      {/* Deposit Modal */}
      <Modal
        title="Nạp tiền vào ví"
        open={isDepositModalOpen}
        onCancel={handleCloseDepositModal}
        footer={null}
        width={500}
      >
        <Form
          form={depositForm}
          layout="vertical"
          onFinish={handleDeposit}
          className="mt-4"
        >
          <Form.Item
            label="Số tiền nạp (VND)"
            name="amount"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 10000, 
                message: 'Số tiền nạp tối thiểu là 10.000 VND' 
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập số tiền (tối thiểu 10.000 VND)"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
              min={0}
              controls={false}
              className="w-full"
            />
          </Form.Item>

          <div className="text-sm text-gray-500 mb-4 space-y-1">
            <p>• Số tiền nạp tối thiểu: 10.000 VND</p>
            <p>• Bạn sẽ được chuyển đến trang thanh toán PayOS</p>
          </div>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseDepositModal}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={depositLoading}>
                Tiếp tục
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        title="Rút tiền từ ví"
        open={isWithdrawModalOpen}
        onCancel={handleCloseWithdrawModal}
        footer={null}
        width={600}
      >
        <Form
          form={withdrawForm}
          layout="vertical"
          onFinish={handleWithdraw}
          className="mt-4"
        >
          <Form.Item
            label="Số tiền rút (VND)"
            name="amount"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 10000, 
                message: 'Số tiền rút tối thiểu là 10.000 VND' 
              },
              {
                validator: async (_, value) => {
                  if (value && walletInfo && value > walletInfo.balance) {
                    throw new Error(`Số dư không đủ. Số dư hiện tại: ${formatCurrency(walletInfo.balance)}`);
                  }
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập số tiền (tối thiểu 10.000 VND)"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
              min={0}
              controls={false}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            label="Ngân hàng"
            name="bankCode"
            rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
          >
            <Select
              showSearch
              placeholder="Chọn ngân hàng"
              optionFilterProp="label"
              onChange={handleBankChange}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              optionRender={(option) => {
                const bank = vietnamBanks.find(b => b.code === option.value);
                if (!bank) {
                  // Fallback nếu không tìm thấy bank code
                  return (
                    <div className="flex items-center gap-2 py-1">
                      <span>{option.label || option.value || 'Ngân hàng không xác định'}</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 py-1">
                    {bank.logo && (
                      <img 
                        src={bank.logo} 
                        alt={bank.shortName} 
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span>{bank.shortName} - {bank.name}</span>
                  </div>
                );
              }}
              options={vietnamBanks.map(bank => ({
                value: bank.code,
                label: `${bank.shortName} - ${bank.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="bankName" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              { required: true, message: 'Vui lòng nhập số tài khoản' },
              { pattern: /^[0-9]{6,20}$/, message: 'Số tài khoản không hợp lệ (6-20 số)' },
            ]}
          >
            <Input placeholder="Nhập số tài khoản ngân hàng" maxLength={20} />
          </Form.Item>

          <Form.Item
            label="Tên chủ tài khoản"
            name="accountName"
            rules={[
              { required: true, message: 'Vui lòng nhập tên chủ tài khoản' },
              { min: 3, message: 'Tên phải có ít nhất 3 ký tự' },
            ]}
          >
            <Input placeholder="Nhập tên chủ tài khoản (không dấu, viết hoa)" />
          </Form.Item>

          <div className="text-sm text-gray-500 mb-4 space-y-1 bg-blue-50 p-3 rounded">
            <p className="font-medium text-blue-700">⚠️ Lưu ý:</p>
            <p>• Số tiền rút tối thiểu: 10.000 VND</p>
            <p>• Số dư hiện tại: <span className="font-semibold">{formatCurrency(walletInfo?.balance || 0)}</span></p>
            <p>• Yêu cầu sẽ được xử lý trong 1-3 ngày làm việc</p>
            <p>• Tiền sẽ được chuyển vào tài khoản bạn đã đăng ký</p>
            <p>• Vui lòng kiểm tra kỹ thông tin trước khi gửi yêu cầu</p>
          </div>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseWithdrawModal}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={withdrawLoading}>
                Gửi yêu cầu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdraw Request Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu rút tiền"
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
          </div>
        ) : selectedRequest ? (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã yêu cầu" span={2}>
                <span className="font-mono text-xs">{selectedRequest.id}</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Thời gian tạo">
                {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(selectedRequest.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Số tiền rút" span={2}>
                <span className="text-lg font-bold text-red-500">{formatCurrency(selectedRequest.amount)}</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Trạng thái" span={2}>
                {(() => {
                  const statusConfig: Record<string, { color: string; text: string }> = {
                    PENDING: { color: 'orange', text: 'Chờ xử lý' },
                    APPROVED: { color: 'blue', text: 'Đã duyệt' },
                    REJECTED: { color: 'red', text: 'Từ chối' },
                    PAID: { color: 'green', text: 'Đã thanh toán' },
                  };
                  const config = statusConfig[selectedRequest.status] || { color: 'default', text: selectedRequest.status };
                  return <Tag color={config.color} className="text-base px-3 py-1">{config.text}</Tag>;
                })()}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngân hàng" span={2}>
                <div>
                   <div className=" font-medium">{selectedRequest.bankCode}</div>
                  <div className="text-xs text-gray-500">{selectedRequest.bankName}</div>
                  
                </div>
              </Descriptions.Item>
              
              <Descriptions.Item label="Số tài khoản">
                <span className="font-mono">{selectedRequest.accountNumber}</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Tên chủ tài khoản">
                <span className="font-medium">{selectedRequest.accountName}</span>
              </Descriptions.Item>
              
              {selectedRequest.payoutRef && (
                <Descriptions.Item label="Mã thanh toán" span={2}>
                  <span className="font-mono bg-green-50 px-2 py-1 rounded">{selectedRequest.payoutRef}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedRequest.proofUrls && selectedRequest.proofUrls.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Ảnh chứng minh thanh toán:</h4>
                <Image.PreviewGroup>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.proofUrls.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Proof ${index + 1}`}
                        className="rounded border"
                        width="100%"
                        height={120}
                        style={{ objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}
            
            {selectedRequest.status === 'PENDING' && (
              <Alert
                message="Yêu cầu đang chờ xử lý"
                description="Hệ thống sẽ xem xét và xử lý yêu cầu của bạn trong thời gian sớm nhất."
                type="info"
                showIcon
              />
            )}
            
            {selectedRequest.status === 'APPROVED' && (
              <Alert
                message="Yêu cầu đã được duyệt"
                description="Yêu cầu rút tiền của bạn đã được phê duyệt. Tiền sẽ được chuyển vào tài khoản ngân hàng của bạn sớm."
                type="success"
                showIcon
              />
            )}
            
            {selectedRequest.status === 'REJECTED' && (
              <Alert
                message="Yêu cầu bị từ chối"
                description="Yêu cầu rút tiền của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết."
                type="error"
                showIcon
              />
            )}
            
            {selectedRequest.status === 'PAID' && (
              <Alert
                message="Đã thanh toán thành công"
                description="Tiền đã được chuyển vào tài khoản ngân hàng của bạn. Vui lòng kiểm tra."
                type="success"
                showIcon
              />
            )}
          </div>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>
    </div>
  );
};

export default WalletPage;

