import { describe, expect, test } from "bun:test";
import { getInitials, isDueSoon, mergeConversation } from "@/lib/utils";

describe("utils", () => {
  test("builds initials from a full name", () => {
    expect(getInitials("Roberto Alves")).toBe("RA");
    expect(getInitials("Maria")).toBe("M");
  });

  test("marks upcoming doses within sixty minutes as due soon", () => {
    expect(isDueSoon(new Date(Date.now() + 30 * 60_000).toISOString())).toBe(true);
    expect(isDueSoon(new Date(Date.now() + 2 * 60 * 60_000).toISOString())).toBe(false);
  });

  test("merges care team messages into a single chronologically sorted conversation", () => {
    const merged = mergeConversation(
      [
        {
          id: "a",
          hospital_id: "h",
          patient_id: "p",
          direction: "inbound",
          message_text: "Hello",
          detected_language: "en-US",
          timestamp: "2026-04-08T11:00:00.000Z",
        },
      ],
      [
        {
          id: "b",
          hospital_id: "h",
          patient_id: "p",
          message_text: "Hi there",
          sent_by: "Care Team",
          sent_at: "2026-04-08T11:01:00.000Z",
        },
      ],
      "p",
    );

    expect(merged.map((entry) => entry.direction)).toEqual(["inbound", "care-team"]);
  });
});
