/**
 * XeroxQ — Centralized System Configuration
 * 
 * As a System Architect, we centralize all business logic constants here.
 * This ensures consistency across the Client UI, Admin Dashboard, and Platform API.
 */

export const CONFIG = {
  UI: {
    APP_NAME: "XeroxQ",
    CEO_DASHBOARD_TITLE: "Platform Command Center",
  },
  
  BILLING: {
    // The commission the platform takes per file processed (₹)
    PLATFORM_FEE_PER_FILE: 0.50,
    
    // Default fallback prices if shop hasn't configured them
    DEFAULT_MONO_PRICE: 2.00,
    DEFAULT_COLOR_PRICE: 10.00,
    
    // Currency configuration
    CURRENCY: "INR",
    CURRENCY_SYMBOL: "₹",
  },

  SECURITY: {
    // Routes that require CEO level access
    PLATFORM_ADMIN_BASE: "/platform-admin",
  }
} as const;

export type SystemConfig = typeof CONFIG;
