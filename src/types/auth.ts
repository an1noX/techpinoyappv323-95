
export type UserRole = 'admin' | 'sales_admin' | 'user' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  canManageProducts: boolean;
  canManageClients: boolean;
  canManagePrinters: boolean;
  canManageSuppliers: boolean;
  canViewPricing: boolean;
  canManageHomepage: boolean;
  canViewAssets: boolean;
}
