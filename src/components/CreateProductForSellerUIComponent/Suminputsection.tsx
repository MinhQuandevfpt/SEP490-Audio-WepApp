import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import SectionCard from './SectionCard';
import { TinyMCEEditor } from '../common';
import { CategoryService } from '../../services/seller/CategoryService';
import { ShippingService } from '../../services/seller/ShippingService';
import { FileUploadService } from '../../services/FileUploadService';
import { ProductService } from '../../services/seller/ProductService';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';
import type { Category, ShippingMethod, Province, District, Ward } from '../../types/seller';
import { CATEGORY_SPECS, type CategoryKey } from './CategorySpecsSchema';
import { showCenterError, showCenterSuccess } from '../../utils/notification';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ProductImage = { id: string; url: string; file?: File };

interface FormState {
  // Basic
  name: string;
  brandName: string;
  category: string;
  shortDescription: string;
  description: string;
  model: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  connectionType: string;
  voltageInput: string;
  // Pricing & stock
  price: string;
  discountPrice: string;
  currency: string;
  stockQuantity: string;
  sku: string;
  // Warranty & manufacturer
  warrantyPeriod: string;
  warrantyType: string;
  manufacturerName: string;
  manufacturerAddress: string;
  productCondition: string;
  isCustomMade: string; // 'true' | 'false'
  // Warehouse & shipping
  warehouseLocation: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  shippingAddress: string;
  shippingFee: string;
  selectedShippingMethodIds: string[];
  // Media
  videoUrl: string;
  // Specs
  highlights: string;
}

// ============================================================================
// CONSTANTS & DEFAULT VALUES
// ============================================================================

