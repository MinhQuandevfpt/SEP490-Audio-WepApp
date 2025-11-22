import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Select,
  InputNumber,
  Alert,
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
  totalVoucherIssued: number;
  totalUsageLimit: number;
  usagePerUser: number;
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
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFlashSale = campaign?.type === 'FAST_SALE';

  useEffect(() => {
    if (visible && campaign) {
      fetchJoinedProducts();
      setSelectedRowKeys([]);
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
        
        // Parent row
        const parentRow: ProductWithConfig = {
          ...product,
          key: product.productId,
          slotId: isFlashSale ? campaign?.flashSlots?.[0]?.slotId : undefined,
          type: 'PERCENT' as VoucherType,
          discountPercent: 10,
          totalVoucherIssued: 100,
          totalUsageLimit: 100,
          usagePerUser: 1,
          // Use finalPrice for products without variants
          price: hasVariants ? product.price : product.finalPrice,
        };

        // If has variants, add children rows
        if (hasVariants) {
          const variantRows = product.variants!.map(variant => ({
            ...product,
            key: `${product.productId}-${variant.variantId}`,
            productId: variant.variantId || `${product.productId}-variant-${variant.optionValue}`,
            name: variant.optionValue,
            sku: variant.variantSku,
            images: variant.variantUrl ? [variant.variantUrl] : product.images,
            price: variant.variantPrice, // Use variant price
            stockQuantity: variant.variantStock,
            isVariant: true,
            variantInfo: `${variant.optionName}: ${variant.optionValue}`,
            originalProduct: product,
            slotId: isFlashSale ? campaign?.flashSlots?.[0]?.slotId : undefined,
            type: 'PERCENT' as VoucherType,
            discountPercent: 10,
            totalVoucherIssued: 100,
            totalUsageLimit: 100,
            usagePerUser: 1,
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
          return { ...product, [field]: value };
        }
        
        // Update variantData if exists
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
    if (!product.price) return 0;

    if (product.type === 'FIXED') {
      return Math.max(0, product.price - (product.discountValue || 0));
    } else if (product.type === 'PERCENT') {
      const discount = (product.price * (product.discountPercent || 0)) / 100;
      const maxDiscount = product.maxDiscountValue || discount;
      return Math.max(0, product.price - Math.min(discount, maxDiscount));
    }
    return product.price;
  };

  const handleSubmit = async () => {
    // Collect all selected products (including variants)
    const allProducts: ProductWithConfig[] = [];
    
    products.forEach(product => {
      if (selectedRowKeys.includes(product.key || product.productId)) {
        allProducts.push(product);
      }
      
      // Check variants if parent has variantData
      if (product.variantData) {
        product.variantData.forEach(variant => {
          if (selectedRowKeys.includes(variant.key || variant.productId)) {
            allProducts.push(variant);
          }
        });
      }
    });

    if (allProducts.length === 0) {
      showTikiNotification('Vui lòng chọn ít nhất một sản phẩm', 'Thông báo', 'error');
      return;
    }

    // Validate Flash Sale products must have slotId
    if (isFlashSale) {
      const invalidProducts = allProducts.filter(p => !p.slotId);
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
        products: allProducts.map(product => ({
          // Use originalProduct.productId for variants, otherwise use productId
          productId: product.isVariant ? product.originalProduct!.productId : product.productId,
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
    onClose();
  };

  // Handle parent checkbox click - select/deselect all children
  const handleParentSelect = (record: ProductWithConfig, selected: boolean) => {
    const childKeys: React.Key[] = [];
    
    // Collect all child keys
    if (record.variantData && record.variantData.length > 0) {
      record.variantData.forEach(variant => {
        if (variant.stockQuantity > 0) { // Only select if in stock
          childKeys.push(variant.key || variant.productId);
        }
      });
    } else {
      // No variants, just the product itself
      childKeys.push(record.key || record.productId);
    }
    
    if (selected) {
      // Add parent and all children
      setSelectedRowKeys(prev => [...new Set([...prev, record.key || record.productId, ...childKeys])]);
    } else {
      // Remove parent and all children
      setSelectedRowKeys(prev => prev.filter(key => 
        key !== (record.key || record.productId) && !childKeys.includes(key)
      ));
    }
  };

  // Check if parent should be indeterminate
  const isParentIndeterminate = (record: ProductWithConfig): boolean => {
    if (!record.variantData || record.variantData.length === 0) {
      return false;
    }
    
    const childKeys = record.variantData
      .filter(v => v.stockQuantity > 0)
      .map(v => v.key || v.productId);
    
    const selectedChildren = childKeys.filter(key => selectedRowKeys.includes(key));
    
    return selectedChildren.length > 0 && selectedChildren.length < childKeys.length;
  };

  // Check if parent should be checked
  const isParentChecked = (record: ProductWithConfig): boolean => {
    if (!record.variantData || record.variantData.length === 0) {
      return selectedRowKeys.includes(record.key || record.productId);
    }
    
    const childKeys = record.variantData
      .filter(v => v.stockQuantity > 0)
      .map(v => v.key || v.productId);
    
    if (childKeys.length === 0) return false;
    
    return childKeys.every(key => selectedRowKeys.includes(key));
  };

  // Get all selectable keys (products + variants)
  const getAllSelectableKeys = (): React.Key[] => {
    const allKeys: React.Key[] = [];
    
    products.forEach(product => {
      if (product.stockQuantity > 0) {
        if (product.variantData && product.variantData.length > 0) {
          // Has variants - add parent key AND all variant keys
          allKeys.push(product.key || product.productId);
          product.variantData.forEach(variant => {
            if (variant.stockQuantity > 0) {
              allKeys.push(variant.key || variant.productId);
            }
          });
        } else {
          // No variants - add product key
          allKeys.push(product.key || product.productId);
        }
      }
    });
    
    return allKeys;
  };

  // Handle "Select All" checkbox click
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allKeys = getAllSelectableKeys();
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
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
          </div>
        </div>
      ),
    },
    {
      title: 'ID Sản phẩm',
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      render: (productId: string) => (
        <span className="text-xs font-mono text-gray-600">#{productId.slice(0, 18)}...</span>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      render: (sku: string) => (
        <span className="text-sm text-gray-700">{sku || '-'}</span>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model: string) => (
        <span className="text-sm text-gray-700">{model || '-'}</span>
      ),
    },
  ];

  // Child table columns - full details for expanded row
  const childColumns: ColumnsType<ProductWithConfig> = [
    {
      title: 'Phân loại hàng',
      key: 'variant',
      width: 250,
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
                <div className="text-xs text-gray-500 mt-1">
                  ID: {record.productId.slice(0, 13)}
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
    ...(isFlashSale
      ? [
          {
            title: '⚡ Khung giờ',
            key: 'slot',
            width: 180,
            render: (_: any, record: ProductWithConfig) => (
              <Select
                value={record.slotId}
                onChange={(value: any) => handleProductUpdate(record.key || record.productId, 'slotId', value)}
                className="w-full"
                size="small"
                placeholder="Chọn khung giờ"
                disabled={!selectedRowKeys.includes(record.key || record.productId)}
              >
                {campaign?.flashSlots?.map(slot => (
                  <Option key={slot.slotId} value={slot.slotId}>
                    {new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}{' '}
                    -{' '}
                    {new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}
                  </Option>
                ))}
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
                onChange={(value: any) =>
                  handleProductUpdate(record.key || record.productId, 'discountPercent', value)
                }
                min={1}
                max={100}
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
              max={record.price}
              addonAfter="đ"
              className="w-full"
              size="small"
              disabled={!selectedRowKeys.includes(record.key || record.productId)}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 120,
      render: (_: any, record: ProductWithConfig) => (
        <div>
          <div className="font-semibold text-green-600 text-sm">
            {calculateDiscountedPrice(record).toLocaleString('vi-VN')}đ
          </div>
          {record.price && (
            <div className="text-xs text-gray-400 line-through">
              {record.price.toLocaleString('vi-VN')}đ
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'SL Voucher',
      key: 'voucher',
      width: 110,
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
      key: 'usage',
      width: 130,
      render: (_: any, record: ProductWithConfig) => (
        <div className="space-y-1">
          <InputNumber
            value={record.totalUsageLimit}
            onChange={(value: any) =>
              handleProductUpdate(record.key || record.productId, 'totalUsageLimit', value)
            }
            min={1}
            placeholder="Tổng"
            className="w-full"
            size="small"
            disabled={!selectedRowKeys.includes(record.key || record.productId)}
          />
          <InputNumber
            value={record.usagePerUser}
            onChange={(value: any) =>
              handleProductUpdate(record.key || record.productId, 'usagePerUser', value)
            }
            min={1}
            placeholder="Mỗi người"
            className="w-full"
            size="small"
            disabled={!selectedRowKeys.includes(record.key || record.productId)}
          />
        </div>
      ),
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
                background: `linear-gradient(135deg, ${campaign?.badgeColor || '#f97316'}, ${campaign?.badgeColor || '#f97316'}dd)`,
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
        destroyOnClose
        style={{ top: 20 }}
      >
      {/* Alert */}
      <Alert
        message="Chọn sản phẩm và cấu hình giảm giá"
        description={
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Chỉ hiển thị sản phẩm <strong>ACTIVE</strong> của cửa hàng bạn</li>
            <li><strong>Tick chọn</strong> sản phẩm muốn tham gia, sau đó cấu hình giảm giá trực tiếp trên bảng</li>
            {isFlashSale && (
              <li className="text-orange-600 font-medium">
                ⚡ Flash Sale bắt buộc phải chọn khung giờ
              </li>
            )}
            <li className="text-blue-600">
              💡 Tìm thấy <strong>{products.length} sản phẩm</strong> phù hợp
            </li>
          </ul>
        }
        type="info"
        showIcon
        className="mb-4"
      />

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
        <Table
          columns={parentColumns}
          dataSource={products}
          rowKey={(record) => record.key || record.productId}
          rowSelection={{
            selectedRowKeys,
            columnWidth: 48,
            fixed: true,
            getCheckboxProps: (record) => ({
              disabled: record.stockQuantity === 0,
              // Remove indeterminate and checked from here
              // Let Ant Design calculate based on selectedRowKeys
            }),
            // Custom selection column render
            renderCell: (_value, record, _index, originNode) => {
              // For data rows (not header)
              if (record && record.key) {
                const isIndeterminate = isParentIndeterminate(record);
                const isChecked = isParentChecked(record);
                
                // Clone the checkbox node and add custom props
                if (React.isValidElement(originNode)) {
                  const props = originNode.props as any;
                  return React.cloneElement(originNode as any, {
                    ...props,
                    indeterminate: isIndeterminate,
                    checked: isChecked,
                  });
                }
              }
              
              // For header, return as-is (let Ant Design handle it)
              return originNode;
            },
            onSelect: (record, selected) => {
              // This is called when clicking individual row checkbox
              handleParentSelect(record, selected);
            },
            onSelectAll: (selected) => {
              handleSelectAll(selected);
            },
            // Show "Select All" checkbox in header
            hideSelectAll: false,
          }}
          expandable={{
            defaultExpandAllRows: false,
            expandRowByClick: false,
            columnWidth: 48,
            expandIconColumnIndex: 1, // Put expand icon AFTER checkbox (index 0)
            // Render child table with detailed info when row is expanded
            expandedRowRender: (record: ProductWithConfig) => {
              // Prepare data for child table
              const childData: ProductWithConfig[] = [];
              
              // If product has variants, show all variant rows
              if (record.variantData && record.variantData.length > 0) {
                childData.push(...record.variantData);
              } else {
                // If no variants, show single row with the product itself
                childData.push(record);
              }
              
              return (
                <div className="bg-gray-50 p-4">
                  <Table
                    columns={childColumns}
                    dataSource={childData}
                    rowKey={(childRecord) => childRecord.key || childRecord.productId}
                    rowSelection={{
                      selectedRowKeys,
                      onSelect: (childRecord, selected) => {
                        // Handle individual variant selection
                        const childKey = childRecord.key || childRecord.productId;
                        
                        if (selected) {
                          // Add this variant AND parent key
                          setSelectedRowKeys(prev => {
                            const parentKey = record.key || record.productId;
                            // Always add both variant key and parent key
                            return [...new Set([...prev, childKey, parentKey])];
                          });
                        } else {
                          // Remove this variant
                          setSelectedRowKeys(prev => {
                            const newKeys = prev.filter(key => key !== childKey);
                            
                            // Check if ANY variants are still selected
                            if (record.variantData && record.variantData.length > 0) {
                              const allVariantKeys = record.variantData
                                .filter(v => v.stockQuantity > 0)
                                .map(v => v.key || v.productId);
                              
                              const anySelected = allVariantKeys.some(key => 
                                newKeys.includes(key)
                              );
                              
                              // If NO variants selected, remove parent key too
                              if (!anySelected) {
                                const parentKey = record.key || record.productId;
                                return newKeys.filter(key => key !== parentKey);
                              }
                            }
                            
                            return newKeys;
                          });
                        }
                      },
                      getCheckboxProps: (childRecord) => ({
                        disabled: childRecord.stockQuantity === 0,
                      }),
                      hideSelectAll: true, // Hide "Select All" checkbox in child table header
                    }}
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
