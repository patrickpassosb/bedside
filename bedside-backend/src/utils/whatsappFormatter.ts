export function normalizeWhatsAppFormatting(text: string): string {
  let formatted = text;

  // Convert Markdown bold to WhatsApp bold.
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");
  // WhatsApp only needs single asterisks for bold. Collapse all repeated
  // asterisk runs to a single asterisk so malformed model output like
  // "**Titulo*" or "***Titulo***" still renders acceptably.
  formatted = formatted.replace(/\*{2,}/g, "*");

  return formatted;
}
