import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import HomePage from '../pages/HomePage/HomePage';
import Login from '../pages/Customer/Login';
import Register from '../pages/Customer/Register';
import SellerLogin from '../pages/Seller/Login';
import SellerRegister from '../pages/Seller/Register';
import SellerOnboarding from '../pages/Seller/Onboarding';
import { CreateProductPage } from '../pages/Seller/AddNewProduct';
import AuthLayout from '../components/AuthLayout';
import SellerLayout from '../components/SellerLayout';
import SellerDashboardLayout from '../components/SellerDashboardLayout';
import { VoucherPage, CreateVoucherPage } from '../pages/Seller/Voucher';
import { ShopWideVoucherPage, ShopWideVoucherListPage } from '../pages/Seller/ShopWideVoucher';
import { CampaignList as SellerCampaignList } from '../pages/Seller/Campaign';
import CampaignProductDetails from '../pages/Seller/Campaign/CampaignProductDetails';
import AdminLayout from '../components/AdminLayout';
import Profile from '../pages/Customer/Profile';
import ProductDetail from '../pages/Customer/ProductDetail';
import ShoppingCart from '../pages/Customer/Cart';
import ShoppingCartVer2 from '../pages/Customer/ShoppingCart_ver2';
import PreCheckoutV2 from '../pages/Customer/PreCheckoutV2';
import StorePage from '../pages/Customer/StorePage';
import OAuth2Callback from '../pages/OAuth2Callback';
import OAuth2Success from '../pages/OAuth2Success';
import ThreeDRoom from '../pages/Customer/3DTrialRoom/3DRoom';
import CheckoutOrderPage from '../pages/Customer/CheckoutOrder/CheckoutOrderPage';
import OrderHistoryPage from '../pages/Customer/OrderHistory/OrderHistoryPage';
import OrderDetailPage from '../pages/Customer/OrderHistory/OrderDetailPage';
import WarrantyPage from '../pages/Customer/Warranty/WarrantyPage';
import ReturnHistoryPage from '../pages/Customer/ReturnHistory/ReturnHistoryPage';
import PayOSSuccess from '../pages/Customer/PaymentSuccess/PayOSSuccess';
import PayOSFail from '../pages/Customer/PaymentFail/PayOSFail';
import { ProductListPage } from '../pages/Customer/ProductList';
import { SearchResultPage } from '../pages/Customer/SearchResult';
import ProductListDemo from '../pages/Customer/ProductList/ProductListDemo';
import FlashSaleDetail from '../pages/Customer/FlashSaleDetail/FlashSaleDetail';
import AdminLogin from '../pages/Admin/Login';
import FlatStaffLogin from '../pages/Admin/Login/FlatStaffLogin';
import AdminDashboard from '../pages/Admin/Dashboard';
import UserManagement from '../pages/Admin/UserManagement';
import UserDetailManagement from '../pages/Admin/UserDetailandUpdate';
import KycManagement from '../pages/Admin/KycManagement';
import KycDetail from '../pages/Admin/KycManagement/KycDetail';
import CategoriesList from '../pages/Admin/Categories';
import { CategoryDetail } from '../pages/Admin/CategoryDetail';
import { CampaignList, CreateCampaign, EditCampaign, CampaignDetailPage } from '../pages/Admin/CampaignManagement';
import CampaignProductApproval from '../pages/Admin/CampaignProductApproval/CampaignProductApproval';
import BannerManagement, { BannerDetail } from '../pages/Admin/BannerManagement';
import PolicyManagement from '../pages/Admin/PolicyManagement/PolicyManagement';
import { PayoutManagement, PayoutBillDetail } from '../pages/Admin/PayoutManagement';
import PlatformWalletPage from '../pages/Admin/PlatformWallet/PlatformWalletPage';
import SettlementStatisticsPage from '../pages/Admin/SettlementStatistics/SettlementStatisticsPage';
import CustomerWithdrawRequestsPage from '../pages/Admin/Finance/CustomerWithdrawRequestsPage';
import { StoreManagement, StoreDetail } from '../pages/Admin/StoreManagement';
import { AdminProductManagement, AdminProductDetail } from '../pages/Admin/ProductManagement';
import PlatformFeeManagement from '../pages/Admin/PlatformFeeManagement/PlatformFeeManagement';
import SellerDashboardHome from '../pages/Seller/Dashboard';
import { ProductManagement } from '../pages/Seller/Dashboard';
import StoreProfile from '../pages/Seller/Dashboard/StoreProfile';
import { OrderManageForStoreOwner } from '../pages/Seller/OrderManagement';
import StoreOwnerWarranty from '../pages/Seller/Warranty/StoreOwnerWarranty';
import KycStatusPage from '../pages/Seller/KycStatus';
import FinancePage from '../pages/Seller/Finance/FinancePage';
import PayoutManagementPage from '../pages/Seller/Payout/PayoutManagementPage';
import PayoutRevenue from '../pages/Seller/Dashboard/PayoutRevenue';
import PayoutRevenueDetail from '../pages/Seller/Dashboard/PayoutRevenueDetail';
import StoreAddressPage from '../pages/Seller/StoreAddress/StoreAddressPage';
import CreateStaff from '../pages/Seller/CreateStaff/CreateStaff';
import StaffList from '../pages/Seller/StaffList/StaffList';
import LoginForStaff from '../pages/StoreStaff/LoginForStaff';
import RegisterForStaff from '../pages/StoreStaff/RegisterForStaff';
import StaffDashboardHome from '../pages/StoreStaff/Dashboard/StaffDashboardHome';
import StaffDashboardLayout from '../components/StaffDashboardLayout';
import OrderPageStaff from '../pages/StoreStaff/Order/OrderPageStaff';
import { StaffLoginLayout } from '../components/Loginforstorestaffcomponents';
import { ReplyReviewPage } from '../pages/Seller/ReplyPeview';
import { MessagesPage } from '../pages/Seller/Messages';
import NotificationPage from '../pages/Seller/NotificationFolder/NotificationPage';
import { CustomerAuthService } from '../services/customer/Authcustomer';
import { SellerAuthService } from '../services/seller/AuthSeller';
import { AdminAuthService } from '../services/admin/AdminAuthService';
import { FlatStaffAuthService } from '../services/admin/FlatStaffAuthService';
import { isValidAdminRole } from '../utils/permissionHelper';
import { PermissionProtectedRoute } from '../components/ProtectedRoute';
import { StoreService } from '../services/seller/StoreService';
import { StoreStaffAuthService } from '../services/staff/AuthStaff';
import { UpdateProductPage } from '../pages/Seller/UpdateProduct';
import StoreReturnsPage from '../pages/Seller/ReturnManagement/StoreReturnsPage';
import { PoliciesPage, PolicyCategoryDetailPage } from '../pages/PoliciesPage';
import SetupStorePage from '../pages/Seller/SetupStore';
import { RiskWarningPage } from '../pages/Seller/RiskWarningFol';
import { StorePayoutV2 } from '../pages/Seller/StorePayoutVersion2';

function ProtectedRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = CustomerAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return element;
}

function ProtectedSellerRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = SellerAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/seller/login" replace />;
  }
  return element;
}

// Protected route that checks both authentication AND store status
function ProtectedSellerDashboardRoute({ element }: { element: ReactElement }) {
  const [isLoading, setIsLoading] = useState(true);
  const [storeStatus, setStoreStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkStoreStatus = async () => {
      const isAuthenticated = SellerAuthService.isAuthenticated();
      
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Checking store status...');
        const statusResponse = await StoreService.getStoreStatus();
        console.log('✅ Store status:', statusResponse.status);
        setStoreStatus(statusResponse.status);
        setError(null);
      } catch (error: any) {
        console.error('❌ Error checking store status:', error);
        
        // Handle specific errors
        if (error?.message?.includes('Phiên đăng nhập hết hạn')) {
          // Token expired and refresh failed - redirect to login
          SellerAuthService.logout();
          window.location.href = '/seller/login';
          return;
        }
        
        // For other errors, assume INACTIVE (will redirect to KYC page)
        setStoreStatus('INACTIVE');
        setError(error?.message || 'Không thể kiểm tra trạng thái cửa hàng');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStoreStatus();
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }
  
  const isAuthenticated = SellerAuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/seller/login" replace />;
  }
  
  // Chỉ block khi status là INACTIVE (yêu cầu KYC lần đầu)
  // Các status khác (PENDING, REJECTED, ACTIVE, PAUSED) đều cho phép vào dashboard
  if (storeStatus === 'INACTIVE') {
    if (error) {
      console.warn('⚠️ Redirecting to KYC status due to INACTIVE status:', error);
    }
    return <Navigate to="/seller/kyc-status" replace />;
  }
  
  return element;
}

