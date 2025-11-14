import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Table, Image, Tag, Space, Button, Tooltip, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Package,
  RefreshCw
} from 'lucide-react';
import { ProductService } from '../../../services/seller/ProductService';
import type { Product, ProductQueryParams } from '../../../types/seller';
import ProductDetailDrawer from './ProductDetailDrawer';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detail Drawer state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filter & Pagination states
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalProducts, setTotalProducts] = useState(0);

  // Memoized load products function
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: ProductQueryParams = {
        page: currentPage - 1, // Ant Design uses 1-based pagination, backend uses 0-based
        size: pageSize,
      };

      if (keyword.trim()) {
        params.keyword = keyword.trim();
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (selectedCategory) {
        params.categoryName = selectedCategory;
      }

      const response = await ProductService.getMyProducts(params);
      
      // Handle API response structure - data.content contains the products array
      let productsData: Product[] = [];
      let totalCount = 0;
      
      if (response && response.data) {
        // Check if response.data has content property (pagination structure)
        if (response.data.content && Array.isArray(response.data.content)) {
          productsData = response.data.content;
          totalCount = response.data.totalElements || response.data.content.length;
        } 
        // Fallback: check if response.data is directly an array (legacy structure)
        else if (Array.isArray(response.data)) {
          productsData = response.data;
          totalCount = response.data.length;
        } else {
          console.warn('⚠️ API returned unexpected data structure:', response.data);
          productsData = [];
          totalCount = 0;
        }
      } else {
        console.warn('⚠️ API response missing data field:', response);
        productsData = [];
        totalCount = 0;
      }
      
      setProducts(productsData);
      setTotalProducts(totalCount);
      
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải sản phẩm');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, keyword, selectedStatus, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleRefresh = useCallback(() => {
    setKeyword('');
    setSelectedStatus('');
    setSelectedCategory('');
    setCurrentPage(1);
  }, []);

  const handleTableChange = useCallback((pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
  }, []);

  const handleViewDetail = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedProductId(null);
  }, []);

  // Memoized stats calculations
  const stats = useMemo(() => {
    if (!Array.isArray(products)) return { active: 0, outOfStock: 0, pending: 0 };
    
    return {
      active: products.filter(p => p.status === 'ACTIVE').length,
      outOfStock: products.filter(p => p.status === 'OUT_OF_STOCK' || p.stockQuantity === 0).length,
      pending: products.filter(p => p.status === 'PENDING').length,
    };
  }, [products]);

  // Memoized table columns
  const columns: ColumnsType<Product> = useMemo(() => [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
      render: (_, product) => (
        <div className="flex items-center space-x-2">
          <Image
            width={48}
            height={48}
            src={product.images && product.images.length > 0 && product.images[0] !== 'string' ? product.images[0] : ''}
            alt={product.name}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f3f4f6' width='48' height='48'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
            className="rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
            <p className="text-xs text-gray-500 truncate">{product.brandName}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 100,
      ellipsis: true,
      render: (categoryName) => (
        <Tag color="purple" className="text-xs">{categoryName}</Tag>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 110,
      ellipsis: true,
      render: (sku) => <span className="font-mono text-xs">{sku}</span>,
    },
    {
      title: 'Giá bán',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 120,
      align: 'right',
      render: (_, product) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {ProductService.formatCurrency(product.finalPrice)}
          </p>
          {product.discountPrice && product.discountPrice > 0 && (
            <p className="text-xs text-gray-400 line-through">
              {ProductService.formatCurrency(product.price)}
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 70,
      align: 'center',
      render: (stockQuantity) => (
        <span className={`font-semibold text-sm ${
          stockQuantity === 0 ? 'text-red-600' :
          stockQuantity < 10 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {stockQuantity}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusColors: Record<string, string> = {
          'ACTIVE': 'green',
          'INACTIVE': 'gray',
          'OUT_OF_STOCK': 'red',
          'PENDING': 'orange',
          'REJECTED': 'red',
        };
        return (
          <Tag color={statusColors[status] || 'default'} className="text-xs">
            {ProductService.getStatusLabel(status)}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, product) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button
              type="text"
              size="small"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => handleViewDetail(product.productId)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => message.info('Đang phát triển')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [handleViewDetail]);

  // Status options
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang bán' },
    { value: 'INACTIVE', label: 'Ngưng bán' },
    { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'REJECTED', label: 'Bị từ chối' }
  ];

  return (
    <div className="p-4 md:p-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tất cả sản phẩm trong cửa hàng của bạn
            </p>
          </div>
          <Link
            to="/seller/dashboard/products/add"
            className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm sản phẩm
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-3 flex items-center gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Search className="w-4 h-4 mr-1" />
                Tìm
              </button>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">Tổng SP</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  {isLoading ? '...' : totalProducts}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">Đang bán</p>
                <p className="text-lg md:text-xl font-bold text-green-600">
                  {isLoading ? '...' : stats.active}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">Hết hàng</p>
                <p className="text-lg md:text-xl font-bold text-red-600">
                  {isLoading ? '...' : stats.outOfStock}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">Chờ duyệt</p>
                <p className="text-lg md:text-xl font-bold text-yellow-600">
                  {isLoading ? '...' : stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Danh sách sản phẩm ({totalProducts})
          </h2>
        </div>

        {/* Ant Design Table */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={products}
            rowKey="productId"
            loading={isLoading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalProducts,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
              size: 'default',
              responsive: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 970 }}
            size="small"
            locale={{
              emptyText: (
                <div className="py-8 md:py-12 text-center">
                  <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                    Chưa có sản phẩm nào
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 md:mb-6">
                    Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn
                  </p>
                  <Link
                    to="/seller/dashboard/products/add"
                    className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Thêm sản phẩm
                  </Link>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        productId={selectedProductId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default ProductManagement;
