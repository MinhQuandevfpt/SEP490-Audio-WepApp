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
  BarChart3,
  RefreshCw,
  DollarSign,
  Info,
  Store,
  Package,
  Calendar,
  FileText,
} from 'lucide-react';
import { SettlementService } from '../../../services/admin/SettlementService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { 
  SettlementReport,
  SettlementReportSummary,
  SettlementReportType,
  SettlementReportEntry,
} from '../../../types/admin';
import { formatCurrency } from '../../../utils/orderStatus';
import dayjs, { type Dayjs } from 'dayjs';

const { Text, Title } = Typography;

interface StoreInfo {
  id: string;
  name?: string;
  logoUrl?: string | null;
}

// Move reportTypes outside component to avoid recreation on each render
const REPORT_TYPES: { value: SettlementReportType; label: string; description: string }[] = [
  { value: 'UNDELI_COD', label: 'COD chưa giao hàng', description: 'Tổng tiền COD từ các đơn hàng chưa được giao' },
  { value: 'DELI_COD', label: 'COD đã giao hàng', description: 'Tổng tiền COD từ các đơn hàng đã được giao trong ngày' },
  { value: 'DELI_ONLINE', label: 'Đơn hàng online đã giao', description: 'Tổng tiền từ các đơn hàng thanh toán online đã giao trong ngày' },
  { value: 'PLATFORM_FEE_TO_COLLECT', label: 'Phí nền tảng cần thu', description: 'Tổng phí nền tảng cần thu từ các cửa hàng trong ngày' },
  { value: 'TOTAL_COLLECTED', label: 'Tổng đã thu', description: 'Tổng số tiền đã thu được trong ngày' },
];

