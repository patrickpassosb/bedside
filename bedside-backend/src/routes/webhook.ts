import type { FastifyInstance } from "fastify";
import { lookupPatient } from "../utils/patientLookup.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";
import { detectLanguage } from "../ai/languageDetector.js";
import { detectIntent } from "../handlers/intentRouter.js";
import { handleSchedule, handleScheduleItemTap } from "../handlers/scheduleHandler.js";
import { handleMedication, handleMedicationItemTap } from "../handlers/medicationHandler.js";
import { handleNextAction } from "../handlers/nextActionHandler.js";
import { handleEscalation } from "../handlers/escalationHandler.js";
import { handleFamilyOn, handleFamilyOff } from "../handlers/familyHandler.js";
import { handleFreeText } from "../handlers/freeTextHandler.js";
import { logAudit, logConversation } from "../utils/auditLogger.js";
import { sendText } from "../whatsapp/sender.js";
import { supabase } from "../supabase.js";
import { checkInjection } from "../utils/injectionDetector.js";
import { truncateMessage } from "../utils/messageTruncator.js";

// Deduplication map: messageId -> timestamp
const processedMessages = new Map<string, number>();

// Cleanup old entries every 60 seconds
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [id, ts] of processedMessages) {
    if (ts < cutoff) processedMessages.delete(id);
  }
}, 60_000);

export async function webhookRoutes(server: FastifyInstance) {
  server.post("/webhook/evolution", async (request, reply) => {
    // Respond 200 immediately
    reply.send({ status: "ok" });

    // Process asynchronously
    setImmediate(async () => {
      try {
        await processWebhook(request.body);
      } catch (err) {
        console.error("Webhook processing error:", err);
      }
    });
  });
}

