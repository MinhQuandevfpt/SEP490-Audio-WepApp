import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, Tag, Button, Modal, Space, Card, Row, Col, Statistic, 
  Select, Image, Alert, Empty, Typography, Input, Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  ShopOutlined,
  TagOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { CampaignProductService } from '../../../services/admin/CampaignProductService';
import { ProductService } from '../../../services/seller/ProductService';
import type { 
  CampaignProduct, 
  CampaignOverviewItem,
  CampaignType,
  VoucherStatus,
  Campaign,
  CampaignVoucher
} from '../../../types/admin';
import type { Product } from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Extended type with variant information
interface CampaignProductWithVariants extends CampaignProduct {
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  fullProduct?: Product;
  variantData?: VariantRow[];
  discountedPrice?: number; // Add calculated discounted price
}

interface VariantRow {
  variantId: string;
  variantName: string;
  variantPrice: number;
  variantStock: number;
  variantImage?: string;
  variantSku?: string;
  discountedPrice: number;
}

const CampaignProductApproval: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [enrichedProducts, setEnrichedProducts] = useState<CampaignProductWithVariants[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  
  // Filters
  const [filterType, setFilterType] = useState<CampaignType | undefined>();
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | undefined>('DRAFT');
  const [filterCampaignId, setFilterCampaignId] = useState<string | undefined>();
  const [filterStoreId, setFilterStoreId] = useState<string | undefined>();
  
  // Pagination
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `Tổng ${total} sản phẩm`,
  });

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  useEffect(() => {
    fetchCampaignOverview();
  }, [filterType, filterStatus, filterCampaignId, filterStoreId, pagination.current, pagination.pageSize]);

  const fetchAllCampaigns = async () => {
    try {
      const campaigns = await CampaignProductService.getAllCampaignsForFilter();
      setAllCampaigns(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchCampaignOverview = async () => {
    setLoading(true);
    try {
      const response = await CampaignProductService.getCampaignOverview({
        type: filterType,
        status: filterStatus,
        campaignId: filterCampaignId,
        storeId: filterStoreId,
        page: (pagination.current || 1) - 1,
        size: pagination.pageSize || 20
      });

      setPagination(prev => ({
        ...prev,
        total: response.data.totalCampaigns * 10 // Approximate total products
      }));

      // Fetch product details to get variants
      await fetchProductDetails(response.data.data);
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải danh sách sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (campaigns: CampaignOverviewItem[]) => {
    try {
      // Collect all unique product IDs
      const productIds = new Set<string>();
      campaigns.forEach(campaign => {
        campaign.products.forEach(product => {
          productIds.add(product.productId);
        });
      });

      // Fetch all products in parallel
      const productPromises = Array.from(productIds).map(async (productId) => {
        try {
          const product = await ProductService.getProductById(productId);
          return product;
        } catch (error) {
          console.warn(`Failed to fetch product ${productId}:`, error);
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      const productMap = new Map<string, Product>();
      products.forEach(p => {
        if (p) productMap.set(p.productId, p);
      });

      // Enrich campaign products with variant data
      const enriched: CampaignProductWithVariants[] = [];
      
      campaigns.forEach(campaign => {
        campaign.products.forEach(product => {
          const fullProduct = productMap.get(product.productId);
          const voucher = getProductVoucher(product);
          
          // Calculate originalPrice and discountedPrice for products WITHOUT variants
          // Always calculate from fullProduct (like seller page does) since BE removed originalPrice/discountedPrice
          let originalPrice = product.originalPrice || 0;
          let discountedPrice: number | undefined = undefined;
          
          // If product doesn't have variants, use finalPrice or price from fullProduct
          if (fullProduct && (!fullProduct.variants || fullProduct.variants.length === 0)) {
            originalPrice = fullProduct.finalPrice || fullProduct.price || 0;
            
            // Calculate discounted price based on voucher config
            if (voucher) {
              if (voucher.type === 'FIXED' && voucher.discountValue) {
                discountedPrice = Math.max(0, originalPrice - voucher.discountValue);
              } else if (voucher.type === 'PERCENT' && voucher.discountPercent) {
                const discount = (originalPrice * voucher.discountPercent) / 100;
                const maxDiscount = voucher.maxDiscountValue || discount;
                discountedPrice = Math.max(0, originalPrice - Math.min(discount, maxDiscount));
              } else {
                discountedPrice = originalPrice;
              }
            } else {
              discountedPrice = originalPrice;
            }
          }
          
          const enrichedProduct: CampaignProductWithVariants = {
            ...product,
            campaignId: campaign.campaignId,
            campaignName: campaign.campaignName,
            campaignType: campaign.campaignType,
            fullProduct,
            originalPrice,
            discountedPrice
          };

          // If product has variants, calculate discounted price for each variant
          if (fullProduct?.variants && fullProduct.variants.length > 0) {
            enrichedProduct.variantData = fullProduct.variants.map(variant => {
              const variantPrice = variant.variantPrice || 0;
              let variantDiscountedPrice = variantPrice;

              // Calculate discounted price based on voucher config
              if (voucher) {
                if (voucher.type === 'FIXED' && voucher.discountValue) {
                  variantDiscountedPrice = Math.max(0, variantPrice - voucher.discountValue);
                } else if (voucher.type === 'PERCENT' && voucher.discountPercent) {
                  const discount = (variantPrice * voucher.discountPercent) / 100;
                  const maxDiscount = voucher.maxDiscountValue || discount;
                  variantDiscountedPrice = Math.max(0, variantPrice - Math.min(discount, maxDiscount));
                }
              }

              return {
                variantId: variant.variantId || `${fullProduct.productId}-variant`,
                variantName: variant.optionValue || '',
                variantPrice,
                variantStock: variant.variantStock || 0,
                variantImage: variant.variantUrl,
                variantSku: variant.variantSku,
                discountedPrice: variantDiscountedPrice
              };
            });
          }

          enriched.push(enrichedProduct);
        });
      });

      setEnrichedProducts(enriched);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  // Helper: Lấy voucher từ product (xử lý cả Mega Sale và Flash Sale)
  const getProductVoucher = useCallback((product: CampaignProduct): CampaignVoucher | null => {
    // Mega Sale: voucher trực tiếp
    if (product.voucher) {
      return product.voucher;
    }
    
    // Flash Sale: voucher trong flashSaleSlots[0]
    if (product.flashSaleSlots && product.flashSaleSlots.length > 0) {
      const firstSlot = product.flashSaleSlots[0];
      if (firstSlot.voucher) {
        return firstSlot.voucher;
      }
    }
    
    return null;
  }, []);

  // Use enriched products with variant data
  const allProducts = useMemo(() => {
    return enrichedProducts;
  }, [enrichedProducts]);

  // Statistics
  const stats = useMemo(() => {
    const total = allProducts.length;
    const draft = allProducts.filter(p => {
      const voucher = getProductVoucher(p);
      return voucher?.status === 'DRAFT';
    }).length;
    const approved = allProducts.filter(p => {
      const voucher = getProductVoucher(p);
      return voucher?.status === 'APPROVE';
    }).length;
    const uniqueStores = new Set(allProducts.map(p => p.storeId)).size;

    return { total, draft, approved, uniqueStores };
  }, [allProducts, getProductVoucher]);

  const handleApproveSelected = useCallback(() => {
    if (selectedProducts.length === 0) {
      showTikiNotification('Vui lòng chọn ít nhất một sản phẩm', 'Thông báo', 'error');
      return;
    }

    setShowConfirmModal(true);
  }, [selectedProducts]);

  const handleConfirmApprove = useCallback(async () => {
    // Group by campaignId
    const productsByCampaign = selectedProducts.reduce<Record<string, string[]>>((acc, productId) => {
      const product = allProducts.find(p => p.campaignProductId === productId);
      if (product) {
        if (!acc[product.campaignId]) {
          acc[product.campaignId] = [];
        }
        acc[product.campaignId].push(productId);
      }
      return acc;
    }, {});

    try {
      setShowConfirmModal(false);
      setLoading(true);
      
      // Approve products for each campaign
      const promises = Object.entries(productsByCampaign).map(([campaignId, productIds]) =>
        CampaignProductService.approveProducts(campaignId, productIds)
      );

      await Promise.all(promises);

      showTikiNotification(
        `Đã duyệt thành công ${selectedProducts.length} sản phẩm!`,
        'Thành công',
        'success'
      );

      setSelectedProducts([]);
      fetchCampaignOverview();
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể duyệt sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProducts, allProducts]);

  const handleRejectSelected = useCallback(() => {
    if (selectedProducts.length === 0) {
      showTikiNotification('Vui lòng chọn ít nhất một sản phẩm', 'Thông báo', 'error');
      return;
    }

    setShowRejectModal(true);
    setRejectReason('');
  }, [selectedProducts]);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      showTikiNotification('Vui lòng nhập lý do từ chối', 'Thông báo', 'error');
      return;
    }

    // Group by campaignId
    const productsByCampaign = selectedProducts.reduce<Record<string, string[]>>((acc, productId) => {
      const product = allProducts.find(p => p.campaignProductId === productId);
      if (product) {
        if (!acc[product.campaignId]) {
          acc[product.campaignId] = [];
        }
        acc[product.campaignId].push(productId);
      }
      return acc;
    }, {});

    try {
      setShowRejectModal(false);
      setLoading(true);
      
      // Reject products for each campaign with the same reason
      const promises = Object.entries(productsByCampaign).map(([campaignId, productIds]) =>
        CampaignProductService.rejectProducts(campaignId, productIds, rejectReason)
      );

      await Promise.all(promises);

      showTikiNotification(
        `Đã từ chối ${selectedProducts.length} sản phẩm!`,
        'Thành công',
        'success'
      );

      setSelectedProducts([]);
      setRejectReason('');
      fetchCampaignOverview();
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể từ chối sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProducts, allProducts, rejectReason]);

  const handleClearFilters = () => {
    setFilterType(undefined);
    setFilterStatus('DRAFT');
    setFilterCampaignId(undefined);
    setFilterStoreId(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns: ColumnsType<CampaignProductWithVariants> = useMemo(() => [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 320,
      render: (_, record) => {
        const isFlashSale = record.campaignType === 'FAST_SALE';
        const flashSlot = isFlashSale && record.flashSaleSlots?.[0];
        
        return (
          <div className="flex items-start gap-3">
            <Image
              src={record.productImage}
              alt={record.productName}
              width={60}
              height={60}
              className="rounded object-cover"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 line-clamp-2">{record.productName}</div>
              <div className="text-xs text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                <Tooltip title={record.productId}>
                  ID: {record.productId}
                </Tooltip>
              </div>
              {flashSlot && (
                <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <ThunderboltOutlined />
                  <span className="font-medium whitespace-nowrap">
                    {new Date(flashSlot.openTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                    {' - '}
                    {new Date(flashSlot.closeTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Chiến dịch',
      dataIndex: 'campaignName',
      key: 'campaignName',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.campaignName}</div>
          <Tag color={record.campaignType === 'MEGA_SALE' ? 'purple' : 'orange'} className="mt-1">
            {record.campaignType === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 180,
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-1">
            <ShopOutlined className="text-gray-400" />
            <span className="text-sm">{record.storeName}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">ID: {record.storeId.slice(0, 8)}...</div>
        </div>
      )
    },
    {
      title: 'Giá gốc',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 120,
      align: 'right',
      render: (price: number, record) => {
        // If has variants, show range
        if (record.variantData && record.variantData.length > 0) {
          const prices = record.variantData
            .map(v => v.variantPrice)
            .filter(p => p != null && p > 0);
          
          if (prices.length === 0) {
            return <span className="text-gray-400">N/A</span>;
          }
          
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            return (
              <span className="text-gray-600 font-medium">
                {minPrice.toLocaleString('vi-VN')}₫
              </span>
            );
          }
          
          return (
            <div className="text-right">
              <div className="text-gray-600 font-medium text-xs">
                {minPrice.toLocaleString('vi-VN')}₫
              </div>
              <div className="text-gray-400 text-xs">~</div>
              <div className="text-gray-600 font-medium text-xs">
                {maxPrice.toLocaleString('vi-VN')}₫
              </div>
            </div>
          );
        }
        
        // For products without variants, try to get price from fullProduct if calculated price is 0
        let displayPrice = price;
        if ((!displayPrice || displayPrice === 0) && record.fullProduct) {
          displayPrice = record.fullProduct.finalPrice || record.fullProduct.price || 0;
        }
        
        // Safety check for price
        if (!displayPrice || displayPrice === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        return (
          <span className="text-gray-600 font-medium">
            {displayPrice.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const voucher = getProductVoucher(record);
        if (!voucher) return <span className="text-gray-400">N/A</span>;
        return (
          <div>
            <Tag color="red" className="font-bold">
              {CampaignProductService.formatDiscount(voucher)}
            </Tag>
            {voucher.type === 'PERCENT' && voucher.maxDiscountValue && (
              <div className="text-xs text-gray-400 mt-1">
                Tối đa: {voucher.maxDiscountValue.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const voucher = getProductVoucher(record);
        
        // If has variants, show range
        if (record.variantData && record.variantData.length > 0) {
          const prices = record.variantData
            .map(v => v.discountedPrice)
            .filter(p => p != null && p > 0);
          
          if (prices.length === 0) {
            return <span className="text-gray-400">N/A</span>;
          }
          
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            return (
              <span className="text-red-600 font-bold">
                {minPrice.toLocaleString('vi-VN')}₫
              </span>
            );
          }
          
          return (
            <div className="text-right">
              <div className="text-red-600 font-bold text-xs">
                {minPrice.toLocaleString('vi-VN')}₫
              </div>
              <div className="text-red-400 text-xs">~</div>
              <div className="text-red-600 font-bold text-xs">
                {maxPrice.toLocaleString('vi-VN')}₫
              </div>
            </div>
          );
        }
        
        // No variants - use the calculated discountedPrice if available
        if (record.discountedPrice !== undefined && record.discountedPrice > 0) {
          return (
            <span className="text-red-600 font-bold">
              {record.discountedPrice.toLocaleString('vi-VN')}₫
            </span>
          );
        }
        
        // Fallback: calculate on the fly if discountedPrice not set
        if (!voucher) {
          const price = record.originalPrice || (record.fullProduct?.finalPrice || record.fullProduct?.price || 0);
          if (!price || price === 0) {
            return <span className="text-gray-400">N/A</span>;
          }
          return (
            <span className="text-gray-400">
              {price.toLocaleString('vi-VN')}₫
            </span>
          );
        }
        
        // Calculate discounted price
        const originalPrice = record.originalPrice || (record.fullProduct?.finalPrice || record.fullProduct?.price || 0);
        if (!originalPrice || originalPrice === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        const finalPrice = CampaignProductService.calculateDiscountedPrice(
          originalPrice,
          voucher
        );
        return (
          <span className="text-red-600 font-bold">
            {finalPrice.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const voucher = getProductVoucher(record);
        if (!voucher?.status) {
          return <Tag color="default">Không rõ</Tag>;
        }
        return (
          <Tag color={CampaignProductService.getVoucherStatusColor(voucher.status)}>
            {CampaignProductService.getVoucherStatusLabel(voucher.status)}
          </Tag>
        );
      }
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 180,
      render: (_, record) => {
        const voucher = getProductVoucher(record);
        if (!voucher?.startTime || !voucher?.endTime) {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <ClockCircleOutlined />
              <span>{new Date(voucher.startTime).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="text-gray-400 mt-1">
              đến {new Date(voucher.endTime).toLocaleDateString('vi-VN')}
            </div>
          </div>
        );
      }
    }
  ], [getProductVoucher]);

  // Child table columns for variants
  const variantColumns: ColumnsType<VariantRow> = useMemo(() => [
    {
      title: 'Phân loại hàng',
      key: 'variant',
      width: 220,
      render: (_, variant) => (
        <div className="flex items-center gap-3">
          <Image
            src={variant.variantImage || 'https://via.placeholder.com/40'}
            alt={variant.variantName}
            width={40}
            height={40}
            className="rounded object-cover"
            fallback="https://via.placeholder.com/40"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {variant.variantName}
            </div>
            {variant.variantSku && (
              <div className="text-xs text-gray-500 mt-1">
                SKU: {variant.variantSku}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
              <Tooltip title={variant.variantId}>
                ID: {variant.variantId}
              </Tooltip>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Giá gốc',
      dataIndex: 'variantPrice',
      key: 'variantPrice',
      width: 120,
      align: 'right',
      render: (price: number) => {
        if (!price || price === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        return (
          <span className="font-medium text-orange-600 text-sm">
            {price.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Kho',
      dataIndex: 'variantStock',
      key: 'variantStock',
      width: 80,
      align: 'center',
      render: (stock: number) => {
        const color = stock > 0 ? 'success' : 'error';
        return (
          <Tag color={color} className="text-xs">
            {stock > 0 ? `${stock}` : 'Hết'}
          </Tag>
        );
      }
    },
    {
      title: 'Giá sau giảm',
      dataIndex: 'discountedPrice',
      key: 'discountedPrice',
      width: 120,
      align: 'right',
      render: (discountedPrice: number, variant) => {
        if (!discountedPrice || discountedPrice === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        return (
          <div>
            <div className="font-semibold text-green-600 text-sm">
              {discountedPrice.toLocaleString('vi-VN')}₫
            </div>
            {variant.variantPrice && variant.variantPrice > 0 && (
              <div className="text-xs text-gray-400 line-through">
                {variant.variantPrice.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>
        );
      }
    }
  ], []);

  const rowSelection = {
    selectedRowKeys: selectedProducts,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedProducts(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: CampaignProductWithVariants) => {
      const voucher = getProductVoucher(record);
      return {
        disabled: !voucher?.status || !['DRAFT', 'APPROVE'].includes(voucher.status),
        name: record.productName
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <CheckCircleOutlined className="mr-2" />
            Duyệt sản phẩm chiến dịch
          </Title>
          <Text type="secondary">
            Quản lý và phê duyệt sản phẩm tham gia các chiến dịch khuyến mãi
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={stats.total}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Chờ duyệt"
                value={stats.draft}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Cửa hàng tham gia"
                value={stats.uniqueStores}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FilterOutlined />
            <Text strong>Bộ lọc</Text>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Loại chiến dịch</Text>
              <Select
                placeholder="Tất cả"
                value={filterType}
                onChange={setFilterType}
                allowClear
                className="w-full"
              >
                <Option value="MEGA_SALE">Mega Sale</Option>
                <Option value="FAST_SALE">Flash Sale</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Trạng thái</Text>
              <Select
                placeholder="Tất cả"
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
                className="w-full"
              >
                <Option value="DRAFT">Chờ duyệt</Option>
                <Option value="APPROVE">Đã duyệt</Option>
                <Option value="ACTIVE">Đang hoạt động</Option>
                <Option value="EXPIRED">Hết hạn</Option>
                <Option value="DISABLED">Vô hiệu hóa</Option>
                <Option value="REJECTED">Từ chối</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Chiến dịch</Text>
              <Select
                placeholder="Tất cả chiến dịch"
                value={filterCampaignId}
                onChange={setFilterCampaignId}
                allowClear
                showSearch
                optionFilterProp="children"
                className="w-full"
              >
                {allCampaigns.map(campaign => (
                  <Option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">&nbsp;</Text>
              <Button onClick={handleClearFilters} block>
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Action Bar */}
        {selectedProducts.length > 0 && (
          <Alert
            message={
              <div className="flex items-center justify-between">
                <span>Đã chọn <strong>{selectedProducts.length}</strong> sản phẩm</span>
                <Space>
                  <Button onClick={() => setSelectedProducts([])}>
                    Bỏ chọn
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleRejectSelected}
                  >
                    Từ chối đã chọn
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApproveSelected}
                  >
                    Duyệt đã chọn
                  </Button>
                </Space>
              </div>
            }
            type="info"
            className="mb-4"
          />
        )}

        {/* Products Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={allProducts}
            rowKey="campaignProductId"
            loading={loading}
            pagination={pagination}
            onChange={(newPagination) => setPagination(newPagination)}
            rowSelection={rowSelection}
            scroll={{ x: 1400 }}
            expandable={{
              expandedRowRender: (record) => {
                if (!record.variantData || record.variantData.length === 0) {
                  return null;
                }
                return (
                  <Table
                    columns={variantColumns}
                    dataSource={record.variantData}
                    rowKey="variantId"
                    pagination={false}
                    size="small"
                    className="ml-8"
                  />
                );
              },
              rowExpandable: (record) => {
                return !!(record.variantData && record.variantData.length > 0);
              }
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <div>
                      <p className="text-gray-600 mb-2">Không có sản phẩm nào</p>
                      <p className="text-sm text-gray-400">
                        Thử thay đổi bộ lọc hoặc đợi cửa hàng đăng ký sản phẩm
                      </p>
                    </div>
                  }
                />
              )
            }}
          />
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận duyệt sản phẩm"
        open={showConfirmModal}
        onOk={handleConfirmApprove}
        onCancel={() => setShowConfirmModal(false)}
        okText="Duyệt"
        cancelText="Hủy"
        okButtonProps={{ 
          icon: <CheckCircleOutlined />,
          loading: loading
        }}
        zIndex={2000}
        centered
      >
        <div>
          <p>Bạn có chắc chắn muốn duyệt <strong>{selectedProducts.length}</strong> sản phẩm đã chọn?</p>
          <Alert
            message="Lưu ý"
            description="Sản phẩm sẽ chuyển sang trạng thái 'Đã duyệt' và chỉ ACTIVE khi chiến dịch hoặc slot bắt đầu."
            type="info"
            showIcon
            className="mt-3"
          />
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Từ chối sản phẩm"
        open={showRejectModal}
        onOk={handleConfirmReject}
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ 
          icon: <CloseCircleOutlined />,
          loading: loading,
          danger: true
        }}
        zIndex={2000}
        centered
        width={600}
      >
        <div>
          <p className="mb-3">
            Bạn có chắc chắn muốn từ chối <strong>{selectedProducts.length}</strong> sản phẩm đã chọn?
          </p>
          <Alert
            message="Lưu ý"
            description="Lý do từ chối sẽ được gửi đến cửa hàng. Vui lòng nhập rõ ràng để cửa hàng có thể hiểu và cải thiện."
            type="warning"
            showIcon
            className="mb-3"
          />
          <div>
            <Text type="secondary" className="block mb-2">
              Lý do từ chối <span className="text-red-500">*</span>
            </Text>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối sản phẩm (ví dụ: Giá sản phẩm không hợp lý, thông tin sản phẩm chưa đầy đủ, vi phạm quy định chương trình...)"
              rows={4}
              maxLength={500}
              showCount
              className="w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignProductApproval;
