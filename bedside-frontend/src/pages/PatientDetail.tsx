import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, Copy, PillBottle, Send, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { MessageBubble } from "@/components/features/MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastController } from "@/components/ui/Toast";
import { useConversation } from "@/hooks/useConversation";
import { useData } from "@/lib/data";
import { formatDate, firstName, isDueSoon } from "@/lib/utils";

export function PatientDetailPage() {
  const { patientId = "" } = useParams();
  const { patients, hospital, status } = useData();
  const { messages, appointments, medications, consentFlag, sendCareTeamMessage } = useConversation(patientId);
  const { pushToast } = useToastController();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const patient = useMemo(() => patients.find((entry) => entry.id === patientId), [patientId, patients]);
  const patientAppointments = appointments
    .filter((entry) => entry.patient_id === patientId)
    .sort((left, right) => left.scheduled_time.localeCompare(right.scheduled_time));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage() {
    if (!patient || !draft.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await sendCareTeamMessage({
        patient_id: patient.id,
        message_text: draft.trim(),
        sent_by: "Care Team",
      });
      setDraft("");
      pushToast({
        title: "Message sent",
        description: `A care team note was added for ${firstName(patient.name)}.`,
        tone: "success",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function copyFamilyLink() {
    if (!consentFlag || !consentFlag.family_sharing_enabled) {
      return;
    }
    const url = `${window.location.origin}/family/${consentFlag.family_share_token}`;
    await navigator.clipboard.writeText(url);
    pushToast({
      title: "Family link copied",
      description: "The public family-sharing URL is now on the clipboard.",
      tone: "info",
    });
  }

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[38rem] rounded-3xl" />
          <Skeleton className="h-[38rem] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <EmptyState
        action={
          <Button onClick={() => window.history.back()} variant="secondary">
            Go back
          </Button>
        }
        description="The requested patient record is unavailable in this hospital scope."
        icon={<CalendarClock className="h-7 w-7" />}
        title="Patient not found"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Link className="inline-flex items-center gap-2 rounded-full bg-panel/80 px-3 py-2 transition hover:bg-panel" to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
      </div>

      <Card className="overflow-hidden py-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr]">
          <div className="flex items-start gap-5">
            <Avatar name={patient.name} seed={patient.ward} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{patient.ward}</Badge>
                <Badge variant="outline">Bed {patient.bed_number}</Badge>
                <Badge variant="muted">Age {patient.age}</Badge>
              </div>
              <div>
                <h1 className="font-heading text-[3rem] font-semibold tracking-[-0.05em] text-ink">{patient.name}</h1>
                <p className="mt-2 text-sm text-muted">
                  {patient.condition} · Admitted {formatDate(patient.admission_date, hospital?.timezone ?? "America/Sao_Paulo")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{patient.attending_physician}</Badge>
                <Badge variant={consentFlag?.family_sharing_enabled ? "success" : "outline"}>
                  Family Sharing: {consentFlag?.family_sharing_enabled ? "Active" : "Off"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="mist-panel p-4">
              <p className="section-kicker">Conversation</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink">{messages.length}</p>
              <p className="mt-1 text-sm text-muted">Messages in timeline</p>
            </div>
            <div className="mist-panel p-4">
              <p className="section-kicker">Schedule</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink">{patientAppointments.length}</p>
              <p className="mt-1 text-sm text-muted">Appointments today</p>
            </div>
            <div className="mist-panel p-4">
              <p className="section-kicker">Medication</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink">{medications.length}</p>
              <p className="mt-1 text-sm text-muted">Active medication orders</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <details className="paper-panel [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary" />
                <span className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">Today&apos;s Schedule</span>
              </div>
              <Badge variant="outline">{patientAppointments.length}</Badge>
            </summary>
            <div className="space-y-3 px-6 pb-6">
              {patientAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-[1.25rem] bg-mist/55 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={appointment.completed ? "success" : "primary"}>{appointment.scheduled_time}</Badge>
                        <h3 className={`font-medium text-ink ${appointment.completed ? "line-through opacity-70" : ""}`}>
                          {appointment.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-muted">{appointment.location}</p>
                    </div>
                  </div>
                  {appointment.preparation_notes ? (
                    <p className="mt-3 text-sm leading-6 text-muted">{appointment.preparation_notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </details>

          <details className="paper-panel [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <PillBottle className="h-5 w-5 text-primary" />
                <span className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">Current Medications</span>
              </div>
              <Badge variant="outline">{medications.length}</Badge>
            </summary>
            <div className="space-y-3 px-6 pb-6">
              {medications.map((medication) => (
                <div key={medication.id} className="rounded-[1.25rem] bg-mist/55 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-ink">{medication.medication_name}</h3>
                        <Badge variant="primary">{medication.dosage}</Badge>
                        <Badge variant="outline">{medication.route}</Badge>
                        {isDueSoon(medication.next_due_time) ? <Badge variant="warning">Due soon</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted">{medication.frequency}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{medication.reason}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="paper-panel [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-primary" />
                <span className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">Sharing</span>
              </div>
              <Badge variant={consentFlag?.family_sharing_enabled ? "success" : "outline"}>
                {consentFlag?.family_sharing_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </summary>
            <div className="space-y-3 px-6 pb-6 text-sm text-muted">
              <p>
                {consentFlag?.family_sharing_enabled
                  ? "Family view is active for this patient."
                  : "Family sharing is currently disabled for this patient."}
              </p>
              {consentFlag?.family_sharing_enabled ? (
                <Button onClick={copyFamilyLink} variant="secondary">
                  <Copy className="h-4 w-4" />
                  Copy family link
                </Button>
              ) : null}
            </div>
          </details>
        </div>

        <Card className="flex h-[44rem] flex-col overflow-hidden">
          <div className="border-b border-line/50 pb-4">
            <p className="section-kicker">Conversation with Bedside</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.05em] text-ink">{patient.phone_number}</h2>
          </div>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                timezone={hospital?.timezone ?? "America/Sao_Paulo"}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-4 border-t border-line/50 pt-4">
            <div className="flex gap-3">
              <input
                className="field-shell flex-1"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send message as care team..."
                value={draft}
              />
              <Button isLoading={isSending} onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
