// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Try to get from build-time env vars first, then fallback to runtime
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (window as any).__SUPABASE_URL__ ||
  "https://supabase.anuragparida.com";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (window as any).__SUPABASE_ANON_KEY__ ||
  "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
