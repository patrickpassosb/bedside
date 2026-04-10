import { supabase } from "../supabase.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { generateResponse } from "../ai/client.js";
import { buildSystemPrompt } from "../ai/promptBuilder.js";
import { getSession, appendMessage } from "../session/sessionManager.js";
import { sendText } from "../whatsapp/sender.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";
import { truncateMessage } from "../utils/messageTruncator.js";
import { normalizeWhatsAppFormatting } from "../utils/whatsappFormatter.js";

export async function handleFreeText(
  ctx: PatientWithHospital,
  messageText: string,
  language: string
): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);
  const today = new Date().toISOString().split("T")[0];

  // Fetch patient data for context
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("appointment_date", today);

  const { data: medications } = await supabase
    .from("medication_requests")
    .select("*")
    .eq("patient_id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("active", true);

  const systemPrompt = buildSystemPrompt(ctx.patient, ctx.hospital, appointments ?? [], medications ?? []);

  // Build message array: system + history + current
  const history = getSession(phone);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history,
    { role: "user" as const, content: messageText },
  ];

  const rawResponse = await generateResponse(messages, language);
  const response = normalizeWhatsAppFormatting(truncateMessage(rawResponse, language));

  // Update session memory
  appendMessage(phone, { role: "user", content: messageText });
  appendMessage(phone, { role: "assistant", content: response });

  await sendText(phone, response);
  return response;
}
