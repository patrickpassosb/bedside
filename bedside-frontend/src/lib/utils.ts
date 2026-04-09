import type {
  ConversationEntry,
  ConversationLog,
  NurseMessage,
  Patient,
} from "@/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function makeId(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarPalette(seed: string) {
  const hue = hashString(seed) % 360;
  return {
    backgroundColor: `hsl(${hue} 60% 90%)`,
    color: `hsl(${hue} 54% 28%)`,
    borderColor: `hsl(${hue} 54% 74%)`,
  };
}

export function formatClock(date: Date, timezone = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDate(
  value: string,
  timezone = "America/Sao_Paulo",
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(elapsed / 60000));
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }
  return `${Math.round(hours / 24)} d ago`;
}

export function isWithinMinutes(value: string, minutes: number) {
  const diff = Math.abs(Date.now() - new Date(value).getTime());
  return diff <= minutes * 60_000;
}

export function isDueSoon(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return diff >= 0 && diff <= 60 * 60_000;
}

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

export function toSentenceCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mergeConversation(
  conversationLogs: ConversationLog[],
  nurseMessages: NurseMessage[],
  patientId: string,
): ConversationEntry[] {
  const messages = conversationLogs
    .filter((entry) => entry.patient_id === patientId)
    .map<ConversationEntry>((entry) => ({
      id: entry.id,
      patient_id: entry.patient_id,
      direction: entry.direction,
      detected_language: entry.detected_language,
      message_text: entry.message_text,
      timestamp: entry.timestamp,
    }));

  const careTeam = nurseMessages
    .filter((entry) => entry.patient_id === patientId)
    .map<ConversationEntry>((entry) => ({
      id: entry.id,
      patient_id: entry.patient_id,
      direction: "care-team",
      message_text: entry.message_text,
      timestamp: entry.sent_at,
      sent_by: entry.sent_by,
    }));

  return [...messages, ...careTeam].sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

export function sortPatientsByUrgency(
  patients: Patient[],
  latestAuditMap: Map<string, string>,
  pendingEscalations: Set<string>,
) {
  return [...patients].sort((left, right) => {
    const leftScore = Number(pendingEscalations.has(left.id)) * 1000 + (latestAuditMap.get(left.id) ? 10 : 0);
    const rightScore = Number(pendingEscalations.has(right.id)) * 1000 + (latestAuditMap.get(right.id) ? 10 : 0);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return left.name.localeCompare(right.name);
  });
}
