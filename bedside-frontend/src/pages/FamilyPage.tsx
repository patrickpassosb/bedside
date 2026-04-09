import { useEffect, useState } from "react";
import { CalendarClock, Pill, ShieldAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useData } from "@/lib/data";
import { formatDate, firstName } from "@/lib/utils";
import type { FamilyPayload } from "@/types";

export function FamilyPage() {
  const { token = "" } = useParams();
  const { getFamilyPayload, status } = useData();
  const [payload, setPayload] = useState<FamilyPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const previous = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = "light";
    return () => {
      document.documentElement.dataset.theme = previous ?? "light";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "ready") {
        return;
      }
      setLoading(true);
      const next = await getFamilyPayload(token);
      if (!cancelled) {
        setPayload(next);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [getFamilyPayload, status, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-4 py-10">
        <div className="mx-auto max-w-[28rem] space-y-4">
          <div className="h-10 w-32 rounded-full bg-slate-200" />
          <div className="h-48 rounded-[2rem] bg-slate-200" />
          <div className="h-64 rounded-[2rem] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
        <Card className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-danger/10 text-danger">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-[-0.05em] text-slate-900">
            This link is no longer active.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Please ask the patient to reactivate family sharing from the Bedside dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-[28rem] space-y-5">
        <header className="rounded-[2rem] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-center text-4xl font-semibold tracking-[-0.06em] text-sky-600">Bedside</p>
          <p className="mt-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Patient Care Information
          </p>
          <div className="mt-8 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">You&apos;re following</p>
            <h1 className="mt-2 text-5xl font-semibold tracking-[-0.06em]">{firstName(payload.patient.name)}</h1>
            <p className="mt-3 text-sm text-slate-500">
              {payload.patient.ward} · {payload.hospital.name}
            </p>
          </div>
        </header>

        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0ea5e9,#0369a1)] px-6 py-6 text-white shadow-[0_24px_60px_rgba(14,165,233,0.25)]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/70">Status</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Stable today</p>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Positive recovery across the last 24 hours. Bedside keeps family updates aligned with the patient&apos;s consent.
          </p>
        </div>

        <section className="rounded-[2rem] bg-white px-5 py-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Today&apos;s schedule</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Upcoming care</h2>
            </div>
            <CalendarClock className="h-5 w-5 text-sky-600" />
          </div>
          <div className="space-y-3">
            {payload.appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-start gap-3 rounded-[1.4rem] bg-slate-50 px-4 py-4">
                <div className="rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  {appointment.scheduled_time}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{appointment.title}</p>
                  <p className="text-sm text-slate-500">{appointment.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white px-5 py-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Medications</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Current plan</h2>
            </div>
            <Pill className="h-5 w-5 text-sky-600" />
          </div>
          <div className="space-y-3">
            {payload.medications.map((medication) => (
              <div key={medication.id} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {medication.medication_name} · {medication.dosage}
                    </p>
                    <p className="text-sm text-slate-500">{medication.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pb-10 text-center text-xs uppercase tracking-[0.28em] text-slate-400">
          Last updated {formatDate(payload.updatedAt, payload.hospital.timezone)} · Powered by Bedside
        </footer>
      </div>
    </div>
  );
}
