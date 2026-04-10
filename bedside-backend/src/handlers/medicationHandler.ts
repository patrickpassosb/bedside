import { supabase } from "../supabase.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { sendList, sendText } from "../whatsapp/sender.js";
import { buildMedicationListPayload } from "../whatsapp/messageBuilder.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";
import { generateResponse } from "../ai/client.js";
import { buildSystemPrompt } from "../ai/promptBuilder.js";

export async function handleMedication(ctx: PatientWithHospital, language: string): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);

  const { data: medications, error } = await supabase
    .from("medication_requests")
    .select("*")
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("patient_id", ctx.patient.id)
    .eq("active", true);

  if (error || !medications || medications.length === 0) {
    const msg =
      language === "es"
        ? `Hola ${ctx.patient.name}, no tienes medicamentos activos registrados. Si tienes alguna pregunta, estoy aqui para ayudarte.`
        : language === "en"
          ? `Hello ${ctx.patient.name}, you have no active medications registered. If you have any questions, I'm here to help!`
          : `Ola ${ctx.patient.name}, voce nao tem medicamentos ativos registrados. Se tiver alguma duvida, estou aqui para ajudar!`;
    await sendText(phone, msg);
    return msg;
  }

  const payload = buildMedicationListPayload(medications);
  await sendList(phone, payload.title, payload.description, payload.buttonText, payload.sections);

  return `Sent medication list with ${medications.length} medications`;
}

export async function handleMedicationItemTap(
  ctx: PatientWithHospital,
  medicationId: string,
  language: string
): Promise<string> {
  const { data: med } = await supabase
    .from("medication_requests")
    .select("*")
    .eq("id", medicationId)
    .eq("hospital_id", ctx.patient.hospital_id)
    .single();

  if (!med) return "";

  const phone = normalizePhone(ctx.patient.phone_number);

  // Fetch context for AI explanation
  const today = new Date().toISOString().split("T")[0];
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

  const langInstruction =
    language === "en"
      ? "Respond in English."
      : language === "es"
        ? "Respond in Spanish."
        : "Respond in Portuguese.";

  const response = await generateResponse([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `${langInstruction} Explain my medication ${med.medication_name} ${med.dosage} in simple, warm language. Include what it is for (${med.reason}), how I take it (${med.route}, ${med.frequency}), and when the next dose is due.`,
    },
  ]);

  await sendText(phone, response);
  return response;
}
