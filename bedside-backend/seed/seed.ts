import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Copy .env.example to .env and fill in your Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding Bedside database...\n");

  // 1. Insert hospital
  const { data: hospital, error: hospitalError } = await supabase
    .from("hospitals")
    .upsert(
      {
        name: "Hospital Isaac Newton",
        country: "Brazil",
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        active: true,
      },
      { onConflict: "name" }
    )
    .select()
    .single();

  if (hospitalError) {
    // Upsert on name may fail if there is no unique constraint — fall back to lookup
    const { data: existing } = await supabase
      .from("hospitals")
      .select("*")
      .eq("name", "Hospital Isaac Newton")
      .maybeSingle();

    if (!existing) {
      console.error("Failed to create hospital:", hospitalError.message);
      process.exit(1);
    }

    console.log("Hospital Isaac Newton already exists, using existing record.");
    await seedPatients(existing);
    return;
  }

  await seedPatients(hospital!);
}

interface Hospital {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  name: string;
  hospital_id: string;
}

async function seedPatients(hospital: Hospital) {
  console.log(`Hospital: ${hospital.name} (${hospital.id})\n`);

  const patients = [
    {
      name: "Roberto Alves",
      age: 62,
      condition: "Post-op cardiac bypass",
      phone_number: "+5511991110001",
      ward: "UTI Pos-Operatoria",
      bed_number: "03A",
      admission_date: new Date().toISOString().split("T")[0],
      attending_physician: "Dra. Ana Ferreira",
      status: "active",
      preferred_language: "pt-BR",
      hospital_id: hospital.id,
    },
    {
      name: "Maria Conceicao Santos",
      age: 58,
      condition: "Post-op hip replacement",
      phone_number: "+5511991110002",
      ward: "Ala Cirurgica B",
      bed_number: "12B",
      admission_date: new Date().toISOString().split("T")[0],
      attending_physician: "Dr. Carlos Mendes",
      status: "active",
      preferred_language: "pt-BR",
      hospital_id: hospital.id,
    },
    {
      name: "Fabio Lima",
      age: 45,
      condition: "Bacterial pneumonia with oxygen therapy",
      phone_number: "+5511991110003",
      ward: "Clinica Medica Ala A",
      bed_number: "07C",
      admission_date: new Date().toISOString().split("T")[0],
      attending_physician: "Dr. Paulo Rodrigues",
      status: "active",
      preferred_language: "pt-BR",
      hospital_id: hospital.id,
    },
  ];

  // Delete existing seed data for idempotency
  for (const p of patients) {
    await supabase.from("patients").delete().eq("phone_number", p.phone_number);
  }

  const { data: insertedPatients, error: patientsError } = await supabase
    .from("patients")
    .insert(patients)
    .select();

  if (patientsError) {
    console.error("Failed to create patients:", patientsError.message);
    process.exit(1);
  }

  console.log(`Inserted ${insertedPatients!.length} patients\n`);

  for (const patient of insertedPatients!) {
    await seedPatientData(patient as Patient, hospital);
  }

  console.log("\nSeed complete!");
}

