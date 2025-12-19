import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Space, Typography, Empty, Spin, Image, Button} from 'antd';
import {
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { KycData } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const { Text } = Typography;

interface StoreKycHistoryModalProps {
  visible: boolean;
  storeId: string;
  storeName: string;
  onClose: () => void;
}

const StoreKycHistoryModal: React.FC<StoreKycHistoryModalProps> = ({
  visible,
  storeId,
  storeName,
  onClose,
}) => {
  const [kycHistory, setKycHistory] = useState<KycData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (visible && storeId) {
      fetchKycHistory();
    } else {
      setKycHistory([]);
    }
  }, [visible, storeId]);

  const fetchKycHistory = async () => {
    setIsLoading(true);
    try {
      const data = await AdminStoreService.getStoreKycHistory(storeId);
      // Sort by submittedAt descending (newest first)
      const sorted = [...data].sort((a, b) => {
        const timeA = new Date(a.submittedAt || a.createdAt).getTime();
        const timeB = new Date(b.submittedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
      setKycHistory(sorted);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải lịch sử KYC');
      setKycHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      PENDING: {
        color: 'processing',
        text: 'Chờ duyệt',
        icon: <ClockCircleOutlined />
      },
      APPROVED: {
        color: 'success',
        text: 'Đã duyệt',
        icon: <CheckCircleOutlined />
      },
      REJECTED: {
        color: 'error',
        text: 'Đã từ chối',
        icon: <CloseCircleOutlined />
      }
    };

    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const openImageModal = (url: string, title: string) => {
    setSelectedImage({ url, title });
  };

  const columns: ColumnsType<KycData> = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thông tin',
      key: 'info',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.storeName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SĐT: {record.phoneNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Mã thuế: {record.taxCode}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Giấy phép KD',
      dataIndex: 'businessLicenseNumber',
      key: 'businessLicenseNumber',
      width: 150,
      render: (businessLicenseNumber) => (
        <Text>{businessLicenseNumber}</Text>
      ),
    },
    {
      title: 'Ngân hàng',
      key: 'bank',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.bankName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.bankAccountName}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            {record.bankAccountNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tài liệu',
      key: 'documents',
      width: 150,
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => openImageModal(record.idCardFrontUrl, 'CMND/CCCD mặt trước')}
          >
            CMND mặt trước
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => openImageModal(record.idCardBackUrl, 'CMND/CCCD mặt sau')}
          >
            CMND mặt sau
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => openImageModal(record.businessLicenseUrl, 'Giấy phép kinh doanh')}
          >
            GPKD
          </Button>
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Gửi: {new Date(record.submittedAt || record.createdAt).toLocaleString('vi-VN')}
          </Text>
          {record.reviewedAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Duyệt: {new Date(record.reviewedAt).toLocaleString('vi-VN')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'reviewNote',
      key: 'reviewNote',
      width: 200,
      render: (reviewNote) => (
        reviewNote ? (
          <Text type="danger" style={{ fontSize: '12px' }}>{reviewNote}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
        )
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <Text strong>Lịch sử KYC - {storeName}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (ID: {storeId})
            </Text>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Đang tải lịch sử KYC...</Text>
            </div>
          </div>
        ) : kycHistory.length === 0 ? (
          <Empty
            description="Chưa có lịch sử KYC"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={kycHistory}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} yêu cầu KYC`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title={selectedImage?.title || 'Xem hình ảnh'}
        open={!!selectedImage}
        onCancel={() => setSelectedImage(null)}
        footer={null}
        width={800}
        centered
      >
        {selectedImage && (
          <Image
            src={selectedImage.url}
            alt={selectedImage.title}
            style={{ width: '100%' }}
            preview={{
              mask: <EyeOutlined />,
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default StoreKycHistoryModal;

