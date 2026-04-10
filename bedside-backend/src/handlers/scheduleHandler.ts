import { supabase } from "../supabase.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { sendList, sendText } from "../whatsapp/sender.js";
import { buildScheduleListPayload } from "../whatsapp/messageBuilder.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";

interface AppointmentSummary {
  title: string;
  scheduled_time: string;
  location: string | null;
}

function buildScheduleFallbackMessage(
  patientName: string,
  appointments: AppointmentSummary[],
  language: string
): string {
  const intro =
    language === "es"
      ? `*Agenda de hoy para ${patientName}*`
      : language === "en"
        ? `*Today's schedule for ${patientName}*`
        : `*Agenda de hoje para ${patientName}*`;

  const lines = appointments.map((apt) => {
    if (language === "es") {
      return `- *${apt.scheduled_time}* ${apt.title}${apt.location ? ` (${apt.location})` : ""}`;
    }
    if (language === "en") {
      return `- *${apt.scheduled_time}* ${apt.title}${apt.location ? ` (${apt.location})` : ""}`;
    }
    return `- *${apt.scheduled_time}* ${apt.title}${apt.location ? ` (${apt.location})` : ""}`;
  });

  const footer =
    language === "es"
      ? "\n\nSi desea, puedo explicarle cualquiera de estos compromisos."
      : language === "en"
        ? "\n\nIf you'd like, I can explain any of these appointments."
        : "\n\nSe quiser, posso explicar qualquer um desses compromissos.";

  return `${intro}\n\n${lines.join("\n")}${footer}`;
}

export async function handleSchedule(ctx: PatientWithHospital, language: string): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const phone = normalizePhone(ctx.patient.phone_number);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("patient_id", ctx.patient.id)
    .eq("appointment_date", today)
    .eq("completed", false)
    .order("scheduled_time", { ascending: true });

  if (error || !appointments || appointments.length === 0) {
    const msg =
      language === "es"
        ? `Hola ${ctx.patient.name}, no tienes citas programadas para hoy. Si tienes alguna pregunta, estoy aqui para ayudarte.`
        : language === "en"
          ? `Hello ${ctx.patient.name}, you have no appointments scheduled for today. If you have any questions, I'm here to help!`
          : `Ola ${ctx.patient.name}, voce nao tem compromissos agendados para hoje. Se tiver alguma duvida, estou aqui para ajudar!`;
    await sendText(phone, msg);
    return msg;
  }

  const payload = buildScheduleListPayload(appointments);
  try {
    await sendList(
      phone,
      payload.title,
      payload.description,
      payload.footerText,
      payload.buttonText,
      payload.sections
    );

    return `Sent schedule with ${appointments.length} appointments`;
  } catch (err) {
    console.warn("Schedule list send failed, falling back to text.", err);
    const fallback = buildScheduleFallbackMessage(ctx.patient.name, appointments, language);
    await sendText(phone, fallback);
    return fallback;
  }
}

export async function handleScheduleItemTap(
  ctx: PatientWithHospital,
  appointmentId: string,
  language: string
): Promise<string> {
  const { data: apt } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("hospital_id", ctx.patient.hospital_id)
    .single();

  if (!apt) return "";

  const phone = normalizePhone(ctx.patient.phone_number);
  const prep = apt.preparation_notes
    ? language === "en"
      ? `\n\nPreparation: ${apt.preparation_notes}`
      : language === "es"
        ? `\n\nPreparacion: ${apt.preparation_notes}`
        : `\n\nPreparacao: ${apt.preparation_notes}`
    : "";

  const msg =
    language === "en"
      ? `*${apt.title}*\nTime: ${apt.scheduled_time}\nLocation: ${apt.location ?? "To be confirmed"}${prep}`
      : language === "es"
        ? `*${apt.title}*\nHora: ${apt.scheduled_time}\nLugar: ${apt.location ?? "Por confirmar"}${prep}`
        : `*${apt.title}*\nHorario: ${apt.scheduled_time}\nLocal: ${apt.location ?? "A confirmar"}${prep}`;

  await sendText(phone, msg);
  return msg;
}
