import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Image,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
  Popover,
  Select,
  InputNumber,
  Modal,
  Switch,
  Input as AntInput,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  WarningOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminProductService, type ProductResponse, type ProductFilters } from '../../../services/admin/AdminProductService';
import { AdminCategoryService } from '../../../services/admin/AdminCategoryService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { showError } from '../../../utils/notification';
import type { CategoryTreeNode } from '../../../types/api';
import { usePolling } from '../../../hooks/usePolling';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Only for first load
  const [isFetching, setIsFetching] = useState(false); // For user actions (search, filter, etc.)
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false); // For silent background refresh
  const isInitialMount = useRef(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [allStores, setAllStores] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveApproved, setApproveApproved] = useState(true);
  const [approveReason, setApproveReason] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
  });

  // Load all stores for filter
  useEffect(() => {
    const loadStores = async () => {
      try {
        const stores = await AdminStoreService.getAllStores(0, 1000);
        setAllStores(stores.map(s => ({ id: s.id, name: s.name || `Store ${s.id.slice(0, 8)}` })));
      } catch (error) {
        console.error('Failed to load stores:', error);
      }
    };
    loadStores();
  }, []);

  // Load category tree for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await AdminCategoryService.getCategoryTree();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const flattenCategories = useCallback((nodes: CategoryTreeNode[], acc: { label: string; value: string }[] = []) => {
    nodes.forEach((node) => {
      acc.push({ label: node.name, value: node.name });
      if (node.children && node.children.length > 0) {
        flattenCategories(node.children, acc);
      }
    });
    return acc;
  }, []);

  const categoryOptions = useMemo(() => {
    const opts = flattenCategories(categories);
    return [{ label: 'Tất cả danh mục', value: '' }, ...opts];
  }, [categories, flattenCategories]);

  // Fetch products with silent mode support
  const fetchProducts = useCallback(async (silent: boolean = false) => {
    // Only show loading spinner on initial load or manual refresh (not silent)
    if (!silent) {
      if (isInitialMount.current) {
        setIsInitialLoading(true);
      } else {
        setIsFetching(true);
      }
    }
    
    try {
      const filters: ProductFilters = {
        page: (pagination.current || 1) - 1,
        size: pagination.pageSize || 20,
      };

      if (searchKeyword.trim()) filters.keyword = searchKeyword.trim();
      if (selectedStatus.length > 0) filters.status = selectedStatus.join(',');
      if (selectedStoreId) filters.storeId = selectedStoreId;
      if (selectedCategoryNames.length > 0) filters.categoryName = selectedCategoryNames.join(',');
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;

      const result = await AdminProductService.getAllProducts(filters);
      setProducts(result);
      setPagination(prev => ({
        ...prev,
        total: result.length, // API không trả total, dùng length tạm
      }));
    } catch (error: any) {
      // Only show error notification if not silent
      if (!silent) {
        showError(error?.message || 'Không thể tải danh sách sản phẩm');
      }
    } finally {
      if (!silent) {
        setIsInitialLoading(false);
        setIsFetching(false);
      }
    }
  }, [pagination.current, pagination.pageSize, searchKeyword, selectedStatus, selectedStoreId, selectedCategoryNames, minPrice, maxPrice]);

  // Auto fetch when filters or pagination change (not silent - user action)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchProducts(false); // Initial load - show loading
      return;
    }
    fetchProducts(false); // User action - show loading
    // Track all filter dependencies directly to ensure reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchKeyword, selectedStatus, selectedStoreId, selectedCategoryNames, minPrice, maxPrice]);

  // Polling: Auto reload every 10 seconds in background (SILENT - no loading spinner)
  // Skip initial fetch since useEffect already handles it
  usePolling(
    async () => {
      setIsBackgroundFetching(true);
      try {
        await fetchProducts(true);
      } finally {
        // Small delay to show indicator briefly
        setTimeout(() => setIsBackgroundFetching(false), 500);
      }
    },
    {
      interval: 10_000, // 10 seconds
      enabled: true,
      silent: true, // Background refresh won't show loading spinner
      skipInitialFetch: true, // Skip initial fetch - useEffect handles it to avoid duplicate calls
    }
  );

  // Handle search (not silent - user action)
  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    // fetchProducts will be called by useEffect when pagination changes
  }, []);

  // Handle table change
  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  // Handle view detail
  const handleViewDetail = useCallback((productId: string) => {
    navigate(`/admin/products/${productId}`);
  }, [navigate]);

  // Open approve modal
  const handleOpenApprove = useCallback((productId: string) => {
    setApproveTargetId(productId);
    setApproveApproved(true);
    setApproveReason('');
    setApproveModalOpen(true);
  }, []);

  // Submit approve/reject
  const handleSubmitApprove = useCallback(async () => {
    if (!approveTargetId) return;
    if (!approveApproved && !approveReason.trim()) {
      message.warning('Vui lòng nhập lý do khi không duyệt');
      return;
    }
    try {
      setApproveSubmitting(true);
      await AdminProductService.approveProduct(approveTargetId, {
        approved: approveApproved,
        reason: approveApproved ? undefined : approveReason.trim(),
      });
      message.success(approveApproved ? 'Đã duyệt sản phẩm' : 'Đã không duyệt sản phẩm');
      setApproveModalOpen(false);
      setApproveTargetId(null);
      setApproveReason('');
      fetchProducts(false); // Manual refresh after action - show loading briefly
    } catch (error: any) {
      showError(error?.message || 'Không thể cập nhật duyệt sản phẩm');
    } finally {
      setApproveSubmitting(false);
    }
  }, [approveTargetId, approveApproved, approveReason, fetchProducts]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSearchKeyword('');
    setSelectedStatus([]);
    setSelectedStoreId('');
    setSelectedCategoryNames([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
    setSelectedRowKeys([]);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'ACTIVE').length;
    const inactive = products.filter(p => p.status === 'INACTIVE').length;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

    return { total, active, inactive, totalStock };
  }, [products]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đang bán
          </Tag>
        );
      case 'INACTIVE':
        return (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            Ngừng bán
          </Tag>
        );
      case 'OUT_OF_STOCK':
        return (
          <Tag color="warning" icon={<WarningOutlined />}>
            Hết hàng
          </Tag>
        );
      case 'PENDING':
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Chờ duyệt
          </Tag>
        );
      case 'PENDING_APPROVAL':
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Chờ phê duyệt
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Bị từ chối
          </Tag>
        );
      case 'REJECT':
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Bị từ chối
          </Tag>
        );
      case 'DRAFT':
        return (
          <Tag color="default" icon={<FileTextOutlined />}>
            Nháp
          </Tag>
        );
      case 'DISCONTINUED':
        return (
          <Tag color="default" icon={<StopOutlined />}>
            Ngưng sản xuất
          </Tag>
        );
      case 'UNLISTED':
        return (
          <Tag color="default" icon={<AppstoreOutlined />}>
            Ẩn danh sách
          </Tag>
        );
      case 'SUSPENDED':
        return (
          <Tag color="error" icon={<ExclamationCircleOutlined />}>
            Tạm khóa
          </Tag>
        );
      case 'DELETED':
        return (
          <Tag color="error" icon={<DeleteOutlined />}>
            Đã xóa
          </Tag>
        );
      case 'BANNED':
        return (
          <Tag color="error" icon={<StopOutlined />}>
            Cấm
          </Tag>
        );
      default:
        return (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            {status || 'N/A'}
          </Tag>
        );
    }
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Get price display
  const getPriceDisplay = (product: ProductResponse) => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.variantPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return formatCurrency(minPrice);
      }
      return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    }
    return formatCurrency(product.price);
  };

  // Table columns
  const columns: ColumnsType<ProductResponse> = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_text, _record, index) => {
        const page = pagination.current || 1;
        const size = pagination.pageSize || 20;
        return <Text>{(page - 1) * size + index + 1}</Text>;
      },
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      align: 'center',
      render: (images: string[], record) => {
        const imageUrl = images?.[0] || record.variants?.[0]?.variantUrl;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={record.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            preview={{
              mask: <EyeOutlined />,
            }}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppstoreOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
          </div>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SKU: {record.sku}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.productId.slice(0, 8)}...
          </Text>
        </Space>
      ),
    },
    {
      title: 'Cửa hàng',
      key: 'store',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '13px' }}>
            {record.storeName}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.storeId.slice(0, 8)}...
          </Text>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      key: 'categories',
      width: 200,
      render: (_, record) => {
        const categories = (record as any).categories || [];
        if (categories.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space size={[0, 8]} wrap>
            {categories.map((cat: { categoryId: string; categoryName: string }, index: number) => (
              <Tag key={cat.categoryId || index} color="blue">
                {cat.categoryName}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Giá bán',
      key: 'price',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
          {getPriceDisplay(record)}
        </Text>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      align: 'center',
      render: (stock) => (
        <Text strong style={{ color: stock > 0 ? '#1890ff' : '#ff4d4f' }}>
          {stock}
        </Text>
      ),
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 120,
      align: 'center',
      render: (_, record) => (
        record.ratingAverage ? (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#faad14' }}>
              ⭐ {record.ratingAverage.toFixed(1)}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({record.reviewCount} đánh giá)
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Chưa có</Text>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => {
        const badge = getStatusBadge(status);
        const approvalReason = (record as any).approvalReason;
        
        // Nếu có lý do từ chối, hiển thị trong tooltip (bất kể status nào)
        if (approvalReason && approvalReason.trim()) {
          return (
            <Popover
              content={
                <div style={{ maxWidth: 300 }}>
                  <Text strong>Lý do:</Text>
                  <br />
                  <Text>{approvalReason}</Text>
                </div>
              }
              title="Lý do từ chối"
              trigger="hover"
            >
              {badge}
            </Popover>
          );
        }
        return badge;
      },
    },
    {
      title: 'Lý do từ chối',
      key: 'approvalReason',
      width: 200,
      align: 'left',
      render: (_, record) => {
        const approvalReason = (record as any).approvalReason;
        // Hiển thị approvalReason nếu có giá trị (bất kể status nào)
        if (approvalReason && approvalReason.trim()) {
          return (
            <Tooltip title={approvalReason}>
              <Text
                ellipsis
                style={{
                  color: '#ff4d4f',
                  fontSize: '12px',
                  maxWidth: 180,
                  display: 'block',
                }}
              >
                {approvalReason}
              </Text>
            </Tooltip>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.productId)}
          />
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'approve',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Duyệt / Không duyệt">
            <Button
              size="small"
              onClick={() => handleOpenApprove(record.productId)}
            >
              Duyệt/Không duyệt
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý sản phẩm
        </Title>
        <Text type="secondary">
          Xem và quản lý tất cả sản phẩm trên hệ thống
        </Text>
      </div>

      {/* Small background refresh indicator (optional, non-blocking) */}
      {isBackgroundFetching && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 1000,
            background: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#1890ff',
          }}
        >
          <SyncOutlined spin />
          <span>Đang cập nhật...</span>
        </div>
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={stats.total}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang bán"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ngừng bán"
              value={stats.inactive}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng tồn kho"
              value={stats.totalStock}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <Search
                placeholder="Tìm kiếm theo tên sản phẩm..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Lọc theo cửa hàng"
                allowClear
                showSearch
                size="large"
                style={{ width: '100%' }}
                value={selectedStoreId || undefined}
                onChange={setSelectedStoreId}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={allStores.map(store => ({
                  label: store.name,
                  value: store.id
                }))}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Trạng thái"
                allowClear
                mode="multiple"
                maxTagCount="responsive"
                size="large"
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={(vals) => setSelectedStatus(vals as string[])}
                optionFilterProp="label"
              >
                <Option value="ACTIVE" label="Đang bán">Đang bán</Option>
                <Option value="INACTIVE" label="Ngừng bán">Ngừng bán</Option>
                <Option value="OUT_OF_STOCK" label="Hết hàng">Hết hàng</Option>
                <Option value="PENDING" label="Chờ duyệt">Chờ duyệt</Option>
                <Option value="PENDING_APPROVAL" label="Chờ phê duyệt">Chờ phê duyệt</Option>
                <Option value="REJECTED" label="Bị từ chối">Bị từ chối</Option>
                <Option value="REJECT" label="Bị từ chối (mới)">Bị từ chối (mới)</Option>
                <Option value="DRAFT" label="Nháp">Nháp</Option>
                <Option value="DISCONTINUED" label="Ngưng sản xuất">Ngưng sản xuất</Option>
                <Option value="UNLISTED" label="Ẩn danh sách">Ẩn danh sách</Option>
                <Option value="SUSPENDED" label="Tạm khóa">Tạm khóa</Option>
                <Option value="DELETED" label="Đã xóa">Đã xóa</Option>
                <Option value="BANNED" label="Cấm">Cấm</Option>
              </Select>
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Danh mục"
                allowClear
                showSearch
                mode="multiple"
                maxTagCount="responsive"
                size="large"
                style={{ width: '100%' }}
                value={selectedCategoryNames}
                onChange={(vals) => setSelectedCategoryNames((vals as string[]) || [])}
                loading={categoriesLoading}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={categoryOptions}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={10}>
              <Space>
                <Text>Khoảng giá:</Text>
                <InputNumber
                  placeholder="Từ"
                  min={0}
                  value={minPrice}
                  onChange={(value) => setMinPrice(value || undefined)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                  style={{ width: 150 }}
                />
                <Text>-</Text>
                <InputNumber
                  placeholder="Đến"
                  min={0}
                  value={maxPrice}
                  onChange={(value) => setMaxPrice(value || undefined)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                  style={{ width: 150 }}
                />
              </Space>
            </Col>
            <Col xs={24} md={16}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={isFetching}
                  size="large"
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={isInitialLoading || isFetching}
                  size="large"
                >
                  Đặt lại
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="productId"
          loading={isInitialLoading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không tìm thấy sản phẩm nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Approve modal */}
      <Modal
        open={approveModalOpen}
        title="Duyệt / Không duyệt sản phẩm"
        okText="Xác nhận"
        cancelText="Hủy"
        onOk={handleSubmitApprove}
        onCancel={() => setApproveModalOpen(false)}
        confirmLoading={approveSubmitting}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center">
            <Text>Duyệt sản phẩm:</Text>
            <Switch
              checked={approveApproved}
              onChange={(val) => setApproveApproved(val)}
              checkedChildren="Duyệt"
              unCheckedChildren="Không duyệt"
            />
          </Space>
          {!approveApproved && (
            <AntInput.TextArea
              rows={3}
              placeholder="Nhập lý do không duyệt"
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
              maxLength={500}
              showCount
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default AdminProductManagement;
