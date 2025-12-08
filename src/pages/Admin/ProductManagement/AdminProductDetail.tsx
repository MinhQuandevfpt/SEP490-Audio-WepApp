import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Tag,
  Empty,
  Spin,
  Image,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminProductService, type ProductResponse, type ProductVariant } from '../../../services/admin/AdminProductService';
import { showError } from '../../../utils/notification';

const { Title, Text, Paragraph } = Typography;

const AdminProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductDetail = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const data = await AdminProductService.getProductById(productId);
      setProduct(data);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
    }
  }, [productId, fetchProductDetail]);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusTag = (status: string) => {
    return status === 'ACTIVE' ? (
      <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: '14px' }}>
        Đang bán
      </Tag>
    ) : (
      <Tag color="default" icon={<CloseCircleOutlined />} style={{ fontSize: '14px' }}>
        Ngừng bán
      </Tag>
    );
  };

  // Variant columns
  const variantColumns: ColumnsType<ProductVariant> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'variantUrl',
      key: 'variantUrl',
      width: 100,
      render: (url) => url ? (
        <Image src={url} width={60} height={60} style={{ objectFit: 'cover' }} />
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Phân loại',
      key: 'option',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.optionName}: <Text strong>{record.optionValue}</Text></Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>SKU: {record.variantSku}</Text>
        </Space>
      )
    },
    {
      title: 'Giá',
      dataIndex: 'variantPrice',
      key: 'variantPrice',
      align: 'right',
      render: (price) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(price)}</Text>
    },
    {
      title: 'Tồn kho',
      dataIndex: 'variantStock',
      key: 'variantStock',
      align: 'center',
      render: (stock) => (
        <Text strong style={{ color: stock > 0 ? '#1890ff' : '#ff4d4f' }}>
          {stock}
        </Text>
      )
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <Card>
        <Empty description="Không tìm thấy thông tin sản phẩm" />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="primary" onClick={() => navigate('/admin/products')}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/products')}
          >
            Quay lại
          </Button>
        </Space>
        <div style={{ marginTop: '16px' }}>
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              {product.name}
            </Title>
            {getStatusTag(product.status)}
          </Space>
        </div>
      </div>

      {/* Images */}
      {product.images && product.images.length > 0 && (
        <Card title="Hình ảnh sản phẩm" style={{ marginBottom: '24px' }}>
          <Image.PreviewGroup>
            <Space size={16} wrap>
              {product.images.map((img, index) => (
                <Image
                  key={index}
                  src={img}
                  width={150}
                  height={150}
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* Basic Information */}
      <Card title="Thông tin cơ bản" style={{ marginBottom: '24px' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
          <Descriptions.Item label="ID sản phẩm" span={2}>
            <Text code copyable>
              {product.productId}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tên sản phẩm" span={2}>
            <Text strong>{product.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="SKU">
            <Text code>{product.sku}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Slug">
            <Text code>{product.slug}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><ShopOutlined /> Cửa hàng</>} span={2}>
            <Space>
              <Text strong>{product.storeName}</Text>
              <Text type="secondary" copyable>{product.storeId}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục">
            {product.categoryName}
          </Descriptions.Item>
          <Descriptions.Item label="Thương hiệu">
            {product.brandName || 'Chưa có'}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(product.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tồn kho">
            <Text strong style={{ color: product.stockQuantity > 0 ? '#1890ff' : '#ff4d4f' }}>
              {product.stockQuantity}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Đánh giá">
            {product.ratingAverage ? (
              <Text>⭐ {product.ratingAverage.toFixed(1)} ({product.reviewCount} đánh giá)</Text>
            ) : (
              <Text type="secondary">Chưa có đánh giá</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Lượt xem">
            {product.viewCount || 0}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Description */}
      {product.description && (
        <Card title="Mô tả sản phẩm" style={{ marginBottom: '24px' }}>
          <Paragraph>
            {product.shortDescription && (
              <Text strong>{product.shortDescription}</Text>
            )}
          </Paragraph>
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </Card>
      )}

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <Card title={`Phân loại sản phẩm (${product.variants.length})`} style={{ marginBottom: '24px' }}>
          <Table
            columns={variantColumns}
            dataSource={product.variants}
            rowKey="variantId"
            pagination={false}
          />
        </Card>
      )}

      {/* Technical Specs */}
      <Card title="Thông số kỹ thuật" style={{ marginBottom: '24px' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
          {product.material && <Descriptions.Item label="Chất liệu">{product.material}</Descriptions.Item>}
          {product.dimensions && <Descriptions.Item label="Kích thước">{product.dimensions}</Descriptions.Item>}
          {product.weight && <Descriptions.Item label="Trọng lượng">{product.weight} kg</Descriptions.Item>}
          {product.color && <Descriptions.Item label="Màu sắc">{product.color}</Descriptions.Item>}
          {product.model && <Descriptions.Item label="Model">{product.model}</Descriptions.Item>}
          {product.connectionType && <Descriptions.Item label="Kết nối">{product.connectionType}</Descriptions.Item>}
          {product.warrantyPeriod && <Descriptions.Item label="Bảo hành">{product.warrantyPeriod}</Descriptions.Item>}
          {product.warrantyType && <Descriptions.Item label="Loại bảo hành">{product.warrantyType}</Descriptions.Item>}
        </Descriptions>
      </Card>

      {/* Warehouse & Shipping */}
      <Card title="Kho & Vận chuyển">
        <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
          <Descriptions.Item label="Vị trí kho" span={2}>
            {product.warehouseLocation || 'Chưa cập nhật'}
          </Descriptions.Item>
          <Descriptions.Item label="Mã tỉnh/thành">
            {product.provinceCode || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Mã quận/huyện">
            {product.districtCode || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Mã phường/xã">
            {product.wardCode || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phí vận chuyển">
            {product.shippingFee ? formatCurrency(product.shippingFee) : 'Chưa cập nhật'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo" span={2}>
            {new Date(product.createdAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật" span={2}>
            {new Date(product.updatedAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default AdminProductDetail;
