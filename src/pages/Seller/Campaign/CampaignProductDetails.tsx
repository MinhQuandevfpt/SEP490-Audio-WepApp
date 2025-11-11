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

const CampaignProductDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CampaignProductDetail[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [storeId, setStoreId] = useState<string>('');
  const [campaignInfo, setCampaignInfo] = useState<{
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    registeredAt: string;
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
          registeredAt: first.registeredAt
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
        } catch (error) {
          console.warn('Could not fetch full product details:', error);
        }
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
    if (product.discountType === 'SHIPPING') {
      return 'Miễn phí ship';
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

  const columns: ColumnsType<CampaignProductDetail> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 280,
      render: (_, record) => {
        const fullProduct = productsMap.get(record.productId);
        const imageUrl = fullProduct?.images?.[0] || `https://via.placeholder.com/80?text=${encodeURIComponent(record.productName.slice(0, 2))}`;
        
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
              <div className="text-xs text-gray-500">
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
        const fullProduct = productsMap.get(record.productId);
        const stock = fullProduct?.stockQuantity || 0;
        const color = stock > 10 ? '#52c41a' : stock > 0 ? '#faad14' : '#ff4d4f';
        
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
      render: (price: number) => (
        <span className="text-gray-600 font-medium">
          {price.toLocaleString('vi-VN')}₫
        </span>
      )
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
      render: (price: number) => (
        <span className="text-red-600 font-bold text-base">
          {price.toLocaleString('vi-VN')}₫
        </span>
      )
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
      width: 130,
      align: 'center',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
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
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        {campaignInfo.type === 'MEGA_SALE' ? (
                          <FireOutlined style={{ fontSize: '24px', color: 'white' }} />
                        ) : (
                          <ThunderboltOutlined style={{ fontSize: '24px', color: 'white' }} />
                        )}
                      </div>
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
                <div className="flex items-center justify-between">
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
              className="shadow-sm"
              style={{ borderRadius: '12px' }}
            >
              <Table
                columns={columns}
                dataSource={products}
                rowKey="campaignProductId"
                scroll={{ x: 'max-content' }}
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
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignProductDetails;
