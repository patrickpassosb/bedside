const PT_WORDS = [
  "hoje", "horario", "programacao", "cronograma", "remedios", "remedio",
  "medicamentos", "medicamento", "medicacao", "proximo", "o que faco",
  "o que fazer", "agora", "enfermeira", "enfermeiro", "ajuda", "socorro",
  "dor", "preciso", "urgente", "emergencia", "familia", "compartilhar",
  "ativar", "desativar", "quais", "meus", "minha", "quando", "como",
  "obrigado", "obrigada", "por favor", "bom dia", "boa tarde", "boa noite",
  "sim", "nao", "voce", "pode", "estou", "tenho", "qual", "onde",
];

const PT_CHARS = /[àáâãçéêíóôõúü]/i;

const ES_WORDS = [
  "mi agenda", "citas", "mis medicamentos", "pastillas",
  "ahora", "que hago", "dolor", "ayuda", "activar", "desactivar",
  "familia", "buenos dias", "buenas tardes", "buenas noches", "gracias",
  "por favor", "hola", "como", "cuando", "donde", "puedo", "tengo",
  "estoy", "necesito", "urgente", "emergencia",
];

const ES_CHARS = /[¿¡ñ]/i;

export function detectLanguage(text: string, fallback: string = "pt-BR"): string {
  const lower = text.toLowerCase();

  // Check Portuguese
  let ptScore = 0;
  if (PT_CHARS.test(lower)) ptScore += 3;
  for (const word of PT_WORDS) {
    if (lower.includes(word)) ptScore++;
  }

  // Check Spanish
  let esScore = 0;
  if (ES_CHARS.test(lower)) esScore += 3;
  for (const word of ES_WORDS) {
    if (lower.includes(word)) esScore++;
  }

  // Check English (by absence of PT/ES markers + common EN words)
  const enWords = ["what", "when", "where", "how", "my", "the", "please", "thank", "help", "schedule", "medication", "next", "nurse", "pain"];
  let enScore = 0;
  for (const word of enWords) {
    if (lower.includes(word)) enScore++;
  }

  if (ptScore > esScore && ptScore > enScore) return "pt-BR";
  if (esScore > ptScore && esScore > enScore) return "es";
  if (enScore > ptScore && enScore > esScore) return "en";

  return fallback;
}
