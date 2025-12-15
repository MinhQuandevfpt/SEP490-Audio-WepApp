Rule ID	Rule Definition
BR-01	Users must enter a valid email/phone number and password to log in. Input fields must not be empty; invalid credentials must return an error. Locked or suspended accounts are not allowed to log in.
BR-02	Passwords must be securely encrypted and verified. After successful login, the system generates a JWT or session token and supports two-factor authentication (2FA) if enabled.
BR-03	Google OAuth2 login is supported. If the email already exists, the user is logged in; otherwise, a new account is automatically created with the default role of Customer. Disabled or blocked Google accounts are not allowed to log in.
BR-04	Only authenticated sellers with a valid store are allowed to create products.
BR-05	When creating a product, the seller must select at least one valid category.
BR-06	Product SKU must be unique within the scope of the seller’s store.
BR-07	Products without variants must have a selling price defined; products with variants must manage price and stock at the variant level.
BR-08	Newly created or updated products must be assigned the PENDING_APPROVAL status for moderation.
BR-09	Sellers may only edit products they own and only when the product is in an editable status.
BR-10	Products participating in promotions or having existing orders must not allow critical information changes.
BR-11	Disabling or deleting a product must not affect previously created orders.
BR-12	Users are allowed to compare between 2 and 4 products within the same category.
BR-13	Common attributes must be displayed in the same rows; differences must be highlighted. Users may add or remove products from the comparison table.
BR-14	Only approved stores are allowed to publish products on the platform.
BR-15	Products must contain complete and valid information before being approved.
BR-16	Eligible content may be automatically approved; suspicious cases must be reviewed manually by an Admin.
BR-17	Store and product approval processes must be completed within 48 hours and approval history must be recorded.
BR-18	Banners, landing pages, and blog content must define display start and end dates.
BR-19	Only Admin users are authorized to approve content before publication.
BR-20	Customers may only view banners that are active and within their valid display period.
BR-21	Each product may only be associated with one active voucher at a given time.
BR-22	Vouchers are applied only when they are valid, have remaining usage quota, and meet the minimum order value.
BR-23	The total discount value of a voucher must not exceed the valid product value of the seller.
BR-24	When a voucher is applied, the system must record usage history per customer.
BR-25	Customers may pay for multiple orders using a single payment link.
BR-26	Upon successful payment, the order status is updated to PAID and a confirmation email is sent to the customer.
BR-27	Failed or expired payments result in the order being marked as UNPAID.
BR-28	Shipping fees must be calculated based on actual weight/dimensions and the customer’s delivery address.
BR-29	Delivery status must be synchronized from the shipping provider to the order system.
BR-30	Multi-store orders are considered successfully delivered only when all sub-orders are delivered.
BR-31	Customers may cancel orders only if the seller has not confirmed the order.
BR-32	Valid cancellations before confirmation are automatically processed and refunded if payment was made.
BR-33	If the seller has confirmed the order, cancellation requires seller approval.
BR-34	All customer payments must be held in a pending state and released only after successful delivery and completion of the defined holding period.
BR-35	Sellers receive net earnings after platform fees and shipping fee differences are deducted.
BR-36	The system must record full transaction histories and reconciliation records.
BR-37	Customers may submit return requests within 7 days after successful delivery.
BR-38	Each return request applies to only one product item per order.
BR-39	Return requests must include a valid reason and supporting images or videos as evidence.
BR-40	When a return request is created, the related seller funds must be locked and excluded from payout.
BR-41	Sellers must respond to return requests within the defined time limit; otherwise, the system processes the request automatically.
BR-42	After seller approval, customers must ship the item back within 72 hours; otherwise, the request is canceled.
BR-43	Return shipping costs are borne by either the seller or the buyer, depending on who is at fault.
BR-44	In dispute cases, the Admin’s decision is final.
BR-45	Refunds are processed from held funds and returned to the customer’s wallet.
BR-46	Only customers who have purchased and successfully received the product may submit reviews.
BR-47	Each product in an order may be reviewed only once.
BR-48	Only the review owner may edit or delete their review; sellers may only reply to reviews of their own products.
BR-49	The system must generate revenue, order count, and sold product statistics per store and across the platform.
BR-50	The system must identify best-selling and slow-selling products and stores.
BR-51	Report data must be near real-time and support export to Excel or PDF formats.
BR-52	Users may query only product and category data using Vietnamese language; only SELECT operations are allowed with limited result sets.
BR-53	Users input room size, number of listeners, and wall/floor/ceiling materials; the system calculates target SPL, estimates required speaker power, recommends speaker quantity/type/power, and warns if the setup is overpowered or underpowered.
BR-54	Customers may request return/exchange/refund within the policy window (e.g., 7–14 days) and only for products that are intact, unmodified, and not misused.
BR-55	Reward points are automatically granted after successful delivery; points are calculated as a percentage of order value, configurable by product group/customer segment/promotion, with configurable expiration.
BR-56	Customers may redeem points for vouchers, free shipping, or gifts; redemption milestones are shown when eligible, with configurable monthly limits.
BR-57	Membership tiers are determined by total accumulated points or total spending within the last 12 months; default tiers include Silver, Gold, Platinum, Diamond, each with distinct benefits.
BR-58	The system generates personalized offers based on purchase history, browsing behavior, and membership tier, including exclusive deals, category-based discounts, and bundle recommendations.
BR-59	All orders (online or COD) incur platform fees, including commission, service fees, and payment fees if applicable.
BR-60	For online orders, platform fees are deducted before settlement; the remaining amount is held (pending) in the system wallet.
BR-61	For COD orders, platform fees are recorded as payable debt. Before allowing new COD orders, the system verifies that online-held funds meet or exceed COD fee debt (with configurable safety thresholds). If insufficient, top-up is required or COD is disabled.
BR-62	Default commission is config by admin , calculated per sold product.
BR-63	Only one platform fee configuration may be active at any given time.
BR-64	Creating a new platform fee automatically deactivates the previous one.
BR-65	A new platform fee becomes effective immediately upon creation.
BR-66	Sellers must always be charged using the currently active platform fee.
BR-67	If an order is in Pending Confirmation and not yet confirmed by the seller, the system allows automatic cancellation. Online payments trigger a refund request (1–3 business days); COD orders have no refund.
BR-68	If an order is already confirmed (Processing/Packing), cancellation requires seller approval. If rejected, the order proceeds and the customer may only request a return after delivery.
BR-69	If a customer paid online but refuses delivery, no immediate refund is issued. The carrier retries delivery 2–3 times; if failed, the item is returned to the seller. Refund is processed only after the seller confirms receipt of intact goods; shipping fees may be deducted or refund denied if goods are lost/damaged.
BR-70	Sellers are expected to maintain a high response rate and reply promptly to customer messages over the last 30 days.
BR-71	Off-platform transactions are strictly prohibited, including references to bank transfers or personal payments.
BR-72	Sharing personal contact details (bank accounts, phone numbers, addresses, or redirecting customers to Facebook/Zalo) is prohibited.
BR-73	Offensive, abusive, or inappropriate language toward customers is not allowed.
BR-74	Sending external links not belonging to the platform is prohibited.
BR-75	Admin users may create and manage platform-wide promotional campaigns and notify sellers to participate.
BR-76	Each promotion or voucher must define budget limits, usage caps, and validity periods to prevent abuse.
BR-77	Each product view by a customer increments the product’s view count by one.
BR-78	When admins update system policies or commission rates, notifications must be sent to store owners via app and email.
BR-79	Users must create an account and be logged in before placing an order.
BR-80	Admins can generate financial reports by period (daily, weekly, monthly, quarterly).
BR-81	Taxes (VAT, income tax) must be calculated automatically in compliance with applicable laws.
BR-82	All payments to merchants/owners must undergo reconciliation before payout.
BR-83	Financial reports must be stored in the system to support audits and tax inspections.
BR-84	Customers may create return requests only for their own orders, with a maximum of one return per OrderItem.
BR-85	Return requests must specify a valid reason type (SHOP_FAULT, CUSTOMER_FAULT, CHANGE_OF_MIND) and include at least one photo or video as evidence.
BR-86	Return requests submitted at the deadline remain valid even if carrier pickup occurs afterward.
BR-87	Creating a return locks the seller’s pending amount and blocks payout; return status cannot be rolled back; ReturnRequests cannot be deleted, only archived.
BR-88	Sellers must respond to return requests within 48 hours; otherwise, the system auto-approves the request.
BR-89	If a seller rejects a return, the request moves to DISPUTE; funds remain locked; rejection requires justification or evidence.
BR-90	After seller approval, customers must ship the item within 7 day; otherwise, the return is canceled and funds are unlocked for the seller.
BR-91	Return shipping fees are always borne by the seller; fees are recorded and included in reconciliation bills; customers never pay return shipping.
BR-92	Sellers must not access customer phone numbers or addresses; only backend services may create GHN orders.
BR-93	Carrier pickup/tracking statuses must be recorded; sellers must confirm receipt of returned goods and may dispute within 48 hours if goods are incorrect.
BR-94	Disputes require unboxing video evidence; missing evidence results in automatic rejection of the dispute.
BR-95	Admin decisions are final. If the customer is at fault, funds return to the seller; if the seller is at fault, the customer is refunded; lack of seller evidence defaults in customer favor.
BR-96	Refunds are always deducted from pendingAmount (not available balance). Canceled or rejected returns unlock funds back to the seller; successful refunds transfer pending funds to the customer wallet.
BR-97	Refund Without Return may only be triggered by Admin for low-value products.
BR-98	Carrier webhook updates automatically synchronize return statuses.
BR-99	Items under return/dispute are not eligible for payout; after resolution or cancellation, items become eligible for payout after 7 days.
BR-100	Only the order owner may create a complaint; each complaint is tied to exactly one ReturnRequest and must include reasons and evidence.
BR-101	Complaints start with status OPEN. If the seller does not respond within 48 hours, the system auto-triggers Refund Without Return (once only), resolves the complaint, and refunds the customer automatically.
BR-102	Complaints cannot be submitted after resolution; refunds must be returned to the customer wallet for the exact amount in the ReturnRequest.
BR-103	Deleting a customer performs a soft delete by setting status to DELETED; if the customer does not exist, the system returns “Customer not found.”
BR-104	A customer must exist to view addresses; address lists are ordered with the default address first, followed by newest addresses.
BR-105	Customers may create multiple addresses; the first address is default; setting isDefault=true removes default from others; addressCount is updated accordingly.
BR-106	Customers may update only their own addresses, including partial field updates; setting default updates all others.
BR-107	Customers cannot delete others’ addresses; deleting a default address auto-selects another as default; only one default address is allowed.
BR-108	Sellers may operate only on delivery orders belonging to their own store.
BR-109	Delivery status mapping: READY_FOR_PICKUP → READY_FOR_DELIVERY → OUT_FOR_DELIVERY → DELIVERED_WAITING_CONFIRM → DELIVERY_SUCCESS; customer refusal results in DELIVERY_DENIED.
BR-110	Carrier webhooks synchronize child orders to parent orders; parent orders succeed only when all child orders succeed; status updates occur only when the new state differs.
BR-111	Shipping fees must reflect actual weight/dimensions and correct addresses; calculated from store address; combo items calculated individually; order code and ETA displayed; missing carrier fees default to zero; final fees updated upon order creation.
BR-112	Customer payments (QR or COD collection) enter the platform wallet as pending; HOLD transactions are recorded; multi-store orders allocate pending amounts per store.
BR-113	Pending funds are released only after successful delivery and 7 days without return, transferring from pending to available balance for the seller.
BR-114	Sellers receive net payouts after shipping differences and platform fees; negative payouts are capped at zero; all wallet transactions record before/after balances.
BR-115	Orders canceled before delivery are refunded from the platform wallet to the customer wallet, including product price and shipping minus discounts; partial refunds apply in multi-store orders.
BR-116	For COD orders, the 7-day hold begins only after successful delivery; COD follows the same pending → allocate → release flow.
BR-117	Sellers receive payouts only after delivery plus 7 days without returns; payout bills detail revenues and deductions; new bills cannot be created until previous bills are paid; sellers can view bill history.
BR-118	Orders or items under return/dispute are not eligible for payout until resolved.
BR-119	Each seller may have only one KYC request in PENDING status at a time; submitting a new KYC sets the seller status to PENDING.
BR-120	Approved KYC triggers a “KYC_APPROVED” email; rejected KYC sets status to REJECTED and sends a “KYC_REJECTED” email with reasons.
BR-121	Vouchers are applicable only when ACTIVE and within the valid time window (start ≤ now ≤ end).
BR-122	Applying a voucher decrements remainingUsage; vouchers with zero remainingUsage cannot be applied; usage history is recorded per customer.
BR-123	Vouchers apply only to eligibleSubtotal; discounts are capped so total discount never exceeds the seller’s eligible product value.
