import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Space,
  Typography,
  Tag,
  Avatar,
  Rate,
  Spin,
  Empty,
  Pagination,
} from 'antd';
import {
  ShopOutlined,
} from '@ant-design/icons';
import Layout from '../../../components/Layout';
import { SearchService, type SearchFilters, type ProductThumbnail, type StoreInfo } from '../../../services/customer/SearchService';
import { CustomerCategoryService } from '../../../services/customer/CategoryService';
import { CustomerStoreService } from '../../../services/customer/StoreService';
import type { CategoryItem } from '../../../types/api';
import { showError } from '../../../utils/notification';

const { Text } = Typography;

interface StoreInfoWithLogo extends StoreInfo {
  logoUrl?: string | null;
}

const SearchResultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState<ProductThumbnail[]>([]);
  const [relatedStores, setRelatedStores] = useState<StoreInfoWithLogo[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters from URL
  const keyword = searchParams.get('keyword') || '';
  const page = Number(searchParams.get('page')) || 0;
  const size = Number(searchParams.get('size')) || 20;
  const categoryId = searchParams.get('categoryId') || undefined;
  const storeId = searchParams.get('storeId') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;

  // Local filter states
  const [minPriceInput, setMinPriceInput] = useState<string>(
    minPrice?.toString() || ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    maxPrice?.toString() || ''
  );
  const [priceError, setPriceError] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | undefined>(minRating);

  // Sync price inputs when URL params change
  useEffect(() => {
    setMinPriceInput(minPrice?.toString() || '');
    setMaxPriceInput(maxPrice?.toString() || '');
    setPriceError('');
  }, [minPrice, maxPrice]);

  // Load all categories for mapping
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await CustomerCategoryService.getAllCategories();
        if (response.data && Array.isArray(response.data)) {
          setAllCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Load available categories from initial search (without categoryId filter) - run once
  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const filters: SearchFilters = {
          keyword: keyword || undefined,
          status: 'ACTIVE',
          page: 0,
          size: 100, // Get more results to find all categories
        };
        
        const response = await SearchService.searchProducts(filters);
        
        // Extract unique category names from results
        const uniqueCategoryNames = Array.from(new Set(response.data.map(p => p.category).filter(Boolean)));
        
        // Map category names to IDs using allCategories
        const categoriesWithIds = uniqueCategoryNames
          .map(name => {
            const categoryItem = allCategories.find(cat => cat.name === name);
            return categoryItem ? { id: categoryItem.categoryId, name: categoryItem.name } : null;
          })
          .filter((cat): cat is {id: string, name: string} => cat !== null);
        
        setAvailableCategories(categoriesWithIds);
      } catch (error) {
        console.error('Failed to load available categories:', error);
      }
    };

    // Only load when we have allCategories and keyword
    if (allCategories.length > 0 && keyword) {
      loadAvailableCategories();
    }
  }, [keyword, allCategories]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: SearchFilters = {
        keyword: keyword || undefined,
        page,
        size,
        categoryId,
        storeId,
        minPrice,
        maxPrice,
        minRating,
        status: 'ACTIVE', // Only show active products
      };

      const response = await SearchService.searchProducts(filters);
      setProducts(response.data);
      setTotalElements(response.page.totalElements);
      setTotalPages(response.page.totalPages);
      
      // Extract related stores
      const stores = SearchService.extractStoresFromResults(response.data);
      
      // Fetch store details to get logoUrl
      const storesWithLogos = await Promise.all(
        stores.map(async (store) => {
          try {
            const storeDetail = await CustomerStoreService.getStoreById(store.id);
            return { ...store, logoUrl: storeDetail.logoUrl };
          } catch (error) {
            console.error(`Failed to fetch store detail for ${store.id}:`, error);
            return store;
          }
        })
      );
      
      setRelatedStores(storesWithLogos);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải kết quả tìm kiếm');
      setProducts([]);
      setRelatedStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, size, categoryId, storeId, minPrice, maxPrice, minRating]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL params
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 0 when filters change (except for page param itself)
    if (!newFilters.hasOwnProperty('page')) {
      params.set('page', '0');
    }
    
    setSearchParams(params);
  };

  const handlePriceFilter = () => {
    if (isLoading) return;

    // Clear previous error
    setPriceError('');

    // Parse values (allow 0)
    const minPriceValue = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxPriceValue = maxPriceInput ? parseFloat(maxPriceInput) : undefined;

    // Validation
    // Case 1: Both are 0
    if (minPriceValue === 0 && maxPriceValue === 0) {
      setPriceError('Vui lòng chọn khoảng giá hợp lệ');
      return;
    }

    // Case 2: Both have values and min > max
    if (minPriceValue !== undefined && maxPriceValue !== undefined && minPriceValue > maxPriceValue) {
      setPriceError('Vui lòng chọn khoảng giá hợp lệ');
      return;
    }

    // Apply filter
    updateFilters({
      minPrice: minPriceValue !== undefined ? minPriceValue : undefined,
      maxPrice: maxPriceValue !== undefined ? maxPriceValue : undefined,
    });
  };

  const handlePriceInputChange = (isMin: boolean, value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/[^\d]/g, '');
    if (isMin) {
      setMinPriceInput(numbers);
    } else {
      setMaxPriceInput(numbers);
    }
    // Clear error when user starts typing
    if (priceError) {
      setPriceError('');
    }
  };

  const formatPriceDisplay = (value: string) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('vi-VN');
  };

  const handleRatingFilter = (rating: number) => {
    const newRating = selectedRating === rating ? undefined : rating;
    setSelectedRating(newRating);
    updateFilters({ minRating: newRating });
  };

  const handleClearFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setPriceError('');
    setSelectedRating(undefined);
    setSearchParams({ keyword: keyword || '' });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage - 1 }); // Ant Design Pagination is 1-indexed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Calculate price with platform vouchers (same logic as ProductSuggestions)
  const calculateProductPrice = (product: ProductThumbnail) => {
    let discountPercent = 0;
    let discountedPrice = product.price ?? 0;
    let originalPrice = product.price ?? 0;
    
    // Check if product has variants and calculate min price
    if (product.variants && product.variants.length > 0) {
      const variantPrices = product.variants.map(v => v.price);
      const minVariantPrice = Math.min(...variantPrices);
      originalPrice = minVariantPrice;
      discountedPrice = minVariantPrice;
    }
    
    // Check platform vouchers ONLY (Flash Sale, etc.)
    if (product.vouchers?.platformVouchers && product.vouchers.platformVouchers.length > 0) {
      const campaign = product.vouchers.platformVouchers[0];
      if (campaign.vouchers && campaign.vouchers.length > 0) {
        const voucher = campaign.vouchers[0];
        
        // Check if voucher is active
        const now = new Date();
        const isActive = 
          now >= new Date(voucher.startTime) && 
          now <= new Date(voucher.endTime) && 
          voucher.status === 'ACTIVE';
        
        if (isActive && voucher.type === 'PERCENT' && voucher.discountPercent) {
          discountPercent = voucher.discountPercent;
          discountedPrice = originalPrice * (1 - discountPercent / 100);
        } else if (isActive && voucher.type === 'FIXED' && voucher.discountValue) {
          discountedPrice = Math.max(0, originalPrice - voucher.discountValue);
          if (originalPrice > 0) {
            discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
          }
        }
      }
    }
    
    return {
      originalPrice,
      discountedPrice,
      discountPercent,
      hasDiscount: discountPercent > 0
    };
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingTop: '20px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-6">
              <div className="w-full">
                {/* Categories Filter */}
                {availableCategories.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
                      <button
                        onClick={handleClearFilters}
                        disabled={isLoading}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors"
                      >
                        Đặt lại
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-4">Danh mục</p>
                      <div className="grid grid-cols-1 gap-3">
                        {availableCategories.map((category) => {
                          const isActive = categoryId === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              disabled={isLoading}
                              onClick={() => updateFilters({ categoryId: isActive ? undefined : category.id })}
                              className={`w-full px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                isActive
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                                  : 'text-gray-700 border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Range Filter */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4 w-full">
                  <p className="text-sm font-semibold text-gray-800 mb-4">Khoảng Giá</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="₫ TỪ"
                        value={formatPriceDisplay(minPriceInput)}
                        onChange={(e) => handlePriceInputChange(true, e.target.value)}
                        disabled={isLoading}
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-400 flex-shrink-0">-</span>
                      <input
                        type="text"
                        placeholder="₫ ĐẾN"
                        value={formatPriceDisplay(maxPriceInput)}
                        onChange={(e) => handlePriceInputChange(false, e.target.value)}
                        disabled={isLoading}
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {priceError && (
                      <p className="text-sm text-red-500 font-medium">{priceError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handlePriceFilter}
                      disabled={isLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ÁP DỤNG
                    </button>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4 w-full">
                  <p className="text-sm font-semibold text-gray-800 mb-4">Đánh giá</p>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingFilter(rating)}
                        disabled={isLoading}
                        className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-200 flex items-center ${
                          selectedRating === rating
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                            : 'text-gray-700 border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Rate disabled defaultValue={rating} style={{ fontSize: '12px', color: selectedRating === rating ? '#fff' : undefined }} />
                        <span className="ml-2">trở lên</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clear All Filters Button - Outside the card */}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  className="w-full mt-4 mb-8 px-4 py-2.5 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </div>
          </aside>

          {/* Right Content */}
          <main className="flex-1 order-1 lg:order-2">
            {/* Related Stores */}
            {relatedStores.length > 0 && (
              <Card
                title={
                  <Space>
                    <ShopOutlined />
                    <span>Shop liên quan đến "{keyword}"</span>
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Row gutter={[16, 16]}>
                  {relatedStores.slice(0, 6).map(store => (
                    <Col xs={12} sm={8} md={8} key={store.id}>
                      <Card
                        hoverable
                        onClick={() => navigate(`/store/${store.id}`)}
                        style={{ textAlign: 'center' }}
                      >
                        {store.logoUrl ? (
                          <Avatar
                            size={64}
                            src={store.logoUrl}
                            style={{ marginBottom: '8px' }}
                          />
                        ) : (
                          <Avatar
                            size={64}
                            icon={<ShopOutlined />}
                            style={{ backgroundColor: '#1890ff', marginBottom: '8px' }}
                          >
                            {store.name.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        <Text strong ellipsis style={{ display: 'block' }}>
                          {store.name}
                        </Text>
                        <Tag color={store.status === 'ACTIVE' ? 'success' : 'default'} style={{ marginTop: '4px' }}>
                          {store.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                        </Tag>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

            {/* Products Grid */}
            <Card
              title={
                <Space>
                  <Text strong>Kết quả tìm kiếm</Text>
                  <Tag color="blue">{totalElements} sản phẩm</Tag>
                </Space>
              }
            >
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" tip="Đang tải sản phẩm..." />
                </div>
              ) : products.length === 0 ? (
                <Empty
                  description={
                    keyword
                      ? `Không tìm thấy sản phẩm nào với từ khóa "${keyword}"`
                      : 'Không có sản phẩm nào'
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    {products.map(product => {
                      const priceInfo = calculateProductPrice(product);
                      
                      return (
                        <Col xs={12} sm={8} md={6} key={product.productId}>
                          <Card
                            hoverable
                            cover={
                              <div
                                style={{
                                  height: '180px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f5f5f5',
                                }}
                              >
                                <img
                                  alt={product.name}
                                  src={product.thumbnailUrl}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/180?text=No+Image';
                                  }}
                                />
                              </div>
                            }
                            onClick={() => navigate(`/product/${product.productId}`)}
                            style={{ height: '100%' }}
                          >
                            <div style={{ height: '40px', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              <Text>
                                {product.name}
                              </Text>
                            </div>
                            
                            {/* Price Display - Same as ProductSuggestions */}
                            <div style={{ marginBottom: '8px' }}>
                              {priceInfo.hasDiscount ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                                      {formatCurrency(priceInfo.discountedPrice)}
                                    </Text>
                                    <Tag color="red" style={{ margin: 0 }}>
                                      -{priceInfo.discountPercent}%
                                    </Tag>
                                  </div>
                                  <Text delete type="secondary" style={{ fontSize: '12px' }}>
                                    {formatCurrency(priceInfo.originalPrice)}
                                  </Text>
                                </div>
                              ) : (
                                <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                                  {formatCurrency(priceInfo.originalPrice)}
                                </Text>
                              )}
                            </div>

                            {product.ratingAverage && (
                              <div style={{ marginBottom: '4px' }}>
                                <Rate disabled defaultValue={product.ratingAverage} style={{ fontSize: '12px' }} />
                                <Text type="secondary" style={{ marginLeft: '4px', fontSize: '12px' }}>
                                  ({product.reviewCount || 0})
                                </Text>
                              </div>
                            )}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                      <Pagination
                        current={page + 1}
                        total={totalElements}
                        pageSize={size}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`}
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          </main>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchResultPage;
