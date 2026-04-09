import { useData } from "@/lib/data";

export function useAuditLogs() {
  const { auditLogs, status, error, patients, usingMockData } = useData();
  return { auditLogs, status, error, patients, usingMockData };
}
