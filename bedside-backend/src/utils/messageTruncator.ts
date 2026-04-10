const MAX_LENGTH = 4000;

export function truncateMessage(text: string, language: string): string {
  if (text.length <= MAX_LENGTH) return text;

  // Find last complete sentence before limit
  const truncated = text.substring(0, MAX_LENGTH);
  const lastPeriod = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf(".\n"),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("?\n")
  );

  const cutPoint = lastPeriod > 0 ? lastPeriod + 1 : MAX_LENGTH;

  const continuation =
    language === "es"
      ? "\n\n...¿Quieres que continue?"
      : language === "en"
        ? "\n\n...Would you like me to continue?"
        : "\n\n...Gostaria que eu continuasse?";

  return text.substring(0, cutPoint) + continuation;
}
