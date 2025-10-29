import React, { useState } from 'react';
import type { CheckoutAddress } from '../../data/checkout';

interface AddressFormProps {
  addresses: CheckoutAddress[];
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ addresses, selectedAddressId, onSelect }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<CheckoutAddress>>({ fullName: '', phone: '', street: '', district: '', city: '' });

  const submitNew = () => {
    // demo only: in real case, submit to server then refresh list
    if (!form.fullName || !form.phone || !form.street || !form.city) return;
    const newId = 'addr_' + Date.now();
    const newAddr: CheckoutAddress = {
      id: newId,
      fullName: form.fullName!,
      phone: form.phone!,
      street: form.street!,
      district: form.district || '',
      city: form.city!,
    };
    addresses.push(newAddr);
    onSelect(newId);
    setIsAdding(false);
    setForm({});
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h3>
        <button onClick={() => setIsAdding(v => !v)} className="text-sm text-orange-600 hover:underline">
          {isAdding ? 'Hủy' : 'Thêm địa chỉ mới'}
        </button>
      </div>

      {!isAdding ? (
        <div className="space-y-2">
          {addresses.map(a => (
            <label key={a.id} className="flex items-start gap-3 p-3 border rounded-lg hover:border-gray-300 cursor-pointer">
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === a.id}
                onChange={() => onSelect(a.id)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900">{a.fullName} • {a.phone}</p>
                <p className="text-sm text-gray-600">{a.street}, {a.district}, {a.city}</p>
                {a.isDefault && <span className="inline-block text-xs text-white bg-gray-800 rounded px-2 py-0.5 mt-1">Mặc định</span>}
              </div>
            </label>
          ))}
          {addresses.length === 0 && (
            <p className="text-sm text-gray-500">Chưa có địa chỉ. Vui lòng thêm địa chỉ mới.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="Họ tên" className="border rounded px-3 py-2"
            value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input placeholder="Số điện thoại" className="border rounded px-3 py-2"
            value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Địa chỉ (số nhà, đường)" className="border rounded px-3 py-2 md:col-span-2"
            value={form.street || ''} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <input placeholder="Quận/Huyện" className="border rounded px-3 py-2"
            value={form.district || ''} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <input placeholder="Tỉnh/Thành phố" className="border rounded px-3 py-2"
            value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <div className="md:col-span-2 flex gap-2">
            <button onClick={submitNew} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded">Lưu địa chỉ</button>
            <button onClick={() => { setIsAdding(false); setForm({}); }} className="px-4 py-2 border rounded">Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressForm;


