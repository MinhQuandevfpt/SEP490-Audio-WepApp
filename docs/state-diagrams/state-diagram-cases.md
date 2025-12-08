# State diagram candidates

Tổng quan các quy trình có trạng thái rõ ràng trong mã nguồn, thích hợp để vẽ state diagram. Sắp theo thứ tự trải nghiệm khi vào web/app. Hiện nhận diện được **17** case:

1) **Đăng ký / đăng nhập nhiều vai trò**  
   - Trạng thái logic: UNAUTHENTICATED → AUTHENTICATING → AUTHENTICATED (hoặc ERROR).  
   - Token flow: accessToken/refreshToken (customer/seller/admin/staff).  
   - Nguồn: `services/customer/Authcustomer.ts`, `services/seller/AuthSeller.ts`, `services/admin/AdminAuthService.ts`, `services/staff/AuthStaff.ts`.

2) **KYC cửa hàng & chặn vào dashboard**  
   - StoreStatus: INACTIVE → PENDING → (ACTIVE | REJECTED).  
   - KycResponse.status: PENDING → APPROVED → REJECTED.  
   - Gatekeeper khi truy cập `/seller/dashboard`.  
   - Nguồn: `src/types/seller.ts`, `routes/index.tsx` (ProtectedSellerDashboardRoute), `StoreService.getStoreStatus()`.

3) **Vòng đời sản phẩm (seller)**  
   - Product.status: DRAFT → PENDING → (ACTIVE | REJECTED | INACTIVE) ↔ OUT_OF_STOCK.  
   - Variant: theo parent, kèm tồn kho/giá riêng (ProductVariant trong `src/types/seller.ts`).  
   - Dùng trong create/update product.  
   - Nguồn: `src/types/seller.ts` (Product.status, ProductVariant), UI tại `pages/Seller/Dashboard/ProductManagement.tsx`.

4) **Sản phẩm trong chiến dịch (campaign product)**  
   - CampaignProductStatus: DRAFT → APPROVE/ACTIVE → (REJECTED | DISABLED | EXPIRED).  
   - Nguồn: `src/types/seller.ts` (CampaignProductStatus), `services/seller/CampaignService.ts`, `pages/Seller/Campaign/CampaignProductDetails.tsx`.

5) **Chiến dịch Flash Sale & slot**  
   - FlashSaleStatus: DRAFT → APPROVE/ACTIVE → (EXPIRED | DISABLED).  
   - SlotStatus: UPCOMING → ACTIVE → (CLOSED | EXPIRED).  
   - Nguồn: `src/types/flashsale.ts`.

6) **Trạng thái giỏ hàng**  
   - CartStatus: ACTIVE → (INACTIVE | COMPLETED).  
   - Nguồn: `src/types/cart.ts`.

7) **Vòng đời đơn hàng (OrderStatus)**  
   - Trạng thái: UNPAID → CONFIRMED → AWAITING_SHIPMENT → (READY_FOR_PICKUP / READY_FOR_DELIVERY / OUT_FOR_DELIVERY) → SHIPPING → (DELIVERED_WAITING_CONFIRM / DELIVERY_SUCCESS) → COMPLETED.  
   - Nhánh lỗi/hủy: CANCELLED, DELIVERY_DENIED, DELIVERY_FAIL, EXCEPTION.  
   - Nhánh trả hàng: RETURN_REQUESTED → RETURNED.  
   - Nguồn: `src/types/api.ts` (OrderStatus), `src/utils/orderStatus.ts`.

8) **Vòng đời yêu cầu trả hàng/hoàn tiền**  
   - Trạng thái: PENDING → (APPROVED | REJECTED | CANCELLED/CANCELED) → SHIPPING → RECEIVED → (REFUNDED | RETURN_DONE).  
   - Nhánh tranh chấp: DISPUTE → DISPUTE_ESCALATED → (DISPUTE_RESOLVED_SHOP | DISPUTE_RESOLVED_CUSTOMER).  
   - Nhánh tự động: AUTO_REFUNDED, autoApproved / autoCancelled metadata.  
   - Nguồn: `ReturnRequestResponse.status` trong `src/types/api.ts`.

9) **Bảo hành & phiếu sửa chữa**  
   - WarrantyStatus: PENDING_ACTIVATION → ACTIVE → (EXPIRED | VOID | TRANSFERRED).  
   - WarrantyLogStatus: OPEN → DIAGNOSING → WAITING_PARTS → REPAIRING → READY_FOR_PICKUP → SHIP_BACK → COMPLETED → CLOSED.  
   - Nguồn: `src/types/api.ts` (WarrantyStatus, WarrantyLogStatus).

10) **Trạng thái ví khách hàng**  
   - WalletInfo.status: ACTIVE ↔ INACTIVE ↔ SUSPENDED.  
   - WalletTransaction.status/type là chuỗi từ backend (cần danh sách đầy đủ nếu muốn vẽ).  
   - Nguồn: `src/types/api.ts` (WalletInfo, WalletTransaction).

11) **Trạng thái đánh giá sản phẩm**  
   - ReviewResponse.status: VISIBLE ↔ HIDDEN ↔ DELETED.  
   - Nguồn: `src/types/api.ts`.

12) **Trạng thái tài khoản khách hàng (Admin)**  
   - CustomerStatus: NONE → ACTIVE ↔ INACTIVE ↔ SUSPENDED ↔ DELETED.  
   - Nguồn: `src/types/api.ts`.

13) **Payout bill (đối soát/chi tiền)**  
    - PayoutBillStatus: PENDING → (PAID | CANCELED).  
    - Nguồn: `src/types/admin.ts`.

14) **Voucher / chiến dịch (Admin)**  
    - VoucherStatus: DRAFT → APPROVE → ACTIVE → (EXPIRED | DISABLED | REJECTED).  
    - CampaignStatus: DRAFT/ONOPEN → APPROVE/ACTIVE → (EXPIRED | DISABLED).  
    - Nguồn: `src/types/admin.ts`.

15) **KYC hồ sơ chi tiết**  
    - KycResponse.status: PENDING → (APPROVED | REJECTED) với reviewNote.  
    - Sử dụng trong flow create/store profile & onboarding.  
    - Nguồn: `src/types/seller.ts`.

16) **Kích hoạt cửa hàng sau KYC (dashboard gate)**  
    - StoreStatus: PENDING → ACTIVE (được vào dashboard) hoặc REJECTED (chặn).  
    - Nhấn mạnh vai trò của gate này trong trải nghiệm seller.  
    - Nguồn: `src/types/seller.ts`, `routes/index.tsx`.

17) **Chiến dịch flash slot hiện hành (customer view)**  
    - TimeFilter/SlotStatus: UPCOMING → ONGOING/ACTIVE → EXPIRED.  
    - Phục vụ hiển thị slot hiện tại và tiếp theo.  
    - Nguồn: `src/types/flashsale.ts`.
Gợi ý tiếp theo: nếu cần chi tiết hơn cho từng case, lấy thêm bảng chuyển trạng thái từ docs nghiệp vụ (ví dụ `docs/return-refund-flow.md`) hoặc API backend để chuẩn hóa mũi tên chuyển tiếp trong sơ đồ.
