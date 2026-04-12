/**
 * Utility to handle WhatsApp integration logic.
 * 
 * IMPORTANT: Set NEXT_PUBLIC_WHATSAPP_BOT_NUMBER in your .env.local file
 * to your own Twilio/WhatsApp Business number in international format (no +).
 * Example: 919876543210 for an Indian number
 */
const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;

if (!WHATSAPP_BOT_NUMBER && typeof window === "undefined") {
  console.warn("[XeroxQ] ⚠️  NEXT_PUBLIC_WHATSAPP_BOT_NUMBER is not set. WhatsApp links will not work correctly.");
}

/**
 * Extracts a potential Indian phone number from a UPI ID.
 * Common formats: 
 * - 9876543210@upi
 * - 919876543210@okicici
 * - +919876543210@ybl
 * 
 * Returns the phone number in international format (without +) or null.
 */
export function extractPhoneFromUpi(upiId: string): string | null {
  if (!upiId) return null;

  // Pattern to find 10 digits potentially preceded by 91 or +91
  // We look for the part before the @
  const handle = upiId.split('@')[0];
  
  // Clean handle of common prefix +91 or 91 if it results in exactly 10 digits
  let cleanHandle = handle.replace(/^\+91/, '').replace(/^91/, '');
  
  // If cleaning it left us with a non-10 digit handle, revert (maybe the handle itself starts with 91)
  if (cleanHandle.length !== 10 && handle.length === 10) {
    cleanHandle = handle;
  }

  // Final check: Is it exactly 10 digits?
  if (/^\d{10}$/.test(cleanHandle)) {
    return `91${cleanHandle}`; // Return in international format for WhatsApp
  }

  return null;
}

/**
 * Generates a WhatsApp deep link (wa.me).
 * If a bot number is used, it includes a pre-filled message for routing.
 * If mapping to a shop phone directly, it just opens the chat.
 */
export function generateWhatsAppLink(shopSlug: string, shopPhone?: string | null): string {
  // If we want it to go to the official bot (for automation with Twilio)
  if (WHATSAPP_BOT_NUMBER) {
    return `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(`PRINT AT ${shopSlug}`)}`;
  }
  
  // High-friction fallback: Go to shopkeeper directly (requires manual forwarding or bridge)
  if (shopPhone) {
    return `https://wa.me/${shopPhone}`;
  }

  return `https://wa.me/${WHATSAPP_BOT_NUMBER}`;
}
