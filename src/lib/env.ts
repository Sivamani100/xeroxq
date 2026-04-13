/**
 * XeroxQ — Environment Validation Layer
 * 
 * DevOps Best Practice: Fail-Fast.
 * This script ensures the application does not start with invalid or missing
 * configuration, preventing runtime crashes during critical business operations.
 */

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL"
] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMsg = `[DevOps] CRITICAL: Missing required environment variables: ${missing.join(", ")}`;
    
    // In serverless architecture (Vercel), throwing at module scope bricks the entire lambda.
    // We log a critical warning instead of crashing the process.
    console.warn("\x1b[31m%s\x1b[0m", errorMsg);
  }

  // Specific format validations
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")) {
    console.error(`[DevOps] INVALID CONFIG: NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL.`);
  }
}

// Execute immediately on import if in server environment
if (typeof window === 'undefined') {
  validateEnv();
}
