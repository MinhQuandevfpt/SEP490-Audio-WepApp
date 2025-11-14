import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Modal, Input, Space, Tooltip, Typography, Card, Row, Col, Statistic, Tabs, Empty } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminKycService } from '../../../services/admin/AdminKycService';
import type { KycData, KycStatus } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const { TextArea } = Input;

const KycManagement: React.FC = () => {
  const navigate = useNavigate();
  const [filteredRequests, setFilteredRequests] = useState<KycData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<KycStatus | 'ALL'>('ALL');
  const [selectedKyc, setSelectedKyc] = useState<KycData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
  });

  useEffect(() => {
    fetchKycRequests();
  }, [selectedStatus]);

  const fetchKycRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;
      if (selectedStatus === 'ALL') {
        response = await AdminKycService.getAllKyc();
      } else {
        response = await AdminKycService.getKycByStatus(selectedStatus);
      }
      setFilteredRequests(response.data);
    } catch (error) {
      showError('Không thể tải danh sách KYC');
      console.error('Error fetching KYC:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  const handleApprove = useCallback(async (kyc: KycData) => {
    if (!window.confirm(`Bạn có chắc chắn muốn phê duyệt KYC cho cửa hàng "${kyc.storeName}"?`)) {
      return;
    }

    try {
      await AdminKycService.approveKyc(kyc.id);
      fetchKycRequests();
    } catch (error) {
      console.error('Error approving KYC:', error);
    }
  }, [fetchKycRequests]);

  const handleReject = useCallback((kyc: KycData) => {
    setSelectedKyc(kyc);
    setShowRejectModal(true);
    setRejectReason('');
  }, []);

  const confirmReject = useCallback(async () => {
    if (!selectedKyc) return;
    
    if (!rejectReason.trim()) {
      showError('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await AdminKycService.rejectKyc(selectedKyc.id, rejectReason);
      setShowRejectModal(false);
      setSelectedKyc(null);
      setRejectReason('');
      fetchKycRequests();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
    }
  }, [selectedKyc, rejectReason, fetchKycRequests]);

  const openImageModal = useCallback((url: string, title: string) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  }, []);

  const getStatusTag = useMemo(() => (status: KycStatus) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: 'Chờ duyệt' },
      APPROVED: { color: 'success', text: 'Đã duyệt' },
      REJECTED: { color: 'error', text: 'Đã từ chối' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  }, []);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  const handleViewDetail = useCallback((kycId: string) => {
    navigate(`/admin/kyc/${kycId}`);
  }, [navigate]);

  const columns: ColumnsType<KycData> = useMemo(() => [
    {
      title: 'Cửa hàng',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 200,
      render: (storeName: string, record: KycData) => (
        <div>
          <div className="font-medium text-gray-900">{storeName}</div>
          <div className="text-xs text-gray-500">ID: {record.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: 'Thông tin liên hệ',
      key: 'contact',
      width: 180,
      render: (_: any, record: KycData) => (
        <div>
          <div className="text-sm text-gray-900">{record.phoneNumber}</div>
          <div className="text-xs text-gray-500">Mã thuế: {record.taxCode}</div>
        </div>
      ),
    },
    {
      title: 'Giấy phép KD',
      dataIndex: 'businessLicenseNumber',
      key: 'businessLicenseNumber',
      width: 150,
      render: (businessLicenseNumber: string, record: KycData) => (
        <div>
          <div className="text-sm text-gray-900">{businessLicenseNumber}</div>
          <div className="text-xs text-gray-500">
            {record.official ? 'Chính thức' : 'Hộ kinh doanh'}
          </div>
        </div>
      ),
    },
    {
      title: 'Tài liệu',
      key: 'documents',
      width: 150,
      render: (_: any, record: KycData) => (
        <Space size="small" direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => openImageModal(record.idCardFrontUrl, 'CMND/CCCD mặt trước')}
          >
            CMND trước
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => openImageModal(record.idCardBackUrl, 'CMND/CCCD mặt sau')}
          >
            CMND sau
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'Chờ duyệt', value: 'PENDING' },
        { text: 'Đã duyệt', value: 'APPROVED' },
        { text: 'Đã từ chối', value: 'REJECTED' },
      ],
      onFilter: (value: any, record: KycData) => record.status === value,
      render: (status: KycStatus, record: KycData) => (
        <div>
          {getStatusTag(status)}
          {record.reviewNote && (
            <div className="mt-1 text-xs text-gray-500">
              Ghi chú: {record.reviewNote.slice(0, 30)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 120,
      sorter: (a: KycData, b: KycData) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (submittedAt: string) => (
        <span className="text-sm text-gray-600">
          {new Date(submittedAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: KycData) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            >
              Chi tiết
            </Button>
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="Phê duyệt">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record)}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ], [getStatusTag, handleViewDetail, handleApprove, handleReject, openImageModal]);

  // Filter data based on selected status - memoized for performance
  const filteredData = useMemo(() => {
    if (selectedStatus === 'ALL') {
      return filteredRequests;
    }
    return filteredRequests.filter(req => req.status === selectedStatus);
  }, [selectedStatus, filteredRequests]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === 'PENDING').length,
    approved: filteredRequests.filter(r => r.status === 'APPROVED').length,
    rejected: filteredRequests.filter(r => r.status === 'REJECTED').length,
  }), [filteredRequests]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý yêu cầu KYC
          </Typography.Title>
          <Typography.Text type="secondary">
            Xem và xử lý các yêu cầu xác thực cửa hàng
          </Typography.Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng yêu cầu" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Chờ duyệt" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đã duyệt" value={stats.approved} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đã từ chối" value={stats.rejected} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs */}
      <Tabs
        activeKey={selectedStatus}
        onChange={(key) => setSelectedStatus(key as any)}
        items={(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => ({
          key: status,
          label: (
            <Space>
              <span>
                {status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
              </span>
              <Tag>
                {status === 'ALL' ? stats.total : status === 'PENDING' ? stats.pending : status === 'APPROVED' ? stats.approved : stats.rejected}
              </Tag>
            </Space>
          ),
        }))}
      />

      {/* Ant Design Table */}
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có yêu cầu KYC nào từ các cửa hàng.
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Từ chối yêu cầu KYC"
        open={showRejectModal}
        onOk={confirmReject}
        onCancel={() => {
          setShowRejectModal(false);
          setSelectedKyc(null);
          setRejectReason('');
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        {selectedKyc && (
          <>
            <p className="mb-4">
              Cửa hàng: <span className="font-medium">{selectedKyc.storeName}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <TextArea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Ví dụ: Thiếu giấy phép kinh doanh, thông tin không rõ ràng..."
              />
            </div>
          </>
        )}
      </Modal>

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
    </Space>
  );
};

export default KycManagement;
