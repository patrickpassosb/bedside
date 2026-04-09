import { useState } from "react";
import { AlertTriangle, Clock3, UserCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Escalation, Patient } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface EscalationCardProps {
  escalation: Escalation;
  patient?: Patient;
  onResolve?: (resolvedBy: string) => Promise<void>;
}

export function EscalationCard({ escalation, patient, onResolve }: EscalationCardProps) {
  const [resolvedBy, setResolvedBy] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isPending = escalation.status === "pending";

  async function handleResolve() {
    if (!onResolve || !resolvedBy.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onResolve(resolvedBy.trim());
      setIsEditing(false);
      setResolvedBy("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card tone={isPending ? "danger" : "default"} className="relative overflow-hidden border-l-4 border-l-danger">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">{patient?.name ?? "Unknown patient"}</h3>
              <Badge variant={isPending ? "danger" : "muted"}>{patient?.ward ?? "Unassigned ward"}</Badge>
              <Badge variant="outline">Bed {patient?.bed_number ?? "--"}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{patient?.attending_physician ?? "Attending physician unavailable"}</p>
          </div>
          <Badge variant={isPending ? "danger" : "outline"}>
            <Clock3 className="h-3 w-3" />
            {isPending ? formatRelativeTime(escalation.created_at) : formatDate(escalation.created_at)}
          </Badge>
        </div>

        <div className="rounded-[1.15rem] bg-panel/85 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-danger">
            <AlertTriangle className="h-4 w-4" />
            Patient reason
          </div>
          <p className="text-sm leading-6 text-ink">{escalation.reason}</p>
        </div>

        {isPending ? (
          isEditing ? (
            <div className="space-y-3">
              <input
                className="field-shell w-full"
                onChange={(event) => setResolvedBy(event.target.value)}
                placeholder="Resolved by"
                value={resolvedBy}
              />
              <div className="flex gap-3">
                <Button fullWidth isLoading={isSaving} onClick={handleResolve} variant="danger">
                  Confirm resolve
                </Button>
                <Button fullWidth onClick={() => setIsEditing(false)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsEditing(true)} variant="danger">
              Resolve
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2 rounded-[1rem] bg-mist/70 px-4 py-3 text-sm text-muted">
            <UserCheck2 className="h-4 w-4 text-success" />
            Resolved by {escalation.resolved_by ?? "Care Team"} at{" "}
            {escalation.resolved_at ? formatDate(escalation.resolved_at) : "unknown time"}
          </div>
        )}
      </div>
    </Card>
  );
}
