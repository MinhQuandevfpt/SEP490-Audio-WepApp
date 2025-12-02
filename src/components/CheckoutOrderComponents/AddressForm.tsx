import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Check, MapPin } from 'lucide-react';
import type { CustomerAddressApiItem, AddressLabel } from '../../types/api';
import { AddressService } from '../../services/customer/AddressService';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';
import { showCenterError, showCenterSuccess } from '../../utils/notification';

interface AddressFormProps {
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  onSelect: (id: string | null) => void;
  onAddressesChange: () => Promise<void> | void;
}

const createEmptyForm = () => ({
  receiverName: '',
  phoneNumber: '',
  label: 'HOME' as AddressLabel,
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
  districtId: null as number | null,
  wardCode: '',
});

const AddressForm: React.FC<AddressFormProps> = ({
  addresses,
  selectedAddressId,
  onSelect,
  onAddressesChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [showSelector, setShowSelector] = useState(false);

  const { provinces, loading: provincesLoading } = useProvinces();
  const selectedProvince = useMemo(
    () => provinces.find(p => p.ProvinceName === formData.province) || null,
    [provinces, formData.province]
  );
  const { districts, loading: districtsLoading } = useDistricts(
    selectedProvince ? selectedProvince.ProvinceID : null
  );
  const selectedDistrict = useMemo(
    () => districts.find(d => d.DistrictName === formData.district) || null,
    [districts, formData.district]
  );
  const { wards, loading: wardsLoading } = useWards(
    selectedDistrict ? selectedDistrict.DistrictID : null
  );

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      provinceCode: selectedProvince ? String(selectedProvince.ProvinceID) : '',
    }));
  }, [selectedProvince]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      districtId: selectedDistrict ? selectedDistrict.DistrictID : null,
    }));
  }, [selectedDistrict]);

  useEffect(() => {
    const matchedWard = wards.find(w => w.WardName === formData.ward);
    setFormData(prev => ({
      ...prev,
      wardCode: matchedWard ? matchedWard.WardCode : '',
    }));
  }, [wards, formData.ward]);

  const selectedAddress = selectedAddressId
    ? addresses.find(addr => addr.id === selectedAddressId) || null
    : null;

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditingAddressId(null);
    setShowForm(false);
  };

  const ensureAddressLine = () => {
    if (!formData.addressLine) {
      formData.addressLine = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.province}`;
    }
  };

  const validateForm = () => {
    if (
      !formData.receiverName ||
      !formData.phoneNumber ||
      !formData.province ||
      !formData.district ||
      !formData.ward ||
      !formData.street
    ) {
      showCenterError('Vui lòng điền đầy đủ thông tin địa chỉ', 'Lỗi');
      return false;
    }

    if (!formData.provinceCode || formData.districtId == null || !formData.wardCode) {
      showCenterError('Thiếu mã địa lý: vui lòng chọn Tỉnh/Quận/Phường hợp lệ', 'Lỗi');
      return false;
    }

    return true;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;
    ensureAddressLine();

    try {
      setIsSubmitting(true);
      if (editingAddressId) {
        await AddressService.updateAddress(editingAddressId, {
          receiverName: formData.receiverName,
          phoneNumber: formData.phoneNumber,
          label: formData.label,
          country: formData.country,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          street: formData.street,
          addressLine: formData.addressLine,
          postalCode: formData.postalCode,
          note: formData.note,
          isDefault: formData.isDefault,
        });
        showCenterSuccess('Cập nhật địa chỉ thành công', 'Thành công');
        await onAddressesChange();
        onSelect(editingAddressId);
      } else {
        const newAddress = await AddressService.createAddress({
          receiverName: formData.receiverName,
          phoneNumber: formData.phoneNumber,
          label: formData.label,
          country: formData.country,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          street: formData.street,
          addressLine: formData.addressLine,
          postalCode: formData.postalCode,
          note: formData.note,
          isDefault: formData.isDefault,
          provinceCode: formData.provinceCode,
          districtId: formData.districtId!,
          wardCode: formData.wardCode,
        });
        showCenterSuccess('Thêm địa chỉ thành công', 'Thành công');
        await onAddressesChange();
        onSelect(newAddress.id);
      }
      resetForm();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể lưu địa chỉ', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: CustomerAddressApiItem) => {
    setFormData({
      receiverName: address.receiverName,
      phoneNumber: address.phoneNumber,
      label: address.label,
      country: address.country,
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
      addressLine: address.addressLine,
      postalCode: address.postalCode || '',
      note: address.note || '',
      isDefault: address.default || false,
      provinceCode: (address as any).provinceCode || '',
      districtId: (address as any).districtId ?? null,
      wardCode: (address as any).wardCode || '',
    });
    setEditingAddressId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (address: CustomerAddressApiItem) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa địa chỉ "${address.receiverName}"?`);
    if (!confirmed) return;
    try {
      setIsSubmitting(true);
      await AddressService.deleteAddress(address.id);
      showCenterSuccess('Xóa địa chỉ thành công', 'Thành công');
      const remaining = addresses.filter(a => a.id !== address.id);
      if (selectedAddressId === address.id) {
        const fallback = remaining.find(a => a.default) || remaining[0] || null;
        onSelect(fallback ? fallback.id : null);
      }
      await onAddressesChange();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể xóa địa chỉ', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (address: CustomerAddressApiItem) => {
    try {
      setIsSubmitting(true);
      await AddressService.updateAddress(address.id, {
        receiverName: address.receiverName,
        phoneNumber: address.phoneNumber,
        label: address.label,
        country: address.country,
        province: address.province,
        district: address.district,
        ward: address.ward,
        street: address.street,
        addressLine: address.addressLine,
        postalCode: address.postalCode,
        note: address.note,
        isDefault: true,
      });
      showCenterSuccess('Đã đặt làm địa chỉ mặc định', 'Thành công');
      await onAddressesChange();
      onSelect(address.id);
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể đặt mặc định', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAddress = (id: string | null) => {
    onSelect(id);
    setShowSelector(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Địa chỉ nhận hàng</p>
            <p className="text-xs text-gray-500">
              Chọn địa chỉ nhận hàng hoặc thêm địa chỉ mới để giao hàng nhanh chóng hơn.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingAddressId(null);
            setFormData(createEmptyForm());
          }}
          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm địa chỉ mới
        </button>
      </div>

      {selectedAddress ? (
        <div className="border border-gray-200 rounded-2xl shadow-sm bg-white">
          <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                {selectedAddress.receiverName}
                <span className="text-gray-500 text-sm ml-2">
                  {selectedAddress.phoneNumber}
                </span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {(
                  [
                    selectedAddress.addressLine, // Số nhà / địa chỉ chi tiết
                    selectedAddress.street,      // Đường
                  ].filter(Boolean) as string[]
                ).join(', ')}
              </p>
              <p className="text-sm text-gray-700">
                {(
                  [
                    selectedAddress.ward,      // Phường / Xã
                    selectedAddress.district,  // Quận / Huyện
                    selectedAddress.province,  // Tỉnh / Thành
                  ].filter(Boolean) as string[]
                ).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {selectedAddress.default && (
                <span className="px-2 py-0.5 rounded-full border border-red-200 text-red-500 text-xs font-medium">
                  Mặc định
                </span>
              )}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowSelector(prev => !prev)}
              >
                {showSelector ? 'Đóng' : 'Thay đổi'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-sm text-gray-500">
          Chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới.
        </div>
      )}

      {(showForm || editingAddressId) && (
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Họ và tên *"
              value={formData.receiverName}
              onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Số điện thoại *"
              value={formData.phoneNumber}
              onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <select
              className="border rounded px-3 py-2"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value as AddressLabel })}
            >
              <option value="HOME">Nhà riêng</option>
              <option value="WORK">Cơ quan</option>
              <option value="OTHER">Khác</option>
            </select>
            <input
              className="border rounded px-3 py-2 bg-gray-50 text-gray-500"
              value={formData.country}
              readOnly
            />

            <select
              className="border rounded px-3 py-2"
              value={formData.province}
              onChange={e => setFormData({ ...formData, province: e.target.value, district: '', ward: '' })}
              disabled={provincesLoading}
            >
              <option value="">
                {provincesLoading ? 'Đang tải tỉnh/thành...' : 'Chọn Tỉnh/Thành *'}
              </option>
              {provinces.map(p => (
                <option key={p.ProvinceID} value={p.ProvinceName}>
                  {p.ProvinceName}
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2"
              value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value, ward: '' })}
              disabled={!formData.province || districtsLoading}
            >
              <option value="">
                {!formData.province
                  ? 'Chọn tỉnh trước'
                  : districtsLoading
                    ? 'Đang tải quận/huyện...'
                    : 'Chọn Quận/Huyện *'}
              </option>
              {districts.map(d => (
                <option key={d.DistrictID} value={d.DistrictName}>
                  {d.DistrictName}
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2"
              value={formData.ward}
              onChange={e => setFormData({ ...formData, ward: e.target.value })}
              disabled={!formData.district || wardsLoading}
            >
              <option value="">
                {!formData.district
                  ? 'Chọn quận/huyện trước'
                  : wardsLoading
                    ? 'Đang tải phường/xã...'
                    : 'Chọn Phường/Xã *'}
              </option>
              {wards.map(w => (
                <option key={w.WardCode} value={w.WardName}>
                  {w.WardName}
                </option>
              ))}
            </select>

            <input
              className="border rounded px-3 py-2 md:col-span-2"
              placeholder="Đường *"
              value={formData.street}
              onChange={e => setFormData({ ...formData, street: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2 md:col-span-2"
              placeholder="Số nhà/Địa chỉ chi tiết *"
              value={formData.addressLine}
              onChange={e => setFormData({ ...formData, addressLine: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Mã bưu chính"
              value={formData.postalCode}
              onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Ghi chú"
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
            />
            <label className="flex items-center gap-2 md:col-span-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 text-orange-500"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreateOrUpdate}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Đang lưu...' : editingAddressId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showSelector && addresses.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y">
          {addresses.map(address => {
            const isActive = selectedAddressId === address.id;
            return (
              <div
                key={address.id}
                className={`p-4 flex gap-4 ${isActive ? 'bg-orange-50' : 'bg-white'}`}
              >
                <input
                  type="radio"
                  checked={isActive}
                  onChange={() => handleSelectAddress(address.id)}
                  className="mt-2 h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{address.receiverName}</p>
                    <span className="text-gray-500 text-sm">{address.phoneNumber}</span>
                    {address.default && (
                      <span className="px-2 py-0.5 border border-red-200 text-red-500 rounded-full text-xs font-medium">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {(
                      [
                        address.addressLine, // Số nhà / địa chỉ chi tiết
                        address.street,      // Đường
                      ].filter(Boolean) as string[]
                    ).join(', ')}
                  </p>
                  <p className="text-sm text-gray-700">
                    {(
                      [
                        address.ward,      // Phường / Xã
                        address.district,  // Quận / Huyện
                        address.province,  // Tỉnh / Thành
                      ].filter(Boolean) as string[]
                    ).join(', ')}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-blue-600">
                    <button type="button" className="hover:underline" onClick={() => handleEdit(address)}>
                      Sửa
                    </button>
                    {!address.default && (
                      <button type="button" className="hover:underline" onClick={() => handleSetDefault(address)}>
                        Đặt mặc định
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(address)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showSelector && addresses.length > 0 && (
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700"
          onClick={() => setShowSelector(true)}
        >
          Xem tất cả địa chỉ
        </button>
      )}
    </div>
  );
};

export default AddressForm;
