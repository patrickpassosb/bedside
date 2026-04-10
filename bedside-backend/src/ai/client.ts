import { Mistral } from "@mistralai/mistralai";
import { config } from "../config.js";
import type { ChatMessage } from "../session/sessionManager.js";

let mistralClient: Mistral | null = null;

function getClient(): Mistral | null {
  if (!config.aiApiKey) return null;

  if (!mistralClient) {
    mistralClient = new Mistral({ apiKey: config.aiApiKey });
  }
  return mistralClient;
}

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  const client = getClient();

  if (!client) {
    return "I understand your question. Let me connect you with your care team.";
  }

  try {
    const response = await client.chat.complete({
      model: config.aiModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    return "I understand your question. Let me connect you with your care team.";
  } catch (err) {
    console.error("AI provider error:", err);
    return "I understand your question. Let me connect you with your care team.";
  }
}
