export const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  aiProvider: process.env.AI_PROVIDER ?? "mistral",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "mistral-large-latest",
  aiBaseUrl: process.env.AI_BASE_URL ?? "https://api.mistral.ai/v1",

  evolutionApiUrl: process.env.EVOLUTION_API_URL ?? "http://localhost:8080",
  evolutionApiKey: process.env.EVOLUTION_API_KEY ?? "",
  evolutionInstanceName: process.env.EVOLUTION_INSTANCE_NAME ?? "bedside-whatsapp",

  port: parseInt(process.env.PORT ?? "3000", 10),
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
} as const;
