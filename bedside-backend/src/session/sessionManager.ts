export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 20;
const sessions = new Map<string, ChatMessage[]>();

export function getSession(phone: string): ChatMessage[] {
  return sessions.get(phone) ?? [];
}

export function appendMessage(phone: string, message: ChatMessage): void {
  const history = sessions.get(phone) ?? [];
  history.push(message);

  // Keep last MAX_MESSAGES — remove oldest 2 when exceeded
  if (history.length > MAX_MESSAGES) {
    history.splice(0, 2);
  }

  sessions.set(phone, history);
}

export function clearSession(phone: string): void {
  sessions.delete(phone);
}
