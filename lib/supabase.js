import { createClient } from "@supabase/supabase-js";
import { readSupabasePublicEnv } from "@/lib/supabaseEnv";

const env = readSupabasePublicEnv();
const url = "error" in env ? "https://invalid.supabase.co" : env.url;
const anonKey = "error" in env ? "invalid-anon-key" : env.anonKey;

export const supabaseEnvError = "error" in env ? env.error : null;
export const supabase = createClient(url, anonKey);
