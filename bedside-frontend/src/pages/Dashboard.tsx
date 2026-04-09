import { AlertTriangle, Bot, MessageSquareText, Stethoscope, UserPlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { MetricCard } from "@/components/features/MetricCard";
import { PatientCard } from "@/components/features/PatientCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useData } from "@/lib/data";
import { usePatients } from "@/hooks/usePatients";

function sameDay(left: string, right: Date) {
  const date = new Date(left);
  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { patients, latestAuditMap, pendingEscalations, status } = usePatients();
  const { auditLogs, escalations } = useData();

  const activePatients = patients.filter((patient) => patient.status === "active").length;
  const pendingCount = escalations.filter((entry) => entry.status === "pending").length;
  const today = new Date();
  const messagesToday = auditLogs.filter((entry) => sameDay(entry.timestamp, today)).length;
  const aiToday = auditLogs.filter((entry) => entry.handler_used === "ai" && sameDay(entry.timestamp, today)).length;

  const activityByHour = Array.from({ length: 6 }, (_, offset) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (5 - offset), 0, 0, 0);
    const value = auditLogs.filter((entry) => new Date(entry.timestamp).getHours() === hour.getHours()).length;
    return {
      label: `${hour.getHours().toString().padStart(2, "0")}:00`,
      value,
    };
  });

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="section-kicker">Clinical monitoring</p>
          <h1 className="font-heading text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.06em] text-ink md:text-[3.6rem]">
            Real-time clinical oversight, without the clutter.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Patient status, escalation urgency, and message flow stay visible from one operational surface.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/activity")} variant="secondary">
            Review activity
          </Button>
          <Button onClick={() => navigate("/admin")}>
            <UserPlus2 className="h-4 w-4" />
            Add patient
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard eyebrow="Patients currently admitted" icon={<Stethoscope className="h-5 w-5" />} title="Active Patients" value={activePatients} />
        <MetricCard accent={pendingCount > 0 ? "danger" : "default"} eyebrow="Needs nurse review now" icon={<AlertTriangle className="h-5 w-5" />} title="Pending Escalations" value={pendingCount} />
        <MetricCard eyebrow="Patient interactions recorded today" icon={<MessageSquareText className="h-5 w-5" />} title="Messages Today" value={messagesToday} />
        <MetricCard accent={aiToday > 0 ? "success" : "default"} eyebrow="Handled through the AI flow" icon={<Bot className="h-5 w-5" />} title="AI Responses" value={aiToday} />
      </section>

      {patients.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => navigate("/admin")}>
              <UserPlus2 className="h-4 w-4" />
              Add the first patient
            </Button>
          }
          description="No active patients are available for this hospital yet. Use the admin portal to seed a record."
          icon={<Stethoscope className="h-7 w-7" />}
          title="No active patients"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {patients.map((patient) => {
            const escalation = escalations.find(
              (entry) => entry.patient_id === patient.id && entry.status === "pending",
            );

            return (
              <PatientCard
                key={patient.id}
                escalation={escalation}
                lastContactAt={latestAuditMap.get(patient.id)}
                patient={patient}
              />
            );
          })}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.32fr_0.82fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Intelligence brief</p>
              <h2 className="mt-2 font-heading text-[2.4rem] font-semibold leading-tight tracking-[-0.05em] text-ink">
                Bedside AI is triaging the routine so staff can stay with the urgent.
              </h2>
            </div>
            <Button onClick={() => navigate("/activity")} variant="ghost">
              View feed
            </Button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.6rem] bg-primary-soft/70 p-5">
              <p className="max-w-xl text-sm leading-7 text-primary-strong">
                System monitoring shows most recent patient questions are schedule clarifications and medication follow-ups. The highest-risk case remains Roberto Alves in Post-Op ICU.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full bg-panel/90 px-4 py-2 text-sm text-ink">
                  {pendingEscalations.size} patient{pendingEscalations.size === 1 ? "" : "s"} flagged
                </div>
                <div className="rounded-full bg-panel/90 px-4 py-2 text-sm text-ink">
                  {aiToday} AI responses today
                </div>
              </div>
            </div>
            <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(11,22,42,0.98),rgba(16,35,57,0.96))] p-4 text-white shadow-ambient">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/60">
                <span>Realtime trend analysis</span>
                <span>Today</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityByHour}>
                    <defs>
                      <linearGradient id="bedside-activity" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(84,193,223,1)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="rgba(84,193,223,0)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="value"
                      fill="url(#bedside-activity)"
                      fillOpacity={1}
                      stroke="rgba(84,193,223,1)"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs text-white/55">
                {activityByHour.map((point) => (
                  <span key={point.label}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
