import { supabase } from "../supabase.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { sendText } from "../whatsapp/sender.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";

export async function handleNextAction(ctx: PatientWithHospital, language: string): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Fetch next incomplete appointment today
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("patient_id", ctx.patient.id)
    .eq("appointment_date", today)
    .eq("completed", false)
    .order("scheduled_time", { ascending: true });

  // Fetch next medication due
  const { data: medications } = await supabase
    .from("medication_requests")
    .select("*")
    .eq("hospital_id", ctx.patient.hospital_id)
    .eq("patient_id", ctx.patient.id)
    .eq("active", true)
    .order("next_due_time", { ascending: true });

  const nextApt = appointments?.[0];
  const nextMed = medications?.find((m) => m.next_due_time && new Date(m.next_due_time) > now);

  let msg: string;

  if (!nextApt && !nextMed) {
    msg =
      language === "es"
        ? `${ctx.patient.name}, no tienes acciones pendientes por ahora. Descansa y si necesitas algo, estoy aqui.`
        : language === "en"
          ? `${ctx.patient.name}, you have no pending actions right now. Rest and if you need anything, I'm here.`
          : `${ctx.patient.name}, voce nao tem acoes pendentes no momento. Descanse e se precisar de algo, estou aqui.`;
  } else if (nextApt && !nextMed) {
    msg = formatAppointmentAction(ctx.patient.name, nextApt, language);
  } else if (!nextApt && nextMed) {
    msg = formatMedicationAction(ctx.patient.name, nextMed, language);
  } else {
    // Compare which comes first
    const aptTime = parseTimeToday(nextApt!.scheduled_time);
    const medTime = new Date(nextMed!.next_due_time);

    if (aptTime <= medTime) {
      msg = formatAppointmentAction(ctx.patient.name, nextApt!, language);
    } else {
      msg = formatMedicationAction(ctx.patient.name, nextMed!, language);
    }
  }

  await sendText(phone, msg);
  return msg;
}

function parseTimeToday(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatAppointmentAction(name: string, apt: { title: string; scheduled_time: string; location: string | null }, language: string): string {
  return language === "es"
    ? `${name}, tu proxima accion es: *${apt.title}* a las ${apt.scheduled_time}${apt.location ? ` en ${apt.location}` : ""}. ¿Necesitas algo mas?`
    : language === "en"
      ? `${name}, your next action is: *${apt.title}* at ${apt.scheduled_time}${apt.location ? ` at ${apt.location}` : ""}. Need anything else?`
      : `${name}, sua proxima acao e: *${apt.title}* as ${apt.scheduled_time}${apt.location ? ` no ${apt.location}` : ""}. Precisa de mais alguma coisa?`;
}

function formatMedicationAction(name: string, med: { medication_name: string; dosage: string; next_due_time: string }, language: string): string {
  const time = new Date(med.next_due_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return language === "es"
    ? `${name}, tu proxima accion es tomar *${med.medication_name} ${med.dosage}* a las ${time}. ¿Necesitas algo mas?`
    : language === "en"
      ? `${name}, your next action is to take *${med.medication_name} ${med.dosage}* at ${time}. Need anything else?`
      : `${name}, sua proxima acao e tomar *${med.medication_name} ${med.dosage}* as ${time}. Precisa de mais alguma coisa?`;
}
