import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { env, hasSupabaseEnv } from "@/lib/env";
import { cloneSeedData, mockHospital } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import {
  createAppointmentRequest,
  createMedicationRequest,
  createPatientRequest,
  fetchFamilyPayload,
  resolveEscalationRequest,
  sendCareTeamMessageRequest,
} from "@/lib/api";
import { useToastController } from "@/components/ui/Toast";
import { makeId } from "@/lib/utils";
import type {
  AppDataStore,
  Appointment,
  AuditLog,
  ConsentFlag,
  ConversationLog,
  DataStatus,
  Escalation,
  FamilyPayload,
  MedicationRequest,
  NewAppointmentInput,
  NewMedicationInput,
  NewPatientInput,
  NurseMessage,
  Patient,
  ResolveEscalationInput,
  SendMessageInput,
} from "@/types";

interface DataContextValue extends AppDataStore {
  status: DataStatus;
  error: string | null;
  usingMockData: boolean;
  refresh: (silent?: boolean) => Promise<void>;
  createPatient: (payload: NewPatientInput) => Promise<Patient>;
  createAppointment: (payload: NewAppointmentInput) => Promise<void>;
  createMedication: (payload: NewMedicationInput) => Promise<void>;
  sendCareTeamMessage: (payload: SendMessageInput) => Promise<void>;
  resolveEscalation: (payload: ResolveEscalationInput) => Promise<void>;
  getFamilyPayload: (token: string) => Promise<FamilyPayload | null>;
}

const EMPTY_STORE: AppDataStore = {
  hospital: null,
  patients: [],
  appointments: [],
  medications: [],
  auditLogs: [],
  escalations: [],
  conversationLogs: [],
  nurseMessages: [],
  consentFlags: [],
};

const DataContext = createContext<DataContextValue | null>(null);

