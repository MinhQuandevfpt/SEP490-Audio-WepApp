import React, { useState, useEffect } from 'react';
import { AdminKycService } from '../../../services/admin/AdminKycService';
import type { KycData, KycStatus } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const KycManagement: React.FC = () => {
  const [filteredRequests, setFilteredRequests] = useState<KycData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<KycStatus | 'ALL'>('ALL');
  const [selectedKyc, setSelectedKyc] = useState<KycData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchKycRequests();
  }, [selectedStatus]);

  const fetchKycRequests = async () => {
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
  };

  const handleApprove = async (kyc: KycData) => {
    if (!window.confirm(`Bạn có chắc chắn muốn phê duyệt KYC cho cửa hàng "${kyc.storeName}"?`)) {
      return;
    }

    try {
      await AdminKycService.approveKyc(kyc.id);
      fetchKycRequests();
    } catch (error) {
      console.error('Error approving KYC:', error);
    }
  };

  const handleReject = (kyc: KycData) => {
    setSelectedKyc(kyc);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const confirmReject = async () => {
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
  };

  const openImageModal = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  };

  const getStatusBadge = (status: KycStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Đã từ chối'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
          Quản lý yêu cầu KYC
        </h1>
        <p className="text-gray-600 mt-2">
          Xem và xử lý các yêu cầu xác thực cửa hàng
        </p>
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Không có yêu cầu KYC</h3>
            <p className="mt-2 text-gray-500">Chưa có yêu cầu xác thực nào từ các cửa hàng.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cửa hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giấy phép kinh doanh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tài liệu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((kyc) => (
                  <tr key={kyc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{kyc.storeName}</div>
                      <div className="text-xs text-gray-500">ID: {kyc.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{kyc.phoneNumber}</div>
                      <div className="text-xs text-gray-500">Mã thuế: {kyc.taxCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{kyc.businessLicenseNumber}</div>
                      <div className="text-xs text-gray-500">{kyc.official ? 'Chính thức' : 'Hộ kinh doanh'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openImageModal(kyc.idCardFrontUrl, 'CMND/CCCD mặt trước')}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          CMND trước
                        </button>
                        <button
                          onClick={() => openImageModal(kyc.idCardBackUrl, 'CMND/CCCD mặt sau')}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          CMND sau
                        </button>
                        <button
                          onClick={() => openImageModal(kyc.businessLicenseUrl, 'Giấy phép kinh doanh')}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          GPKD
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(kyc.status)}
                      {kyc.reviewNote && (
                        <div className="mt-1 text-xs text-gray-500">
                          Ghi chú: {kyc.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(kyc.submittedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {kyc.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(kyc)}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors duration-200"
                          >
                            Phê duyệt
                          </button>
                          <button
                            onClick={() => handleReject(kyc)}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                      {kyc.status === 'APPROVED' && (
                        <span className="text-xs text-gray-500">
                          Đã duyệt {kyc.reviewedAt && `lúc ${new Date(kyc.reviewedAt).toLocaleString('vi-VN')}`}
                        </span>
                      )}
                      {kyc.status === 'REJECTED' && (
                        <span className="text-xs text-gray-500">
                          Đã từ chối {kyc.reviewedAt && `lúc ${new Date(kyc.reviewedAt).toLocaleString('vi-VN')}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Từ chối yêu cầu KYC
            </h3>
            <p className="text-gray-600 mb-4">
              Cửa hàng: <span className="font-medium">{selectedKyc.storeName}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ví dụ: Thiếu giấy phép kinh doanh, thông tin không rõ ràng..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedKyc(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

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
