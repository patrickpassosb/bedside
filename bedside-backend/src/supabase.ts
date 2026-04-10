import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

let _client: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
        throw new Error(
          "Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
        );
      }
      _client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
    }
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