function pause(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function DataProvider({ children }: PropsWithChildren) {
  const { pushToast } = useToastController();
  const [store, setStore] = useState<AppDataStore>(EMPTY_STORE);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(true);
  const storeRef = useRef(store);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const loadMock = useCallback(async () => {
    await pause(280);
    setUsingMockData(true);
    setStore(cloneSeedData());
    setStatus("ready");
    setError(null);
  }, []);

  const loadLive = useCallback(async () => {
    if (!supabase || !hasSupabaseEnv) {
      await loadMock();
      return;
    }

    const hospitalId = env.hospitalId;
    const [
      hospitalResult,
      patientsResult,
      appointmentsResult,
      medicationsResult,
      auditLogsResult,
      escalationsResult,
      conversationLogsResult,
      nurseMessagesResult,
      consentFlagsResult,
    ] = await Promise.all([
      supabase.from("hospitals").select("*").eq("id", hospitalId).single(),
      supabase.from("patients").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .eq("hospital_id", hospitalId)
        .order("appointment_date", { ascending: true }),
      supabase.from("medication_requests").select("*").eq("hospital_id", hospitalId),
      supabase.from("audit_logs").select("*").eq("hospital_id", hospitalId).order("timestamp", { ascending: false }),
      supabase.from("escalations").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }),
      supabase
        .from("conversation_logs")
        .select("*")
        .eq("hospital_id", hospitalId)
        .order("timestamp", { ascending: true }),
      supabase.from("nurse_messages").select("*").eq("hospital_id", hospitalId).order("sent_at", { ascending: true }),
      supabase.from("consent_flags").select("*").eq("hospital_id", hospitalId),
    ]);

    const results = [
      hospitalResult,
      patientsResult,
      appointmentsResult,
      medicationsResult,
      auditLogsResult,
      escalationsResult,
      conversationLogsResult,
      nurseMessagesResult,
      consentFlagsResult,
    ];

    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      throw firstError;
    }

    setUsingMockData(false);
    setStore({
      hospital: hospitalResult.data,
      patients: (patientsResult.data ?? []) as Patient[],
      appointments: (appointmentsResult.data ?? []) as Appointment[],
      medications: (medicationsResult.data ?? []) as MedicationRequest[],
      auditLogs: (auditLogsResult.data ?? []) as AuditLog[],
      escalations: (escalationsResult.data ?? []) as Escalation[],
      conversationLogs: (conversationLogsResult.data ?? []) as ConversationLog[],
      nurseMessages: (nurseMessagesResult.data ?? []) as NurseMessage[],
      consentFlags: (consentFlagsResult.data ?? []) as ConsentFlag[],
    });
    setStatus("ready");
    setError(null);
  }, [loadMock]);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) {
        setStatus("loading");
      }

      try {
        await loadLive();
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to load live data.";
        setError(`${message} Falling back to mock data.`);
        await loadMock();
      }
    },
    [loadLive, loadMock],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const client = supabase;
    if (!client || !hasSupabaseEnv || usingMockData) {
      return undefined;
    }

    const hospitalId = env.hospitalId;
    const channel = client
      .channel("bedside-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients", filter: `hospital_id=eq.${hospitalId}` },
        () => {
          void refresh(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs", filter: `hospital_id=eq.${hospitalId}` },
        () => {
          void refresh(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escalations", filter: `hospital_id=eq.${hospitalId}` },
        (payload) => {
          const patientId = (payload.new as { patient_id?: string } | null)?.patient_id;
          const patientName = storeRef.current.patients.find((patient) => patient.id === patientId)?.name ?? "A patient";
          pushToast({
            title: `New escalation — ${patientName}`,
            description: "A new urgent message arrived. Open Escalations to review it.",
            tone: "warning",
          });
          void refresh(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "escalations", filter: `hospital_id=eq.${hospitalId}` },
        () => {
          void refresh(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_logs", filter: `hospital_id=eq.${hospitalId}` },
        () => {
          void refresh(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nurse_messages", filter: `hospital_id=eq.${hospitalId}` },
        () => {
          void refresh(true);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [pushToast, refresh, usingMockData]);

  const createPatient = useCallback(async (payload: NewPatientInput) => {
    if (usingMockData || !storeRef.current.hospital) {
      await pause(320);
      const patient: Patient = {
        id: makeId("patient"),
        hospital_id: storeRef.current.hospital?.id ?? mockHospital.id,
        name: payload.name,
        phone_number: payload.phone_number,
        age: payload.age,
        condition: payload.condition,
        ward: payload.ward,
        bed_number: payload.bed_number,
        admission_date: payload.admission_date,
        attending_physician: payload.attending_physician,
        status: "active",
        preferred_language: "pt-BR",
        created_at: new Date().toISOString(),
      };

      setStore((current) => ({
        ...current,
        patients: [patient, ...current.patients],
        consentFlags: [
          ...current.consentFlags,
          {
            id: makeId("consent"),
            hospital_id: patient.hospital_id,
            patient_id: patient.id,
            family_sharing_enabled: false,
            family_share_token: makeId("share"),
            consented_at: null,
            revoked_at: null,
          },
        ],
      }));
      return patient;
    }

    const response = await createPatientRequest(payload);
    await refresh(true);
    const latest = storeRef.current.patients.find((patient) => patient.phone_number === payload.phone_number);
    return latest ?? ((response.patient ?? response) as Patient);
  }, [refresh, usingMockData]);

  const createAppointment = useCallback(async (payload: NewAppointmentInput) => {
    if (usingMockData) {
      await pause(280);
      setStore((current) => ({
        ...current,
        appointments: [
          {
            id: makeId("appointment"),
            hospital_id: current.hospital?.id ?? mockHospital.id,
            patient_id: payload.patient_id,
            title: payload.title,
            scheduled_time: payload.scheduled_time,
            location: payload.location,
            preparation_notes: payload.preparation_notes,
            completed: false,
            appointment_date: payload.appointment_date,
            created_at: new Date().toISOString(),
          },
          ...current.appointments,
        ],
      }));
      return;
    }

    await createAppointmentRequest(payload.patient_id, payload);
    await refresh(true);
  }, [refresh, usingMockData]);

  const createMedication = useCallback(async (payload: NewMedicationInput) => {
    if (usingMockData) {
      await pause(280);
      setStore((current) => ({
        ...current,
        medications: [
          {
            id: makeId("medication"),
            hospital_id: current.hospital?.id ?? mockHospital.id,
            patient_id: payload.patient_id,
            medication_name: payload.medication_name,
            dosage: payload.dosage,
            frequency: payload.frequency,
            route: payload.route,
            reason: payload.reason,
            next_due_time: payload.next_due_time,
            active: true,
            created_at: new Date().toISOString(),
          },
          ...current.medications,
        ],
      }));
      return;
    }

    await createMedicationRequest(payload.patient_id, payload);
    await refresh(true);
  }, [refresh, usingMockData]);

  const sendCareTeamMessage = useCallback(async (payload: SendMessageInput) => {
    if (usingMockData) {
      await pause(220);
      setStore((current) => ({
        ...current,
        nurseMessages: [
          ...current.nurseMessages,
          {
            id: makeId("nurse"),
            hospital_id: current.hospital?.id ?? mockHospital.id,
            patient_id: payload.patient_id,
            message_text: payload.message_text,
            sent_by: payload.sent_by,
            sent_at: new Date().toISOString(),
          },
        ],
        auditLogs: [
          {
            id: makeId("audit"),
            hospital_id: current.hospital?.id ?? mockHospital.id,
            patient_id: payload.patient_id,
            intent_detected: "free_text",
            handler_used: "deterministic",
            input_summary: "Care team followed up with the patient.",
            response_summary: payload.message_text,
            detected_language: "en-US",
            timestamp: new Date().toISOString(),
          },
          ...current.auditLogs,
        ],
      }));
      return;
    }

    await sendCareTeamMessageRequest(payload.patient_id, payload);
    await refresh(true);
  }, [refresh, usingMockData]);

  const resolveEscalation = useCallback(async (payload: ResolveEscalationInput) => {
    if (usingMockData) {
      await pause(200);
      setStore((current) => ({
        ...current,
        escalations: current.escalations.map((item) =>
          item.id === payload.escalation_id
            ? {
                ...item,
                status: "resolved",
                resolved_at: new Date().toISOString(),
                resolved_by: payload.resolved_by,
              }
            : item,
        ),
      }));
      return;
    }

    await resolveEscalationRequest(payload);
    await refresh(true);
  }, [refresh, usingMockData]);

  const getFamilyPayload = useCallback(async (token: string) => {
    if (!token) {
      return null;
    }

    if (!usingMockData) {
      try {
        return await fetchFamilyPayload(token);
      } catch {
        return null;
      }
    }

    const consentFlag = store.consentFlags.find(
      (entry) => entry.family_share_token === token && entry.family_sharing_enabled,
    );

    if (!consentFlag || !store.hospital) {
      return null;
    }

    const patient = store.patients.find((entry) => entry.id === consentFlag.patient_id);
    if (!patient) {
      return null;
    }

    return {
      hospital: store.hospital,
      patient,
      appointments: store.appointments.filter((entry) => entry.patient_id === patient.id),
      medications: store.medications.filter((entry) => entry.patient_id === patient.id && entry.active),
      consentFlag,
      updatedAt: new Date().toISOString(),
    };
  }, [store, usingMockData]);

  const value = useMemo<DataContextValue>(
    () => ({
      ...store,
      status,
      error,
      usingMockData,
      refresh,
      createPatient,
      createAppointment,
      createMedication,
      sendCareTeamMessage,
      resolveEscalation,
      getFamilyPayload,
    }),
    [
      createAppointment,
      createMedication,
      createPatient,
      error,
      getFamilyPayload,
      refresh,
      resolveEscalation,
      sendCareTeamMessage,
      status,
      store,
      usingMockData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }

  return context;
}
