import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { EscalationCard } from "@/components/features/EscalationCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastController } from "@/components/ui/Toast";
import { useEscalations } from "@/hooks/useEscalations";

type Tab = "pending" | "resolved";

export function EscalationsPage() {
  const { escalations, patients, status, resolveEscalation } = useEscalations();
  const { pushToast } = useToastController();
  const [tab, setTab] = useState<Tab>("pending");

  const pending = escalations.filter((entry) => entry.status === "pending");
  const resolved = escalations.filter((entry) => entry.status === "resolved");
  const visible = tab === "pending" ? pending : resolved;
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  async function handleResolve(escalationId: string, resolvedBy: string) {
    await resolveEscalation({ escalation_id: escalationId, resolved_by: resolvedBy });
    pushToast({
      title: "Escalation resolved",
      description: `${resolvedBy} marked the escalation as handled.`,
      tone: "success",
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker">Clinical safety</p>
          <h1 className="section-title">Escalations remain visible until closed.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            New urgent patient requests appear here immediately and can be resolved inline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTab("pending")} size="sm" variant={tab === "pending" ? "danger" : "ghost"}>
            Pending ({pending.length})
          </Button>
          <Button onClick={() => setTab("resolved")} size="sm" variant={tab === "resolved" ? "secondary" : "ghost"}>
            Resolved
          </Button>
        </div>
      </section>

      {status === "loading" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        tab === "pending" ? (
          <EmptyState
            description="No pending escalations. All patients are doing well right now."
            icon={<ShieldCheck className="h-7 w-7" />}
            title="No pending escalations"
          />
        ) : (
          <EmptyState
            description="Resolved escalations will collect here for follow-up and auditing."
            icon={<AlertTriangle className="h-7 w-7" />}
            title="No resolved escalations yet"
          />
        )
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {visible.map((escalation) => (
            <EscalationCard
              key={escalation.id}
              escalation={escalation}
              onResolve={
                escalation.status === "pending"
                  ? async (resolvedBy) => handleResolve(escalation.id, resolvedBy)
                  : undefined
              }
              patient={patientMap.get(escalation.patient_id)}
            />
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-line/50 bg-panel/70 px-4 py-3 text-sm text-muted">
        <Badge variant="danger">Pending {pending.length}</Badge>
        <Badge variant="outline">Resolved {resolved.length}</Badge>
        Resolve actions remain inline so nurses can close the loop without leaving the triage screen.
      </div>
    </div>
  );
}
