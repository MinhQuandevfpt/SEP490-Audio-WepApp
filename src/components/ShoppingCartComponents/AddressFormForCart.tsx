import React, { useEffect, useMemo, useState } from 'react';
import type { CustomerAddressApiItem, AddressLabel } from '../../types/api';
import { AddressService } from '../../services/customer/AddressService';
import { toast } from 'react-toastify';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';

interface AddressFormForCartProps {
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onAddressesChange: () => void;
  editingAddress?: CustomerAddressApiItem | null;
  onCancel?: () => void;
}

const AddressFormForCart: React.FC<AddressFormForCartProps> = ({ 
  selectedAddressId, 
  onSelect, 
  onAddressesChange,
  editingAddress,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editingAddress;
  const [form, setForm] = useState<{
    receiverName: string;
    phoneNumber: string;
    label: AddressLabel;
    country: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    addressLine: string;
    postalCode: string;
    note?: string;
    isDefault: boolean;
    provinceCode: string;
    districtId: number | null;
    wardCode: string;
  }>(() => {
    if (editingAddress) {
      return {
        receiverName: editingAddress.receiverName,
        phoneNumber: editingAddress.phoneNumber,
        label: editingAddress.label,
        country: editingAddress.country,
        province: editingAddress.province,
        district: editingAddress.district,
        ward: editingAddress.ward,
        street: editingAddress.street,
        addressLine: editingAddress.addressLine,
        postalCode: editingAddress.postalCode || '',
        note: editingAddress.note || '',
        isDefault: editingAddress.default,
        provinceCode: (editingAddress as any).provinceCode || '',
        districtId: (editingAddress as any).districtId ?? null,
        wardCode: (editingAddress as any).wardCode || '',
      };
    }
    return {
      receiverName: '',
      phoneNumber: '',
      label: 'HOME',
      country: 'Việt Nam',
      province: '',
      district: '',
      ward: '',
      street: '',
      addressLine: '',
      postalCode: '',
      note: '',
      isDefault: false,
      provinceCode: '',
      districtId: null,
      wardCode: '',
    };
  });

  // Province/District/Ward cascading selections (same API hooks as Suminputsection)
  const { provinces, loading: provincesLoading } = useProvinces();
  const selectedProvince = useMemo(() => provinces.find(p => p.ProvinceName === form.province) || null, [provinces, form.province]);
  const { districts, loading: districtsLoading } = useDistricts(selectedProvince ? selectedProvince.ProvinceID : null);
  const selectedDistrict = useMemo(() => districts.find(d => d.DistrictName === form.district) || null, [districts, form.district]);
  const { wards, loading: wardsLoading } = useWards(selectedDistrict ? selectedDistrict.DistrictID : null);

  // Sync code fields when selections change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      provinceCode: selectedProvince ? String(selectedProvince.ProvinceID) : '',
    }));
  }, [selectedProvince]);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      districtId: selectedDistrict ? selectedDistrict.DistrictID : null,
    }));
  }, [selectedDistrict]);

  useEffect(() => {
    const matchedWard = wards.find(w => w.WardName === form.ward);
    setForm(prev => ({
      ...prev,
      wardCode: matchedWard ? matchedWard.WardCode : '',
    }));
  }, [wards, form.ward]);

  const submitForm = async () => {
    if (!form.receiverName || !form.phoneNumber || !form.province || !form.district || !form.ward || !form.street) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    if (!form.addressLine) {
      form.addressLine = `${form.street}, ${form.ward}, ${form.district}, ${form.province}`;
    }

    // Validate new code fields for create
    if (!isEditMode) {
      if (!form.provinceCode || form.districtId == null || !form.wardCode) {
        toast.error('Thiếu mã địa lý: vui lòng chọn Tỉnh/Quận/Phường hợp lệ');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && editingAddress) {
        const updated = await AddressService.updateAddress(editingAddress.id, form);
        toast.success('Cập nhật địa chỉ thành công!');
        onAddressesChange();
        if (updated.id === selectedAddressId) {
          onSelect(updated.id); // Refresh selection
        }
        if (onCancel) onCancel();
      } else {
        const newAddress = await AddressService.createAddress({
          receiverName: form.receiverName,
          phoneNumber: form.phoneNumber,
          label: form.label,
          country: form.country,
          province: form.province,
          district: form.district,
          ward: form.ward,
          street: form.street,
          addressLine: form.addressLine,
          postalCode: form.postalCode,
          note: form.note,
          isDefault: form.isDefault,
          provinceCode: form.provinceCode,
          districtId: form.districtId as number,
          wardCode: form.wardCode,
        });
        toast.success('Thêm địa chỉ thành công!');
        onAddressesChange();
        onSelect(newAddress.id);
        if (onCancel) onCancel();
      }
    } catch (error: any) {
      toast.error(error?.message || `Không thể ${isEditMode ? 'cập nhật' : 'thêm'} địa chỉ. Vui lòng thử lại.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{isEditMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={isSubmitting}
          >
            Hủy
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            placeholder="Họ tên *" 
            className="border rounded px-3 py-2"
            value={form.receiverName} 
            onChange={(e) => setForm({ ...form, receiverName: e.target.value })} 
          />
          <input 
            placeholder="Số điện thoại *" 
            className="border rounded px-3 py-2"
            value={form.phoneNumber} 
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} 
          />
          <select
            className="border rounded px-3 py-2"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value as AddressLabel })}
          >
            <option value="HOME">Nhà riêng</option>
            <option value="WORK">Cơ quan</option>
            <option value="OTHER">Khác</option>
          </select>
          {/* Thành phố/Tỉnh */}
          <select
            className="border rounded px-3 py-2"
            value={form.province}
            onChange={(e) => {
              setForm({ ...form, province: e.target.value, district: '', ward: '' });
            }}
          >
            <option value="" disabled>{provincesLoading ? 'Đang tải tỉnh/thành...' : 'Chọn tỉnh/thành phố *'}</option>
            {provinces.map(p => (
              <option key={p.ProvinceID} value={p.ProvinceName}>{p.ProvinceName}</option>
            ))}
          </select>
          {/* Quận/Huyện */}
          <select
            className="border rounded px-3 py-2"
            value={form.district}
            onChange={(e) => {
              setForm({ ...form, district: e.target.value, ward: '' });
            }}
            disabled={!form.province || districtsLoading}
          >
            <option value="" disabled>{!form.province ? 'Chọn tỉnh trước' : (districtsLoading ? 'Đang tải quận/huyện...' : 'Chọn quận/huyện *')}</option>
            {districts.map(d => (
              <option key={d.DistrictID} value={d.DistrictName}>{d.DistrictName}</option>
            ))}
          </select>
          {/* Phường/Xã */}
          <select
            className="border rounded px-3 py-2"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
            disabled={!form.district || wardsLoading}
          >
            <option value="" disabled>{!form.district ? 'Chọn quận/huyện trước' : (wardsLoading ? 'Đang tải phường/xã...' : 'Chọn phường/xã *')}</option>
            {wards.map(w => (
              <option key={w.WardCode} value={w.WardName}>{w.WardName}</option>
            ))}
          </select>
          {/* Đường */}
          <input 
            placeholder="Đường *" 
            className="border rounded px-3 py-2"
            value={form.street} 
            onChange={(e) => setForm({ ...form, street: e.target.value })} 
          />
          {/* Số nhà/Địa chỉ chi tiết */}
          <input 
            placeholder="Số nhà/Địa chỉ chi tiết *" 
            className="border rounded px-3 py-2"
            value={form.addressLine} 
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })} 
          />
          <input 
            placeholder="Mã bưu điện" 
            className="border rounded px-3 py-2"
            value={form.postalCode} 
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })} 
          />
          <input 
            placeholder="Ghi chú" 
            className="border rounded px-3 py-2 md:col-span-2"
            value={form.note || ''} 
            onChange={(e) => setForm({ ...form, note: e.target.value })} 
          />
          <div className="md:col-span-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</label>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button 
              onClick={submitForm} 
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
            </button>
            {onCancel && (
              <button 
                onClick={onCancel} 
                className="px-4 py-2 border rounded"
                disabled={isSubmitting}
              >
                Hủy
              </button>
            )}
          </div>
        </div>
    </div>
  );
};

export default AddressFormForCart;

