import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Tooltip, Modal, Typography, Space, Card, Row, Col, Statistic, Tabs, Empty } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SendOutlined,
  StopOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { CampaignService } from '../../../services/admin/CampaignService';
import type { Campaign, CampaignStatus, CampaignType } from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';

const CampaignManagement: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} chiến dịch`,
  });

  // State cho Modal xác nhận thay đổi status
  const [statusChangeModal, setStatusChangeModal] = useState<{
    visible: boolean;
    campaignId: string;
    campaignName: string;
    currentStatus: CampaignStatus;
    newStatus: CampaignStatus;
  } | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CampaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      showTikiNotification(error.message || 'Không thể tải danh sách chiến dịch', 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa chiến dịch "${name}"?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await CampaignService.deleteCampaign(id);
          showTikiNotification('Xóa chiến dịch thành công!', 'Thành công', 'success');
          fetchCampaigns();
        } catch (error: any) {
          showTikiNotification(error.message || 'Không thể xóa chiến dịch', 'Lỗi', 'error');
        }
      }
    });
  }, [fetchCampaigns]);

  const handleStatusChange = useCallback(async (
    id: string, 
    name: string, 
    currentStatus: CampaignStatus, 
    newStatus: CampaignStatus
  ) => {
    console.log('🔔 handleStatusChange called:', { id, name, currentStatus, newStatus });
    
    if (!CampaignService.canChangeStatus(currentStatus, newStatus)) {
      console.warn('❌ Cannot change status:', currentStatus, '→', newStatus);
      showTikiNotification(
        `Không thể chuyển từ ${CampaignService.getStatusLabel(currentStatus)} sang ${CampaignService.getStatusLabel(newStatus)}`,
        'Lỗi',
        'error'
      );
      return;
    }

    console.log('✅ Status change allowed. Opening modal...');
    
    // Mở modal xác nhận
    setStatusChangeModal({
      visible: true,
      campaignId: id,
      campaignName: name,
      currentStatus,
      newStatus
    });
  }, []);

  // Xử lý khi user confirm trong modal
  const handleConfirmStatusChange = useCallback(async () => {
    if (!statusChangeModal) return;

    const { campaignId, newStatus } = statusChangeModal;
    const statusLabel = CampaignService.getStatusTransitionLabel(newStatus);

    console.log('🚀 User confirmed. Calling API...');
    
    try {
      const result = await CampaignService.updateCampaignStatus(campaignId, newStatus);
      console.log('✅ API Response:', result);
      
      showTikiNotification(
        `${statusLabel} chiến dịch thành công!`,
        'Thành công',
        'success'
      );
      
      // Đóng modal
      setStatusChangeModal(null);
      
      // Refresh danh sách
      fetchCampaigns();
    } catch (error: any) {
      console.error('❌ API Error:', error);
      showTikiNotification(error.message || 'Không thể cập nhật trạng thái', 'Lỗi', 'error');
      
      // Đóng modal kể cả khi lỗi
      setStatusChangeModal(null);
    }
  }, [statusChangeModal, fetchCampaigns]);

  const getStatusTag = useMemo(() => (status: CampaignStatus) => {
    const statusConfig: Record<CampaignStatus, { color: string; text: string }> = {
      DRAFT: { color: 'default', text: 'Bản nháp' },
      ONOPEN: { color: 'processing', text: 'Mở đăng ký' },
      ACTIVE: { color: 'success', text: 'Đang diễn ra' },
      APPROVE: { color: 'purple', text: 'Đã duyệt' },
      DISABLED: { color: 'warning', text: 'Vô hiệu hóa' },
      EXPIRED: { color: 'error', text: 'Hết hạn' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  }, []);

  const getTypeTag = useMemo(() => (type: CampaignType) => {
    return type === 'MEGA_SALE' 
      ? <Tag color="purple">Mega Sale</Tag>
      : <Tag color="orange">Flash Sale</Tag>;
  }, []);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  const columns: ColumnsType<Campaign> = useMemo(() => [
    {
      title: 'Chiến dịch',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, record: Campaign) => (
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{record.code}</div>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Mega Sale', value: 'MEGA_SALE' },
        { text: 'Flash Sale', value: 'FAST_SALE' },
      ],
      onFilter: (value: any, record: Campaign) => record.type === value,
      render: (type: CampaignType) => getTypeTag(type),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_: any, record: Campaign) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {CampaignService.formatDate(record.startTime)}
          </div>
          <div className="text-xs text-gray-500">
            đến {CampaignService.formatDate(record.endTime)}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'Bản nháp', value: 'DRAFT' },
        { text: 'Mở đăng ký', value: 'ONOPEN' },
        { text: 'Đang diễn ra', value: 'ACTIVE' },
        { text: 'Vô hiệu hóa', value: 'DISABLED' },
        { text: 'Hết hạn', value: 'EXPIRED' },
      ],
      onFilter: (value: any, record: Campaign) => record.status === value,
      render: (status: CampaignStatus) => getStatusTag(status),
    },
    {
      title: 'Flash Slots',
      key: 'flashSlots',
      width: 120,
      render: (_: any, record: Campaign) => (
        record.flashSlots && record.flashSlots.length > 0 ? (
          <span className="text-blue-600 font-medium">{record.flashSlots.length} khung giờ</span>
        ) : (
          <span className="text-gray-400">Không có</span>
        )
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: Campaign) => (
        <div className="flex items-center justify-center gap-1">
          {/* Nút Gửi & Mở đăng ký cho DRAFT */}
          {record.status === 'DRAFT' && (
            <Tooltip title="Gửi & Mở đăng ký">
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleStatusChange(record.id, record.name, record.status, 'ONOPEN')}
              />
            </Tooltip>
          )}

          {/* Nút Vô hiệu hóa cho ONOPEN/ACTIVE */}
          {(record.status === 'ONOPEN' || record.status === 'ACTIVE') && (
            <Tooltip title="Vô hiệu hóa">
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleStatusChange(record.id, record.name, record.status, 'DISABLED')}
              />
            </Tooltip>
          )}

          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/campaigns/${record.id}`)}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/campaigns/${record.id}/edit`)}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.name)}
            />
          </Tooltip>
        </div>
      ),
    },
  ], [getStatusTag, getTypeTag, handleStatusChange, handleDelete, navigate]);

  // Filter data based on selected status
  const filteredData = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesStatus = selectedStatus === 'ALL' || campaign.status === selectedStatus;
      return matchesStatus;
    });
  }, [campaigns, selectedStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    onopen: campaigns.filter(c => c.status === 'ONOPEN').length,
    draft: campaigns.filter(c => c.status === 'DRAFT').length,
    megaSale: campaigns.filter(c => c.type === 'MEGA_SALE').length,
    flashSale: campaigns.filter(c => c.type === 'FAST_SALE').length,
  }), [campaigns]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý chiến dịch khuyến mãi
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản lý các chiến dịch Mega Sale và Flash Sale
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/admin/campaigns/create')}
        >
          Tạo chiến dịch mới
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng chiến dịch" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đang diễn ra" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Mega Sale" value={stats.megaSale} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Flash Sale" value={stats.flashSale} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs */}
      <Tabs
        activeKey={selectedStatus}
        onChange={(key) => setSelectedStatus(key as any)}
        items={(['ALL', 'DRAFT', 'ONOPEN', 'ACTIVE', 'DISABLED', 'EXPIRED'] as const).map((status) => ({
          key: status,
          label: (
            <Space>
              <span>{status === 'ALL' ? 'Tất cả' : CampaignService.getStatusLabel(status)}</span>
              {status !== 'ALL' && (
                <Tag>{campaigns.filter(c => c.status === status).length}</Tag>
              )}
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
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty description={
                <span>
                  Chưa có chiến dịch nào. Tạo chiến dịch đầu tiên để bắt đầu.
                </span>
              } />
            ),
          }}
        />
      </Card>

      {/* Modal xác nhận thay đổi trạng thái */}
      <Modal
        title="Xác nhận thay đổi trạng thái"
        open={statusChangeModal?.visible || false}
        onOk={handleConfirmStatusChange}
        onCancel={() => setStatusChangeModal(null)}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        zIndex={2000}
      >
        {statusChangeModal && (
          <p>
            Bạn có chắc chắn muốn{' '}
            <strong>
              {CampaignService.getStatusTransitionLabel(statusChangeModal.newStatus).toLowerCase()}
            </strong>{' '}
            chiến dịch <strong>"{statusChangeModal.campaignName}"</strong>?
          </p>
        )}
      </Modal>
    </Space>
  );
};

export default CampaignManagement;
