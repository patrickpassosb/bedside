import type { FastifyInstance } from "fastify";
import { supabase } from "../supabase.js";
import { sendText } from "../whatsapp/sender.js";
import { sendButtons } from "../whatsapp/sender.js";
import { buildWelcomeButtonPayload } from "../whatsapp/messageBuilder.js";
import { normalizePhone } from "../utils/phoneNormalizer.js";

export async function adminRoutes(server: FastifyInstance) {
  // POST /admin/patients — Create patient + consent_flags + send welcome
  server.post("/admin/patients", async (request, reply) => {
    const body = request.body as {
      name: string;
      age: number;
      condition: string;
      phone_number: string;
      ward: string;
      bed_number: string;
      admission_date: string;
      attending_physician: string;
      hospital_id: string;
    };

    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        name: body.name,
        age: body.age,
        condition: body.condition,
        phone_number: body.phone_number,
        ward: body.ward,
        bed_number: body.bed_number,
        admission_date: body.admission_date,
        attending_physician: body.attending_physician,
        hospital_id: body.hospital_id,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    // Create consent_flags
    await supabase.from("consent_flags").insert({
      hospital_id: body.hospital_id,
      patient_id: patient!.id,
      family_sharing_enabled: false,
    });

    // Fetch hospital for welcome message
    const { data: hospital } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", body.hospital_id)
      .single();

    // Send welcome WhatsApp message
    if (hospital) {
      const phone = normalizePhone(body.phone_number);
      const welcome = buildWelcomeButtonPayload(body.name, hospital.name, hospital.language);
      await sendButtons(phone, welcome.title, welcome.description, welcome.footer, welcome.buttons);
    }

    return reply.status(201).send(patient);
  });

  // GET /admin/patients?hospital_id=
  server.get("/admin/patients", async (request, reply) => {
    const { hospital_id } = request.query as { hospital_id: string };

    if (!hospital_id) {
      return reply.status(400).send({ error: "hospital_id is required" });
    }

    const { data: patients, error } = await supabase
      .from("patients")
      .select("*")
      .eq("hospital_id", hospital_id)
      .eq("status", "active");

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    // Enrich with last audit timestamp and pending escalation count
    const enriched = await Promise.all(
      (patients ?? []).map(async (patient) => {
        const { data: lastAudit } = await supabase
          .from("audit_logs")
          .select("timestamp")
          .eq("patient_id", patient.id)
          .eq("hospital_id", hospital_id)
          .order("timestamp", { ascending: false })
          .limit(1);

        const { count: escalationCount } = await supabase
          .from("escalations")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id)
          .eq("hospital_id", hospital_id)
          .eq("status", "pending");

        return {
          ...patient,
          last_activity: lastAudit?.[0]?.timestamp ?? null,
          pending_escalations: escalationCount ?? 0,
        };
      })
    );

    return enriched;
  });

  // GET /admin/patients/:id
  server.get("/admin/patients/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data: patient, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const [appointmentsRes, medicationsRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", id)
        .eq("hospital_id", patient.hospital_id)
        .eq("appointment_date", today)
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("medication_requests")
        .select("*")
        .eq("patient_id", id)
        .eq("hospital_id", patient.hospital_id)
        .eq("active", true),
    ]);

    return {
      ...patient,
      appointments: appointmentsRes.data ?? [],
      medications: medicationsRes.data ?? [],
    };
  });

  // POST /admin/patients/:id/appointments
  server.post("/admin/patients/:id/appointments", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      title: string;
      scheduled_time: string;
      location?: string;
      preparation_notes?: string;
      appointment_date?: string;
    };

    const { data: patient } = await supabase.from("patients").select("hospital_id").eq("id", id).single();
    if (!patient) return reply.status(404).send({ error: "Patient not found" });

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        hospital_id: patient.hospital_id,
        patient_id: id,
        title: body.title,
        scheduled_time: body.scheduled_time,
        location: body.location,
        preparation_notes: body.preparation_notes,
        appointment_date: body.appointment_date ?? new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // POST /admin/patients/:id/medications
  server.post("/admin/patients/:id/medications", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      medication_name: string;
      dosage: string;
      frequency: string;
      route: string;
      reason: string;
      next_due_time?: string;
    };

    const { data: patient } = await supabase.from("patients").select("hospital_id").eq("id", id).single();
    if (!patient) return reply.status(404).send({ error: "Patient not found" });

    const { data, error } = await supabase
      .from("medication_requests")
      .insert({
        hospital_id: patient.hospital_id,
        patient_id: id,
        medication_name: body.medication_name,
        dosage: body.dosage,
        frequency: body.frequency,
        route: body.route,
        reason: body.reason,
        next_due_time: body.next_due_time,
        active: true,
      })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // POST /admin/patients/:id/message
  server.post("/admin/patients/:id/message", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { message_text: string; sent_by: string };

    const { data: patient } = await supabase.from("patients").select("hospital_id, phone_number").eq("id", id).single();
    if (!patient) return reply.status(404).send({ error: "Patient not found" });

    const { data, error } = await supabase
      .from("nurse_messages")
      .insert({
        hospital_id: patient.hospital_id,
        patient_id: id,
        message_text: body.message_text,
        sent_by: body.sent_by,
      })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });

    // Send via WhatsApp
    const phone = normalizePhone(patient.phone_number);
    await sendText(phone, body.message_text);

    return reply.status(201).send(data);
  });

  // PATCH /admin/escalations/:id/resolve
  server.patch("/admin/escalations/:id/resolve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { resolved_by: string };

    const { data, error } = await supabase
      .from("escalations")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: body.resolved_by,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return data;
  });
}
