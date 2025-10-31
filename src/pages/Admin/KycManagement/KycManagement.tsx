import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Modal, Input, Space, Tooltip } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminKycService } from '../../../services/admin/AdminKycService';
import type { KycData, KycStatus } from '../../../types/admin';
import { showError } from '../../../utils/notification';
import { KycStatsCards } from '../../../components/AdminComponents/KycStatsCards';

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

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Quản lý yêu cầu KYC
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Xem và xử lý các yêu cầu xác thực cửa hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <KycStatsCards kycRequests={filteredRequests} isLoading={isLoading} />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
              selectedStatus === status
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
            {status !== 'ALL' && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {filteredRequests.filter(r => r.status === status).length}
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
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Không có yêu cầu KYC</h3>
                <p className="mt-2 text-gray-500">Chưa có yêu cầu xác thực nào từ các cửa hàng.</p>
              </div>
            ),
          }}
        />
      </div>

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
    </div>
  );
};

export default KycManagement;
