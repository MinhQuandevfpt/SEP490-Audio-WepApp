import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthService } from '../services/admin/AdminAuthService';
import { FlatStaffAuthService } from '../services/admin/FlatStaffAuthService';
import { hasPermission } from '../utils/permissionHelper';

interface PermissionProtectedRouteProps {
  element: ReactElement;
  permission: string;
  fallbackPath?: string;
}

/**
 * Route protection component that checks user permissions
 * Redirects to fallback path (default: /admin/dashboard) if user doesn't have permission
 */
export function PermissionProtectedRoute({
  element,
  permission,
  fallbackPath = '/admin/dashboard'
}: PermissionProtectedRouteProps) {
  // Get current user from either AdminAuthService or FlatStaffAuthService
  const adminUser = AdminAuthService.getCurrentUser();
  const flatStaffUser = FlatStaffAuthService.getCurrentUser();
  const currentUser = adminUser || flatStaffUser;
  const userRole = currentUser?.role || '';
  
  if (!hasPermission(userRole, permission)) {
    // User doesn't have required permission
    console.warn(`User with role "${userRole}" tried to access route requiring "${permission}"`);
    return <Navigate to={fallbackPath} replace />;
  }
  
  return element;
}

