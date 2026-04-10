export type Intent =
  | "schedule_request"
  | "medication_question"
  | "next_action"
  | "escalation"
  | "family_on"
  | "family_off"
  | "free_text";

// Order matters: most specific intents first. Family toggles are multi-word
// so they are unambiguous. Schedule/medication are checked BEFORE escalation
// to avoid false positives like "can you help me with my schedule" matching
// "help" as escalation.
const INTENT_KEYWORDS: Array<{ intent: Intent; keywords: string[] }> = [
  {
    intent: "family_on",
    keywords: ["family on", "familia on", "compartilhar familia", "ativar familia", "activar familia"],
  },
  {
    intent: "family_off",
    keywords: ["family off", "familia off", "desativar familia", "desactivar familia"],
  },
  {
    intent: "schedule_request",
    keywords: [
      "today", "schedule", "agenda",
      "hoje", "horario", "programacao", "cronograma",
      "mi agenda", "citas",
    ],
  },
  {
    intent: "medication_question",
    keywords: [
      "medication", "medications", "meds", "medicine",
      "remedios", "remedio", "medicamentos", "medicamento", "medicacao",
      "prescricao", "prescricoes", "receita", "receitas", "remedio de hoje",
      "medicacao de hoje", "prescricao de hoje", "meus remedios", "minha medicacao",
      "minha prescricao", "qual a minha prescricao", "quais sao meus remedios",
      "mis medicamentos", "pastillas",
    ],
  },
  {
    intent: "next_action",
    keywords: [
      "next step", "what now",
      "proximo", "o que faco", "o que fazer",
      "que hago",
    ],
  },
  {
    intent: "escalation",
    keywords: [
      "nurse", "pain", "emergency", "urgent",
      "enfermeira", "enfermeiro", "socorro", "dor", "dor intensa",
      "preciso de ajuda", "urgente", "emergencia",
      "dolor", "ayuda", "ajuda",
    ],
  },
];

// Keywords that must match at word boundary to avoid substring false positives
// e.g., "pain" should not match "painter", "help" should not match "helpful"
const WORD_BOUNDARY_KEYWORDS = new Set([
  "help", "pain", "next", "meds", "agora", "ahora",
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesKeyword(text: string, keyword: string): boolean {
  if (WORD_BOUNDARY_KEYWORDS.has(keyword)) {
    // Escape regex metacharacters then match on word boundary
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  }
  return text.includes(keyword);
}

export function detectIntent(text: string): Intent {
  const lower = stripAccents(text.toLowerCase());

  // "help" in English is a standalone escalation keyword that needs boundary check
  // but we keep it out of INTENT_KEYWORDS to avoid substring collisions.
  if (/\bhelp\b/.test(lower) && !/\bschedule\b|\bmedication\b|\bmeds\b/.test(lower)) {
    return "escalation";
  }
  if (/\bnext\b/.test(lower) && !/\bmedication\b|\bschedule\b/.test(lower)) {
    return "next_action";
  }

  for (const { intent, keywords } of INTENT_KEYWORDS) {
    for (const keyword of keywords) {
      const normalizedKeyword = stripAccents(keyword);
      if (matchesKeyword(lower, normalizedKeyword)) {
        return intent;
      }
    }
  }

  return "free_text";
}
