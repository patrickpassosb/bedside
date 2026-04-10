/**
 * Normalizes phone numbers from various WhatsApp formats to a consistent format.
 * Input examples:
 *   "5511991110001@s.whatsapp.net" → "+5511991110001"
 *   "+5511991110001" → "+5511991110001"
 *   "5511991110001" → "+5511991110001"
 */
export function normalizePhone(raw: string): string {
  // Strip WhatsApp JID suffix
  let phone = raw.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, "");

  // Strip everything except digits and leading +
  phone = phone.replace(/[^\d+]/g, "");

  // Ensure leading +
  if (!phone.startsWith("+")) {
    phone = `+${phone}`;
  }

  return phone;
}
