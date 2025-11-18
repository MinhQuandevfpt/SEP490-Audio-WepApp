import React, { useState, useEffect, useMemo } from 'react';
import { X, Truck, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { GhnService, type PickShift } from '../../services/seller/GhnService';
import { StoreService } from '../../services/seller/StoreService';
import { StoreAddressService } from '../../services/seller/StoreAddressService';
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
  onClose: () => void;
  onSubmit?: (data: GhnTransferFormData) => void;
}

const GhnTransferModal: React.FC<Props> = ({ orderId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<GhnTransferFormData>({
    payment_type_id: 0,
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
  
  // Address selection states (from address)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [addressValidationError, setAddressValidationError] = useState<string>('');
  
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

      // Load store info and address
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
          
          // Set selected province, district, ward based on codes
          if (defaultAddress.provinceCode) {
            const provinceId = Number(defaultAddress.provinceCode);
            if (!isNaN(provinceId)) {
              setSelectedProvinceId(provinceId);
            }
          }
          
          // Convert districtCode and wardCode for return address
          // districtCode is stored as string in StoreAddress, but GHN API needs number (DistrictID)
          const returnDistrictId = defaultAddress.districtCode ? Number(defaultAddress.districtCode) : 0;
          const returnWardCode = defaultAddress.wardCode || '';
          
          // Auto-fill form with store information (from address)
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
        console.error('Error loading store info:', error);
      } finally {
        setIsLoadingStoreInfo(false);
      }

    };

    loadData();
  }, [orderId]);


  const handleInputChange = (field: keyof GhnTransferFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof GhnItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
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

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          code: '',
          quantity: 1,
          price: 0,
          length: 0,
          width: 0,
          height: 0,
          weight: 0,
          category: {
            level1: '',
            level2: '',
            level3: '',
          },
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handlePickShiftChange = (shiftId: number) => {
    setFormData(prev => ({
      ...prev,
      pick_shift: [shiftId],
    }));
  };

  // Fill sample data for testing
  const fillSampleData = () => {
    setFormData({
      payment_type_id: 2,
      note: 'Demo GHN',
      required_note: 'KHONGCHOXEMHANG',
      from_name: 'Demo Shop',
      from_phone: '0988888888',
      from_address: 'Trung tâm Si Ma Cai',
      from_ward_name: 'Thị Trấn Si Ma Cai',
      from_district_name: 'Huyện Si Ma Cai',
      from_province_name: 'Lào Cai',
      return_phone: '0988888888',
      return_address: 'Trung tâm Si Ma Cai',
      return_district_id: 2264,
      return_ward_code: '90816',
      to_name: 'Khách Demo',
      to_phone: '0912345678',
      to_address: 'Phường An Khánh, TP Thủ Đức, Hồ Chí Minh',
      to_ward_code: '90768',
      to_district_id: 3695,
      cod_amount: 10000,
      content: 'Demo',
      weight: 200,
      length: 10,
      width: 10,
      height: 5,
      pick_station_id: 2264,
      insurance_value: 0,
      service_id: 0,
      service_type_id: 2,
      coupon: '',
      pick_shift: [2],
      items: [
        {
          name: 'TestItem',
          code: 'TEST01',
          quantity: 1,
          price: 10000,
          length: 5,
          width: 5,
          height: 5,
          weight: 50,
          category: {
            level1: 'Khác',
            level2: '',
            level3: '',
          },
        },
      ],
    });

    // Set selected province, district, ward for from address
    // Note: You may need to adjust these IDs based on actual GHN API data
    // For now, we'll try to find matching province
    const findAndSetProvince = async () => {
      try {
        const allProvinces = await GhnService.getActiveProvinces();
        const matchedProvince = allProvinces.find(
          p => p.ProvinceName.toLowerCase().includes('lào cai') || 
               p.ProvinceName.toLowerCase().includes('lao cai')
        );
        if (matchedProvince) {
          setSelectedProvinceId(matchedProvince.ProvinceID);
          
          // Wait a bit for districts to load, then set district
          setTimeout(async () => {
            try {
              const allDistricts = await GhnService.getActiveDistricts(matchedProvince.ProvinceID);
              const matchedDistrict = allDistricts.find(
                d => d.DistrictName.toLowerCase().includes('si ma cai') ||
                     d.DistrictName.toLowerCase().includes('sima cai')
              );
              if (matchedDistrict) {
                setSelectedDistrictId(matchedDistrict.DistrictID);
                
                // Wait a bit for wards to load, then set ward
                setTimeout(async () => {
                  try {
                    const allWards = await GhnService.getActiveWards(matchedDistrict.DistrictID);
                    const matchedWard = allWards.find(
                      w => w.WardName.toLowerCase().includes('thị trấn si ma cai') ||
                           w.WardCode === '90816'
                    );
                    if (matchedWard) {
                      setSelectedWardCode(matchedWard.WardCode);
                    }
                  } catch (error) {
                    console.error('Error loading wards:', error);
                  }
                }, 500);
              }
            } catch (error) {
              console.error('Error loading districts:', error);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    
    findAndSetProvince();
  };

  // Format time from seconds to HH:mm
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

      if (!formData.weight || !formData.length || !formData.width || !formData.height) {
        showCenterError('Vui lòng điền đầy đủ thông tin kiện hàng', 'Lỗi');
        return;
      }

      if (formData.items.length === 0) {
        showCenterError('Vui lòng thêm ít nhất một sản phẩm', 'Lỗi');
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
                  <label className="block text-xs text-gray-600 mb-1">Loại thanh toán phí ship *</label>
                  <select
                    value={formData.payment_type_id || ''}
                    onChange={(e) => handleInputChange('payment_type_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">-- Chọn loại thanh toán --</option>
                    <option value="1">1: Shop trả phí ship</option>
                    <option value="2">2: Người nhận trả</option>
                  </select>
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
                    <option value="CHOTHUHANG">CHOTHUHANG</option>
                    <option value="CHOXEMHANGKHONGTHU">CHOXEMHANGKHONGTHU</option>
                    <option value="KHONGCHOXEMHANG">KHONGCHOXEMHANG</option>
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
                    onChange={(e) => handleInputChange('from_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.from_phone}
                    onChange={(e) => handleInputChange('from_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.from_address}
                    onChange={(e) => handleInputChange('from_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tỉnh/Thành phố *</label>
                  <select
                    value={selectedProvinceId || ''}
                    onChange={(e) => handleProvinceChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={provincesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {provinces.map((province) => (
                      <option key={province.ProvinceID} value={province.ProvinceID}>
                        {province.ProvinceName}
                      </option>
                    ))}
                  </select>
                  {provincesLoading && (
                    <p className="text-xs text-gray-500 mt-1">Đang tải...</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quận/Huyện *</label>
                  <select
                    value={selectedDistrictId || ''}
                    onChange={(e) => handleDistrictChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedProvinceId || districtsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {districts.map((district) => (
                      <option key={district.DistrictID} value={district.DistrictID}>
                        {district.DistrictName}
                      </option>
                    ))}
                  </select>
                  {districtsLoading && (
                    <p className="text-xs text-gray-500 mt-1">Đang tải...</p>
                  )}
                  {!selectedProvinceId && (
                    <p className="text-xs text-gray-500 mt-1">Vui lòng chọn tỉnh/thành phố trước</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phường/Xã *</label>
                  <select
                    value={selectedWardCode}
                    onChange={(e) => handleWardChange(e.target.value)}
                    disabled={!selectedDistrictId || wardsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn phường/xã --</option>
                    {wards.map((ward) => (
                      <option key={ward.WardCode} value={ward.WardCode}>
                        {ward.WardName}
                      </option>
                    ))}
                  </select>
                  {wardsLoading && (
                    <p className="text-xs text-gray-500 mt-1">Đang tải...</p>
                  )}
                  {!selectedDistrictId && (
                    <p className="text-xs text-gray-500 mt-1">Vui lòng chọn quận/huyện trước</p>
                  )}
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
                    onChange={(e) => handleInputChange('to_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.to_phone}
                    onChange={(e) => handleInputChange('to_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.to_address}
                    onChange={(e) => handleInputChange('to_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mã Phường/Xã *</label>
                  <input
                    type="text"
                    value={formData.to_ward_code}
                    onChange={(e) => handleInputChange('to_ward_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">District ID *</label>
                  <input
                    type="number"
                    value={formData.to_district_id}
                    onChange={(e) => handleInputChange('to_district_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
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
                <div>
                  <label className="block text-xs text-gray-600 mb-1">District ID</label>
                  <input
                    type="number"
                    value={formData.return_district_id}
                    onChange={(e) => handleInputChange('return_district_id', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mã Phường/Xã</label>
                  <input
                    type="text"
                    value={formData.return_ward_code}
                    onChange={(e) => handleInputChange('return_ward_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
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
                    type="number"
                    value={formData.cod_amount || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 10000000 || e.target.value === '') {
                        handleInputChange('cod_amount', value);
                      }
                    }}
                    placeholder="≤ 10.000.000 VND"
                    max={10000000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 10.000.000 VND</p>
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ca lấy hàng</h3>
              {isLoadingPickShifts ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">Đang tải danh sách ca lấy hàng...</span>
                </div>
              ) : (
                <select
                  value={formData.pick_shift[0] || ''}
                  onChange={(e) => handlePickShiftChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Chọn ca lấy hàng (tùy chọn) --</option>
                  {pickShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.title} - {formatTime(shift.from_time)} - {formatTime(shift.to_time)}
                    </option>
                  ))}
                </select>
              )}
              {pickShifts.length === 0 && !isLoadingPickShifts && (
                <p className="text-sm text-gray-500 mt-2">Không có ca lấy hàng nào khả dụng</p>
              )}
            </div>

            {/* Items */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Sản phẩm trong đơn</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Thêm sản phẩm
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Sản phẩm #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tên sản phẩm *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Mã sản phẩm *</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Số lượng *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Giá (VND) *</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều dài (cm)</label>
                        <input
                          type="number"
                          value={item.length}
                          onChange={(e) => handleItemChange(index, 'length', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều rộng (cm)</label>
                        <input
                          type="number"
                          value={item.width}
                          onChange={(e) => handleItemChange(index, 'width', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Chiều cao (cm)</label>
                        <input
                          type="number"
                          value={item.height}
                          onChange={(e) => handleItemChange(index, 'height', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Trọng lượng (gram)</label>
                        <input
                          type="number"
                          value={item.weight}
                          onChange={(e) => handleItemChange(index, 'weight', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Danh mục Level 1</label>
                        <input
                          type="text"
                          value={item.category.level1}
                          onChange={(e) => handleCategoryChange(index, 'level1', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Danh mục Level 2</label>
                        <input
                          type="text"
                          value={item.category.level2}
                          onChange={(e) => handleCategoryChange(index, 'level2', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Danh mục Level 3</label>
                        <input
                          type="text"
                          value={item.category.level3}
                          onChange={(e) => handleCategoryChange(index, 'level3', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để thêm.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={fillSampleData}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            title="Điền dữ liệu mẫu để test"
          >
            Điền dữ liệu mẫu
          </button>
          <div className="flex items-center gap-3">
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
    </div>
  );
};

export default GhnTransferModal;

