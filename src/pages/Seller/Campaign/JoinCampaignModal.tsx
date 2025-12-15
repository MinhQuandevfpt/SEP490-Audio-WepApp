import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Select,
  InputNumber,
  Tag,
  Image,
  Space,
  Spin,
  Empty,
} from 'antd';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import { ProductService } from '../../../services/seller/ProductService';
import { StoreService } from '../../../services/seller/StoreService';
import type {
  CampaignForSeller,
  VoucherType,
  Product,
} from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';

const { Option } = Select;

interface ProductWithConfig extends Product {
  slotId?: string;
  type: VoucherType;
  discountPercent?: number;
  discountValue?: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  totalVoucherIssued?: number;
  totalUsageLimit?: number;
  usagePerUser?: number;
  // For expandable table
  isVariant?: boolean;
  variantInfo?: string;
  originalProduct?: Product;
  children?: ProductWithConfig[];
  key?: string;
  // Store variant data separately to avoid showing in main table
  variantData?: ProductWithConfig[];
}

interface JoinCampaignModalProps {
  visible: boolean;
  campaign: CampaignForSeller | null;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinCampaignModal: React.FC<JoinCampaignModalProps> = ({
  visible,
  campaign,
  onClose,
  onSuccess,
}) => {
  const [products, setProducts] = useState<ProductWithConfig[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFlashSale = campaign?.type === 'FAST_SALE';

  useEffect(() => {
    if (visible && campaign) {
      fetchJoinedProducts();
      setSelectedRowKeys([]);
      setExpandedRowKeys([]);
    }
  }, [visible, campaign]);

  const fetchJoinedProducts = async () => {
    if (!campaign) return;
    
    setIsLoadingProducts(true);
    try {
      // Get store ID
      const storeId = await StoreService.getStoreId();
      
      // Fetch already joined products for this campaign
      const joinedProducts = await SellerCampaignService.getCampaignProductDetails(
        storeId,
        campaign.id
      );
      
      const joinedIds = new Set(joinedProducts.map(p => p.productId));
      
      console.log('📦 Already joined product IDs:', Array.from(joinedIds));
      
      // Fetch available products
      await fetchProducts(joinedIds);
    } catch (error: any) {
      console.error('❌ Error fetching joined products:', error);
      showTikiNotification(
        error.message || 'Không thể tải danh sách sản phẩm',
        'Lỗi',
        'error'
      );
      setIsLoadingProducts(false);
    }
  };

  const fetchProducts = async (joinedIds: Set<string>) => {
    try {
      const response = await ProductService.getMyProducts({
        status: 'ACTIVE',
        page: 0,
        size: 100,
      });
      
      const fetchedProducts = response.data?.content || [];
      console.log('📦 Fetched products for current store:', fetchedProducts.length);
      console.log('🚫 Already joined IDs:', Array.from(joinedIds));
      
      // ✅ Filter out products that are already joined to this campaign
      const availableProducts = fetchedProducts.filter(product => !joinedIds.has(product.productId));
      console.log('✅ Available products (not joined yet):', availableProducts.length);
      
      // Transform products to expandable table format (like ProductManagement)
      const productsWithConfig: ProductWithConfig[] = availableProducts.map(product => {
        const hasVariants = product.variants && product.variants.length > 0;
        
        // Define default config for voucher (inputs trống, để seller tự cấu hình)
        const defaultConfig = {
          slotId: isFlashSale ? campaign?.flashSlots?.[0]?.slotId : undefined,
          type: 'PERCENT' as VoucherType,
          discountPercent: undefined,
          discountValue: undefined,
          maxDiscountValue: undefined,
          minOrderValue: undefined,
          totalVoucherIssued: undefined,
          totalUsageLimit: undefined,
          usagePerUser: undefined,
        };
        
        // Parent row
        const parentRow: ProductWithConfig = {
          ...product,
          key: product.productId,
          ...defaultConfig,
          // Use finalPrice for products without variants
          price: hasVariants ? product.price : product.finalPrice,
        };

        // If has variants, add children rows with FULL CONFIG from parent
        if (hasVariants) {
          const variantRows = product.variants!.map(variant => ({
            ...product,
            key: `${product.productId}-${variant.variantId}`,
            productId: variant.variantId || `${product.productId}-variant-${variant.optionValue}`,
            name: variant.optionValue,
            sku: variant.variantSku,
            images: variant.variantUrl ? [variant.variantUrl] : product.images,
            price: variant.variantPrice, // Use variant price for calculation
            stockQuantity: variant.variantStock,
            isVariant: true,
            variantInfo: `${variant.optionName}: ${variant.optionValue}`,
            originalProduct: { ...parentRow } as Product, // Store full parent with config
            // Inherit ALL config from parent
            ...defaultConfig,
          }));
          // Store in variantData instead of children to prevent Ant Design from auto-rendering
          parentRow.variantData = variantRows;
        }

        return parentRow;
      });
      
      setProducts(productsWithConfig);
      
      if (availableProducts.length === 0) {
        const message = joinedIds.size > 0 
          ? 'Tất cả sản phẩm của bạn đã được đăng ký vào chiến dịch này.'
          : 'Bạn chưa có sản phẩm ACTIVE nào để đăng ký chiến dịch. Vui lòng tạo sản phẩm mới hoặc kích hoạt sản phẩm hiện có.';
        
        showTikiNotification(message, 'Không có sản phẩm khả dụng', 'error');
      }
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải danh sách sản phẩm của cửa hàng',
        'Lỗi',
        'error'
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductUpdate = (productId: string, field: string, value: any) => {
    setProducts(prevProducts => {
      const updateProduct = (product: ProductWithConfig): ProductWithConfig => {
        // Update current product if ID matches
        if (product.productId === productId || product.key === productId) {
          const updatedProduct = { ...product, [field]: value };
          
          // If this product has variants, also update ALL config fields in each variant
          if (updatedProduct.variantData && updatedProduct.variantData.length > 0) {
            updatedProduct.variantData = updatedProduct.variantData.map(variant => {
              const updatedVariant = {
                ...variant,
                // Update the variant itself with the config
                [field]: value,
                // Also update the originalProduct reference so child table can access latest config
                originalProduct: {
                  ...updatedProduct, // Use full updated parent config
                  // Preserve original product info (not variant-specific)
                  productId: product.productId,
                  name: product.name,
                  images: product.images,
                  sku: product.sku,
                } as Product,
              };
              
              return updatedVariant;
            });
          }
          
          return updatedProduct;
        }
        
        // Update variantData if exists (for nested updates)
        if (product.variantData) {
          return {
            ...product,
            variantData: product.variantData.map(updateProduct)
          };
        }
        
        return product;
      };
      
      return prevProducts.map(updateProduct);
    });
  };

  const calculateDiscountedPrice = (product: ProductWithConfig): number => {
    // For products WITH variants, price is 0, so we need to show a range or placeholder
    // For parent table display, we'll show a dash or "Xem chi tiết"
    const hasVariants = product.variantData && product.variantData.length > 0;
    
    if (hasVariants) {
      // Return 0 or null for parent row - we'll handle display differently
      return 0;
    }
    
    // For products WITHOUT variants, use finalPrice or price
    const basePrice = product.finalPrice || product.price || 0;
    if (!basePrice) return 0;

    if (product.type === 'FIXED') {
      return Math.max(0, basePrice - (product.discountValue || 0));
    } else if (product.type === 'PERCENT') {
      const discount = (basePrice * (product.discountPercent || 0)) / 100;
      const maxDiscount = product.maxDiscountValue || discount;
      return Math.max(0, basePrice - Math.min(discount, maxDiscount));
    }
    return basePrice;
  };

  const handleSubmit = async () => {
    // Collect only PARENT products (not variants)
    const selectedProducts: ProductWithConfig[] = [];
    
    products.forEach(product => {
      // Only include parent products that are selected
      if (selectedRowKeys.includes(product.key || product.productId)) {
        selectedProducts.push(product);
      }
    });

    if (selectedProducts.length === 0) {
      showTikiNotification('Vui lòng chọn ít nhất một sản phẩm', 'Thông báo', 'error');
      return;
    }

    // Validate Flash Sale products must have slotId
    if (isFlashSale) {
      const invalidProducts = selectedProducts.filter(p => !p.slotId);
      if (invalidProducts.length > 0) {
        showTikiNotification(
          'Tất cả sản phẩm Flash Sale phải chọn khung giờ',
          'Lỗi',
          'error'
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const request = {
        products: selectedProducts.map(product => ({
          productId: product.productId, // Always use parent productId
          slotId: product.slotId,
          type: product.type,
          discountValue: product.discountValue,
          discountPercent: product.discountPercent,
          maxDiscountValue: product.maxDiscountValue,
          minOrderValue: product.minOrderValue,
          totalVoucherIssued: product.totalVoucherIssued,
          totalUsageLimit: product.totalUsageLimit,
          usagePerUser: product.usagePerUser,
        })),
      };

      await SellerCampaignService.joinCampaign(campaign!.id, request);
      showTikiNotification(
        'Đăng ký tham gia chiến dịch thành công! Vui lòng chờ duyệt.',
        'Thành công',
        'success'
      );
      onSuccess();
      handleClose();
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể đăng ký tham gia chiến dịch',
        'Lỗi',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedRowKeys([]);
    setExpandedRowKeys([]);
    onClose();
  };

  // Parent table columns - only basic product info
  const parentColumns: ColumnsType<ProductWithConfig> = [
    {
      title: 'Tên sản phẩm',
      key: 'name',
      width: 350,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.images?.[0]}
            alt={record.name}
            width={50}
            height={50}
            className="rounded object-cover"
            fallback="https://via.placeholder.com/50"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 line-clamp-2">
              {record.name}
            </div>
            <div className="text-xs text-gray-500 mt-1 break-all">
              SKU: {record.sku || '-'}
            </div>
          </div>
        </div>
      ),
    },
    ...(isFlashSale
      ? [
          {
            title: '⚡ Khung giờ',
            key: 'slot',
            width: 220,
            render: (_: any, record: ProductWithConfig) => (
              <Select
                value={record.slotId}
                onChange={(value: any) => handleProductUpdate(record.key || record.productId, 'slotId', value)}
                className="w-full"
                size="small"
                placeholder="Chọn khung giờ"
                disabled={!selectedRowKeys.includes(record.key || record.productId)}
                style={{ minWidth: '200px' }}
              >
                {campaign?.flashSlots?.map(slot => {
                  const openTime = new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });
                  const closeTime = new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });
                  return (
                    <Option key={slot.slotId} value={slot.slotId} title={`${openTime} - ${closeTime}`}>
                      {openTime} - {closeTime}
                    </Option>
                  );
                })}
              </Select>
            ),
          },
        ]
      : []),
    {
      title: 'Loại giảm',
      key: 'type',
      width: 120,
      render: (_: any, record: ProductWithConfig) => (
        <Select
          value={record.type}
          onChange={(value: any) => handleProductUpdate(record.key || record.productId, 'type', value)}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.key || record.productId)}
        >
          <Option value="PERCENT">% Giảm</Option>
          <Option value="FIXED">Số tiền</Option>
        </Select>
      ),
    },
    {
      title: 'Giá trị giảm',
      key: 'discount',
      width: 140,
      render: (_: any, record: ProductWithConfig) => (
        <div className="space-y-1">
          {record.type === 'PERCENT' && (
            <>
              <InputNumber
                value={record.discountPercent}
                  onChange={(value: any) => {
                    // Chỉ cho phép nhập từ 1 - 99, không cho vượt quá trong quá trình gõ
                    if (value === null || value === undefined) {
                      handleProductUpdate(record.key || record.productId, 'discountPercent', undefined);
                      return;
                    }
                    if (typeof value === 'number') {
                      if (value < 1 || value > 99) {
                        // Bỏ qua giá trị không hợp lệ, giữ nguyên giá trị cũ
                        return;
                      }
                      handleProductUpdate(record.key || record.productId, 'discountPercent', value);
                    }
                  }}
                min={1}
                max={99}
                addonAfter="%"
                className="w-full"
                size="small"
                disabled={!selectedRowKeys.includes(record.key || record.productId)}
              />
              <InputNumber
                value={record.maxDiscountValue}
                onChange={(value: any) =>
                  handleProductUpdate(record.key || record.productId, 'maxDiscountValue', value)
                }
                placeholder="Giảm tối đa"
                addonAfter="đ"
                className="w-full"
                size="small"
                disabled={!selectedRowKeys.includes(record.key || record.productId)}
              />
            </>
          )}
          {record.type === 'FIXED' && (
            <InputNumber
              value={record.discountValue}
              onChange={(value: any) =>
                handleProductUpdate(record.key || record.productId, 'discountValue', value)
              }
              min={1000}
              max={undefined} // Remove max limit to allow any value for products with variants
              addonAfter="đ"
              className="w-full"
              size="small"
              disabled={!selectedRowKeys.includes(record.key || record.productId)}
              placeholder="Nhập số tiền"
            />
          )}
        </div>
      ),
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 140,
      render: (_: any, record: ProductWithConfig) => {
        const hasVariants = record.variantData && record.variantData.length > 0;
        
        // If product has variants, show message to expand
        if (hasVariants) {
          return (
            <div className="text-sm text-blue-600 italic">
              Xem chi tiết ↓
            </div>
          );
        }
        
        // For products without variants
        const basePrice = record.finalPrice || record.price || 0;
        const discountedPrice = calculateDiscountedPrice(record);
        
        return (
          <div>
            <div className="font-semibold text-green-600 text-sm">
              {discountedPrice.toLocaleString('vi-VN')}đ
            </div>
            {basePrice > 0 && (
              <div className="text-xs text-gray-400 line-through">
                {basePrice.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Số lượng phát hành',
      key: 'voucher',
      width: 120,
      render: (_: any, record: ProductWithConfig) => (
        <InputNumber
          value={record.totalVoucherIssued}
          onChange={(value: any) =>
            handleProductUpdate(record.key || record.productId, 'totalVoucherIssued', value)
          }
          min={1}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.key || record.productId)}
        />
      ),
    },
    {
      title: 'Giới hạn sử dụng',
      key: 'usageTotal',
      width: 110,
      render: (_: any, record: ProductWithConfig) => (
        <InputNumber
          value={record.totalUsageLimit}
          onChange={(value: any) =>
            handleProductUpdate(record.key || record.productId, 'totalUsageLimit', value)
          }
          min={1}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.key || record.productId)}
        />
      ),
    },
    {
      title: 'Số lượng sử dụng/người',
      key: 'usagePerUser',
      width: 150,
      render: (_: any, record: ProductWithConfig) => (
        <InputNumber
          value={record.usagePerUser}
          onChange={(value: any) =>
            handleProductUpdate(record.key || record.productId, 'usagePerUser', value)
          }
          min={1}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.key || record.productId)}
        />
      ),
    },
  ];

  // Child table columns - READ ONLY, showing info calculated from parent
  const childColumns: ColumnsType<ProductWithConfig> = [
    {
      title: 'Phân loại hàng',
      key: 'variant',
      width: 200,
      render: (_, record) => {
        // If this is a variant row
        if (record.isVariant && record.originalProduct) {
          return (
            <div className="flex items-center gap-3">
              <Image
                src={record.images?.[0]}
                alt={record.name}
                width={40}
                height={40}
                className="rounded object-cover"
                fallback="https://via.placeholder.com/40"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {record.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 break-all">
                  ID: {record.productId}
                </div>
              </div>
            </div>
          );
        }
        
        // If this is a non-variant product (single SKU)
        return (
          <div className="text-sm text-gray-500 italic text-center">—</div>
        );
      },
    },
    {
      title: 'Giá hiện tại',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <span className="font-medium text-orange-600 text-sm">
          {price?.toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'stockQuantity',
      key: 'stock',
      width: 80,
      render: (stock: number) => (
        <Tag color={stock > 0 ? 'success' : 'error'} className="text-xs">
          {stock > 0 ? `${stock}` : 'Hết'}
        </Tag>
      ),
    },
    {
      title: 'Loại giảm',
      key: 'type',
      width: 100,
      render: (_: any, record: ProductWithConfig) => {
        // Use config from the variant itself (already synced from parent)
        return (
          <span className="text-sm text-gray-700">
            {record.type === 'PERCENT' ? '% Giảm' : 'Số tiền'}
          </span>
        );
      },
    },
    {
      title: 'Giá trị giảm',
      key: 'discount',
      width: 120,
      render: (_: any, record: ProductWithConfig) => {
        // Use config from the variant itself (already synced from parent)
        if (record.type === 'PERCENT') {
          return (
            <div className="text-sm text-gray-700">
              <div>{record.discountPercent}%</div>
              {record.maxDiscountValue && (
                <div className="text-xs text-gray-500">
                  Tối đa: {record.maxDiscountValue.toLocaleString('vi-VN')}đ
                </div>
              )}
            </div>
          );
        } else {
          return (
            <span className="text-sm text-gray-700">
              {record.discountValue?.toLocaleString('vi-VN')}đ
            </span>
          );
        }
      },
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 120,
      render: (_: any, record: ProductWithConfig) => {
        // Use the variant's own price and config (already synced from parent)
        const variantPrice = record.price; // This is variantPrice for variant rows
        
        let discountedPrice = variantPrice;
        
        // Use config from the record itself (already synced)
        if (record.type === 'FIXED') {
          discountedPrice = Math.max(0, variantPrice - (record.discountValue || 0));
        } else if (record.type === 'PERCENT') {
          const discount = (variantPrice * (record.discountPercent || 0)) / 100;
          const maxDiscount = record.maxDiscountValue || discount;
          discountedPrice = Math.max(0, variantPrice - Math.min(discount, maxDiscount));
        }
        
        return (
          <div>
            <div className="font-semibold text-green-600 text-sm">
              {discountedPrice.toLocaleString('vi-VN')}đ
            </div>
            <div className="text-xs text-gray-400 line-through">
              {variantPrice.toLocaleString('vi-VN')}đ
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <style>
        {`
          /* Orange theme for checkboxes and buttons */
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #ff6b35 !important;
            border-color: #ff6b35 !important;
          }
          
          .ant-checkbox-indeterminate .ant-checkbox-inner::after {
            background-color: #ff6b35 !important;
          }
          
          .ant-checkbox-wrapper:hover .ant-checkbox-inner,
          .ant-checkbox:hover .ant-checkbox-inner,
          .ant-checkbox-input:focus + .ant-checkbox-inner {
            border-color: #ff6b35 !important;
          }
          
          /* Orange primary button */
          .ant-btn-primary {
            background-color: #ff6b35 !important;
            border-color: #ff6b35 !important;
          }
          
          .ant-btn-primary:hover {
            background-color: #ff8c5a !important;
            border-color: #ff8c5a !important;
          }
        `}
      </style>
      <Modal
        title={
          <Space size="middle" align="center">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f97316, #f97316dd)',
                color: '#fff'
              }}
            >
              {isFlashSale ? (
                <ThunderboltOutlined style={{ fontSize: 20 }} />
              ) : (
                <ShoppingOutlined style={{ fontSize: 20 }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Đăng ký tham gia chiến dịch</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {campaign?.name} • {campaign?.code}
              </div>
            </div>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={1400}
        footer={null}
        destroyOnHidden
        style={{ top: 20 }}
      >
      {/* Content */}
      {isLoadingProducts ? (
        <div className="flex justify-center py-20">
          <Spin size="large" tip="Đang tải sản phẩm của cửa hàng bạn..." />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Empty
            description={
              <div>
                <p className="text-gray-600 mb-2">
                  Không tìm thấy sản phẩm ACTIVE nào trong cửa hàng của bạn
                </p>
                <p className="text-sm text-gray-500">
                  Vui lòng tạo sản phẩm mới hoặc kích hoạt sản phẩm hiện có để tham gia chiến dịch
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 Giảm giá được áp dụng chung cho tất cả phân loại hàng. Giá sau giảm được tính tự động dựa trên cấu hình bên trên.
          </div>
          <Table
            columns={parentColumns}
            dataSource={products}
            rowKey={(record) => record.key || record.productId}
            expandedRowKeys={expandedRowKeys}
            onExpandedRowsChange={(keys) => setExpandedRowKeys(keys as React.Key[])}
            rowSelection={{
              selectedRowKeys,
              columnWidth: 48,
              fixed: true,
              onChange: (keys: React.Key[]) => {
                setSelectedRowKeys(keys);
                setExpandedRowKeys(keys);
              },
              getCheckboxProps: (record) => ({
                disabled: record.stockQuantity === 0,
              }),
              hideSelectAll: false,
            }}
          expandable={{
            defaultExpandAllRows: false,
            expandRowByClick: false,
            columnWidth: 48,
            expandIconColumnIndex: 1, // Put expand icon AFTER checkbox (index 0)
            // Render child table with detailed info when row is expanded
            expandedRowRender: (record: ProductWithConfig) => {
              // ⚠️ IMPORTANT: Find the latest product from state to get updated variantData
              const latestProduct = products.find(p => 
                p.productId === record.productId || p.key === record.key
              );
              
              // Prepare data for child table
              const childData: ProductWithConfig[] = [];
              
              // Use latest product's variantData (with updated config)
              const productToUse = latestProduct || record;
              
              // If product has variants, show all variant rows
              if (productToUse.variantData && productToUse.variantData.length > 0) {
                childData.push(...productToUse.variantData);
              } else {
                // If no variants, show single row with the product itself
                childData.push(productToUse);
              }
              
              return (
                <div className="bg-gray-50 p-4">
                  <Table
                    columns={childColumns}
                    dataSource={childData}
                    rowKey={(childRecord) => childRecord.key || childRecord.productId}
                    // NO rowSelection for child table - variants are not selectable
                    pagination={false}
                    size="small"
                    showHeader={true}
                  />
                </div>
              );
            },
            // All rows are expandable
            rowExpandable: () => true,
            }}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 900, y: 450 }}
            size="small"
          />
        </>
      )}

      {/* Footer Actions */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 24, 
          paddingTop: 16, 
          borderTop: '1px solid #f0f0f0' 
        }}
      >
        <div className="text-sm text-gray-600">
          {selectedRowKeys.length > 0 ? (
            <Space>
              <CheckCircleOutlined className="text-green-500" />
              <span>Đã chọn <strong className="text-blue-600">{selectedRowKeys.length}</strong> sản phẩm</span>
            </Space>
          ) : (
            <span className="text-gray-400">Chưa chọn sản phẩm nào</span>
          )}
        </div>
        <Space>
          <Button onClick={handleClose} size="large">
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={selectedRowKeys.length === 0}
            icon={<CheckCircleOutlined />}
          >
            Xác nhận đăng ký 
          </Button>
        </Space>
      </div>
    </Modal>
    </>
  );
};

export default JoinCampaignModal;
