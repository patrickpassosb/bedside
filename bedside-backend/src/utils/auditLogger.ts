import { supabase } from "../supabase.js";

interface AuditEntry {
  hospital_id: string;
  patient_id: string;
  intent_detected: string;
  handler_used: string;
  input_summary: string;
  response_summary: string;
  detected_language: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert(entry);
  if (error) {
    console.error("Failed to write audit log:", error.message);
  }
}

interface ConversationEntry {
  hospital_id: string;
  patient_id: string;
  direction: "inbound" | "outbound";
  message_text: string;
  detected_language: string;
}

export async function logConversation(entry: ConversationEntry): Promise<void> {
  const { error } = await supabase.from("conversation_logs").insert(entry);
  if (error) {
    console.error("Failed to write conversation log:", error.message);
  }
}
