export function readSupabasePublicEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    return { error: "NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY дутуу байна." };
  }
  return { url, anonKey };
}
