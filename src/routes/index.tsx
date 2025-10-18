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
import AdminLayout from '../components/AdminLayout';
import Profile from '../pages/Customer/Profile';
import ProductDetail from '../pages/Customer/ProductDetail';
import ShoppingCart from '../pages/Customer/Cart';
import OAuth2Callback from '../pages/OAuth2Callback';
import OAuth2Success from '../pages/OAuth2Success';
import AdminLogin from '../pages/Admin/Login';
import AdminDashboard from '../pages/Admin/Dashboard';
import UserManagement from '../pages/Admin/UserManagement';
import UserDetailManagement from '../pages/Admin/UserDetailandUpdate';
import KycManagement from '../pages/Admin/KycManagement';
import CategoriesList from '../pages/Admin/Categories';
import CategoryDetail from '../pages/Admin/CategoryDetail';
import SellerDashboardHome from '../pages/Seller/Dashboard';
import KycStatusPage from '../pages/Seller/KycStatus';
import SellerDebugPage from '../pages/Seller/Debug';
import { CustomerAuthService } from '../services/customer/Authcustomer';
import { SellerAuthService } from '../services/seller/AuthSeller';
import { AdminAuthService } from '../services/admin/AdminAuthService';
import { StoreService } from '../services/seller/StoreService';

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
  
  useEffect(() => {
    const checkStoreStatus = async () => {
      const isAuthenticated = SellerAuthService.isAuthenticated();
      
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      
      try {
        const statusResponse = await StoreService.getStoreStatus();
        setStoreStatus(statusResponse.status);
      } catch (error) {
        console.error('Error checking store status:', error);
        setStoreStatus('INACTIVE');
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
          <p className="mt-4 text-gray-600">Đang kiểm tra thông tin...</p>
        </div>
      </div>
    );
  }
  
  const isAuthenticated = SellerAuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/seller/login" replace />;
  }
  
  // Only ACTIVE stores can access dashboard
  if (storeStatus !== 'ACTIVE') {
    return <Navigate to="/seller/kyc-status" replace />;
  }
  
  return element;
}

function ProtectedAdminRoute({ element }: { element: ReactElement }) {
  const isAuthenticated = AdminAuthService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
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
    path: '/product/:id',
    element: <ProductDetail />
  },
  {
    path: '/cart',
    element: <ShoppingCart />
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
  {
    path: '/seller/debug',
    element: <ProtectedSellerRoute element={<SellerDebugPage />} />
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
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Quản lý sản phẩm</h2><p className="text-gray-600 mt-2">Trang quản lý sản phẩm đang được phát triển...</p></div>
      },
      {
        path: 'products/add',
        element: <CreateProductPage />
      },
      {
        path: 'products/out-of-stock',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Sản phẩm hết hàng</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'orders',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Quản lý đơn hàng</h2><p className="text-gray-600 mt-2">Trang quản lý đơn hàng đang được phát triển...</p></div>
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
        path: 'analytics',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Báo cáo & Phân tích</h2><p className="text-gray-600 mt-2">Trang báo cáo đang được phát triển...</p></div>
      },
      {
        path: 'finance',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Tài chính</h2><p className="text-gray-600 mt-2">Trang tài chính đang được phát triển...</p></div>
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
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Voucher</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'marketing/flash-sale',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Flash Sale</h2><p className="text-gray-600 mt-2">Trang này đang được phát triển...</p></div>
      },
      {
        path: 'messages',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Tin nhắn</h2><p className="text-gray-600 mt-2">Trang tin nhắn đang được phát triển...</p></div>
      },
      {
        path: 'reviews',
        element: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold">Đánh giá sản phẩm</h2><p className="text-gray-600 mt-2">Trang đánh giá đang được phát triển...</p></div>
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
  // Admin routes
  {
    path: '/admin/login',
    element: <AdminLogin />
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
        element: <UserManagement />
      },
      {
        path: 'users/:id',
        element: <UserDetailManagement />
      },
      {
        path: 'users/customers',
        element: <UserManagement />
      },
      {
        path: 'users/sellers',
        element: <div>Seller Management Page (Coming Soon)</div>
      },
      {
        path: 'users/admins',
        element: <div>Admin Management Page (Coming Soon)</div>
      },
      {
        path: 'stores',
        element: <div>Store Management Page (Coming Soon)</div>
      },
      {
        path: 'stores/all',
        element: <div>All Stores Page (Coming Soon)</div>
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
        path: 'reports',
        element: <div>Reports & Analytics Page (Coming Soon)</div>
      },
      {
        path: 'reports/revenue',
        element: <div>Revenue Reports Page (Coming Soon)</div>
      },
      {
        path: 'reports/bestsellers',
        element: <div>Best Sellers Reports Page (Coming Soon)</div>
      },
      {
        path: 'reports/customers',
        element: <div>Customer Reports Page (Coming Soon)</div>
      },
      {
        path: 'reports/sellers',
        element: <div>Seller Reports Page (Coming Soon)</div>
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
        path: 'settings',
        element: <div>System Settings Page (Coming Soon)</div>
      },
      {
        path: 'settings/general',
        element: <div>General Settings Page (Coming Soon)</div>
      },
      {
        path: 'settings/payment',
        element: <div>Payment Settings Page (Coming Soon)</div>
      },
      {
        path: 'settings/shipping',
        element: <div>Shipping Settings Page (Coming Soon)</div>
      },
      {
        path: 'settings/email',
        element: <div>Email Template Settings Page (Coming Soon)</div>
      },
      {
        path: 'profile',
        element: <div>Admin Profile Page (Coming Soon)</div>
      }
    ]
  }
]);