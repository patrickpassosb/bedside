import { AlertTriangle, ArrowUpRight, Clock3, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Escalation, Patient } from "@/types";
import { cn, formatRelativeTime, isWithinMinutes } from "@/lib/utils";

interface PatientCardProps {
  patient: Patient;
  lastContactAt?: string;
  escalation?: Escalation;
}

export function PatientCard({ patient, lastContactAt, escalation }: PatientCardProps) {
    const recent = lastContactAt ? isWithinMinutes(lastContactAt, 2) : false;
    const danger = escalation?.status === "pending";
    const activityLabel = lastContactAt ? formatRelativeTime(lastContactAt) : "No contact yet";

    return (
      <Link to={`/patients/${patient.id}`} className="group">
        <Card
          className={cn(
            "h-full transition duration-200 hover:-translate-y-1 hover:shadow-ambient",
            danger && "border-danger/20 bg-danger/5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <Avatar live={recent} name={patient.name} seed={patient.ward} />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={danger ? "danger" : "primary"}>{patient.ward}</Badge>
                  <Badge variant="outline">Bed {patient.bed_number}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold tracking-[-0.02em] text-ink">{patient.name}</h3>
                  <p className="max-w-[18rem] truncate text-sm text-muted">{patient.condition}</p>
                </div>
              </div>
            </div>
            {danger ? (
              <Badge className="items-center gap-1" variant="danger">
                <AlertTriangle className="h-3 w-3" />
                Escalation
              </Badge>
            ) : (
              <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:text-primary" />
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-[1.25rem] bg-mist/55 p-4 text-sm">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Attending</p>
              <p className="mt-2 font-medium text-ink">{patient.attending_physician}</p>
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">Condition</p>
              <p className="mt-2 font-medium text-ink">{danger ? "Needs review" : "Stable monitoring"}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-muted">
              <Clock3 className="h-4 w-4" />
              Last contact: {activityLabel}
            </span>
            <span className="inline-flex items-center gap-2 font-medium text-primary">
              <Stethoscope className="h-4 w-4" />
              Open record
            </span>
          </div>
        </Card>
      </Link>
    );
}
