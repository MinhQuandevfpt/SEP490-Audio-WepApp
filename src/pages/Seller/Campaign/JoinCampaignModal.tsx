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
      fetchProducts();
      setSelectedRowKeys([]);
    }
  }, [visible, campaign]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await ProductService.getMyProducts({
        status: 'ACTIVE',
        page: 0,
        size: 100,
      });
      
      const fetchedProducts = response.data?.content || [];
      console.log('📦 Fetched products for current store:', fetchedProducts.length);
      
      // Map products with default config values
      const productsWithConfig: ProductWithConfig[] = fetchedProducts.map(product => ({
        ...product,
        slotId: isFlashSale ? campaign?.flashSlots?.[0]?.slotId : undefined,
        type: 'PERCENT' as VoucherType,
        discountPercent: 10,
        totalVoucherIssued: 100,
        totalUsageLimit: 100,
        usagePerUser: 1,
      }));
      
      setProducts(productsWithConfig);
      
      if (fetchedProducts.length === 0) {
        showTikiNotification(
          'Bạn chưa có sản phẩm ACTIVE nào để đăng ký chiến dịch. Vui lòng tạo sản phẩm mới hoặc kích hoạt sản phẩm hiện có.',
          'Không có sản phẩm',
          'error'
        );
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
    setProducts(
      products.map(p =>
        p.productId === productId ? { ...p, [field]: value } : p
      )
    );
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
    const selectedProducts = products.filter(p => 
      selectedRowKeys.includes(p.productId)
    );

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
          productId: product.productId,
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

  // Combined table columns - showing all info and config in one table
  const combinedColumns: ColumnsType<ProductWithConfig> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 250,
      fixed: 'left',
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
            <div className="font-medium text-gray-900 text-sm line-clamp-2">{record.name}</div>
            <div className="text-xs text-gray-500">#{record.productId.slice(0, 8)}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá gốc',
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
      width: 100,
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
                onChange={value => handleProductUpdate(record.productId, 'slotId', value)}
                className="w-full"
                size="small"
                placeholder="Chọn khung giờ"
                disabled={!selectedRowKeys.includes(record.productId)}
              >
                {campaign?.flashSlots?.map(slot => (
                  <Option key={slot.slotId} value={slot.slotId}>
                    {new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
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
          onChange={value => handleProductUpdate(record.productId, 'type', value)}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.productId)}
        >
          <Option value="PERCENT">% Giảm</Option>
          <Option value="FIXED">Số tiền</Option>
          <Option value="SHIPPING">Miễn ship</Option>
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
                onChange={value =>
                  handleProductUpdate(record.productId, 'discountPercent', value)
                }
                min={1}
                max={100}
                addonAfter="%"
                className="w-full"
                size="small"
                disabled={!selectedRowKeys.includes(record.productId)}
              />
              <InputNumber
                value={record.maxDiscountValue}
                onChange={value =>
                  handleProductUpdate(record.productId, 'maxDiscountValue', value)
                }
                placeholder="Giảm tối đa"
                addonAfter="đ"
                className="w-full"
                size="small"
                disabled={!selectedRowKeys.includes(record.productId)}
              />
            </>
          )}
          {record.type === 'FIXED' && (
            <InputNumber
              value={record.discountValue}
              onChange={value =>
                handleProductUpdate(record.productId, 'discountValue', value)
              }
              min={1000}
              max={record.price}
              addonAfter="đ"
              className="w-full"
              size="small"
              disabled={!selectedRowKeys.includes(record.productId)}
            />
          )}
          {record.type === 'SHIPPING' && (
            <Tag color="green" className="w-full text-center text-xs">
              Miễn ship
            </Tag>
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
          <div className="text-sm font-bold text-orange-600">
            {calculateDiscountedPrice(record).toLocaleString('vi-VN')}đ
          </div>
          {record.type !== 'SHIPPING' && (
            <div className="text-xs text-gray-500">
              -{' '}
              {(
                ((record.price - calculateDiscountedPrice(record)) /
                  record.price) *
                100
              ).toFixed(0)}
              %
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
          onChange={value =>
            handleProductUpdate(record.productId, 'totalVoucherIssued', value)
          }
          min={1}
          className="w-full"
          size="small"
          disabled={!selectedRowKeys.includes(record.productId)}
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
            onChange={value =>
              handleProductUpdate(record.productId, 'totalUsageLimit', value)
            }
            min={1}
            placeholder="Tổng"
            className="w-full"
            size="small"
            disabled={!selectedRowKeys.includes(record.productId)}
          />
          <InputNumber
            value={record.usagePerUser}
            onChange={value =>
              handleProductUpdate(record.productId, 'usagePerUser', value)
            }
            min={1}
            placeholder="Mỗi người"
            className="w-full"
            size="small"
            disabled={!selectedRowKeys.includes(record.productId)}
          />
        </div>
      ),
    },
  ];

  return (
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
          columns={combinedColumns}
          dataSource={products}
          rowKey="productId"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.stockQuantity === 0, // Disable products out of stock
            }),
          }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
          scroll={{ x: isFlashSale ? 1500 : 1300, y: 450 }}
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
            Xác nhận đăng ký ({selectedRowKeys.length} sản phẩm)
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default JoinCampaignModal;
