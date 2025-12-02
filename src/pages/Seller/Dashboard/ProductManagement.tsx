import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Image, Tag, Space, Button, Tooltip } from 'antd';
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
import { StoreAddressService } from '../../../services/seller/StoreAddressService';
import { showCenterError } from '../../../utils/notification';

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
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

  // Check store address before navigating to add product
  const handleAddProductClick = useCallback(async () => {
    try {
      const addresses = await StoreAddressService.getStoreAddresses();
      const addressList = Array.isArray(addresses) ? addresses : (addresses || []);

      if (!addressList || addressList.length === 0) {
        // Thông báo và chuyển sang trang tạo địa chỉ cửa hàng
        showCenterError(
          'Bạn cần tạo ít nhất một địa chỉ cửa hàng trước khi thêm sản phẩm.',
          'Chưa có địa chỉ cửa hàng'
        );
        navigate('/seller/dashboard/store-address?from=create-product');
        return;
      }

      // Nếu đã có địa chỉ, cho phép vào trang thêm sản phẩm
      navigate('/seller/dashboard/products/add');
    } catch (error) {
      console.error('Error checking store addresses:', error);
      showCenterError(
        'Không thể kiểm tra địa chỉ cửa hàng. Vui lòng thử lại.',
        'Lỗi'
      );
    }
  }, [navigate]);

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
      outOfStock: products.filter(p => {
        if (p.status === 'OUT_OF_STOCK') return true;
        // Backend already calculates total stock (sum of variants or base stock)
        return p.stockQuantity === 0;
      }).length,
      pending: products.filter(p => p.status === 'PENDING').length,
    };
  }, [products]);

  // Type definition for table data (parent + children)
  interface TableDataItem {
    key: string;
    productId: string;
    name: string;
    sku: string;
    image: string;
    price: number | null;
    priceRange?: string;
    stockQuantity: number;
    status: string;
    isVariant?: boolean;
    variantInfo?: string;
    originalProduct?: Product;
    children?: TableDataItem[];
  }

  // Transform products data to table format with expandable rows
  const tableData: TableDataItem[] = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    return products.map(product => {
      const hasVariants = product.variants && product.variants.length > 0;
      
      // Parent row
      const parentRow: TableDataItem = {
        key: product.productId,
        productId: product.productId,
        name: product.name,
        sku: product.sku,
        image: product.images && product.images.length > 0 && product.images[0] !== 'string' 
          ? product.images[0] 
          : '',
        price: hasVariants ? null : product.finalPrice,
        // Backend already calculates total stock (sum of variants if has variants)
        stockQuantity: product.stockQuantity,
        status: product.status,
        originalProduct: product,
      };

      // If has variants, calculate price range and add children
      if (hasVariants) {
        const prices = product.variants!.map(v => v.variantPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        parentRow.priceRange = minPrice === maxPrice 
          ? ProductService.formatCurrency(minPrice)
          : `${ProductService.formatCurrency(minPrice)} - ${ProductService.formatCurrency(maxPrice)}`;
        
        // Create child rows for each variant
        parentRow.children = product.variants!.map(variant => ({
          key: `${product.productId}-${variant.variantId}`,
          productId: variant.variantId || `${product.productId}-variant`,
          name: variant.optionValue,
          sku: variant.variantSku,
          image: variant.variantUrl || '',
          price: variant.variantPrice,
          stockQuantity: variant.variantStock,
          status: product.status,
          isVariant: true,
          variantInfo: `${variant.optionName}: ${variant.optionValue}`,
          originalProduct: product,
        }));
      }
      
      return parentRow;
    });
  }, [products]);

  // Memoized table columns
  const columns: ColumnsType<TableDataItem> = useMemo(() => [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-start space-x-3">
          <Image
            width={record.isVariant ? 40 : 48}
            height={record.isVariant ? 40 : 48}
            src={record.image}
            alt={record.name}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f3f4f6' width='48' height='48'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
            className="rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className={`${record.isVariant ? 'text-sm' : 'text-sm font-medium'} text-gray-900`}>
              {record.name}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-1">
              {record.isVariant ? `SKU phân loại: ${record.sku}` : `SKU sản phẩm: ${record.sku}`}
            </p>
           
            {!record.isVariant && record.originalProduct?.model && (
              <p className="text-xs text-gray-400 mt-1">Model ID: {record.originalProduct.model}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (_, record) => {
        if (record.priceRange) {
          return (
            <div className="text-right">
              <p className="text-sm font-semibold text-orange-600">
                {record.priceRange}
              </p>
            </div>
          );
        }
        
        if (record.price !== null) {
          return (
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {ProductService.formatCurrency(record.price)}
              </p>
            </div>
          );
        }
        
        return <span className="text-gray-400 text-xs">-</span>;
      },
    },
    {
      title: 'Kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 80,
      align: 'center',
      render: (stock) => (
        <span className={`font-semibold text-sm ${
          stock === 0 ? 'text-red-600' :
          stock < 10 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {stock}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status, record) => {
        // Don't show status for variant rows
        if (record.isVariant) return null;
        
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
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        // Don't show actions for variant rows
        if (record.isVariant) return null;
        
        return (
          <Space size="small">
            <Tooltip title="Xem">
              <Button
                type="text"
                size="small"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => handleViewDetail(record.productId)}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="text"
                size="small"
                icon={<Edit className="w-4 h-4" />}
                onClick={() => navigate(`/seller/dashboard/products/${record.productId}/edit`)}
              />
            </Tooltip>
          </Space>
        );
      },
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
    <div className="w-full overflow-x-hidden">
      {/* Custom CSS for expand icon alignment */}
      <style>{`
        .ant-table-row-expand-icon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
        }
        .ant-table-row-expand-icon::before,
        .ant-table-row-expand-icon::after {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tất cả sản phẩm trong cửa hàng của bạn
            </p>
          </div>
          <button
            onClick={handleAddProductClick}
            className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm sản phẩm
          </button>
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
            dataSource={tableData}
            rowKey="key"
            loading={isLoading}
            expandable={{
              defaultExpandAllRows: false,
              indentSize: 25,
              expandRowByClick: false,
            }}
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
            scroll={{ x: 900 }}
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
                  <button
                    onClick={handleAddProductClick}
                    className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Thêm sản phẩm
                  </button>
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
