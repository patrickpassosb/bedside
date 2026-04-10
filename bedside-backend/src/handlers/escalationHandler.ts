import { supabase } from "../supabase.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { sendText } from "../whatsapp/sender.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";

export async function handleEscalation(
  ctx: PatientWithHospital,
  messageText: string,
  language: string
): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);

  // Insert escalation record FIRST — if this fails, we must NOT give false reassurance
  const { error } = await supabase.from("escalations").insert({
    hospital_id: ctx.patient.hospital_id,
    patient_id: ctx.patient.id,
    reason: messageText,
    status: "pending",
  });

  if (error) {
    // Clinical safety: do not claim the team is notified when it isn't
    console.error("Failed to create escalation:", error.message);

    const failMsg =
      language === "es"
        ? `${ctx.patient.name}, no puedo alcanzar el sistema en este momento. Por favor, presione su boton de llamada de enfermeria o llame en voz alta. Su seguridad es lo primero.`
        : language === "en"
          ? `${ctx.patient.name}, I cannot reach the system right now. Please press your nurse call button or call out loudly. Your safety is the priority.`
          : `${ctx.patient.name}, nao consigo acessar o sistema neste momento. Por favor, pressione o botao de chamada de enfermagem ou chame em voz alta. Sua seguranca e a prioridade.`;

    await sendText(phone, failMsg);
    return failMsg;
  }

  const msg =
    language === "es"
      ? `${ctx.patient.name}, entiendo su preocupacion y ya estoy alertando a su equipo de cuidados.\n\nMientras tanto:\n- Trate de mantenerse calmado y respire profundamente\n- Permanezca en su cama por seguridad\n- Si tiene un boton de llamada, puede presionarlo tambien\n\nSu equipo sera notificado inmediatamente. No esta solo.`
      : language === "en"
        ? `${ctx.patient.name}, I understand your concern and I'm alerting your care team right away.\n\nIn the meantime:\n- Try to stay calm and breathe deeply\n- Stay in your bed for safety\n- If you have a call button, you can press it too\n\nYour team will be notified immediately. You are not alone.`
        : `${ctx.patient.name}, entendo sua preocupacao e ja estou alertando sua equipe de cuidados.\n\nEnquanto isso:\n- Tente manter a calma e respire profundamente\n- Permaneca no leito por seguranca\n- Se voce tiver um botao de chamada, pode pressiona-lo tambem\n\nSua equipe sera notificada imediatamente. Voce nao esta sozinho(a).`;

  await sendText(phone, msg);
  return msg;
}
