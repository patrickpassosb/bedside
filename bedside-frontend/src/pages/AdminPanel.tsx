import { useEffect, useMemo, useState } from "react";
import { CalendarPlus2, Pill, UserRoundPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToastController } from "@/components/ui/Toast";
import { useData } from "@/lib/data";

type AdminTab = "patient" | "appointment" | "medication";

const wards = ["Post-Op ICU", "Surgical Ward A", "Surgical Ward B", "Medical Ward A", "Medical Ward B"];
const routes = ["Oral", "IV", "Subcutaneous", "Intramuscular", "Inhaled"];

export function AdminPanelPage() {
  const navigate = useNavigate();
  const { patients, createPatient, createAppointment, createMedication } = useData();
  const { pushToast } = useToastController();
  const [tab, setTab] = useState<AdminTab>("patient");
  const [loading, setLoading] = useState<AdminTab | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [patientForm, setPatientForm] = useState({
    name: "",
    phone_number: "",
    age: 45,
    condition: "",
    ward: wards[0] ?? "",
    bed_number: "",
    admission_date: today,
    attending_physician: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: patients[0]?.id ?? "",
    title: "",
    scheduled_time: "14:00",
    location: "",
    preparation_notes: "",
    appointment_date: today,
  });

  const [medicationForm, setMedicationForm] = useState({
    patient_id: patients[0]?.id ?? "",
    medication_name: "",
    dosage: "",
    route: routes[0] ?? "",
    frequency: "",
    reason: "",
    next_due_time: `${today}T16:00`,
  });

  useEffect(() => {
    if (!patients.length) {
      return;
    }

    setAppointmentForm((current) =>
      current.patient_id ? current : { ...current, patient_id: patients[0]?.id ?? "" },
    );
    setMedicationForm((current) =>
      current.patient_id ? current : { ...current, patient_id: patients[0]?.id ?? "" },
    );
  }, [patients]);

  async function submitPatient() {
    setLoading("patient");
    try {
      const patient = await createPatient(patientForm);
      pushToast({
        title: "Patient registered",
        description: `${patient.name} is ready in the dashboard.`,
        tone: "success",
      });
      navigate(`/patients/${patient.id}`);
    } finally {
      setLoading(null);
    }
  }

  async function submitAppointment() {
    setLoading("appointment");
    try {
      await createAppointment(appointmentForm);
      pushToast({
        title: "Appointment added",
        description: "The schedule was updated successfully.",
        tone: "success",
      });
    } finally {
      setLoading(null);
    }
  }

  async function submitMedication() {
    setLoading("medication");
    try {
      await createMedication(medicationForm);
      pushToast({
        title: "Medication added",
        description: "The medication plan is now visible on the patient detail screen.",
        tone: "success",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker">Administrative portal</p>
          <h1 className="section-title">Enrollment, schedules, and medication orders.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Backend write routes are used when live services are available, and the seeded mock store keeps the demo moving otherwise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setTab("patient")} size="sm" variant={tab === "patient" ? "primary" : "ghost"}>
            New Patient
          </Button>
          <Button onClick={() => setTab("appointment")} size="sm" variant={tab === "appointment" ? "secondary" : "ghost"}>
            Add Appointment
          </Button>
          <Button onClick={() => setTab("medication")} size="sm" variant={tab === "medication" ? "secondary" : "ghost"}>
            Add Medication
          </Button>
        </div>
      </section>

      <Card className="space-y-8">
        {tab === "patient" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="rounded-[1.1rem] bg-primary-soft p-3 text-primary">
                <UserRoundPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.05em] text-ink">Register Patient &amp; Send Welcome Message</h2>
                <p className="text-sm text-muted">A welcome message is sent automatically to the patient&apos;s WhatsApp number.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" value={patientForm.name} />
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, phone_number: event.target.value }))} placeholder="+55 11 99999-9999" value={patientForm.phone_number} />
              <input className="field-shell" min={0} onChange={(event) => setPatientForm((current) => ({ ...current, age: Number(event.target.value) }))} placeholder="Age" type="number" value={patientForm.age} />
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, condition: event.target.value }))} placeholder="Medical condition" value={patientForm.condition} />
              <select className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, ward: event.target.value }))} value={patientForm.ward}>
                {wards.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, bed_number: event.target.value }))} placeholder="Bed number" value={patientForm.bed_number} />
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, admission_date: event.target.value }))} type="date" value={patientForm.admission_date} />
              <input className="field-shell" onChange={(event) => setPatientForm((current) => ({ ...current, attending_physician: event.target.value }))} placeholder="Attending physician" value={patientForm.attending_physician} />
            </div>
            <Button isLoading={loading === "patient"} onClick={submitPatient}>
              Register patient
            </Button>
          </>
        ) : null}

        {tab === "appointment" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="rounded-[1.1rem] bg-primary-soft p-3 text-primary">
                <CalendarPlus2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.05em] text-ink">Add Appointment</h2>
                <p className="text-sm text-muted">Schedule procedures and bedside actions for active patients.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <select className="field-shell" onChange={(event) => setAppointmentForm((current) => ({ ...current, patient_id: event.target.value }))} value={appointmentForm.patient_id}>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} · {patient.ward}
                  </option>
                ))}
              </select>
              <input className="field-shell" onChange={(event) => setAppointmentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Procedure title" value={appointmentForm.title} />
              <input className="field-shell" onChange={(event) => setAppointmentForm((current) => ({ ...current, scheduled_time: event.target.value }))} type="time" value={appointmentForm.scheduled_time} />
              <input className="field-shell" onChange={(event) => setAppointmentForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" value={appointmentForm.location} />
              <textarea className="field-shell min-h-28 md:col-span-2" onChange={(event) => setAppointmentForm((current) => ({ ...current, preparation_notes: event.target.value }))} placeholder="Preparation notes" value={appointmentForm.preparation_notes} />
              <input className="field-shell" onChange={(event) => setAppointmentForm((current) => ({ ...current, appointment_date: event.target.value }))} type="date" value={appointmentForm.appointment_date} />
            </div>
            <Button isLoading={loading === "appointment"} onClick={submitAppointment} variant="secondary">
              Add to schedule
            </Button>
          </>
        ) : null}

        {tab === "medication" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="rounded-[1.1rem] bg-primary-soft p-3 text-primary">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.05em] text-ink">Add Medication</h2>
                <p className="text-sm text-muted">Keep the patient-facing medication explanation clear and plain-language.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <select className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, patient_id: event.target.value }))} value={medicationForm.patient_id}>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} · {patient.ward}
                  </option>
                ))}
              </select>
              <input className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, medication_name: event.target.value }))} placeholder="Medication name" value={medicationForm.medication_name} />
              <input className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, dosage: event.target.value }))} placeholder="Dosage" value={medicationForm.dosage} />
              <select className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, route: event.target.value }))} value={medicationForm.route}>
                {routes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
              <input className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, frequency: event.target.value }))} placeholder="Frequency" value={medicationForm.frequency} />
              <input className="field-shell" onChange={(event) => setMedicationForm((current) => ({ ...current, next_due_time: event.target.value }))} type="datetime-local" value={medicationForm.next_due_time} />
              <textarea className="field-shell min-h-28 md:col-span-2" onChange={(event) => setMedicationForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Purpose / why taking" value={medicationForm.reason} />
            </div>
            <Button isLoading={loading === "medication"} onClick={submitMedication} variant="secondary">
              Add medication
            </Button>
          </>
        ) : null}
      </Card>
    </div>
  );
}
