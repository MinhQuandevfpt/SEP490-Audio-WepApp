import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  FileText, 
  CreditCard, 
  Store, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  X,
  Clock
} from 'lucide-react';
import { showTikiNotification } from '../../../utils/notification';
import { KycService } from '../../../services/seller/KycService';
import type { KycRequest } from '../../../types/seller';
import { FileUploadService } from '../../../services/FileUploadService';
import { BankSelector } from '../../../components/common';

interface OnboardingData {
  // Business Information (matching API schema)
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  
  // Payment Information (matching API schema)
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  
  // Identity Information
  frontIdImage: File | null;
  backIdImage: File | null;
  businessLicenseImage: File | null;
  
  // Official status
  isOfficial: boolean;
}

const SellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [licenseWarning, setLicenseWarning] = useState<string>('');
  
  const [formData, setFormData] = useState<OnboardingData>({
    storeName: '',
    phoneNumber: '',
    businessLicenseNumber: '',
    taxCode: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    frontIdImage: null,
    backIdImage: null,
    businessLicenseImage: null,
    isOfficial: false,
  });

  // Guard to prevent accidental submit when transitioning steps
  const ignoreNextSubmitRef = React.useRef(false);

  // Clear errors when step changes
  React.useEffect(() => {
    setErrors({});
  }, [currentStep]);

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  // Helper function to clear error when user starts typing
  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Handle business license number blur - check if it exists
  const handleBusinessLicenseBlur = async () => {
    const licenseNumber = formData.businessLicenseNumber.trim();
    
    // Clear previous warning
    setLicenseWarning('');
    
    // Don't check if empty (will be validated on submit)
    if (!licenseNumber) {
      return;
    }

    try {
      const isDuplicate = await KycService.checkBusinessLicense(licenseNumber);
      
      if (isDuplicate) {
        setLicenseWarning('Số giấy phép kinh doanh này đã được đăng ký. Bạn vẫn có thể tiếp tục nhưng vui lòng kiểm tra lại.');
      }
    } catch (error) {
      console.error('Error checking business license:', error);
      // Don't show error to user, just log it
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Validate numeric fields - only allow numbers
    const numericFields = ['phoneNumber', 'businessLicenseNumber', 'taxCode', 'bankAccountNumber'];
    if (numericFields.includes(name) && typeof newValue === 'string') {
      // Only allow digits
      if (newValue !== '' && !/^\d+$/.test(newValue)) {
        return; // Don't update if it contains non-numeric characters
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    clearError(name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'frontIdImage' | 'backIdImage' | 'businessLicenseImage') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file using FileUploadService
      let allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      let maxSize = 10 * 1024 * 1024; // 10MB
      
      if (field === 'businessLicenseImage') {
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      }

      const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
      
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [field]: validation.error || 'File không hợp lệ' }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));

      // Clear error when user uploads file
      clearError(field);
    }
  };

  const removeFile = (field: 'frontIdImage' | 'backIdImage' | 'businessLicenseImage') => {
    setFormData(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const validateCurrentStep = (stepToValidate = currentStep, forceValidate = false): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (stepToValidate) {
      case 1:
        if (!formData.storeName.trim()) {
          newErrors.storeName = 'Vui lòng nhập tên cửa hàng';
        }
        if (!formData.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!validatePhoneNumber(formData.phoneNumber)) {
          newErrors.phoneNumber = 'Số điện thoại không đúng định dạng';
        }
        if (!formData.businessLicenseNumber.trim()) {
          newErrors.businessLicenseNumber = 'Vui lòng nhập số giấy phép kinh doanh';
        }
        if (!formData.taxCode.trim()) {
          newErrors.taxCode = 'Vui lòng nhập mã số thuế';
        }
        break;
      case 2:
        if (!formData.bankName) {
          newErrors.bankName = 'Vui lòng chọn ngân hàng';
        }
        if (!formData.bankAccountNumber.trim()) {
          newErrors.bankAccountNumber = 'Vui lòng nhập số tài khoản';
        } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
          newErrors.bankAccountNumber = 'Số tài khoản chỉ được chứa số';
        }
        if (!formData.bankAccountName.trim()) {
          newErrors.bankAccountName = 'Vui lòng nhập tên chủ tài khoản';
        }
        break;
      case 3:
        // Only validate step 3 when explicitly requested (when user clicks submit)
        if (forceValidate) {
          if (!formData.frontIdImage) {
            newErrors.frontIdImage = 'Vui lòng tải lên ảnh mặt trước Căn cước/CCCD';
          }
          if (!formData.backIdImage) {
            newErrors.backIdImage = 'Vui lòng tải lên ảnh mặt sau Căn cước/CCCD';
          }
          if (!formData.businessLicenseImage) {
            newErrors.businessLicenseImage = 'Vui lòng tải lên giấy phép kinh doanh';
          }
          
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      // Prevent accidental submit caused by button type switching during the same click
      ignoreNextSubmitRef.current = true;

      // Blur the active element to avoid click carryover
      (document.activeElement as HTMLElement | null)?.blur?.();

      // Defer step change to next tick so the original click finishes first
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        ignoreNextSubmitRef.current = false;
      }, 0);
    }
  };

  const handlePrev = () => {
    // Just move to previous step, errors will be cleared by useEffect
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If this submit was triggered by the same click that advanced steps, ignore it
    if (ignoreNextSubmitRef.current) {
      return;
    }
    
    // Validate step 3 with force flag set to true
    if (!validateCurrentStep(3, true)) {
      return;
    }

    // If validation passes, submit the form
    setIsLoading(true);

    try {
      // Upload all files in parallel for better performance (2-3s instead of 6-9s)
      const uploadPromises = [];
      
      if (formData.frontIdImage) {
        uploadPromises.push(FileUploadService.uploadImage(formData.frontIdImage, 'Audio/kyc'));
      } else {
        uploadPromises.push(Promise.resolve({ url: '' }));
      }
      
      if (formData.backIdImage) {
        uploadPromises.push(FileUploadService.uploadImage(formData.backIdImage, 'Audio/kyc'));
      } else {
        uploadPromises.push(Promise.resolve({ url: '' }));
      }
      
      if (formData.businessLicenseImage) {
        uploadPromises.push(FileUploadService.uploadImage(formData.businessLicenseImage, 'Audio/kyc'));
      } else {
        uploadPromises.push(Promise.resolve({ url: '' }));
      }

      // Wait for all uploads to complete in parallel
      const [frontResult, backResult, businessResult] = await Promise.all(uploadPromises);
      
      const idCardFrontUrl = frontResult.url;
      const idCardBackUrl = backResult.url;
      const businessLicenseUrl = businessResult.url;

      // Prepare KYC data
      const kycData: KycRequest = {
        storeName: formData.storeName,
        phoneNumber: formData.phoneNumber,
        businessLicenseNumber: formData.businessLicenseNumber,
        taxCode: formData.taxCode,
        bankName: formData.bankName,
        bankAccountName: formData.bankAccountName,
        bankAccountNumber: formData.bankAccountNumber,
        idCardFrontUrl,
        idCardBackUrl,
        businessLicenseUrl,
        isOfficial: formData.isOfficial,
      };

      // Submit KYC request
      await KycService.submitKyc(kycData);
      
      // Show success notification
      showTikiNotification(
        'Gửi yêu cầu xác minh thành công! Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.',
        'Thành công',
        'success'
      );
      
      // Redirect to KYC status page to prevent form resubmission on refresh
      navigate('/seller/kyc-status', { replace: true });
      
    } catch (error: any) {
      console.error('KYC submission failed:', error);
      
      let errorMessage = 'Gửi yêu cầu thất bại. Vui lòng thử lại!';
      
      // Handle specific upload errors
      if (error.message?.includes('upload') || error.message?.includes('Cloudinary')) {
        errorMessage = 'Lỗi tải file lên. Vui lòng kiểm tra kết nối mạng và thử lại!';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
      }
      
      showTikiNotification(
        error.message || errorMessage, 
        'Lỗi', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: 1, title: 'Thông tin kinh doanh', icon: Building },
        { step: 2, title: 'Thông tin thanh toán', icon: CreditCard },
        { step: 3, title: 'Thông tin định danh', icon: Camera },
        { step: 4, title: 'Hoàn tất', icon: CheckCircle }
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
          {step < 4 && (
            <div className={`w-24 h-1 mx-6 rounded-full transition-all ${
              currentStep > step ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Component to render error message
  const ErrorMessage = ({ fieldName }: { fieldName: string }) => {
    if (!errors[fieldName]) return null;
    return (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[fieldName]}
      </p>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Thông tin kinh doanh</h3>
        <p className="text-gray-600">Cung cấp thông tin về cửa hàng của bạn</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Tên cửa hàng
        </label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="storeName"
            value={formData.storeName}
            onChange={handleInputChange}
            onBlur={() => {
              if (!formData.storeName.trim()) {
                setErrors(prev => ({ ...prev, storeName: 'Vui lòng nhập tên cửa hàng' }));
              }
            }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.storeName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tên cửa hàng"
            required
          />
        </div>
        <ErrorMessage fieldName="storeName" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Số điện thoại
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onBlur={() => {
              if (!formData.phoneNumber.trim()) {
                setErrors(prev => ({ ...prev, phoneNumber: 'Vui lòng nhập số điện thoại' }));
              } else if (!validatePhoneNumber(formData.phoneNumber)) {
                setErrors(prev => ({ ...prev, phoneNumber: 'Số điện thoại không đúng định dạng' }));
              }
            }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập số điện thoại (VD: 0987654321)"
            maxLength={11}
            required
          />
        </div>
        <ErrorMessage fieldName="phoneNumber" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Số giấy phép kinh doanh
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="businessLicenseNumber"
            value={formData.businessLicenseNumber}
            onChange={handleInputChange}
            onBlur={handleBusinessLicenseBlur}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.businessLicenseNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập số giấy phép kinh doanh"
            required
          />
        </div>
        <ErrorMessage fieldName="businessLicenseNumber" />
        {licenseWarning && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">{licenseWarning}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Mã số thuế
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="taxCode"
            value={formData.taxCode}
            onChange={handleInputChange}
            onBlur={() => {
              if (!formData.taxCode.trim()) {
                setErrors(prev => ({ ...prev, taxCode: 'Vui lòng nhập mã số thuế' }));
              }
            }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.taxCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập mã số thuế"
            maxLength={13}
            required
          />
        </div>
        <ErrorMessage fieldName="taxCode" />
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
          <span className="text-red-500">* </span>Tên ngân hàng
        </label>
        <BankSelector
          value={formData.bankName}
          onChange={(_bankCode, bankName) => {
            setFormData(prev => ({
              ...prev,
              bankName: bankName
            }));
            clearError('bankName');
          }}
          error={errors.bankName}
        />
        <ErrorMessage fieldName="bankName" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Số tài khoản
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          name="bankAccountNumber"
          value={formData.bankAccountNumber}
          onChange={handleInputChange}
          onBlur={() => {
            if (!formData.bankAccountNumber.trim()) {
              setErrors(prev => ({ ...prev, bankAccountNumber: 'Vui lòng nhập số tài khoản' }));
            } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
              setErrors(prev => ({ ...prev, bankAccountNumber: 'Số tài khoản chỉ được chứa số' }));
            }
          }}
          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.bankAccountNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nhập số tài khoản"
          maxLength={20}
          required
        />
        <ErrorMessage fieldName="bankAccountNumber" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">* </span>Tên chủ tài khoản
        </label>
        <input
          type="text"
          name="bankAccountName"
          value={formData.bankAccountName}
          onChange={handleInputChange}
          onBlur={() => {
            if (!formData.bankAccountName.trim()) {
              setErrors(prev => ({ ...prev, bankAccountName: 'Vui lòng nhập tên chủ tài khoản' }));
            }
          }}
          className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.bankAccountName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nhập tên chủ tài khoản"
          required
        />
        <ErrorMessage fieldName="bankAccountName" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Thông tin định danh</h3>
        <p className="text-gray-600">Tải lên ảnh Căn cước/CCCD để xác thực danh tính</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Front ID Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>Ảnh mặt trước Căn cước/CCCD
          </label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors ${
            errors.frontIdImage ? 'border-red-500' : 'border-gray-300'
          }`}>
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
                <p className="text-xs text-gray-500">PNG, JPG, WEBP tối đa 10MB</p>
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
          <ErrorMessage fieldName="frontIdImage" />
        </div>

        {/* Back ID Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>Ảnh mặt sau Căn cước/CCCD
          </label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors ${
            errors.backIdImage ? 'border-red-500' : 'border-gray-300'
          }`}>
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
                <p className="text-xs text-gray-500">PNG, JPG, WEBP tối đa 10MB</p>
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
          <ErrorMessage fieldName="backIdImage" />
        </div>

        {/* Business License Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>Giấy phép kinh doanh
          </label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors ${
            errors.businessLicenseImage ? 'border-red-500' : 'border-gray-300'
          }`}>
            {formData.businessLicenseImage ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(formData.businessLicenseImage)}
                  alt="Giấy phép kinh doanh"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile('businessLicenseImage')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-600 mt-2">{formData.businessLicenseImage.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Tải lên giấy phép</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP, PDF tối đa 10MB</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'businessLicenseImage')}
                  className="hidden"
                  id="business-license-upload"
                />
                <label
                  htmlFor="business-license-upload"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Chọn file
                </label>
              </div>
            )}
          </div>
          <ErrorMessage fieldName="businessLicenseImage" />
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
                <li>Chỉ chấp nhận Căn cước/CCCD còn hiệu lực</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Đã gửi yêu cầu thành công!</h3>
        <p className="text-lg text-gray-600 mb-6">
          Yêu cầu xác minh của bạn đã được gửi đến hệ thống.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-blue-600 mr-3" />
          <h4 className="text-xl font-semibold text-blue-800">Đang chờ xét duyệt</h4>
        </div>
        <p className="text-blue-700 mb-4">
          Hệ thống sẽ xét duyệt yêu cầu của bạn trong vòng <strong>1-3 ngày làm việc</strong>.
        </p>
        <p className="text-sm text-blue-600">
          Bạn sẽ nhận được thông báo qua email khi có kết quả xét duyệt.
        </p>
      </div>

      {/* Removed the submitted info preview as requested */}

      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate('/seller/kyc-status')}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
        >
          Xem trạng thái KYC
        </button>
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
              {currentStep === 4 && renderStep4()}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
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
                      {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
                      {!isLoading && <CheckCircle className="w-5 h-5 ml-3" />}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;