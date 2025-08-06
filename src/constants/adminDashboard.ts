export const ADMIN_DASHBOARD_TABS = {
  CLIENT: 'client',
  SUPPLIERS: 'suppliers',
  PRINTERS: 'printers',
  PRODUCT: 'product',
} as const;

export const SEARCH_PLACEHOLDERS = {
  CLIENT: 'Search clients...',
  SUPPLIERS: 'Search suppliers...',
  PRINTERS_ALL: 'Search printers...',
  PRODUCT: 'Search products...',
} as const;

export const LOADING_MESSAGES = {
  ADMIN_DASHBOARD: 'Loading admin dashboard...',
  CLIENT: 'Loading clients...',
  SUPPLIERS: 'Loading suppliers...',
  PRINTERS: 'Loading printers...',
  PRODUCT: 'Loading products...',
  CLIENT_DETAILS: 'Loading client details...',
} as const;

export const ERROR_MESSAGES = {
  CLIENT_NOT_FOUND: 'Client not found or you do not have permission to view it.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  CLIENT_ADDED: 'Client added successfully!',
  CLIENT_UPDATED: 'Client updated successfully!',
  CLIENT_DELETED: 'Client deleted successfully!',
} as const;

export const UI_CONSTANTS = {
  SKELETON_ITEMS: 5,
  MAX_DISPLAY_ITEMS: 100,
} as const;