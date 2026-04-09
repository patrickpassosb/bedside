export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  backendUrl: import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:3000",
  hospitalId: import.meta.env.VITE_HOSPITAL_ID?.trim() ?? "",
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.hospitalId);
