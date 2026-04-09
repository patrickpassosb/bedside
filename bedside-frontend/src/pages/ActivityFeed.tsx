import { useMemo, useState } from "react";
import { ActivitySquare, AlertTriangle } from "lucide-react";
import { ActivityRow } from "@/components/features/ActivityRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useData } from "@/lib/data";

type Filter = "all" | "deterministic" | "ai" | "escalation";

const filterOptions: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "deterministic", label: "Deterministic" },
  { value: "ai", label: "AI" },
  { value: "escalation", label: "Escalations" },
];

export function ActivityFeedPage() {
  const { auditLogs, patients, status } = useAuditLogs();
  const { hospital } = useData();
  const [filter, setFilter] = useState<Filter>("all");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (filter === "all") {
        return true;
      }
      if (filter === "escalation") {
        return entry.intent_detected === "escalation";
      }
      return entry.handler_used === filter;
    });
  }, [auditLogs, filter]);

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker">Operational trace</p>
          <h1 className="section-title">Patient interactions in live sequence.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Audit logs are scoped to the active hospital and refresh without manual reloads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => setFilter(option.value)}
              size="sm"
              variant={filter === option.value ? "primary" : "ghost"}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      {status === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          description="Waiting for patient messages, automated answers, or escalations to appear."
          icon={<ActivitySquare className="h-7 w-7" />}
          title="Waiting for activity"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-mist/60 text-left text-[0.72rem] uppercase tracking-[0.2em] text-muted">
                  <th className="px-4 py-4">Time</th>
                  <th className="px-4 py-4">Patient</th>
                  <th className="px-4 py-4">Intent</th>
                  <th className="px-4 py-4">Handler</th>
                  <th className="px-4 py-4">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <ActivityRow
                    key={log.id}
                    log={log}
                    patient={patientMap.get(log.patient_id)}
                    timezone={hospital?.timezone ?? "America/Sao_Paulo"}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3 rounded-[1.25rem] border border-line/50 bg-panel/75 px-4 py-3 text-sm text-muted">
        <AlertTriangle className="h-4 w-4 text-danger" />
        Rows animate in as new audit entries arrive, and escalation events stay pinned to the top of the workflow.
        <Badge variant="outline">{filteredLogs.length} visible rows</Badge>
      </div>
    </div>
  );
}
