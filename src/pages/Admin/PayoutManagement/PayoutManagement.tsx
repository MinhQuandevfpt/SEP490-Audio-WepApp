import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Empty,
  Input,
  Select,
  DatePicker,
  Form,
  Badge,
  Modal,
  Tooltip,
} from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined, PlusOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { DollarSign, Upload as UploadIcon, X } from 'lucide-react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { AdminPayoutService } from '../../../services/admin/AdminPayoutService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { FileUploadService } from '../../../services/FileUploadService';
import type { PayoutBill, PayoutBillStatus, PayoutBillListParams } from '../../../types/admin';
import { showCenterError, showSuccess, showError } from '../../../utils/notification';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface StoreOption {
  id: string;
  name: string;
}

const PayoutManagement: React.FC = () => {
  const navigate = useNavigate();
  const [payoutBills, setPayoutBills] = useState<PayoutBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PayoutBillStatus | 'ALL'>('ALL');
  const [searchBillCode, setSearchBillCode] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [storeMap, setStoreMap] = useState<Map<string, StoreOption>>(new Map());
  const [storesLoading, setStoresLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingBill, setCreatingBill] = useState(false);
  const [selectedStoreForCreate, setSelectedStoreForCreate] = useState<string>('');
  const [loadingCurrentBill, setLoadingCurrentBill] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedBillForMarkPaid, setSelectedBillForMarkPaid] = useState<PayoutBill | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markPaidForm] = Form.useForm();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} hóa đơn`,
  });

  // Get unique store IDs from bills
  const uniqueStoreIds = useMemo(() => {
    const ids = new Set<string>();
    payoutBills.forEach(bill => {
      if (bill.shopId) {
        ids.add(bill.shopId);
      }
    });
    return Array.from(ids);
  }, [payoutBills]);

  // Load store names when bills change
  useEffect(() => {
    if (uniqueStoreIds.length === 0) return;

    const loadStoreNames = async () => {
      // Check which stores are not yet loaded
      const uncachedIds: string[] = [];
      uniqueStoreIds.forEach(id => {
        if (!storeMap.has(id)) {
          uncachedIds.push(id);
        }
      });
      
      if (uncachedIds.length === 0) return;
      
      setStoresLoading(true);
      try {
        const stores = await AdminStoreService.getStoresByIds(uncachedIds);
        
        setStoreMap(prev => {
          const newMap = new Map(prev);
          stores.forEach((storeInfo, storeId) => {
            newMap.set(storeId, {
              id: storeId,
              name: storeInfo.name || `Cửa hàng ${storeId.slice(0, 8)}`
            });
          });
          return newMap;
        });
      } catch (error) {
        // Silently fail - store names are not critical
      } finally {
        setStoresLoading(false);
      }
    };

    loadStoreNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueStoreIds.join(',')]);

  useEffect(() => {
    fetchPayoutBills();
  }, [selectedStatus, dateRange, searchBillCode, storeId]);

  const fetchPayoutBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PayoutBillListParams = {};
      
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.fromDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
        params.toDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
      }
      
      if (searchBillCode.trim()) {
        params.billCode = searchBillCode.trim();
      }
      
      if (storeId.trim()) {
        params.storeId = storeId.trim();
      }

      const bills = await AdminPayoutService.getPayoutBills(params);
      setPayoutBills(bills || []);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tải danh sách hóa đơn payout';
      showCenterError(errorMessage, 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, dateRange, searchBillCode, storeId]);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  const handleViewDetail = useCallback((billId: string) => {
    navigate(`/admin/reports/payout/${billId}`);
  }, [navigate]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatus('ALL');
    setSearchBillCode('');
    setStoreId('');
    setSelectedStoreName('');
    setDateRange(null);
  }, []);

  const handleViewCurrentBill = useCallback(async () => {
    const targetStoreId = storeId.trim() || (selectedStoreName ? Array.from(storeMap.values()).find(s => s.name === selectedStoreName)?.id : '');
    
    if (!targetStoreId) {
      showCenterError('Vui lòng chọn hoặc nhập ID cửa hàng', 'Lỗi');
      return;
    }

    setLoadingCurrentBill(true);
    try {
      const currentBill = await AdminPayoutService.getCurrentPayoutBill(targetStoreId);
      // Navigate to detail page
      navigate(`/admin/reports/payout/${currentBill.id}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể lấy bill hiện tại';
      showCenterError(errorMessage, 'Lỗi');
    } finally {
      setLoadingCurrentBill(false);
    }
  }, [storeId, selectedStoreName, storeMap, navigate]);

  const handleCreateBill = useCallback(async () => {
    if (!selectedStoreForCreate) {
      showCenterError('Vui lòng chọn cửa hàng', 'Lỗi');
      return;
    }

    setCreatingBill(true);
    try {
      // Check if store has pending bills
      const pendingBills = payoutBills.filter(
        bill => bill.shopId === selectedStoreForCreate && bill.status === 'PENDING'
      );

      if (pendingBills.length > 0) {
        showCenterError(
          `Cửa hàng này đã có ${pendingBills.length} bill chưa thanh toán. Vui lòng thanh toán các bill cũ trước khi tạo bill mới.`,
          'Không thể tạo bill'
        );
        setCreatingBill(false);
        return;
      }

      const newBill = await AdminPayoutService.createPayoutBill(selectedStoreForCreate);
      showSuccess(`Tạo bill thành công! Mã bill: ${newBill.billCode}`);
      setShowCreateModal(false);
      setSelectedStoreForCreate('');
      
      // Refresh the list by calling fetchPayoutBills directly
      setIsLoading(true);
      try {
        const params: PayoutBillListParams = {};
        
        if (selectedStatus !== 'ALL') {
          params.status = selectedStatus;
        }
        
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.fromDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
          params.toDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
        }
        
        if (searchBillCode.trim()) {
          params.billCode = searchBillCode.trim();
        }
        
        if (storeId.trim()) {
          params.storeId = storeId.trim();
        }

        const bills = await AdminPayoutService.getPayoutBills(params);
        setPayoutBills(bills || []);
      } catch (error: any) {
        // Silently fail refresh
      } finally {
        setIsLoading(false);
      }
      
      // Navigate to detail page
      navigate(`/admin/reports/payout/${newBill.id}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tạo bill payout';
      showCenterError(errorMessage, 'Lỗi tạo bill');
    } finally {
      setCreatingBill(false);
    }
  }, [selectedStoreForCreate, selectedStatus, dateRange, searchBillCode, storeId, navigate]);

  const handleStoreNameChange = useCallback((storeName: string) => {
    setSelectedStoreName(storeName);
    // Find store ID from name
    if (storeName) {
      const store = Array.from(storeMap.values()).find(s => s.name === storeName);
      if (store) {
        setStoreId(store.id);
      }
    } else {
      setStoreId('');
    }
  }, [storeMap]);

  const handleImageSelect = useCallback((file: File) => {
    // Validate file
    const validation = FileUploadService.validateFile(file);
    if (!validation.isValid) {
      showError(validation.error || 'File không hợp lệ');
      return false;
    }

    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(previewUrl);
    
    return false; // Prevent default upload behavior
  }, []);

  const handleRemoveImage = useCallback(() => {
    // Clean up object URL to prevent memory leaks
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl('');
  }, [imagePreviewUrl]);

  const handleMarkPaid = useCallback(async () => {
    if (!selectedBillForMarkPaid) return;

    // Check if bill is in PENDING status
    if (selectedBillForMarkPaid.status !== 'PENDING') {
      showError(`Bill này đang ở trạng thái ${selectedBillForMarkPaid.status}, không thể đánh dấu đã thanh toán`);
      return;
    }

    try {
      const values = await markPaidForm.validateFields();
      
      // Validate image is required
      if (!selectedImageFile || !imagePreviewUrl) {
        showError('Vui lòng chọn ảnh chứng từ chuyển khoản');
        return;
      }
      
      setMarkingPaid(true);

      // Upload image (required)
      let proofImageUrl: string = '';
      if (selectedImageFile) {
        try {
          const uploadResult = await FileUploadService.uploadImage(selectedImageFile);
          if (uploadResult.url) {
            proofImageUrl = uploadResult.url;
          } else {
            showError('Upload ảnh thất bại. Không nhận được URL.');
            setMarkingPaid(false);
            return;
          }
        } catch (uploadError: any) {
          showError(uploadError?.message || 'Không thể upload ảnh. Vui lòng thử lại.');
          setMarkingPaid(false);
          return;
        }
      } else {
        showError('Vui lòng chọn ảnh chứng từ chuyển khoản');
        setMarkingPaid(false);
        return;
      }

      // Prepare params - reference is required
      if (!values.reference || !values.reference.trim()) {
        showError('Vui lòng nhập mã giao dịch chuyển khoản');
        setMarkingPaid(false);
        return;
      }

      // Ensure proofImageUrl is not empty after upload
      if (!proofImageUrl || !proofImageUrl.trim()) {
        showError('Upload ảnh thất bại. Vui lòng thử lại.');
        setMarkingPaid(false);
        return;
      }

      const markPaidParams: {
        reference: string;
        proofImageUrl: string;
        note?: string;
      } = {
        reference: values.reference.trim(),
        proofImageUrl: proofImageUrl.trim(),
      };

      if (values.note && values.note.trim()) {
        markPaidParams.note = values.note.trim();
      }

      console.log('Calling markPaidPayoutBill with:', {
        billId: selectedBillForMarkPaid.id,
        billCode: selectedBillForMarkPaid.billCode,
        shopId: selectedBillForMarkPaid.shopId,
        status: selectedBillForMarkPaid.status,
        totalNetPayout: selectedBillForMarkPaid.totalNetPayout,
        params: markPaidParams
      });

      await AdminPayoutService.markPaidPayoutBill(selectedBillForMarkPaid.id, markPaidParams);

      // Refresh list
      setIsLoading(true);
      const params: PayoutBillListParams = {};
      
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.fromDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
        params.toDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
      }
      
      if (searchBillCode.trim()) {
        params.billCode = searchBillCode.trim();
      }
      
      if (storeId.trim()) {
        params.storeId = storeId.trim();
      }

      const bills = await AdminPayoutService.getPayoutBills(params);
      setPayoutBills(bills || []);
      setIsLoading(false);

      // Clean up
      setShowMarkPaidModal(false);
      setSelectedBillForMarkPaid(null);
      handleRemoveImage();
      markPaidForm.resetFields();
      showSuccess('Đã đánh dấu bill đã thanh toán thành công!');
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      const errorMessage = error?.message || 'Không thể đánh dấu bill đã thanh toán';
      showError(errorMessage);
    } finally {
      setMarkingPaid(false);
    }
  }, [selectedBillForMarkPaid, markPaidForm, selectedImageFile, selectedStatus, dateRange, searchBillCode, storeId, handleRemoveImage]);

  const getStatusTag = useMemo(() => (status: PayoutBillStatus) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: 'Chờ thanh toán' },
      PAID: { color: 'success', text: 'Đã thanh toán' },
      CANCELED: { color: 'error', text: 'Đã hủy' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  }, []);

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
    });
  }, []);


  // Get unique stores for dropdown
  const storeOptions = useMemo(() => {
    const stores = new Map<string, StoreOption>();
    payoutBills.forEach(bill => {
      if (bill.shopId) {
        const store = storeMap.get(bill.shopId);
        if (store) {
          stores.set(bill.shopId, store);
        } else {
          stores.set(bill.shopId, {
            id: bill.shopId,
            name: `Cửa hàng ${bill.shopId.slice(0, 8)}`
          });
        }
      }
    });
    return Array.from(stores.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [payoutBills, storeMap]);

  // Stats
  const stats = useMemo(() => ({
    total: payoutBills.length,
    pending: payoutBills.filter(b => b.status === 'PENDING').length,
    paid: payoutBills.filter(b => b.status === 'PAID').length,
    canceled: payoutBills.filter(b => b.status === 'CANCELED').length,
    totalAmount: payoutBills.reduce((sum, b) => sum + b.totalNetPayout, 0),
  }), [payoutBills]);

  // Filter data based on selected status
  const filteredData = useMemo(() => {
    let filtered = payoutBills;
    
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(bill => bill.status === selectedStatus);
    }
    
    return filtered;
  }, [selectedStatus, payoutBills]);

  const columns: ColumnsType<PayoutBill> = useMemo(() => [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'billCode',
      key: 'billCode',
      width: 150,
      render: (billCode: string, record: PayoutBill) => (
        <div>
          <div className="font-medium text-blue-600">{billCode}</div>
          <div className="text-xs text-gray-500">ID: {record.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 220,
      render: (shopId: string) => {
        const store = storeMap.get(shopId);
        const storeName = store?.name;
        const isRealName = storeName && !storeName.startsWith('Cửa hàng ');
        
        return (
          <div>
            {isRealName ? (
              <>
                <div className="font-medium text-gray-900">{storeName}</div>
                <div className="text-xs text-gray-500">ID: {shopId.slice(0, 8)}...</div>
              </>
            ) : (
              <div className="text-sm text-gray-600">{shopId.slice(0, 8)}...</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Khoảng thời gian',
      key: 'dateRange',
      width: 200,
      render: (_: any, record: PayoutBill) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {formatDateTime(record.fromDate)}
          </div>
          <div className="text-xs text-gray-500">
            đến {formatDateTime(record.toDate)}
          </div>
        </div>
      ),
    },
    {
      title: 'Tổng hoá đơn',
      dataIndex: 'totalGross',
      key: 'totalGross',
      width: 150,
      align: 'right',
      render: (totalGross: number) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(totalGross)}
        </span>
      ),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'totalPlatformFee',
      key: 'totalPlatformFee',
      width: 150,
      align: 'right',
      render: (totalPlatformFee: number) => (
        <span className="text-orange-600">
          {formatCurrency(totalPlatformFee)}
        </span>
      ),
    },
    {
      title: 'Phí vận chuyển',
      key: 'shippingFee',
      width: 150,
      align: 'right',
      render: (_: any, record: PayoutBill) => {
        const tooltipContent = (
          <div className="text-xs">
            <div>Phí giao hàng: {formatCurrency(record.totalShippingOrderFee)}</div>
            <div>Phí hoàn hàng: {formatCurrency(record.totalReturnShippingFee)}</div>
            <div className="border-t border-gray-400 mt-1 pt-1 font-semibold">
              Tổng: {formatCurrency(record.totalShippingOrderFee + record.totalReturnShippingFee)}
            </div>
          </div>
        );
        
        return (
          <Space size={4}>
            <span className="text-gray-600">
              {formatCurrency(record.totalShippingOrderFee + record.totalReturnShippingFee)}
            </span>
            <Tooltip title={tooltipContent}>
              <QuestionCircleOutlined className="text-gray-400 text-xs cursor-help" />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Số tiền thanh toán',
      dataIndex: 'totalNetPayout',
      key: 'totalNetPayout',
      width: 180,
      align: 'right',
      render: (totalNetPayout: number) => (
        <span className="font-bold text-green-600 text-base">
          {formatCurrency(totalNetPayout)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      filters: [
        { text: 'Chờ thanh toán', value: 'PENDING' },
        { text: 'Đã thanh toán', value: 'PAID' },
        { text: 'Đã hủy', value: 'CANCELED' },
      ],
      onFilter: (value: any, record: PayoutBill) => record.status === value,
      render: (status: PayoutBillStatus) => getStatusTag(status),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: PayoutBill, b: PayoutBill) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: string) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(createdAt)}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: PayoutBill) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
            title="Xem chi tiết"
          />
          {record.status === 'PENDING' && (
            <Button
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBillForMarkPaid(record);
                setShowMarkPaidModal(true);
              }}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
              title="Đánh dấu đã thanh toán"
            />
          )}
        </Space>
      ),
    },
  ], [getStatusTag, handleViewDetail, formatCurrency, formatDateTime, storeMap]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý thanh toán cho cửa hàng
          </Typography.Title>
          <Typography.Text type="secondary">
            Xem và quản lý các hóa đơn thanh toán payout cho cửa hàng
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setShowCreateModal(true)}
        >
          Tạo bill mới
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng hóa đơn"
              value={stats.total}
              prefix={<DollarSign style={{ fontSize: '20px', color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ thanh toán"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={stats.paid}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng tiền thanh toán"
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              prefix={<DollarSign />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Tìm mã hóa đơn" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Nhập mã hóa đơn (PB-xxxx)"
                  prefix={<SearchOutlined />}
                  value={searchBillCode}
                  onChange={(e) => setSearchBillCode(e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Tên cửa hàng" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Chọn cửa hàng"
                  value={selectedStoreName || undefined}
                  onChange={handleStoreNameChange}
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    const label = option?.label as string;
                    return label ? label.toLowerCase().includes(input.toLowerCase()) : false;
                  }}
                  loading={storesLoading}
                  style={{ width: '100%' }}
                >
                  {storeOptions.map(store => (
                    <Option key={store.id} value={store.name} label={store.name}>
                      {store.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="ID cửa hàng" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Nhập ID cửa hàng"
                  value={storeId}
                  onChange={(e) => {
                    setStoreId(e.target.value);
                    if (!e.target.value) {
                      setSelectedStoreName('');
                    }
                  }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Khoảng thời gian" style={{ marginBottom: 0 }}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="DD/MM/YYYY HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%' }} direction="vertical" size="small">
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleViewCurrentBill}
                    loading={loadingCurrentBill}
                    disabled={!storeId.trim() && !selectedStoreName}
                    block
                  >
                    Xem bill hiện tại
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetFilters}
                    block
                  >
                    Đặt lại
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Filter Tabs */}
      <Tabs
        activeKey={selectedStatus}
        onChange={(key) => setSelectedStatus(key as any)}
        items={(['ALL', 'PENDING', 'PAID', 'CANCELED'] as const).map((status) => ({
          key: status,
          label: (
            <Space>
              <span>
                {status === 'ALL' ? 'Tất cả' : 
                 status === 'PENDING' ? 'Chờ thanh toán' : 
                 status === 'PAID' ? 'Đã thanh toán' : 'Đã hủy'}
              </span>
              <Badge
                count={
                  status === 'ALL' ? stats.total :
                  status === 'PENDING' ? stats.pending :
                  status === 'PAID' ? stats.paid : stats.canceled
                }
                style={{ backgroundColor: '#1890ff' }}
              />
            </Space>
          ),
        }))}
      />

      {/* Ant Design Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có hóa đơn payout nào.
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Create Bill Modal */}
      <Modal
        title="Tạo bill payout mới"
        open={showCreateModal}
        onOk={handleCreateBill}
        onCancel={() => {
          setShowCreateModal(false);
          setSelectedStoreForCreate('');
        }}
        confirmLoading={creatingBill}
        okText="Tạo bill"
        cancelText="Hủy"
        width={500}
      >
        <Form layout="vertical">
          <Form.Item
            label="Chọn cửa hàng"
            help="Chọn cửa hàng cần tạo bill payout"
          >
            <Select
              placeholder="Chọn cửa hàng"
              value={selectedStoreForCreate || undefined}
              onChange={(value) => setSelectedStoreForCreate(value)}
              showSearch
              optionLabelProp="label"
              filterOption={(input, option) => {
                const label = option?.label as string;
                return label ? label.toLowerCase().includes(input.toLowerCase()) : false;
              }}
              loading={storesLoading}
              style={{ width: '100%' }}
            >
              {storeOptions.map(store => (
                <Option key={store.id} value={store.id} label={store.name}>
                  {store.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedStoreForCreate && (
            <Form.Item label="Thông tin">
              <div className="text-sm text-gray-600">
                <p>Bill sẽ được tạo cho cửa hàng này với:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Tất cả OrderItem chưa được payout</li>
                  <li>Phí ship GHN chưa được thanh toán</li>
                  <li>Phí ship hoàn hàng chưa được thanh toán</li>
                </ul>
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal
        title="Xác nhận đã thanh toán"
        open={showMarkPaidModal}
        onOk={handleMarkPaid}
        onCancel={() => {
          setShowMarkPaidModal(false);
          setSelectedBillForMarkPaid(null);
          handleRemoveImage();
          markPaidForm.resetFields();
        }}
        confirmLoading={markingPaid}
        okText="Xác nhận đã thanh toán"
        cancelText="Hủy"
        width={600}
      >
        {selectedBillForMarkPaid && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-blue-900">Thông tin bill:</p>
              <p className="text-blue-800">Mã bill: <span className="font-mono">{selectedBillForMarkPaid.billCode}</span></p>
              <p className="text-blue-800">Tổng thanh toán: <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBillForMarkPaid.totalNetPayout)}</span></p>
            </div>
          </div>
        )}

        <Form
          form={markPaidForm}
          layout="vertical"
        >
          <Form.Item
            label="Mã giao dịch chuyển khoản"
            name="reference"
            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch' }]}
          >
            <Input placeholder="Ví dụ: TT6789" />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <span className="text-red-500">* </span>
                Ảnh chứng từ chuyển khoản
              </span>
            }
          >
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageSelect(file);
                  }
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
                id="receipt-image-upload"
              />
              <div
                onClick={() => {
                  if (!imagePreviewUrl) {
                    document.getElementById('receipt-image-upload')?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleImageSelect(file);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-gray-50 ${
                  imagePreviewUrl 
                    ? 'border-blue-500 hover:border-blue-600' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {imagePreviewUrl ? (
                  <div className="relative">
                    <img
                      src={imagePreviewUrl}
                      alt="Receipt preview"
                      className="max-w-full max-h-[300px] mx-auto rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ✓ Ảnh đã được chọn
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Tải ảnh chứng từ lên
                    </p>
                    <p className="text-xs text-gray-500">
                      Định dạng: JPG, PNG, WEBP, GIF (tối đa 10MB)
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Kéo thả ảnh vào đây hoặc click để chọn
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            label="Ghi chú"
            name="note"
          >
            <Input.TextArea
              rows={4}
              placeholder="Ghi chú của admin về giao dịch này..."
            />
          </Form.Item>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ClockCircleOutlined className="text-yellow-600 mt-1" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bill sẽ được đánh dấu là đã thanh toán (PAID)</li>
                  <li>Tất cả OrderItem và phí vận chuyển sẽ được cập nhật trạng thái đã thanh toán</li>
                  <li>Thao tác này không thể hoàn tác</li>
                </ul>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </Space>
  );
};

export default PayoutManagement;
