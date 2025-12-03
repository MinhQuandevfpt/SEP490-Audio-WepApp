import React from 'react';
import ShippingFeeCalculator from './ShippingFeeCalculator';
import SummaryBox from './SummaryBox';
import type { CartItem } from '../../data/shoppingcart';
import type { CustomerAddressApiItem } from '../../types/api';
import type { Product } from '../../services/customer/ProductListService';

interface CartSummarySidebarProps {
  items: CartItem[];
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  productCache: Map<string, Product>;
  onProductCacheUpdate: (cache: Map<string, Product>) => void;
  serviceTypeId: 2 | 5;
  onServiceTypeIdChange: (id: 2 | 5) => void;
  packageWeight: number;
  onPackageWeightChange: (weight: number) => void;
  shippingFee: number;
  onShippingFeeChange: (fee: number) => void;
  subtotal: number;
  discount: number;
  voucherDiscount: number;
  selectedCount: number;
  grandTotal: number;
  onCheckout: () => void;
  isCheckingOut: boolean;
  disabled: boolean;
  selectedVoucherCodes?: string[];
}

const CartSummarySidebar: React.FC<CartSummarySidebarProps> = ({
  items,
  addresses,
  selectedAddressId,
  productCache,
  onProductCacheUpdate,
  serviceTypeId,
  onServiceTypeIdChange,
  packageWeight,
  onPackageWeightChange,
  shippingFee,
  onShippingFeeChange,
  subtotal,
  discount,
  voucherDiscount,
  selectedCount,
  grandTotal,
  onCheckout,
  isCheckingOut,
  disabled,
  selectedVoucherCodes,
}) => {
  return (
    <aside className="lg:col-span-1">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <ShippingFeeCalculator
          items={items}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          productCache={productCache}
          onProductCacheUpdate={onProductCacheUpdate}
          serviceTypeId={serviceTypeId}
          onServiceTypeIdChange={onServiceTypeIdChange}
          packageWeight={packageWeight}
          onPackageWeightChange={onPackageWeightChange}
          onShippingFeeChange={onShippingFeeChange}
        />

        <SummaryBox
          subtotal={subtotal}
          discount={discount}
          shippingFee={shippingFee}
          voucherDiscount={voucherDiscount}
          selectedCount={selectedCount}
          grandTotal={grandTotal}
          onCheckout={onCheckout}
          isCheckingOut={isCheckingOut}
          disabled={disabled}
          selectedVoucherCodes={selectedVoucherCodes}
        />
      </div>
    </aside>
  );
};

export default CartSummarySidebar;

