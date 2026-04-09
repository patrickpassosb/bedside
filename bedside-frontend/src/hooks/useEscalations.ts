import { useData } from "@/lib/data";

export function useEscalations() {
  const { escalations, patients, status, error, resolveEscalation, usingMockData } = useData();
  return { escalations, patients, status, error, resolveEscalation, usingMockData };
}
