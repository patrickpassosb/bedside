import { Mistral } from "@mistralai/mistralai";
import { config } from "../config.js";
import type { ChatMessage } from "../session/sessionManager.js";

let mistralClient: Mistral | null = null;

function fallbackResponse(language: string): string {
  if (language === "es") {
    return "Entiendo su pregunta. Permítame conectarle con su equipo de cuidados.";
  }
  if (language === "en") {
    return "I understand your question. Let me connect you with your care team.";
  }
  return "Entendi sua pergunta. Vou conectar voce com sua equipe de cuidados.";
}

function getClient(): Mistral | null {
  if (!config.aiApiKey) return null;

  if (!mistralClient) {
    mistralClient = new Mistral({ apiKey: config.aiApiKey });
  }
  return mistralClient;
}

export async function generateResponse(messages: ChatMessage[], language: string): Promise<string> {
  const client = getClient();

  if (!client) {
    return fallbackResponse(language);
  }

  try {
    const response = await client.chat.complete({
      model: config.aiModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    return fallbackResponse(language);
  } catch (err) {
    console.error("AI provider error:", err);
    return fallbackResponse(language);
  }
}
