import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Tag,
  Typography,
  Card,
  DatePicker,
  Select,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Avatar,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Info,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Store,
  User,
  Package,
} from 'lucide-react';
import { PlatformWalletService } from '../../../services/admin/PlatformWalletService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { 
  PlatformWallet, 
  PlatformTransaction, 
  PlatformTransactionType,
  PlatformTransactionStatus 
} from '../../../types/admin';
import { formatCurrency } from '../../../utils/orderStatus';
import dayjs, { type Dayjs } from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface StoreInfo {
  id: string;
  name?: string;
  logoUrl?: string | null;
}

const PlatformWalletPage: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<PlatformWallet | null>(null);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [storeInfoMap, setStoreInfoMap] = useState<Map<string, StoreInfo>>(new Map());
  const [loadingStores, setLoadingStores] = useState(false);
  
  // Filters
  const [storeId, setStoreId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [status, setStatus] = useState<PlatformTransactionStatus | undefined>(undefined);
  const [type, setType] = useState<PlatformTransactionType | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [transactionIdSearch, setTransactionIdSearch] = useState<string>('');

  // Load store info for transactions
  const loadStoreInfo = useCallback(async (transactions: PlatformTransaction[]) => {
    const storeIds = transactions
      .map(t => t.storeId)
      .filter((id): id is string => id !== null && id !== undefined)
      .filter((id, index, self) => self.indexOf(id) === index); // unique

    if (storeIds.length === 0) return;

    try {
      setLoadingStores(true);
      const storeMap = await AdminStoreService.getStoresByIds(storeIds);
      setStoreInfoMap(prev => {
        const newMap = new Map(prev);
        storeMap.forEach((info, id) => {
          newMap.set(id, {
            id: info.id,
            name: info.name || info.storeName,
            logoUrl: info.logoUrl,
          });
        });
        return newMap;
      });
    } catch (e) {
      console.error('Error loading store info:', e);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Load wallet info
  const loadWalletInfo = useCallback(async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const data = await PlatformWalletService.getPlatformWallet();
      setWalletInfo(data);
      // Set initial transactions from wallet
      if (data.transactions) {
        setTransactions(data.transactions);
        // Load store info for transactions
        loadStoreInfo(data.transactions);
      }
    } catch (e: any) {
      setWalletError(e?.message || 'Không thể tải thông tin ví hệ thống');
      setWalletInfo(null);
    } finally {
      setWalletLoading(false);
    }
  }, [loadStoreInfo]);

  // Load filtered transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {};
      if (storeId) params.storeId = storeId;
      if (customerId) params.customerId = customerId;
      if (status) params.status = status;
      if (type) params.type = type;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].toISOString();
        params.to = dateRange[1].toISOString();
      }

      const data = await PlatformWalletService.filterTransactions(params);
      setTransactions(data || []);
      // Load store info for filtered transactions
      if (data && data.length > 0) {
        loadStoreInfo(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách giao dịch');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, customerId, status, type, dateRange, loadStoreInfo]);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  useEffect(() => {
    // Only load filtered transactions if filters are applied
    if (storeId || customerId || status || type || dateRange) {
      loadTransactions();
    } else {
      // Otherwise use transactions from wallet info
      if (walletInfo?.transactions) {
        setTransactions(walletInfo.transactions);
      }
    }
  }, [storeId, customerId, status, type, dateRange, walletInfo, loadTransactions]);

  const getTransactionTypeColor = (type: PlatformTransactionType): string => {
    const colorMap: Record<PlatformTransactionType, string> = {
      HOLD: 'orange',
      RELEASE: 'blue',
      REFUND: 'cyan',
      WITHDRAW: 'red',
      DEPOSIT: 'green',
      INITIALIZE: 'purple',
      PAYOUT_STORE: 'geekblue',
      PLATFORM_FEE: 'volcano',
      SHIPPING_FEE_ADJUST: 'gold',
      REFUND_CUSTOMER_RETURN: 'cyan',
    };
    return colorMap[type] || 'default';
  };

  const getTransactionTypeLabel = (type: PlatformTransactionType): string => {
    const labelMap: Record<PlatformTransactionType, string> = {
      HOLD: 'Giữ tiền',
      RELEASE: 'Giải phóng tiền',
      REFUND: 'Hoàn tiền',
      WITHDRAW: 'Rút tiền',
      DEPOSIT: 'Nạp tiền',
      INITIALIZE: 'Khởi tạo',
      PAYOUT_STORE: 'Thanh toán cửa hàng',
      PLATFORM_FEE: 'Phí nền tảng',
      SHIPPING_FEE_ADJUST: 'Điều chỉnh phí ship',
      REFUND_CUSTOMER_RETURN: 'Hoàn tiền trả hàng',
    };
    return labelMap[type] || type;
  };

  const getStatusColor = (status: PlatformTransactionStatus): string => {
    const colorMap: Record<PlatformTransactionStatus, string> = {
      PENDING: 'orange',
      DONE: 'green',
      FAILED: 'red',
    };
    return colorMap[status] || 'default';
  };

  const getStatusLabel = (status: PlatformTransactionStatus): string => {
    const labelMap: Record<PlatformTransactionStatus, string> = {
      PENDING: 'Đang chờ',
      DONE: 'Hoàn thành',
      FAILED: 'Thất bại',
    };
    return labelMap[status] || status;
  };

  const handleClearFilters = () => {
    setStoreId('');
    setCustomerId('');
    setStatus(undefined);
    setType(undefined);
    setDateRange(null);
    setTransactionIdSearch('');
  };

  const handleSearch = () => {
    if (transactionIdSearch) {
      const filtered = walletInfo?.transactions?.filter(t => 
        t.id.toLowerCase().includes(transactionIdSearch.toLowerCase())
      ) || [];
      setTransactions(filtered);
    } else {
      loadTransactions();
    }
  };

  const transactionColumns: ColumnsType<PlatformTransaction> = useMemo(() => [
    {
      title: (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Mã giao dịch</span>
        </div>
      ),
      dataIndex: 'id',
      key: 'id',
      width: 180,
      fixed: 'left',
      render: (id: string) => (
        <Tooltip title={id}>
          <Text code className="text-xs font-mono font-semibold text-gray-700">
            {id.slice(0, 8).toUpperCase()}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <span>Loại giao dịch</span>
        </div>
      ),
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: PlatformTransactionType) => (
        <Tag 
          color={getTransactionTypeColor(type)}
          className="px-3 py-1 text-xs font-medium"
        >
          {getTransactionTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: PlatformTransactionStatus) => (
        <Tag 
          color={getStatusColor(status)}
          className="px-3 py-1 text-xs font-medium"
        >
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <DollarSign className="w-4 h-4" />
          <span>Số tiền</span>
        </div>
      ),
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      align: 'right',
      render: (amount: number, record) => {
        const isPositive = ['DEPOSIT', 'RELEASE', 'REFUND', 'REFUND_CUSTOMER_RETURN'].includes(record.type);
        return (
          <div className="flex items-center justify-end gap-2">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <Text 
              strong 
              className={`text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : '-'}
              {formatCurrency(Math.abs(amount))}
            </Text>
          </div>
        );
      },
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Mã đơn hàng</span>
        </div>
      ),
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      render: (orderId: string | null) =>
        orderId ? (
          <Tooltip title={orderId}>
            <Text code className="text-xs font-mono text-gray-700">
              {orderId.slice(0, 8).toUpperCase()}...
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" className="text-xs italic">
            Không có
          </Text>
        ),
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4" />
          <span>Cửa hàng</span>
        </div>
      ),
      dataIndex: 'storeId',
      key: 'storeId',
      width: 220,
      render: (storeId: string | null) => {
        if (!storeId) {
          return (
            <Text type="secondary" className="text-xs italic">
              Không có
            </Text>
          );
        }
        
        const storeInfo = storeInfoMap.get(storeId);
        const storeName = storeInfo?.name || `Cửa hàng ${storeId.slice(0, 8)}`;
        const logoUrl = storeInfo?.logoUrl;
        const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=64`;

        return (
          <Space size="small" className="w-full">
            <Avatar
              src={logoUrl || defaultLogo}
              size={32}
              icon={!logoUrl && <Store className="w-4 h-4" />}
              className="flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <Text strong className="text-xs text-gray-800 truncate block">
                {storeName}
              </Text>
              <Tooltip title={storeId}>
                <Text code className="text-xs font-mono text-gray-500 truncate block">
                  {storeId.slice(0, 8).toUpperCase()}...
                </Text>
              </Tooltip>
            </div>
          </Space>
        );
      },
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Khách hàng</span>
        </div>
      ),
      dataIndex: 'customerId',
      key: 'customerId',
      width: 160,
      render: (customerId: string | null) =>
        customerId ? (
          <Tooltip title={customerId}>
            <Text code className="text-xs font-mono text-gray-700">
              {customerId.slice(0, 8).toUpperCase()}...
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" className="text-xs italic">
            Không có
          </Text>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (desc: string) => (
        <Tooltip title={desc} placement="topLeft">
          <Text className="text-sm text-gray-700 line-clamp-2">
            {desc}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Thời gian</span>
        </div>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <div className="flex flex-col">
          <Text className="text-sm font-medium text-gray-800">
            {dayjs(date).format('DD/MM/YYYY')}
          </Text>
          <Text className="text-xs text-gray-500">
            {dayjs(date).format('HH:mm:ss')}
          </Text>
        </div>
      ),
    },
  ], [storeInfoMap]);

  // Tooltip content for statistic cards
  const statisticTooltips = {
    totalBalance: 'Tổng số dư hiện tại của ví hệ thống, bao gồm cả tiền đang giữ và tiền đã giải phóng.',
    pendingBalance: 'Số tiền đang bị giữ lại từ các đơn hàng chưa đủ điều kiện để giải phóng (thường là 7 ngày).',
    doneBalance: 'Số tiền đã được giải phóng và có thể sử dụng, bao gồm cả các khoản đã thanh toán cho cửa hàng.',
    receivedTotal: 'Tổng số tiền đã nhận được từ khách hàng thông qua các giao dịch thanh toán online.',
    refundedTotal: 'Tổng số tiền đã hoàn lại cho khách hàng do hủy đơn, trả hàng hoặc các lý do khác.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8 text-orange-600" />
          <Title level={2} className="!mb-0">
            Ví hệ thống
          </Title>
        </div>
        <Text type="secondary">Quản lý tài chính và giao dịch của nền tảng</Text>
      </div>

      {/* Error Messages */}
      {walletError && (
        <Alert
          type="error"
          message="Lỗi tải thông tin ví"
          description={walletError}
          showIcon
          closable
        />
      )}

      {/* Wallet Overview Cards */}
      <Card 
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-green-500 rounded-full" />
            <span className="text-lg font-semibold">Tổng quan số dư ví hệ thống</span>
          </div>
        }
        className="shadow-sm"
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card className="h-full border-2 border-blue-200 hover:border-blue-400 transition-colors shadow-sm">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700">Tổng số dư</span>
                    <Tooltip title={statisticTooltips.totalBalance}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.totalBalance || 0}
                prefix={<DollarSign className="w-5 h-5 text-blue-500" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="h-full border-2 border-orange-200 hover:border-orange-400 transition-colors shadow-sm">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700">Số dư đang giữ</span>
                    <Tooltip title={statisticTooltips.pendingBalance}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-orange-500 transition-colors" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.pendingBalance || 0}
                prefix={<Clock className="w-5 h-5 text-orange-500" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="h-full border-2 border-green-200 hover:border-green-400 transition-colors shadow-sm">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700">Số tiền đã thanh toán</span>
                    <Tooltip title={statisticTooltips.doneBalance}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-green-500 transition-colors" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.doneBalance || 0}
                prefix={<CheckCircle className="w-5 h-5 text-green-500" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#3f8600', fontSize: '24px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="h-full border-2 border-cyan-200 hover:border-cyan-400 transition-colors shadow-sm">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700">Tổng tiền đã nhận</span>
                    <Tooltip title={statisticTooltips.receivedTotal}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-cyan-500 transition-colors" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.receivedTotal || 0}
                prefix={<TrendingUp className="w-5 h-5 text-cyan-500" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="h-full border-2 border-red-200 hover:border-red-400 transition-colors shadow-sm">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700">Đã hoàn trả</span>
                    <Tooltip title={statisticTooltips.refundedTotal}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-red-500 transition-colors" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.refundedTotal || 0}
                prefix={<AlertCircle className="w-5 h-5 text-red-500" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#cf1322', fontSize: '24px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card 
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <span className="text-lg font-semibold">Bộ lọc giao dịch</span>
          </div>
        }
        className="shadow-sm"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="space-y-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Khoảng thời gian
                </Text>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                  className="w-full"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Loại giao dịch
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn loại giao dịch"
                  allowClear
                  value={type}
                  onChange={(value) => setType(value)}
                  className="w-full"
                >
                  <Select.Option value="HOLD">Giữ tiền</Select.Option>
                  <Select.Option value="RELEASE">Giải phóng tiền</Select.Option>
                  <Select.Option value="REFUND">Hoàn tiền</Select.Option>
                  <Select.Option value="WITHDRAW">Rút tiền</Select.Option>
                  <Select.Option value="DEPOSIT">Nạp tiền</Select.Option>
                  <Select.Option value="INITIALIZE">Khởi tạo</Select.Option>
                  <Select.Option value="PAYOUT_STORE">Thanh toán cửa hàng</Select.Option>
                  <Select.Option value="PLATFORM_FEE">Phí nền tảng</Select.Option>
                  <Select.Option value="SHIPPING_FEE_ADJUST">Điều chỉnh phí ship</Select.Option>
                  <Select.Option value="REFUND_CUSTOMER_RETURN">Hoàn tiền trả hàng</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Trạng thái
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn trạng thái"
                  allowClear
                  value={status}
                  onChange={(value) => setStatus(value)}
                  className="w-full"
                >
                  <Select.Option value="PENDING">Đang chờ</Select.Option>
                  <Select.Option value="DONE">Hoàn thành</Select.Option>
                  <Select.Option value="FAILED">Thất bại</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Mã cửa hàng
                </Text>
                <Input
                  placeholder="Nhập mã cửa hàng"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Mã khách hàng
                </Text>
                <Input
                  placeholder="Nhập mã khách hàng"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Mã giao dịch
                </Text>
                <Input.Search
                  placeholder="Nhập mã giao dịch"
                  value={transactionIdSearch}
                  onChange={(e) => setTransactionIdSearch(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<Search className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
            </Col>
          </Row>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              type="primary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                loadWalletInfo();
                handleClearFilters();
              }}
              loading={isLoading || walletLoading}
              className="flex items-center gap-2"
            >
              Làm mới
            </Button>
            <Button 
              onClick={handleClearFilters} 
              disabled={!storeId && !customerId && !status && !type && !dateRange && !transactionIdSearch}
              className="flex items-center gap-2"
            >
              Xóa bộ lọc
            </Button>
            {(storeId || customerId || status || type || dateRange || transactionIdSearch) && (
              <Tag color="orange" className="ml-auto">
                Đang áp dụng bộ lọc
              </Tag>
            )}
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

      {/* Transactions Table */}
      <Card 
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-orange-500 rounded-full" />
            <span className="text-lg font-semibold">Lịch sử giao dịch</span>
          </div>
        }
        className="shadow-sm"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Text strong className="text-base text-gray-800">
              Danh sách giao dịch
            </Text>
            <Tag color="blue" className="px-3 py-1">
              {transactions.length} giao dịch
            </Tag>
            {loadingStores && (
              <Spin size="small" tip="Đang tải thông tin cửa hàng..." />
            )}
          </div>
        </div>

        {isLoading && transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : transactions.length === 0 ? (
          <Empty
            description="Không có giao dịch nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-12"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table
              rowKey="id"
              columns={transactionColumns}
              dataSource={transactions}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} giao dịch`,
                pageSizeOptions: ['10', '20', '50', '100'],
                className: 'px-4',
              }}
              scroll={{ x: 1600 }}
              className="transaction-table"
              rowClassName={(_record, index) => 
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }
            />
          </div>
        )}
      </Card>

      {/* Global styles for table headers */}
      <style>{`
        .ant-table-thead > tr > th {
          white-space: nowrap !important;
          background: #fafafa !important;
          font-weight: 600 !important;
          color: #262626 !important;
          border-bottom: 2px solid #e8e8e8 !important;
          padding: 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f5f5f5 !important;
        }
        .ant-statistic-title {
          white-space: nowrap !important;
        }
        .transaction-table .ant-table-container {
          border: none !important;
        }
        .transaction-table .ant-table {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PlatformWalletPage;

