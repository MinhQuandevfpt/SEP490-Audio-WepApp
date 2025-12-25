import React, { useState, useEffect, useMemo } from 'react';
import { X, Truck, Loader2, AlertCircle, Check } from 'lucide-react';
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


const MAX_BOX_WEIGHT = 30000;      
const MAX_BOX_VOLUME = 50000;     
const MAX_BOX_EDGE = 150;          

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


type Product = {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // gram
};


type PackingResult = {
  canPack: boolean;
  reason: string;
  calculatedDimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    volume: number;
    maxEdge: number;
  };
};


const canPackTogether = (products: Product[]): PackingResult => {
  if (products.length === 0) {
    return {
      canPack: false,
      reason: 'Chưa có sản phẩm nào',
    };
  }

  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (p.length > MAX_BOX_EDGE) {
      return {
        canPack: false,
        reason: `Sản phẩm #${i + 1}: Chiều dài (${p.length}cm) vượt quá giới hạn GHN (${MAX_BOX_EDGE}cm).`,
      };
    }
    if (p.width > MAX_BOX_EDGE) {
      return {
        canPack: false,
        reason: `Sản phẩm #${i + 1}: Chiều rộng (${p.width}cm) vượt quá giới hạn GHN (${MAX_BOX_EDGE}cm).`,
      };
    }
    if (p.height > MAX_BOX_EDGE) {
      return {
        canPack: false,
        reason: `Sản phẩm #${i + 1}: Chiều cao (${p.height}cm) vượt quá giới hạn GHN (${MAX_BOX_EDGE}cm).`,
      };
    }
  }

 
  const totalWeight = products.reduce((sum, p) => sum + p.weight, 0);
  const totalVolume = products.reduce((sum, p) => sum + (p.length * p.width * p.height), 0);


  if (totalWeight > MAX_BOX_WEIGHT) {
    return {
      canPack: false,
      reason: `Tổng cân nặng (${totalWeight.toLocaleString('vi-VN')}g) vượt mức cho phép GHN ${MAX_BOX_WEIGHT.toLocaleString('vi-VN')}g/kiện (30kg).`,
    };
  }

  
  if (totalVolume > MAX_BOX_VOLUME) {
    return {
      canPack: false,
      reason: `Thể tích gộp (${totalVolume.toLocaleString('vi-VN')} cm³) vượt giới hạn đóng kiện (${MAX_BOX_VOLUME.toLocaleString('vi-VN')} cm³).`,
    };
  }
  const combinedLength = products.reduce((sum, p) => sum + p.length, 0);
  const combinedWidth = Math.max(...products.map(p => p.width));
  const combinedHeight = Math.max(...products.map(p => p.height));

  const maxEdge = Math.max(combinedLength, combinedWidth, combinedHeight);
  if (maxEdge > MAX_BOX_EDGE) {
    return {
      canPack: false,
      reason: `Kích thước kiện (cạnh dài nhất: ${maxEdge}cm) vượt quy chuẩn GHN (${MAX_BOX_EDGE}cm).`,
      calculatedDimensions: {
        length: combinedLength,
        width: combinedWidth,
        height: combinedHeight,
        weight: totalWeight,
        volume: totalVolume,
        maxEdge,
      },
    };
  }

  // All checks passed
  return {
    canPack: true,
    reason: 'Đóng chung 1 kiện',
    calculatedDimensions: {
      length: combinedLength,
      width: combinedWidth,
      height: combinedHeight,
      weight: totalWeight,
      volume: totalVolume,
      maxEdge,
    },
  };
};


const parseDimensions = (dimensionString: string | null | undefined): { length: number; width: number; height: number } | null => {
  if (!dimensionString || typeof dimensionString !== 'string') {
    return null;
  }
  const normalized = dimensionString.trim().toLowerCase().replace(/\s+/g, '');
  const patterns = [
    /(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(mm|cm|m)/i,
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|m)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const value1 = parseFloat(match[1]);
      const value2 = parseFloat(match[2]);
      const value3 = parseFloat(match[3]);
      const unit = match[4].toLowerCase();

      if (isNaN(value1) || isNaN(value2) || isNaN(value3)) {
        continue;
      }

     
      let length = value1;
      let width = value2;
      let height = value3;

      if (unit === 'mm') {
        length = value1 / 10; 
        width = value2 / 10;
        height = value3 / 10;
      } else if (unit === 'm') {
        length = value1 * 100;
        width = value2 * 100;
        height = value3 * 100;
      }
     

      return {
        length: Math.round(length * 100) / 100, 
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
      };
    }
  }

  return null;
};

