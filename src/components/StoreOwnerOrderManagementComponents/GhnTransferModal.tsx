import React, { useState, useEffect, useMemo } from 'react';
import { X, Truck, Loader2, AlertCircle } from 'lucide-react';
import { GhnService, type PickShift } from '../../services/seller/GhnService';
import { StoreService } from '../../services/seller/StoreService';
import { StoreAddressService } from '../../services/seller/StoreAddressService';
import { StoreOrderService } from '../../services/seller/OrderService';
import { ProductService } from '../../services/seller/ProductService';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';
import { showCenterSuccess, showCenterError } from '../../utils/notification';

interface GhnItem {
  name: string;
  code: string;
  quantity: number;
  price: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  category: {
    level1: string;
    level2: string;
    level3: string;
  };
}

interface GhnTransferFormData {
  payment_type_id: number;
  note: string;
  required_note: string;
  from_name: string;
  from_phone: string;
  from_address: string;
  from_ward_name: string;
  from_district_name: string;
  from_province_name: string;
  return_phone: string;
  return_address: string;
  return_district_id: number;
  return_ward_code: string;
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  cod_amount: number;
  content: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  pick_station_id: number;
  insurance_value: number;
  service_id: number;
  service_type_id: number;
  coupon: string;
  pick_shift: number[];
  items: GhnItem[];
}

interface Props {
  orderId: string;
  storeOrderTotal?: number;
  onClose: () => void;
  onSubmit?: (data: GhnTransferFormData) => void;
}

const PROVINCE_PREFIXES = ['tinh', 'thanh pho', 'tp'];
const DISTRICT_PREFIXES = ['quan', 'huyen', 'thi xa', 'thi tran', 'tx', 'tp'];
const WARD_PREFIXES = ['phuong', 'xa', 'thi tran', 'tt'];

const PROVINCE_ALIASES: Record<string, string> = {
  hcm: 'ho chi minh',
  'ho chi minh city': 'ho chi minh',
  'sai gon': 'ho chi minh',
  sg: 'ho chi minh',
  'tp hcm': 'ho chi minh',
  'tp ho chi minh': 'ho chi minh',
  hn: 'ha noi',
  'tp ha noi': 'ha noi',
  'ha noi city': 'ha noi',
};

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripPrefix = (value: string, prefixes: string[]): string => {
  for (const prefix of prefixes) {
    if (value === prefix) {
      return '';
    }
    if (value.startsWith(`${prefix} `)) {
      return value.slice(prefix.length + 1).trim();
    }
  }
  return value;
};

const buildVariants = (
  rawValue: string,
  prefixes: string[],
  aliasMap?: Record<string, string>
): string[] => {
  const normalized = normalizeText(rawValue);
  const variants = new Set<string>();
  if (normalized) {
    variants.add(aliasMap?.[normalized] || normalized);
  }
  const stripped = stripPrefix(normalized, prefixes);
  if (stripped && stripped !== normalized) {
    variants.add(aliasMap?.[stripped] || stripped);
  }
  return Array.from(variants).filter(Boolean);
};

const isAdministrativeMatch = (
  candidate: string,
  target: string,
  prefixes: string[],
  aliasMap?: Record<string, string>,
  extraTargets: string[] = []
): boolean => {
  const candidateVariants = buildVariants(candidate, prefixes, aliasMap);
  const targetVariants = [
    ...buildVariants(target, prefixes, aliasMap),
    ...extraTargets.flatMap((extra) => buildVariants(extra, prefixes, aliasMap)),
  ].filter(Boolean);

  return candidateVariants.some((candidateVariant) =>
    targetVariants.some(
      (targetVariant) =>
        candidateVariant === targetVariant ||
        candidateVariant.includes(targetVariant) ||
        targetVariant.includes(candidateVariant)
    )
  );
};

const parseAddressSegments = (address: string) => {
  if (!address) {
    return {};
  }
  const cleaned = address.replace(/[.]/g, ',');
  const parts = cleaned
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  const province = parts[parts.length - 1];
  const district = parts.length >= 2 ? parts[parts.length - 2] : undefined;
  const ward = parts.length >= 3 ? parts[parts.length - 3] : undefined;

  return { province, district, ward };
};

