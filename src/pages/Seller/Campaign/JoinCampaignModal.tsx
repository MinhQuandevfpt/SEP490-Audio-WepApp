import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Steps,
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
  SettingOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import { ProductService } from '../../../services/seller/ProductService';
import type {
  CampaignForSeller,
  VoucherType,
  CampaignProductRequest,
  Product,
} from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';

const { Step } = Steps;
const { Option } = Select;

interface SelectedProduct extends CampaignProductRequest {
  productName?: string;
  productImage?: string;
  originalPrice?: number;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFlashSale = campaign?.type === 'FAST_SALE';

  useEffect(() => {
    if (visible && campaign) {
      fetchProducts();
      setCurrentStep(0);
      setSelectedProducts([]);
      setSelectedRowKeys([]);
    }
  }, [visible, campaign]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      // 🔐 IMPORTANT: API tự động filter sản phẩm theo store của seller
      // HttpInterceptor sẽ gửi seller_token trong Authorization header
      // Backend decode token -> lấy storeId -> chỉ trả về products của store đó
      // Không cần truyền storeId parameter vì backend tự extract từ token
      const response = await ProductService.getProducts({
        status: 'ACTIVE', // Chỉ lấy sản phẩm đang hoạt động
        page: 0,
        size: 100, // Lấy tối đa 100 sản phẩm của store này
      });
      
      const fetchedProducts = response.data?.content || [];
      console.log('📦 Fetched products for current store:', fetchedProducts.length);
      
      setProducts(fetchedProducts);
      
      // Hiển thị thông báo nếu không có sản phẩm
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

  const handleProductSelection = () => {
    const newProducts: SelectedProduct[] = selectedRowKeys.map(key => {
      const product = products.find(p => p.productId === key);
      return {
        productId: key as string,
        productName: product?.name,
        productImage: product?.images?.[0],
        originalPrice: product?.price,
        slotId: isFlashSale ? campaign?.flashSlots?.[0]?.slotId : undefined,
        type: 'PERCENT' as VoucherType,
        discountPercent: 10,
        totalVoucherIssued: 100,
        totalUsageLimit: 100,
        usagePerUser: 1,
      };
    });

    setSelectedProducts(newProducts);
    setCurrentStep(1);
  };

  const handleProductUpdate = (productId: string, field: string, value: any) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.productId === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const calculateDiscountedPrice = (product: SelectedProduct): number => {
    if (!product.originalPrice) return 0;

    if (product.type === 'FIXED') {
      return Math.max(0, product.originalPrice - (product.discountValue || 0));
    } else if (product.type === 'PERCENT') {
      const discount = (product.originalPrice * (product.discountPercent || 0)) / 100;
      const maxDiscount = product.maxDiscountValue || discount;
      return Math.max(0, product.originalPrice - Math.min(discount, maxDiscount));
    }
    return product.originalPrice;
  };

  const handleSubmit = async () => {
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
        products: selectedProducts.map(
          ({ productName, productImage, originalPrice, ...rest }) => rest
        ),
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
    setCurrentStep(0);
    setSelectedProducts([]);
    setSelectedRowKeys([]);
    onClose();
  };

  // Table columns for product selection
  const productColumns: ColumnsType<Product> = [
    {
      title: 'Sản phẩm',
      key: 'product',
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
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">#{record.productId.slice(0, 8)}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="font-medium text-orange-600">
          {price?.toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'stockQuantity',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 0 ? 'success' : 'error'}>
          {stock > 0 ? `Còn ${stock}` : 'Hết hàng'}
        </Tag>
      ),
    },
  ];

