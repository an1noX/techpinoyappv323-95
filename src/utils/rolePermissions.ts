
import { UserRole, RolePermissions } from '@/types/auth';

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageProducts: true,
        canManageClients: true,
        canManagePrinters: true,
        canManageSuppliers: true,
        canViewPricing: true,
        canManageHomepage: true,
        canViewAssets: true,
      };
    case 'sales_admin':
      return {
        canManageProducts: true,
        canManageClients: true,
        canManagePrinters: true,
        canManageSuppliers: false, // Sales admin cannot manage suppliers
        canViewPricing: true,
        canManageHomepage: false, // Sales admin cannot manage homepage settings
        canViewAssets: true,
      };
    case 'user':
    default:
      return {
        canManageProducts: false,
        canManageClients: false,
        canManagePrinters: false,
        canManageSuppliers: false,
        canViewPricing: false,
        canManageHomepage: false,
        canViewAssets: false,
      };
  }
};

// Helper function to check if a user can perform a specific action
export const canUserPerform = (userRole: UserRole, permission: keyof RolePermissions): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions[permission];
};
