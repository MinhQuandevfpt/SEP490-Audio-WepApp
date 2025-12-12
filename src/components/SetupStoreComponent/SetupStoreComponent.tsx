import React, { useState, useEffect } from 'react';
import { Card, Spin, Tag, Space, Descriptions, Image, Empty, Divider, Button, Modal, Input, message } from 'antd';
import {
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarFilled,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { StoreService } from '../../services/seller/StoreService';
import type { StoreDetail } from '../../types/seller';
import { showCenterError, showCenterSuccess } from '../../utils/notification';

const { TextArea } = Input;

const SetupStoreComponent: React.FC = () => {
  const [storeData, setStoreData] = useState<StoreDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setIsLoading(true);
      
      // Get store ID
      const storeId = await StoreService.getStoreId();
      
      if (!storeId) {
        showCenterError('Không tìm thấy ID cửa hàng', 'Lỗi');
        return;
      }

      // Fetch store detail
      const data = await StoreService.getStoreDetail(storeId);
      setStoreData(data);
      
      // Update cache
      localStorage.setItem('seller_store_info', JSON.stringify(data));
    } catch (error: any) {
      console.error('Error loading store data:', error);
      showCenterError(
        error?.message || 'Không thể tải thông tin cửa hàng. Vui lòng thử lại sau.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStoreData();
    setIsRefreshing(false);
    showCenterSuccess('Đã làm mới thông tin cửa hàng');
  };

  const handleOpenPauseModal = () => {
    setPauseModalOpen(true);
    setPauseReason('');
  };

  const handleClosePauseModal = () => {
    setPauseModalOpen(false);
    setPauseReason('');
  };

  const handlePauseStore = async () => {
    if (!pauseReason.trim()) {
      message.error('Vui lòng nhập lý do ngưng bán');
      return;
    }

    if (!storeData) return;

    try {
      setIsToggling(true);
      await StoreService.toggleStoreStatus(storeData.storeId, {
        status: 'PAUSED',
        reason: pauseReason.trim(),
      });
      
      setPauseModalOpen(false);
      setPauseReason('');
      showCenterSuccess('Đã ngưng bán cửa hàng thành công');
      
      // Reload store data
      await loadStoreData();
    } catch (error: any) {
      console.error('Error pausing store:', error);
      showCenterError(
        error?.message || 'Không thể ngưng bán cửa hàng. Vui lòng thử lại sau.',
        'Lỗi'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleActivateStore = async () => {
    if (!storeData) return;

    try {
      setIsToggling(true);
      await StoreService.toggleStoreStatus(storeData.storeId, {
        status: 'ACTIVE',
        reason: '',
      });
      
      showCenterSuccess('Đã kích hoạt cửa hàng thành công');
      
      // Reload store data
      await loadStoreData();
    } catch (error: any) {
      console.error('Error activating store:', error);
      showCenterError(
        error?.message || 'Không thể kích hoạt cửa hàng. Vui lòng thử lại sau.',
        'Lỗi'
      );
    } finally {
      setIsToggling(false);
    }
  };

  // Check if store is ACTIVE
  const isActive = storeData?.status === 'ACTIVE';
  // Check if store is PAUSED
  const isPaused = storeData?.status === 'PAUSED';
  // Only allow toggle if status is ACTIVE or PAUSED
  const canToggle = isActive || isPaused;

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Đang hoạt động
          </Tag>
        );
      case 'PAUSED':
        return (
          <Tag icon={<PauseCircleOutlined />} color="warning">
            Đã ngưng bán
          </Tag>
        );
      case 'PENDING':
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Đang chờ duyệt
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Đã từ chối
          </Tag>
        );
      case 'INACTIVE':
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">
            Chưa kích hoạt
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Đang tải thông tin cửa hàng..." />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Empty
          description="Không tìm thấy thông tin cửa hàng"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt cửa hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và quản lý thông tin cửa hàng của bạn</p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleActivateStore}
            disabled={!isPaused || isToggling || !canToggle}
            loading={isToggling && isPaused}
          >
            Kích hoạt
          </Button>
          <Button
            danger
            icon={<PauseCircleOutlined />}
            onClick={handleOpenPauseModal}
            disabled={!isActive || isToggling || !canToggle}
          >
            Ngưng bán
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={isRefreshing || isToggling}
            loading={isRefreshing}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Store Information Card */}
      <Card className="shadow-sm">
        <div className="space-y-6">
          {/* Store Header with Logo */}
          <div className="flex items-start gap-6">
            {storeData.logoUrl ? (
              <Image
                src={storeData.logoUrl}
                alt={storeData.storeName}
                width={120}
                height={120}
                className="rounded-lg object-cover border border-gray-200"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23f3f4f6' width='120' height='120'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center border border-gray-200">
                <ShopOutlined className="text-5xl text-white" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{storeData.storeName}</h2>
                {getStatusTag(storeData.status)}
              </div>
              
              {storeData.description && (
                <p className="text-gray-600 mb-4">{storeData.description}</p>
              )}

              {storeData.rating !== null && storeData.rating !== undefined && (
                <div className="flex items-center gap-2">
                  <StarFilled className="text-yellow-400" />
                  <span className="font-semibold text-gray-700">
                    {storeData.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">đánh giá</span>
                </div>
              )}
            </div>
          </div>

          {/* Cover Image */}
          {storeData.coverImageUrl && (
            <div className="mt-4">
              <Image
                src={storeData.coverImageUrl}
                alt="Cover"
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: '300px' }}
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='300'%3E%3Crect fill='%23f3f4f6' width='800' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Cover Image%3C/text%3E%3C/svg%3E"
              />
            </div>
          )}

          <Divider />

          {/* Store Details */}
          <Descriptions
            title="Thông tin cửa hàng"
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item
              label={
                <Space>
                  <PhoneOutlined />
                  <span>Số điện thoại</span>
                </Space>
              }
            >
              {storeData.phoneNumber || (
                <span className="text-gray-400">Chưa cập nhật</span>
              )}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space>
                  <MailOutlined />
                  <span>Email</span>
                </Space>
              }
            >
              {storeData.email || (
                <span className="text-gray-400">Chưa cập nhật</span>
              )}
            </Descriptions.Item>

            {storeData.address && (
              <Descriptions.Item
                label={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Địa chỉ</span>
                  </Space>
              }
                span={2}
              >
                {storeData.address}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Store Addresses */}
          {storeData.storeAddresses && storeData.storeAddresses.length > 0 && (
            <>
              <Divider />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ cửa hàng</h3>
                <div className="space-y-3">
                  {storeData.storeAddresses.map((addr, index) => (
                    <Card
                      key={addr.addressId}
                      size="small"
                      className={addr.defaultAddress ? 'border-orange-300 bg-orange-50' : ''}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <EnvironmentOutlined className="text-orange-500" />
                            <span className="font-medium text-gray-900">
                              Địa chỉ {index + 1}
                              {addr.defaultAddress && (
                                <Tag color="orange" className="ml-2">
                                  Mặc định
                                </Tag>
                              )}
                            </span>
                          </div>
                          <p className="text-gray-700 ml-6">{addr.address}</p>
                          {addr.addressLocation && (
                            <div className="mt-2 ml-6 text-xs text-gray-500">
                              <span className="font-medium">Tọa độ:</span> {addr.addressLocation}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Pause Store Modal */}
      <Modal
        title="Ngưng bán cửa hàng"
        open={pauseModalOpen}
        onOk={handlePauseStore}
        onCancel={handleClosePauseModal}
        confirmLoading={isToggling}
        okText="Xác nhận ngưng bán"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Khi ngưng bán, tất cả sản phẩm của cửa hàng sẽ được chuyển sang trạng thái <strong>UNLISTED</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do ngưng bán <span className="text-red-500">*</span>
            </label>
            <TextArea
              rows={4}
              placeholder="Nhập lý do ngưng bán (bắt buộc)"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SetupStoreComponent;

