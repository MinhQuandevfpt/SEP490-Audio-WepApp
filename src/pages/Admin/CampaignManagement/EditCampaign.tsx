import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, Plus, Trash2, Upload, Loader } from 'lucide-react';
import { CampaignService } from '../../../services/admin/CampaignService';
import type { UpdateCampaignRequest, Campaign, FlashSlot } from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';
import { FileUploadService } from '../../../services/FileUploadService';
import { validateCampaignTimes, validateFlashSlots, hasCampaignStarted, getMinDateTime } from '../../../utils/campaignValidation';

const EditCampaign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState('');

  // Get minimum datetime for preventing past selection
  const minDateTime = useMemo(() => getMinDateTime(), []);
  
  // Validation errors
  const [timeErrors, setTimeErrors] = useState({
    startTime: '',
    endTime: ''
  });

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

  const [flashSlots, setFlashSlots] = useState<FlashSlot[]>([]);

  const campaignHasStarted = Boolean(campaign?.startTime && hasCampaignStarted(campaign.startTime));

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
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 19) : '',
          endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 19) : '',
          status: data.status
        });

        // Set badge preview if exists
        if (data.badgeIconUrl) {
          setBadgeImagePreview(data.badgeIconUrl);
        }

        // Populate flash slots if FAST_SALE
        if (data.type === 'FAST_SALE' && data.flashSlots) {
          setFlashSlots(data.flashSlots.map(slot => ({
            slotId: slot.slotId,
            openTime: slot.openTime ? new Date(slot.openTime).toISOString().slice(0, 19) : '',
            closeTime: slot.closeTime ? new Date(slot.closeTime).toISOString().slice(0, 19) : '',
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

    // Validate time fields in real-time (only if campaign hasn't started)
    if ((name === 'startTime' || name === 'endTime') && campaign && !campaignHasStarted) {
      validateTimeFields(name, value);
    }
  };

  const validateTimeFields = (fieldName: string, value: string) => {
    const newErrors = { ...timeErrors };
    
    if (fieldName === 'startTime') {
      const start = new Date(value);
      const now = new Date();
      
      if (value && start < now) {
        newErrors.startTime = 'Không thể chọn thời gian trong quá khứ';
      } else {
        newErrors.startTime = '';
      }
      
      // Also validate endTime if it exists
      if (formData.endTime) {
        const end = new Date(formData.endTime);
        if (value && end <= start) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          newErrors.endTime = '';
        }
      }
    }
    
    if (fieldName === 'endTime') {
      const end = new Date(value);
      
      if (formData.startTime) {
        const start = new Date(formData.startTime);
        if (value && end <= start) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        } else {
          newErrors.endTime = '';
        }
      }
    }
    
    setTimeErrors(newErrors);
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

  // Check if a slot overlaps with any other slot
  const checkSlotOverlap = (currentIndex: number, openTime: string, closeTime: string): string | null => {
    if (!openTime || !closeTime) return null;
    
    const currentOpen = new Date(openTime);
    const currentClose = new Date(closeTime);
    
    // Validate within campaign time
    if (formData.startTime) {
      const campaignStart = new Date(formData.startTime);
      if (currentOpen < campaignStart) {
        return 'Khung giờ bắt đầu trước thời gian chiến dịch';
      }
    }
    
    if (formData.endTime) {
      const campaignEnd = new Date(formData.endTime);
      if (currentClose > campaignEnd) {
        return 'Khung giờ kết thúc sau thời gian chiến dịch';
      }
    }
    
    // Check if openTime < closeTime
    if (currentOpen >= currentClose) {
      return 'Thời gian mở phải nhỏ hơn thời gian đóng';
    }
    
    // Check overlap with other slots
    for (let i = 0; i < flashSlots.length; i++) {
      if (i === currentIndex) continue;
      
      const slot = flashSlots[i];
      if (!slot.openTime || !slot.closeTime) continue;
      
      const slotOpen = new Date(slot.openTime);
      const slotClose = new Date(slot.closeTime);
      
      // Check if slots overlap
      const overlaps = (currentOpen < slotClose && currentClose > slotOpen);
      
      if (overlaps) {
        return `Khung giờ bị trùng với khung giờ ${i + 1}`;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Basic validation
    if (!formData.name || !formData.startTime || !formData.endTime) {
      showTikiNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'Lỗi', 'error');
      return;
    }

    // Validate campaign times (Rule 1, 3)
    const timeValidation = validateCampaignTimes(
      formData.startTime,
      formData.endTime,
      true, // isEdit = true
      campaign?.startTime,
      campaign?.status
    );

    if (!timeValidation.isValid) {
      showTikiNotification(timeValidation.error || 'Thời gian không hợp lệ', 'Lỗi', 'error');
      return;
    }

    // Validate flash slots for FAST_SALE (Rule 3, 4)
    if (campaign?.type === 'FAST_SALE') {
      if (flashSlots.length === 0) {
        showTikiNotification('Flash Sale cần ít nhất 1 khung giờ', 'Lỗi', 'error');
        return;
      }

      const slotsValidation = validateFlashSlots(
        flashSlots,
        formData.startTime,
        formData.endTime,
        true, // isEdit = true
        campaign?.status
      );

      if (!slotsValidation.isValid) {
        showTikiNotification(slotsValidation.error || 'Khung giờ không hợp lệ', 'Lỗi', 'error');
        return;
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
        flashSlots:
          campaign?.type === 'FAST_SALE'
            ? flashSlots.map((slot) => ({
                id: slot.slotId,
                openTime: slot.openTime,
                closeTime: slot.closeTime,
                status: slot.status,
              }))
            : undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại danh sách</span>
          </button>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900">Chỉnh sửa chiến dịch</h1>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                campaign.type === 'MEGA_SALE' 
                  ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700'
                  : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700'
              }`}>
                {campaign.type === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale'}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              <span className="font-semibold">Mã:</span> {campaign.code}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Thông tin cơ bản</h2>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên chiến dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: Mega Sale 12.12"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Mô tả chi tiết về chiến dịch..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
            />
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Cho phép đăng ký</h3>
                <p className="text-xs text-gray-600 mt-1">Seller có thể đăng ký tham gia chiến dịch này</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, allowRegistration: !prev.allowRegistration }))}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  formData.allowRegistration ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                    formData.allowRegistration ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status Update */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="ENDED">Đã kết thúc</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="PENDING">Chờ xử lý</option>
            </select>
            <p className="text-xs text-amber-600 mt-2 flex items-start gap-2 bg-amber-50 p-3 rounded-lg">
              <span className="text-amber-500 font-bold">⚠️</span>
              <span>Khi đổi sang DISABLED: tất cả slot & sản phẩm bị tắt. Khi bật lại ACTIVE: được phục hồi.</span>
            </p>
          </div>
        </div>

        {/* Badge Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Thiết lập huy hiệu</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nhãn huy hiệu
              </label>
              <input
                type="text"
                name="badgeLabel"
                value={formData.badgeLabel}
                onChange={handleInputChange}
                placeholder="VD: SALE SỐC, GIẢM 50%"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Màu huy hiệu
              </label>
              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="color"
                    name="badgeColor"
                    value={formData.badgeColor}
                    onChange={handleInputChange}
                    className="w-14 h-11 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={formData.badgeColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono"
                  placeholder="#FF6600"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Icon huy hiệu
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all group">
                  <Upload className="w-12 h-12 text-gray-400 mb-3 group-hover:text-orange-500 transition-colors" />
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">Nhấn để tải icon mới</span>
                  <span className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP (tối đa 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBadgeImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {badgeImagePreview && (
                <div className="flex items-center justify-center">
                  <div className="w-full h-full min-h-[180px] border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <img src={badgeImagePreview} alt="Badge preview" className="w-full h-full object-contain p-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Thời gian chiến dịch</h2>
          
          {/* Warning if campaign has started */}
          {campaignHasStarted && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Chiến dịch đã bắt đầu</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Không thể thay đổi thời gian bắt đầu, kết thúc và khung giờ của chiến dịch đã bắt đầu hoặc kết thúc
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                step="1"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                min={campaignHasStarted ? undefined : minDateTime}
                disabled={campaignHasStarted}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-all ${
                  timeErrors.startTime ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`}
                required
              />
              {timeErrors.startTime && (
                <p className="text-red-500 text-xs mt-1">{timeErrors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                step="1"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                min={campaignHasStarted ? undefined : (formData.startTime || minDateTime)}
                disabled={campaignHasStarted}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-all ${
                  timeErrors.endTime ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`}
                required
              />
              {timeErrors.endTime && (
                <p className="text-red-500 text-xs mt-1">{timeErrors.endTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* Flash Slots (only for FAST_SALE) */}
        {campaign.type === 'FAST_SALE' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Khung giờ Flash Sale</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="text-blue-600 font-semibold">Có ID:</span> cập nhật slot cũ • 
                  <span className="text-green-600 font-semibold ml-1">Không ID:</span> tạo slot mới
                </p>
              </div>
              <button
                type="button"
                onClick={addFlashSlot}
                disabled={campaignHasStarted}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Thêm khung giờ</span>
              </button>
            </div>

            {flashSlots.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-10 h-10 text-orange-500" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">Chưa có khung giờ nào</p>
                <p className="text-sm text-gray-500">Thêm ít nhất 1 khung giờ cho Flash Sale</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flashSlots.map((slot, index) => {
                  const isLocked = campaignHasStarted;
                  const slotError = !isLocked && slot.openTime && slot.closeTime 
                    ? checkSlotOverlap(index, slot.openTime, slot.closeTime)
                    : null;
                  
                  return (
                    <div key={index} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 hover:from-orange-50 hover:to-orange-100 border border-gray-200 hover:border-orange-300 rounded-xl p-6 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thời gian mở
                                {slot.slotId && (
                                  <span className="ml-2 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    ID: {slot.slotId.slice(0, 8)}...
                                  </span>
                                )}
                              </label>
                              <input
                                type="datetime-local"
                                step="1"
                                value={slot.openTime}
                                onChange={(e) => updateFlashSlot(index, 'openTime', e.target.value)}
                                min={isLocked ? undefined : (formData.startTime || minDateTime)}
                                max={isLocked ? undefined : formData.endTime}
                                disabled={isLocked}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-all bg-white ${
                                  slotError ? 'border-red-500' : 'border-gray-300'
                                } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thời gian đóng
                                {slot.status && (
                                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${
                                    slot.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-700'
                                      : slot.status === 'ENDED'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {slot.status === 'ACTIVE'
                                      ? 'Đang chạy'
                                      : slot.status === 'ENDED'
                                      ? 'Đã kết thúc'
                                      : 'Chờ bắt đầu'}
                                </span>
                              )}
                            </label>
                            <input
                              type="datetime-local"
                              step="1"
                              value={slot.closeTime}
                              onChange={(e) => updateFlashSlot(index, 'closeTime', e.target.value)}
                              min={isLocked ? undefined : (slot.openTime || formData.startTime || minDateTime)}
                              max={isLocked ? undefined : formData.endTime}
                              disabled={isLocked}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-all bg-white ${
                                slotError ? 'border-red-500' : 'border-gray-300'
                              } disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`}
                            />
                          </div>
                          {slotError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-600 text-xs font-medium">⚠️ {slotError}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFlashSlot(index)}
                        disabled={isLocked}
                        className="flex-shrink-0 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isLocked ? "Không thể xóa khung giờ khi chiến dịch đã bắt đầu" : "Xóa khung giờ"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/campaigns')}
              className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang cập nhật...
                </span>
              ) : (
                'Cập nhật chiến dịch'
              )}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default EditCampaign;
