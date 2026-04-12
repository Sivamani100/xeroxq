/**
 * XeroxQ — Twilio Webhook Signature Verifier
 * 
 * Twilio signs every request it sends using HMAC-SHA1 with your Auth Token.
 * This validator ensures ALL incoming WhatsApp webhook requests are genuinely from Twilio
 * and not from an attacker spoofing the endpoint.
 * 
 * Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */

import { createHmac } from "crypto";

/**
 * Validates the X-Twilio-Signature header against the request body.
 * @param authToken - Your Twilio Auth Token (from env vars)
 * @param signature - The X-Twilio-Signature header value
 * @param url - The full URL of the webhook endpoint
 * @param params - The form-encoded body parameters as a key-value object
 * @returns true if the signature is valid
 */
export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken || !signature || !url) return false;

  // 1. Start with the full URL
  let signingInput = url;

  // 2. Sort the params alphabetically by key and append each key+value
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signingInput += key + (params[key] ?? "");
  }

  // 3. Compute HMAC-SHA1 using the Auth Token as the key
  const hmac = createHmac("sha1", authToken);
  hmac.update(signingInput, "utf8");
  const expectedSignature = hmac.digest("base64");

  // 4. Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expectedSignature, signature);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