const GhnTransferModal: React.FC<Props> = ({ orderId, storeOrderTotal, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<GhnTransferFormData>({
    payment_type_id: 1, // Mặc định: Shop trả phí ship
    note: '',
    required_note: '',
    from_name: '',
    from_phone: '',
    from_address: '',
    from_ward_name: '',
    from_district_name: '',
    from_province_name: '',
    return_phone: '',
    return_address: '',
    return_district_id: 0,
    return_ward_code: '',
    to_name: '',
    to_phone: '',
    to_address: '',
    to_ward_code: '',
    to_district_id: 0,
    cod_amount: 0,
    content: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    pick_station_id: 0,
    insurance_value: 0,
    service_id: 0,
    service_type_id: 0,
    coupon: '',
    pick_shift: [],
    items: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickShifts, setPickShifts] = useState<PickShift[]>([]);
  const [isLoadingPickShifts, setIsLoadingPickShifts] = useState(false);
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(false);
  // Track which items have level2/level3 category fields visible
  const [itemCategoryLevels, setItemCategoryLevels] = useState<Record<number, { level2: boolean; level3: boolean }>>({});
  
  // Address selection states (from address)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [addressValidationError, setAddressValidationError] = useState<string>('');
  const [parsedAddressSegmentsValue, setParsedAddressSegmentsValue] = useState<{
    province?: string;
    district?: string;
    ward?: string;
  }>({});
  
  // GHN Hooks for cascading dropdowns (from address only)
  const { provinces, loading: provincesLoading } = useProvinces();
  const { districts, loading: districtsLoading, clearDistricts } = useDistricts(selectedProvinceId);
  const { wards, loading: wardsLoading, clearWards } = useWards(selectedDistrictId);
  
  // Get selected objects
  const selectedProvince = useMemo(
    () => provinces.find(p => p.ProvinceID === selectedProvinceId) || null,
    [provinces, selectedProvinceId]
  );
  const selectedDistrict = useMemo(
    () => districts.find(d => d.DistrictID === selectedDistrictId) || null,
    [districts, selectedDistrictId]
  );
  const selectedWard = useMemo(
    () => wards.find(w => w.WardCode === selectedWardCode) || null,
    [wards, selectedWardCode]
  );

  // Load store info and pick shifts when modal opens
  useEffect(() => {
    if (!orderId) {
      console.warn('OrderId is missing, cannot load order details');
      return;
    }

    const loadData = async () => {
      // Load pick shifts
      try {
        setIsLoadingPickShifts(true);
        const response = await GhnService.getPickShifts();
        if (response.code === 200 && response.data) {
          setPickShifts(response.data);
        }
      } catch (error: any) {
        console.error('Error loading pick shifts:', error);
      } finally {
        setIsLoadingPickShifts(false);
      }

      // Load order details to get customer information (separate try-catch to not affect store info loading)
      try {
        setIsLoadingStoreInfo(true);
        
        // Load order details to get customer info
        const order = await StoreOrderService.getOrderById(orderId);
        
        if (order) {
          console.log('📦 Order loaded:', order);
          
          // Extract customer information from order
          const customerId = order.customerId;
          // Use shipReceiverName and shipPhoneNumber instead of customerName and customerPhone
          const shipReceiverName = order.shipReceiverName;
          const shipPhoneNumber = order.shipPhoneNumber;
          
          // Initialize to address fields with shipping receiver name and phone
          let toAddressData: Partial<GhnTransferFormData> = {
            to_name: shipReceiverName || '',
            to_phone: shipPhoneNumber || '',
          };
          
          // Load customer addresses if customerId exists
          if (customerId) {
            try {
              console.log('📍 Loading customer addresses for customerId:', customerId);
              const customerAddresses = await StoreOrderService.getCustomerAddresses(customerId);
              console.log('✅ Customer addresses loaded:', customerAddresses);
              
              // Find default address or use first address
              const defaultAddress = customerAddresses.find(addr => addr.default) || customerAddresses[0];
              
              if (defaultAddress) {
                console.log('📍 Using address:', defaultAddress);
                
                // Build address string from address components
                const addressParts = [
                  defaultAddress.addressLine,
                  defaultAddress.street,
                  defaultAddress.ward,
                  defaultAddress.district,
                  defaultAddress.province
                ].filter(Boolean); // Remove empty parts
                
                const fullAddress = addressParts.join(', ');
                
                // Add address fields to toAddressData
                toAddressData = {
                  ...toAddressData,
                  to_address: fullAddress,
                  to_ward_code: defaultAddress.wardCode || '',
                  to_district_id: defaultAddress.districtId || 0,
                };
                
                console.log('✅ To address prepared:', {
                  address: fullAddress,
                  wardCode: defaultAddress.wardCode,
                  districtId: defaultAddress.districtId,
                });
              } else {
                console.warn('⚠️ No customer address found');
              }
            } catch (error: any) {
              console.error('❌ Error loading customer addresses:', error);
              // Don't throw - continue with customer name and phone only
            }
          }
          
          // Map order items to GHN items format
          // For each item, fetch product detail to get SKU
          try {
            const totalAmount = storeOrderTotal ?? order.grandTotal ?? 0;
            const totalQuantity = order.items.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            );

            const pricePerItem =
              totalQuantity > 0 ? Math.round(totalAmount / totalQuantity) : 0;

            console.log('📦 Loading product details for items...');
            const ghnItemsPromises = order.items.map(async (item) => {
              let productCode = item.refId || item.id || '';
              
              // Fetch product detail to get SKU
              if (item.refId) {
                try {
                  console.log(`🔍 Fetching product detail for refId: ${item.refId}`);
                  const product = await ProductService.getProductById(item.refId);
                  // Product response may be wrapped in data property
                  const productData = (product as any).data || product;
                  productCode = productData.sku || productCode;
                  console.log(`✅ Product SKU loaded: ${productCode}`);
                } catch (error: any) {
                  console.warn(`⚠️ Failed to load product detail for ${item.refId}:`, error);
                  // Continue with refId as fallback
                }
              }
              
              return {
                name: item.name || '',
                code: productCode,
                quantity: item.quantity || 1,
                price: pricePerItem,
                length: 0,
                width: 0,
                height: 0,
                weight: 0,
                category: {
                  level1: 'PRODUCT', // Mặc định: PRODUCT
                  level2: '',
                  level3: '',
                },
              };
            });

            // Wait for all product details to load
            const ghnItems = await Promise.all(ghnItemsPromises);
            console.log('📦 Mapped GHN items:', ghnItems);

            // Calculate total product value for COD amount
            const totalProductValue = ghnItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

            // Set all to address fields and items at once, auto-set COD amount
            setFormData(prev => ({
              ...prev,
              ...toAddressData,
              items: ghnItems,
              cod_amount: totalProductValue, // Tự động set COD = tổng giá trị sản phẩm
            }));
          } catch (error: any) {
            console.error('❌ Error loading product details:', error);
            // Fallback: use items without SKU
            const fallbackTotalAmount = storeOrderTotal ?? order.grandTotal ?? 0;
            const fallbackQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const fallbackPerItem = fallbackQuantity > 0 ? Math.round(fallbackTotalAmount / fallbackQuantity) : 0;
            const ghnItems: GhnItem[] = order.items.map((item) => ({
              name: item.name || '',
              code: item.refId || item.id || '',
              quantity: item.quantity || 1,
              price: fallbackPerItem,
              length: 0,
              width: 0,
              height: 0,
              weight: 0,
              category: {
                level1: 'PRODUCT', // Mặc định: PRODUCT
                level2: '',
                level3: '',
              },
            }));
            
            // Calculate total product value for COD amount
            const totalProductValue = ghnItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

            setFormData(prev => ({
              ...prev,
              ...toAddressData,
              items: ghnItems,
              cod_amount: totalProductValue, // Tự động set COD = tổng giá trị sản phẩm
            }));
          }
        } else {
          console.warn('⚠️ Order not found or returned null');
        }
      } catch (error: any) {
        console.error('❌ Error loading order details:', error);
        // Don't throw - continue to load store info even if order loading fails
        showCenterError(
          `Không thể tải thông tin đơn hàng: ${error?.message || 'Lỗi không xác định'}. Vui lòng nhập thủ công thông tin người nhận.`,
          'Cảnh báo'
        );
      }

      // Load store info and address (for "from" address) - separate try-catch
      try {
        setIsLoadingStoreInfo(true);
        
        // Get store info from API /api/stores/{storeId}
        // API returns: { status: 200, message: "...", data: { storeName: "...", phoneNumber: "..." } }
        // StoreService.getStoreInfo() internally calls getStoreId() and fetches from /api/stores/{storeId}
        const response = await StoreService.getStoreInfo();
        
        // Handle response format: response might be the data object directly or wrapped
        // API response structure: { status: 200, message: "...", data: { storeName, phoneNumber, ... } }
        // StoreService.getStoreInfo() returns data.data || data, so we need to check for storeName
        const storeName = (response as any).storeName || (response as any).name || '';
        const phoneNumber = (response as any).phoneNumber || '';
        
        // Get store addresses and find default address
        const addresses = await StoreAddressService.getStoreAddresses();
        const defaultAddress = addresses?.find(addr => addr.defaultAddress) || addresses?.[0];
        
        if (defaultAddress) {
          // Parse full address string to extract detailed address (số nhà, tên đường)
          let detailedAddress = defaultAddress.address || '';
          
          // Convert districtCode and wardCode for return address
          // districtCode is stored as string in StoreAddress, but GHN API needs number (DistrictID)
          const returnDistrictId = defaultAddress.districtCode ? Number(defaultAddress.districtCode) : 0;
          const returnWardCode = defaultAddress.wardCode || '';
          
          // Auto-fill form with store information (from address)
          // Note: We don't set selectedProvinceId/districtId/wardCode here
          // Instead, let the parse logic auto-select them from the address string
          setFormData(prev => ({
            ...prev,
            from_name: storeName,
            from_phone: phoneNumber,
            from_address: detailedAddress,
            // Auto-fill return address (địa chỉ trả hàng) with store address
            return_phone: phoneNumber,
            return_address: detailedAddress,
            return_district_id: returnDistrictId,
            return_ward_code: returnWardCode,
          }));
        } else {
          // If no address, at least fill store name and phone
          setFormData(prev => ({
            ...prev,
            from_name: storeName,
            from_phone: phoneNumber,
            // Still fill return phone even if no address
            return_phone: phoneNumber,
          }));
        }
      } catch (error: any) {
        console.error('❌ Error loading store info:', error);
        showCenterError(
          `Không thể tải thông tin cửa hàng: ${error?.message || 'Lỗi không xác định'}`,
          'Lỗi'
        );
      } finally {
        setIsLoadingStoreInfo(false);
      }

    };

    loadData();
  }, [orderId]);

  useEffect(() => {
    if (!formData.from_address) {
      setParsedAddressSegmentsValue({});
      return;
    }
    const parsed = parseAddressSegments(formData.from_address);
    console.log('📍 Parsed address segments:', parsed);
    setParsedAddressSegmentsValue(parsed);
  }, [formData.from_address]);


  const handleInputChange = (field: keyof GhnTransferFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof GhnItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      
      // Auto-update COD amount when item price or quantity changes
      const totalProductValue = updatedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      
      return {
        ...prev,
        items: updatedItems,
        cod_amount: totalProductValue,
      };
    });
  };

  const handleCategoryChange = (index: number, level: 'level1' | 'level2' | 'level3', value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              category: {
                ...item.category,
                [level]: value,
              },
            }
          : item
      ),
    }));
  };

  const toggleCategoryLevel = (itemIndex: number, level: 'level2' | 'level3') => {
    setItemCategoryLevels(prev => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        [level]: !prev[itemIndex]?.[level],
      },
    }));
  };

  // Helper function to format number with dot separator (1.000.000)
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };



  const handlePickShiftChange = (shiftId: number) => {
    setFormData(prev => ({
      ...prev,
      pick_shift: [shiftId],
    }));
  };

  // Handle province selection
  const handleProvinceChange = (provinceId: number | null) => {
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId(null);
    setSelectedWardCode('');
    clearDistricts();
    clearWards();
    
    if (provinceId) {
      const province = provinces.find(p => p.ProvinceID === provinceId);
      handleInputChange('from_province_name', province?.ProvinceName || '');
      handleInputChange('from_district_name', '');
      handleInputChange('from_ward_name', '');
    } else {
      handleInputChange('from_province_name', '');
      handleInputChange('from_district_name', '');
      handleInputChange('from_ward_name', '');
    }
    validateAddress();
  };

  // Handle district selection
  const handleDistrictChange = (districtId: number | null) => {
    setSelectedDistrictId(districtId);
    setSelectedWardCode('');
    clearWards();
    
    if (districtId) {
      const district = districts.find(d => d.DistrictID === districtId);
      handleInputChange('from_district_name', district?.DistrictName || '');
      handleInputChange('from_ward_name', '');
    } else {
      handleInputChange('from_district_name', '');
      handleInputChange('from_ward_name', '');
    }
    validateAddress();
  };

  // Handle ward selection
  const handleWardChange = (wardCode: string) => {
    setSelectedWardCode(wardCode);
    
    if (wardCode) {
      const ward = wards.find(w => w.WardCode === wardCode);
      handleInputChange('from_ward_name', ward?.WardName || '');
    } else {
      handleInputChange('from_ward_name', '');
    }
    validateAddress();
  };

  // Validate if selected address matches from_address
  const validateAddress = () => {
    if (!formData.from_address || !selectedProvince || !selectedDistrict || !selectedWard) {
      setAddressValidationError('');
      return;
    }

    const addressLower = formData.from_address.toLowerCase();
    const provinceNameLower = selectedProvince.ProvinceName.toLowerCase();
    const districtNameLower = selectedDistrict.DistrictName.toLowerCase();
    const wardNameLower = selectedWard.WardName.toLowerCase();

    // Check if address contains province, district, ward names
    const hasProvince = addressLower.includes(provinceNameLower) || 
                       selectedProvince.NameExtension.some(ext => addressLower.includes(ext.toLowerCase()));
    const hasDistrict = addressLower.includes(districtNameLower) || 
                       selectedDistrict.NameExtension.some(ext => addressLower.includes(ext.toLowerCase()));
    const hasWard = addressLower.includes(wardNameLower) || 
                   selectedWard.NameExtension.some(ext => addressLower.includes(ext.toLowerCase()));

    if (!hasProvince || !hasDistrict || !hasWard) {
      setAddressValidationError('Địa chỉ chi tiết không khớp với tỉnh/quận/phường đã chọn. Vui lòng kiểm tra lại.');
    } else {
      setAddressValidationError('');
    }
  };

  // Auto-select district and ward when they are loaded
  useEffect(() => {
    if (districts.length > 0 && selectedProvinceId) {
      const loadDefaultDistrict = async () => {
        try {
          const storeAddresses = await StoreAddressService.getStoreAddresses();
          const defaultAddr = storeAddresses?.find(addr => addr.defaultAddress) || storeAddresses?.[0];
          
          if (defaultAddr?.districtCode && !selectedDistrictId) {
            const districtId = Number(defaultAddr.districtCode);
            if (!isNaN(districtId)) {
              setSelectedDistrictId(districtId);
            }
          }
        } catch (error) {
          console.error('Error loading default address for district selection:', error);
        }
      };
      loadDefaultDistrict();
    }
  }, [districts, selectedProvinceId, selectedDistrictId]);

  useEffect(() => {
    if (wards.length > 0 && selectedDistrictId) {
      const loadDefaultWard = async () => {
        try {
          const storeAddresses = await StoreAddressService.getStoreAddresses();
          const defaultAddr = storeAddresses?.find(addr => addr.defaultAddress) || storeAddresses?.[0];
          
          if (defaultAddr?.wardCode && !selectedWardCode) {
            setSelectedWardCode(defaultAddr.wardCode);
          }
        } catch (error) {
          console.error('Error loading default address for ward selection:', error);
        }
      };
      loadDefaultWard();
    }
  }, [wards, selectedDistrictId, selectedWardCode]);

  useEffect(() => {
    if (
      !parsedAddressSegmentsValue.province ||
      provincesLoading ||
      provinces.length === 0
    ) {
      return;
    }

    console.log('🔍 Auto-selecting province from:', parsedAddressSegmentsValue.province);

    // Find matching province from parsed address
    const matchedProvince = provinces.find((province) =>
      isAdministrativeMatch(
        parsedAddressSegmentsValue.province as string,
        province.ProvinceName,
        PROVINCE_PREFIXES,
        PROVINCE_ALIASES,
        province.NameExtension
      )
    );

    console.log('✅ Matched province:', matchedProvince?.ProvinceName, matchedProvince?.ProvinceID);

    // Auto-select province if matched and not already selected, or if different from current
    if (matchedProvince) {
      if (!selectedProvinceId || selectedProvinceId !== matchedProvince.ProvinceID) {
        console.log('🎯 Setting province to:', matchedProvince.ProvinceID);
        handleProvinceChange(matchedProvince.ProvinceID);
      } else {
        console.log('⏭️ Province already selected:', selectedProvinceId);
      }
    } else {
      console.log('❌ No matching province found');
    }
  }, [
    parsedAddressSegmentsValue.province,
    provinces,
    provincesLoading,
    selectedProvinceId,
  ]);

  useEffect(() => {
    if (
      !parsedAddressSegmentsValue.district ||
      !selectedProvinceId ||
      districtsLoading ||
      districts.length === 0
    ) {
      return;
    }

    console.log('🔍 Auto-selecting district from:', parsedAddressSegmentsValue.district);

    // Find matching district from parsed address
    const matchedDistrict = districts.find((district) =>
      isAdministrativeMatch(
        parsedAddressSegmentsValue.district as string,
        district.DistrictName,
        DISTRICT_PREFIXES,
        undefined,
        district.NameExtension
      )
    );

    console.log('✅ Matched district:', matchedDistrict?.DistrictName, matchedDistrict?.DistrictID);

    // Auto-select district if matched and not already selected, or if different from current
    if (matchedDistrict) {
      if (!selectedDistrictId || selectedDistrictId !== matchedDistrict.DistrictID) {
        console.log('🎯 Setting district to:', matchedDistrict.DistrictID);
        handleDistrictChange(matchedDistrict.DistrictID);
      } else {
        console.log('⏭️ District already selected:', selectedDistrictId);
      }
    } else {
      console.log('❌ No matching district found');
    }
  }, [
    parsedAddressSegmentsValue.district,
    selectedProvinceId,
    selectedDistrictId,
    districts,
    districtsLoading,
  ]);

  useEffect(() => {
    if (
      !parsedAddressSegmentsValue.ward ||
      !selectedDistrictId ||
      wardsLoading ||
      wards.length === 0
    ) {
      return;
    }

    console.log('🔍 Auto-selecting ward from:', parsedAddressSegmentsValue.ward);

    // Find matching ward from parsed address
    const matchedWard = wards.find((ward) =>
      isAdministrativeMatch(
        parsedAddressSegmentsValue.ward as string,
        ward.WardName,
        WARD_PREFIXES,
        undefined,
        ward.NameExtension
      )
    );

    console.log('✅ Matched ward:', matchedWard?.WardName, matchedWard?.WardCode);

    // Auto-select ward if matched and not already selected, or if different from current
    if (matchedWard) {
      if (!selectedWardCode || selectedWardCode !== matchedWard.WardCode) {
        console.log('🎯 Setting ward to:', matchedWard.WardCode);
        handleWardChange(matchedWard.WardCode);
      } else {
        console.log('⏭️ Ward already selected:', selectedWardCode);
      }
    } else {
      console.log('❌ No matching ward found');
    }
  }, [
    parsedAddressSegmentsValue.ward,
    selectedDistrictId,
    selectedWardCode,
    wards,
    wardsLoading,
  ]);

  // Validate address when from_address or selections change
  useEffect(() => {
    validateAddress();
  }, [formData.from_address, selectedProvince, selectedDistrict, selectedWard]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.payment_type_id || !formData.service_type_id || !formData.required_note) {
        showCenterError('Vui lòng điền đầy đủ thông tin bắt buộc', 'Lỗi');
        return;
      }

      if (!formData.from_name || !formData.from_phone || !formData.from_address) {
        showCenterError('Vui lòng điền đầy đủ thông tin người gửi', 'Lỗi');
        return;
      }

      if (!formData.to_name || !formData.to_phone || !formData.to_address || !formData.to_ward_code || !formData.to_district_id) {
        showCenterError('Vui lòng điền đầy đủ thông tin người nhận', 'Lỗi');
        return;
      }

      if (formData.items.length === 0) {
        showCenterError('Vui lòng thêm ít nhất một sản phẩm', 'Lỗi');
        return;
      }

      // Calculate total dimensions and weight from items
      const totalItemWeight = formData.items.reduce((sum, item) => sum + (item.weight || 0), 0);
      const totalItemLength = formData.items.reduce((sum, item) => sum + (item.length || 0), 0);
      const totalItemWidth = formData.items.reduce((sum, item) => sum + (item.width || 0), 0);
      const totalItemHeight = formData.items.reduce((sum, item) => sum + (item.height || 0), 0);
      
      // Calculate total product value (price * quantity for all items)
      const totalProductValue = formData.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      // Validate package information must be >= total items
      if (!formData.weight || formData.weight < totalItemWeight) {
        showCenterError(`Trọng lượng kiện hàng (${formData.weight || 0}g) phải lớn hơn hoặc bằng tổng trọng lượng sản phẩm (${totalItemWeight}g)`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }
      if (!formData.length || formData.length < totalItemLength) {
        showCenterError(`Chiều dài kiện hàng (${formData.length || 0}cm) phải lớn hơn hoặc bằng tổng chiều dài sản phẩm (${totalItemLength}cm)`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }
      if (!formData.width || formData.width < totalItemWidth) {
        showCenterError(`Chiều rộng kiện hàng (${formData.width || 0}cm) phải lớn hơn hoặc bằng tổng chiều rộng sản phẩm (${totalItemWidth}cm)`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }
      if (!formData.height || formData.height < totalItemHeight) {
        showCenterError(`Chiều cao kiện hàng (${formData.height || 0}cm) phải lớn hơn hoặc bằng tổng chiều cao sản phẩm (${totalItemHeight}cm)`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }

      // Validate COD amount must be <= total product value
      if (formData.cod_amount && formData.cod_amount > 0) {
        if (formData.cod_amount > totalProductValue) {
          showCenterError(
            `Số tiền thu hộ (${formData.cod_amount.toLocaleString('vi-VN')} VND) không được vượt quá tổng giá trị sản phẩm (${totalProductValue.toLocaleString('vi-VN')} VND)`,
            'Lỗi'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Validate required fields for each item
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.length || item.length <= 0) {
          showCenterError(`Sản phẩm #${i + 1}: Vui lòng nhập chiều dài`, 'Lỗi');
          setIsSubmitting(false);
          return;
        }
        if (!item.width || item.width <= 0) {
          showCenterError(`Sản phẩm #${i + 1}: Vui lòng nhập chiều rộng`, 'Lỗi');
          setIsSubmitting(false);
          return;
        }
        if (!item.height || item.height <= 0) {
          showCenterError(`Sản phẩm #${i + 1}: Vui lòng nhập chiều cao`, 'Lỗi');
          setIsSubmitting(false);
          return;
        }
        if (!item.weight || item.weight <= 0) {
          showCenterError(`Sản phẩm #${i + 1}: Vui lòng nhập trọng lượng`, 'Lỗi');
          setIsSubmitting(false);
          return;
        }
        if (!item.category.level1 || item.category.level1.trim() === '') {
          showCenterError(`Sản phẩm #${i + 1}: Vui lòng nhập danh mục Level 1`, 'Lỗi');
          setIsSubmitting(false);
          return;
        }
      }

      // Validate pick shift is required
      if (!formData.pick_shift || formData.pick_shift.length === 0 || !formData.pick_shift[0]) {
        showCenterError('Vui lòng chọn ca lấy hàng', 'Lỗi');
        setIsSubmitting(false);
        return;
      }

      // Get province, district, ward names from selected dropdowns if available
      const fromProvinceName = selectedProvince?.ProvinceName || formData.from_province_name;
      const fromDistrictName = selectedDistrict?.DistrictName || formData.from_district_name;
      const fromWardName = selectedWard?.WardName || formData.from_ward_name;

      // Prepare request data - match API format exactly
      const requestData: any = {
        payment_type_id: formData.payment_type_id,
        required_note: formData.required_note,
        from_name: formData.from_name,
        from_phone: formData.from_phone,
        from_address: formData.from_address,
        from_ward_name: fromWardName,
        from_district_name: fromDistrictName,
        from_province_name: fromProvinceName,
        to_name: formData.to_name,
        to_phone: formData.to_phone,
        to_address: formData.to_address,
        to_ward_code: formData.to_ward_code,
        to_district_id: formData.to_district_id,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        service_type_id: formData.service_type_id,
        items: formData.items.map(item => {
          const category: any = {};
          if (item.category.level1) category.level1 = item.category.level1;
          if (item.category.level2) category.level2 = item.category.level2;
          if (item.category.level3) category.level3 = item.category.level3;
          
          return {
            name: item.name,
            code: item.code,
            quantity: item.quantity,
            price: item.price,
            length: item.length,
            width: item.width,
            height: item.height,
            weight: item.weight,
            category: category,
          };
        }),
      };

      // Add optional fields only if they have values
      if (formData.note && formData.note.trim()) {
        requestData.note = formData.note;
      }

      if (formData.return_phone && formData.return_phone.trim()) {
        requestData.return_phone = formData.return_phone;
      }

      if (formData.return_address && formData.return_address.trim()) {
        requestData.return_address = formData.return_address;
      }

      if (formData.return_district_id && formData.return_district_id > 0) {
        requestData.return_district_id = formData.return_district_id;
      }

      if (formData.return_ward_code && formData.return_ward_code.trim()) {
        requestData.return_ward_code = formData.return_ward_code;
      }

      if (formData.cod_amount && formData.cod_amount > 0) {
        requestData.cod_amount = formData.cod_amount;
      }

      if (formData.content && formData.content.trim()) {
        requestData.content = formData.content;
      }

      if (formData.pick_station_id && formData.pick_station_id > 0) {
        requestData.pick_station_id = formData.pick_station_id;
      }

      if (formData.insurance_value && formData.insurance_value > 0) {
        requestData.insurance_value = formData.insurance_value;
      }

      if (formData.service_id && formData.service_id > 0) {
        requestData.service_id = formData.service_id;
      }

      if (formData.coupon && formData.coupon.trim()) {
        requestData.coupon = formData.coupon;
      } else {
        requestData.coupon = null;
      }

      if (formData.pick_shift && formData.pick_shift.length > 0) {
        requestData.pick_shift = formData.pick_shift;
      }

      // Log request data for debugging
      console.log('📤 GHN Create Order Request:', JSON.stringify(requestData, null, 2));

      // Call API
      const response = await GhnService.createOrder(requestData);

      // Log full response to console
      console.log('📦 GHN Create Order Response:', JSON.stringify(response, null, 2));
      console.log('📦 GHN Response Object:', response);

      if (response.code === 200 && response.data) {
        // Extract response data
        const responseData = response.data;
        const { order_code, expected_delivery_time, total_fee, fee } = responseData;
        
        // Log detailed response information
        console.log('✅ GHN Order Created Successfully!');
        console.log('📋 Order Details:', {
          order_code: order_code,
          expected_delivery_time: expected_delivery_time,
          total_fee: total_fee,
          fee: fee,
        });
        console.log('💰 Fee Breakdown:', {
          main_service: fee?.main_service || 0,
          insurance: fee?.insurance || 0,
          station_do: fee?.station_do || 0,
          station_pu: fee?.station_pu || 0,
        });
        
        // Automatically create GHN order record in database
        try {
          console.log('🔄 Creating GHN order record in database...');
          
          // Get storeId from StoreService
          const storeId = await StoreService.getStoreId();
          
          // Prepare request body for /api/v1/ghn-orders
          const ghnOrderRecordData = {
            storeOrderId: orderId,
            storeId: storeId,
            orderGhn: order_code,
            totalFee: total_fee,
            expectedDeliveryTime: expected_delivery_time,
            status: 'READY_PICKUP', // Default status
          };
          
          console.log('📤 GHN Order Record Request:', JSON.stringify(ghnOrderRecordData, null, 2));
          
          // Call API to create GHN order record
          const ghnOrderRecordResponse = await GhnService.createGhnOrderRecord(ghnOrderRecordData);
          
          console.log('✅ GHN Order Record Created Successfully!');
          console.log('📦 GHN Order Record Response:', JSON.stringify(ghnOrderRecordResponse, null, 2));
          console.log('📦 GHN Order Record Response Object:', ghnOrderRecordResponse);
          
          if (ghnOrderRecordResponse.status === 200 || ghnOrderRecordResponse.data) {
            console.log('✅ Successfully saved GHN order to database');
            console.log('📋 Saved Record:', {
              id: ghnOrderRecordResponse.data?.id,
              storeOrderId: ghnOrderRecordResponse.data?.storeOrderId,
              orderGhn: ghnOrderRecordResponse.data?.orderGhn,
              status: ghnOrderRecordResponse.data?.status,
            });
          } else {
            console.warn('⚠️ GHN Order Record API returned unexpected response:', ghnOrderRecordResponse);
          }
        } catch (error: any) {
          console.error('❌ Error creating GHN order record:', error);
          console.error('❌ Error details:', {
            message: error?.message,
            status: error?.status,
            data: error?.data,
          });
          // Don't throw error - just log it, as the main GHN order creation was successful
          showCenterError(
            `Đơn GHN đã được tạo nhưng không thể lưu vào database: ${error?.message || 'Lỗi không xác định'}`,
            'Cảnh báo'
          );
        }
        
        const deliveryDate = new Date(expected_delivery_time).toLocaleString('vi-VN');
        
        showCenterSuccess(
          `Tạo đơn hàng GHN thành công!\n\nMã đơn: ${order_code}\nThời gian giao dự kiến: ${deliveryDate}\nTổng phí: ${total_fee.toLocaleString('vi-VN')} VND`,
          'Thành công',
          5000
        );

        // Call onSubmit callback if provided
        onSubmit?.(formData);

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error('❌ GHN Order Creation Failed:', {
          code: response.code,
          message: response.message,
          response: response,
        });
        showCenterError(response.message || 'Không thể tạo đơn hàng GHN', 'Lỗi');
      }
    } catch (error: any) {
      console.error('Error submitting GHN transfer:', error);
      showCenterError(
        error?.message || 'Không thể tạo đơn hàng GHN. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Chuyển nhượng GHN</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Loại thanh toán phí ship</label>
                  <input
                    type="text"
                    value="Shop trả phí ship"
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Loại dịch vụ *</label>
                  <select
                    value={formData.service_type_id || ''}
                    onChange={(e) => handleInputChange('service_type_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">-- Chọn loại dịch vụ --</option>
                    <option value="1">1: Express</option>
                    <option value="2">2: Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Yêu cầu giao hàng *</label>
                  <select
                    value={formData.required_note || ''}
                    onChange={(e) => handleInputChange('required_note', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">-- Chọn yêu cầu --</option>
                    <option value="CHOTHUHANG">Cho thử hàng</option>
                    <option value="CHOXEMHANGKHONGTHU">Cho xem hàng không thử</option>
                    <option value="KHONGCHOXEMHANG">Không cho xem hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ID dịch vụ cụ thể</label>
                  <input
                    type="number"
                    value={formData.service_id || ''}
                    onChange={(e) => handleInputChange('service_id', Number(e.target.value) || 0)}
                    placeholder="Nhập ID dịch vụ (nếu có)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ghi chú cho shipper</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder='Ví dụ: "Gọi trước khi giao"'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mã giảm giá GHN</label>
                  <input
                    type="text"
                    value={formData.coupon}
                    onChange={(e) => handleInputChange('coupon', e.target.value)}
                    placeholder="Nhập mã giảm giá (nếu có)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* From Address */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Địa chỉ người gửi</h3>
                {isLoadingStoreInfo && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Đang tải thông tin cửa hàng...</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tên người gửi *</label>
                  <input
                    type="text"
                    value={formData.from_name}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.from_phone}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.from_address}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tỉnh/Thành phố *</label>
                  <select
                    value={selectedProvinceId || ''}
                    onChange={(e) => handleProvinceChange(e.target.value ? Number(e.target.value) : null)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {provinces.map((province) => (
                      <option key={province.ProvinceID} value={province.ProvinceID}>
                        {province.ProvinceName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quận/Huyện *</label>
                  <select
                    value={selectedDistrictId || ''}
                    onChange={(e) => handleDistrictChange(e.target.value ? Number(e.target.value) : null)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {districts.map((district) => (
                      <option key={district.DistrictID} value={district.DistrictID}>
                        {district.DistrictName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phường/Xã *</label>
                  <select
                    value={selectedWardCode}
                    onChange={(e) => handleWardChange(e.target.value)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  >
                    <option value="">-- Chọn phường/xã --</option>
                    {wards.map((ward) => (
                      <option key={ward.WardCode} value={ward.WardCode}>
                        {ward.WardName}
                      </option>
                    ))}
                  </select>
                </div>
                {addressValidationError && (
                  <div className="md:col-span-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">{addressValidationError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* To Address */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Địa chỉ người nhận</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tên người nhận *</label>
                  <input
                    type="text"
                    value={formData.to_name}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.to_phone}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.to_address}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                {/* Hidden fields - still in form but not visible for API */}
                <input type="hidden" value={formData.to_name} />
                <input type="hidden" value={formData.to_phone} />
                <input type="hidden" value={formData.to_address} />
                <input type="hidden" value={formData.to_ward_code} />
                <input type="hidden" value={formData.to_district_id} />
              </div>
            </div>

            {/* Return Address */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Địa chỉ trả hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.return_phone}
                    onChange={(e) => handleInputChange('return_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.return_address}
                    onChange={(e) => handleInputChange('return_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Hidden fields - still in form but not visible */}
                <input type="hidden" value={formData.return_district_id} />
                <input type="hidden" value={formData.return_ward_code} />
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Sản phẩm trong đơn</h3>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Sản phẩm #{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tên sản phẩm *</label>
                        <input
                          type="text"
                          value={item.name}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Mã sản phẩm *</label>
                        <input
                          type="text"
                          value={item.code}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Số lượng *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Giá (VND) *</label>
                        <input
                          type="text"
                          value={formatCurrency(item.price)}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều dài (cm) *</label>
                        <input
                          type="number"
                          value={item.length}
                          required
                          onChange={(e) => handleItemChange(index, 'length', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều rộng (cm) *</label>
                        <input
                          type="number"
                          value={item.width}
                          required
                          onChange={(e) => handleItemChange(index, 'width', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều cao (cm) *</label>
                        <input
                          type="number"
                          value={item.height}
                          required
                          onChange={(e) => handleItemChange(index, 'height', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Trọng lượng (gram) *</label>
                        <input
                          type="number"
                          value={item.weight}
                          required
                          onChange={(e) => handleItemChange(index, 'weight', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Danh mục Level 1 *</label>
                        <input
                          type="text"
                          value="Sản phẩm"
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      {itemCategoryLevels[index]?.level2 && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Danh mục Level 2</label>
                          <input
                            type="text"
                            value={item.category.level2}
                            onChange={(e) => handleCategoryChange(index, 'level2', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                      {itemCategoryLevels[index]?.level3 && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Danh mục Level 3</label>
                          <input
                            type="text"
                            value={item.category.level3}
                            onChange={(e) => handleCategoryChange(index, 'level3', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          {!itemCategoryLevels[index]?.level2 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryLevel(index, 'level2')}
                              className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              + Thêm danh mục Level 2
                            </button>
                          )}
                          {!itemCategoryLevels[index]?.level3 && itemCategoryLevels[index]?.level2 && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryLevel(index, 'level3')}
                              className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              + Thêm danh mục Level 3
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để thêm.</p>
                )}
              </div>
            </div>

            {/* Package Information */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin kiện hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Trọng lượng (gram) *</label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 30000 || e.target.value === '') {
                        handleInputChange('weight', value);
                      }
                    }}
                    placeholder="≤ 30.000g"
                    max={30000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 30.000 gram</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chiều dài (cm) *</label>
                  <input
                    type="number"
                    value={formData.length || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('length', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chiều rộng (cm) *</label>
                  <input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('width', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chiều cao (cm) *</label>
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('height', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số tiền thu hộ (VND)</label>
                  <input
                    type="text"
                    value={formatCurrency(formData.cod_amount)}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Giá trị bảo hiểm (VND)</label>
                  <input
                    type="number"
                    value={formData.insurance_value || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 5000000 || e.target.value === '') {
                        handleInputChange('insurance_value', value);
                      }
                    }}
                    placeholder="≤ 5.000.000 VND"
                    max={5000000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 5.000.000 VND</p>
                </div>
              </div>
            </div>

            {/* Pick Shift */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ca lấy hàng *</h3>
              {isLoadingPickShifts ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">Đang tải danh sách ca lấy hàng...</span>
                </div>
              ) : (
                <select
                  value={formData.pick_shift[0] || ''}
                  onChange={(e) => handlePickShiftChange(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Chọn ca lấy hàng * --</option>
                  {pickShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.title}
                    </option>
                  ))}
                </select>
              )}
              {pickShifts.length === 0 && !isLoadingPickShifts && (
                <p className="text-sm text-gray-500 mt-2">Không có ca lấy hàng nào khả dụng</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>Xác nhận chuyển nhượng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GhnTransferModal;

