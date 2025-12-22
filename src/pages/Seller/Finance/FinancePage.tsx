import React, { useState, useEffect } from 'react';
import {
  Tag,
  Typography,
  Card,
  DatePicker,
  Select,
  Input,
  Button,
  Row,
  Col,
  Empty,
  Spin,
  Pagination,
  Alert,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message,
} from 'antd';
import {
  Wallet,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Shield,
  Calendar,
  FileText,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  CreditCard,
  Banknote,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../../hooks/useFinance';
import type { TransactionType } from '../../../types/seller';
import { formatCurrency } from '../../../utils/orderStatus';
import dayjs, { type Dayjs } from 'dayjs';
import { FinanceService } from '../../../services/seller/FinanceService';
import { StoreService } from '../../../services/seller/StoreService';
import BankSelector from '../../../components/common/BankSelector/BankSelector';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const FinancePage: React.FC = () => {
  const {
    transactions,
    isLoading,
    error,
    walletOverview,
    walletOverviewLoading,
    walletOverviewError,
    page,
    pageSize,
    totalElements,
    handlePageChange,
    handlePageSizeChange,
    filters,
    updateFilters,
    clearFilters,
    refresh,
  } = useFinance();

  const [transactionIdSearch, setTransactionIdSearch] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // Topup modal state
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupForm] = Form.useForm();

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm] = Form.useForm();

  // Transfer to deposit modal state
  const [isTransferToDepositModalOpen, setIsTransferToDepositModalOpen] = useState(false);
  const [transferToDepositLoading, setTransferToDepositLoading] = useState(false);
  const [transferToDepositForm] = Form.useForm();

  // Withdraw from deposit modal state
  const [isWithdrawFromDepositModalOpen, setIsWithdrawFromDepositModalOpen] = useState(false);
  const [withdrawFromDepositLoading, setWithdrawFromDepositLoading] = useState(false);
  const [withdrawFromDepositForm] = Form.useForm();


  // Sync dateRange with filters when filters change externally
  useEffect(() => {
    if (filters.from && filters.to) {
      const fromDate = dayjs(filters.from);
      const toDate = dayjs(filters.to);
      if (fromDate.isValid() && toDate.isValid()) {
        setDateRange([fromDate, toDate]);
      }
    } else if (!filters.from && !filters.to) {
      setDateRange(null);
    }
  }, [filters.from, filters.to]);

  // Handle topup callback from PayOS
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const topupStatus = urlParams.get('topup');
    
    if (topupStatus === 'success') {
      message.success('Nạp tiền thành công! Số dư ví sẽ được cập nhật trong giây lát.');
      // Reload wallet overview
      refresh();
      // Clean URL
      window.history.replaceState({}, '', '/seller/dashboard/finance');
    } else if (topupStatus === 'cancel') {
      message.warning('Bạn đã hủy giao dịch nạp tiền');
      // Clean URL
      window.history.replaceState({}, '', '/seller/dashboard/finance');
    }
  }, [refresh]);


  const getTransactionTypeColor = (type: TransactionType): string => {
    const colorMap: Record<TransactionType, string> = {
      DEPOSIT: 'green',
      PENDING_HOLD: 'orange',
      RELEASE_PENDING: 'blue',
      WITHDRAW: 'red',
      REFUND: 'cyan',
      ADJUSTMENT: 'purple',
      REFUND_RETURN: 'cyan',
      REFUND_FORCE: 'cyan',
      TOPUP: 'green',
      DEBT_PAYMENT: 'orange',
      TRANSFER_TO_DEPOSIT: 'blue',
      TRANSFER_DEPOSIT_TO_DEFAULT: 'green',
    };
    return colorMap[type] || 'default';
  };

  // Parse and format transaction description to Vietnamese
  const formatTransactionDescription = (description: string, type: TransactionType) => {
    // TOPUP - Nạp tiền qua PayOS
    if (description.includes('Store topup via PayOS') || 
        description.includes('topup via PayOS') ||
        (type === 'TOPUP' && description.includes('orderCode'))) {
      const orderCodeMatch = description.match(/orderCode=(\d+)/i);
      const orderCode = orderCodeMatch ? orderCodeMatch[1] : '';
      
      return {
        title: 'Nạp tiền vào ví qua PayOs',
        icon: <Plus className="w-4 h-4 text-green-500" />,
        details: orderCode ? [
          { label: 'Mã giao dịch', value: orderCode, color: 'text-blue-600', strong: true },
        ] : [],
        note: null,
      };
    }

    // AUTO PAYOUT - Tiền bán hàng
    if (description.includes('AUTO PAYOUT')) {
      const grossMatch = description.match(/gross=([\d.]+)/i);
      const feeMatch = description.match(/fee=([\d.]+)/i);
      const netMatch = description.match(/net=([\d.]+)/i);
      
      const gross = grossMatch ? parseFloat(grossMatch[1]) : 0;
      const fee = feeMatch ? parseFloat(feeMatch[1]) : 0;
      const net = netMatch ? parseFloat(netMatch[1]) : 0;

      return {
        title: 'Doanh thu đơn hàng',
        icon: <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />,
        details: [
          { label: 'Doanh thu đơn hàng', value: formatCurrency(gross), color: 'text-blue-600' },
          { label: 'Phí nền tảng', value: formatCurrency(fee), color: 'text-red-600' },
          { label: 'Thực nhận', value: formatCurrency(net), color: 'text-green-600', strong: true },
        ],
        note: 'Tiền bán hàng được chuyển vào ví (sau khi trừ phí nền tảng)',
      };
    }

    // Chuyển tiền từ defaultBalance sang depositBalance (trả nợ)
    if (description.includes('Chuyển tiền từ defaultBalance sang depositBalance') || 
        description.includes('trả nợ') || 
        type === 'TRANSFER_TO_DEPOSIT') {
      const noteMatch = description.match(/note=([^|]+)/i);
      const note = noteMatch ? noteMatch[1].trim() : '';
      
      return {
        title: 'Chuyển tiền sang ký quỹ',
        icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
        details: [],
        note: note || 'Chuyển tiền sang ký quỹ để thanh toán công nợ',
      };
    }

    // Rút tiền từ ví
    if (description.includes('Rút tiền từ ví') || type === 'WITHDRAW') {
      const bankMatch = description.match(/bank=([^|]+)/i);
      const accNoMatch = description.match(/accNo=([^|]+)/i);
      const noteMatch = description.match(/note=([^|]+)/i);
      
      const bank = bankMatch ? bankMatch[1].trim() : '';
      const accNo = accNoMatch ? accNoMatch[1].trim() : '';
      const note = noteMatch ? noteMatch[1].trim() : '';

      return {
        title: 'Rút tiền về tài khoản ngân hàng',
        icon: <CreditCard className="w-4 h-4 text-red-500" />,
        details: bank || accNo ? [
          { label: 'Ngân hàng', value: bank || '—', color: 'text-gray-700' },
          { label: 'Số tài khoản', value: accNo || '—', color: 'text-gray-700' },
          ...(note ? [{ label: 'Ghi chú', value: note, color: 'text-gray-600' }] : []),
        ] : [],
        note: 'Rút tiền về tài khoản ngân hàng',
      };
    }

    // Chuyển tiền từ ví cọc -> ví default
    if (description.includes('Chuyển tiền từ ví cọc') || 
        description.includes('ví cọc -> ví default') ||
        type === 'TRANSFER_DEPOSIT_TO_DEFAULT') {
      return {
        title: 'Hoàn tiền từ ký quỹ',
        icon: <TrendingDown className="w-4 h-4 text-green-500" />,
        details: [],
        note: 'Hoàn tiền từ ký quỹ về ví khả dụng',
      };
    }

    // Release after hold
    if (description.includes('Release after hold') || 
        (type === 'RELEASE_PENDING' && description.includes('partial'))) {
      const orderMatch = description.match(/storeOrder=([a-f0-9-]+)/i);
      const itemsMatch = description.match(/items=(\d+)/i);
      const netMatch = description.match(/net=([\d.]+)/i);
      
      const orderId = orderMatch ? orderMatch[1] : '';
      const items = itemsMatch ? parseInt(itemsMatch[1]) : 0;
      const net = netMatch ? parseFloat(netMatch[1]) : 0;

      return {
        title: 'Giải ngân tiền đơn hàng',
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        details: [
          { label: 'Số sản phẩm', value: `${items} sản phẩm`, color: 'text-gray-700' },
          { label: 'Số tiền giải ngân', value: formatCurrency(net), color: 'text-green-600', strong: true },
        ],
        note: 'Giải ngân tiền đơn hàng sau thời gian tạm giữ',
        orderId: orderId,
      };
    }

    // Thanh toán nợ
    if (description.includes('Thanh toán nợ') || type === 'DEBT_PAYMENT') {
      return {
        title: 'Thanh toán công nợ',
        icon: <Banknote className="w-4 h-4 text-orange-500" />,
        details: [],
        note: 'Thanh toán công nợ phát sinh (đơn hàng cuối & phí hoàn trả)',
      };
    }

    // Default - return original description
    return {
      title: description,
      icon: <FileText className="w-4 h-4 text-gray-400" />,
      details: [],
      note: null,
    };
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      updateFilters({
        from: dates[0].toISOString(),
        to: dates[1].toISOString(),
      });
    } else {
      updateFilters({
        from: undefined,
        to: undefined,
      });
    }
  };

  const handleTypeChange = (value: TransactionType | undefined) => {
    updateFilters({ type: value });
  };

  const handleTransactionIdSearch = () => {
    updateFilters({ transactionId: transactionIdSearch || undefined });
  };

  const handleClearFilters = () => {
    setTransactionIdSearch('');
    setDateRange(null);
    clearFilters();
  };

  // Handle topup
  const handleTopupClick = () => {
    setIsTopupModalOpen(true);
    topupForm.resetFields();
  };

  const handleTopupSubmit = async (values: { amount: number }) => {
    try {
      setTopupLoading(true);
      const storeId = await StoreService.getStoreId();
      
      if (!storeId) {
        message.error('Không tìm thấy thông tin cửa hàng');
        return;
      }

      const returnUrl = `${window.location.origin}/seller/dashboard/finance?topup=success`;
      const cancelUrl = `${window.location.origin}/seller/dashboard/finance?topup=cancel`;
      
      const response = await FinanceService.createTopup(
        storeId,
        {
          amount: values.amount,
          returnUrl,
          cancelUrl,
          description: 'Nạp tiền vào ví khả dụng'
        }
      );

      if (response.checkoutUrl) {
        message.success('Đang chuyển đến trang thanh toán...');
        window.location.href = response.checkoutUrl;
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể tạo giao dịch nạp tiền');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleTopupCancel = () => {
    setIsTopupModalOpen(false);
    topupForm.resetFields();
  };

  // Handle withdraw
  const handleWithdrawClick = () => {
    setIsWithdrawModalOpen(true);
    withdrawForm.resetFields();
  };

  const handleWithdrawSubmit = async (values: {
    amount: number;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    note?: string;
  }) => {
    try {
      setWithdrawLoading(true);
      
      const response = await FinanceService.withdraw(values);

      message.success(`Rút tiền thành công! Số dư sau giao dịch: ${formatCurrency(response.balanceAfter)}`);
      setIsWithdrawModalOpen(false);
      withdrawForm.resetFields();
      refresh();
    } catch (error: any) {
      message.error(error.message || 'Không thể tạo yêu cầu rút tiền');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdrawCancel = () => {
    setIsWithdrawModalOpen(false);
    withdrawForm.resetFields();
  };

  // Handle transfer to deposit
  const handleTransferToDepositClick = () => {
    setIsTransferToDepositModalOpen(true);
    transferToDepositForm.resetFields();
  };

  const handleTransferToDepositSubmit = async (values: {
    amount: number;
    note?: string;
  }) => {
    try {
      setTransferToDepositLoading(true);
      
      const response = await FinanceService.transferToDeposit(values);

      message.success(
        `Chuyển tiền thành công! Số dư ví khả dụng: ${formatCurrency(response.defaultBalanceAfter)}, Số dư ký quỹ: ${formatCurrency(response.depositBalanceAfter)}`
      );
      setIsTransferToDepositModalOpen(false);
      transferToDepositForm.resetFields();
      refresh();
    } catch (error: any) {
      message.error(error.message || 'Không thể chuyển tiền sang ký quỹ');
    } finally {
      setTransferToDepositLoading(false);
    }
  };

  const handleTransferToDepositCancel = () => {
    setIsTransferToDepositModalOpen(false);
    transferToDepositForm.resetFields();
  };

  // Handle withdraw from deposit
  const handleWithdrawFromDepositClick = () => {
    setIsWithdrawFromDepositModalOpen(true);
    withdrawFromDepositForm.resetFields();
  };

  const handleWithdrawFromDepositSubmit = async (values: {
    amount: number;
  }) => {
    try {
      setWithdrawFromDepositLoading(true);
      
      await FinanceService.withdrawFromDeposit(values);

      message.success('Hoàn tiền từ ký quỹ thành công!');
      setIsWithdrawFromDepositModalOpen(false);
      withdrawFromDepositForm.resetFields();
      refresh();
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể rút tiền từ ký quỹ';
      
      // Check if error is about CREDIT < DEBT
      if (errorMessage.includes('CREDIT < DEBT') || errorMessage.includes('creditAfter')) {
        message.error('Không thể hoàn tiền ký quỹ về ví khả dụng do số dư sau khi hoàn không đủ để bù công nợ hiện tại.');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setWithdrawFromDepositLoading(false);
    }
  };

  const handleWithdrawFromDepositCancel = () => {
    setIsWithdrawFromDepositModalOpen(false);
    withdrawFromDepositForm.resetFields();
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8 text-orange-600" />
          <Title level={2} className="!mb-0">
            Ví cửa hàng
          </Title>
        </div>
        <Text type="secondary">Quản lý tài chính, giao dịch và doanh thu của cửa hàng</Text>
      </div>

      {/* Wallet Overview Error */}
      {walletOverviewError && (
        <Alert
          type="error"
          message="Lỗi tải tổng quan ví"
          description={walletOverviewError}
          showIcon
          closable
        />
      )}

      {/* Wallet Overview Cards */}
      <Card 
        title="Tổng quan ví" 
        className="shadow-sm"
        extra={
          <Button 
            type="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={handleTopupClick}
            className="bg-orange-600 hover:bg-orange-700 border-orange-600"
          >
            Nạp tiền
          </Button>
        }
      >
        {walletOverviewLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : walletOverview ? (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card className="h-full border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Số dư Ví</span>
                    </div>
                  }
                  value={walletOverview.defaultBalance || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ 
                    color: '#1890ff', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                />
                <div className="mt-2 text-xs text-gray-500 mb-3">
                  Số dư khả dụng trong hệ thống
              </div>
                <div className="flex flex-col gap-2 mt-3">
                  <Button
                    size="small"
                    icon={<Minus className="w-3 h-3" />}
                    onClick={handleWithdrawClick}
                    disabled={!walletOverview.defaultBalance || walletOverview.defaultBalance <= 0}
                    className="text-xs"
                  >
                    Rút tiền
                  </Button>
                  <Button
                    size="small"
                    icon={<ArrowRight className="w-3 h-3" />}
                    onClick={handleTransferToDepositClick}
                    disabled={!walletOverview.defaultBalance || walletOverview.defaultBalance <= 0}
                    className="text-xs"
                  >
                    Chuyển sang ký quỹ
                  </Button>
                  </div>
            </Card>
          </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card className="h-full border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <Statistic
                title={
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Tiền ký quỹ</span>
                  </div>
                }
                  value={walletOverview.depositBalance || 0}
                formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ 
                    color: '#52c41a', 
                    fontSize: '24px', 
                    fontWeight: 'bold' 
                  }}
                />
                <div className="mt-2 text-xs text-gray-500 mb-3">
                  Số tiền đã ký quỹ
                  </div>
                <div className="flex flex-col gap-2 mt-3">
                  <Button
                    size="small"
                    icon={<TrendingDown className="w-3 h-3" />}
                    onClick={handleWithdrawFromDepositClick}
                    disabled={!walletOverview.depositBalance || walletOverview.depositBalance <= 0}
                    className="text-xs"
                  >
                    Hoàn về ví khả dụng
                  </Button>
                    </div>
              </Card>
            </Col>
          </Row>
        ) : (
                    <Empty
            description="Không có dữ liệu tổng quan ví"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
        )}
      </Card>


      {/* Filters */}
      <Card title="Bộ lọc giao dịch" className="shadow-sm">
        <div className="space-y-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Khoảng thời gian</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Loại giao dịch</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn loại giao dịch"
                  allowClear
                  value={filters.type}
                  onChange={handleTypeChange}
                >
                  <Select.Option value="DEPOSIT">Nạp tiền</Select.Option>
                  <Select.Option value="TOPUP">Nạp tiền vào ví</Select.Option>
                  <Select.Option value="PENDING_HOLD">Giữ tiền chờ xác nhận</Select.Option>
                  <Select.Option value="RELEASE_PENDING">Giải phóng tiền chờ</Select.Option>
                  <Select.Option value="WITHDRAW">Rút tiền</Select.Option>
                  <Select.Option value="REFUND">Hoàn tiền</Select.Option>
                  <Select.Option value="REFUND_RETURN">Hoàn tiền trả hàng</Select.Option>
                  <Select.Option value="REFUND_FORCE">Hoàn tiền bắt buộc</Select.Option>
                  <Select.Option value="ADJUSTMENT">Điều chỉnh thủ công</Select.Option>
                  <Select.Option value="DEBT_PAYMENT">Thanh toán công nợ</Select.Option>
                  <Select.Option value="TRANSFER_TO_DEPOSIT">Chuyển tiền sang ký quỹ</Select.Option>
                  <Select.Option value="TRANSFER_DEPOSIT_TO_DEFAULT">Hoàn tiền từ ký quỹ</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Mã giao dịch</Text>
                <Input.Search
                  placeholder="Nhập mã giao dịch"
                  value={transactionIdSearch}
                  onChange={(e) => setTransactionIdSearch(e.target.value)}
                  onSearch={handleTransactionIdSearch}
                  enterButton={<Search className="w-4 h-4" />}
                />
              </div>
            </Col>
          </Row>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={refresh}
              loading={isLoading}
            >
              Làm mới
            </Button>
            <Button onClick={handleClearFilters} disabled={!filters.type && !filters.from && !filters.transactionId}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải giao dịch"
          description={error}
          showIcon
          closable
        />
      )}

      {/* Transactions List (Vertical) */}
      <Card title="Lịch sử giao dịch" className="shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Text strong className="text-base">
              Danh sách giao dịch
            </Text>
            <Text type="secondary" className="ml-2 text-sm">
              ({totalElements} giao dịch)
            </Text>
          </div>
        </div>

        {isLoading && transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : transactions.length === 0 ? (
          <Empty
            description="Không có giao dịch nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isPositive = ['DEPOSIT', 'RELEASE_PENDING', 'REFUND', 'REFUND_RETURN', 'REFUND_FORCE', 'TOPUP', 'TRANSFER_DEPOSIT_TO_DEFAULT'].includes(transaction.type);
                const borderColor = isPositive ? 'border-l-green-500' : 'border-l-red-500';
                const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
                
                // Format description
                const formattedDesc = formatTransactionDescription(transaction.description, transaction.type);
                
                return (
                  <Card
                    key={transaction.transactionId}
                    className={`shadow-sm hover:shadow-md transition-shadow border-l-4 ${borderColor}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-1 space-y-3">
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <Tag color={getTransactionTypeColor(transaction.type)} className="text-sm font-medium">
                            {transaction.displayType || transaction.type}
                          </Tag>
                          <Text code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {transaction.transactionId.slice(0, 8).toUpperCase()}
                          </Text>
                          {(transaction.orderId || formattedDesc.orderId) && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <ShoppingBag className="w-3 h-3" />
                              <Text code className="text-xs">
                                {(transaction.orderId || formattedDesc.orderId || '').slice(0, 8).toUpperCase()}
                              </Text>
                            </div>
                          )}
                        </div>

                        {/* Description - Formatted */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                              {formattedDesc.icon}
                            </div>
                            <div className="flex-1">
                              <Text strong className="text-sm text-gray-800 block mb-1">
                                {formattedDesc.title}
                              </Text>
                              
                              {/* Details for special transactions */}
                              {formattedDesc.details && formattedDesc.details.length > 0 && (
                                <div className="mt-2 space-y-1.5 pl-6 border-l-2 border-yellow-400 bg-yellow-50/50 rounded-r p-2.5">
                                  {formattedDesc.details.map((detail, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <Text className="text-gray-600 font-medium">{detail.label}:</Text>
                                      <Text className={detail.strong ? `font-semibold ${detail.color}` : detail.color}>
                                        {detail.value}
                                      </Text>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Note */}
                              {formattedDesc.note && (
                                <Text className="text-xs text-gray-500 italic mt-2 block">
                                  💡 {formattedDesc.note}
                                </Text>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{dayjs(transaction.createdAt).format('DD/MM/YYYY HH:mm:ss')}</span>
                        </div>
                      </div>

                      {/* Right Section - Amount & Balance */}
                      <div className="flex flex-col md:items-end gap-2 min-w-[200px]">
                        {/* Amount */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
                          {isPositive ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                          )}
                          <div className="flex flex-col">
                            <Text className="text-xs text-gray-600">Số tiền</Text>
                            <Text 
                              strong 
                              className={`text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isPositive ? '+' : '-'}
                              {formatCurrency(Math.abs(transaction.amount))}
                            </Text>
                          </div>
                        </div>

                        {/* Balance After */}
                        <div className="text-right">
                          <Text className="text-xs text-gray-500 block">Số dư sau giao dịch</Text>
                          <Text strong className="text-base text-gray-800">
                            {formatCurrency(transaction.balanceAfter)}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} của {totalElements} giao dịch
              </div>
              <Pagination
                current={page + 1}
                pageSize={pageSize}
                total={totalElements}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} giao dịch`
                }
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={(newPage, newSize) => {
                  handlePageChange(newPage - 1);
                  if (newSize !== pageSize) {
                    handlePageSizeChange(newSize);
                  }
                }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Topup Modal */}
      <Modal
        title="Nạp tiền vào ví khả dụng"
        open={isTopupModalOpen}
        onCancel={handleTopupCancel}
        footer={null}
        width={500}
      >
        <Form
          form={topupForm}
          layout="vertical"
          onFinish={handleTopupSubmit}
          validateTrigger={['onBlur', 'onChange']}
        >
          <Form.Item
            label="Số tiền nạp"
            name="amount"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 10000, 
                message: 'Số tiền tối thiểu là 10,000 VNĐ' 
              },
              {
                validator: (_, value) => {
                  if (!value || value === '') {
                    return Promise.reject(new Error('Vui lòng nhập số tiền'));
                  }
                  if (typeof value !== 'number' || isNaN(value)) {
                    return Promise.reject(new Error('Số tiền phải là số hợp lệ'));
                  }
                  if (value < 10000) {
                    return Promise.reject(new Error('Số tiền tối thiểu là 10,000 VNĐ'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => {
                if (!value) return '';
                // Chỉ giữ lại số
                const numericValue = String(value).replace(/\D/g, '');
                return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }}
              parser={(value) => {
                if (!value) return 0 as any;
                // Chỉ giữ lại số, loại bỏ tất cả ký tự không phải số
                const numericValue = value.replace(/\D/g, '');
                return (numericValue ? Number(numericValue) : 0) as any;
              }}
              placeholder="Nhập số tiền (chỉ số)"
              addonAfter="VNĐ"
              min={10000}
              step={10000}
              style={{ width: '100%' }}
              controls={true}
              onKeyPress={(e) => {
                // Chỉ cho phép nhập số
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>

          <Alert
            message="Lưu ý"
            description="Bạn sẽ được chuyển đến trang thanh toán PayOS để hoàn tất giao dịch nạp tiền. Số tiền sẽ được nạp vào số dư ví khả dụng."
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item shouldUpdate>
            {({ getFieldsError }) => {
              const errors = getFieldsError();
              const hasErrors = errors.some(({ errors }) => errors.length > 0);
              const amount = topupForm.getFieldValue('amount');
              const isValid = !hasErrors && amount && amount >= 10000;
              
              return (
                <div className="flex gap-2 justify-end">
                  <Button onClick={handleTopupCancel}>
                    Hủy
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={topupLoading} 
                    disabled={!isValid}
                    className="bg-orange-600 hover:bg-orange-700 border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục thanh toán
                  </Button>
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        title="Rút tiền từ ví khả dụng"
        open={isWithdrawModalOpen}
        onCancel={handleWithdrawCancel}
        footer={null}
        width={600}
      >
        <Form
          form={withdrawForm}
          layout="vertical"
          onFinish={handleWithdrawSubmit}
          validateTrigger={['onBlur', 'onChange']}
        >
          <Form.Item
            label="Số tiền rút"
            name="amount"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 10000, 
                message: 'Số tiền tối thiểu là 10,000 VNĐ' 
              },
              {
                validator: (_, value) => {
                  if (value && walletOverview && value > walletOverview.defaultBalance) {
                    return Promise.reject(new Error('Số tiền rút không được vượt quá số dư hiện có'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
              placeholder="Nhập số tiền"
              addonAfter="VNĐ"
              min={10000}
              step={10000}
              style={{ width: '100%' }}
              max={walletOverview?.defaultBalance || undefined}
            />
          </Form.Item>

          {walletOverview && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-sm text-gray-600">Số dư hiện có: </Text>
              <Text strong className="text-base text-blue-600">
                {formatCurrency(walletOverview.defaultBalance)}
              </Text>
            </div>
          )}

          <Form.Item
            label="Tên ngân hàng"
            name="bankName"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng chọn ngân hàng' }
            ]}
          >
            <BankSelector
              value={withdrawForm.getFieldValue('bankName') || ''}
              onChange={(_bankCode, bankName) => {
                withdrawForm.setFieldsValue({ bankName });
                // Trigger validation after setting value
                setTimeout(() => {
                  withdrawForm.validateFields(['bankName']);
                }, 0);
              }}
              error={withdrawForm.getFieldError('bankName')[0]}
            />
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="bankAccountNo"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập số tài khoản' },
              { min: 8, message: 'Số tài khoản phải có ít nhất 8 số' },
              { pattern: /^\d+$/, message: 'Số tài khoản chỉ được chứa số' }
            ]}
          >
            <Input placeholder="Nhập số tài khoản ngân hàng" />
          </Form.Item>

          <Form.Item
            label="Tên chủ tài khoản"
            name="bankAccountName"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập tên chủ tài khoản' },
              { min: 2, message: 'Tên chủ tài khoản phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên chủ tài khoản" />
          </Form.Item>

          <Form.Item
            label="Ghi chú (tùy chọn)"
            name="note"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Nhập ghi chú cho giao dịch rút tiền..."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Alert
            message="Lưu ý"
            description="Kiêm tra thật kĩ các thông tin tài khoản ngân hàng của bạn."
            type="warning"
            showIcon
            className="mb-4"
          />

          <div className="flex gap-2 justify-end">
            <Button onClick={handleWithdrawCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={withdrawLoading} className="bg-red-600 hover:bg-red-700 border-red-600">
              Xác nhận rút tiền
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Transfer to Deposit Modal */}
      <Modal
        title="Chuyển tiền sang ký quỹ"
        open={isTransferToDepositModalOpen}
        onCancel={handleTransferToDepositCancel}
        footer={null}
        width={500}
      >
        <Form
          form={transferToDepositForm}
          layout="vertical"
          onFinish={handleTransferToDepositSubmit}
          validateTrigger={['onBlur', 'onChange']}
        >
          <Form.Item
            label="Số tiền chuyển"
            name="amount"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 1000, 
                message: 'Số tiền tối thiểu là 1,000 VNĐ' 
              },
              {
                validator: (_, value) => {
                  if (value && walletOverview && value > walletOverview.defaultBalance) {
                    return Promise.reject(new Error('Số tiền chuyển không được vượt quá số dư hiện có'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
              placeholder="Nhập số tiền"
              addonAfter="VNĐ"
              min={1000}
              step={1000}
              style={{ width: '100%' }}
              max={walletOverview?.defaultBalance || undefined}
            />
          </Form.Item>

          {walletOverview && (
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Text className="text-sm text-gray-600">Số dư ví khả dụng: </Text>
                <Text strong className="text-base text-blue-600">
                  {formatCurrency(walletOverview.defaultBalance)}
                </Text>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Text className="text-sm text-gray-600">Số dư ký quỹ hiện tại: </Text>
                <Text strong className="text-base text-green-600">
                  {formatCurrency(walletOverview.depositBalance)}
                </Text>
              </div>
            </div>
          )}

          <Form.Item
            label="Ghi chú (tùy chọn)"
            name="note"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Nhập ghi chú cho giao dịch chuyển tiền..."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Alert
            message="Lưu ý"
            description="Tiền ký quỹ được sử dụng để đảm bảo thanh toán các khoản nợ phát sinh. Bạn có thể hoàn tiền từ ký quỹ về ví khả dụng bất cứ lúc nào (nếu đủ điều kiện)."
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="flex gap-2 justify-end">
            <Button onClick={handleTransferToDepositCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={transferToDepositLoading} className="bg-green-600 hover:bg-green-700 border-green-600">
              Xác nhận chuyển tiền
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Withdraw from Deposit Modal */}
      <Modal
        title="Hoàn tiền từ ký quỹ về ví khả dụng"
        open={isWithdrawFromDepositModalOpen}
        onCancel={handleWithdrawFromDepositCancel}
        footer={null}
        width={500}
      >
        <Form
          form={withdrawFromDepositForm}
          layout="vertical"
          onFinish={handleWithdrawFromDepositSubmit}
          validateTrigger={['onBlur', 'onChange']}
        >
          <Form.Item
            label="Số tiền hoàn"
            name="amount"
            hasFeedback
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { 
                type: 'number', 
                min: 0.01, 
                message: 'Số tiền tối thiểu là 0.01 VNĐ' 
              },
              {
                validator: (_, value) => {
                  if (value && walletOverview && value > walletOverview.depositBalance) {
                    return Promise.reject(new Error('Số tiền hoàn không được vượt quá số dư ký quỹ hiện có'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
              placeholder="Nhập số tiền"
              addonAfter="VNĐ"
              min={0.01}
              step={1000}
              style={{ width: '100%' }}
              max={walletOverview?.depositBalance || undefined}
              precision={2}
            />
          </Form.Item>

          {walletOverview && (
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-green-50 rounded-lg">
                <Text className="text-sm text-gray-600">Số dư ký quỹ hiện tại: </Text>
                <Text strong className="text-base text-green-600">
                  {formatCurrency(walletOverview.depositBalance)}
                </Text>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Text className="text-sm text-gray-600">Số dư ví khả dụng: </Text>
                <Text strong className="text-base text-blue-600">
                  {formatCurrency(walletOverview.defaultBalance)}
                </Text>
              </div>
            </div>
          )}

          <Alert
            message="Điều kiện hoàn tiền"
            description="Sau khi hoàn tiền, số dư ký quỹ còn lại phải đảm bảo đủ để thanh toán các khoản nợ hiện tại. Nếu không đủ điều kiện, giao dịch sẽ bị từ chối."
            type="warning"
            showIcon
            className="mb-4"
          />

          <div className="flex gap-2 justify-end">
            <Button onClick={handleWithdrawFromDepositCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={withdrawFromDepositLoading} className="bg-blue-600 hover:bg-blue-700 border-blue-600">
              Xác nhận hoàn tiền
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default FinancePage;
