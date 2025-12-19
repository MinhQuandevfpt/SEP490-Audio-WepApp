import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Table, Tag, Button, Tooltip, Modal, Typography, Space, Card, Row, Col, Statistic, Tabs, Empty } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  SendOutlined,
  StopOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { CampaignService } from '../../../services/admin/CampaignService';
import type { Campaign, CampaignStatus, CampaignType } from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';

const CampaignManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Refresh khi quay lại từ trang tạo/chỉnh sửa (khi location key thay đổi)
  useEffect(() => {
    // Chỉ refresh khi đang ở trang campaigns và location key thay đổi (navigate mới)
    if (location.pathname === '/admin/campaigns') {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CampaignService.getAllCampaigns();
      // Sắp xếp theo thời gian tạo/update mới nhất lên đầu
      const sortedData = [...data].sort((a, b) => {
        // Ưu tiên updatedAt, nếu không có thì dùng createdAt
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA; // Mới nhất lên đầu
      });
      setCampaigns(sortedData);
    } catch (error: any) {
      showTikiNotification(error.message || 'Không thể tải danh sách chiến dịch', 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);


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
      width: 240,
      render: (_: any, record: Campaign) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {new Date(record.startTime).toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}
          </div>
          <div className="text-xs text-gray-500">
            đến {new Date(record.endTime).toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}
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
      render: (_: any, record: Campaign) => {
        if (!record.flashSlots || record.flashSlots.length === 0) {
          return <span className="text-gray-400">Không có</span>;
        }
        
        const getStatusColor = (status?: string) => {
          switch (status) {
            case 'ACTIVE': return '#52c41a';
            case 'PENDING': return '#faad14';
            case 'ENDED': return '#8c8c8c';
            default: return '#1890ff';
          }
        };

        const getStatusText = (status?: string) => {
          switch (status) {
            case 'ACTIVE': return 'Đang diễn ra';
            case 'PENDING': return 'Chờ bắt đầu';
            case 'ENDED': return 'Đã kết thúc';
            default: return status || 'Không rõ';
          }
        };
        
        const tooltipContent = (
          <div style={{ 
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '320px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(251, 146, 60, 0.3)'
            }}>
              <ThunderboltOutlined style={{ fontSize: '20px', color: '#fb923c' }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#fff',
                letterSpacing: '0.5px'
              }}>
                {record.flashSlots.length} Khung giờ Flash Sale
              </span>
            </div>

            {/* Slots List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {record.flashSlots.map((slot, index) => (
                <div 
                  key={slot.slotId || index} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(251, 146, 60, 0.2)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(251, 146, 60, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                  }}
                >
                  {/* Slot Number & Status */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fb923c, #f97316)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(251, 146, 60, 0.4)'
                      }}>
                        {index + 1}
                      </div>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: '#fb923c'
                      }}>
                        Khung {index + 1}
                      </span>
                    </div>
                    {slot.status && (
                      <Tag 
                        color={getStatusColor(slot.status)}
                        style={{ 
                          margin: 0,
                          fontSize: '11px',
                          fontWeight: '500',
                          borderRadius: '4px',
                          padding: '2px 8px'
                        }}
                      >
                        {getStatusText(slot.status)}
                      </Tag>
                    )}
                  </div>

                  {/* Time Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: '#e2e8f0'
                    }}>
                      <ClockCircleOutlined style={{ color: '#60a5fa', fontSize: '14px' }} />
                      <span style={{ color: '#94a3b8', minWidth: '50px' }}>Bắt đầu:</span>
                      <span style={{ 
                        color: '#fff',
                        fontWeight: '500',
                        fontFamily: 'monospace'
                      }}>
                        {new Date(slot.openTime).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: '#e2e8f0'
                    }}>
                      <CheckCircleOutlined style={{ color: '#34d399', fontSize: '14px' }} />
                      <span style={{ color: '#94a3b8', minWidth: '50px' }}>Kết thúc:</span>
                      <span style={{ 
                        color: '#fff',
                        fontWeight: '500',
                        fontFamily: 'monospace'
                      }}>
                        {new Date(slot.closeTime).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
        return (
          <Tooltip 
            title={tooltipContent} 
            placement="left" 
            overlayStyle={{ maxWidth: 'none' }}
            overlayInnerStyle={{ 
              padding: 0,
              background: 'transparent',
              boxShadow: 'none'
            }}
            color="transparent"
          >
            <span style={{
              color: '#1890ff',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e6f4ff';
              e.currentTarget.style.color = '#0958d9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#1890ff';
            }}
            >
              {record.flashSlots.length} khung giờ
            </span>
          </Tooltip>
        );
      },
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
        </div>
      ),
    },
  ], [getStatusTag, getTypeTag, handleStatusChange, navigate]);

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
