import { useMemo } from "react";
import { useData } from "@/lib/data";
import { sortPatientsByUrgency } from "@/lib/utils";

export function usePatients() {
  const { patients, escalations, auditLogs, ...rest } = useData();

  return useMemo(() => {
    const latestAuditMap = new Map<string, string>();
    for (const log of auditLogs) {
      if (!latestAuditMap.has(log.patient_id)) {
        latestAuditMap.set(log.patient_id, log.timestamp);
      }
    }

    const pendingEscalations = new Set(
      escalations.filter((entry) => entry.status === "pending").map((entry) => entry.patient_id),
    );

    return {
      patients: sortPatientsByUrgency(patients, latestAuditMap, pendingEscalations),
      latestAuditMap,
      pendingEscalations,
      ...rest,
    };
  }, [auditLogs, escalations, patients, rest]);
}
