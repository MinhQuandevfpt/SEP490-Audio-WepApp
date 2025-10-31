import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Zap, Plus, Trash2, Upload } from 'lucide-react';
import { CampaignService } from '../../../services/admin/CampaignService';
import type { CreateCampaignRequest, FlashSlot } from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';
import { FileUploadService } from '../../../services/FileUploadService';

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState('');

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    code: '',
    name: '',
    description: '',
    campaignType: 'MEGA_SALE',
    badgeLabel: '',
    badgeColor: '#FF6600',
    badgeIconUrl: '',
    allowRegistration: true,
    startTime: '',
    endTime: '',
    flashSlots: []
  });

  const [flashSlots, setFlashSlots] = useState<FlashSlot[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Reset flash slots khi chuyển từ FAST_SALE sang MEGA_SALE
    if (name === 'campaignType' && value === 'MEGA_SALE') {
      setFlashSlots([]);
    }
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

    // Validation
    if (!formData.code || !formData.name || !formData.startTime || !formData.endTime) {
      showTikiNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'Lỗi', 'error');
      return;
    }

    if (formData.campaignType === 'FAST_SALE' && flashSlots.length === 0) {
      showTikiNotification('Flash Sale cần ít nhất 1 khung giờ', 'Lỗi', 'error');
      return;
    }

    // Validate flash slots
    if (formData.campaignType === 'FAST_SALE') {
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
      // Upload badge image if exists
      let badgeIconUrl = formData.badgeIconUrl;
      if (badgeImageFile) {
        const uploadResult = await FileUploadService.uploadImage(badgeImageFile, 'Audio/campaigns');
        badgeIconUrl = uploadResult.url;
      }

      // Prepare request data
      const requestData: CreateCampaignRequest = {
        ...formData,
        badgeIconUrl,
        flashSlots: formData.campaignType === 'FAST_SALE' ? flashSlots : undefined
      };

      // Submit
      await CampaignService.createCampaign(requestData);
      
      showTikiNotification('Tạo chiến dịch thành công!', 'Thành công', 'success');
      navigate('/admin/campaigns');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      showTikiNotification(error.message || 'Không thể tạo chiến dịch', 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Tạo chiến dịch khuyến mãi mới</h1>
        <p className="text-gray-600 mt-1">Tạo chiến dịch Mega Sale hoặc Flash Sale</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Campaign Type Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Loại chiến dịch</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, campaignType: 'MEGA_SALE' }))}
              className={`p-6 rounded-lg border-2 transition-all ${
                formData.campaignType === 'MEGA_SALE'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-300'
              }`}
            >
              <Calendar className="w-12 h-12 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold text-lg mb-1">Mega Sale</h3>
              <p className="text-sm text-gray-600">Chương trình khuyến mãi lớn, không giới hạn khung giờ</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, campaignType: 'FAST_SALE' }))}
              className={`p-6 rounded-lg border-2 transition-all ${
                formData.campaignType === 'FAST_SALE'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-300'
              }`}
            >
              <Zap className="w-12 h-12 mx-auto mb-3 text-orange-600" />
              <h3 className="font-semibold text-lg mb-1">Flash Sale</h3>
              <p className="text-sm text-gray-600">Giảm giá sâu trong các khung giờ cụ thể</p>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã chiến dịch *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="VD: MEGA1212, FLASH1111"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

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
                  <span className="text-sm text-gray-600">Upload icon</span>
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
                  <img src={badgeImagePreview} alt="Badge preview" className="w-full h-full object-contain" />
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
        {formData.campaignType === 'FAST_SALE' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Khung giờ Flash Sale</h2>
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
                          Thời gian mở
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
                          Thời gian đóng
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
            {isLoading ? 'Đang tạo...' : 'Tạo chiến dịch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
