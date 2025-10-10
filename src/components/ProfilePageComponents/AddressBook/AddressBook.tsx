import React, { useEffect, useState } from 'react';
import { Plus, Edit, MapPin, Trash2, Check } from 'lucide-react';
import ProfileCustomerService from '../../../services/customer/Profilecustomer';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  isDefault?: boolean;
}

const AddressBook: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: 'Việt Nam',
    province: '',
    district: '',
    ward: '',
    street: '',
    addressLine: '',
    postalCode: '',
    note: '',
    isDefault: false
  });

  useEffect(() => {
    const cid = localStorage.getItem('customer_id');
    if (!cid) return;
    ProfileCustomerService.getAddresses(cid)
      .then((list) => {
        const mapped = list.map((a) => ({
          id: a.id,
          name: a.receiverName,
          phone: a.phoneNumber,
          addressLine: `${a.addressLine || ''}${a.street ? `, ${a.street}` : ''}${a.ward ? `, ${a.ward}` : ''}${a.district ? `, ${a.district}` : ''}${a.province ? `, ${a.province}` : ''}${a.country ? `, ${a.country}` : ''}${a.postalCode ? ` (${a.postalCode})` : ''}`,
          isDefault: !!a.default,
        }));
        setAddresses(mapped);
      })
      .catch(() => {
        // silent
      });
  }, []);

  // Load provinces list on mount (VN public API)
  const [provinceOptions, setProvinceOptions] = useState<Array<{ code: number; name: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ code: number; name: string }>>([]);
  const [wardOptions, setWardOptions] = useState<Array<{ code: number; name: string }>>([]);
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then((r) => r.json())
      .then((data: Array<{ code: number; name: string }>) => setProvinceOptions(data))
      .catch(() => setProvinceOptions([]));
  }, []);

  // When province changes, load districts
  useEffect(() => {
    const selected = provinceOptions.find((p) => p.name === formData.province);
    if (!selected) {
      setDistrictOptions([]);
      setWardOptions([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/p/${selected.code}?depth=2`)
      .then((r) => r.json())
      .then((data: { districts?: Array<{ code: number; name: string }> }) => {
        setDistrictOptions(data?.districts || []);
        setWardOptions([]);
      })
      .catch(() => {
        setDistrictOptions([]);
        setWardOptions([]);
      });
  }, [formData.province, provinceOptions]);

  // When district changes, load wards
  useEffect(() => {
    const district = districtOptions.find((d) => d.name === formData.district);
    if (!district) {
      setWardOptions([]);
      return;
    }
    fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
      .then((r) => r.json())
      .then((data: { wards?: Array<{ code: number; name: string }> }) => setWardOptions(data?.wards || []))
      .catch(() => setWardOptions([]));
  }, [formData.district, districtOptions]);

  const handleAddAddress = () => {
    const cid = localStorage.getItem('customer_id');
    if (!cid || !formData.name || !formData.phone || !formData.addressLine) return;
    const payload = {
      receiverName: formData.name,
      phoneNumber: formData.phone,
      label: 'HOME' as const,
      country: formData.country,
      province: formData.province,
      district: formData.district,
      ward: formData.ward,
      street: formData.street,
      addressLine: formData.addressLine,
      postalCode: formData.postalCode,
      note: formData.note,
      isDefault: !!formData.isDefault,
    };
    ProfileCustomerService.addAddress(cid, payload)
      .then((resp) => {
        const a: any = resp?.data;
        if (!a) return;
        const item: AddressItem = {
          id: a.id,
          name: a.receiverName,
          phone: a.phoneNumber,
          addressLine: `${a.addressLine || ''}${a.street ? `, ${a.street}` : ''}${a.ward ? `, ${a.ward}` : ''}${a.district ? `, ${a.district}` : ''}${a.province ? `, ${a.province}` : ''}${a.country ? `, ${a.country}` : ''}${a.postalCode ? ` (${a.postalCode})` : ''}`,
          isDefault: !!(a.default ?? a.isDefault),
        };
        setAddresses((prev) => [...prev, item]);
        showCenterSuccess('Thêm địa chỉ thành công', 'Thành công');
        setFormData({ name: '', phone: '', country: '', province: '', district: '', ward: '', street: '', addressLine: '', postalCode: '', note: '', isDefault: false });
        setShowAddForm(false);
      })
      .catch((e) => showCenterError(e?.message || 'Thêm địa chỉ thất bại', 'Lỗi'));
  };

  const handleEditAddress = (address: AddressItem) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      country: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      addressLine: address.addressLine,
      postalCode: '',
      note: '',
      isDefault: address.isDefault || false
    });
    setEditingAddress(address.id);
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    const cid = localStorage.getItem('customer_id');
    if (!cid || !editingAddress || !formData.name || !formData.phone || !formData.addressLine) return;
    const payload = {
      receiverName: formData.name,
      phoneNumber: formData.phone,
      label: 'HOME' as const,
      country: formData.country,
      province: formData.province,
      district: formData.district,
      ward: formData.ward,
      street: formData.street,
      addressLine: formData.addressLine,
      postalCode: formData.postalCode,
      note: formData.note,
      isDefault: !!formData.isDefault,
    };
    ProfileCustomerService.updateAddress(cid, editingAddress, payload)
      .then((a) => {
        const item: AddressItem = {
          id: a.id,
          name: a.receiverName,
          phone: a.phoneNumber,
          addressLine: `${a.addressLine || ''}${a.street ? `, ${a.street}` : ''}${a.ward ? `, ${a.ward}` : ''}${a.district ? `, ${a.district}` : ''}${a.province ? `, ${a.province}` : ''}${a.country ? `, ${a.country}` : ''}${a.postalCode ? ` (${a.postalCode})` : ''}`,
          isDefault: !!(a.default ?? (a as any).isDefault),
        };
        setAddresses((prev) => prev.map(addr => addr.id === editingAddress ? item : addr));
        showCenterSuccess('Cập nhật địa chỉ thành công', 'Thành công');
        setEditingAddress(null);
        setFormData({ name: '', phone: '', country: '', province: '', district: '', ward: '', street: '', addressLine: '', postalCode: '', note: '', isDefault: false });
      })
      .catch((e) => showCenterError(e?.message || 'Cập nhật địa chỉ thất bại', 'Lỗi'));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    setFormData({ name: '', phone: '', country: '', province: '', district: '', ward: '', street: '', addressLine: '', postalCode: '', note: '', isDefault: false });
  };

  const handleDeleteAddress = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    // Chưa có API xóa -> cập nhật local
    setAddresses((prev) => prev.filter(a => a.id !== id));
    setSelectedAddress(null);
  };

  const handleSetDefault = (id: string) => {
    // Nếu backend có endpoint, có thể gọi updateAddress với isDefault=true
    setAddresses((prev) => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">-- Chọn Tỉnh/Thành --</option>
                {provinceOptions.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value, ward: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                disabled={!formData.province}
              >
                <option value="">-- Chọn Quận/Huyện --</option>
                {districtOptions.map((d) => (
                  <option key={d.code} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                disabled={!formData.district}
              >
                <option value="">-- Chọn Phường/Xã --</option>
                {wardOptions.map((w) => (
                  <option key={w.code} value={w.name}>{w.name}</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã bưu chính</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ví dụ: 70004"
              />
            </div>
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
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              {editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <p className="font-semibold text-gray-900">{addr.name}</p>
                    <span className="text-gray-500">·</span>
                    <p className="text-gray-600">{addr.phone}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{addr.addressLine}</p>
                  {addr.isDefault && (
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
                    {!addr.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(addr.id);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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


