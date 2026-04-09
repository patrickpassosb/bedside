import { Activity, AlertTriangle, CalendarRange, MessageCircleMore, Pill, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { AuditLog, Patient } from "@/types";
import { formatClock, firstName } from "@/lib/utils";

interface ActivityRowProps {
  log: AuditLog;
  patient?: Patient;
  timezone: string;
}

const intentConfig = {
  schedule_request: { label: "Schedule", icon: CalendarRange, variant: "primary" as const },
  medication_question: { label: "Medication", icon: Pill, variant: "warning" as const },
  next_action: { label: "Next Step", icon: Activity, variant: "success" as const },
  escalation: { label: "Escalation", icon: AlertTriangle, variant: "danger" as const },
  free_text: { label: "Question", icon: MessageCircleMore, variant: "default" as const },
  family_toggle: { label: "Family", icon: Users, variant: "success" as const },
  injection_attempt: { label: "Security", icon: AlertTriangle, variant: "danger" as const },
};

const handlerConfig = {
  deterministic: { label: "Automatic", variant: "muted" as const },
  ai: { label: "AI", variant: "primary" as const },
  escalation: { label: "Alert", variant: "danger" as const },
};

export function ActivityRow({ log, patient, timezone }: ActivityRowProps) {
  const intent = intentConfig[log.intent_detected];
  const handler = handlerConfig[log.handler_used];
  const Icon = intent.icon;

  return (
    <tr className="animate-slide-in-down border-b border-line/45 last:border-none odd:bg-panel/70 even:bg-paper/50">
      <td className="px-4 py-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {formatClock(new Date(log.timestamp), timezone)}
      </td>
      <td className="px-4 py-4">
        <div className="font-medium text-ink">{patient ? firstName(patient.name) : "Unknown patient"}</div>
        <div className="text-xs text-muted">{patient?.ward ?? "No ward assigned"}</div>
      </td>
      <td className="px-4 py-4">
        <Badge variant={intent.variant}>
          <Icon className="h-3 w-3" />
          {intent.label}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Badge variant={handler.variant}>{handler.label}</Badge>
      </td>
      <td className="px-4 py-4 text-sm text-muted">{log.response_summary}</td>
    </tr>
  );
}
