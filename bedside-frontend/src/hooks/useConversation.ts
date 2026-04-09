import { useMemo } from "react";
import { useData } from "@/lib/data";
import { mergeConversation } from "@/lib/utils";

export function useConversation(patientId: string) {
  const {
    conversationLogs,
    nurseMessages,
    appointments,
    medications,
    consentFlags,
    status,
    error,
    sendCareTeamMessage,
  } = useData();

  return useMemo(
    () => ({
      messages: mergeConversation(conversationLogs, nurseMessages, patientId),
      appointments: appointments.filter((entry) => entry.patient_id === patientId),
      medications: medications.filter((entry) => entry.patient_id === patientId && entry.active),
      consentFlag: consentFlags.find((entry) => entry.patient_id === patientId) ?? null,
      status,
      error,
      sendCareTeamMessage,
    }),
    [
      appointments,
      consentFlags,
      conversationLogs,
      error,
      medications,
      nurseMessages,
      patientId,
      sendCareTeamMessage,
      status,
    ],
  );
}
