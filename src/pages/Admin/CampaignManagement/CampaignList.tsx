import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Tooltip, Modal } from 'antd';
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
    if (!CampaignService.canChangeStatus(currentStatus, newStatus)) {
      showTikiNotification(
        `Không thể chuyển từ ${CampaignService.getStatusLabel(currentStatus)} sang ${CampaignService.getStatusLabel(newStatus)}`,
        'Lỗi',
        'error'
      );
      return;
    }

    const statusLabel = CampaignService.getStatusTransitionLabel(newStatus);
    
    Modal.confirm({
      title: 'Xác nhận thay đổi trạng thái',
      content: `Bạn có chắc chắn muốn ${statusLabel.toLowerCase()} chiến dịch "${name}"?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await CampaignService.updateCampaignStatus(id, newStatus);
          showTikiNotification(
            `${statusLabel} chiến dịch thành công!`,
            'Thành công',
            'success'
          );
          fetchCampaigns();
        } catch (error: any) {
          showTikiNotification(error.message || 'Không thể cập nhật trạng thái', 'Lỗi', 'error');
        }
      }
    });
  }, [fetchCampaigns]);

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
    <div className="p-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Quản lý chiến dịch khuyến mãi
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các chiến dịch Mega Sale và Flash Sale
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/admin/campaigns/create')}
            style={{ 
              background: 'linear-gradient(to right, #f97316, #ea580c)',
              borderColor: '#f97316'
            }}
          >
            Tạo chiến dịch mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng chiến dịch</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z"/>
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đang diễn ra</p>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Mega Sale</p>
              <p className="text-3xl font-bold text-gray-900">{stats.megaSale}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Flash Sale</p>
              <p className="text-3xl font-bold text-gray-900">{stats.flashSale}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(['ALL', 'DRAFT', 'ONOPEN', 'ACTIVE', 'DISABLED', 'EXPIRED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
              selectedStatus === status
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : CampaignService.getStatusLabel(status)}
            {status !== 'ALL' && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {campaigns.filter(c => c.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

     

      {/* Ant Design Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
              <div className="py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Chưa có chiến dịch nào</h3>
                <p className="mt-2 text-gray-500">Tạo chiến dịch đầu tiên để bắt đầu.</p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default CampaignManagement;
