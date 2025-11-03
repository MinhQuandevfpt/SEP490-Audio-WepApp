import React, { useState } from 'react';
import type { CustomerAddressApiItem } from '../../types/api';
import { ChevronDown, Edit2, Trash2 } from 'lucide-react';
import AddressFormForCart from './AddressFormForCart';
import { AddressService } from '../../services/customer/AddressService';
import { toast } from 'react-toastify';

interface Props {
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onAddressesChange: () => void;
}

const AddressSelectorCompact: React.FC<Props> = ({ addresses, selectedAddressId, onSelect, onAddressesChange }) => {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const selected = addresses.find(a => a.id === selectedAddressId) || null;
  const editingAddress = editingAddressId ? addresses.find(a => a.id === editingAddressId) : null;

  const handleEdit = (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    setEditingAddressId(addressId);
    setOpen(false);
  };

  const handleEditComplete = () => {
    setEditingAddressId(null);
    onAddressesChange();
  };

  const handleDelete = async (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    const addressToDelete = addresses.find(a => a.id === addressId);
    if (!addressToDelete) return;

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa địa chỉ "${addressToDelete.receiverName}"?`);
    if (!confirmDelete) return;

    try {
      await AddressService.deleteAddress(addressId);
      toast.success('Xóa địa chỉ thành công!');
      
      // If deleted address was selected, select default or first available
      if (addressId === selectedAddressId) {
        const remaining = addresses.filter(a => a.id !== addressId);
        const nextDefault = remaining.find(a => a.default) || remaining[0];
        if (nextDefault) {
          onSelect(nextDefault.id);
        }
      }
      
      onAddressesChange();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại.');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Địa chỉ nhận hàng</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setShowAddForm(true); setOpen(false); }} 
            className="text-sm text-orange-600 hover:underline"
          >
            Thêm địa chỉ mới
          </button>
          <button onClick={() => setOpen(o => !o)} className="text-sm text-gray-700 flex items-center gap-1">
            <span>Đổi</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Edit form (if editing) */}
      {editingAddressId && editingAddress && (
        <AddressFormForCart
          selectedAddressId={selectedAddressId}
          onSelect={onSelect}
          onAddressesChange={handleEditComplete}
          editingAddress={editingAddress}
          onCancel={() => setEditingAddressId(null)}
        />
      )}

      {/* Add form (if adding) */}
      {showAddForm && !editingAddressId && (
        <AddressFormForCart
          selectedAddressId={selectedAddressId}
          onSelect={onSelect}
          onAddressesChange={() => { setShowAddForm(false); onAddressesChange(); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Selected address card (only show when not editing/adding) */}
      {!showAddForm && !editingAddressId && (
        <>
          {selected ? (
            <div className="p-3 border rounded-lg relative group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selected.receiverName} • {selected.phoneNumber}</p>
                  <p className="text-sm text-gray-600">
                    {([selected.street, selected.addressLine].filter(Boolean) as string[]).join(', ')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {([selected.ward, selected.district, selected.province].filter(Boolean) as string[]).join(', ')}
                  </p>
                  {selected.default && <span className="inline-block text-xs text-white bg-gray-800 rounded px-2 py-0.5 mt-1">Mặc định</span>}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => handleEdit(e, selected.id)}
                    className="text-gray-500 hover:text-orange-600"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, selected.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Xóa địa chỉ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 border rounded-lg text-sm text-gray-500">Chưa có địa chỉ. Vui lòng thêm địa chỉ mới.</div>
          )}

          {/* Dropdown list */}
          {open && addresses.length > 0 && (
            <div className="mt-2 border rounded-lg divide-y">
              {addresses.map(a => (
                <div
                  key={a.id}
                  className={`p-3 hover:bg-gray-50 ${a.id === selectedAddressId ? 'bg-orange-50' : ''}`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => { onSelect(a.id); setOpen(false); }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.receiverName} • {a.phoneNumber}</p>
                        <p className="text-xs text-gray-600">
                          {([a.street, a.addressLine].filter(Boolean) as string[]).join(', ')}
                        </p>
                        <p className="text-[11px] text-gray-600">
                          {([a.ward, a.district, a.province].filter(Boolean) as string[]).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => handleEdit(e, a.id)}
                          className="text-gray-500 hover:text-orange-600"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, a.id)}
                          className="text-gray-500 hover:text-red-600"
                          title="Xóa địa chỉ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressSelectorCompact;