function ProtectedAdminRoute({ element }: { element: ReactElement }) {
  // Check authentication from both Admin and FlatStaff services
  const isAdminAuthenticated = AdminAuthService.isAuthenticated();
  const isFlatStaffAuthenticated = FlatStaffAuthService.isAuthenticated();
  const isAuthenticated = isAdminAuthenticated || isFlatStaffAuthenticated;
  
  if (!isAuthenticated) {
    // Determine which login page to redirect to
    // Default to admin login, but could be enhanced to remember last login type
    return <Navigate to="/admin/login" replace />;
  }
  
  // Verify that the authenticated user has a valid admin role
  const adminUser = AdminAuthService.getCurrentUser();
  const flatStaffUser = FlatStaffAuthService.getCurrentUser();
  const currentUser = adminUser || flatStaffUser;
  const userRole = currentUser?.role || '';
  
  if (!isValidAdminRole(userRole)) {
    // User is authenticated but doesn't have admin role
    console.warn(`User with role "${userRole}" tried to access admin area`);
    return <Navigate to="/" replace />;
  }
  
  return element;
}

function ProtectedStaffRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = StoreStaffAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/store-staff/login" replace />;
  }
  return element;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/account',
    element: <ProtectedRoute element={<Profile />} />
  },
  {
    path: '/login',
    element: <Navigate to="/auth/login" replace />
  },
  {
    path: '/account/reviews',
    element: <ProtectedRoute element={<Profile initialTab="reviews" />} />
  },
  {
    path: '/account/wallet',
    element: <ProtectedRoute element={<Profile initialTab="wallet" />} />
  },
  {
    path: '/account/notifications',
    element: <ProtectedRoute element={<Profile initialTab="notifications" />} />
  },
  {
    path: '/product/:id',
    element: <ProductDetail />
  },
  {
    path: '/store/:storeId',
    element: <StorePage />
  },
  {
    path: '/cart',
    element: <ShoppingCart />
  },
  {
    path: '/cartv2',
    element: <ShoppingCartVer2 />
  },
  {
    path: '/precheckoutv2',
    element: <PreCheckoutV2 />
  },
  {
    path: '/orders',
    element: <ProtectedRoute element={<OrderHistoryPage />} />
  },
  {
    path: '/orders/:orderId',
    element: <ProtectedRoute element={<OrderDetailPage />} />
  },
  {
    path: '/returns',
    element: <ProtectedRoute element={<ReturnHistoryPage />} />
  },
  {
    path: '/warranty',
    element: <ProtectedRoute element={<WarrantyPage />} />
  },
  {
    path: '/checkout',
    element: <ProtectedRoute element={<CheckoutOrderPage />} />
  },
  {
    path: '/oauth2/callback',
    element: <OAuth2Callback />
  },
  {
    path: '/oauth-success',
    element: <OAuth2Success />
  },
  {
    path: '/payment/success',
    element: <PayOSSuccess />
  },
  {
    path: '/payment/fail',
    element: <PayOSFail />
  },
  {
    path: '/3d-room',
    element: <ThreeDRoom />
  },
  {
    path: '/products',
    element: <ProductListPage />
  },
  {
    path: '/search',
    element: <SearchResultPage />
  },
  {
    path: '/products/demo',
    element: <ProductListDemo />
  },
  {
    path: '/flash-sale/:campaignId',
    element: <FlashSaleDetail />
  },
  {
    path: '/policies',
    element: <PoliciesPage />
  },
  {
    path: '/policies/:categoryId',
    element: <PolicyCategoryDetailPage />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      }
    ]
  },
  {
    path: '/seller',
    element: <SellerLayout />,
    children: [
      {
        path: 'login',
        element: <SellerLogin />
      },
      {
        path: 'register',
        element: <SellerRegister />
      }
    ]
  },
  {
    path: '/seller/createproductpage',
    element: <CreateProductPage />
  },
  {
    path: '/seller/onboarding',
    element: <ProtectedSellerRoute element={<SellerOnboarding />} />
  },
  {
    path: '/seller/kyc-status',
    element: <ProtectedSellerRoute element={<KycStatusPage />} />
  },
  // Seller Dashboard routes (Only for ACTIVE stores)
  {
    path: '/seller/dashboard',
    element: <ProtectedSellerDashboardRoute element={<SellerDashboardLayout />} />,
    children: [
      {
        path: '',
        element: <SellerDashboardHome />
      },
      {
        path: 'products',
        element: <ProductManagement />
      },
      {
        path: 'products/add',
        element: <CreateProductPage />
      },
      {
        path: 'products/update',
        element: <ProductManagement />
      },
      {
        path: 'products/:productId/edit',
        element: <UpdateProductPage />
      },
      {
        path: 'products/out-of-stock',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Sản phẩm hết hàng</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders',
        element: <OrderManageForStoreOwner />
      },
      {
        path: 'orders/pending',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đơn hàng chờ xác nhận</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders/processing',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đơn hàng đang xử lý</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders/shipping',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đơn hàng đang giao</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders/delivered',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đơn hàng đã giao</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders/cancelled',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đơn hàng đã hủy</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'returns',
        element: <StoreReturnsPage />
      },
      {
        path: 'warranty',
        element: <StoreOwnerWarranty />
      },
      {
        path: 'staff',
        element: <StaffList />
      },
      {
        path: 'staff/create',
        element: <CreateStaff />
      },
      {
        path: 'staff/update',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Cập nhật nhân viên</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'staff/delete',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Xóa thông tin nhân viên</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'analytics',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Báo cáo & Phân tích</h2><p className="text-gray-600 mt-2">Trang báo cáo đang được phát triển...</p></div>
      },
      {
        path: 'finance',
        element: <FinancePage />
      },
      {
        path: 'payout',
        element: <PayoutManagementPage />
      },
      {
        path: 'revenue',
        element: <PayoutRevenue />
      },
      {
        path: 'revenue/:billId',
        element: <PayoutRevenueDetail />
      },
      {
        path: 'store-address',
        element: <StoreAddressPage />
      },
      {
        path: 'setup-store',
        element: <SetupStorePage />
      },
      {
        path: 'profile',
        element: <StoreProfile />
      },
      {
        path: 'finance/revenue',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Doanh thu</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'finance/transactions',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Lịch sử giao dịch</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'finance/withdrawal',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Rút tiền</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'marketing',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Marketing</h2><p className="text-gray-600 mt-2">Trang marketing đang được phát triển...</p></div>
      },
      {
        path: 'marketing/promotions',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Khuyến mãi</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'marketing/vouchers',
        element: <VoucherPage />
      },
      {
        path: 'marketing/vouchers/create',
        element: <CreateVoucherPage />
      },
      {
        path: 'shop-wide-voucher',
        element: <ShopWideVoucherListPage />
      },
      {
        path: 'shop-wide-voucher/create',
        element: <ShopWideVoucherPage />
      },
      {
        path: 'marketing/flash-sale',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Flash Sale</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'campaigns',
        element: <SellerCampaignList />
      },
      {
        path: 'campaigns/:campaignId/products',
        element: <CampaignProductDetails />
      },
      {
        path: 'messages',
        element: <MessagesPage />
      },
      {
        path: 'reviews',
        element: <ReplyReviewPage />
      },
      {
        path: 'notifications',
        element: <NotificationPage />
      },
      {
        path: 'risk-warning',
        element: <RiskWarningPage />
      },
      {
        path: 'store-payout-v2',
        element: <StorePayoutV2 />
      },
      {
        path: 'settings',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Cài đặt cửa hàng</h2><p className="text-gray-600 mt-2">Trang cài đặt đang được phát triển...</p></div>
      },
      {
        path: 'profile',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Thông tin tài khoản</h2><p className="text-gray-600 mt-2">Trang thông tin tài khoản đang được phát triển...</p></div>
      }
    ]
  },
  // Store Staff routes
  {
    path: '/store-staff',
    element: <StaffLoginLayout />,
    children: [
      {
        path: 'login',
        element: <LoginForStaff />
      },
      {
        path: 'register',
        element: <RegisterForStaff />
      }
    ]
  },
  {
    path: '/store-staff/dashboard',
    element: <ProtectedStaffRoute element={<StaffDashboardLayout />} />,
    children: [
      { path: '', element: <StaffDashboardHome /> },
      { path: 'orders', element: <OrderPageStaff /> }
    ]
  },
  // Admin routes
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin/flatstaff/login',
    element: <FlatStaffLogin />
  },
  {
    path: '/admin',
    element: <ProtectedAdminRoute element={<AdminLayout />} />,
    children: [
      {
        path: '',
        element: <Navigate to="/admin/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <AdminDashboard />
      },
      // Add more admin routes here as needed
      {
        path: 'users',
        element: <PermissionProtectedRoute permission="manage_users" element={<UserManagement />} />
      },
      {
        path: 'users/:id',
        element: <PermissionProtectedRoute permission="manage_users" element={<UserDetailManagement />} />
      },
      {
        path: 'users/customers',
        element: <PermissionProtectedRoute permission="manage_users" element={<UserManagement />} />
      },
      {
        path: 'users/sellers',
        element: <PermissionProtectedRoute permission="manage_users" element={<div>Seller Management Page (Coming Soon)</div>} />
      },
      {
        path: 'users/admins',
        element: <PermissionProtectedRoute permission="manage_users" element={<div>Admin Management Page (Coming Soon)</div>} />
      },
      {
        path: 'stores',
        element: <StoreManagement />
      },
      {
        path: 'stores/all',
        element: <StoreManagement />
      },
      {
        path: 'stores/:storeId',
        element: <StoreDetail />
      },
      {
        path: 'products',
        element: <AdminProductManagement />
      },
      {
        path: 'products/:productId',
        element: <AdminProductDetail />
      },
      {
        path: 'kyc',
        element: <KycManagement />
      },
      {
        path: 'kyc/:kycId',
        element: <KycDetail />
      },
      {
        path: 'stores/kyc',
        element: <KycManagement />
      },
      {
        path: 'stores/approved',
        element: <div>Approved Stores Page (Coming Soon)</div>
      },
      {
        path: 'stores/blocked',
        element: <div>Blocked Stores Page (Coming Soon)</div>
      },
      {
        path: 'campaigns',
        element: <CampaignList />
      },
      {
        path: 'campaigns/:campaignId',
        element: <CampaignDetailPage />
      },
      {
        path: 'campaigns/create',
        element: <CreateCampaign />
      },
      {
        path: 'campaigns/:id/edit',
        element: <EditCampaign />
      },
      {
        path: 'campaigns/products/approval',
        element: <CampaignProductApproval />
      },
      {
        path: 'banners',
        element: <BannerManagement />
      },
      {
        path: 'banners/create',
        element: <BannerDetail />
      },
      {
        path: 'banners/:id',
        element: <BannerDetail />
      },
      {
        path: 'banners/:id/edit',
        element: <BannerDetail />
      },
      {
        path: 'policies',
        element: <PolicyManagement />
      },
      {
        path: 'platform-fees',
        element: <PermissionProtectedRoute permission="manage_system" element={<PlatformFeeManagement />} />
      },
      {
        path: 'orders',
        element: <div>Order Management Page (Coming Soon)</div>
      },
      {
        path: 'orders/all',
        element: <div>All Orders Page (Coming Soon)</div>
      },
      {
        path: 'orders/pending',
        element: <div>Pending Orders Page (Coming Soon)</div>
      },
      {
        path: 'orders/shipping',
        element: <div>Shipping Orders Page (Coming Soon)</div>
      },
      {
        path: 'orders/completed',
        element: <div>Completed Orders Page (Coming Soon)</div>
      },
      {
        path: 'orders/cancelled',
        element: <div>Cancelled Orders Page (Coming Soon)</div>
      },
      {
        path: 'finance',
        element: <PermissionProtectedRoute permission="manage_finance" element={<div>Tài chính</div>} />
      },
      {
        path: 'finance/platform-wallet',
        element: <PermissionProtectedRoute permission="manage_finance" element={<PlatformWalletPage />} />
      },
      {
        path: 'finance/settlement-statistics',
        element: <PermissionProtectedRoute permission="manage_finance" element={<SettlementStatisticsPage />} />
      },
      {
        path: 'finance/customer-withdraw-requests',
        element: <PermissionProtectedRoute permission="manage_finance" element={<CustomerWithdrawRequestsPage />} />
      },
      {
        path: 'reports/payout',
        element: <PermissionProtectedRoute permission="manage_finance" element={<PayoutManagement />} />
      },
      {
        path: 'reports/payout/:billId',
        element: <PermissionProtectedRoute permission="manage_finance" element={<PayoutBillDetail />} />
      },
      {
        path: 'categories',
        element: <CategoriesList />
      },
      {
        path: 'categories/:id',
        element: <CategoryDetail />
      },
      {
        path: 'banners',
        element: <BannerManagement />
      },
      {
        path: 'banners/create',
        element: <BannerDetail />
      },
      {
        path: 'banners/:id',
        element: <BannerDetail />
      },
      {
        path: 'banners/:id/edit',
        element: <BannerDetail />
      },
      {
        path: 'settings',
        element: <PermissionProtectedRoute permission="manage_system" element={<div>System Settings Page (Coming Soon)</div>} />
      },
      {
        path: 'settings/general',
        element: <PermissionProtectedRoute permission="manage_system" element={<div>General Settings Page (Coming Soon)</div>} />
      },
      {
        path: 'settings/payment',
        element: <PermissionProtectedRoute permission="manage_system" element={<div>Payment Settings Page (Coming Soon)</div>} />
      },
      {
        path: 'settings/shipping',
        element: <PermissionProtectedRoute permission="manage_system" element={<div>Shipping Settings Page (Coming Soon)</div>} />
      },
      {
        path: 'settings/email',
        element: <PermissionProtectedRoute permission="manage_system" element={<div>Email Template Settings Page (Coming Soon)</div>} />
      },
      {
        path: 'profile',
        element: <div>Admin Profile Page (Coming Soon)</div>
      }
    ]
  }
]);