const SettlementStatisticsPage: React.FC = () => {
  const [reportType, setReportType] = useState<SettlementReportType>('UNDELI_COD');
  const [reportDate, setReportDate] = useState<Dayjs | null>(null);
  const [reportStoreId, setReportStoreId] = useState<string>('');
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [summaries, setSummaries] = useState<Map<SettlementReportType, SettlementReportSummary>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeInfoMap, setStoreInfoMap] = useState<Map<string, StoreInfo>>(new Map());
  const [loadingStores, setLoadingStores] = useState(false);

  const needsDate = (type: SettlementReportType): boolean => {
    return ['DELI_COD', 'DELI_ONLINE', 'PLATFORM_FEE_TO_COLLECT', 'TOTAL_COLLECTED'].includes(type);
  };

  // Load store info for report entries
  const loadStoreInfo = useCallback(async (entries: SettlementReportEntry[]) => {
    const storeIds = entries
      .map(e => e.storeId)
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

  // Load all summaries for dashboard
  const loadAllSummaries = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const summaryPromises = REPORT_TYPES.map(async (rt) => {
        try {
          const params: any = { type: rt.value };
          if (needsDate(rt.value) && reportDate) {
            params.date = reportDate.format('YYYY-MM-DD');
          } else if (needsDate(rt.value) && !reportDate) {
            // Use today's date if not provided
            params.date = dayjs().format('YYYY-MM-DD');
          }
          if (reportStoreId) {
            params.storeId = reportStoreId;
          }
          const summary = await SettlementService.getSettlementReportSummary(params);
          return { type: rt.value, summary };
        } catch (e) {
          console.error(`Error loading summary for ${rt.value}:`, e);
          return null;
        }
      });

      const results = await Promise.all(summaryPromises);
      const newSummaries = new Map<SettlementReportType, SettlementReportSummary>();
      results.forEach(result => {
        if (result) {
          newSummaries.set(result.type, result.summary);
        }
      });
      setSummaries(newSummaries);
    } catch (e) {
      console.error('Error loading summaries:', e);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [reportDate, reportStoreId]);

  // Load detailed report
  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = { type: reportType };
      
      if (needsDate(reportType)) {
        if (reportDate) {
          params.date = reportDate.format('YYYY-MM-DD');
        } else {
          // Use today's date if not provided
          params.date = dayjs().format('YYYY-MM-DD');
        }
      }
      
      if (reportStoreId) {
        params.storeId = reportStoreId;
      }

      const data = await SettlementService.getSettlementReport(params);
      setReport(data);
      
      // Load store info for entries
      if (data.entries && data.entries.length > 0) {
        loadStoreInfo(data.entries);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải báo cáo settlement');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [reportType, reportDate, reportStoreId, loadStoreInfo]);

  // Load summaries on mount
  useEffect(() => {
    loadAllSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount initially

  // Reload summaries when date or storeId changes (but not on initial mount)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadAllSummaries();
  }, [reportDate, reportStoreId, loadAllSummaries]);

  const handleLoadReport = useCallback(() => {
    if (needsDate(reportType) && !reportDate) {
      setError('Vui lòng chọn ngày cho loại báo cáo này');
      return;
    }
    loadReport();
  }, [reportType, reportDate, loadReport]);

  // Auto-load report when reportType or reportDate changes (if valid)
  useEffect(() => {
    // Only auto-load if reportType is set and date is provided when needed
    if (reportType) {
      if (needsDate(reportType)) {
        // For types that need date, only load if date is set
        if (reportDate) {
          loadReport();
        }
      } else {
        // For types that don't need date, load immediately
        loadReport();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, reportDate]); // Only depend on reportType and reportDate, not loadReport to avoid loops

  const handleClearFilters = () => {
    setReportDate(null);
    setReportStoreId('');
    setReport(null);
    setError(null);
  };

  const getReportTypeColor = (type: SettlementReportType): { color: string; borderClass: string; valueColor: string } => {
    const colorMap: Record<SettlementReportType, { color: string; borderClass: string; valueColor: string }> = {
      UNDELI_COD: { color: 'orange', borderClass: 'border-orange-200 hover:border-orange-400', valueColor: '#fa8c16' },
      DELI_COD: { color: 'green', borderClass: 'border-green-200 hover:border-green-400', valueColor: '#52c41a' },
      DELI_ONLINE: { color: 'blue', borderClass: 'border-blue-200 hover:border-blue-400', valueColor: '#1890ff' },
      PLATFORM_FEE_TO_COLLECT: { color: 'red', borderClass: 'border-red-200 hover:border-red-400', valueColor: '#ff4d4f' },
      TOTAL_COLLECTED: { color: 'purple', borderClass: 'border-purple-200 hover:border-purple-400', valueColor: '#722ed1' },
    };
    return colorMap[type] || { color: 'default', borderClass: 'border-gray-200 hover:border-gray-400', valueColor: '#595959' };
  };

  const reportColumns: ColumnsType<SettlementReportEntry> = useMemo(() => [
    {
      title: (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Mã đơn hàng</span>
        </div>
      ),
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 180,
      fixed: 'left',
      render: (code: string) => (
        <Tooltip title={code}>
          <Text code className="text-xs font-mono font-semibold text-gray-700">
            {code}
          </Text>
        </Tooltip>
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
      render: (storeId: string) => {
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
      title: 'Phương thức thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 150,
      render: (method: string) => (
        <Tag color={method === 'COD' ? 'orange' : 'blue'} className="px-3 py-1 text-xs font-medium">
          {method}
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <DollarSign className="w-4 h-4" />
          <span>Tổng sản phẩm</span>
        </div>
      ),
      dataIndex: 'productsTotal',
      key: 'productsTotal',
      align: 'right',
      width: 150,
      render: (amount: number) => (
        <Text strong className="text-sm text-gray-800">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <span>Phí ship khách trả</span>
        </div>
      ),
      dataIndex: 'customerShippingFee',
      key: 'customerShippingFee',
      align: 'right',
      width: 150,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <span>Phí ship thực tế</span>
        </div>
      ),
      dataIndex: 'actualShippingFee',
      key: 'actualShippingFee',
      align: 'right',
      width: 150,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <span className="text-red-600">Phí nền tảng</span>
        </div>
      ),
      dataIndex: 'platformFeeAmount',
      key: 'platformFeeAmount',
      align: 'right',
      width: 150,
      render: (amount: number) => (
        <Text strong className="text-sm text-red-600">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 justify-end">
          <DollarSign className="w-4 h-4" />
          <span className="text-green-600">Thanh toán cho cửa hàng</span>
        </div>
      ),
      dataIndex: 'netPayoutToStore',
      key: 'netPayoutToStore',
      align: 'right',
      width: 200,
      render: (amount: number) => (
        <Text strong className="text-base font-bold text-green-600">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Ngày tạo</span>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <Title level={2} className="!mb-0">
            Thống kê Settlement / Payout
          </Title>
        </div>
        <Text type="secondary">Báo cáo và thống kê thanh toán, phí nền tảng và payout cho cửa hàng</Text>
      </div>

      {/* Error Messages */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải báo cáo"
          description={error}
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Summary Dashboard */}
      <Card 
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-purple-500 rounded-full" />
            <span className="text-lg font-semibold">Tổng quan các loại báo cáo</span>
          </div>
        }
        className="shadow-sm"
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {REPORT_TYPES.map((rt) => {
            const summary = summaries.get(rt.value);
            const colorConfig = getReportTypeColor(rt.value);
            
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={rt.value}>
                <Card 
                  className={`h-full border-2 ${colorConfig.borderClass} transition-colors shadow-sm cursor-pointer hover:shadow-md`}
                  onClick={() => {
                    setReportType(rt.value);
                    if (needsDate(rt.value)) {
                      // Always set date to today if not set, or keep current date
                      if (!reportDate) {
                        setReportDate(dayjs());
                      }
                    } else {
                      // For types that don't need date, clear date
                      setReportDate(null);
                    }
                    // Clear previous report to show loading state
                    setReport(null);
                    setError(null);
                  }}
                >
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <Tooltip title={rt.description}>
                          <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-purple-500 transition-colors" />
                        </Tooltip>
                        <span className="font-medium text-gray-700 text-sm">{rt.label}</span>
                      </div>
                    }
                    value={summary?.totalAmount || 0}
                    prefix={<DollarSign className="w-5 h-5" />}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ 
                      color: colorConfig.valueColor, 
                      fontSize: '20px', 
                      fontWeight: 'bold' 
                    }}
                    loading={isLoadingSummary}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Filters */}
      <Card 
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <span className="text-lg font-semibold">Bộ lọc báo cáo</span>
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
                  Loại báo cáo <span className="text-red-500">*</span>
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={reportType}
                  onChange={(value) => {
                    setReportType(value);
                    if (!needsDate(value)) {
                      setReportDate(null);
                    } else if (!reportDate) {
                      setReportDate(dayjs());
                    }
                  }}
                  className="w-full"
                >
                  {REPORT_TYPES.map(rt => (
                    <Select.Option key={rt.value} value={rt.value}>
                      {rt.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>

            {needsDate(reportType) && (
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-sm font-medium mb-2 block text-gray-700">
                    Ngày <span className="text-red-500">*</span>
                  </Text>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={reportDate}
                    onChange={(date) => setReportDate(date)}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    className="w-full"
                  />
                </div>
              </Col>
            )}

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm font-medium mb-2 block text-gray-700">
                  Mã cửa hàng (tùy chọn)
                </Text>
                <Input
                  placeholder="Nhập mã cửa hàng"
                  value={reportStoreId}
                  onChange={(e) => setReportStoreId(e.target.value)}
                  className="w-full"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div className="flex items-end h-full">
                <Button
                  type="primary"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={handleLoadReport}
                  loading={isLoading}
                  className="w-full"
                  disabled={needsDate(reportType) && !reportDate}
                >
                  {isLoading ? 'Đang tải...' : 'Tải lại báo cáo'}
                </Button>
              </div>
            </Col>
          </Row>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                loadAllSummaries();
                handleClearFilters();
              }}
              loading={isLoading || isLoadingSummary}
              className="flex items-center gap-2"
            >
              Làm mới
            </Button>
            <Button 
              onClick={handleClearFilters} 
              disabled={!reportDate && !reportStoreId && !report}
              className="flex items-center gap-2"
            >
              Xóa bộ lọc
            </Button>
            {(reportDate || reportStoreId || report) && (
              <Tag color="orange" className="ml-auto">
                Đang áp dụng bộ lọc
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* Report Details */}
      {report && (
        <Card 
          title={
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-green-500 rounded-full" />
              <span className="text-lg font-semibold">Chi tiết báo cáo</span>
            </div>
          }
          className="shadow-sm"
          bodyStyle={{ padding: '24px' }}
        >
          {/* Report Summary */}
          <Card 
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mb-6"
            bodyStyle={{ padding: '20px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Loại báo cáo</span>
                    </div>
                  }
                  value={REPORT_TYPES.find(rt => rt.value === report.reportType)?.label || report.reportType}
                  valueStyle={{ fontSize: '16px', fontWeight: '600', color: '#722ed1' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Số đơn hàng</span>
                    </div>
                  }
                  value={report.entries.length}
                  valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Tổng số tiền</span>
                    </div>
                  }
                  value={report.totalAmount}
                  prefix={<DollarSign className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Report Table */}
          {report.entries.length > 0 ? (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Text strong className="text-base text-gray-800">
                  Danh sách đơn hàng
                </Text>
                <Tag color="blue" className="px-3 py-1">
                  {report.entries.length} đơn hàng
                </Tag>
                {loadingStores && (
                  <Spin size="small" tip="Đang tải thông tin cửa hàng..." />
                )}
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-16 text-center">
              <Spin size="large" />
              <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : report.entries.length === 0 ? (
            <Empty
              description="Không có dữ liệu cho báo cáo này"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <Table
                rowKey="storeOrderId"
                columns={reportColumns}
                dataSource={report.entries}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} đơn hàng`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  className: 'px-4',
                }}
                scroll={{ x: 1600 }}
                className="settlement-table"
                rowClassName={(_record, index) => 
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Text strong className="text-sm mb-3 block">Chi tiết sản phẩm:</Text>
                      <Table
                        dataSource={record.items}
                        rowKey="itemId"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Tên sản phẩm',
                            dataIndex: 'productName',
                            key: 'productName',
                            render: (text: string) => (
                              <Text className="text-sm">{text}</Text>
                            ),
                          },
                          {
                            title: 'Số lượng',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            align: 'center',
                            width: 100,
                          },
                          {
                            title: 'Tổng tiền',
                            dataIndex: 'lineTotal',
                            key: 'lineTotal',
                            align: 'right',
                            render: (amount: number) => formatCurrency(amount),
                          },
                          {
                            title: 'Phí ship thực tế',
                            dataIndex: 'shippingFeeActual',
                            key: 'shippingFeeActual',
                            align: 'right',
                            render: (amount: number) => formatCurrency(amount),
                          },
                          {
                            title: 'Phí nền tảng',
                            dataIndex: 'platformFeeAmount',
                            key: 'platformFeeAmount',
                            align: 'right',
                            render: (amount: number) => (
                              <Text className="text-red-600">{formatCurrency(amount)}</Text>
                            ),
                          },
                          {
                            title: 'Thanh toán cho cửa hàng',
                            dataIndex: 'netPayoutItem',
                            key: 'netPayoutItem',
                            align: 'right',
                            render: (amount: number) => (
                              <Text strong className="text-green-600">
                                {formatCurrency(amount)}
                              </Text>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                  rowExpandable: (record) => record.items.length > 0,
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Global styles */}
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
        .settlement-table .ant-table-container {
          border: none !important;
        }
        .settlement-table .ant-table {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SettlementStatisticsPage;


