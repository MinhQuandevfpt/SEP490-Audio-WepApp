import React from 'react';
import type { CartItem } from '../../data/shoppingcart';
import type { CustomerAddressApiItem } from '../../types/api';
import type { ShopVoucher } from './VoucherSection';
import type { AppliedStoreVoucher } from './StoreVoucherPicker';
import AddressSelectorCompact from './AddressSelectorCompact';
import SelectAllBar from './SelectAllBar';
import CartItemRow from './CartItemRow';

interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  vouchers: ShopVoucher[];
  appliedVoucher?: AppliedStoreVoucher;
  selectedTotal: number;
}

interface CartItemsListProps {
  storeGroups: StoreGroup[];
  totalItemCount: number;
  productVoucherAvailability: Record<string, boolean>;
  showAddress?: boolean;
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
  onApplyVoucher: (storeId: string, voucher: ShopVoucher, discountValue: number) => void;
  onRemoveVoucher: (storeId: string) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  storeGroups,
  totalItemCount,
  productVoucherAvailability,
  addresses,
  selectedAddressId,
  addressesLoading,
  allSelected,
  showAddress = true,
  onAddressSelect,
  onAddressesChange,
  onToggleAll,
  onDeleteAll,
  onToggleItem,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
  onApplyVoucher,
  onRemoveVoucher,
}) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      {showAddress && (
        addressesLoading ? (
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
        )
      )}

      <SelectAllBar
        allSelected={allSelected}
        itemCount={totalItemCount}
        onToggleAll={onToggleAll}
        onDeleteAll={onDeleteAll}
      />

      {storeGroups.map(group => (
        <div key={group.storeId} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">{group.storeName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Đã chọn {group.items.filter(it => it.isSelected).length}/{group.items.length} sản phẩm
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {group.items.map(it => {
              const hasVoucher = productVoucherAvailability[it.productId] ?? false;
              return (
                <CartItemRow
                  key={it.id}
                  item={it}
                  onToggle={onToggleItem}
                  onInc={onInc}
                  onDec={onDec}
                  onRemove={onRemove}
                  onSetQuantity={onSetQuantity}
                  storeId={group.storeId}
                  storeName={group.storeName}
                  vouchers={hasVoucher ? group.vouchers : []}
                  appliedVoucher={group.appliedVoucher}
                  selectedTotal={group.selectedTotal}
                  onApplyVoucher={onApplyVoucher}
                  onRemoveVoucher={onRemoveVoucher}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartItemsList;

