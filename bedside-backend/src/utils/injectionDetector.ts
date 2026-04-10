const INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore all instructions",
  "system prompt",
  "you are now",
  "forget your",
  "new instructions",
  "act as",
  "pretend you are",
];

export function checkInjection(text: string): boolean {
  const lower = text.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => lower.includes(pattern));
}
