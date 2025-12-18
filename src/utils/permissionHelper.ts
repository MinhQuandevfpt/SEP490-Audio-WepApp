/**
 * Permission Helper Utilities
 * Helper functions for managing role-based permissions
 */

export type AdminRole = 'admin' | 'staffadmin' | 'flatstaff'; // flatstaff is normalized to staffadmin

export interface RolePermissions {
  manage_users: boolean;
  manage_products: boolean;
  manage_system: boolean;
  manage_orders: boolean;
  manage_campaigns: boolean;
  manage_banners: boolean;
  manage_finance: boolean;
  manage_policies: boolean;
}

/**
 * Normalize role name from API to internal role name
 * Handles case-insensitive matching and different role names
 * Returns 'admin' or 'staffadmin' (flatstaff is mapped to staffadmin)
 */
function normalizeRole(role: string): 'admin' | 'staffadmin' {
  const normalized = role.toLowerCase().trim();
  
  // Map various role names to internal roles
  if (normalized === 'admin') return 'admin';
  if (normalized === 'staffadmin' || normalized === 'flatstaff') return 'staffadmin';
  
  // Default to staffadmin for unknown roles (secure by default)
  return 'staffadmin';
}

/**
 * Permission mapping for each admin role
 * Define what each role can and cannot do
 */
export const ROLE_PERMISSIONS: Record<'admin' | 'staffadmin', RolePermissions> = {
  admin: {
    manage_users: true,
    manage_products: true,
    manage_system: true,
    manage_orders: true,
    manage_campaigns: true,
    manage_banners: true,
    manage_finance: true,
    manage_policies: true,
  },
  staffadmin: {
    manage_users: false,      // Không quản lý users
    manage_products: true,     // Có thể quản lý products/stores
    manage_system: false,     // Không quản lý system settings
    manage_orders: true,      // Có thể quản lý orders
    manage_campaigns: true,   // Có thể quản lý campaigns
    manage_banners: true,     // Có thể quản lý banners
    manage_finance: false,    // Không quản lý finance
    manage_policies: true,    // Có thể quản lý policies
  },
};

/**
 * Check if a role has a specific permission
 * @param role - The user's role (case-insensitive, supports 'FLATSTAFF', 'staffadmin', etc.)
 * @param permission - The permission to check
 * @returns true if the role has the permission, false otherwise
 */
export function hasPermission(role: string, permission: string): boolean {
  // Normalize role (handles FLATSTAFF, staffadmin, etc.)
  const normalizedRole = normalizeRole(role);
  
  // Get permissions for this role
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  
  // If role not found, deny access by default (secure by default)
  if (!permissions) {
    console.warn(`Unknown role: ${role}. Access denied.`);
    return false;
  }
  
  // Check if permission exists and is enabled
  const hasAccess = permissions[permission as keyof RolePermissions] ?? false;
  
  return hasAccess;
}

/**
 * Check if a role is a valid admin role (admin, staffadmin, or flatstaff)
 * @param role - The role to check
 * @returns true if the role is a valid admin role
 */
export function isValidAdminRole(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'staffadmin';
}

/**
 * Get all permissions for a specific role
 * @param role - The user's role
 * @returns RolePermissions object or null if role not found
 */
export function getRolePermissions(role: string): RolePermissions | null {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || null;
}

