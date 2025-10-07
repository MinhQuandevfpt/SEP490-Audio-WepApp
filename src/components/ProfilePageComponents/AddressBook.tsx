import React from 'react';

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  isDefault?: boolean;
}

interface AddressBookProps {
  addresses: AddressItem[];
}

const AddressBook: React.FC<AddressBookProps> = ({ addresses }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Sổ địa chỉ</h2>
      {addresses.length === 0 ? (
        <p className="text-gray-500">Chưa có địa chỉ.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{addr.name} · {addr.phone}</p>
                  <p className="text-sm text-gray-600 mt-1">{addr.addressLine}</p>
                </div>
                {addr.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Mặc định</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressBook;


