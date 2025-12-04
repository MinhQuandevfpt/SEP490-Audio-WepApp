import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Phone, Building2, CreditCard, DollarSign, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AdminKycService } from '../../../services/admin/AdminKycService';
import type { KycData } from '../../../types/admin';
import { showError } from '../../../utils/notification';

const KycDetail: React.FC = () => {
  const { kycId } = useParams<{ kycId: string }>();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (kycId) {
      fetchKycDetail();
    }
  }, [kycId]);

  const fetchKycDetail = async () => {
    if (!kycId) return;
    
    setIsLoading(true);
    try {
      const data = await AdminKycService.getKycDetail(kycId);
      setKyc(data);
    } catch (error) {
      console.error('Error fetching KYC detail:', error);
      showError('Không thể tải chi tiết KYC');
    } finally {
      setIsLoading(false);
    }
  };

  const openImageModal = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  };

  const getStatusIcon = () => {
    if (!kyc) return null;
    
    switch (kyc.status) {
      case 'APPROVED':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!kyc) return null;
    
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
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${styles[kyc.status]}`}>
        {getStatusIcon()}
        {labels[kyc.status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải chi tiết KYC...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy KYC</h3>
            <p className="mt-2 text-gray-500">Yêu cầu KYC không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/admin/kyc')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/kyc')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách KYC
        </button>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Chi tiết yêu cầu KYC
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Xem đầy đủ thông tin xác thực cửa hàng
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              Thông tin cửa hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tên cửa hàng</label>
                <p className="text-base font-semibold text-gray-900 mt-1">{kyc.storeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {kyc.phoneNumber}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Loại hình</label>
                <p className="text-base text-gray-900 mt-1">
                  {kyc.official ? (
                    <span className="text-blue-600 font-medium">Doanh nghiệp chính thức</span>
                  ) : (
                    <span className="text-gray-600">Hộ kinh doanh</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phiên bản</label>
                <p className="text-base text-gray-900 mt-1">Version {kyc.version}</p>
              </div>
            </div>
          </div>

          {/* Business License Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Thông tin giấy phép kinh doanh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Số GPKD</label>
                <p className="text-base font-mono text-gray-900 mt-1">{kyc.businessLicenseNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                <p className="text-base font-mono text-gray-900 mt-1">{kyc.taxCode}</p>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              Thông tin ngân hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Ngân hàng</label>
                <p className="text-base text-gray-900 mt-1">{kyc.bankName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tên tài khoản</label>
                <p className="text-base text-gray-900 mt-1">{kyc.bankAccountName}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Số tài khoản</label>
                <p className="text-base font-mono text-gray-900 mt-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  {kyc.bankAccountNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tài liệu đính kèm
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => openImageModal(kyc.idCardFrontUrl, 'Căn cước/CCCD mặt trước')}
                className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all"
              >
                <img
                  src={kyc.idCardFrontUrl}
                  alt="Căn cước/CCCD mặt trước"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                    Xem chi tiết
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs font-medium">Căn cước/CCCD mặt trước</p>
                </div>
              </button>

              <button
                onClick={() => openImageModal(kyc.idCardBackUrl, 'Căn cước/CCCD mặt sau')}
                className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all"
              >
                <img
                  src={kyc.idCardBackUrl}
                  alt="Căn cước/CCCD mặt sau"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                    Xem chi tiết
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs font-medium">Căn cước/CCCD mặt sau</p>
                </div>
              </button>

              <button
                onClick={() => openImageModal(kyc.businessLicenseUrl, 'Giấy phép kinh doanh')}
                className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all"
              >
                <img
                  src={kyc.businessLicenseUrl}
                  alt="Giấy phép kinh doanh"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                    Xem chi tiết
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs font-medium">Giấy phép kinh doanh</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Status */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Thời gian
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ngày tạo</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(kyc.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ngày gửi</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(kyc.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              {kyc.reviewedAt && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${kyc.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {kyc.status === 'APPROVED' ? 'Ngày duyệt' : 'Ngày từ chối'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(kyc.reviewedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Cập nhật lần cuối</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(kyc.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Review Note */}
          {kyc.reviewNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Ghi chú đánh giá</h3>
              <p className="text-sm text-yellow-800">{kyc.reviewNote}</p>
            </div>
          )}

          {/* System Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>ID yêu cầu:</span>
                <span className="font-mono text-gray-900">{kyc.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Phiên bản:</span>
                <span className="font-semibold text-gray-900">{kyc.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="max-w-5xl w-full bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.title}</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-gray-900">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycDetail;
