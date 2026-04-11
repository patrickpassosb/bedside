import OpenAI from "openai";
import { config } from "../config.js";
import type { ChatMessage } from "../session/sessionManager.js";

const REQUEST_TIMEOUT_MS = 8_000;

let primaryClient: OpenAI | null = null;
let fallbackClient: OpenAI | null = null;

function cannedResponse(language: string): string {
  if (language === "es") {
    return "Entiendo su pregunta. Permítame conectarle con su equipo de cuidados.";
  }
  if (language === "en") {
    return "I understand your question. Let me connect you with your care team.";
  }
  return "Entendi sua pergunta. Vou conectar voce com sua equipe de cuidados.";
}

function getPrimaryClient(): OpenAI | null {
  if (!config.groqApiKey) return null;
  if (!primaryClient) {
    primaryClient = new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: config.groqBaseUrl,
    });
  }
  return primaryClient;
}

function getFallbackClient(): OpenAI | null {
  if (!config.mistralApiKey) return null;
  if (!fallbackClient) {
    fallbackClient = new OpenAI({
      apiKey: config.mistralApiKey,
      baseURL: config.mistralBaseUrl,
    });
  }
  return fallbackClient;
}

async function callProvider(
  client: OpenAI,
  model: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      },
      { signal: controller.signal },
    );

    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateResponse(
  messages: ChatMessage[],
  language: string,
): Promise<string> {
  const primary = getPrimaryClient();

  if (primary) {
    try {
      const content = await callProvider(primary, config.groqModel, messages);
      if (content) return content;
      console.warn("[AI] Primary (Groq) returned empty content - falling back");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[AI] Primary (Groq) failed - falling back: ${message}`);
    }
  } else {
    console.warn("[AI] Primary (Groq) not configured - trying fallback");
  }

  const fallback = getFallbackClient();
  if (fallback) {
    try {
      console.warn("[AI] FALLBACK ENGAGED -> Mistral");
      const content = await callProvider(fallback, config.mistralModel, messages);
      if (content) return content;
      console.error("[AI] Fallback (Mistral) returned empty content - canned response");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[AI] Fallback (Mistral) failed - canned response: ${message}`);
    }
  } else {
    console.error("[AI] Fallback (Mistral) not configured - canned response");
  }

  return cannedResponse(language);
}
