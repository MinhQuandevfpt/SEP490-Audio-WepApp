import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Avatar,
  Tag,
  Divider,
  Empty,
  Spin,
  Image,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { showError } from '../../../utils/notification';

const { Title, Text } = Typography;

interface StoreDetailData {
  storeId: string;
  storeName: string;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phoneNumber: string;
  email: string;
  rating: number | null;
  status: string;
  accountId: string;
  storeAddresses: Array<{
    addressId: string;
    defaultAddress: boolean;
    provinceCode: string;
    districtCode: string;
    wardCode: string;
    address: string;
    addressLocation: string | null;
  }> | null;
}

const StoreDetail: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [storeDetail, setStoreDetail] = useState<StoreDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreDetail = useCallback(async () => {
    if (!storeId) return;

    setIsLoading(true);
    try {
      const data = await AdminStoreService.getStoreDetailById(storeId);
      setStoreDetail(data);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải chi tiết cửa hàng');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchStoreDetail();
    }
  }, [storeId, fetchStoreDetail]);

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      ACTIVE: {
        color: 'success',
        text: 'Đang hoạt động',
        icon: <CheckCircleOutlined />
      },
      INACTIVE: {
        color: 'default',
        text: 'Chưa hoạt động',
        icon: <CloseCircleOutlined />
      },
      PENDING: {
        color: 'processing',
        text: 'Chờ duyệt',
        icon: <ClockCircleOutlined />
      },
      REJECTED: {
        color: 'error',
        text: 'Từ chối',
        icon: <CloseCircleOutlined />
      }
    };

    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontSize: '14px', padding: '4px 12px' }}>
        {config.text}
      </Tag>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải thông tin cửa hàng..." />
      </div>
    );
  }

  if (!storeDetail) {
    return (
      <Card>
        <Empty description="Không tìm thấy thông tin cửa hàng" />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="primary" onClick={() => navigate('/admin/stores')}>
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
            onClick={() => navigate('/admin/stores')}
          >
            Quay lại
          </Button>
        </Space>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar
            src={storeDetail.logoUrl}
            icon={!storeDetail.logoUrl && <ShopOutlined />}
            size={80}
            style={{ backgroundColor: !storeDetail.logoUrl ? '#1890ff' : undefined }}
          >
            {!storeDetail.logoUrl && storeDetail.storeName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {storeDetail.storeName}
            </Title>
            <Space style={{ marginTop: '8px' }}>
              {getStatusTag(storeDetail.status)}
              {storeDetail.rating && (
                <Tag icon={<StarOutlined />} color="gold">
                  {storeDetail.rating.toFixed(1)} ⭐
                </Tag>
              )}
            </Space>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {storeDetail.coverImageUrl && (
        <Card style={{ marginBottom: '24px' }}>
          <Image
            src={storeDetail.coverImageUrl}
            alt="Cover"
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }}
          />
        </Card>
      )}

      {/* Store Information */}
      <Card title="Thông tin cửa hàng" style={{ marginBottom: '24px' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
          <Descriptions.Item label="ID cửa hàng" span={2}>
            <Text code copyable>
              {storeDetail.storeId}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tên cửa hàng" span={2}>
            <Text strong style={{ fontSize: '15px' }}>
              {storeDetail.storeName}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            <Text copyable>{storeDetail.email}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>
            <Text copyable>{storeDetail.phoneNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(storeDetail.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Account ID" span={2}>
            <Text code copyable style={{ fontSize: '12px' }}>
              {storeDetail.accountId}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Store Addresses */}
      <Card
        title={
          <Space>
            <EnvironmentOutlined />
            <span>Địa chỉ cửa hàng ({storeDetail.storeAddresses?.length || 0})</span>
          </Space>
        }
      >
        {storeDetail.storeAddresses && storeDetail.storeAddresses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {storeDetail.storeAddresses.map((address, index) => (
              <Col xs={24} md={12} key={address.addressId}>
                <Card
                  type="inner"
                  title={
                    <Space>
                      <Text strong>Địa chỉ {index + 1}</Text>
                      {address.defaultAddress && (
                        <Tag color="blue">Mặc định</Tag>
                      )}
                    </Space>
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>
                      <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      {address.address}
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row gutter={[8, 8]}>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Tỉnh/TP:
                        </Text>
                        <br />
                        <Text strong style={{ fontSize: '12px' }}>
                          {address.provinceCode}
                        </Text>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Quận/Huyện:
                        </Text>
                        <br />
                        <Text strong style={{ fontSize: '12px' }}>
                          {address.districtCode}
                        </Text>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Phường/Xã:
                        </Text>
                        <br />
                        <Text strong style={{ fontSize: '12px' }}>
                          {address.wardCode}
                        </Text>
                      </Col>
                    </Row>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ID: {address.addressId.slice(0, 8)}...
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Chưa có địa chỉ nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
};

export default StoreDetail;
