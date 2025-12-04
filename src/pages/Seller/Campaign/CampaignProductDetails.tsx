import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Image,
  Spin,
  Alert,
  Typography,
  Tooltip,
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  UserOutlined,
  TagsOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  FireOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import { ProductService } from '../../../services/seller/ProductService';
import { StoreService } from '../../../services/seller/StoreService';
import type { CampaignProductDetail, CampaignProductStatus, Product } from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';

const { Title } = Typography;

// Extended type to include variant information
interface CampaignProductWithVariants extends CampaignProductDetail {
  fullProduct?: Product;
  variantData?: VariantRow[];
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

const CampaignProductDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CampaignProductWithVariants[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [storeId, setStoreId] = useState<string>('');
  const [campaignInfo, setCampaignInfo] = useState<{
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    registeredAt: string;
    badgeIconUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetchStoreId();
  }, []);

  useEffect(() => {
    if (storeId && campaignId) {
      fetchData();
    }
  }, [storeId, campaignId]);

  const fetchStoreId = async () => {
    try {
      const id = await StoreService.getStoreId();
      setStoreId(id);
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải thông tin cửa hàng',
        'Lỗi',
        'error'
      );
    }
  };

  const fetchData = async () => {
    if (!storeId || !campaignId) return;

    setLoading(true);
    try {
      // Fetch campaign product details
      const campaignProducts = await SellerCampaignService.getCampaignProductDetails(
        storeId,
        campaignId
      );

      setProducts(campaignProducts);

      // Extract campaign info from first product
      if (campaignProducts.length > 0) {
        const first = campaignProducts[0];
        setCampaignInfo({
          name: first.campaignName,
          type: first.campaignType,
          startTime: first.startTime,
          endTime: first.endTime,
          registeredAt: first.registeredAt,
          badgeIconUrl: (first as any).badgeIconUrl
        });
      }

      // Fetch full product details to get images and stock
      if (campaignProducts.length > 0) {
        try {
          const response = await ProductService.getMyProducts({
            status: 'ACTIVE',
            page: 0,
            size: 100,
          });
          
          const fullProducts = response.data?.content || [];
          const productMap = new Map<string, Product>();
          fullProducts.forEach(p => {
            productMap.set(p.productId, p);
          });
          setProductsMap(productMap);

          // Enrich campaign products with variant information
          const enrichedProducts: CampaignProductWithVariants[] = campaignProducts.map(cp => {
            const fullProduct = productMap.get(cp.productId);
            
            // Calculate originalPrice and discountedPrice for products WITHOUT variants
            let originalPrice = cp.originalPrice;
            let discountedPrice = cp.discountedPrice;
            
            // If product doesn't have variants, use finalPrice or price from fullProduct
            if (fullProduct && (!fullProduct.variants || fullProduct.variants.length === 0)) {
              originalPrice = fullProduct.finalPrice || fullProduct.price || 0;
              
              // Calculate discounted price based on campaign config
              if (cp.discountType === 'FIXED' && cp.discountValue) {
                discountedPrice = Math.max(0, originalPrice - cp.discountValue);
              } else if (cp.discountType === 'PERCENT' && cp.discountPercent) {
                const discount = (originalPrice * cp.discountPercent) / 100;
                const maxDiscount = cp.maxDiscountValue || discount;
                discountedPrice = Math.max(0, originalPrice - Math.min(discount, maxDiscount));
              } else {
                discountedPrice = originalPrice;
              }
            }
            
            const enriched: CampaignProductWithVariants = {
              ...cp,
              fullProduct,
              originalPrice,
              discountedPrice
            };

            // If product has variants, calculate discounted price for each variant
            if (fullProduct?.variants && fullProduct.variants.length > 0) {
              enriched.variantData = fullProduct.variants.map(variant => {
                const variantPrice = variant.variantPrice || 0;
                let variantDiscountedPrice = variantPrice;

                // Calculate discounted price based on campaign config
                if (cp.discountType === 'FIXED' && cp.discountValue) {
                  variantDiscountedPrice = Math.max(0, variantPrice - cp.discountValue);
                } else if (cp.discountType === 'PERCENT' && cp.discountPercent) {
                  const discount = (variantPrice * cp.discountPercent) / 100;
                  const maxDiscount = cp.maxDiscountValue || discount;
                  variantDiscountedPrice = Math.max(0, variantPrice - Math.min(discount, maxDiscount));
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

            return enriched;
          });

          setProducts(enrichedProducts);
        } catch (error) {
          console.warn('Could not fetch full product details:', error);
          setProducts(campaignProducts);
        }
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải chi tiết sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const draft = products.filter(p => p.status === 'DRAFT').length;
    const approved = products.filter(p => p.status === 'APPROVE').length;
    const active = products.filter(p => p.status === 'ACTIVE').length;
    const rejected = products.filter(p => p.status === 'REJECTED').length;
    const totalVouchers = products.reduce((sum, p) => sum + p.totalVoucherIssued, 0);
    const remainingVouchers = products.reduce((sum, p) => sum + p.remainingUsage, 0);

    return { total, draft, approved, active, rejected, totalVouchers, remainingVouchers };
  }, [products]);

  // Status helpers
  const getStatusLabel = (status: CampaignProductStatus): string => {
    const labels: Record<CampaignProductStatus, string> = {
      DRAFT: 'Chờ duyệt',
      APPROVE: 'Đã duyệt',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      REJECTED: 'Bị từ chối',
      DISABLED: 'Vô hiệu hóa'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: CampaignProductStatus): string => {
    const colors: Record<CampaignProductStatus, string> = {
      DRAFT: 'orange',
      APPROVE: 'green',
      ACTIVE: 'blue',
      EXPIRED: 'default',
      REJECTED: 'red',
      DISABLED: 'volcano'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: CampaignProductStatus) => {
    const icons: Record<CampaignProductStatus, React.ReactNode> = {
      DRAFT: <ClockCircleOutlined />,
      APPROVE: <CheckCircleOutlined />,
      ACTIVE: <ShoppingOutlined />,
      EXPIRED: <ExclamationCircleOutlined />,
      REJECTED: <CloseCircleOutlined />,
      DISABLED: <StopOutlined />
    };
    return icons[status] || null;
  };

  // Discount helpers
  const formatDiscount = (product: CampaignProductDetail): string => {
    if (product.discountType === 'PERCENT' && product.discountPercent) {
      return `-${product.discountPercent}%`;
    }
    if (product.discountType === 'FIXED' && product.discountValue) {
      return `-${product.discountValue.toLocaleString('vi-VN')}₫`;
    }
    return 'N/A';
  };

  // Format datetime with full precision
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const columns: ColumnsType<CampaignProductWithVariants> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 250,
      fixed: 'left',
      render: (_, record) => {
        const fullProduct = record.fullProduct || productsMap.get(record.productId);
        const imageUrl = fullProduct?.images?.[0] || `https://via.placeholder.com/80?text=${encodeURIComponent(record.productName.slice(0, 2))}`;
        const isFlashSale = campaignInfo?.type === 'FAST_SALE';
        
        return (
          <div className="flex items-start gap-3">
            <Image
              src={imageUrl}
              alt={record.productName}
              width={60}
              height={60}
              className="rounded object-cover"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 line-clamp-2 mb-1">
                {record.productName}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                <Tooltip title={record.productId}>
                  ID: {record.productId}
                </Tooltip>
              </div>
              {isFlashSale && record.slot && (
                <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <ThunderboltOutlined />
                  <span className="font-medium whitespace-nowrap">
                    {new Date(record.slot.openTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                    {' - '}
                    {new Date(record.slot.closeTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{record.brandName}</span>
                {' • '}
                <span>{record.category}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Kho',
      key: 'stock',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const fullProduct = record.fullProduct || productsMap.get(record.productId);
        const stock = fullProduct?.stockQuantity || 0;
        const color = stock > 10 ? '#52c41a' : stock > 0 ? '#faad14' : '#ff4d4f';
        
        // If has variants, show total stock
        if (record.variantData && record.variantData.length > 0) {
          const totalVariantStock = record.variantData.reduce((sum, v) => sum + v.variantStock, 0);
          const variantColor = totalVariantStock > 10 ? '#52c41a' : totalVariantStock > 0 ? '#faad14' : '#ff4d4f';
          
          return (
            <div className="text-center">
              <div className="font-bold text-lg" style={{ color: variantColor }}>
                {totalVariantStock}
              </div>
              <div className="text-xs text-gray-400">
                {totalVariantStock > 10 ? 'Còn hàng' : totalVariantStock > 0 ? 'Sắp hết' : 'Hết hàng'}
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color }}>
              {stock}
            </div>
            <div className="text-xs text-gray-400">
              {stock > 10 ? 'Còn hàng' : stock > 0 ? 'Sắp hết' : 'Hết hàng'}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Giá gốc',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 110,
      align: 'right',
      render: (price: number, record) => {
        // If has variants, show range or "Xem chi tiết"
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
        
        // Safety check for price
        if (!price || price === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        return (
          <span className="text-gray-600 font-medium">
            {price.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <Tag color="red" className="font-bold text-base">
            {formatDiscount(record)}
          </Tag>
          {record.discountType === 'PERCENT' && record.maxDiscountValue && (
            <div className="text-xs text-gray-400 mt-1">
              Tối đa: {record.maxDiscountValue.toLocaleString('vi-VN')}₫
            </div>
          )}
          {record.minOrderValue && (
            <div className="text-xs text-gray-400 mt-1">
              Đơn tối thiểu: {record.minOrderValue.toLocaleString('vi-VN')}₫
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Giá sau giảm',
      dataIndex: 'discountedPrice',
      key: 'discountedPrice',
      width: 120,
      align: 'right',
      render: (price: number, record) => {
        // If has variants, show range or "Xem chi tiết"
        if (record.variantData && record.variantData.length > 0) {
          const prices = record.variantData
            .map(v => v.discountedPrice)
            .filter(p => p != null && p > 0); // Filter out undefined/null/0
          
          if (prices.length === 0) {
            return <span className="text-gray-400">N/A</span>;
          }
          
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            return (
              <span className="text-red-600 font-bold text-base">
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
        
        // Safety check for price
        if (!price || price === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        return (
          <span className="text-red-600 font-bold text-base">
            {price.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Voucher',
      key: 'voucher',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <div className="flex items-center justify-center gap-2">
            <TagsOutlined className="text-blue-500" />
            <span className="font-bold text-base">
              {record.remainingUsage}/{record.totalVoucherIssued}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Còn lại/Tổng số
          </div>
          {record.usagePerUser > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <UserOutlined className="mr-1" />
              {record.usagePerUser} lần/người
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 110,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <div>
          <Tag
            color={getStatusColor(record.status)}
            icon={getStatusIcon(record.status)}
            className="font-medium text-sm px-3 py-1"
          >
            {getStatusLabel(record.status)}
          </Tag>
          {record.status === 'REJECTED' && record.reason && (
            <Tooltip title={record.reason} placement="left">
              <div className="text-xs text-red-500 mt-2 cursor-help line-clamp-2">
                <ExclamationCircleOutlined className="mr-1" />
                {record.reason}
              </div>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  // Child table columns for variants
  const variantColumns: ColumnsType<VariantRow> = [
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
  ];

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full">
        {/* Header - Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/seller/dashboard/campaigns')}
          className="mb-4"
          size="large"
        >
          Quay lại danh sách chiến dịch
        </Button>

        {loading ? (
          <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p className="text-gray-600 mb-2 text-lg">Chưa có sản phẩm nào được đăng ký</p>
                  <p className="text-sm text-gray-400">
                    Vui lòng quay lại trang chiến dịch và đăng ký sản phẩm
                  </p>
                </div>
              }
            >
              <Button
                type="primary"
                onClick={() => navigate('/seller/dashboard/campaigns')}
                size="large"
              >
                Quay lại danh sách chiến dịch
              </Button>
            </Empty>
          </Card>
        ) : (
          <>
            {/* ============ SECTION 1: CAMPAIGN INFO ============ */}
            {campaignInfo && (
              <Card 
                className="mb-6"
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0'
                }}
              >
                <Row gutter={[24, 24]}>
                  {/* Campaign Header */}
                  <Col span={24}>
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                      {campaignInfo.badgeIconUrl ? (
                        <div className="flex-shrink-0 w-12 h-12">
                          <Image
                            src={campaignInfo.badgeIconUrl}
                            alt={campaignInfo.name}
                            width={48}
                            height={48}
                            className="rounded object-contain"
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          {campaignInfo.type === 'MEGA_SALE' ? (
                            <FireOutlined style={{ fontSize: '24px', color: 'white' }} />
                          ) : (
                            <ThunderboltOutlined style={{ fontSize: '24px', color: 'white' }} />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <Title level={3} style={{ margin: 0 }}>
                          {campaignInfo.name}
                        </Title>
                      </div>
                    </div>
                  </Col>

                  {/* Campaign Details - 3 Time Cards */}
                  <Col xs={24} md={8}>
                    <Card size="small" className="h-full border-green-200 bg-green-50">
                      <div className="text-center">
                        <CalendarOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                        <div className="text-xs text-gray-500 mb-2">Thời gian bắt đầu</div>
                        <div className="font-semibold text-sm text-gray-900">
                          {formatDateTime(campaignInfo.startTime)}
                        </div>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} md={8}>
                    <Card size="small" className="h-full border-red-200 bg-red-50">
                      <div className="text-center">
                        <CalendarOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '8px' }} />
                        <div className="text-xs text-gray-500 mb-2">Thời gian kết thúc</div>
                        <div className="font-semibold text-sm text-gray-900">
                          {formatDateTime(campaignInfo.endTime)}
                        </div>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} md={8}>
                    <Card size="small" className="h-full border-blue-200 bg-blue-50">
                      <div className="text-center">
                        <CheckCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                        <div className="text-xs text-gray-500 mb-2">Thời gian đăng ký</div>
                        <div className="font-semibold text-sm text-gray-900">
                          {formatDateTime(campaignInfo.registeredAt)}
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Warning Alert for Rejected Products */}
            {stats.rejected > 0 && (
              <Alert
                message="⚠️ Có sản phẩm bị từ chối"
                description={`Bạn có ${stats.rejected} sản phẩm bị từ chối. Vui lòng xem lý do bên dưới và cập nhật lại sản phẩm.`}
                type="warning"
                showIcon
                className="mb-6"
                closable
              />
            )}

            {/* ============ SECTION 2: PRODUCTS TABLE ============ */}
            <Card
              title={
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Space>
                    <InboxOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                    <span className="text-lg font-semibold">
                      Danh sách sản phẩm đã đăng ký
                    </span>
                  </Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      showTikiNotification(
                        'Tính năng này đang được phát triển',
                        'Thông báo',
                        'success'
                      );
                    }}
                  >
                    Thêm sản phẩm
                  </Button>
                </div>
              }
              className="shadow-sm overflow-hidden"
              style={{ borderRadius: '12px' }}
            >
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={products}
                  rowKey="campaignProductId"
                  scroll={{ x: 1400 }}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total) => `Tổng ${total} sản phẩm`,
                    position: ['bottomCenter']
                  }}
                  rowClassName={(record) => {
                    if (record.status === 'REJECTED') return 'bg-red-50';
                    if (record.status === 'DRAFT') return 'bg-orange-50';
                    if (record.status === 'ACTIVE') return 'bg-blue-50';
                    return '';
                  }}
                  expandable={{
                    expandedRowRender: (record) => {
                      // Only show expanded view if product has variants
                      if (!record.variantData || record.variantData.length === 0) {
                        return null;
                      }

                      return (
                        <div className="bg-gray-50 p-4">
                          <div className="mb-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 Giảm giá được áp dụng chung cho tất cả phân loại hàng. Giá sau giảm được tính tự động dựa trên cấu hình voucher.
                          </div>
                          <Table
                            columns={variantColumns}
                            dataSource={record.variantData}
                            rowKey="variantId"
                            pagination={false}
                            size="small"
                            showHeader={true}
                          />
                        </div>
                      );
                    },
                    rowExpandable: (record) => {
                      // Only allow expand if product has variants
                      return !!(record.variantData && record.variantData.length > 0);
                    },
                    columnWidth: 48,
                  }}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignProductDetails;
