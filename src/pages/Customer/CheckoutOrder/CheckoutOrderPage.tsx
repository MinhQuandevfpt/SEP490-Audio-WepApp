import React from 'react';
import Layout from '../../../components/Layout';
import { AddressForm, ShippingMethodDropdown, PaymentMethodDropdown, CartItemList, OrderSummaryCard } from '../../../components/CheckoutOrderComponents';
import useCheckout from '../../../hooks/useCheckout';
import { Home, ChevronRight } from 'lucide-react';

const CheckoutOrderPage: React.FC = () => {
  const {
    addresses,
    items,
    selectedAddressId,
    shippingMethod,
    paymentMethod,
    shippingFee,
    summary,
    isLoading,
    isSubmitting,
    error,
    setSelectedAddressId,
    setShippingMethod,
    setPaymentMethod,
    inc,
    dec,
    removeItem,
    submit,
  } = useCheckout();

  const getShipPrice = (m: any) => m === 'express' ? 30000 : m === 'economy' ? 10000 : 15000;

  const handleSubmit = async () => {
    const res = await submit();
    if (res) {
      // demo: redirect optional, here just alert
      alert(`Đặt hàng thành công! Mã đơn: ${res.orderId} • Tổng: ${new Intl.NumberFormat('vi-VN').format(res.total)}đ`);
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header + Breadcrumb */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4" />
              <span>Giỏ hàng</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">Thanh toán</span>
              <ChevronRight className="w-4 h-4" />
              <span>Xác nhận</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-3">Đang tải dữ liệu thanh toán...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <AddressForm addresses={addresses} selectedAddressId={selectedAddressId} onSelect={setSelectedAddressId} />
              <CartItemList items={items} onInc={inc} onDec={dec} onRemove={removeItem} />
              <ShippingMethodDropdown value={shippingMethod} onChange={setShippingMethod} getPrice={getShipPrice} />
            </div>

            <aside className="lg:col-span-1 space-y-4">
              {error && (
                <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
              )}
              <PaymentMethodDropdown value={paymentMethod} onChange={setPaymentMethod} />
              <OrderSummaryCard
                subtotal={summary.subtotal}
                discount={summary.discount}
                shippingFee={shippingFee}
                total={summary.total}
                disabled={isSubmitting || !selectedAddressId || !paymentMethod || !shippingMethod || items.length === 0}
                onSubmit={handleSubmit}
              />
              {isSubmitting && (
                <p className="text-xs text-gray-500 text-center">Đang gửi đơn hàng...</p>
              )}
            </aside>
          </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutOrderPage;