const GhnTransferModal: React.FC<Props> = ({ orderId, storeOrderTotal, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<GhnTransferFormData>({
    payment_type_id: 1, 
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
    service_type_id: 2, // Mặc định chọn Standard
    coupon: '',
    pick_shift: [],
    items: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickShifts, setPickShifts] = useState<PickShift[]>([]);
  const [isLoadingPickShifts, setIsLoadingPickShifts] = useState(false);
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(false);
  
  const [itemCategoryLevels, setItemCategoryLevels] = useState<Record<number, { level2: boolean; level3: boolean }>>({});
  

  const [itemOriginalValues, setItemOriginalValues] = useState<Record<number, {
    length: number;
    width: number;
    height: number;
    weight: number;
  }>>({});
  

  const [itemValidationErrors, setItemValidationErrors] = useState<Record<number, {
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
  }>>({});
  
  
  const [phoneValidationErrors, setPhoneValidationErrors] = useState<{
    from_phone?: string;
    to_phone?: string;
    return_phone?: string;
  }>({});
  
  
  const [packingValidation, setPackingValidation] = useState<PackingResult | null>(null);
  
  
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [addressValidationError, setAddressValidationError] = useState<string>('');
  const [parsedAddressSegmentsValue, setParsedAddressSegmentsValue] = useState<{
    province?: string;
    district?: string;
    ward?: string;
  }>({});
  

  const { provinces, loading: provincesLoading } = useProvinces();
  const { districts, loading: districtsLoading, clearDistricts } = useDistricts(selectedProvinceId);
  const { wards, loading: wardsLoading, clearWards } = useWards(selectedDistrictId);
  

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

 
  useEffect(() => {
    if (!orderId) {
      console.warn('OrderId is missing, cannot load order details');
      return;
    }

    const loadData = async () => {
 
      try {
        setIsLoadingPickShifts(true);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📤 [GHN TRANSFER MODAL] API REQUEST - GET Pick Shifts');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Endpoint: GET /api/ghn/pick-shifts');
        console.log('Request Attributes:');
        console.log('  - Method: GET');
        console.log('  - Headers: { Accept: "*/*" }');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const response = await GhnService.getPickShifts();
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - GET Pick Shifts');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Response Status: Success');
        console.log('Response Attributes:');
        console.log('  - code:', response.code);
        console.log('  - message:', response.message);
        console.log('  - data:', response.data);
        console.log('Response Body (Full):');
        console.log(JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        
        if (response.code === 200 && response.data) {
          setPickShifts(response.data);
        }
      } catch (error: any) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌ [GHN TRANSFER MODAL] API ERROR - GET Pick Shifts');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Stack:', error?.stack);
        console.error('═══════════════════════════════════════════════════════════════');
      } finally {
        setIsLoadingPickShifts(false);
      }

     
      try {
        setIsLoadingStoreInfo(true);
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📤 [GHN TRANSFER MODAL] API REQUEST - GET Order By ID');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Endpoint: GET /api/v1/stores/{storeId}/orders/{orderId}');
        console.log('Request Attributes:');
        console.log('  - Method: GET');
        console.log('  - orderId:', orderId);
        console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*" }');
        console.log('═══════════════════════════════════════════════════════════════');
        
       
        const order = await StoreOrderService.getOrderById(orderId);
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - GET Order By ID');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Response Status: Success');
        console.log('Response Attributes:');
        if (order) {
          console.log('  - id:', order.id);
          console.log('  - customerId:', order.customerId);
          console.log('  - customerName:', order.customerName);
          console.log('  - customerPhone:', order.customerPhone);
          console.log('  - shipReceiverName:', order.shipReceiverName);
          console.log('  - shipPhoneNumber:', order.shipPhoneNumber);
          console.log('  - grandTotal:', order.grandTotal);
          console.log('  - items.length:', order.items?.length || 0);
          console.log('Response Body (Full):');
          console.log(JSON.stringify(order, null, 2));
        } else {
          console.log('  - order: null');
        }
        console.log('═══════════════════════════════════════════════════════════════');
        
        if (order) {
          console.log('📦 Order loaded:', order);
          
         
          const customerId = order.customerId;
         
          const shipReceiverName = order.shipReceiverName;
          const shipPhoneNumber = order.shipPhoneNumber;
          
         
          let toAddressData: Partial<GhnTransferFormData> = {
            to_name: shipReceiverName || '',
            to_phone: shipPhoneNumber || '',
          };
          
         
          if (customerId) {
            try {
              console.log('═══════════════════════════════════════════════════════════════');
              console.log('📤 [GHN TRANSFER MODAL] API REQUEST - GET Customer Addresses');
              console.log('═══════════════════════════════════════════════════════════════');
              console.log('Endpoint: GET /api/v1/stores/{storeId}/orders/customer/{customerId}/addresses');
              console.log('Request Attributes:');
              console.log('  - Method: GET');
              console.log('  - customerId:', customerId);
              console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*" }');
              console.log('═══════════════════════════════════════════════════════════════');
              
              console.log('📍 Loading customer addresses for customerId:', customerId);
              const customerAddresses = await StoreOrderService.getCustomerAddresses(customerId);
              
              console.log('═══════════════════════════════════════════════════════════════');
              console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - GET Customer Addresses');
              console.log('═══════════════════════════════════════════════════════════════');
              console.log('Response Status: Success');
              console.log('Response Attributes:');
              console.log('  - addresses.length:', customerAddresses?.length || 0);
              console.log('  - addresses:', customerAddresses);
              console.log('Response Body (Full):');
              console.log(JSON.stringify(customerAddresses, null, 2));
              console.log('═══════════════════════════════════════════════════════════════');
              
              console.log('✅ Customer addresses loaded:', customerAddresses);
              
             
              const defaultAddress = customerAddresses.find(addr => addr.default) || customerAddresses[0];
              
              if (defaultAddress) {
                console.log('📍 Using address:', defaultAddress);
                
              
                const addressParts = [
                  defaultAddress.addressLine,
                  defaultAddress.street,
                  defaultAddress.ward,
                  defaultAddress.district,
                  defaultAddress.province
                ].filter(Boolean); 
                
                const fullAddress = addressParts.join(', ');
                
               
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
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('❌ [GHN TRANSFER MODAL] API ERROR - GET Customer Addresses');
              console.error('═══════════════════════════════════════════════════════════════');
              console.error('Error:', error);
              console.error('Error Message:', error?.message);
              console.error('Error Status:', error?.status);
              console.error('Error Data:', error?.data);
              console.error('═══════════════════════════════════════════════════════════════');
             
            }
          }
          
        
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
              let productWeight = 0; 
              let productLength = 0; 
              let productWidth = 0; 
              let productHeight = 0; 
              
           
              if (item.refId) {
                try {
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log(`📤 [GHN TRANSFER MODAL] API REQUEST - GET Product By ID (Item: ${item.name})`);
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log('Endpoint: GET /api/v1/stores/{storeId}/products/{productId}');
                  console.log('Request Attributes:');
                  console.log('  - Method: GET');
                  console.log('  - productId (refId):', item.refId);
                  console.log('  - itemName:', item.name);
                  console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*" }');
                  console.log('═══════════════════════════════════════════════════════════════');
                  
                  console.log(`🔍 Fetching product detail for refId: ${item.refId}`);
                  const product = await ProductService.getProductById(item.refId);
                  
                  
                  const productData = (product as any).data || product;
                  productCode = productData.sku || productCode;
                  
                  
                  
                  if (productData?.weight) {
                    productWeight = Math.round(productData.weight * 1000); 
                  }
                  
              
                  if (productData?.dimensions) {
                    const parsedDimensions = parseDimensions(productData.dimensions);
                    if (parsedDimensions) {
                      productLength = parsedDimensions.length;
                      productWidth = parsedDimensions.width;
                      productHeight = parsedDimensions.height;
                    }
                  }
                  
                 
                  if (!productLength && !productWidth && !productHeight) {
                    if (productData?.length) {
                      productLength = productData.length;
                    }
                    if (productData?.width) {
                      productWidth = productData.width;
                    }
                    if (productData?.height) {
                      productHeight = productData.height;
                    }
                  }
                  
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log(`📥 [GHN TRANSFER MODAL] API RESPONSE - GET Product By ID (Item: ${item.name})`);
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log('Response Status: Success');
                  console.log('Response Attributes:');
                  console.log('  - productId:', productData?.productId);
                  console.log('  - name:', productData?.name);
                  console.log('  - sku:', productData?.sku);
                  console.log('  - price:', productData?.price);
                  console.log('  - weight:', productData?.weight, productData?.weight ? `kg (${productWeight} gram)` : '(null)');
                  console.log('  - dimensions (string):', productData?.dimensions || '(null)');
                  console.log('  - dimensions (parsed):');
                  console.log('    + length:', productLength ? `${productLength} cm` : '(null)');
                  console.log('    + width:', productWidth ? `${productWidth} cm` : '(null)');
                  console.log('    + height:', productHeight ? `${productHeight} cm` : '(null)');
                  if (productData?.dimensions && !productLength && !productWidth && !productHeight) {
                    console.log('    ⚠️ Failed to parse dimensions string:', productData.dimensions);
                  }
                  console.log('Response Body (Full):');
                  console.log(JSON.stringify(product, null, 2));
                  console.log('═══════════════════════════════════════════════════════════════');
                  
                
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log('📏 [PRODUCT DIMENSIONS & WEIGHT DETAIL]');
                  console.log('═══════════════════════════════════════════════════════════════');
                  console.log('Product Name:', productData?.name || item.name);
                  console.log('Product ID:', productData?.productId || item.refId);
                  console.log('Weight Information:');
                  console.log('  - Original (from API):', productData?.weight ? `${productData.weight} kg` : 'Not available');
                  console.log('  - Converted (for GHN):', productWeight ? `${productWeight} gram` : 'Not available');
                  console.log('Dimensions Information:');
                  console.log('  - Original (from API):', productData?.dimensions || 'Not available');
                  if (productData?.dimensions) {
                    const parsedDimensions = parseDimensions(productData.dimensions);
                    if (parsedDimensions) {
                      console.log('  - Parsed successfully:', `L: ${parsedDimensions.length}cm x W: ${parsedDimensions.width}cm x H: ${parsedDimensions.height}cm`);
                    } else {
                      console.log('  - ⚠️ Failed to parse dimension string');
                    }
                  }
                  console.log('  - Length:', productLength ? `${productLength} cm` : 'Not available');
                  console.log('  - Width:', productWidth ? `${productWidth} cm` : 'Not available');
                  console.log('  - Height:', productHeight ? `${productHeight} cm` : 'Not available');
                  if (productWeight && productLength && productWidth && productHeight) {
                    console.log('  ✅ Product has complete dimension and weight data - Will auto-fill to form');
                  } else {
                    console.log('  ⚠️ Product missing some dimension or weight data - Manual input required');
                    if (!productWeight) console.log('    - Missing: Weight');
                    if (!productLength) console.log('    - Missing: Length');
                    if (!productWidth) console.log('    - Missing: Width');
                    if (!productHeight) console.log('    - Missing: Height');
                  }
                  console.log('═══════════════════════════════════════════════════════════════');
                  
                  console.log(`✅ Product SKU loaded: ${productCode}`);
                } catch (error: any) {
                  console.error('═══════════════════════════════════════════════════════════════');
                  console.error(`❌ [GHN TRANSFER MODAL] API ERROR - GET Product By ID (Item: ${item.name})`);
                  console.error('═══════════════════════════════════════════════════════════════');
                  console.error('Error:', error);
                  console.error('Error Message:', error?.message);
                  console.error('Error Status:', error?.status);
                  console.error('Error Data:', error?.data);
                  console.error('═══════════════════════════════════════════════════════════════');
                  console.warn(`⚠️ Failed to load product detail for ${item.refId}:`, error);
                 
                }
              }
              
              return {
                name: item.name || '',
                code: productCode,
                quantity: item.quantity || 1,
                price: pricePerItem,
                length: productLength, 
                width: productWidth,   
                height: productHeight, 
                weight: productWeight, 
                category: {
                  level1: 'PRODUCT', 
                  level2: '',
                  level3: '',
                },
              };
            });

            
            const ghnItems = await Promise.all(ghnItemsPromises);
            
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('📦 [GHN TRANSFER MODAL] All Products Loaded - Summary');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('Total Items:', ghnItems.length);
            ghnItems.forEach((ghnItem, index) => {
              console.log(`\nItem #${index + 1}:`);
              console.log('  - Name:', ghnItem.name);
              console.log('  - Code:', ghnItem.code);
              console.log('  - Quantity:', ghnItem.quantity);
              console.log('  - Price:', ghnItem.price, 'VND');
              console.log('  - Dimensions:');
              console.log('    + Length:', ghnItem.length ? `${ghnItem.length} cm` : 'Not set (0)');
              console.log('    + Width:', ghnItem.width ? `${ghnItem.width} cm` : 'Not set (0)');
              console.log('    + Height:', ghnItem.height ? `${ghnItem.height} cm` : 'Not set (0)');
              console.log('  - Weight:', ghnItem.weight ? `${ghnItem.weight} gram` : 'Not set (0)');
              if (ghnItem.length && ghnItem.width && ghnItem.height && ghnItem.weight) {
                console.log('  ✅ Complete dimension and weight data');
              } else {
                console.log('  ⚠️ Missing dimension or weight data - needs manual input');
              }
            });
            console.log('═══════════════════════════════════════════════════════════════');
            
            console.log('📦 Mapped GHN items:', ghnItems);

        
            const totalProductValue = ghnItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

           
            const originalValues: Record<number, { length: number; width: number; height: number; weight: number }> = {};
            ghnItems.forEach((item, index) => {
              if (item.length || item.width || item.height || item.weight) {
                originalValues[index] = {
                  length: item.length || 0,
                  width: item.width || 0,
                  height: item.height || 0,
                  weight: item.weight || 0,
                };
              }
            });
            setItemOriginalValues(originalValues);

            
            setFormData(prev => ({
              ...prev,
              ...toAddressData,
              items: ghnItems,
              cod_amount: totalProductValue, 
            }));
          } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════════');
            console.error('❌ [GHN TRANSFER MODAL] ERROR - Loading Product Details');
            console.error('═══════════════════════════════════════════════════════════════');
            console.error('Error:', error);
            console.error('Error Message:', error?.message);
            console.error('Error Status:', error?.status);
            console.error('Error Data:', error?.data);
            console.error('═══════════════════════════════════════════════════════════════');
            console.error('❌ Error loading product details:', error);
            
            
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('⚠️ [GHN TRANSFER MODAL] FALLBACK MODE - Using Items Without Product Details');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('Note: Items will be created without dimensions and weight');
            console.log('      Manual input required for all dimension and weight fields');
            console.log('═══════════════════════════════════════════════════════════════');
            
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
                level1: 'PRODUCT', 
                level2: '',
                level3: '',
              },
            }));
            
            console.log('📦 [FALLBACK] Items Created (No Dimensions/Weight):');
            ghnItems.forEach((item, index) => {
              console.log(`  Item #${index + 1}: ${item.name}`);
              console.log('    - Dimensions: Not available (all 0)');
              console.log('    - Weight: Not available (0)');
              console.log('    - ⚠️ Manual input required');
            });
            
            
            const totalProductValue = ghnItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

            setFormData(prev => ({
              ...prev,
              ...toAddressData,
              items: ghnItems,
              cod_amount: totalProductValue, 
            }));
          }
        } else {
          console.warn('⚠️ Order not found or returned null');
        }
      } catch (error: any) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌ [GHN TRANSFER MODAL] API ERROR - GET Order By ID');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Status:', error?.status);
        console.error('Error Data:', error?.data);
        console.error('Error Stack:', error?.stack);
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌ Error loading order details:', error);
       
        showCenterError(
          `Không thể tải thông tin đơn hàng: ${error?.message || 'Lỗi không xác định'}. Vui lòng nhập thủ công thông tin người nhận.`,
          'Cảnh báo'
        );
      }

      
      try {
        setIsLoadingStoreInfo(true);
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📤 [GHN TRANSFER MODAL] API REQUEST - GET Store Info');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Endpoint: GET /api/stores/{storeId}');
        console.log('Request Attributes:');
        console.log('  - Method: GET');
        console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*" }');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const response = await StoreService.getStoreInfo();
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - GET Store Info');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Response Status: Success');
        console.log('Response Attributes:');
        console.log('  - status:', (response as any).status);
        console.log('  - message:', (response as any).message);
        console.log('  - storeName:', (response as any).storeName || (response as any).name);
        console.log('  - phoneNumber:', (response as any).phoneNumber);
        console.log('Response Body (Full):');
        console.log(JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        
       
        const storeName = (response as any).storeName || (response as any).name || '';
        const phoneNumber = (response as any).phoneNumber || '';
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📤 [GHN TRANSFER MODAL] API REQUEST - GET Store Addresses');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Endpoint: GET /api/v1/stores/{storeId}/addresses');
        console.log('Request Attributes:');
        console.log('  - Method: GET');
        console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*" }');
        console.log('═══════════════════════════════════════════════════════════════');
        
        
        const addresses = await StoreAddressService.getStoreAddresses();
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - GET Store Addresses');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Response Status: Success');
        console.log('Response Attributes:');
        console.log('  - addresses.length:', addresses?.length || 0);
        console.log('  - addresses:', addresses);
        console.log('Response Body (Full):');
        console.log(JSON.stringify(addresses, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        const defaultAddress = addresses?.find(addr => addr.defaultAddress) || addresses?.[0];
        
        if (defaultAddress) {
         
          let detailedAddress = defaultAddress.address || '';
          
          
          const returnDistrictId = defaultAddress.districtCode ? Number(defaultAddress.districtCode) : 0;
          const returnWardCode = defaultAddress.wardCode || '';
          
          
          setFormData(prev => ({
            ...prev,
            from_name: storeName,
            from_phone: phoneNumber,
            from_address: detailedAddress,
            return_phone: phoneNumber,
            return_address: detailedAddress,
            return_district_id: returnDistrictId,
            return_ward_code: returnWardCode,
          }));
        } else {
          
          setFormData(prev => ({
            ...prev,
            from_name: storeName,
            from_phone: phoneNumber,
           
            return_phone: phoneNumber,
          }));
        }
      } catch (error: any) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌ [GHN TRANSFER MODAL] API ERROR - GET Store Info/Addresses');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Status:', error?.status);
        console.error('Error Data:', error?.data);
        console.error('Error Stack:', error?.stack);
        console.error('═══════════════════════════════════════════════════════════════');
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

  /**
   * Validate dimension or weight value against original product value
   * @param index Item index
   * @param field Field name (length, width, height, weight)
   * @param newValue New value to validate
   * @returns Error message if invalid, null if valid
   */
  const validateItemValue = (
    index: number,
    field: 'length' | 'width' | 'height' | 'weight',
    newValue: number
  ): string | null => {
    const original = itemOriginalValues[index];
    
 
    if (!original || original[field] === 0) {
      return null;
    }

    const originalValue = original[field];
    const numValue = Number(newValue);

    
    if (numValue < originalValue) {
      if (field === 'weight') {
        return `Trọng lượng phải >= ${originalValue} gram (giá trị gốc từ sản phẩm)`;
      } else {
        const fieldName = field === 'length' ? 'Chiều dài' : field === 'width' ? 'Chiều rộng' : 'Chiều cao';
        return `${fieldName} phải >= ${originalValue} cm (giá trị gốc từ sản phẩm)`;
      }
    }

    
    if (field === 'weight') {
   
      const MAX_WEIGHT = 30000;
      if (numValue > MAX_WEIGHT) {
        return `Trọng lượng không được vượt quá 30 kg (30,000 gram). Giá trị tối đa: ${MAX_WEIGHT} gram`;
      }
      
      const increase = numValue - originalValue;
      if (originalValue < 5000) {
       
        const maxValue = Math.min(originalValue + 500, MAX_WEIGHT);
        if (increase > 500) {
          return `Trọng lượng chỉ được tăng tối đa 500 gram so với giá trị gốc (${originalValue} gram). Giá trị tối đa: ${maxValue} gram`;
        }
      } else {
      
        const maxIncrease = Math.round(originalValue * 0.15);
        const maxValue = Math.min(originalValue + maxIncrease, MAX_WEIGHT);
        if (increase > maxIncrease) {
          return `Trọng lượng chỉ được tăng tối đa 15% so với giá trị gốc (${originalValue} gram). Giá trị tối đa: ${maxValue} gram`;
        }
      }
    } else {
     
      const MAX_DIMENSION = 150;
      if (numValue > MAX_DIMENSION) {
        const fieldName = field === 'length' ? 'Chiều dài' : field === 'width' ? 'Chiều rộng' : 'Chiều cao';
        return `${fieldName} không được vượt quá 150 cm (giới hạn GHN). Giá trị tối đa: ${MAX_DIMENSION} cm`;
      }
      
      const increase = numValue - originalValue;
      if (increase > 5) {
        const fieldName = field === 'length' ? 'Chiều dài' : field === 'width' ? 'Chiều rộng' : 'Chiều cao';
        return `${fieldName} chỉ được tăng tối đa 5 cm so với giá trị gốc (${originalValue} cm). Giá trị tối đa: ${Math.min(originalValue + 5, MAX_DIMENSION)} cm`;
      }
    }

    return null;
  };

  const handleItemChange = (index: number, field: keyof GhnItem, value: any) => {
    const numValue = typeof value === 'number' ? value : Number(value) || 0;
    
    
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: numValue } : item
      );
      
  
      const totalProductValue = updatedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      
      return {
        ...prev,
        items: updatedItems,
        cod_amount: totalProductValue,
      };
    });
    
 
    if (field === 'length' || field === 'width' || field === 'height' || field === 'weight') {
      const error = validateItemValue(index, field, numValue);
      
      
      setItemValidationErrors(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: error || undefined,
        },
      }));
    }
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

  
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  
  const maskSensitiveInfo = (value: string | null | undefined): string => {
    if (!value || value.length === 0) return '';
    if (value.length <= 4) return value; 
    const firstTwo = value.slice(0, 2);
    const lastTwo = value.slice(-2);
    return `${firstTwo}...${lastTwo}`;
  };



  const handlePickShiftChange = (shiftId: number) => {
    setFormData(prev => ({
      ...prev,
      pick_shift: [shiftId],
    }));
  };


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


  const validateAddress = () => {
    if (!formData.from_address || !selectedProvince || !selectedDistrict || !selectedWard) {
      setAddressValidationError('');
      return;
    }

    const addressLower = formData.from_address.toLowerCase();
    const provinceNameLower = selectedProvince.ProvinceName.toLowerCase();
    const districtNameLower = selectedDistrict.DistrictName.toLowerCase();
    const wardNameLower = selectedWard.WardName.toLowerCase();

    
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

  
  useEffect(() => {
    validateAddress();
  }, [formData.from_address, selectedProvince, selectedDistrict, selectedWard]);


  useEffect(() => {
    if (formData.items.length === 0) {
      setPackingValidation(null);
      return;
    }

    
    const products: Product[] = formData.items.map(item => ({
      length: item.length || 0,
      width: item.width || 0,
      height: item.height || 0,
      weight: item.weight || 0,
    }));

  
    const packingResult = canPackTogether(products);
    setPackingValidation(packingResult);

   
    if (packingResult.canPack && packingResult.calculatedDimensions) {
      const calculated = packingResult.calculatedDimensions;
      setFormData(prev => ({
        ...prev,
        weight: calculated.weight,
        length: calculated.length,
        width: calculated.width,
        height: calculated.height,
      }));
    }
  }, [formData.items]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

     
      if (!formData.service_type_id || formData.service_type_id === 0) {
        showCenterError('Vui lòng chọn loại dịch vụ', 'Lỗi');
        setIsSubmitting(false);
        return;
      }

      if (!formData.required_note || formData.required_note.trim() === '') {
        showCenterError('Vui lòng chọn yêu cầu giao hàng', 'Lỗi');
        setIsSubmitting(false);
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

      
      if (formData.items.length > 0) {
        const products: Product[] = formData.items.map(item => ({
          length: item.length || 0,
          width: item.width || 0,
          height: item.height || 0,
          weight: item.weight || 0,
        }));

        const packingResult = canPackTogether(products);
        if (!packingResult.canPack) {
          showCenterError(packingResult.reason, 'Lỗi đóng gói');
          setIsSubmitting(false);
          return;
        }
      }
      
      
      const totalProductValue = formData.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      
      const totalItemWeight = formData.items.reduce((sum, item) => sum + (item.weight || 0), 0);
      if (!formData.weight || formData.weight < totalItemWeight) {
        showCenterError(`Trọng lượng kiện hàng (${formData.weight || 0}g) phải lớn hơn hoặc bằng tổng trọng lượng sản phẩm (${totalItemWeight}g)`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }
      
      
      const MAX_PACKAGE_WEIGHT = 30000;
      if (formData.weight > MAX_PACKAGE_WEIGHT) {
        showCenterError(`Trọng lượng kiện hàng không được vượt quá 30 kg (30,000 gram). Giá trị hiện tại: ${formData.weight.toLocaleString('vi-VN')} gram`, 'Lỗi');
        setIsSubmitting(false);
        return;
      }

  
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
        
        
        const original = itemOriginalValues[i];
        if (original) {
      
          const lengthError = validateItemValue(i, 'length', item.length);
          if (lengthError) {
            showCenterError(`Sản phẩm #${i + 1}: ${lengthError}`, 'Lỗi validation');
            setIsSubmitting(false);
            return;
          }
          
         
          const widthError = validateItemValue(i, 'width', item.width);
          if (widthError) {
            showCenterError(`Sản phẩm #${i + 1}: ${widthError}`, 'Lỗi validation');
            setIsSubmitting(false);
            return;
          }
          
          
          const heightError = validateItemValue(i, 'height', item.height);
          if (heightError) {
            showCenterError(`Sản phẩm #${i + 1}: ${heightError}`, 'Lỗi validation');
            setIsSubmitting(false);
            return;
          }
         
          const weightError = validateItemValue(i, 'weight', item.weight);
          if (weightError) {
            showCenterError(`Sản phẩm #${i + 1}: ${weightError}`, 'Lỗi validation');
            setIsSubmitting(false);
            return;
          }
        }
      }

      
      if (!formData.pick_shift || formData.pick_shift.length === 0 || !formData.pick_shift[0]) {
        showCenterError('Vui lòng chọn ca lấy hàng', 'Lỗi');
        setIsSubmitting(false);
        return;
      }

      
      const fromProvinceName = selectedProvince?.ProvinceName || formData.from_province_name;
      const fromDistrictName = selectedDistrict?.DistrictName || formData.from_district_name;
      const fromWardName = selectedWard?.WardName || formData.from_ward_name;

     
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

     
      console.log('📤 GHN Create Order Request:', JSON.stringify(requestData, null, 2));

 
      const response = await GhnService.createOrder(requestData);

      
      console.log('📦 GHN Create Order Response:', JSON.stringify(response, null, 2));
      console.log('📦 GHN Response Object:', response);

      if (response.code === 200 && response.data) {
     
        const responseData = response.data;
        const { order_code, expected_delivery_time, total_fee, fee } = responseData;
        
        
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
        
       
        try {
          console.log('🔄 Creating GHN order record in database...');
          
          
          const storeId = await StoreService.getStoreId();
          
         
          const ghnOrderRecordData = {
            storeOrderId: orderId,
            storeId: storeId,
            orderGhn: order_code,
            totalFee: total_fee,
            expectedDeliveryTime: expected_delivery_time,
            status: 'READY_PICKUP', 
          };
          
          console.log('📤 GHN Order Record Request:', JSON.stringify(ghnOrderRecordData, null, 2));
          
         
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
         
          showCenterError(
            `Đơn GHN đã được tạo nhưng không thể lưu vào database: ${error?.message || 'Lỗi không xác định'}`,
            'Cảnh báo'
          );
        }
        
       
        try {
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📤 [GHN TRANSFER MODAL] API REQUEST - PATCH Order Status');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('Endpoint: PATCH /api/v1/stores/{storeId}/orders/{orderId}/status');
          console.log('Request Attributes:');
          console.log('  - Method: PATCH');
          console.log('  - orderId:', orderId);
          console.log('  - status: GHN_CREATED');
          console.log('  - Headers: { Authorization: "Bearer ...", Accept: "*/*", Content-Type: "application/json" }');
          console.log('Request Body:');
          console.log('  { "status": "GHN_CREATED" }');
          console.log('═══════════════════════════════════════════════════════════════');
          
          console.log('🔄 Updating order status to GHN_CREATED...');
          const statusUpdateResponse = await StoreOrderService.updateOrderStatus(orderId, 'GHN_CREATED');
          
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📥 [GHN TRANSFER MODAL] API RESPONSE - PATCH Order Status');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('Response Status: Success');
          console.log('Response Attributes:');
          console.log('  - id:', statusUpdateResponse.id);
          console.log('  - storeId:', statusUpdateResponse.storeId);
          console.log('  - status:', statusUpdateResponse.status);
          console.log('  - createdAt:', statusUpdateResponse.createdAt);
          console.log('Response Body (Full):');
          console.log(JSON.stringify(statusUpdateResponse, null, 2));
          console.log('═══════════════════════════════════════════════════════════════');
          
          console.log('✅ Order status updated to GHN_CREATED');
        } catch (error: any) {
          console.error('═══════════════════════════════════════════════════════════════');
          console.error('❌ [GHN TRANSFER MODAL] API ERROR - PATCH Order Status');
          console.error('═══════════════════════════════════════════════════════════════');
          console.error('Error:', error);
          console.error('Error Message:', error?.message);
          console.error('Error Status:', error?.status);
          console.error('Error Data:', error?.data);
          console.error('Error Stack:', error?.stack);
          console.error('═══════════════════════════════════════════════════════════════');
          console.error('❌ Error updating order status:', error);
        
          console.warn('⚠️ GHN order created but order status update failed. Backend may handle this automatically.');
        }
        
        const deliveryDate = new Date(expected_delivery_time).toLocaleString('vi-VN');
        
        showCenterSuccess(
          `Tạo đơn hàng GHN thành công!\n\nMã đơn: ${order_code}\nThời gian giao dự kiến: ${deliveryDate}\nTổng phí: ${total_fee.toLocaleString('vi-VN')} VND\n\nĐơn hàng đã được chuyển sang trạng thái "Đã chuyển nhượng GHN".`,
          'Thành công',
          5000
        );

      
        onSubmit?.(formData);

     
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error('❌ GHN Order Creation Failed:', {
          code: response.code,
          message: response.message,
          response: response,
        });
        
       
        const errorData = (response as any).data || response;
        if (errorData?.code_message === 'PHONE_INVALID' || errorData?.code_message === 'PHONE_INVALID') {
          handlePhoneValidationError(errorData);
        } else {
          showCenterError(response.message || 'Không thể tạo đơn hàng GHN', 'Lỗi');
        }
      }
    } catch (error: any) {
      console.error('Error submitting GHN transfer:', error);
      
   
      let errorMessage = error?.message || 'Không thể tạo đơn hàng GHN. Vui lòng thử lại.';
      let errorData: any = null;
      
      
      try {
        if (error?.response?.data) {
          errorData = error.response.data;
        } else if (typeof error?.message === 'string') {
          
          if (error.message.includes('PHONE_INVALID') || error.message.includes('số điện thoại') || error.message.includes('không đúng')) {
           
            const jsonMatch = error.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                errorData = JSON.parse(jsonMatch[0]);
              } catch (e) {
              
                errorData = {
                  code_message: 'PHONE_INVALID',
                  code_message_value: error.message.includes('không đúng') 
                    ? 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại số điện thoại.'
                    : 'Số điện thoại không hợp lệ',
                  message: error.message,
                };
              }
            } else {
             
              errorData = {
                code_message: 'PHONE_INVALID',
                code_message_value: 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại số điện thoại.',
                message: error.message,
              };
            }
          }
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      
     
      if (errorData?.code_message === 'PHONE_INVALID' || 
          errorMessage.includes('PHONE_INVALID') || 
          errorMessage.includes('số điện thoại') && errorMessage.includes('không đúng')) {
        handlePhoneValidationError(errorData || { message: errorMessage });
      } else {
       
        const formattedMessage = errorData?.code_message_value || errorData?.message || errorMessage;
        showCenterError(formattedMessage, 'Lỗi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handlePhoneValidationError = (errorData: any) => {
    const errorMessage = errorData?.code_message_value || errorData?.message || 'Số điện thoại không hợp lệ';
    
   
    const phoneNumberMatch = errorData?.message?.match(/số điện thoại\s+(\d{10,11})/i) || 
                            errorMessage.match(/số điện thoại\s+(\d{10,11})/i) ||
                            errorData?.message?.match(/(\d{10,11})/);
    const phoneNumber = phoneNumberMatch?.[1] || phoneNumberMatch?.[0] || '';
    
    console.log('📞 Phone validation error detected:', {
      errorMessage,
      extractedPhone: phoneNumber,
      from_phone: formData.from_phone,
      to_phone: formData.to_phone,
      return_phone: formData.return_phone,
    });
    
   
    const errors: { from_phone?: string; to_phone?: string; return_phone?: string } = {};
    
    if (phoneNumber) {
     
      const normalizePhone = (phone: string) => phone?.replace(/[\s\-\(\)]/g, '') || '';
      const normalizedPhoneNumber = normalizePhone(phoneNumber);
      const normalizedFromPhone = normalizePhone(formData.from_phone || '');
      const normalizedToPhone = normalizePhone(formData.to_phone || '');
      const normalizedReturnPhone = normalizePhone(formData.return_phone || '');
      
      if (normalizedFromPhone.includes(normalizedPhoneNumber) || normalizedPhoneNumber === normalizedFromPhone) {
        errors.from_phone = 'Số điện thoại người gửi không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (normalizedToPhone.includes(normalizedPhoneNumber) || normalizedPhoneNumber === normalizedToPhone) {
        errors.to_phone = 'Số điện thoại người nhận không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (normalizedReturnPhone.includes(normalizedPhoneNumber) || normalizedPhoneNumber === normalizedReturnPhone) {
        errors.return_phone = 'Số điện thoại trả hàng không hợp lệ. Vui lòng kiểm tra lại.';
      } else {
       
        errors.to_phone = 'Số điện thoại người nhận không hợp lệ. Vui lòng kiểm tra lại.';
      }
    } else {
     
      errors.to_phone = 'Số điện thoại người nhận không hợp lệ. Vui lòng kiểm tra lại.';
    }
    
    setPhoneValidationErrors(errors);
    
   
    const userMessage = Object.values(errors)[0] || errorMessage;
    showCenterError(
      userMessage,
      'Lỗi xác thực số điện thoại'
    );
    
   
    setTimeout(() => {
      const firstErrorField = document.querySelector('[data-phone-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        if (!(firstErrorField as HTMLInputElement).disabled) {
          (firstErrorField as HTMLElement).focus();
        }
      }
    }, 100);
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
                    value={formData.service_type_id || 2}
                    onChange={(e) => handleInputChange('service_type_id', Number(e.target.value))}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  >
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
                    data-phone-error={phoneValidationErrors.from_phone ? 'true' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 cursor-not-allowed ${
                      phoneValidationErrors.from_phone
                        ? 'border-red-500 ring-2 ring-red-200'
                        : 'border-gray-300'
                    }`}
                  />
                  {phoneValidationErrors.from_phone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {phoneValidationErrors.from_phone}
                    </p>
                  )}
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
                    value={maskSensitiveInfo(formData.to_name)}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={maskSensitiveInfo(formData.to_phone)}
                    disabled
                    readOnly
                    data-phone-error={phoneValidationErrors.to_phone ? 'true' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 cursor-not-allowed ${
                      phoneValidationErrors.to_phone
                        ? 'border-red-500 ring-2 ring-red-200'
                        : 'border-gray-300'
                    }`}
                  />
                  {phoneValidationErrors.to_phone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {phoneValidationErrors.to_phone}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ *</label>
                  <input
                    type="text"
                    value={maskSensitiveInfo(formData.to_address)}
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
                    onChange={(e) => {
                      handleInputChange('return_phone', e.target.value);
                      // Clear error when user starts typing
                      if (phoneValidationErrors.return_phone) {
                        setPhoneValidationErrors(prev => ({
                          ...prev,
                          return_phone: undefined,
                        }));
                      }
                    }}
                    data-phone-error={phoneValidationErrors.return_phone ? 'true' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      phoneValidationErrors.return_phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  {phoneValidationErrors.return_phone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {phoneValidationErrors.return_phone}
                    </p>
                  )}
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
                        <label className="block text-xs text-gray-600 mb-1">
                          Chiều dài (cm) *
                          {itemOriginalValues[index]?.length > 0 && (
                            <span className="text-gray-500 ml-1">
                              (Gốc: {itemOriginalValues[index].length} cm, Tối đa: {Math.min(itemOriginalValues[index].length + 5, 150)} cm)
                            </span>
                          )}
                          <span className="text-gray-500 ml-1">(Giới hạn tối đa: 150 cm)</span>
                        </label>
                        <input
                          type="number"
                          value={item.length}
                          required
                          max={150}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            // GHN limit: không quá 150cm
                            if (value <= 150 || e.target.value === '') {
                              handleItemChange(index, 'length', value);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            itemValidationErrors[index]?.length
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        {itemValidationErrors[index]?.length && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {itemValidationErrors[index].length}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Chiều rộng (cm) *
                          {itemOriginalValues[index]?.width > 0 && (
                            <span className="text-gray-500 ml-1">
                              (Gốc: {itemOriginalValues[index].width} cm, Tối đa: {Math.min(itemOriginalValues[index].width + 5, 150)} cm)
                            </span>
                          )}
                          <span className="text-gray-500 ml-1">(Giới hạn tối đa: 150 cm)</span>
                        </label>
                        <input
                          type="number"
                          value={item.width}
                          required
                          max={150}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            // GHN limit: không quá 150cm
                            if (value <= 150 || e.target.value === '') {
                              handleItemChange(index, 'width', value);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            itemValidationErrors[index]?.width
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        {itemValidationErrors[index]?.width && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {itemValidationErrors[index].width}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Chiều cao (cm) *
                          {itemOriginalValues[index]?.height > 0 && (
                            <span className="text-gray-500 ml-1">
                              (Gốc: {itemOriginalValues[index].height} cm, Tối đa: {Math.min(itemOriginalValues[index].height + 5, 150)} cm)
                            </span>
                          )}
                          <span className="text-gray-500 ml-1">(Giới hạn tối đa: 150 cm)</span>
                        </label>
                        <input
                          type="number"
                          value={item.height}
                          required
                          max={150}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            // GHN limit: không quá 150cm
                            if (value <= 150 || e.target.value === '') {
                              handleItemChange(index, 'height', value);
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            itemValidationErrors[index]?.height
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        {itemValidationErrors[index]?.height && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {itemValidationErrors[index].height}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Trọng lượng (gram) *
                          {itemOriginalValues[index]?.weight > 0 && (
                            <span className="text-gray-500 ml-1">
                              (Gốc: {itemOriginalValues[index].weight} g
                              {itemOriginalValues[index].weight < 5000
                                ? `, Tối đa: ${Math.min(itemOriginalValues[index].weight + 500, 30000)} g)`
                                : `, Tối đa: ${Math.min(itemOriginalValues[index].weight + Math.round(itemOriginalValues[index].weight * 0.15), 30000)} g (+15%))`}
                              <span className="text-red-600">, Tuyệt đối: 30.000 g (30 kg)</span>
                            </span>
                          )}
                          {(!itemOriginalValues[index]?.weight || itemOriginalValues[index].weight === 0) && (
                            <span className="text-gray-500 ml-1">(Tối đa: 30.000 g / 30 kg)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={item.weight}
                          required
                          maxLength={5}
                          max={30000}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Chỉ cho phép nhập tối đa 5 chữ số và không vượt quá 30,000 gram
                            if (inputValue === '' || (inputValue.length <= 5 && /^\d+$/.test(inputValue))) {
                              const value = inputValue === '' ? 0 : Number(inputValue);
                              if (value <= 30000 || inputValue === '') {
                                handleItemChange(index, 'weight', value);
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            itemValidationErrors[index]?.weight
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-orange-500'
                          }`}
                        />
                        {itemValidationErrors[index]?.weight && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {itemValidationErrors[index].weight}
                          </p>
                        )}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Thông tin kiện hàng</h3>
                {packingValidation && (
                  <div className="flex items-center gap-2">
                    {packingValidation.canPack ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded">
                        <Check className="w-3 h-3" />
                        {packingValidation.reason}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-3 h-3" />
                        {packingValidation.reason}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {packingValidation && !packingValidation.canPack && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-700 mb-1">Không thể đóng chung 1 kiện</p>
                      <p className="text-xs text-red-600">{packingValidation.reason}</p>
                      {packingValidation.calculatedDimensions && (
                        <div className="mt-2 text-xs text-red-600">
                          <p>Kích thước tính toán:</p>
                          <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                            <li>Dài: {packingValidation.calculatedDimensions.length}cm</li>
                            <li>Rộng: {packingValidation.calculatedDimensions.width}cm</li>
                            <li>Cao: {packingValidation.calculatedDimensions.height}cm</li>
                            <li>Cạnh dài nhất: {packingValidation.calculatedDimensions.maxEdge}cm (giới hạn: {MAX_BOX_EDGE}cm)</li>
                            <li>Tổng cân: {packingValidation.calculatedDimensions.weight.toLocaleString('vi-VN')}g (giới hạn: {MAX_BOX_WEIGHT.toLocaleString('vi-VN')}g)</li>
                            <li>Tổng thể tích: {packingValidation.calculatedDimensions.volume.toLocaleString('vi-VN')} cm³ (giới hạn: {MAX_BOX_VOLUME.toLocaleString('vi-VN')} cm³)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Trọng lượng (gram) *
                    {packingValidation?.calculatedDimensions && (
                      <span className="text-gray-500 ml-1">
                        (Tự động: {packingValidation.calculatedDimensions.weight.toLocaleString('vi-VN')}g)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    maxLength={5}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Chỉ cho phép nhập tối đa 5 chữ số và không vượt quá 30,000 gram (GHN limit)
                      if (inputValue === '' || (inputValue.length <= 5 && /^\d+$/.test(inputValue))) {
                        const value = inputValue === '' ? 0 : Number(inputValue);
                        if (value <= 30000 || inputValue === '') {
                          handleInputChange('weight', value);
                        }
                      }
                    }}
                    placeholder="≤ 30.000g"
                    max={30000}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      packingValidation && !packingValidation.canPack
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tối đa 30.000 gram (30 kg) • Giới hạn đóng kiện GHN: {MAX_BOX_WEIGHT.toLocaleString('vi-VN')}g
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Chiều dài (cm) *
                    {packingValidation?.calculatedDimensions && (
                      <span className="text-gray-500 ml-1">
                        (Tự động: {packingValidation.calculatedDimensions.length}cm)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.length || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      // GHN limit: không quá 150cm
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('length', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      packingValidation && !packingValidation.canPack
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm  • Giới hạn đóng kiện: {MAX_BOX_EDGE}cm (cạnh dài nhất)</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Chiều rộng (cm) *
                    {packingValidation?.calculatedDimensions && (
                      <span className="text-gray-500 ml-1">
                        (Tự động: {packingValidation.calculatedDimensions.width}cm)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      // GHN limit: không quá 150cm
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('width', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      packingValidation && !packingValidation.canPack
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Chiều cao (cm) *
                    {packingValidation?.calculatedDimensions && (
                      <span className="text-gray-500 ml-1">
                        (Tự động: {packingValidation.calculatedDimensions.height}cm)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      // GHN limit: không quá 150cm
                      if (value <= 150 || e.target.value === '') {
                        handleInputChange('height', value);
                      }
                    }}
                    placeholder="≤ 150cm"
                    max={150}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      packingValidation && !packingValidation.canPack
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 150 cm </p>
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
            disabled={isSubmitting || (packingValidation !== null && !packingValidation.canPack)}
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

