import React, { useMemo, useState } from 'react';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import { Stepper, SectionCard, TipsPanel, PreviewCard, BasicInfoSection, SpecsSection, MediaUploader, StepActionsBar } from '../../../components/CreateProductForSellerUIComponent';
import type { BasicInfoValues } from '../../../components/CreateProductForSellerUIComponent/BasicInfoSection';
import type { SpecsValues } from '../../../components/CreateProductForSellerUIComponent/SpecsSection';
import { ProductService } from '../../../services/seller/ProductService';
import type { CreateProductRequest } from '../../../services/seller/ProductService';

// Product image interface
interface ProductImage {
  id: string;
  file?: File;
  url: string;
}

// Default form values
const defaultBasicInfo: BasicInfoValues = {
  // Basic info
  name: '',
  brandName: '',
  categoryId: '',
  categoryName: '',
  sku: '',
  shortDescription: '',
  description: '',
  model: '',
  color: '',
  material: '',
  dimensions: '',
  weight: '',
  
  // Pricing
  price: '',
  discountPrice: '',
  currency: 'VND',
  stockQuantity: '0',
  
  // Location & Shipping
  warehouseLocation: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  shippingAddress: '',
  shippingFee: '30000',
  
  // Warranty
  warrantyPeriod: '12 tháng',
  warrantyType: 'Chính hãng',
  
  // Manufacturer
  manufacturerName: '',
  manufacturerAddress: '',
  productCondition: 'Mới 100%',
  isCustomMade: false,
  
  // Video
  videoUrl: ''
};

const defaultSpecs: SpecsValues = {
  // Common audio specs
  frequencyResponse: '',
  sensitivity: '',
  impedance: '',
  powerHandling: '',
  connectionType: '',
  voltageInput: ''
};

