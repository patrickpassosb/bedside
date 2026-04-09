import { Badge } from "@/components/ui/Badge";
import type { ConversationEntry } from "@/types";
import { formatDate } from "@/lib/utils";

interface MessageBubbleProps {
  message: ConversationEntry;
  timezone: string;
}

export function MessageBubble({ message, timezone }: MessageBubbleProps) {
  const isPatient = message.direction === "inbound";
  const isCareTeam = message.direction === "care-team";

  return (
    <div className={`flex ${isPatient ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[82%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm ${
          isPatient
            ? "rounded-tl-[0.4rem] bg-mist/80 text-ink"
            : isCareTeam
              ? "rounded-tr-[0.4rem] bg-success/12 text-ink"
              : "rounded-tr-[0.4rem] bg-primary text-white"
        }`}
      >
        {isCareTeam ? <Badge className="mb-2" variant="success">Care Team</Badge> : null}
        <p>{message.message_text}</p>
        <p className={`mt-2 text-[0.68rem] ${isPatient ? "text-muted" : "text-white/80"}`}>
          {formatDate(message.timestamp, timezone, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
