# Test Cases - Shopping Cart Feature

## Summary Dashboard

| Feature | Shopping Cart |
|---------|---------------|
| **Test requirement** | Test tính năng quản lý giỏ hàng, bao gồm thêm/xóa sản phẩm, cập nhật số lượng, áp dụng voucher, chọn địa chỉ, và checkout |
| **Number of TCs** | 25 |

| Testing Round | Passed | Failed | Pending | N/A |
|---------------|--------|--------|---------|-----|
| Round 1 | 0 | 0 | 25 | 0 |
| Round 2 | 0 | 0 | 25 | 0 |
| Round 3 | 0 | 0 | 25 | 0 |

---

## Test Cases Detail

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|--------------|----------------------|---------------------|------------------|----------------|---------|-----------|--------|---------|-----------|--------|---------|-----------|--------|------|
| **Function: Load Cart & Display** | | | | | | | | | | | | | | |
| TC-CART-001 | Load shopping cart successfully | 1. Navigate to `/cart`<br>2. Page automatically loads cart data | 1. API call `GET /api/v1/customers/{customerId}/cart` succeeds<br>2. Cart items are displayed grouped by store<br>3. Each item shows: image, name, variant, price, quantity<br>4. Summary box shows subtotal, discount, grand total<br>5. Address selector displays default address | 1. User is logged in<br>2. Cart has at least 1 item<br>3. Browser is open and connected to internet | Pending | | | Pending | | | Pending | | | |
| TC-CART-002 | Display empty cart state | 1. Navigate to `/cart`<br>2. Wait for API response | 1. API call returns empty items array<br>2. Empty state message displays: "Giỏ hàng của bạn đang trống"<br>3. "Tiếp tục mua sắm" button is available<br>4. Summary box shows 0 for all values | 1. User is logged in<br>2. Cart is empty<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-003 | Display cart items with campaign price | 1. Navigate to `/cart`<br>2. Find item with platform campaign | 1. Item displays discounted price (red-600, font-semibold)<br>2. Original price displays with line-through (gray-400)<br>3. Campaign remaining message shows if applicable<br>4. Price calculation is correct | 1. User is logged in<br>2. Cart has item in active platform campaign<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Item Selection** | | | | | | | | | | | | | | |
| TC-CART-004 | Toggle item selection | 1. Navigate to `/cart`<br>2. Click checkbox on a cart item | 1. Item selection toggles (isSelected changes)<br>2. Icon changes from Square to CheckSquare or vice versa<br>3. Summary box updates to reflect selected items only<br>4. Grand total recalculates | 1. User is logged in<br>2. Cart has at least 1 item<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-005 | Select all items | 1. Navigate to `/cart`<br>2. Click "Chọn tất cả" button in SelectAllBar | 1. All items are selected (isSelected = true)<br>2. SelectAllBar shows CheckSquare icon<br>3. Summary box shows total for all items<br>4. Grand total includes all items | 1. User is logged in<br>2. Cart has at least 2 items<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-006 | Deselect all items | 1. Navigate to `/cart`<br>2. All items are selected<br>3. Click "Chọn tất cả" button again | 1. All items are deselected (isSelected = false)<br>2. SelectAllBar shows Square icon<br>3. Summary box shows 0 for all values<br>4. Checkout button is disabled | 1. User is logged in<br>2. Cart has at least 2 items<br>3. All items are selected<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Quantity Management** | | | | | | | | | | | | | | |
| TC-CART-007 | Increase item quantity | 1. Navigate to `/cart`<br>2. Find a cart item<br>3. Click "+" button | 1. Quantity increases by 1<br>2. API call `POST /api/v1/customers/cart/update-quantity-with-vouchers` succeeds<br>3. UI updates with new quantity<br>4. Line total recalculates (price × quantity)<br>5. Summary box updates | 1. User is logged in<br>2. Cart has at least 1 item<br>3. Current quantity < 99<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-008 | Decrease item quantity | 1. Navigate to `/cart`<br>2. Find a cart item with quantity > 1<br>3. Click "-" button | 1. Quantity decreases by 1<br>2. API call succeeds<br>3. UI updates with new quantity<br>4. Line total recalculates<br>5. Summary box updates | 1. User is logged in<br>2. Cart has at least 1 item<br>3. Current quantity > 1<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-009 | Set quantity manually | 1. Navigate to `/cart`<br>2. Click on quantity input field<br>3. Enter new quantity (e.g., 5)<br>4. Press Enter or blur input | 1. Input field accepts numeric input only<br>2. Quantity is clamped between 1 and 99<br>3. On blur/Enter, API call is made if quantity changed<br>4. UI syncs with API response<br>5. Summary box updates | 1. User is logged in<br>2. Cart has at least 1 item<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-010 | Quantity validation - Min/Max limits | 1. Navigate to `/cart`<br>2. Click on quantity input<br>3. Enter 0 or negative number<br>4. Enter number > 99 | 1. Value < 1 is automatically adjusted to 1<br>2. Value > 99 is automatically adjusted to 99<br>3. Validation prevents invalid input<br>4. Only numeric characters are allowed | 1. User is logged in<br>2. Cart has at least 1 item<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Remove Items** | | | | | | | | | | | | | | |
| TC-CART-011 | Remove single item | 1. Navigate to `/cart`<br>2. Find a cart item<br>3. Click Trash icon | 1. API call `DELETE /api/v1/customers/{customerId}/cart/items` succeeds<br>2. Success notification: "Đã xóa sản phẩm khỏi giỏ hàng"<br>3. Item is removed from UI immediately<br>4. Summary box updates<br>5. Cart icon in header decreases count | 1. User is logged in<br>2. Cart has at least 1 item<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-012 | Delete all items | 1. Navigate to `/cart`<br>2. Click "Xóa tất cả" button in SelectAllBar<br>3. Confirm deletion in modal | 1. Confirmation modal displays: "Bạn có chắc muốn xóa tất cả sản phẩm?"<br>2. API call `DELETE /api/v1/customers/{customerId}/cart` succeeds<br>3. Success notification displays<br>4. All items are removed<br>5. Empty cart state displays | 1. User is logged in<br>2. Cart has at least 2 items<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Store Voucher (Per Product)** | | | | | | | | | | | | | | |
| TC-CART-013 | Apply store voucher to product | 1. Navigate to `/cart`<br>2. Find item with available vouchers<br>3. Click voucher picker<br>4. Select a voucher from list | 1. Voucher picker opens showing available vouchers<br>2. Voucher is applied to product<br>3. Voucher code displays in item card<br>4. Discount is calculated and applied<br>5. Summary box updates with voucher discount | 1. User is logged in<br>2. Cart has item with vouchers available<br>3. Voucher meets minOrderValue requirement<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-014 | Remove store voucher from product | 1. Navigate to `/cart`<br>2. Find item with applied voucher<br>3. Click "Xóa" button on voucher card | 1. Voucher is removed from product<br>2. Voucher card disappears<br>3. Discount is removed from calculation<br>4. Summary box updates (grand total increases) | 1. User is logged in<br>2. Cart has item with voucher applied<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-015 | Voucher validation - Min order value not met | 1. Navigate to `/cart`<br>2. Find item with voucher requiring minOrderValue<br>3. Ensure selectedTotal < minOrderValue<br>4. Try to apply voucher | 1. Voucher is shown as unusable in picker<br>2. Reason displays: "Đơn hàng tối thiểu {amount}đ"<br>3. Voucher cannot be clicked<br>4. Error shows if user tries to apply | 1. User is logged in<br>2. Cart has item with voucher<br>3. selectedTotal < minOrderValue<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-016 | Voucher validation - Voucher already used by another product | 1. Navigate to `/cart`<br>2. Have 2 items from same store<br>3. Apply voucher to item 1<br>4. Try to apply same voucher to item 2 | 1. Error notification: "Voucher {code} đã được sử dụng bởi {productName}"<br>2. Voucher is disabled in picker for item 2<br>3. Voucher cannot be applied to item 2 | 1. User is logged in<br>2. Cart has at least 2 items from same store<br>3. Voucher is already applied to one item<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Address Selection** | | | | | | | | | | | | | | |
| TC-CART-017 | Select delivery address | 1. Navigate to `/cart`<br>2. Click "Thay đổi" button in AddressSelectorCompact<br>3. Select an address from dropdown | 1. Address dropdown opens<br>2. Selected address is highlighted<br>3. selectedAddressId is updated<br>4. Address card displays selected address details<br>5. Dropdown closes after selection | 1. User is logged in<br>2. User has at least 2 addresses<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-018 | Load addresses automatically | 1. Navigate to `/cart`<br>2. Page loads | 1. API call `GET /api/customers/me/addresses` succeeds<br>2. Addresses are loaded<br>3. Default address is auto-selected<br>4. AddressSelectorCompact displays default address<br>5. If no addresses, shows "Thêm mới" button | 1. User is logged in<br>2. User is on cart page<br>3. Browser is open and connected to internet | Pending | | | Pending | | | Pending | | | |
| **Function: Summary & Checkout** | | | | | | | | | | | | | | |
| TC-CART-019 | Display cart summary correctly | 1. Navigate to `/cart`<br>2. Select some items<br>3. Apply vouchers<br>4. View summary box | 1. Summary displays:<br>   - Subtotal: sum of selected items<br>   - Platform discount (if applicable)<br>   - Voucher discount (if applicable)<br>   - Grand total: subtotal - discounts<br>2. Selected count shows correct number<br>3. Applied voucher codes are listed | 1. User is logged in<br>2. Cart has items<br>3. Some items are selected<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-020 | Proceed to checkout with selected items | 1. Navigate to `/cart`<br>2. Select at least 1 item<br>3. Select delivery address<br>4. Click "Mua hàng" button | 1. Validation passes (items selected, address selected)<br>2. Checkout payload is saved to sessionStorage<br>3. Redirect to `/checkout` page<br>4. Selected items and address are passed to checkout | 1. User is logged in<br>2. Cart has at least 1 item<br>3. At least 1 item is selected<br>4. Address is selected<br>5. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-021 | Checkout validation - No items selected | 1. Navigate to `/cart`<br>2. Deselect all items<br>3. Click "Mua hàng" button | 1. Error notification: "Vui lòng chọn ít nhất một sản phẩm để mua."<br>2. Checkout button is disabled<br>3. No redirect occurs<br>4. User remains on cart page | 1. User is logged in<br>2. Cart has items but none selected<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-022 | Checkout validation - No address selected | 1. Navigate to `/cart`<br>2. Select items<br>3. Remove selected address (if possible)<br>4. Click "Mua hàng" button | 1. Error notification: "Vui lòng chọn địa chỉ nhận hàng."<br>2. No redirect occurs<br>3. User remains on cart page<br>4. User can select address and retry | 1. User is logged in<br>2. Cart has selected items<br>3. No address is selected<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| **Function: Error Handling** | | | | | | | | | | | | | | |
| TC-CART-023 | Handle API error when loading cart | 1. Navigate to `/cart`<br>2. Simulate API error (network failure or 500 error) | 1. Loading state displays initially<br>2. API call fails<br>3. Error notification displays with error message<br>4. User can retry by refreshing page<br>5. Cart items may not display | 1. User is logged in<br>2. API endpoint is unavailable or returns error<br>3. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-024 | Handle API error when updating quantity | 1. Navigate to `/cart`<br>2. Click "+" to increase quantity<br>3. Simulate API error | 1. Quantity change is attempted<br>2. API call fails<br>3. Error notification displays<br>4. Quantity reverts to previous value<br>5. UI remains stable | 1. User is logged in<br>2. Cart has at least 1 item<br>3. API endpoint returns error<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |
| TC-CART-025 | Handle API error when removing item | 1. Navigate to `/cart`<br>2. Click Trash icon to remove item<br>3. Simulate API error | 1. Remove action is attempted<br>2. API call fails<br>3. Error notification displays: "Không thể xóa sản phẩm khỏi giỏ hàng"<br>4. Item remains in cart<br>5. User can retry | 1. User is logged in<br>2. Cart has at least 1 item<br>3. API endpoint returns error<br>4. User is on cart page | Pending | | | Pending | | | Pending | | | |

