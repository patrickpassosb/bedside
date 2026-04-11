export const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Primary AI provider - Groq (OpenAI-compatible)
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",

  // Fallback AI provider - Mistral (OpenAI-compatible)
  mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
  mistralModel: process.env.MISTRAL_MODEL ?? "mistral-large-latest",
  mistralBaseUrl: process.env.MISTRAL_BASE_URL ?? "https://api.mistral.ai/v1",

  evolutionApiUrl: process.env.EVOLUTION_API_URL ?? "http://localhost:8080",
  evolutionApiKey: process.env.EVOLUTION_API_KEY ?? "",
  evolutionInstanceName: process.env.EVOLUTION_INSTANCE_NAME ?? "bedside-whatsapp",

  port: parseInt(process.env.PORT ?? "3000", 10),
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",

  // Demo mode - when true, unknown phones are served as the demo patient
  demoMode: (process.env.DEMO_MODE ?? "false").toLowerCase() === "true",
  demoPatientPhone: process.env.DEMO_PATIENT_PHONE ?? "",
} as const;
