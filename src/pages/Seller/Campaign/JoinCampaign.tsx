import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, InputNumber, Select, Table, Tag, Modal, Spin, Alert, Image, Steps, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import { ProductService } from '../../../services/seller/ProductService';
import type {
  CampaignForSeller,
  CampaignProductRequest,
  VoucherType,
} from '../../../types/seller';
import type { Product } from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';

const { Option } = Select;
const { Step } = Steps;

interface SelectedProduct extends CampaignProductRequest {
  productName?: string;
  productImage?: string;
  originalPrice?: number;
}

const JoinCampaign: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignForSeller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep] = useState(0);

  // Modal states
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchProducts();
    }
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const data = await SellerCampaignService.getCampaignById(campaignId);
      setCampaign(data);
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải thông tin chiến dịch',
        'Lỗi',
        'error'
      );
      navigate('/seller/campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Get store's products - you may need to adjust based on your store context
      const response = await ProductService.getMyProducts({
        status: 'ACTIVE',
        page: 0,
        size: 100,
      });
      setProducts(response.data?.content || []);
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải danh sách sản phẩm',
        'Lỗi',
        'error'
      );
    }
  };

  const isFlashSale = campaign?.type === 'FAST_SALE';

  const handleAddProducts = () => {
    setIsProductModalVisible(true);
  };

  const handleProductSelectionOk = () => {
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

    setSelectedProducts([...selectedProducts, ...newProducts]);
    setSelectedRowKeys([]);
    setIsProductModalVisible(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
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
      showTikiNotification(
        'Vui lòng chọn ít nhất một sản phẩm',
        'Thông báo',
        'error'
      );
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

    Modal.confirm({
      title: 'Xác nhận tham gia chiến dịch',
      content: `Bạn có chắc chắn muốn đăng ký ${selectedProducts.length} sản phẩm vào chiến dịch "${campaign?.name}"?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setIsSubmitting(true);
        try {
          const request = {
            products: selectedProducts.map(({ productName, productImage, originalPrice, ...rest }) => rest),
          };

          await SellerCampaignService.joinCampaign(campaignId!, request);
          showTikiNotification(
            'Đăng ký tham gia chiến dịch thành công! Vui lòng chờ duyệt.',
            'Thành công',
            'success'
          );
          navigate('/seller/campaigns');
        } catch (error: any) {
          showTikiNotification(
            error.message || 'Không thể đăng ký tham gia chiến dịch',
            'Lỗi',
            'error'
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // Table columns for product selection modal
  const productColumns: ColumnsType<Product> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.images?.[0]}
            alt={record.name}
            width={60}
            height={60}
            className="rounded object-cover"
            fallback="https://via.placeholder.com/60"
          />
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">SKU: {record.productId}</div>
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

  // Table columns for selected products
  const selectedProductColumns: ColumnsType<SelectedProduct> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 300,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.productImage}
            alt={record.productName}
            width={60}
            height={60}
            className="rounded object-cover"
            fallback="https://via.placeholder.com/60"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">{record.productName}</div>
            <div className="text-sm text-gray-500">
              Giá gốc: {record.originalPrice?.toLocaleString('vi-VN')}đ
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
            width: 200,
            render: (_: any, record: SelectedProduct) => (
              <Select
                value={record.slotId}
                onChange={value => handleProductUpdate(record.productId, 'slotId', value)}
                className="w-full"
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
      title: 'Loại giảm giá',
      key: 'type',
      width: 150,
      render: (_: any, record: SelectedProduct) => (
        <Select
          value={record.type}
          onChange={value => handleProductUpdate(record.productId, 'type', value)}
          className="w-full"
        >
          <Option value="PERCENT">Phần trăm</Option>
          <Option value="FIXED">Số tiền</Option>
          <Option value="SHIPPING">Miễn ship</Option>
        </Select>
      ),
    },
    {
      title: 'Giá trị giảm',
      key: 'discount',
      width: 180,
      render: (_: any, record: SelectedProduct) => (
        <div className="space-y-2">
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
              />
              <InputNumber
                value={record.maxDiscountValue}
                onChange={value =>
                  handleProductUpdate(record.productId, 'maxDiscountValue', value)
                }
                placeholder="Giảm tối đa"
                addonAfter="đ"
                className="w-full"
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
              max={record.originalPrice}
              addonAfter="đ"
              className="w-full"
            />
          )}
          {record.type === 'SHIPPING' && (
            <Tag color="green" className="w-full text-center">
              Miễn phí vận chuyển
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 150,
      render: (_: any, record: SelectedProduct) => (
        <div>
          <div className="text-lg font-bold text-orange-600">
            {calculateDiscountedPrice(record).toLocaleString('vi-VN')}đ
          </div>
          {record.type !== 'SHIPPING' && (
            <div className="text-xs text-gray-500">
              Giảm{' '}
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
      title: 'Số lượng voucher',
      key: 'voucher',
      width: 150,
      render: (_: any, record: SelectedProduct) => (
        <InputNumber
          value={record.totalVoucherIssued}
          onChange={value =>
            handleProductUpdate(record.productId, 'totalVoucherIssued', value)
          }
          min={1}
          className="w-full"
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_: any, record: SelectedProduct) => (
        <Button
          type="link"
          danger
          onClick={() => handleRemoveProduct(record.productId)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Đang tải thông tin chiến dịch..." />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Header */}
      <Card bordered={false} style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="middle" align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/seller/campaigns')}>
              Quay lại
            </Button>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <Space>
                  {campaign.type === 'MEGA_SALE' ? (
                    <FireOutlined style={{ color: '#722ed1' }} />
                  ) : (
                    <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                  )}
                  Đăng ký tham gia: {campaign.name}
                </Space>
              </Typography.Title>
              <Typography.Text type="secondary">Mã: {campaign.code}</Typography.Text>
            </div>
          </Space>
          <Tag color={campaign.type === 'MEGA_SALE' ? 'purple' : 'orange'}>
            {SellerCampaignService.getTypeLabel(campaign.type)}
          </Tag>
        </Space>
      </Card>

      {/* Steps */}
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 8 }}>
          <Step title="Chọn sản phẩm" icon={<CheckCircleOutlined />} />
          <Step title="Cấu hình giảm giá" />
          <Step title="Xác nhận & Gửi" />
        </Steps>
      </Card>

      {/* Campaign Info */}
      <Card title="Thông tin chiến dịch">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <div>
              <Typography.Text type="secondary">Thời gian diễn ra:</Typography.Text>
              <div>
                <Typography.Text strong>
                  {SellerCampaignService.formatDate(campaign.startTime)} - {SellerCampaignService.formatDate(campaign.endTime)}
                </Typography.Text>
              </div>
            </div>
            {isFlashSale && campaign.flashSlots && (
              <div>
                <Typography.Text type="secondary">Số khung giờ Flash Sale:</Typography.Text>
                <div>
                  <Typography.Text strong>{campaign.flashSlots.length} khung</Typography.Text>
                </div>
              </div>
            )}
          </Space>

          <Alert
            message="Lưu ý quan trọng"
            description={
              <div>
                <div>- Sản phẩm phải đã được cập nhật ≥ 7 ngày trước</div>
                <div>- Sản phẩm phải ở trạng thái ACTIVE (đang hoạt động)</div>
                {isFlashSale && (
                  <div style={{ color: '#fa8c16', fontWeight: 500 }}>
                    - Sản phẩm Flash Sale bắt buộc phải chọn khung giờ
                  </div>
                )}
                <div>- Sản phẩm sẽ ở trạng thái chờ duyệt sau khi đăng ký thành công</div>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </Space>
      </Card>

      {/* Selected Products */}
      <Card
        title={`Sản phẩm đã chọn (${selectedProducts.length})`}
        extra={
          <Button type="primary" onClick={handleAddProducts}>
            + Thêm sản phẩm
          </Button>
        }
      >
        {selectedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Typography.Text type="secondary">Chưa có sản phẩm nào được chọn</Typography.Text>
            <div style={{ marginTop: 12 }}>
              <Button type="primary" size="large" onClick={handleAddProducts}>
                Chọn sản phẩm ngay
              </Button>
            </div>
          </div>
        ) : (
          <Table
            columns={selectedProductColumns}
            dataSource={selectedProducts}
            rowKey="productId"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Action Buttons */}
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button size="large" onClick={() => navigate('/seller/campaigns')}>
          Hủy
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={selectedProducts.length === 0}
        >
          Xác nhận đăng ký ({selectedProducts.length} sản phẩm)
        </Button>
      </Space>

      {/* Product Selection Modal */}
      <Modal
        title="Chọn sản phẩm tham gia chiến dịch"
        open={isProductModalVisible}
        onOk={handleProductSelectionOk}
        onCancel={() => {
          setIsProductModalVisible(false);
          setSelectedRowKeys([]);
        }}
        width={900}
        okText={`Thêm ${selectedRowKeys.length} sản phẩm`}
        cancelText="Hủy"
        okButtonProps={{ disabled: selectedRowKeys.length === 0 }}
      >
        <Table
          columns={productColumns}
          dataSource={products.filter(
            p => !selectedProducts.find(sp => sp.productId === p.productId)
          )}
          rowKey="productId"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </Space>
  );
};

export default JoinCampaign;
