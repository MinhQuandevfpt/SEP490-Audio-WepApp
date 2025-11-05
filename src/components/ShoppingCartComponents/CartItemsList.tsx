import React from 'react';
import type { CartItem } from '../../data/shoppingcart';
import type { CustomerAddressApiItem } from '../../types/api';
import AddressSelectorCompact from './AddressSelectorCompact';
import SelectAllBar from './SelectAllBar';
import CartItemRow from './CartItemRow';

interface CartItemsListProps {
  items: CartItem[];
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  addressesLoading: boolean;
  allSelected: boolean;
  onAddressSelect: (addressId: string) => void;
  onAddressesChange: () => void;
  onToggleAll: () => void;
  onDeleteAll: () => void;
  onToggleItem: (id: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onSetQuantity: (id: string, quantity: number) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  items,
  addresses,
  selectedAddressId,
  addressesLoading,
  allSelected,
  onAddressSelect,
  onAddressesChange,
  onToggleAll,
  onDeleteAll,
  onToggleItem,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
}) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Address Section (compact) */}
      {addressesLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-sm text-gray-500 mt-2">Đang tải địa chỉ...</p>
        </div>
      ) : (
        <AddressSelectorCompact
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelect={onAddressSelect}
          onAddressesChange={onAddressesChange}
        />
      )}

      {/* Header controls */}
      <SelectAllBar
        allSelected={allSelected}
        itemCount={items.length}
        onToggleAll={onToggleAll}
        onDeleteAll={onDeleteAll}
      />

      {/* List */}
      {items.map(it => (
        <CartItemRow
          key={it.id}
          item={it}
          onToggle={onToggleItem}
          onInc={onInc}
          onDec={onDec}
          onRemove={onRemove}
          onSetQuantity={onSetQuantity}
        />
      ))}
    </div>
  );
};

export default CartItemsList;

