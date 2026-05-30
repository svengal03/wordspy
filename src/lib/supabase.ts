import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser client (safe to import in components / hooks) ───────────────────
// Uses the public anon key — only what RLS allows is accessible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);

// ─── Server client (API routes only — never imported client-side) ────────────
// Uses the service role key which bypasses RLS.
// Import this ONLY in src/app/**/api/**/route.ts files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _serverClient: ReturnType<typeof createClient<any>> | null = null;

export function createServerClient() {
  if (_serverClient) return _serverClient;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — server client unavailable");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _serverClient = createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _serverClient;
}