async function processWebhook(body: unknown): Promise<void> {
  const payload = body as Record<string, unknown>;

  const event = payload.event as string | undefined;
  if (event && event !== "messages.upsert") return;

  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) return;

  const key = data.key as Record<string, unknown> | undefined;
  if (!key || key.fromMe) return;

  const messageId = key.id as string | undefined;
  if (messageId) {
    if (processedMessages.has(messageId)) return;
    processedMessages.set(messageId, Date.now());
  }

  const remoteJid = key.remoteJid as string | undefined;
  if (!remoteJid || remoteJid.endsWith("@g.us")) return;

  const phone = normalizePhone(remoteJid);

  const message = data.message as Record<string, unknown> | undefined;
  if (!message) return;

  let messageText = (message.conversation as string) ?? "";
  if (!messageText) {
    const extended = message.extendedTextMessage as Record<string, unknown> | undefined;
    messageText = (extended?.text as string) ?? "";
  }
  if (!messageText) {
    const buttonResponse = message.buttonsResponseMessage as Record<string, unknown> | undefined;
    const buttonId = buttonResponse?.selectedButtonId as string | undefined;
    const BUTTON_TEXT: Record<string, string> = {
      schedule: "hoje",
      medications: "remedios",
      question: "tenho uma duvida",
    };
    if (buttonId && BUTTON_TEXT[buttonId]) messageText = BUTTON_TEXT[buttonId];
  }

  if (!messageText) {
    const listResponse = message.listResponseMessage as Record<string, unknown> | undefined;
    if (listResponse) {
      const rowId = listResponse.singleSelectReply as Record<string, unknown> | undefined;
      const selectedId = (rowId?.selectedRowId as string) ?? (listResponse.rowId as string) ?? "";
      if (selectedId.startsWith("apt_") || selectedId.startsWith("med_")) {
        await handleListItemTap(phone, selectedId);
        return;
      }
    }
  }

  if (!messageText) return;

  console.log(`Message from ${phone}: ${messageText}`);

  // Look up patient
  const ctx = await lookupPatient(remoteJid);
  if (!ctx) {
    const lang = detectLanguage(messageText);
    const msg =
      lang === "es"
        ? "Lo siento, no encontre su registro. Por favor, hable con el equipo de enfermeria para obtener ayuda."
        : lang === "en"
          ? "Sorry, I couldn't find your record. Please speak with the nursing staff for assistance."
          : "Desculpe, nao encontrei seu registro. Por favor, fale com a equipe de enfermagem para obter ajuda.";
    await sendText(phone, msg);
    return;
  }

  // Detect language and update patient preference
  const language = detectLanguage(messageText, ctx.hospital.language);
  await supabase
    .from("patients")
    .update({ preferred_language: language })
    .eq("id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id);

  // Check for prompt injection
  if (checkInjection(messageText)) {
    await logAudit({
      hospital_id: ctx.patient.hospital_id,
      patient_id: ctx.patient.id,
      intent_detected: "injection_attempt",
      handler_used: "deterministic",
      input_summary: "Prompt injection attempt detected",
      response_summary: "Safe fallback sent",
      detected_language: language,
    });

    const msg =
      language === "es"
        ? "Estoy aqui para ayudarle con su cuidado. ¿Tiene alguna pregunta sobre su tratamiento, medicamentos o agenda?"
        : language === "en"
          ? "I'm here to help you with your care. Do you have any questions about your treatment, medications, or schedule?"
          : "Estou aqui para ajudar voce com seu cuidado. Tem alguma duvida sobre seu tratamento, medicamentos ou agenda?";
    await sendText(phone, msg);
    await logConversation({
      hospital_id: ctx.patient.hospital_id,
      patient_id: ctx.patient.id,
      direction: "inbound",
      message_text: messageText,
      detected_language: language,
    });
    await logConversation({
      hospital_id: ctx.patient.hospital_id,
      patient_id: ctx.patient.id,
      direction: "outbound",
      message_text: msg,
      detected_language: language,
    });
    return;
  }

  // Route intent
  const intent = detectIntent(messageText);
  console.log(`Intent for ${phone}: ${intent}`);

  // Log inbound message
  await logConversation({
    hospital_id: ctx.patient.hospital_id,
    patient_id: ctx.patient.id,
    direction: "inbound",
    message_text: messageText,
    detected_language: language,
  });

  // Handle intent
  let response: string;
  let handlerUsed: string;

  switch (intent) {
    case "schedule_request":
      response = await handleSchedule(ctx, language);
      handlerUsed = "deterministic";
      break;
    case "medication_question":
      response = await handleMedication(ctx, language);
      handlerUsed = "deterministic";
      break;
    case "next_action":
      response = await handleNextAction(ctx, language);
      handlerUsed = "deterministic";
      break;
    case "escalation":
      response = await handleEscalation(ctx, messageText, language);
      handlerUsed = "escalation";
      break;
    case "family_on":
      response = await handleFamilyOn(ctx, language);
      handlerUsed = "deterministic";
      break;
    case "family_off":
      response = await handleFamilyOff(ctx, language);
      handlerUsed = "deterministic";
      break;
    case "free_text":
    default:
      response = await handleFreeText(ctx, messageText, language);
      handlerUsed = "ai";
      break;
  }

  // Truncate if needed
  response = truncateMessage(response, language);

  // Log audit — summaries only, never raw message content (LGPD)
  const auditIntent = intent === "family_on" || intent === "family_off" ? "family_toggle" : intent;
  await logAudit({
    hospital_id: ctx.patient.hospital_id,
    patient_id: ctx.patient.id,
    intent_detected: auditIntent,
    handler_used: handlerUsed,
    input_summary: summarizeIntent(intent),
    response_summary: summarizeResponse(intent, handlerUsed),
    detected_language: language,
  });

  // Log outbound message
  await logConversation({
    hospital_id: ctx.patient.hospital_id,
    patient_id: ctx.patient.id,
    direction: "outbound",
    message_text: response,
    detected_language: language,
  });
}

function summarizeIntent(intent: string): string {
  switch (intent) {
    case "schedule_request": return "patient asked about schedule";
    case "medication_question": return "patient asked about medications";
    case "next_action": return "patient asked for next action";
    case "escalation": return "patient requested nurse / reported distress";
    case "family_on": return "patient enabled family sharing";
    case "family_off": return "patient disabled family sharing";
    case "free_text": return "patient free-text question";
    default: return "unknown intent";
  }
}

function summarizeResponse(intent: string, handlerUsed: string): string {
  if (handlerUsed === "escalation") return "reassurance sent, care team notified";
  if (handlerUsed === "ai") return "AI contextual response sent";
  switch (intent) {
    case "schedule_request": return "schedule list sent";
    case "medication_question": return "medication list sent";
    case "next_action": return "next action sent";
    case "family_on": return "family share link sent";
    case "family_off": return "family sharing disabled";
    default: return "response sent";
  }
}

async function handleListItemTap(phone: string, selectedId: string): Promise<void> {
  const ctx = await lookupPatient(phone);
  if (!ctx) return;

  const language = ctx.patient.preferred_language ?? ctx.hospital.language;

  if (selectedId.startsWith("apt_")) {
    const aptId = selectedId.replace("apt_", "");
    await handleScheduleItemTap(ctx, aptId, language);
  } else if (selectedId.startsWith("med_")) {
    const medId = selectedId.replace("med_", "");
    await handleMedicationItemTap(ctx, medId, language);
  }
}