const CreateProductPage: React.FC = () => {
  const [basicInfo, setBasicInfo] = useState<BasicInfoValues>(defaultBasicInfo);
  const [specs, setSpecs] = useState<SpecsValues>(defaultSpecs);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0 basic, 1 specs, 2 media, 3 review
  const colorChips = useMemo(() => basicInfo.color.split(',').map((s: string) => s.trim()).filter(Boolean), [basicInfo.color]);

  const canSubmit = useMemo(() => {
    return (
      basicInfo.name.trim().length >= 3 &&
      basicInfo.brandName.trim().length >= 2 &&
      basicInfo.categoryId.trim().length > 0 &&
      !!basicInfo.price && !Number.isNaN(Number(basicInfo.price)) &&
      Number(basicInfo.price) > 0 &&
      basicInfo.sku.trim().length > 0 &&
      basicInfo.shortDescription.trim().length > 0 &&
      images.length > 0
    );
  }, [basicInfo, images]);

  const handleBasicInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setBasicInfo((prev: BasicInfoValues) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSpecsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSpecs((prev: SpecsValues) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // media handlers handled in MediaUploader via callbacks

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const resetForm = () => {
    setBasicInfo(defaultBasicInfo);
    setSpecs(defaultSpecs);
    setImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      showCenterError('Vui lòng điền đầy đủ thông tin bắt buộc và thêm ít nhất 1 ảnh', 'Thiếu thông tin');
      return;
    }

    try {
      setSubmitting(true);

      // Upload images first
      const imageFiles = images.filter(img => img.file).map(img => img.file!);
      const imageUrls = await ProductService.uploadProductImages(imageFiles);

      // Prepare API payload
      const createProductData: CreateProductRequest = {
        // Basic info
        categoryName: basicInfo.categoryName,
        brandName: basicInfo.brandName,
        sku: basicInfo.sku,
        name: basicInfo.name,
        shortDescription: basicInfo.shortDescription,
        description: basicInfo.description,
        model: basicInfo.model,
        color: basicInfo.color,
        material: basicInfo.material,
        dimensions: basicInfo.dimensions,
        weight: parseFloat(basicInfo.weight) || 0,
        
        // Images and video
        images: imageUrls,
        videoUrl: basicInfo.videoUrl || undefined,
        
        // Pricing
        price: parseFloat(basicInfo.price),
        currency: basicInfo.currency,
        stockQuantity: parseInt(basicInfo.stockQuantity) || 0,
        
        // Location & Shipping
        warehouseLocation: basicInfo.warehouseLocation,
        provinceCode: basicInfo.provinceCode,
        districtCode: basicInfo.districtCode,
        wardCode: basicInfo.wardCode,
        shippingAddress: basicInfo.shippingAddress,
        shippingFee: parseFloat(basicInfo.shippingFee) || 0,
        supportedShippingMethodIds: [], // TODO: Add shipping method selection
        
        // Variants and discounts
        variants: [], // TODO: Add variant support
        bulkDiscounts: [], // TODO: Add bulk discount support
        
        // Warranty and manufacturer
        voltageInput: specs.voltageInput || undefined,
        warrantyPeriod: basicInfo.warrantyPeriod,
        warrantyType: basicInfo.warrantyType,
        manufacturerName: basicInfo.manufacturerName,
        manufacturerAddress: basicInfo.manufacturerAddress,
        productCondition: basicInfo.productCondition,
        isCustomMade: basicInfo.isCustomMade,
        
        // Common audio specs
        frequencyResponse: specs.frequencyResponse || undefined,
        sensitivity: specs.sensitivity || undefined,
        impedance: specs.impedance || undefined,
        powerHandling: specs.powerHandling || undefined,
        connectionType: specs.connectionType || undefined,
        
        // Category-specific specs (merge from specs state)
        ...specs
      };

      console.log('Creating product with data:', createProductData);

      // Call API
      const response = await ProductService.createProduct(createProductData);
      
      if (response.status === 200 || response.status === 201) {
        showCenterSuccess(
          `Tạo sản phẩm "${response.data.name}" thành công!`, 
          'Thành công'
        );
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(response.message || 'Tạo sản phẩm thất bại');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      showCenterError(
        err.message || 'Đã xảy ra lỗi khi tạo sản phẩm, vui lòng thử lại', 
        'Lỗi'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { key: 'basic', title: 'Thông tin cơ bản' },
    { key: 'specs', title: 'Thông tin chi tiết' },
    { key: 'media', title: 'Hình ảnh' },
    { key: 'review', title: 'Kiểm duyệt & Lưu' }
  ];

  const validateStep = (s: number): string[] => {
    const errs: string[] = [];
    if (s === 0) {
      if (basicInfo.name.trim().length < 3) errs.push('Tên sản phẩm tối thiểu 3 ký tự');
      if (basicInfo.brandName.trim().length < 2) errs.push('Vui lòng nhập thương hiệu');
      if (!basicInfo.categoryId) errs.push('Vui lòng chọn danh mục');
      if (!basicInfo.sku.trim()) errs.push('Vui lòng nhập SKU');
      if (!basicInfo.shortDescription.trim()) errs.push('Vui lòng nhập mô tả ngắn');
      if (!basicInfo.price || Number(basicInfo.price) <= 0) errs.push('Giá phải lớn hơn 0');
    } else if (s === 1) {
      // Optional validation for specs
      if (specs.frequencyResponse && !/\d+\s?Hz\s?-\s?\d+\s?k?Hz/i.test(specs.frequencyResponse)) {
        errs.push('Dải tần không đúng định dạng (vd: 20Hz-20kHz)');
      }
    } else if (s === 2) {
      if (images.length === 0) errs.push('Cần ít nhất 1 hình ảnh');
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (errs.length > 0) {
      showCenterError(errs[0], 'Thiếu thông tin');
      return;
    }
    setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const goPrev = () => setStep(prev => Math.max(prev - 1, 0));

  // Reset specs when category changes
  const handleBasicInfoChangeWithCategory = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    handleBasicInfoChange(e);
    if (e.target.name === 'categoryId') {
      // Reset specs when category changes
      setSpecs(defaultSpecs);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Thêm sản phẩm âm thanh</h1>
          <p className="text-sm text-indigo-100 mt-1">Tạo sản phẩm mới cho cửa hàng của bạn. API sẽ được tích hợp sau.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 mb-2">
          <Stepper steps={steps} current={step} onStepClick={(i) => setStep(i)} />
        </div>
        {/* Left column wrapper */}
        <div className="lg:col-span-2 space-y-6">
        {step === 0 && (
          <BasicInfoSection 
            values={basicInfo} 
            onChange={handleBasicInfoChangeWithCategory} 
          />
        )}

        {step === 1 && (
          <SpecsSection
            values={specs}
            onChange={handleSpecsChange}
            colorChips={colorChips}
            highlightChips={[]} // TODO: Add highlights support
            categoryName={basicInfo.categoryName}
          />
        )}

        {step === 2 && (<MediaUploader images={images} onFiles={(files) => { const arr = Array.from(files).map((file, idx) => ({ id: `${Date.now()}_${idx}`, file, url: URL.createObjectURL(file) })); if (arr.length) setImages(prev => [...prev, ...arr]); }} onDropFiles={(files) => { const arr = Array.from(files).filter(f => f.type.startsWith('image/')).map((file, idx) => ({ id: `${Date.now()}_${idx}`, file, url: URL.createObjectURL(file) })); if (arr.length) setImages(prev => [...prev, ...arr]); }} onRemove={(id) => removeImage(id)} />)}

        {step === 3 && (
          <SectionCard title="Kiểm duyệt thông tin" description="Rà soát lại trước khi lưu">
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Tên sản phẩm rõ ràng, không chứa ký tự cấm</li>
              <li>Giá và khuyến mãi hợp lệ (không âm, khuyến mãi {'<='} giá)</li>
              <li>Thông số kỹ thuật đúng định dạng (ví dụ dải tần)</li>
              <li>Tối thiểu 1 hình ảnh chất lượng tốt</li>
            </ul>
          </SectionCard>
        )}
        </div>

        {/* Right column: Tips, preview, actions */}
        <div className="space-y-6">
          <TipsPanel
            items={[
              { label: 'Thêm ít nhất 1 hình ảnh', done: images.length > 0 },
              { label: 'Tên có độ dài 3+ ký tự', done: basicInfo.name.trim().length >= 3 },
              { label: 'Nhập thương hiệu', done: !!basicInfo.brandName.trim() },
              { label: 'Chọn danh mục', done: !!basicInfo.categoryId },
              { label: 'Nhập SKU', done: !!basicInfo.sku.trim() },
              { label: 'Nhập mô tả ngắn', done: !!basicInfo.shortDescription.trim() }
            ]}
            tips={[
              { title: 'Thương hiệu', content: 'Sản phẩm cần thương hiệu rõ ràng để tăng độ tin cậy.' },
              { title: 'Danh mục', content: 'Chọn đúng danh mục để hiển thị các thuộc tính phù hợp.' }
            ]}
          />

          <PreviewCard form={basicInfo as any} images={images} />

          <StepActionsBar step={step} total={steps.length} canSubmit={canSubmit} submitting={submitting} onPrev={goPrev} onNext={goNext} />
        </div>
      </form>
    </div>
  );
};

export default CreateProductPage;
