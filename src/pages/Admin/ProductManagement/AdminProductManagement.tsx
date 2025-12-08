import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Select,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminProductService, type ProductResponse, type ProductFilters } from '../../../services/admin/AdminProductService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { showError } from '../../../utils/notification';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | undefined>(undefined);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [allStores, setAllStores] = useState<Array<{ id: string; name: string }>>([]);
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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: ProductFilters = {
        page: (pagination.current || 1) - 1,
        size: pagination.pageSize || 20,
      };

      if (searchKeyword.trim()) filters.keyword = searchKeyword.trim();
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedStoreId) filters.storeId = selectedStoreId;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;

      const result = await AdminProductService.getAllProducts(filters);
      setProducts(result);
      setPagination(prev => ({
        ...prev,
        total: result.length, // API không trả total, dùng length tạm
      }));
    } catch (error: any) {
      showError(error?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchKeyword, selectedStatus, selectedStoreId, minPrice, maxPrice]);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search
  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchProducts();
  }, [fetchProducts]);

  // Handle table change
  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  // Handle view detail
  const handleViewDetail = useCallback((productId: string) => {
    navigate(`/admin/products/${productId}`);
  }, [navigate]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSearchKeyword('');
    setSelectedStatus(undefined);
    setSelectedStoreId('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
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
    return status === 'ACTIVE' ? (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        Đang bán
      </Tag>
    ) : (
      <Tag color="default" icon={<CloseCircleOutlined />}>
        Ngừng bán
      </Tag>
    );
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
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 120,
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
      render: (status) => getStatusBadge(status),
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
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý sản phẩm
        </Title>
        <Text type="secondary">
          Xem và quản lý tất cả sản phẩm trên hệ thống
        </Text>
      </div>

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
            <Col xs={24} md={12}>
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
            <Col xs={24} md={6}>
              <Select
                placeholder="Lọc theo cửa hàng"
                allowClear
                showSearch
                size="large"
                style={{ width: '100%' }}
                value={selectedStoreId || undefined}
                onChange={setSelectedStoreId}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={allStores.map(store => ({
                  label: store.name,
                  value: store.id
                }))}
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Trạng thái"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="ACTIVE">Đang bán</Option>
                <Option value="INACTIVE">Ngừng bán</Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
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
                  loading={isLoading}
                  size="large"
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={isLoading}
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
          loading={isLoading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
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
    </div>
  );
};

export default AdminProductManagement;
