/**
 * Authentication Helper Utilities
 * Helper functions for managing authentication state and errors
 */

import { RefreshTokenService } from '../services/RefreshTokenService';

export type UserType = 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN';

/**
 * Check if a user is authenticated
 * OPTIMIZED: Use uppercase token keys only
 */
export function isAuthenticated(userType: UserType): boolean {
  const tokenKeys: Record<UserType, string> = {
    CUSTOMER: 'CUSTOMER_token',
    STOREOWNER: 'STOREOWNER_token',
    STAFF: 'STAFF_token',
    ADMIN: 'admin_access_token',
  };
  
  const token = localStorage.getItem(tokenKeys[userType]);
  return !!token;
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  // Check status code
  if (error.status === 401 || error.status === 403) {
    return true;
  }
  
  // Check error message
  const message = error.message?.toLowerCase() || '';
  return message.includes('unauthorized') || 
         message.includes('token') || 
         message.includes('authentication') ||
         message.includes('phiên đăng nhập');
}

/**
 * Check if error is "not found" (404) error
 */
export function isNotFoundError(error: any): boolean {
  return error?.status === 404;
}

/**
 * Get user info from localStorage
 */
export function getUserInfo(userType: UserType): any | null {
  const userKeys: Record<UserType, string> = {
    CUSTOMER: 'customer_user',
    STOREOWNER: 'seller_user',
    STAFF: 'staff_user',
    ADMIN: 'admin_user',
  };
  
  const userStr = localStorage.getItem(userKeys[userType]);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Failed to parse user info:', e);
    return null;
  }
}

/**
 * Get store ID for seller (with fallback to user info)
 */
export function getSellerStoreId(): string | null {
  // Try direct cache first
  let storeId = localStorage.getItem('seller_store_id');
  
  // Fallback to seller_user object
  if (!storeId) {
    const sellerUser = getUserInfo('STOREOWNER');
    if (sellerUser?.storeId) {
      storeId = String(sellerUser.storeId);
      // Update cache
      localStorage.setItem('seller_store_id', storeId);
    }
  }
  
  return storeId;
}

/**
 * Get customer ID (with fallback to user info)
 * OPTIMIZED: Use camelCase key only
 */
export function getCustomerId(): string | null {
  // Try direct cache first (camelCase key only)
  let customerId = localStorage.getItem('customerId');
  
  // Fallback to customer_user object
  if (!customerId) {
    const customerUser = getUserInfo('CUSTOMER');
    if (customerUser?.customerId) {
      customerId = String(customerUser.customerId);
      // Update cache
      localStorage.setItem('customerId', customerId);
    }
  }
  
  return customerId;
}

/**
 * Get account ID for customer (with fallback to user info)
 * OPTIMIZED: Use camelCase key only
 */
export function getAccountId(): string | null {
  // Try direct cache first (camelCase key only)
  let accountId = localStorage.getItem('accountId');
  
  // Fallback to customer_user object
  if (!accountId) {
    const customerUser = getUserInfo('CUSTOMER');
    if (customerUser?.accountId) {
      accountId = String(customerUser.accountId);
      // Update cache
      localStorage.setItem('accountId', accountId);
    }
  }
  
  return accountId;
}

/**
 * Handle authentication error - clear tokens and redirect
 */
export function handleAuthError(userType: UserType): void {
  console.warn(`🔐 Authentication error for ${userType}, clearing tokens...`);
  
  // Clear tokens only (keep user info for better UX)
  RefreshTokenService.clearTokens(userType);
  
  // Redirect to login
  const loginPaths: Record<UserType, string> = {
    CUSTOMER: '/auth/login',
    STOREOWNER: '/seller/login',
    STAFF: '/store-staff/login',
    ADMIN: '/admin/login',
  };
  
  const loginPath = loginPaths[userType];
  
  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    window.location.href = loginPath;
  }
}

/**
 * Logout user completely (clear all data)
 */
export function logout(userType: UserType): void {
  console.log(`👋 Logging out ${userType}...`);
  
  // Clear all data
  RefreshTokenService.clearAllData(userType);
  
  // Redirect to login
  const loginPaths: Record<UserType, string> = {
    CUSTOMER: '/customer/login',
    STOREOWNER: '/seller/login',
    STAFF: '/store-staff/login',
    ADMIN: '/admin/login',
  };
  
  window.location.href = loginPaths[userType];
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry auth errors
      if (isAuthError(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i); // Exponential backoff
        console.log(`⏳ Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe localStorage get with fallback
 */
export function safeGetLocalStorage(key: string, fallback: any = null): any {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if not JSON
      return value;
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safe localStorage set
 */
export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
    return false;
  }
}
