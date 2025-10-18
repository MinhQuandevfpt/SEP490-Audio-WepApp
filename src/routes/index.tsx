import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import AdminLayout from '../components/AdminLayout';
import Profile from '../pages/Customer/Profile';
import ProductDetail from '../pages/Customer/ProductDetail';
import ShoppingCart from '../pages/Customer/Cart';
import OAuth2Callback from '../pages/OAuth2Callback';
import OAuth2Success from '../pages/OAuth2Success';
import ThreeDRoom from '../pages/Customer/3DTrialRoom/3DRoom';
import AdminLogin from '../pages/Admin/Login';
import AdminDashboard from '../pages/Admin/Dashboard';
import UserManagement from '../pages/Admin/UserManagement';
import UserDetailManagement from '../pages/Admin/UserDetailandUpdate';
import KycManagement from '../pages/Admin/KycManagement';
import CategoriesList from '../pages/Admin/Categories';
import CategoryDetail from '../pages/Admin/CategoryDetail';
import { CustomerAuthService } from '../services/customer/Authcustomer';
import { SellerAuthService } from '../services/seller/AuthSeller';
import { AdminAuthService } from '../services/admin/AdminAuthService';

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
    path: '/3d-room',
    element: <ThreeDRoom />
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