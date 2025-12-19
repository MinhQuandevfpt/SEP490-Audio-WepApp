import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, MapPin, Trash2, Check } from 'lucide-react';
import { AddressService } from '../../../services/customer/AddressService';
import { useProvinces } from '../../../hooks/useProvinces';
import { useDistricts } from '../../../hooks/useDistricts';
import { useWards } from '../../../hooks/useWards';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import LoadingSkeleton from '../../common/LoadingSkeleton';
import type { CustomerAddressApiItem, AddressLabel } from '../../../types/api';

// Using API type directly
type AddressItem = CustomerAddressApiItem;

interface AddressBookProps {
  preloadedData?: {
    addresses?: any[];
    provinces?: any[];
  };
  customerId?: string | null;
}

const AddressBook: React.FC<AddressBookProps> = ({ preloadedData }) => {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
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
  }>({
    receiverName: '',
    phoneNumber: '',
    label: 'HOME',
    country: 'Việt Nam',
    province: '',
    district: '',
    ward: '',
    street: '',
    addressLine: '',
    postalCode: '', // Postal code will be set based on province/ward selection or left empty for backend to handle
    note: '',
    isDefault: false,
    provinceCode: '',
    districtId: null,
    wardCode: ''
  });

  // Province/District/Ward cascading selections (same as AddressFormForCart)
  const { provinces, loading: provincesLoading } = useProvinces();
  const selectedProvince = useMemo(() => provinces.find(p => p.ProvinceName === formData.province) || null, [provinces, formData.province]);
  const { districts, loading: districtsLoading } = useDistricts(selectedProvince ? selectedProvince.ProvinceID : null);
  const selectedDistrict = useMemo(() => districts.find(d => d.DistrictName === formData.district) || null, [districts, formData.district]);
  const { wards, loading: wardsLoading } = useWards(selectedDistrict ? selectedDistrict.DistrictID : null);

  // Sync code fields when selections change
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

  const loadAddresses = async () => {
    if (!AddressService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const list = await AddressService.getAddresses();
      setAddresses(list);
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Use preloaded data if available
    if (preloadedData?.addresses) {
      setAddresses(preloadedData.addresses as CustomerAddressApiItem[]);
      setIsLoading(false);
      return;
    }

    // Fetch from API using AddressService
    loadAddresses();
  }, [preloadedData]);

  const [isLoading, setIsLoading] = useState(false);

  const handleAddAddress = async () => {
    if (!formData.receiverName || !formData.phoneNumber || !formData.province || !formData.district || !formData.ward || !formData.street) {
      showCenterError('Vui lòng điền đầy đủ thông tin địa chỉ', 'Lỗi');
      return;
    }

    if (!formData.addressLine) {
      formData.addressLine = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.province}`;
    }

    // Validate new code fields
    if (!formData.provinceCode || formData.districtId == null || !formData.wardCode) {
      showCenterError('Thiếu mã địa lý: vui lòng chọn Tỉnh/Quận/Phường hợp lệ', 'Lỗi');
      return;
    }

    try {
      setIsSubmitting(true);
      await AddressService.createAddress({
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
        districtId: formData.districtId,
        wardCode: formData.wardCode,
      });
      showCenterSuccess('Thêm địa chỉ thành công', 'Thành công');
      await loadAddresses();
      setFormData({
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
        wardCode: ''
      });
      setShowAddForm(false);
    } catch (error: any) {
      showCenterError(error?.message || 'Thêm địa chỉ thất bại', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = (address: AddressItem) => {
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
      wardCode: (address as any).wardCode || ''
    });
    setEditingAddress(address.id);
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingAddress || !formData.receiverName || !formData.phoneNumber || !formData.province || !formData.district || !formData.ward || !formData.street) {
      showCenterError('Vui lòng điền đầy đủ thông tin địa chỉ', 'Lỗi');
      return;
    }

    if (!formData.addressLine) {
      formData.addressLine = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.province}`;
    }

    try {
      setIsSubmitting(true);
      await AddressService.updateAddress(editingAddress, {
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
      await loadAddresses();
      setEditingAddress(null);
      setFormData({
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
        wardCode: ''
      });
    } catch (error: any) {
      showCenterError(error?.message || 'Cập nhật địa chỉ thất bại', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    setFormData({
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
      wardCode: ''
    });
  };

  const handleDeleteAddress = async (id: string) => {
    const addressToDelete = addresses.find(a => a.id === id);
    if (!addressToDelete) return;

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa địa chỉ "${addressToDelete.receiverName}"?`);
    if (!confirmDelete) return;

    try {
      setIsSubmitting(true);
      await AddressService.deleteAddress(id);
      showCenterSuccess('Xóa địa chỉ thành công', 'Thành công');
      await loadAddresses();
      if (selectedAddress === id) {
        setSelectedAddress(null);
      }
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại.', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <LoadingSkeleton type="address" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sổ địa chỉ</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm địa chỉ nhận hàng
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingAddress) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại địa chỉ</label>
              <select
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value as AddressLabel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="HOME">Nhà riêng</option>
                <option value="WORK">Cơ quan</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
              <input
                type="text"
                value={formData.country}
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value, district: '', ward: '' })}
                disabled={provincesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:bg-gray-100"
              >
                <option value="">{provincesLoading ? 'Đang tải tỉnh/thành...' : '-- Chọn Tỉnh/Thành --'}</option>
                {provinces.map((p) => (
                  <option key={p.ProvinceID} value={p.ProvinceName}>{p.ProvinceName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value, ward: '' })}
                disabled={!formData.province || districtsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:bg-gray-100"
              >
                <option value="">{!formData.province ? 'Chọn tỉnh trước' : (districtsLoading ? 'Đang tải quận/huyện...' : '-- Chọn Quận/Huyện --')}</option>
                {districts.map((d) => (
                  <option key={d.DistrictID} value={d.DistrictName}>{d.DistrictName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                disabled={!formData.district || wardsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white disabled:bg-gray-100"
              >
                <option value="">{!formData.district ? 'Chọn quận/huyện trước' : (wardsLoading ? 'Đang tải phường/xã...' : '-- Chọn Phường/Xã --')}</option>
                {wards.map((w) => (
                  <option key={w.WardCode} value={w.WardName}>{w.WardName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đường *</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ví dụ: Hà Huy Giáp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số nhà/Địa chỉ chi tiết *</label>
              <input
                type="text"
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ví dụ: 58/4"
              />
            </div>
            {/* postalCode is hidden, will be set by backend based on province/ward or left empty */}
            <input
              type="hidden"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingAddress ? handleSaveEdit : handleAddAddress}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Đang lưu...' : (editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ')}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Chưa có địa chỉ nào</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedAddress === addr.id 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedAddress(selectedAddress === addr.id ? null : addr.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{addr.receiverName}</p>
                    <span className="text-gray-500">·</span>
                    <p className="text-gray-600">{addr.phoneNumber}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {([addr.street, addr.addressLine].filter(Boolean) as string[]).join(', ')}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {([addr.ward, addr.district, addr.province].filter(Boolean) as string[]).join(', ')}
                  </p>
                  {addr.default && (
                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Mặc định
                    </span>
                  )}
                </div>
                
                {/* Action buttons - show when selected */}
                {selectedAddress === addr.id && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(addr);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!addr.default && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await AddressService.updateAddress(addr.id, {
                              ...addr,
                              isDefault: true,
                            } as any);
                            showCenterSuccess('Đặt làm địa chỉ mặc định thành công', 'Thành công');
                            await loadAddresses();
                          } catch (error: any) {
                            showCenterError(error?.message || 'Không thể đặt làm mặc định', 'Lỗi');
                          }
                        }}
                        disabled={isSubmitting}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Đặt làm mặc định"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(addr.id);
                      }}
                      disabled={isSubmitting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa địa chỉ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {addresses.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Hướng dẫn:</strong> Nhấp vào địa chỉ để chọn và hiển thị các tùy chọn chỉnh sửa, xóa hoặc đặt làm mặc định.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressBook;


