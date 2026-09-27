export function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const configured = Boolean(url && anonKey && !/your-project|your-anon/i.test(url + anonKey));
  return Response.json(configured ? { configured: true, url, anonKey } : { configured: false });
}