  // Table columns for selected products configuration
  const selectedProductColumns: ColumnsType<SelectedProduct> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Image
            src={record.productImage}
            alt={record.productName}
            width={40}
            height={40}
            className="rounded"
            fallback="https://via.placeholder.com/40"
          />
          <div className="text-xs">
            <div className="font-medium">{record.productName}</div>
            <div className="text-gray-500">
              {record.originalPrice?.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>
      ),
    },
    ...(isFlashSale
      ? [
          {
            title: 'Khung giờ',
            key: 'slot',
            width: 180,
            render: (_: any, record: SelectedProduct) => (
              <Select
                value={record.slotId}
                onChange={value => handleProductUpdate(record.productId, 'slotId', value)}
                className="w-full"
                size="small"
                placeholder="Chọn khung giờ"
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
      render: (_: any, record: SelectedProduct) => (
        <Select
          value={record.type}
          onChange={value => handleProductUpdate(record.productId, 'type', value)}
          className="w-full"
          size="small"
        >
          <Option value="PERCENT">% Giảm</Option>
          <Option value="FIXED">Số tiền</Option>
          <Option value="SHIPPING">Miễn ship</Option>
        </Select>
      ),
    },
    {
      title: 'Giá trị',
      key: 'discount',
      width: 120,
      render: (_: any, record: SelectedProduct) => (
        <div>
          {record.type === 'PERCENT' && (
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
            />
          )}
          {record.type === 'FIXED' && (
            <InputNumber
              value={record.discountValue}
              onChange={value =>
                handleProductUpdate(record.productId, 'discountValue', value)
              }
              min={1000}
              max={record.originalPrice}
              addonAfter="đ"
              className="w-full"
              size="small"
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
      render: (_: any, record: SelectedProduct) => (
        <div>
          <div className="text-sm font-bold text-orange-600">
            {calculateDiscountedPrice(record).toLocaleString('vi-VN')}đ
          </div>
          {record.type !== 'SHIPPING' && (
            <div className="text-xs text-gray-500">
              -{' '}
              {(
                ((record.originalPrice! - calculateDiscountedPrice(record)) /
                  record.originalPrice!) *
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
      width: 100,
      render: (_: any, record: SelectedProduct) => (
        <InputNumber
          value={record.totalVoucherIssued}
          onChange={value =>
            handleProductUpdate(record.productId, 'totalVoucherIssued', value)
          }
          min={1}
          className="w-full"
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, record: SelectedProduct) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() =>
            setSelectedProducts(selectedProducts.filter(p => p.productId !== record.productId))
          }
        >
          Xóa
        </Button>
      ),
    },
  ];

  const renderStepContent = () => {
    if (currentStep === 0) {
      // Step 1: Select Products
      return (
        <div>
          <Alert
            message="Chọn sản phẩm của cửa hàng bạn tham gia chiến dịch"
            description={
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Danh sách dưới đây chỉ hiển thị <strong>sản phẩm thuộc cửa hàng của bạn</strong></li>
                <li>Chỉ các sản phẩm có trạng thái <strong>ACTIVE</strong> mới được hiển thị</li>
                <li>Sản phẩm phải được cập nhật ≥ 7 ngày trước khi đăng ký</li>
                {isFlashSale && (
                  <li className="text-orange-600 font-medium">
                    ⚡ Flash Sale yêu cầu chọn khung giờ ở bước tiếp theo
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
          
          {isLoadingProducts ? (
            <div className="flex justify-center py-10">
              <Spin tip="Đang tải sản phẩm của cửa hàng bạn..." />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
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
              columns={productColumns}
              dataSource={products}
              rowKey="productId"
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{ pageSize: 5 }}
              scroll={{ y: 300 }}
            />
          )}
        </div>
      );
    } else {
      // Step 2: Configure Discounts
      return (
        <div>
          <Alert
            message="Cấu hình giảm giá cho sản phẩm"
            description="Thiết lập loại giảm giá, giá trị và số lượng voucher cho từng sản phẩm"
            type="success"
            showIcon
            className="mb-4"
          />
          
          <Table
            columns={selectedProductColumns}
            dataSource={selectedProducts}
            rowKey="productId"
            pagination={false}
            scroll={{ x: 1000, y: 400 }}
          />
        </div>
      );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${campaign?.badgeColor || '#f97316'}, ${campaign?.badgeColor || '#f97316'}dd)`,
            }}
          >
            {isFlashSale ? (
              <ThunderboltOutlined className="text-2xl text-white" />
            ) : (
              <ShoppingOutlined className="text-2xl text-white" />
            )}
          </div>
          <div>
            <div className="text-lg font-bold">Đăng ký tham gia chiến dịch</div>
            <div className="text-sm font-normal text-gray-600">
              {campaign?.name} • {campaign?.code}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={currentStep === 0 ? 800 : 1200}
      footer={null}
      destroyOnClose
    >
      {/* Steps */}
      <Steps current={currentStep} className="mb-6">
        <Step title="Chọn sản phẩm" icon={<ShoppingOutlined />} />
        <Step title="Cấu hình giảm giá" icon={<SettingOutlined />} />
      </Steps>

      {/* Content */}
      {renderStepContent()}

      {/* Footer Actions */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {currentStep === 1 && (
            <Button onClick={() => setCurrentStep(0)}>
              ← Quay lại
            </Button>
          )}
        </div>
        <Space>
          <Button onClick={handleClose}>Hủy</Button>
          {currentStep === 0 ? (
            <Button
              type="primary"
              onClick={handleProductSelection}
              disabled={selectedRowKeys.length === 0}
              icon={<CheckCircleOutlined />}
            >
              Tiếp tục ({selectedRowKeys.length} sản phẩm)
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={selectedProducts.length === 0}
              icon={<CheckCircleOutlined />}
              style={{
                background: `linear-gradient(135deg, ${campaign?.badgeColor || '#f97316'}, ${campaign?.badgeColor || '#f97316'}dd)`,
                borderColor: campaign?.badgeColor || '#f97316',
              }}
            >
              Xác nhận đăng ký ({selectedProducts.length} sản phẩm)
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default JoinCampaignModal;