async function seedPatientData(patient: Patient, hospital: Hospital) {
  console.log(`  Seeding data for ${patient.name}...`);
  const today = new Date().toISOString().split("T")[0];
  const hid = hospital.id;
  const pid = patient.id;

  // Helper: produce a timestamp N hours from now, so medications have
  // realistic forward-looking due times that exercise the next-action handler.
  const hoursFromNow = (hours: number) =>
    new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  // Clean existing data for this patient
  await supabase.from("appointments").delete().eq("patient_id", pid);
  await supabase.from("medication_requests").delete().eq("patient_id", pid);
  await supabase.from("consent_flags").delete().eq("patient_id", pid);

  if (patient.name === "Roberto Alves") {
    await supabase.from("appointments").insert([
      { hospital_id: hid, patient_id: pid, title: "Coleta de Sangue", scheduled_time: "06:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Visita medica", scheduled_time: "08:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Ecocardiograma no leito", scheduled_time: "09:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Fisioterapia respiratoria", scheduled_time: "11:00", location: "Sala de Fisioterapia", appointment_date: today },
    ]);

    await supabase.from("medication_requests").insert([
      { hospital_id: hid, patient_id: pid, medication_name: "Captopril", dosage: "25mg", frequency: "A cada 12 horas", route: "Oral", reason: "Controle da pressao arterial", active: true, next_due_time: hoursFromNow(2) },
      { hospital_id: hid, patient_id: pid, medication_name: "Aspirina", dosage: "100mg", frequency: "1x ao dia", route: "Oral", reason: "Prevencao de coagulos", active: true, next_due_time: hoursFromNow(14) },
      { hospital_id: hid, patient_id: pid, medication_name: "Furosemida", dosage: "40mg", frequency: "1x ao dia", route: "Oral", reason: "Remocao de excesso de liquido", active: true, next_due_time: hoursFromNow(5) },
      { hospital_id: hid, patient_id: pid, medication_name: "Morfina", dosage: "2mg", frequency: "Se dor", route: "IV", reason: "Controle da dor", active: true, next_due_time: null },
      { hospital_id: hid, patient_id: pid, medication_name: "Enoxaparina", dosage: "40mg", frequency: "1x ao dia", route: "Subcutanea", reason: "Prevencao de trombose", active: true, next_due_time: hoursFromNow(18) },
    ]);
  }

  if (patient.name === "Maria Conceicao Santos") {
    await supabase.from("appointments").insert([
      { hospital_id: hid, patient_id: pid, title: "Fisioterapia", scheduled_time: "10:00", location: "Sala de Fisioterapia", preparation_notes: "Serao necessarias as muletas", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Raio-X", scheduled_time: "13:00", location: "Radiologia", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Curativo", scheduled_time: "15:00", location: "Leito", appointment_date: today },
    ]);

    await supabase.from("medication_requests").insert([
      { hospital_id: hid, patient_id: pid, medication_name: "Tramadol", dosage: "50mg", frequency: "A cada 6 horas se dor", route: "Oral", reason: "Controle da dor", active: true, next_due_time: hoursFromNow(3) },
      { hospital_id: hid, patient_id: pid, medication_name: "Omeprazol", dosage: "20mg", frequency: "1x ao dia em jejum", route: "Oral", reason: "Protecao do estomago", active: true, next_due_time: hoursFromNow(20) },
      { hospital_id: hid, patient_id: pid, medication_name: "Enoxaparina", dosage: "40mg", frequency: "1x ao dia", route: "Subcutanea", reason: "Prevencao de trombose", active: true, next_due_time: hoursFromNow(16) },
      { hospital_id: hid, patient_id: pid, medication_name: "Dipirona", dosage: "1g", frequency: "A cada 6 horas se febre", route: "Oral", reason: "Controle de febre", active: true, next_due_time: hoursFromNow(4) },
      { hospital_id: hid, patient_id: pid, medication_name: "Cefazolina", dosage: "1g", frequency: "A cada 8 horas", route: "IV", reason: "Antibiotico", active: true, next_due_time: hoursFromNow(1) },
    ]);
  }

  if (patient.name === "Fabio Lima") {
    await supabase.from("appointments").insert([
      { hospital_id: hid, patient_id: pid, title: "Coleta de sangue e escarro", scheduled_time: "06:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Nebulizacao", scheduled_time: "08:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Visita da equipe medica", scheduled_time: "10:00", location: "Leito", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Fisioterapia respiratoria", scheduled_time: "11:30", location: "Sala de Fisioterapia", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "TC torax", scheduled_time: "13:00", location: "Tomografia", preparation_notes: "Mantenha oxigenio", appointment_date: today },
      { hospital_id: hid, patient_id: pid, title: "Nebulizacao", scheduled_time: "20:00", location: "Leito", appointment_date: today },
    ]);

    await supabase.from("medication_requests").insert([
      { hospital_id: hid, patient_id: pid, medication_name: "Ceftriaxona", dosage: "2g", frequency: "1x ao dia", route: "IV", reason: "Antibiotico principal", active: true, next_due_time: hoursFromNow(6) },
      { hospital_id: hid, patient_id: pid, medication_name: "Azitromicina", dosage: "500mg", frequency: "1x ao dia", route: "Oral", reason: "Antibiotico complementar", active: true, next_due_time: hoursFromNow(12) },
      { hospital_id: hid, patient_id: pid, medication_name: "Dexametasona", dosage: "6mg", frequency: "A cada 12 horas", route: "IV", reason: "Reducao da inflamacao", active: true, next_due_time: hoursFromNow(2) },
      { hospital_id: hid, patient_id: pid, medication_name: "Heparina", dosage: "5000UI", frequency: "A cada 12 horas", route: "Subcutanea", reason: "Prevencao de coagulos por repouso", active: true, next_due_time: hoursFromNow(4) },
      { hospital_id: hid, patient_id: pid, medication_name: "Salbutamol", dosage: "nebulizacao", frequency: "A cada 6 horas", route: "Inalatoria", reason: "Abertura das vias aereas", active: true, next_due_time: hoursFromNow(1) },
    ]);
  }

  // Create consent_flags for each patient
  await supabase.from("consent_flags").insert({
    hospital_id: hid,
    patient_id: pid,
    family_sharing_enabled: false,
  });

  console.log(`    Done: appointments, medications, consent_flags`);
}

seed();
