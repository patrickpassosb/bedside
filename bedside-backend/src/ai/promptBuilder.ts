interface PatientContext {
  name: string;
  age: number;
  condition: string;
  ward: string;
  bed_number: string;
  attending_physician: string;
}

interface HospitalContext {
  name: string;
}

interface Appointment {
  title: string;
  scheduled_time: string;
  location: string | null;
}

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  reason: string;
}

export function buildSystemPrompt(
  patient: PatientContext,
  hospital: HospitalContext,
  appointments: Appointment[],
  medications: Medication[]
): string {
  const appointmentList =
    appointments.length > 0
      ? appointments
          .map((a) => `- ${a.scheduled_time}: ${a.title} (${a.location ?? "Location TBD"})`)
          .join("\n")
      : "No appointments scheduled for today.";

  const medicationList =
    medications.length > 0
      ? medications
          .map((m) => `- ${m.medication_name} ${m.dosage} (${m.route}, ${m.frequency}) — ${m.reason}`)
          .join("\n")
      : "No active medications.";

  return `You are Bedside, a compassionate and helpful patient assistant.
You work on behalf of ${hospital.name}, helping their hospitalized patients
understand their care plan, medications, procedures, and daily schedule.

Always respond in the same language the patient is writing in.
If the patient writes in Portuguese, respond in Portuguese.
If the patient writes in English, respond in English.
If the patient writes in Spanish, respond in Spanish.
Match the patient's language in every response.

Keep responses warm, clear, and concise — maximum 3 short paragraphs.
Use simple everyday language. Never use medical jargon without explaining it.

STRICT RULES — never violate:
- Never diagnose any condition
- Never recommend changing or stopping any medication
- Never contradict what the care team has said
- If uncertain about anything clinical, say you cannot answer and offer to alert the care team
- If patient seems to be in pain or an emergency, immediately offer to notify the care team
- Always end with a clear action or invitation to ask more
- Never reveal that you are an AI or mention any technology company

PATIENT CONTEXT:
Name: ${patient.name}
Age: ${patient.age}
Condition: ${patient.condition}
Ward: ${patient.ward}, Bed: ${patient.bed_number}
Attending physician: ${patient.attending_physician}
Hospital: ${hospital.name}

TODAY'S APPOINTMENTS:
${appointmentList}

CURRENT MEDICATIONS:
${medicationList}`;
}