const defaultForm: FormState = {
  name: '',
  brandName: '',
  category: '',
  shortDescription: '',
  description: '',
  model: '',
  color: '',
  material: '',
  dimensions: '',
  weight: '',
  connectionType: '',
  voltageInput: '',
  price: '',
  discountPrice: '',
  currency: 'VND',
  stockQuantity: '0',
  sku: '',
  warrantyPeriod: '12 tháng',
  warrantyType: '',
  manufacturerName: '',
  manufacturerAddress: '',
  productCondition: '',
  isCustomMade: 'false',
  warehouseLocation: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  shippingAddress: '',
  shippingFee: '',
  selectedShippingMethodIds: [],
  videoUrl: '',
  highlights: '',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Format numbers with dot thousands separators
const formatNumber = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseFormattedNumber = (formattedValue: string): string => formattedValue.replace(/\./g, '');

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Suminputsection: React.FC = () => {
  const navigate = useNavigate();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Form state
  const [form, setForm] = useState<FormState>(defaultForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [extraSpecs, setExtraSpecs] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<Array<{ 
    optionName: string; 
    optionValue: string; 
    variantPrice: string;
    variantStock: string;
    variantSku: string;
  }>>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<Array<{ fromQuantity: string; toQuantity: string; unitPrice: string }>>([]);
  
  // UI state
  const [imageUrl, setImageUrl] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showContentCheck, setShowContentCheck] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data loading state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  
  // ============================================================================
  // LOCATION STATE MANAGEMENT (Province/District/Ward)
  // ============================================================================
  
  // Province-related states
  const { provinces, loading: provincesLoading, error: provincesError, refetch: refetchProvinces } = useProvinces();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');
  
  // District-related states
  const provinceId = selectedProvince ? selectedProvince.ProvinceID : null;
  const { districts, loading: districtsLoading, error: districtsError, refetch: refetchDistricts } = useDistricts(provinceId);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  
  // Ward-related states
  const districtId = selectedDistrict ? selectedDistrict.DistrictID : null;
  const { wards, loading: wardsLoading, error: wardsError, refetch: refetchWards } = useWards(districtId);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const [wardSearchQuery, setWardSearchQuery] = useState('');

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  // Content check validation
  const contentCheck = useMemo(() => {
    const checks = {
      basic: {
        name: (form.name || '').trim().length >= 3,
        brandName: (form.brandName || '').trim().length >= 2,
        category: (form.category || '').trim().length > 0,
        shortDescription: (form.shortDescription || '').trim().length > 0,
      },
      pricing: {
        price: !!form.price && !Number.isNaN(Number(form.price)) && Number(form.price) > 0,
        sku: (form.sku || '').trim().length > 0,
        stockQuantity: !!form.stockQuantity && !Number.isNaN(Number(form.stockQuantity)) && Number(form.stockQuantity) >= 0,
        province: (form.provinceCode || '').trim().length > 0,
        district: (form.districtCode || '').trim().length > 0,
        ward: (form.wardCode || '').trim().length > 0,
      },
      media: {
        images: images.length > 0 || (imageUrl || '').trim().length > 0,
      },
      optional: {
        description: (form.description || '').trim().length > 0,
        model: (form.model || '').trim().length > 0,
        color: (form.color || '').trim().length > 0,
        material: (form.material || '').trim().length > 0,
        dimensions: (form.dimensions || '').trim().length > 0,
        weight: (form.weight || '').trim().length > 0,
        connectionType: (form.connectionType || '').trim().length > 0,
        voltageInput: (form.voltageInput || '').trim().length > 0,
      }
    };
    
    const basicComplete = Object.values(checks.basic).every(Boolean);
    const pricingComplete = Object.values(checks.pricing).every(Boolean);
    const mediaComplete = Object.values(checks.media).every(Boolean);
    const optionalCount = Object.values(checks.optional).filter(Boolean).length;
    
    return {
      checks,
      basicComplete,
      pricingComplete,
      mediaComplete,
      optionalCount,
      totalOptional: Object.keys(checks.optional).length,
      canSubmit: basicComplete && pricingComplete && mediaComplete
    };
  }, [form, images, imageUrl]);

  // ============================================================================
  // EFFECTS & DATA LOADING
  // ============================================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setCategoriesLoading(true);
        setShippingLoading(true);
        const [catRes, shipRes] = await Promise.all([
          CategoryService.getCategories(),
          ShippingService.getShippingMethods()
        ]);
        setCategories(catRes.data || []);
        setShippingMethods(shipRes.data || []);
      } catch (e) {
        showCenterError('Không thể tải danh mục hoặc phương thức vận chuyển');
      } finally {
        setCategoriesLoading(false);
        setShippingLoading(false);
      }
    };
    loadData();
  }, []);

  // Reload shipping methods without showing success popup
  const reloadShippingMethods = async () => {
    try {
      setShippingLoading(true);
      const shipRes = await ShippingService.getShippingMethods();
      setShippingMethods(shipRes.data || []);
      // Không hiển thị popup khi reload thành công
    } catch (e) {
      showCenterError('Không thể tải lại phương thức vận chuyển');
    } finally {
      setShippingLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showProvinceDropdown && !target.closest('.province-dropdown-container')) {
        setShowProvinceDropdown(false);
        setProvinceSearchQuery('');
      }
      
      if (showDistrictDropdown && !target.closest('.district-dropdown-container')) {
        setShowDistrictDropdown(false);
        setDistrictSearchQuery('');
      }
      
      if (showWardDropdown && !target.closest('.ward-dropdown-container')) {
        setShowWardDropdown(false);
        setWardSearchQuery('');
      }
    };

    if (showProvinceDropdown || showDistrictDropdown || showWardDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProvinceDropdown, showDistrictDropdown, showWardDropdown]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const canSubmit = useMemo(() => {
    return (
      (form.name || '').trim().length >= 3 &&
      (form.brandName || '').trim().length >= 2 &&
      (form.category || '').trim().length > 0 &&
      (form.shortDescription || '').trim().length > 0 &&
      !!form.price && !Number.isNaN(Number(form.price)) &&
      Number(form.price) > 0 &&
      (form.sku || '').trim().length > 0 &&
      images.length > 0 &&
      (form.provinceCode || '').trim().length > 0 &&
      (form.districtCode || '').trim().length > 0 &&
      (form.wardCode || '').trim().length > 0
    );
  }, [form, images]);

  // Draft flow removed per requirement

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked.toString() }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'category') setExtraSpecs({});
  };

  const onSelectShipping = (shippingMethodId: string) => {
    setForm(prev => {
      const isSelected = prev.selectedShippingMethodIds.includes(shippingMethodId);
      const next = isSelected
        ? prev.selectedShippingMethodIds.filter(id => id !== shippingMethodId)
        : [...prev.selectedShippingMethodIds, shippingMethodId];
      return { ...prev, selectedShippingMethodIds: next };
    });
  };

  // ==========================================================================
  // DIMENSIONS HELPERS (Length x Width x Height) in mm -> form.dimensions
  // ==========================================================================
  const getDimensionParts = useMemo(() => {
    // Extract numbers from a string like "200 x 150 x 80 mm" or any similar
    const raw = (form.dimensions || '').toLowerCase();
    const digits = raw
      .replace(/cm/g, '')
      .replace(/mm/g, '')
      .replace(/[^0-9x ]/g, '')
      .trim();
    const parts = digits.split('x').map(p => p.trim()).filter(Boolean);
    const [l = '', w = '', h = ''] = parts;
    return { l, w, h };
  }, [form.dimensions]);

  const setDimensionPart = (part: 'l' | 'w' | 'h', value: string) => {
    // Keep only digits
    const val = (value || '').replace(/\D/g, '');
    const next = { ...getDimensionParts, [part]: val } as { l: string; w: string; h: string };
    const formatted = [next.l, next.w, next.h].some(v => v)
      ? `${next.l || '0'} x ${next.w || '0'} x ${next.h || '0'} mm`
      : '';
    setForm(prev => ({ ...prev, dimensions: formatted }));
  };

  // ============================================================================
  // LOCATION HANDLERS (Province/District/Ward)
  // ============================================================================

  // Province selection handlers
  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setForm(prev => ({ 
      ...prev, 
      provinceCode: province.ProvinceID.toString() 
    }));
    setShowProvinceDropdown(false);
    setProvinceSearchQuery('');
    
    // Clear district and ward selection when province changes
    setSelectedDistrict(null);
    setForm(prev => ({ ...prev, districtCode: '' }));
    setDistrictSearchQuery('');
    setSelectedWard(null);
    setForm(prev => ({ ...prev, wardCode: '' }));
    setWardSearchQuery('');
  };

  const handleProvinceSearch = (query: string) => {
    setProvinceSearchQuery(query);
  };

  const clearProvinceSelection = () => {
    setSelectedProvince(null);
    setForm(prev => ({ ...prev, provinceCode: '' }));
    setProvinceSearchQuery('');
    
    // Clear district and ward selection when province is cleared
    setSelectedDistrict(null);
    setForm(prev => ({ ...prev, districtCode: '' }));
    setDistrictSearchQuery('');
    setSelectedWard(null);
    setForm(prev => ({ ...prev, wardCode: '' }));
    setWardSearchQuery('');
  };

  const toggleProvinceDropdown = () => {
    setShowProvinceDropdown(!showProvinceDropdown);
    if (!showProvinceDropdown) {
      setProvinceSearchQuery('');
    }
  };

  // Filter provinces based on search query
  const filteredProvinces = useMemo(() => {
    if (!provinceSearchQuery.trim()) return provinces;
    
    const lowercaseQuery = provinceSearchQuery.toLowerCase();
    return provinces.filter(province => 
      province.ProvinceName.toLowerCase().includes(lowercaseQuery) ||
      province.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [provinces, provinceSearchQuery]);

  // District selection handlers
  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setForm(prev => ({ 
      ...prev, 
      districtCode: district.DistrictID.toString() 
    }));
    setShowDistrictDropdown(false);
    setDistrictSearchQuery('');
    
    // Clear ward selection when district changes
    setSelectedWard(null);
    setForm(prev => ({ ...prev, wardCode: '' }));
    setWardSearchQuery('');
  };

  const handleDistrictSearch = (query: string) => {
    setDistrictSearchQuery(query);
  };

  const clearDistrictSelection = () => {
    setSelectedDistrict(null);
    setForm(prev => ({ ...prev, districtCode: '' }));
    setDistrictSearchQuery('');
    
    // Clear ward selection when district is cleared
    setSelectedWard(null);
    setForm(prev => ({ ...prev, wardCode: '' }));
    setWardSearchQuery('');
  };

  const toggleDistrictDropdown = () => {
    if (!selectedProvince) {
      showCenterError('Vui lòng chọn tỉnh/thành phố trước');
      return;
    }
    setShowDistrictDropdown(!showDistrictDropdown);
    if (!showDistrictDropdown) {
      setDistrictSearchQuery('');
    }
  };

  // Filter districts based on search query
  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return districts;
    
    const lowercaseQuery = districtSearchQuery.toLowerCase();
    return districts.filter(district => 
      district.DistrictName.toLowerCase().includes(lowercaseQuery) ||
      district.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [districts, districtSearchQuery]);

  // Ward selection handlers
  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    setForm(prev => ({ 
      ...prev, 
      wardCode: ward.WardCode 
    }));
    setShowWardDropdown(false);
    setWardSearchQuery('');
  };

  const handleWardSearch = (query: string) => {
    setWardSearchQuery(query);
  };

  const clearWardSelection = () => {
    setSelectedWard(null);
    setForm(prev => ({ ...prev, wardCode: '' }));
    setWardSearchQuery('');
  };

  const toggleWardDropdown = () => {
    if (!selectedDistrict) {
      showCenterError('Vui lòng chọn quận/huyện trước');
      return;
    }
    setShowWardDropdown(!showWardDropdown);
    if (!showWardDropdown) {
      setWardSearchQuery('');
    }
  };

  // Filter wards based on search query
  const filteredWards = useMemo(() => {
    if (!wardSearchQuery.trim()) return wards;
    
    const lowercaseQuery = wardSearchQuery.toLowerCase();
    return wards.filter(ward => 
      ward.WardName.toLowerCase().includes(lowercaseQuery) ||
      ward.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [wards, wardSearchQuery]);

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================

  const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id));
  const addImageFiles = (files: FileList) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).map((file, idx) => ({ id: `${Date.now()}_${idx}`, file, url: URL.createObjectURL(file) }));
    if (arr.length) setImages(prev => [...prev, ...arr]);
  };
  const addImageFromUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
      setImages(prev => [...prev, { id: `url_${Date.now()}`, url }]);
      setImageUrl('');
    } catch {
      showCenterError('URL không hợp lệ. Vui lòng nhập đúng định dạng');
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const goNext = () => {
    if (currentStep === 1) {
      const basicValid = (form.name || '').trim().length >= 3 && (form.brandName || '').trim().length >= 2 && (form.category || '').trim().length > 0 && (form.shortDescription || '').trim().length > 0;
      if (!basicValid) {
        showCenterError('Vui lòng nhập đầy đủ thông tin chung bắt buộc');
        return;
      }
    }
    if (currentStep === 2) {
      const priceValid = !!form.price && !Number.isNaN(Number(form.price)) && Number(form.price) > 0 && (form.sku || '').trim().length > 0 && (form.provinceCode || '').trim().length > 0 && (form.districtCode || '').trim().length > 0 && (form.wardCode || '').trim().length > 0;
      if (!priceValid) {
        showCenterError('Vui lòng nhập giá hợp lệ, SKU và chọn tỉnh/thành phố, quận/huyện, phường/xã');
        return;
      }
    }
    if (currentStep === 3) {
      if (images.length === 0 && !(imageUrl || '').trim()) {
        showCenterError('Vui lòng thêm ít nhất 1 ảnh sản phẩm');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================================
  // PAYLOAD BUILDING & SUBMISSION
  // ============================================================================

  const buildPayload = async (): Promise<Record<string, any>> => {
    const filesToUpload = images.filter(img => !!img.file).map(img => img.file!) as File[];
    let uploadedUrls: string[] = [];
    if (filesToUpload.length > 0) {
      const uploaded = await FileUploadService.uploadMultipleImages(filesToUpload);
      uploadedUrls = uploaded.map(u => u.url);
    }
    const existingUrls = images.filter(img => !img.file && !!img.url).map(img => img.url);
    const allImageUrls = [...existingUrls, ...uploadedUrls];

    const priceNum = Number(form.price);
    const stockNum = Number(form.stockQuantity);
    const weightNum = form.weight ? Number(form.weight) : undefined;
    // Shipping fields hidden; not used

    // Normalize extra specs types (boolean/number)
    const booleanKeys = new Set([
      'isSportsModel','hasBuiltInBattery','isGamingHeadset','sirimApproved','sirimCertified','mcmcApproved',
      'supportBluetooth','supportWifi','supportAirplay','autoReturn','balancedOutput','hasPhantomPower',
      'builtInEffects','usbAudioInterface','midiSupport','isFeatured','isCustomMade'
    ]);
    const integerKeys = new Set(['inputChannels','outputChannels','channelCount']);

    const normalizedExtra: Record<string, any> = {};
    Object.entries(extraSpecs).forEach(([key, val]) => {
      if (val === '' || val == null) return;
      if (booleanKeys.has(key)) {
        if (typeof val === 'boolean') {
          normalizedExtra[key] = val;
        } else if (typeof val === 'string') {
          const v = val.trim().toLowerCase();
          if (v === 'true' || v === '1' || v === 'yes') normalizedExtra[key] = true;
          else if (v === 'false' || v === '0' || v === 'no') normalizedExtra[key] = false;
        }
        return;
      }
      if (integerKeys.has(key)) {
        const n = Number(val);
        if (Number.isFinite(n)) normalizedExtra[key] = n;
        return;
      }
      normalizedExtra[key] = val;
    });

    const digitsOnly = (s?: string) => (s ? s.replace(/\D/g, '') : undefined);

    const payload: Record<string, any> = {
      categoryName: form.category,
      brandName: form.brandName,
      sku: form.sku,
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description || undefined,
      model: form.model || undefined,
      color: form.color || undefined,
      material: form.material || undefined,
      dimensions: form.dimensions || undefined,
      weight: Number.isFinite(weightNum as number) ? weightNum : undefined,
      connectionType: form.connectionType || undefined,
      voltageInput: form.voltageInput || undefined,
      images: allImageUrls,
      videoUrl: form.videoUrl || undefined,
      price: Number.isFinite(priceNum) ? priceNum : undefined,
      discountPrice: null, // Luôn set null theo yêu cầu
      currency: form.currency,
      stockQuantity: Number.isFinite(stockNum) ? stockNum : undefined,
      warehouseLocation: form.warehouseLocation || undefined,
      provinceCode: digitsOnly(form.provinceCode) || undefined,
      districtCode: digitsOnly(form.districtCode) || undefined,
      wardCode: digitsOnly(form.wardCode) || undefined,
      shippingAddress: null,
      shippingFee: null,
      supportedShippingMethodIds: Array.isArray(form.selectedShippingMethodIds) 
        ? form.selectedShippingMethodIds.filter((id: string) => id && id.trim() && id.length > 0)
        : [],
      variants: variants
        .map(v => ({ 
          optionName: v.optionName?.trim(), 
          optionValue: v.optionValue?.trim(),
          variantPrice: Number(v.variantPrice) || 0,
          variantStock: Number(v.variantStock) || 0,
          variantSku: v.variantSku?.trim() || ''
        }))
        .filter(v => v.optionName && v.optionValue && v.variantPrice > 0 && v.variantStock >= 0 && v.variantSku),
      bulkDiscounts: bulkDiscounts
        .map(b => ({
          fromQuantity: Number(b.fromQuantity),
          toQuantity: Number(b.toQuantity),
          unitPrice: Number(b.unitPrice)
        }))
        .filter(b => Number.isFinite(b.fromQuantity) && Number.isFinite(b.toQuantity) && Number.isFinite(b.unitPrice)),
      warrantyPeriod: form.warrantyPeriod || undefined,
      warrantyType: form.warrantyType || undefined,
      manufacturerName: form.manufacturerName || undefined,
      manufacturerAddress: form.manufacturerAddress || undefined,
      productCondition: form.productCondition || undefined,
      isCustomMade: form.isCustomMade === 'true' ? true : undefined,
      ...normalizedExtra,
    };

    Object.keys(payload).forEach((k) => {
      // Giữ discountPrice là null, không xóa
      if (k === 'discountPrice') return;
      if (payload[k] === '' || payload[k] === undefined) delete payload[k];
    });
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If user forgot to press "Thêm" for a valid URL, add it now
    if (images.length === 0 && (imageUrl || '').trim()) {
      try {
        new URL(imageUrl.trim());
        setImages(prev => [...prev, { id: `url_${Date.now()}`, url: imageUrl.trim() }]);
        setImageUrl('');
      } catch {
        // fallthrough to validation error
      }
    }

    if (!canSubmit) {
      showCenterError('Vui lòng điền thông tin bắt buộc, thêm ít nhất 1 ảnh và chọn tỉnh/thành phố, quận/huyện, phường/xã');
      return;
    }
    try {
      setSubmitting(true);
      const payload = await buildPayload();
      console.log('📤 Sending payload to API:', JSON.stringify(payload, null, 2));
      await ProductService.createActiveProduct(payload);
      showCenterSuccess('Tạo sản phẩm thành công! Đang chuyển đến trang quản lý...');
      
      // Reset form
      setForm(defaultForm);
      setImages([]);
      setExtraSpecs({});
      setVariants([]);
      setBulkDiscounts([]);
      setCurrentStep(1);
      setSelectedProvince(null);
      setProvinceSearchQuery('');
      setSelectedDistrict(null);
      setDistrictSearchQuery('');
      setSelectedWard(null);
      setWardSearchQuery('');
      
      // Navigate to seller dashboard after a short delay
      setTimeout(() => {
        navigate('/seller/dashboard/products');
      }, 1000);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'Không thể tạo sản phẩm. Vui lòng thử lại.';
      showCenterError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Draft flow removed per requirement

  const currentCategory = form.category as CategoryKey;
  const specDefs = CATEGORY_SPECS[currentCategory] || [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* ============================================================================
              STEPPER COMPONENT
              ============================================================================ */}
          {/* Stepper */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4">
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1,2,3].map(step => (
                  <li key={step} className={`flex items-center gap-3 p-3 rounded-lg border ${currentStep === step ? 'border-orange-600 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${currentStep >= step ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{step}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {step === 1 ? 'Thông tin chung' : step === 2 ? 'Chi tiết & giá' : 'Hình ảnh & Video'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {step === 1 ? 'Tên, mô tả, danh mục...' : step === 2 ? 'Giá, tồn kho, vận chuyển...' : 'Tải ảnh hoặc nhập link'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ============================================================================
              FORM CONTENT SECTIONS
              ============================================================================ */}
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
      {currentStep === 1 && (
      <SectionCard title="Thông tin chung" description="Nhập thông tin cơ bản cho sản phẩm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
            <input name="name" value={form.name} onChange={onChange} type="text" placeholder="VD: Sony WH-1000XM4" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả ngắn *</label>
            <input name="shortDescription" value={form.shortDescription} onChange={onChange} type="text" placeholder="Tóm tắt 1-2 câu về sản phẩm" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
            <div className="mt-1">
              <TinyMCEEditor
                value={form.description}
                onChange={(content) => setForm({ ...form, description: content })}
                placeholder="Mô tả đầy đủ về sản phẩm, tính năng, chất lượng..."
                height={400}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Thương hiệu *</label>
              <input name="brandName" value={form.brandName} onChange={onChange} type="text" placeholder="VD: Sony, Sennheiser, JBL" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Danh mục *</label>
              <select name="category" value={form.category} onChange={onChange} disabled={categoriesLoading} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">{categoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục'}</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã model</label>
              <input name="model" value={form.model} onChange={onChange} type="text" placeholder="VD: WH1000XM4" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
              <input 
                name="color" 
                value={form.color} 
                onChange={(e) => {
                  // Không cho phép nhập dấu phẩy
                  const value = e.target.value.replace(/,/g, '');
                  onChange({ ...e, target: { ...e.target, name: 'color', value } } as any);
                }}
                onKeyDown={(e) => {
                  // Ngăn chặn nhập dấu phẩy từ keyboard
                  if (e.key === ',' || e.key === 'Comma') {
                    e.preventDefault();
                  }
                }}
                type="text" 
                placeholder="VD: Đen" 
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
              <input name="material" value={form.material} onChange={onChange} type="text" placeholder="VD: Nhựa ABS, Nhôm, Da" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kích thước (mm)</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <input
                  value={getDimensionParts.l}
                  onChange={(e) => setDimensionPart('l', e.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder="Dài (mm)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                />
                <input
                  value={getDimensionParts.w}
                  onChange={(e) => setDimensionPart('w', e.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder="Rộng (mm)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                />
                <input
                  value={getDimensionParts.h}
                  onChange={(e) => setDimensionPart('h', e.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder="Cao (mm)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                />
              </div>
              {/* Hidden combined field stored in form.dimensions as "L x W x H mm" */}
              <input name="dimensions" value={form.dimensions} onChange={() => {}} type="hidden" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Trọng lượng (kg)</label>
            <input name="weight" value={form.weight} onChange={onChange} type="number" step="0.1" min="0" placeholder="VD: 0.25" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kết nối</label>
              <input name="connectionType" value={form.connectionType} onChange={onChange} type="text" placeholder="VD: Bluetooth, RCA, USB" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Điện áp</label>
              <input name="voltageInput" value={form.voltageInput} onChange={onChange} type="text" placeholder="VD: 5V" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
          </div>
        </div>
      </SectionCard>
      )}

      {currentStep === 2 && (
      <SectionCard title="Chi tiết & Giá" description="Thiết lập giá, tồn kho, biến thể và vận chuyển">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá gốc (VND) *</label>
              <input name="price" value={formatNumber(form.price)} onChange={(e) => { const f = formatNumber(e.target.value); const n = parseFormattedNumber(f); onChange({ ...e, target: { ...e.target, name: 'price', value: n } } as any); }} type="text" placeholder="VD: 5.000.000" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng tồn *</label>
              <input name="stockQuantity" value={form.stockQuantity} onChange={onChange} type="number" min="0" placeholder="VD: 50" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU *</label>
              <input name="sku" value={form.sku} onChange={onChange} type="text" placeholder="VD: SONY-WH1000XM4-BLK" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đơn vị tiền tệ</label>
              <select name="currency" value={form.currency} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors">
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      </SectionCard>
      )}

      {currentStep === 2 && (
      <SectionCard title="Biến thể sản phẩm (Product Variants)" description="Thêm các biến thể như màu sắc, kích cỡ với giá và số lượng riêng">
        <div className="space-y-4">
          {variants.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500 mb-2">Chưa có biến thể nào</p>
              <p className="text-xs text-gray-400">Thêm các biến thể như màu sắc, kích cỡ để khách hàng có nhiều lựa chọn</p>
            </div>
          )}
          {variants.map((v, idx) => (
            <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Biến thể #{idx + 1}</h4>
                <button 
                  type="button" 
                  onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))} 
                  className="px-3 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên tùy chọn</label>
                  <input 
                    value={v.optionName} 
                    onChange={(e) => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, optionName: e.target.value } : x))} 
                    placeholder="VD: Color, Size, Capacity" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá trị</label>
                  <input 
                    value={v.optionValue} 
                    onChange={(e) => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, optionValue: e.target.value } : x))} 
                    placeholder="VD: Black, XL, 128GB" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá (VND) <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    min="0"
                    value={v.variantPrice} 
                    onChange={(e) => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, variantPrice: e.target.value } : x))} 
                    placeholder="1000000" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    min="0"
                    value={v.variantStock} 
                    onChange={(e) => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, variantStock: e.target.value } : x))} 
                    placeholder="50" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SKU biến thể <span className="text-red-500">*</span></label>
                  <input 
                    value={v.variantSku} 
                    onChange={(e) => setVariants(prev => prev.map((x, i) => i === idx ? { ...x, variantSku: e.target.value } : x))} 
                    placeholder="SKU-50-SN001" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => setVariants(prev => [...prev, { 
              optionName: '', 
              optionValue: '', 
              variantPrice: '',
              variantStock: '',
              variantSku: ''
            }])} 
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-medium flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Thêm biến thể mới
          </button>
        </div>
      </SectionCard>
      )}

      {/* BulkDiscounts - Hidden but kept in code */}
      {false && currentStep === 2 && (
      <SectionCard title="Giá mua nhiều (Bulk Discounts)" description="Thêm khoảng số lượng và đơn giá (tuỳ chọn)">
        <div className="space-y-3">
          {bulkDiscounts.length === 0 && <p className="text-sm text-gray-500">Chưa có mức mua sỉ nào.</p>}
          {bulkDiscounts.map((b, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
              <input type="number" min="1" value={b.fromQuantity} onChange={(e) => setBulkDiscounts(prev => prev.map((x, i) => i === idx ? { ...x, fromQuantity: e.target.value } : x))} placeholder="Từ SL" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="number" min="1" value={b.toQuantity} onChange={(e) => setBulkDiscounts(prev => prev.map((x, i) => i === idx ? { ...x, toQuantity: e.target.value } : x))} placeholder="Đến SL" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input value={formatNumber(b.unitPrice)} onChange={(e) => { const f = formatNumber(e.target.value); const n = parseFormattedNumber(f); setBulkDiscounts(prev => prev.map((x, i) => i === idx ? { ...x, unitPrice: n } : x)); }} placeholder="Đơn giá" className="w-full px-3 py-2 border border-gray-300 rounded-lg md:col-span-3" />
              <button type="button" onClick={() => setBulkDiscounts(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-2 text-sm rounded bg-red-50 text-red-700">Xoá</button>
            </div>
          ))}
          <button type="button" onClick={() => setBulkDiscounts(prev => [...prev, { fromQuantity: '', toQuantity: '', unitPrice: '' }])} className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700">+ Thêm mức sỉ</button>
        </div>
      </SectionCard>
      )}

      {currentStep === 2 && (
      <SectionCard title="Bảo hành & Nhà sản xuất" description="Thông tin hậu mãi và NSX">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Thời gian bảo hành</label>
              <input name="warrantyPeriod" value={form.warrantyPeriod} onChange={onChange} type="text" placeholder="VD: 12 tháng" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại bảo hành</label>
              <select name="warrantyType" value={form.warrantyType} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors">
                <option value="">Chọn loại bảo hành</option>
                <option value="Chính hãng">Chính hãng</option>
                <option value="1 đổi 1">1 đổi 1</option>
                <option value="Sửa chữa">Sửa chữa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên nhà sản xuất</label>
              <input name="manufacturerName" value={form.manufacturerName} onChange={onChange} type="text" placeholder="VD: Sony Corporation" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ nhà sản xuất</label>
              <input name="manufacturerAddress" value={form.manufacturerAddress} onChange={onChange} type="text" placeholder="VD: Tokyo, Japan" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tình trạng sản phẩm</label>
              <select name="productCondition" value={form.productCondition} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors">
                <option value="">Chọn tình trạng</option>
                <option value="Mới 100%">Mới 100%</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div className="flex items-center">
              <input name="isCustomMade" type="checkbox" checked={form.isCustomMade === 'true'} onChange={(e) => onChange({ ...e, target: { ...e.target, name: 'isCustomMade', value: e.target.checked.toString() } } as any)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-700">Làm theo yêu cầu</label>
            </div>
          </div>
        </div>
      </SectionCard>
      )}

      {currentStep === 2 && (
      <SectionCard title="Kho hàng & Vận chuyển" description="Địa chỉ kho và phương thức giao hàng cho đơn">
        <div className="space-y-5">
          {/* Warehouse & Location */}
          <div className=" border border-gray-200 rounded-xl p-4">
            {/* Thứ tự mới: Tỉnh/Thành phố -> Quận/Huyện -> Phường/Xã -> Địa chỉ kho */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
              <div className="relative mt-1 province-dropdown-container">
                {/* Province Selection Button */}
                <button
                  type="button"
                  onClick={toggleProvinceDropdown}
                  disabled={provincesLoading}
                  className={`w-full px-3 py-2 text-left border rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${
                    provincesLoading 
                      ? 'bg-gray-100 cursor-not-allowed border-gray-300' 
                      : selectedProvince 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${selectedProvince ? 'text-gray-900' : 'text-gray-500'}`}>
                      {provincesLoading 
                        ? 'Đang tải tỉnh...' 
                        : selectedProvince 
                          ? selectedProvince.ProvinceName 
                          : 'Chọn tỉnh/thành phố'
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedProvince && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearProvinceSelection();
                          }}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          ×
                        </button>
                      )}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Province Dropdown */}
                {showProvinceDropdown && !provincesLoading && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={provinceSearchQuery}
                        onChange={(e) => handleProvinceSearch(e.target.value)}
                        placeholder="Tìm kiếm tỉnh..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Province List */}
                    <div className="max-h-48 overflow-y-auto">
                      {provincesError ? (
                        <div className="p-3 text-center text-red-600 text-sm">
                          <p>{provincesError}</p>
                          <button
                            type="button"
                            onClick={refetchProvinces}
                            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Thử lại
                          </button>
                        </div>
                      ) : filteredProvinces.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {provinceSearchQuery ? 'Không tìm thấy tỉnh nào' : 'Không có dữ liệu'}
                        </div>
                      ) : (
                        filteredProvinces.map((province) => (
                          <button
                            key={province.ProvinceID}
                            type="button"
                            onClick={() => handleProvinceSelect(province)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                              selectedProvince?.ProvinceID === province.ProvinceID 
                                ? 'bg-orange-50 text-orange-700' 
                                : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{province.ProvinceName}</span>
                              <span className="text-xs text-gray-500">({province.Code})</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden input để lưu ProvinceID */}
              <input 
                type="hidden" 
                name="provinceCode" 
                value={form.provinceCode} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Quận/Huyện <span className="text-red-500">*</span></label>
              <div className="relative mt-1 district-dropdown-container">
                {/* District Selection Button */}
                <button
                  type="button"
                  onClick={toggleDistrictDropdown}
                  disabled={districtsLoading || !selectedProvince}
                  className={`w-full px-3 py-2 text-left border rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors ${
                    districtsLoading || !selectedProvince
                      ? 'bg-gray-100 cursor-not-allowed border-gray-300' 
                      : selectedDistrict 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${selectedDistrict ? 'text-gray-900' : 'text-gray-500'}`}>
                      {!selectedProvince
                        ? 'Chọn tỉnh trước'
                        : districtsLoading 
                          ? 'Đang tải quận/huyện...' 
                          : selectedDistrict 
                            ? selectedDistrict.DistrictName 
                            : 'Chọn quận/huyện'
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedDistrict && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDistrictSelection();
                          }}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          ×
                        </button>
                      )}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* District Dropdown */}
                {showDistrictDropdown && !districtsLoading && selectedProvince && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={districtSearchQuery}
                        onChange={(e) => handleDistrictSearch(e.target.value)}
                        placeholder="Tìm kiếm quận/huyện..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* District List */}
                    <div className="max-h-48 overflow-y-auto">
                      {districtsError ? (
                        <div className="p-3 text-center text-red-600 text-sm">
                          <p>{districtsError}</p>
                          <button
                            type="button"
                            onClick={refetchDistricts}
                            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Thử lại
                          </button>
                        </div>
                      ) : filteredDistricts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {districtSearchQuery ? 'Không tìm thấy quận/huyện nào' : 'Không có dữ liệu'}
                        </div>
                      ) : (
                        filteredDistricts.map((district) => (
                          <button
                            key={district.DistrictID}
                            type="button"
                            onClick={() => handleDistrictSelect(district)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                              selectedDistrict?.DistrictID === district.DistrictID 
                                ? 'bg-orange-50 text-orange-700' 
                                : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{district.DistrictName}</span>
                              <span className="text-xs text-gray-500">({district.Code})</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden input để lưu DistrictID */}
              <input 
                type="hidden" 
                name="districtCode" 
                value={form.districtCode} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Phường/Xã <span className="text-red-500">*</span></label>
              <div className="relative mt-1 ward-dropdown-container">
                {/* Ward Selection Button */}
                <button
                  type="button"
                  onClick={toggleWardDropdown}
                  disabled={wardsLoading || !selectedDistrict}
                  className={`w-full px-3 py-2 text-left border rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors ${
                    wardsLoading || !selectedDistrict
                      ? 'bg-gray-100 cursor-not-allowed border-gray-300' 
                      : selectedWard 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${selectedWard ? 'text-gray-900' : 'text-gray-500'}`}>
                      {!selectedDistrict
                        ? 'Chọn quận/huyện trước'
                        : wardsLoading 
                          ? 'Đang tải phường/xã...' 
                          : selectedWard 
                            ? selectedWard.WardName 
                            : 'Chọn phường/xã'
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedWard && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearWardSelection();
                          }}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          ×
                        </button>
                      )}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${showWardDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Ward Dropdown */}
                {showWardDropdown && !wardsLoading && selectedDistrict && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={wardSearchQuery}
                        onChange={(e) => handleWardSearch(e.target.value)}
                        placeholder="Tìm kiếm phường/xã..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Ward List */}
                    <div className="max-h-48 overflow-y-auto">
                      {wardsError ? (
                        <div className="p-3 text-center text-red-600 text-sm">
                          <p>{wardsError}</p>
                          <button
                            type="button"
                            onClick={refetchWards}
                            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Thử lại
                          </button>
                        </div>
                      ) : filteredWards.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {wardSearchQuery ? 'Không tìm thấy phường/xã nào' : 'Không có dữ liệu'}
                        </div>
                      ) : (
                        filteredWards.map((ward) => (
                          <button
                            key={ward.WardCode}
                            type="button"
                            onClick={() => handleWardSelect(ward)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                              selectedWard?.WardCode === ward.WardCode 
                                ? 'bg-orange-50 text-orange-700' 
                                : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{ward.WardName}</span>
                              <span className="text-xs text-gray-500">({ward.WardCode})</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden input để lưu WardCode */}
              <input 
                type="hidden" 
                name="wardCode" 
                value={form.wardCode} 
              />
            </div>
            
            {/* Địa chỉ kho (số nhà/tên đường) - Hiển thị cuối cùng - Full width */}
            <div className="mt-4 col-span-full w-full">
              <label className="block text-sm font-semibold text-gray-800">Địa chỉ kho <span className="text-red-500">*</span></label>
              <input 
                name="warehouseLocation" 
                value={form.warehouseLocation} 
                onChange={onChange} 
                type="text" 
                placeholder="VD: 123/5F, đường Nguyễn Huệ"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              />
              <p className="mt-1 text-xs text-gray-500">Nhập số nhà, tên đường để xác định địa điểm xuất kho.</p>
            </div>
            {/* Hidden by requirement: shipping fee not shown; API will receive null */}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-800">Phương thức vận chuyển</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Chọn các phương thức hỗ trợ đơn này</span>
                <button
                  type="button"
                  onClick={reloadShippingMethods}
                  disabled={shippingLoading}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tải lại phương thức vận chuyển"
                >
                  <RefreshCw 
                    className={`h-4 w-4 text-gray-600 ${shippingLoading ? 'animate-spin' : ''}`} 
                  />
                </button>
              </div>
            </div>
            {shippingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-sm text-gray-500">Đang tải phương thức vận chuyển...</span>
              </div>
            ) : shippingMethods.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">Không có phương thức vận chuyển nào</div>
            ) : (
              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const selected = form.selectedShippingMethodIds.includes(method.shippingMethodId);
                  return (
                    <div 
                      key={method.shippingMethodId}
                      className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selected ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => onSelectShipping(method.shippingMethodId)}
                    >
                      <div className="flex items-center h-5">
                        <input type="checkbox" checked={selected} onChange={() => {}} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-3">
                          {method.logoUrl && (
                            <img src={method.logoUrl} alt={method.name} className="h-8 w-8 object-contain rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{method.name}</h3>
                            <p className="text-xs text-gray-500">{method.description || 'Phương thức vận chuyển'}</p>
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">Đã chọn</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {form.selectedShippingMethodIds.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-2">Đã chọn {form.selectedShippingMethodIds.length} phương thức vận chuyển:</p>
                <div className="flex flex-wrap gap-2">
                  {form.selectedShippingMethodIds.map(id => {
                    const m = shippingMethods.find(x => x.shippingMethodId === id);
                    return (
                      <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {m?.name || id}
                        <button type="button" onClick={(e) => { e.stopPropagation(); onSelectShipping(id); }} className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200 transition-colors">×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
      )}

      {currentStep === 2 && (
      <SectionCard title="Thông số kỹ thuật theo danh mục" description="Các thuộc tính chỉ hiển thị khi đã chọn danh mục">
        {form.category ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specDefs.length === 0 && (
              <p className="text-sm text-gray-500">Danh mục này chưa có thông số riêng.</p>
            )}
            {specDefs.map((spec) => {
              // Common suggestions for different spec types
              const getSuggestions = (key: string) => {
                const suggestions: Record<string, string[]> = {
                  frequencyResponse: ['20Hz-20kHz', '20Hz-18kHz', '15Hz-22kHz', '30Hz-15kHz'],
                  sensitivity: ['88dB', '90dB', '92dB', '95dB', '100dB', '105dB'],
                  impedance: ['8Ω', '16Ω', '32Ω', '64Ω', '150Ω', '300Ω'],
                  powerHandling: ['50W RMS', '100W RMS', '200W RMS', '500W RMS'],
                  connectionType: ['Bluetooth 5.0', 'Bluetooth 4.2', 'USB-C', '3.5mm', 'XLR', 'RCA', 'USB'],
                  voltageInput: ['5V/2A', '12V/1A', '24V/0.5A', '110V', '220V'],
                  driverConfiguration: ['2-way', '3-way', '4-way', 'Single driver'],
                  driverSize: ['6.5 inch', '8 inch', '10 inch', '12 inch', '1 inch tweeter'],
                  enclosureType: ['Bass Reflex', 'Sealed', 'Port', 'Passive radiator'],
                  coveragePattern: ['180° x 180°', '120° x 120°', '90° x 90°', '60° x 60°'],
                  crossoverFrequency: ['2.5kHz', '3kHz', '4kHz', '5kHz'],
                  headphoneType: ['Over-ear', 'On-ear', 'In-ear', 'True wireless', 'Earbuds', 'Gaming headset'],
                  compatibleDevices: ['iPhone', 'Android', 'PC', 'Mac', 'PS5', 'Xbox', 'Nintendo Switch', 'iPad'],
                  headphoneFeatures: ['ANC', 'Touch Control', 'EQ App', 'Voice Assistant', 'Wireless Charging', 'Fast Charge'],
                  batteryCapacity: ['500mAh', '1000mAh', '1500mAh', '2000mAh', '3000mAh', '4000mAh'],
                  micType: ['Dynamic', 'Condenser', 'Lavalier', 'Shotgun', 'USB'],
                  polarPattern: ['Cardioid', 'Supercardioid', 'Omni', 'Figure-8', 'Bidirectional'],
                  maxSPL: ['120dB', '130dB', '140dB', '150dB', '160dB', '170dB'],
                  micOutputImpedance: ['150Ω', '200Ω', '300Ω', '600Ω', '50Ω', '100Ω'],
                  micSensitivity: ['-40dB', '-45dB', '-50dB', '-55dB', '-35dB', '-60dB'],
                  dacChipset: ['ESS Sabre ES9038', 'AKM AK4499', 'Cirrus Logic CS43198', 'TI PCM1794A'],
                  sampleRate: ['44.1kHz/16bit', '48kHz/24bit', '96kHz/24bit', '192kHz/24bit', '384kHz/32bit'],
                  bitDepth: ['16-bit', '24-bit', '32-bit'],
                  thd: ['0.01%', '0.05%', '0.1%', '0.2%', '0.001%', '0.5%'],
                  snr: ['90dB', '100dB', '110dB', '120dB', '80dB', '130dB'],
                  amplifierType: ['Class D', 'Class A', 'Class AB', 'Class A/B', 'AV Receiver'],
                  totalPowerOutput: ['50W (8Ω)', '100W (8Ω)', '200W (8Ω)', '500W (8Ω)', '25W (8Ω)', '1000W (8Ω)'],
                  platterMaterial: ['Aluminum', 'Acrylic', 'Glass', 'Steel', 'Carbon fiber', 'Wood', 'Plastic'],
                  motorType: ['Direct Drive', 'Belt Drive', 'Idler Drive', 'Magnetic Drive', 'Servo Drive'],
                  tonearmType: ['S-shaped', 'Straight', 'J-shaped', 'Carbon fiber', 'Aluminum', 'Wood'],
                  comboType: ['Amp + Speaker', 'DAC + Amp', 'Mixer + Interface', 'Preamp + Power amp', 'DAC + Headphone Amp', 'Streamer + DAC']
                };
                return suggestions[key] || [];
              };

              // Fields that support multiple selection
              const multiSelectFields = new Set([
                'connectionType', 'compatibleDevices', 'headphoneFeatures', 'micType', 'polarPattern',
                'dacChipset', 'sampleRate', 'bitDepth', 'amplifierType', 'platterMaterial', 'motorType',
                'tonearmType', 'comboType', 'driverConfiguration', 'enclosureType', 'headphoneType',
                'batteryCapacity', 'maxSPL', 'micOutputImpedance', 'micSensitivity', 'thd', 'snr',
                'totalPowerOutput', 'coveragePattern', 'crossoverFrequency'
              ]);

              const suggestions = getSuggestions(spec.key);
              const isMultiSelect = multiSelectFields.has(spec.key);
              const currentValue = extraSpecs[spec.key] || '';
              const currentValues = isMultiSelect ? currentValue.split(',').map(v => v.trim()).filter(Boolean) : [currentValue];
              
              // Debug log
              console.log('Spec:', spec.key, 'isMultiSelect:', isMultiSelect, 'suggestions:', suggestions.length, 'currentValue:', currentValue);

              const handleSuggestionClick = (suggestion: string) => {
                if (isMultiSelect) {
                  const values = currentValue.split(',').map(v => v.trim()).filter(Boolean);
                  if (values.includes(suggestion)) {
                    // Remove if already selected
                    const newValues = values.filter(v => v !== suggestion);
                    setExtraSpecs(prev => ({ ...prev, [spec.key]: newValues.join(', ') }));
                  } else {
                    // Add if not selected
                    const newValues = [...values, suggestion];
                    setExtraSpecs(prev => ({ ...prev, [spec.key]: newValues.join(', ') }));
                  }
                } else {
                  setExtraSpecs(prev => ({ ...prev, [spec.key]: suggestion }));
                }
              };

              const isSuggestionSelected = (suggestion: string) => {
                return isMultiSelect ? currentValues.includes(suggestion) : currentValue === suggestion;
              };
              
              return (
                <div key={spec.key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {spec.label}
                    {isMultiSelect && <span className="text-xs text-gray-500 ml-1">(có thể chọn nhiều)</span>}
                  </label>
                  {spec.type === 'select' ? (
                    <select value={extraSpecs[spec.key] || ''} onChange={(e) => setExtraSpecs(prev => ({ ...prev, [spec.key]: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
                      <option value="">Chọn {spec.label.toLowerCase()}</option>
                      {(spec.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type={spec.type === 'number' ? 'number' : 'text'} 
                        value={extraSpecs[spec.key] || ''} 
                        onChange={(e) => {
                          console.log('Input changed for field:', spec.key, 'value:', e.target.value);
                          setExtraSpecs(prev => ({ ...prev, [spec.key]: e.target.value }));
                        }} 
                        placeholder={isMultiSelect ? `${spec.placeholder} (cách nhau bằng dấu phẩy)` : spec.placeholder} 
                        list={`suggestions-${spec.key}`}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" 
                      />
                      {suggestions.length > 0 && (
                        <datalist id={`suggestions-${spec.key}`}>
                          {suggestions.map((suggestion, idx) => (
                            <option key={idx} value={suggestion} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  )}
                  {spec.helpText && <p className="mt-1 text-xs text-gray-500">{spec.helpText}</p>}
                  
                  {/* Show selected values for multi-select fields */}
                  {isMultiSelect && (
                    <div className="mt-2">
                      {currentValues.length > 0 ? (
                        <>
                          <p className="text-xs text-gray-500 mb-1">Đã chọn:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentValues.map((value, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded border">
                                {value}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('Removing value:', value, 'from field:', spec.key);
                                    handleSuggestionClick(value);
                                  }}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">Chưa chọn gì</p>
                      )}
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Gợi ý nhanh {isMultiSelect ? '(click để chọn/bỏ chọn)' : '(click để chọn)'}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suggestions.slice(0, 6).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              console.log('Clicked suggestion:', suggestion, 'for field:', spec.key);
                              handleSuggestionClick(suggestion);
                            }}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              isSuggestionSelected(suggestion)
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                      {suggestions.length > 6 && (
                        <p className="text-xs text-gray-400 mt-1">
                          +{suggestions.length - 6} gợi ý khác (nhập thủ công)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Hãy chọn danh mục để nhập thông số kỹ thuật phù hợp.</p>
        )}
      </SectionCard>
      )}

      {currentStep === 3 && (
      <SectionCard title="Hình ảnh & Video" description="Tải ảnh hoặc nhập link ảnh">
        <div className="space-y-4">
          <div className="flex mb-4">
                <button type="button" onClick={() => setIsUrlMode(false)} className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${!isUrlMode ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>📁 Từ máy tính</button>
            <button type="button" onClick={() => setIsUrlMode(true)} className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${isUrlMode ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>🌐 Từ link</button>
          </div>
          {!isUrlMode ? (
            <div onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) addImageFiles(e.dataTransfer.files); }} className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-orange-400 transition-colors bg-gray-50">
              <p className="text-sm text-gray-600">Kéo & thả ảnh vào đây hoặc</p>
              <div className="mt-2">
                <label className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg cursor-pointer hover:bg-orange-700">Chọn ảnh
                  <input type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) addImageFiles(e.target.files); }} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG • Tối đa 10 ảnh</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
                <button type="button" onClick={addImageFromUrl} disabled={!imageUrl.trim()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Thêm</button>
              </div>
              <p className="text-xs text-gray-500">💡 Nhập link ảnh từ mạng (JPG, PNG, JPEG, WebP)</p>
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt="preview" className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm" />
                  <button type="button" onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100" aria-label="remove">×</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Video URL</label>
            <input name="videoUrl" value={form.videoUrl} onChange={onChange} type="url" placeholder="VD: https://youtube.com/watch?v=abc123" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors" />
          </div>
        </div>
      </SectionCard>
      )}

            {/* ============================================================================
                NAVIGATION BAR
                ============================================================================ */}
            {/* Navigation Bar */}
            <div className="pt-4 border-t border-gray-200">
              {/* Info Banner
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Hướng dẫn:</p>
                    <ul className="space-y-1 text-xs">
                     
                      <li>• <strong>Lưu và đăng sản phẩm:</strong> Cần đầy đủ thông tin bắt buộc để sản phẩm hiển thị công khai</li>
                    </ul>
                  </div>
                </div>
              </div> */}
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button type="button" onClick={goBack} className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Quay lại</button>
              )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Next/Publish Button */}
                  {currentStep < 3 ? (
                <button type="button" onClick={goNext} className="px-5 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700">Tiếp tục</button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={!canSubmit || submitting} 
                      className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${
                        !canSubmit || submitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      {submitting ? 'Đang lưu...' : 'Lưu và đăng sản phẩm'}
                </button>
              )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ============================================================================
            RIGHT SIDEBAR - CONTENT CHECK PANEL
            ============================================================================ */}
        {/* Right Sidebar - Content Check Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Kiểm tra nội dung</h3>
                  <button 
                    onClick={() => setShowContentCheck(!showContentCheck)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showContentCheck ? '−' : '+'}
                  </button>
                </div>
              </div>
              
              {showContentCheck && (
                <div className="p-4 space-y-4">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Thông tin cơ bản</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.basic.name ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.basic.name ? 'text-green-700' : 'text-red-700'}>Tên sản phẩm</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.basic.brandName ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.basic.brandName ? 'text-green-700' : 'text-red-700'}>Thương hiệu</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.basic.category ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.basic.category ? 'text-green-700' : 'text-red-700'}>Danh mục</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.basic.shortDescription ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.basic.shortDescription ? 'text-green-700' : 'text-red-700'}>Mô tả ngắn</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Giá & Kho</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.price ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.price ? 'text-green-700' : 'text-red-700'}>Giá sản phẩm</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.sku ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.sku ? 'text-green-700' : 'text-red-700'}>Mã SKU</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.stockQuantity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.stockQuantity ? 'text-green-700' : 'text-red-700'}>Số lượng tồn</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.province ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.province ? 'text-green-700' : 'text-red-700'}>Tỉnh/Thành phố</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.district ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.district ? 'text-green-700' : 'text-red-700'}>Quận/Huyện</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.pricing.ward ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.pricing.ward ? 'text-green-700' : 'text-red-700'}>Phường/Xã</span>
                      </div>
                    </div>
                  </div>

                  {/* Media */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Media</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${contentCheck.checks.media.images ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={contentCheck.checks.media.images ? 'text-green-700' : 'text-red-700'}>Hình ảnh</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Info */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Thông tin bổ sung</h4>
                    <div className="text-xs text-gray-500">
                      {contentCheck.optionalCount}/{contentCheck.totalOptional} trường đã nhập
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(contentCheck.optionalCount / contentCheck.totalOptional) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Publish readiness */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Đăng sản phẩm:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${contentCheck.canSubmit ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {contentCheck.canSubmit ? 'Sẵn sàng' : 'Cần hoàn thiện'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suminputsection;

