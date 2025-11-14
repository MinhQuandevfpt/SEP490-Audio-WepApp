import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Space, Tooltip, Switch, Typography, Card, Row, Col, Statistic, Tabs, Empty } from 'antd';
import { Modal } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  PictureOutlined 
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminBannerService } from '../../../services/admin/AdminBannerService';
import type { Banner } from '../../../types/admin';
import { showError, showSuccess } from '../../../utils/notification';

const BannerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; banner: Banner | null }>({
    visible: false,
    banner: null,
  });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} banner`,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await AdminBannerService.getAllBanners();
      setBanners(response.data);
    } catch (error) {
      showError('Không thể tải danh sách banner');
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (banner: Banner) => {
    setDeleteModal({
      visible: true,
      banner,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteModal.banner) return;
    
    try {
      await AdminBannerService.deleteBanner(deleteModal.banner.id);
      setDeleteModal({ visible: false, banner: null });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  }, [deleteModal.banner, fetchBanners]);

  const handleToggleActive = useCallback(async (banner: Banner, checked: boolean) => {
    try {
      await AdminBannerService.updateBanner(banner.id, {
        active: checked,
      });
      showSuccess(`Banner đã ${checked ? 'kích hoạt' : 'vô hiệu hóa'}`);
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  }, [fetchBanners]);

  const openImageModal = useCallback((url: string, title: string) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  }, []);

  const handleViewDetail = useCallback((bannerId: string) => {
    navigate(`/admin/banners/${bannerId}`);
  }, [navigate]);

  const handleEdit = useCallback((bannerId: string) => {
    navigate(`/admin/banners/${bannerId}/edit`);
  }, [navigate]);

  const handleCreate = useCallback(() => {
    navigate('/admin/banners/create');
  }, [navigate]);

  const getStatusTag = useMemo(() => (active: boolean, startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!active) {
      return <Tag color="default">Đã tắt</Tag>;
    }
    
    if (now < start) {
      return <Tag color="blue">Chưa bắt đầu</Tag>;
    }
    
    if (now > end) {
      return <Tag color="error">Đã hết hạn</Tag>;
    }
    
    return <Tag color="success">Đang hoạt động</Tag>;
  }, []);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const active = banners.filter(b => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return b.active && now >= start && now <= end;
    }).length;
    const inactive = banners.filter(b => !b.active).length;
    const expired = banners.filter(b => {
      const end = new Date(b.endTime);
      return now > end;
    }).length;
    
    return { total: banners.length, active, inactive, expired };
  }, [banners]);

  const columns: ColumnsType<Banner> = useMemo(() => [
    {
      title: 'Banner',
      key: 'banner',
      width: 250,
      render: (_: any, record: Banner) => (
        <div className="flex items-center space-x-3">
          {record.images.length > 0 ? (
            <img 
              src={record.images[0].imageUrl} 
              alt={record.title}
              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => openImageModal(record.images[0].imageUrl, record.title)}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
              <PictureOutlined className="text-gray-400 text-2xl" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{record.title}</div>
            <div className="text-xs text-gray-500">ID: {record.id.slice(0, 8)}...</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <span className="text-sm text-gray-600">{description}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'bannerType',
      key: 'bannerType',
      width: 120,
      render: (bannerType: string) => (
        <Tag color="blue">{bannerType}</Tag>
      ),
    },
    {
      title: 'Số ảnh',
      key: 'imageCount',
      width: 100,
      align: 'center',
      render: (_: any, record: Banner) => (
        <span className="text-sm font-medium text-gray-700">{record.images.length}</span>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 180,
      render: (_: any, record: Banner) => (
        <div className="text-sm">
          <div className="text-gray-600">
            Từ: {new Date(record.startTime).toLocaleDateString('vi-VN')}
          </div>
          <div className="text-gray-600">
            Đến: {new Date(record.endTime).toLocaleDateString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      filters: [
        { text: 'Đang hoạt động', value: 'ACTIVE' },
        { text: 'Đã tắt', value: 'INACTIVE' },
        { text: 'Đã hết hạn', value: 'EXPIRED' },
      ],
      onFilter: (value: any, record: Banner) => {
        const now = new Date();
        const end = new Date(record.endTime);
        
        if (value === 'ACTIVE') {
          return record.active && now <= end;
        } else if (value === 'INACTIVE') {
          return !record.active;
        } else if (value === 'EXPIRED') {
          return now > end;
        }
        return true;
      },
      render: (_: any, record: Banner) => (
        <div className="space-y-2">
          {getStatusTag(record.active, record.startTime, record.endTime)}
          <div>
            <Switch
              checked={record.active}
              onChange={(checked) => handleToggleActive(record, checked)}
              size="small"
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: Banner, b: Banner) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: string) => (
        <span className="text-sm text-gray-600">
          {new Date(createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Banner) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [getStatusTag, handleViewDetail, handleEdit, handleDelete, openImageModal, handleToggleActive]);

  // Filter data based on selected status
  const filteredData = useMemo(() => {
    const now = new Date();
    
    if (selectedStatus === 'ACTIVE') {
      return banners.filter(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return b.active && now >= start && now <= end;
      });
    } else if (selectedStatus === 'INACTIVE') {
      return banners.filter(b => !b.active);
    }
    return banners;
  }, [selectedStatus, banners]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý Banner
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản lý banner quảng cáo trên trang chủ
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Tạo banner mới
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng banner" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đang hoạt động" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đã tắt" value={stats.inactive} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đã hết hạn" value={stats.expired} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs */}
      <Tabs
        activeKey={selectedStatus}
        onChange={(key) => setSelectedStatus(key as any)}
        items={(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => ({
          key: status,
          label: (
            <Space>
              <span>
                {status === 'ALL' ? 'Tất cả' : status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã tắt'}
              </span>
              <Tag>
                {status === 'ALL' ? stats.total : status === 'ACTIVE' ? stats.active : stats.inactive}
              </Tag>
            </Space>
          ),
        }))}
      />

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có banner nào. Tạo banner quảng cáo đầu tiên để bắt đầu.
                  </span>
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  Tạo banner mới
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="max-w-4xl w-full bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.title}</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa banner"
        open={deleteModal.visible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, banner: null })}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        {deleteModal.banner && (
          <p>
            Bạn có chắc chắn muốn xóa banner <strong>"{deleteModal.banner.title}"</strong>?
          </p>
        )}
      </Modal>
    </Space>
  );
};

export default BannerManagement;
