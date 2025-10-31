import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, Plus, Trash2, Upload, Loader } from 'lucide-react';
import { CampaignService } from '../../../services/admin/CampaignService';
import type { UpdateCampaignRequest, Campaign } from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';
import { FileUploadService } from '../../../services/FileUploadService';

const EditCampaign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState('');

  const [formData, setFormData] = useState<UpdateCampaignRequest>({
    name: '',
    description: '',
    badgeLabel: '',
    badgeColor: '#FF6600',
    badgeIconUrl: '',
    allowRegistration: true,
    startTime: '',
    endTime: '',
    flashSlots: []
  });

  const [flashSlots, setFlashSlots] = useState<Array<{
    id?: string;
    openTime: string;
    closeTime: string;
    status?: string;
  }>>([]);

  // Load campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      try {
        setIsFetching(true);
        const data = await CampaignService.getCampaignById(id);
        setCampaign(data);

        // Populate form data
        setFormData({
          name: data.name,
          description: data.description,
          badgeLabel: data.badgeLabel,
          badgeColor: data.badgeColor,
          badgeIconUrl: data.badgeIconUrl,
          allowRegistration: data.allowRegistration,
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '',
          endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '',
          status: data.status
        });

        // Set badge preview if exists
        if (data.badgeIconUrl) {
          setBadgeImagePreview(data.badgeIconUrl);
        }

        // Populate flash slots if FAST_SALE
        if (data.type === 'FAST_SALE' && data.flashSlots) {
          setFlashSlots(data.flashSlots.map(slot => ({
            id: slot.slotId,
            openTime: slot.openTime ? new Date(slot.openTime).toISOString().slice(0, 16) : '',
            closeTime: slot.closeTime ? new Date(slot.closeTime).toISOString().slice(0, 16) : '',
            status: slot.status
          })));
        }
      } catch (error: any) {
        console.error('Error fetching campaign:', error);
        showTikiNotification(error.message || 'Không thể tải chiến dịch', 'Lỗi', 'error');
        navigate('/admin/campaigns');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCampaign();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleBadgeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = FileUploadService.validateFile(file, 5 * 1024 * 1024, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
      if (!validation.isValid) {
        showTikiNotification(validation.error || 'File không hợp lệ', 'Lỗi', 'error');
        return;
      }

      setBadgeImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBadgeImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFlashSlot = () => {
    setFlashSlots(prev => [...prev, { openTime: '', closeTime: '' }]);
  };

  const removeFlashSlot = (index: number) => {
    setFlashSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateFlashSlot = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setFlashSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Validation
    if (!formData.name || !formData.startTime || !formData.endTime) {
      showTikiNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'Lỗi', 'error');
      return;
    }

    if (campaign?.type === 'FAST_SALE' && flashSlots.length === 0) {
      showTikiNotification('Flash Sale cần ít nhất 1 khung giờ', 'Lỗi', 'error');
      return;
    }

    // Validate flash slots
    if (campaign?.type === 'FAST_SALE') {
      for (const slot of flashSlots) {
        if (!slot.openTime || !slot.closeTime) {
          showTikiNotification('Vui lòng điền đầy đủ thời gian cho tất cả khung giờ', 'Lỗi', 'error');
          return;
        }
        if (new Date(slot.openTime) >= new Date(slot.closeTime)) {
          showTikiNotification('Thời gian mở phải nhỏ hơn thời gian đóng', 'Lỗi', 'error');
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      // Upload badge image if changed
      let badgeIconUrl = formData.badgeIconUrl;
      if (badgeImageFile) {
        const uploadResult = await FileUploadService.uploadImage(badgeImageFile, 'Audio/campaigns');
        badgeIconUrl = uploadResult.url;
      }

      // Prepare request data
      const requestData: UpdateCampaignRequest = {
        ...formData,
        badgeIconUrl,
        // Chỉ gửi flashSlots nếu là FAST_SALE
        flashSlots: campaign?.type === 'FAST_SALE' ? flashSlots : undefined
      };

      // Submit
      await CampaignService.updateCampaign(id, requestData);
      
      showTikiNotification('Cập nhật chiến dịch thành công!', 'Thành công', 'success');
      navigate('/admin/campaigns');
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      showTikiNotification(error.message || 'Không thể cập nhật chiến dịch', 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải chiến dịch...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy chiến dịch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/campaigns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa chiến dịch</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            campaign.type === 'MEGA_SALE' 
              ? 'bg-purple-100 text-purple-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {campaign.type === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale'}
          </span>
        </div>
        <p className="text-gray-600 mt-1">Mã: {campaign.code}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chiến dịch *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: Mega Sale 12.12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Mô tả chi tiết về chiến dịch..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowRegistration"
                checked={formData.allowRegistration}
                onChange={handleInputChange}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Cho phép seller đăng ký tham gia</span>
            </label>
          </div>

          {/* Status Update */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="ENDED">Đã kết thúc</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="PENDING">Chờ xử lý</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Khi đổi sang DISABLED: tất cả slot & sản phẩm bị tắt. Khi bật lại ACTIVE: được phục hồi.
            </p>
          </div>
        </div>

        {/* Badge Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thiết lập huy hiệu</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhãn huy hiệu
              </label>
              <input
                type="text"
                name="badgeLabel"
                value={formData.badgeLabel}
                onChange={handleInputChange}
                placeholder="VD: SALE SỐC, GIẢM 50%"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Màu huy hiệu
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="badgeColor"
                  value={formData.badgeColor}
                  onChange={handleInputChange}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.badgeColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon huy hiệu
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="flex flex-col items-center px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Upload icon mới</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBadgeImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {badgeImagePreview && (
                <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                  <img src={badgeImagePreview} alt="Badge preview" className="w-full h-full object-contain bg-gray-50" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thời gian chiến dịch</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Flash Slots (only for FAST_SALE) */}
        {campaign.type === 'FAST_SALE' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Khung giờ Flash Sale</h2>
                <p className="text-sm text-gray-600 mt-1">Có ID: cập nhật slot cũ | Không ID: tạo slot mới</p>
              </div>
              <button
                type="button"
                onClick={addFlashSlot}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm khung giờ
              </button>
            </div>

            {flashSlots.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chưa có khung giờ nào</p>
                <p className="text-sm text-gray-500 mt-1">Thêm ít nhất 1 khung giờ cho Flash Sale</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flashSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian mở {slot.id && <span className="text-xs text-blue-600">(ID: {slot.id.slice(0, 8)}...)</span>}
                        </label>
                        <input
                          type="datetime-local"
                          value={slot.openTime}
                          onChange={(e) => updateFlashSlot(index, 'openTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian đóng {slot.status && <span className="text-xs text-gray-500">({slot.status})</span>}
                        </label>
                        <input
                          type="datetime-local"
                          value={slot.closeTime}
                          onChange={(e) => updateFlashSlot(index, 'closeTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFlashSlot(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa khung giờ"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/campaigns')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật chiến dịch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCampaign;
