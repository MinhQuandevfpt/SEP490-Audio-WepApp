import React, { useMemo, useState } from 'react';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import { Stepper, SectionCard, TipsPanel, PreviewCard, BasicInfoSection, SpecsSection, MediaUploader, StepActionsBar } from '../../../components/CreateProductForSellerUIComponent';
import type { CategoryKey } from '../../../components/CreateProductForSellerUIComponent';

// Simple audio product types for local state only (will replace with API types later)
interface ProductImage {
  id: string;
  file?: File;
  url: string;
}

interface AudioProductForm {
  name: string;
  brand: string;
  category: 'Headphone' | 'Earbud' | 'Speaker' | 'DAC/Amp' | 'Microphone' | 'Accessory';
  price: string; // keep as string for controlled input
  discountPrice: string;
  stock: string;
  sku: string;
  warrantyMonths: string;
  colors: string;
  connection: 'Wired' | 'Wireless' | 'Both';
  impedance?: string; // ohm
  sensitivity?: string; // dB
  frequencyResponse?: string; // e.g. 20Hz-20kHz
  description: string;
  highlights: string; // comma-delimited list
}

const defaultForm: AudioProductForm = {
  name: '',
  brand: '',
  category: 'Headphone',
  price: '',
  discountPrice: '',
  stock: '0',
  sku: '',
  warrantyMonths: '12',
  colors: '',
  connection: 'Wired',
  impedance: '',
  sensitivity: '',
  frequencyResponse: '',
  description: '',
  highlights: ''
};

const CreateProductPage: React.FC = () => {
  const [form, setForm] = useState<AudioProductForm>(defaultForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0 basic, 1 specs, 2 media, 3 review
  const [extraSpecs, setExtraSpecs] = useState<Record<string, string>>({});
  const colorChips = useMemo(() => form.colors.split(',').map(s => s.trim()).filter(Boolean), [form.colors]);
  const highlightChips = useMemo(() => form.highlights.split(',').map(s => s.trim()).filter(Boolean), [form.highlights]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length >= 3 &&
      form.brand.trim().length >= 2 &&
      !!form.price && !Number.isNaN(Number(form.price)) &&
      Number(form.price) > 0 &&
      images.length > 0
    );
  }, [form, images]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // media handlers handled in MediaUploader via callbacks

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const resetForm = () => {
    setForm(defaultForm);
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
      // Simulate local submit (no API yet)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Preview payload that will be sent to API later
      const payloadPreview = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock || '0'),
        warrantyMonths: Number(form.warrantyMonths || '0'),
        colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
        highlights: form.highlights.split(',').map(s => s.trim()).filter(Boolean),
        imagesCount: images.length,
        extraSpecs
      };
      console.log('CreateProduct payload (preview only):', payloadPreview);

      showCenterSuccess('Tạo sản phẩm nháp thành công (chưa gọi API)', 'Thành công');
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showCenterError('Đã xảy ra lỗi, vui lòng thử lại', 'Lỗi');
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
      if (form.name.trim().length < 3) errs.push('Tên sản phẩm tối thiểu 3 ký tự');
      if (form.brand.trim().length < 2) errs.push('Vui lòng nhập thương hiệu');
      if (!form.price || Number(form.price) <= 0) errs.push('Giá phải lớn hơn 0');
    } else if (s === 1) {
      if (!form.connection) errs.push('Chọn kiểu kết nối');
      if (form.frequencyResponse && !/\d+\s?Hz\s?-\s?\d+\s?k?Hz/i.test(form.frequencyResponse)) {
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

  // Reset extra specs when category changes (step 0 form)
  const handleChangeWithCategory: typeof handleChange = (e) => {
    handleChange(e);
    if (e.target.name === 'category') {
      setExtraSpecs({});
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
        {step === 0 && (<BasicInfoSection values={{ name: form.name, brand: form.brand, category: form.category, price: form.price, discountPrice: form.discountPrice, stock: form.stock, sku: form.sku, warrantyMonths: form.warrantyMonths, colors: form.colors }} onChange={handleChangeWithCategory} />)}

        {step === 1 && (<SpecsSection
          values={{ connection: form.connection, impedance: form.impedance, sensitivity: form.sensitivity, frequencyResponse: form.frequencyResponse, highlights: form.highlights, description: form.description }}
          onChange={handleChange}
          colorChips={colorChips}
          highlightChips={highlightChips}
          category={form.category as CategoryKey}
          extraSpecs={extraSpecs}
          onExtraChange={(key, value) => setExtraSpecs(prev => ({ ...prev, [key]: value }))}
        />)}

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
              { label: 'Tên có độ dài 25–100 ký tự', done: form.name.trim().length >= 25 },
              { label: 'Nhập thương hiệu', done: !!form.brand.trim() },
              { label: 'Thêm ít nhất 3 thuộc tính (màu sắc, kết nối, dải tần...)', done: [form.colors, form.connection, form.frequencyResponse].filter(Boolean).length >= 3 }
            ]}
            tips={[{ title: 'Thương hiệu', content: 'Sản phẩm Mall cần thương hiệu rõ ràng. Nếu không, chọn "No brand".' }]}
          />

          <PreviewCard form={form as any} images={images} />

          <StepActionsBar step={step} total={steps.length} canSubmit={canSubmit} submitting={submitting} onPrev={goPrev} onNext={goNext} />
        </div>
      </form>
    </div>
  );
};

export default CreateProductPage;
