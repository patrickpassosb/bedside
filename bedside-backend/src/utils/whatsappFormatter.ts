export function normalizeWhatsAppFormatting(text: string): string {
  let formatted = text;

  // Convert Markdown bold to WhatsApp bold.
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Normalize accidental doubled single-asterisk pairs produced by the model.
  formatted = formatted.replace(/\*{3,}/g, "**");
  formatted = formatted.replace(/\*([^\n*]+)\*\*/g, "*$1*");
  formatted = formatted.replace(/\*\*([^\n*]+)\*/g, "*$1*");

  return formatted;
}
