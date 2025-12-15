import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Check, MapPin } from 'lucide-react';
import type { CustomerAddressApiItem, AddressLabel } from '../../types/api';
import { AddressService } from '../../services/customer/AddressService';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [showSelector, setShowSelector] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 2;

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

  // Khi mở selector hoặc danh sách địa chỉ thay đổi, đảm bảo currentPage hợp lệ
  useEffect(() => {
    if (!showSelector) {
      setCurrentPage(1);
      return;
    }
    const totalPages = Math.max(1, Math.ceil(addresses.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [showSelector, addresses.length, currentPage]);

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
      showCenterError(t('address.errors.incomplete'), t('checkout.errors.title'));
      return false;
    }

    if (!formData.provinceCode || formData.districtId == null || !formData.wardCode) {
      showCenterError(t('address.errors.incomplete'), t('checkout.errors.title'));
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
        showCenterSuccess(t('address.success.updated'), t('checkout.success.title'));
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
        showCenterSuccess(t('address.success.added'), t('checkout.success.title'));
        await onAddressesChange();
        onSelect(newAddress.id);
      }
      resetForm();
    } catch (error: any) {
      showCenterError(error?.message || t('address.errors.cannotSave'), t('checkout.errors.title'));
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
    const confirmed = window.confirm(t('address.confirmDelete', { name: address.receiverName }));
    if (!confirmed) return;
    try {
      setIsSubmitting(true);
      await AddressService.deleteAddress(address.id);
      showCenterSuccess(t('address.success.deleted'), t('checkout.success.title'));
      const remaining = addresses.filter(a => a.id !== address.id);
      if (selectedAddressId === address.id) {
        const fallback = remaining.find(a => a.default) || remaining[0] || null;
        onSelect(fallback ? fallback.id : null);
      }
      await onAddressesChange();
    } catch (error: any) {
      showCenterError(error?.message || t('address.errors.cannotDelete'), t('checkout.errors.title'));
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
      showCenterSuccess(t('address.success.setDefault'), t('checkout.success.title'));
      await onAddressesChange();
      onSelect(address.id);
    } catch (error: any) {
      showCenterError(error?.message || t('address.errors.cannotSetDefault'), t('checkout.errors.title'));
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
            <p className="font-semibold text-gray-900">{t('address.title')}</p>
            <p className="text-xs text-gray-500">
              {t('address.description')}
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
          {t('address.addNew')}
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
                  {t('address.default')}
                </span>
              )}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowSelector(prev => !prev)}
              >
                {showSelector ? t('address.close') : t('address.change')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-sm text-gray-500">
          {t('address.empty')}
        </div>
      )}

      {(showForm || editingAddressId) && (
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              {editingAddressId ? t('address.editTitle') : t('address.add')}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-800"
              disabled={isSubmitting}
            >
              {t('address.close')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder={t('address.fullName')}
              value={formData.receiverName}
              onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder={t('address.phone')}
              value={formData.phoneNumber}
              onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <select
              className="border rounded px-3 py-2"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value as AddressLabel })}
            >
              <option value="HOME">{t('address.label.home')}</option>
              <option value="WORK">{t('address.label.work')}</option>
              <option value="OTHER">{t('address.label.other')}</option>
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
                {provincesLoading ? t('address.province.loading') : t('address.province.select')}
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
                  ? t('address.district.selectFirst')
                  : districtsLoading
                    ? t('address.district.loading')
                    : t('address.district.select')}
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
                  ? t('address.ward.selectFirst')
                  : wardsLoading
                    ? t('address.ward.loading')
                    : t('address.ward.select')}
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
              {isSubmitting ? t('address.saving') : editingAddressId ? t('address.saveChanges') : t('address.addAddress')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {t('address.cancel')}
            </button>
          </div>
        </div>
      )}

      {showSelector && addresses.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y">
          {(
            addresses.length > pageSize
              ? addresses.slice((currentPage - 1) * pageSize, currentPage * pageSize)
              : addresses
          ).map(address => {
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
                        {t('address.default')}
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
                      {t('address.edit')}
                    </button>
                    {!address.default && (
                      <button type="button" className="hover:underline" onClick={() => handleSetDefault(address)}>
                        {t('address.setDefault')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(address)}
                    >
                      {t('address.delete')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {addresses.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-xs text-gray-600">
              <button
                type="button"
                className={`px-2 py-1 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trang trước
              </button>
              <span>
                Trang {currentPage}/{Math.max(1, Math.ceil(addresses.length / pageSize))}
              </span>
              <button
                type="button"
                className={`px-2 py-1 rounded ${currentPage >= Math.ceil(addresses.length / pageSize) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                disabled={currentPage >= Math.ceil(addresses.length / pageSize)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(addresses.length / pageSize), p + 1))}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}

      {!showSelector && addresses.length > 0 && (
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700"
          onClick={() => setShowSelector(true)}
        >
          {t('address.viewAll')}
        </button>
      )}
    </div>
  );
};

export default AddressForm;
