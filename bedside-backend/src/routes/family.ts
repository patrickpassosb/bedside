import type { FastifyInstance } from "fastify";
import { supabase } from "../supabase.js";

export async function familyRoutes(server: FastifyInstance) {
  server.get("/family/:token", async (request, reply) => {
    const { token } = request.params as { token: string };

    // Look up consent by token
    const { data: consent, error } = await supabase
      .from("consent_flags")
      .select("*")
      .eq("family_share_token", token)
      .single();

    if (error || !consent || !consent.family_sharing_enabled) {
      return reply.status(404).send({ error: "Not found or sharing is disabled" });
    }

    // Fetch patient (first name only)
    const { data: patient } = await supabase
      .from("patients")
      .select("name, ward, condition")
      .eq("id", consent.patient_id)
      .single();

    if (!patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const firstName = patient.name.split(" ")[0];
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's appointments and active medications
    const [appointmentsRes, medicationsRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("title, scheduled_time, location")
        .eq("patient_id", consent.patient_id)
        .eq("hospital_id", consent.hospital_id)
        .eq("appointment_date", today)
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("medication_requests")
        .select("medication_name, dosage, reason")
        .eq("patient_id", consent.patient_id)
        .eq("hospital_id", consent.hospital_id)
        .eq("active", true),
    ]);

    return {
      patient_name: firstName,
      ward: patient.ward,
      condition: patient.condition,
      appointments: appointmentsRes.data ?? [],
      medications: medicationsRes.data ?? [],
      last_updated: new Date().toISOString(),
    };
  });
}
