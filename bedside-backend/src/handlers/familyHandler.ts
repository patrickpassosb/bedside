import { supabase } from "../supabase.js";
import { config } from "../config.js";
import type { PatientWithHospital } from "../utils/patientLookup.js";
import { sendText } from "../whatsapp/sender.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";

export async function handleFamilyOn(ctx: PatientWithHospital, language: string): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);

  const { data: consent } = await supabase
    .from("consent_flags")
    .select("*")
    .eq("patient_id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id)
    .single();

  if (!consent) {
    // Create consent record if missing
    const { data: newConsent } = await supabase
      .from("consent_flags")
      .insert({
        hospital_id: ctx.patient.hospital_id,
        patient_id: ctx.patient.id,
        family_sharing_enabled: true,
        consented_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!newConsent) {
      const msg = language === "en"
        ? "Sorry, I couldn't enable family sharing right now. Please try again."
        : language === "es"
          ? "Lo siento, no pude activar el compartir familiar ahora. Intente de nuevo."
          : "Desculpe, nao consegui ativar o compartilhamento familiar agora. Tente novamente.";
      await sendText(phone, msg);
      return msg;
    }

    return await sendFamilyLink(phone, newConsent.family_share_token, ctx.patient.name, language);
  }

  if (consent.family_sharing_enabled) {
    // Already enabled — resend link
    const msg =
      language === "en"
        ? `Family sharing is already active! Here's the link again:`
        : language === "es"
          ? `El compartir familiar ya esta activo. Aqui esta el enlace nuevamente:`
          : `O compartilhamento familiar ja esta ativo! Aqui esta o link novamente:`;
    await sendText(phone, msg);
    return await sendFamilyLink(phone, consent.family_share_token, ctx.patient.name, language);
  }

  // Enable sharing
  await supabase
    .from("consent_flags")
    .update({
      family_sharing_enabled: true,
      consented_at: new Date().toISOString(),
      revoked_at: null,
    })
    .eq("id", consent.id);

  return await sendFamilyLink(phone, consent.family_share_token, ctx.patient.name, language);
}

async function sendFamilyLink(phone: string, token: string, name: string, language: string): Promise<string> {
  const url = `${config.baseUrl}/family/${token}`;

  const msg =
    language === "en"
      ? `${name}, family sharing is now active!\n\nShare this link with your family so they can see your schedule and medications:\n${url}\n\nTo disable, just say "family off".`
      : language === "es"
        ? `${name}, el compartir familiar esta activado!\n\nComparta este enlace con su familia para que puedan ver su agenda y medicamentos:\n${url}\n\nPara desactivar, solo diga "familia off".`
        : `${name}, o compartilhamento familiar esta ativado!\n\nCompartilhe este link com sua familia para que possam ver sua agenda e medicamentos:\n${url}\n\nPara desativar, basta dizer "familia off".`;

  await sendText(phone, msg);
  return msg;
}

export async function handleFamilyOff(ctx: PatientWithHospital, language: string): Promise<string> {
  const phone = normalizePhone(ctx.patient.phone_number);

  // Check if consent record exists and was enabled
  const { data: consent } = await supabase
    .from("consent_flags")
    .select("*")
    .eq("patient_id", ctx.patient.id)
    .eq("hospital_id", ctx.patient.hospital_id)
    .single();

  if (!consent || !consent.family_sharing_enabled) {
    const msg =
      language === "en"
        ? `${ctx.patient.name}, family sharing is not currently active. Say "family on" if you want to enable it.`
        : language === "es"
          ? `${ctx.patient.name}, el compartir familiar no esta activo actualmente. Diga "familia on" si quiere activarlo.`
          : `${ctx.patient.name}, o compartilhamento familiar nao esta ativo no momento. Diga "familia on" se quiser ativar.`;
    await sendText(phone, msg);
    return msg;
  }

  await supabase
    .from("consent_flags")
    .update({
      family_sharing_enabled: false,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", consent.id)
    .eq("hospital_id", ctx.patient.hospital_id);

  const msg =
    language === "en"
      ? `${ctx.patient.name}, family sharing has been disabled. Your family will no longer have access. You can reactivate it anytime by saying "family on".`
      : language === "es"
        ? `${ctx.patient.name}, el compartir familiar ha sido desactivado. Su familia ya no tendra acceso. Puede reactivarlo en cualquier momento diciendo "familia on".`
        : `${ctx.patient.name}, o compartilhamento familiar foi desativado. Sua familia nao tera mais acesso. Voce pode reativar a qualquer momento dizendo "familia on".`;

  await sendText(phone, msg);
  return msg;
}