---

## Notes

**✅ Tất cả 25 test cases đã được hệ thống handle:**

1. **TC-CART-001 to TC-CART-003**: Test cases for loading and displaying cart, including empty state and campaign price display. (Implemented in `ShoppingCart.tsx`, `CartItemRow.tsx`)

2. **TC-CART-004 to TC-CART-006**: Test cases for item selection, including toggle single item, select all, and deselect all. (Implemented in `CartItemRow.tsx`, `SelectAllBar.tsx`)

3. **TC-CART-007 to TC-CART-010**: Test cases for quantity management, including increase, decrease, manual input, and validation. (Implemented in `CartItemRow.tsx`, `ShoppingCart.tsx`)

4. **TC-CART-011 to TC-CART-012**: Test cases for removing items, including single item removal and delete all. (Implemented in `ShoppingCart.tsx`, `SelectAllBar.tsx`)

5. **TC-CART-013 to TC-CART-016**: Test cases for store voucher functionality, including apply, remove, and validation. (Implemented in `StoreVoucherPicker.tsx`, `VoucherSection.tsx`)

6. **TC-CART-017 to TC-CART-018**: Test cases for address selection and loading. (Implemented in `AddressSelectorCompact.tsx`, `ShoppingCart.tsx`)

7. **TC-CART-019 to TC-CART-022**: Test cases for summary display and checkout validation. (Implemented in `SummaryBox.tsx`, `ShoppingCart.tsx`)

8. **TC-CART-023 to TC-CART-025**: Test cases for error handling in various operations. (Error handling implemented throughout `ShoppingCart.tsx`)

**Key Features Covered:**
- ✅ Cart loading and display
- ✅ Item selection (single and all)
- ✅ Quantity management (increase, decrease, manual input)
- ✅ Item removal (single and all)
- ✅ Store voucher per product (apply, remove, validation)
- ✅ Address selection
- ✅ Summary calculation and display
- ✅ Checkout validation and navigation
- ✅ Error handling
