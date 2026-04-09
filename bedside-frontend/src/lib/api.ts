import { env } from "@/lib/env";
import type {
  FamilyPayload,
  NewAppointmentInput,
  NewMedicationInput,
  NewPatientInput,
  ResolveEscalationInput,
  SendMessageInput,
} from "@/types";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${env.backendUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function createPatientRequest(payload: NewPatientInput) {
  return request<{ id?: string; patient?: unknown }>("/admin/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createAppointmentRequest(patientId: string, payload: NewAppointmentInput) {
  return request(`/admin/patients/${patientId}/appointments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createMedicationRequest(patientId: string, payload: NewMedicationInput) {
  return request(`/admin/patients/${patientId}/medications`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendCareTeamMessageRequest(patientId: string, payload: SendMessageInput) {
  return request(`/admin/patients/${patientId}/message`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resolveEscalationRequest({ escalation_id, resolved_by }: ResolveEscalationInput) {
  return request(`/admin/escalations/${escalation_id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolved_by }),
  });
}

export function fetchFamilyPayload(token: string) {
  return request<FamilyPayload>(`/family/${token}`);
}
