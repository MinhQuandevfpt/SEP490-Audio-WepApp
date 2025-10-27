/**
 * EXAMPLE: Using HttpInterceptor with auto refresh token
 * 
 * This file demonstrates how to use the HttpInterceptor in your components
 * to make API calls with automatic token refresh.
 */

import { HttpInterceptor } from '../services/HttpInterceptor';
import { CustomerAuthService } from '../services/customer/Authcustomer';
import { SellerAuthService } from '../services/seller/AuthSeller';
import { StoreStaffAuthService } from '../services/staff/AuthStaff';

/**
 * Example 1: Customer fetching their profile
 */
export const fetchCustomerProfile = async () => {
  try {
    const profile = await HttpInterceptor.get('/api/customer/profile', {
      userType: 'customer'
    });
    
    console.log('Customer profile:', profile);
    return profile;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // If token refresh fails, user will be redirected to login automatically
    throw error;
  }
};

/**
 * Example 2: Customer updating their profile
 */
export const updateCustomerProfile = async (data: any) => {
  try {
    const result = await HttpInterceptor.put('/api/customer/profile', data, {
      userType: 'customer'
    });
    
    console.log('Profile updated:', result);
    return result;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

/**
 * Example 3: Seller fetching their products
 */
export const fetchSellerProducts = async () => {
  try {
    const products = await HttpInterceptor.get('/api/seller/products', {
      userType: 'seller'
    });
    
    console.log('Seller products:', products);
    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};

/**
 * Example 4: Seller creating a new product
 */
export const createSellerProduct = async (productData: any) => {
  try {
    const result = await HttpInterceptor.post('/api/seller/products', productData, {
      userType: 'seller'
    });
    
    console.log('Product created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};

/**
 * Example 5: Store Staff fetching orders
 */
export const fetchStaffOrders = async () => {
  try {
    const orders = await HttpInterceptor.get('/api/staff/orders', {
      userType: 'staff'
    });
    
    console.log('Staff orders:', orders);
    return orders;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
};

/**
 * Example 6: Store Staff updating order status
 */
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const result = await HttpInterceptor.patch(`/api/staff/orders/${orderId}`, 
      { status },
      { userType: 'staff' }
    );
    
    console.log('Order status updated:', result);
    return result;
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
};

/**
 * Example 7: Manual token refresh (if needed)
 */
export const manualRefreshCustomerToken = async () => {
  try {
    const newToken = await CustomerAuthService.refreshToken();
    console.log('Token refreshed manually:', newToken);
    return newToken;
  } catch (error) {
    console.error('Manual refresh failed:', error);
    throw error;
  }
};

/**
 * Example 8: Using in React Component with hooks
 */
export const useCustomerProfile = () => {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await HttpInterceptor.get('/api/customer/profile', {
        userType: 'customer'
      });
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, []);

  return { profile, loading, error, refetch: loadProfile };
};

/**
 * Example 9: Login with automatic token storage
 */
export const handleCustomerLogin = async (email: string, password: string) => {
  try {
    const response = await CustomerAuthService.login({ email, password });
    
    // Tokens are automatically stored by the service
    console.log('Login successful:', response);
    
    // Access token is in localStorage as 'customer_token'
    // Refresh token is in localStorage as 'customer_refresh_token'
    
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Example 10: Logout with automatic token cleanup
 */
export const handleCustomerLogout = () => {
  // This will clear both access token and refresh token
  CustomerAuthService.logout();
  
  console.log('Logged out successfully');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Example 11: Check if tokens exist
 */
export const checkAuthStatus = () => {
  const hasCustomerToken = CustomerAuthService.isAuthenticated();
  const hasSellerToken = SellerAuthService.isAuthenticated();
  const hasStaffToken = StoreStaffAuthService.isAuthenticated();
  
  console.log('Auth status:', {
    customer: hasCustomerToken,
    seller: hasSellerToken,
    staff: hasStaffToken
  });
  
  return {
    customer: hasCustomerToken,
    seller: hasSellerToken,
    staff: hasStaffToken
  };
};

/**
 * Example 12: Request without auto-refresh (skip interceptor)
 */
export const fetchPublicData = async () => {
  try {
    // Use skipAuthRefresh: true to disable auto-refresh for this request
    const data = await HttpInterceptor.get('/api/public/products', {
      skipAuthRefresh: true
    });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch public data:', error);
    throw error;
  }
};

/**
 * Example 13: Multiple requests in parallel
 */
export const fetchDashboardData = async () => {
  try {
    const [profile, orders, notifications] = await Promise.all([
      HttpInterceptor.get('/api/customer/profile', { userType: 'customer' }),
      HttpInterceptor.get('/api/customer/orders', { userType: 'customer' }),
      HttpInterceptor.get('/api/customer/notifications', { userType: 'customer' })
    ]);
    
    return { profile, orders, notifications };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
};

// Note: Add React import if using the hook example
import React from 'react';
