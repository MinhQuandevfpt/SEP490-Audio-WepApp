import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  FileText, 
  CreditCard, 
  Store, 
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  X
} from 'lucide-react';
import { showTikiNotification } from '../../../utils/notification';

interface OnboardingData {
  // Business Information
  storeName: string;
  businessType: string;
  businessRegistration: string;
  taxCode: string;
  address: string;
  
  // Payment Information  
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  
  // Identity Information
  frontIdImage: File | null;
  backIdImage: File | null;
  
  // Agreements
  agreePolicy: boolean;
}

const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    storeName: '',
    businessType: '',
    businessRegistration: '',
    taxCode: '',
    address: '',
    bankName: '',
    bankAccount: '',
    accountHolder: '',
    frontIdImage: null,
    backIdImage: null,
    agreePolicy: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'frontIdImage' | 'backIdImage') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showTikiNotification('Vui lòng chọn file hình ảnh hợp lệ', 'Lỗi', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showTikiNotification('Kích thước file không được vượt quá 5MB', 'Lỗi', 'error');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const removeFile = (field: 'frontIdImage' | 'backIdImage') => {
    setFormData(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.storeName || !formData.businessType || !formData.address) {
          showTikiNotification('Vui lòng điền đầy đủ thông tin kinh doanh', 'Lỗi', 'error');
          return false;
        }
        return true;
      case 2:
        if (!formData.bankName || !formData.bankAccount || !formData.accountHolder) {
          showTikiNotification('Vui lòng điền đầy đủ thông tin thanh toán', 'Lỗi', 'error');
          return false;
        }
        if (!formData.agreePolicy) {
          showTikiNotification('Vui lòng đồng ý với chính sách bán hàng', 'Lỗi', 'error');
          return false;
        }
        return true;
      case 3:
        if (!formData.frontIdImage || !formData.backIdImage) {
          showTikiNotification('Vui lòng tải lên ảnh mặt trước và mặt sau của CCCD/CMND', 'Lỗi', 'error');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 3) {
      handleNext();
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call seller onboarding API
      console.log('Seller onboarding data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showTikiNotification('Thiết lập cửa hàng thành công!', 'Hoàn thành', 'success');
      
      // Redirect to seller dashboard
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      showTikiNotification('Thiết lập thất bại. Vui lòng thử lại!', 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: 1, title: 'Thông tin kinh doanh', icon: Building },
        { step: 2, title: 'Thông tin thanh toán', icon: CreditCard },
        { step: 3, title: 'Thông tin định danh', icon: Camera }
      ].map(({ step, title, icon: Icon }) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all ${
              currentStep >= step 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-lg' 
                : 'border-gray-300 text-gray-400 bg-white'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <Icon className="w-8 h-8" />
              )}
            </div>
            <div className="mt-3 text-center">
              <div className={`text-sm font-semibold ${
                currentStep >= step ? 'text-blue-600' : 'text-gray-400'
              }`}>
                Bước {step}
              </div>
              <div className={`text-xs mt-1 ${
                currentStep >= step ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {title}
              </div>
            </div>
          </div>
          {step < 3 && (
            <div className={`w-24 h-1 mx-6 rounded-full transition-all ${
              currentStep > step ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Thông tin kinh doanh</h3>
        <p className="text-gray-600">Cung cấp thông tin về cửa hàng của bạn</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên cửa hàng *
        </label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="storeName"
            value={formData.storeName}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập tên cửa hàng"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại hình kinh doanh *
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Chọn loại hình kinh doanh</option>
            <option value="individual">Cá nhân</option>
            <option value="company">Công ty</option>
            <option value="partnership">Hộ kinh doanh</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số giấy phép kinh doanh
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="businessRegistration"
            value={formData.businessRegistration}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập số giấy phép (nếu có)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mã số thuế
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="taxCode"
            value={formData.taxCode}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập mã số thuế (nếu có)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Địa chỉ kinh doanh *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Nhập địa chỉ cửa hàng"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Thông tin thanh toán</h3>
        <p className="text-gray-600">Thông tin tài khoản để nhận thanh toán</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên ngân hàng *
        </label>
        <select
          name="bankName"
          value={formData.bankName}
          onChange={handleInputChange}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Chọn ngân hàng</option>
          <option value="vietcombank">Vietcombank</option>
          <option value="techcombank">Techcombank</option>
          <option value="bidv">BIDV</option>
          <option value="vietinbank">VietinBank</option>
          <option value="sacombank">Sacombank</option>
          <option value="acb">ACB</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số tài khoản *
        </label>
        <input
          type="text"
          name="bankAccount"
          value={formData.bankAccount}
          onChange={handleInputChange}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập số tài khoản"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên chủ tài khoản *
        </label>
        <input
          type="text"
          name="accountHolder"
          value={formData.accountHolder}
          onChange={handleInputChange}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập tên chủ tài khoản"
          required
        />
      </div>

      {/* Policy Agreement */}
      <div className="pt-4 border-t border-gray-200">
        <label className="flex items-start">
          <input
            type="checkbox"
            name="agreePolicy"
            checked={formData.agreePolicy}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            required
          />
          <span className="ml-3 text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <a href="/seller/policy" className="text-blue-600 hover:text-blue-700 font-medium">
              Chính sách bán hàng
            </a>{' '}
            và{' '}
            <a href="/seller/fees" className="text-blue-600 hover:text-blue-700 font-medium">
              Chính sách phí
            </a>{' '}
            *
          </span>
        </label>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Thông tin định danh</h3>
        <p className="text-gray-600">Tải lên ảnh CCCD/CMND để xác thực danh tính</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front ID Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh mặt trước CCCD/CMND *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {formData.frontIdImage ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(formData.frontIdImage)}
                  alt="Mặt trước CCCD"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile('frontIdImage')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-600 mt-2">{formData.frontIdImage.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Tải lên ảnh mặt trước</p>
                <p className="text-xs text-gray-500">PNG, JPG tối đa 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'frontIdImage')}
                  className="hidden"
                  id="front-id-upload"
                />
                <label
                  htmlFor="front-id-upload"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Chọn file
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Back ID Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh mặt sau CCCD/CMND *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {formData.backIdImage ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(formData.backIdImage)}
                  alt="Mặt sau CCCD"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile('backIdImage')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-600 mt-2">{formData.backIdImage.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Tải lên ảnh mặt sau</p>
                <p className="text-xs text-gray-500">PNG, JPG tối đa 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'backIdImage')}
                  className="hidden"
                  id="back-id-upload"
                />
                <label
                  htmlFor="back-id-upload"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Chọn file
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Ảnh phải rõ nét, đầy đủ 4 góc của thẻ</li>
                <li>Không bị mờ, nhòe hoặc che khuất</li>
                <li>Thông tin trên thẻ phải đọc được rõ ràng</li>
                <li>Chỉ chấp nhận CCCD hoặc CMND còn hiệu lực</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Thiết lập cửa hàng</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hoàn thành các bước sau để bắt đầu bán hàng trên AudioShop
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          {renderStepIndicator()}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                >
                  <ArrowLeft className="w-5 h-5 mr-3" />
                  Quay lại
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  Tiếp tục
                  <ArrowRight className="w-5 h-5 ml-3" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
                >
                  {isLoading ? 'Đang thiết lập...' : 'Hoàn thành thiết lập'}
                  {!isLoading && <CheckCircle className="w-5 h-5 ml-3" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Skip Option */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="text-gray-500 hover:text-gray-700 text-lg transition-colors"
        >
          Bỏ qua và thiết lập sau
        </button>
      </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;