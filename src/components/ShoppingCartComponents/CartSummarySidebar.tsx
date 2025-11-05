import React from 'react';
import PaymentMethodDropdown from '../CheckoutOrderComponents/PaymentMethodDropdown';
import VoucherSection, { type ShopVoucher } from './VoucherSection';
import ShippingFeeCalculator from './ShippingFeeCalculator';
import SummaryBox from './SummaryBox';
import type { PaymentMethod } from '../../data/checkout';
import type { CartItem } from '../../data/shoppingcart';
import type { CustomerAddressApiItem } from '../../types/api';
import type { Product } from '../../services/customer/ProductListService';

interface CartSummarySidebarProps {
  paymentMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod | null) => void;
  voucherInput: string;
  appliedVoucher: {
    code: string;
    type: 'FIXED' | 'PERCENT';
    discountValue: number;
    storeId: string;
  } | null;
  availableVouchers: ShopVoucher[];
  onVoucherInputChange: (input: string) => void;
  onApplyVoucher: (voucher: ShopVoucher) => void;
  onChooseVoucher: (voucher: ShopVoucher) => void;
  onClearVoucher: () => void;
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
}

const CartSummarySidebar: React.FC<CartSummarySidebarProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  voucherInput,
  appliedVoucher,
  availableVouchers,
  onVoucherInputChange,
  onApplyVoucher,
  onChooseVoucher,
  onClearVoucher,
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
}) => {
  return (
    <aside className="lg:col-span-1">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Payment Method - above voucher section */}
        <PaymentMethodDropdown value={paymentMethod} onChange={onPaymentMethodChange} />

        {/* Voucher - input or choose */}
        <div className="pt-2">
          <VoucherSection
            voucherInput={voucherInput}
            appliedVoucher={appliedVoucher}
            availableVouchers={availableVouchers}
            items={items}
            productCache={productCache}
            subtotal={subtotal}
            onChangeInput={onVoucherInputChange}
            onApply={onApplyVoucher}
            onChoose={onChooseVoucher}
            onClear={onClearVoucher}
          />
        </div>

        {/* Shipping Fee Check (GHN) */}
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

        {/* Summary Box */}
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
        />
      </div>
    </aside>
  );
};

export default CartSummarySidebar;

