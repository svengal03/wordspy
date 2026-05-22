import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser client (safe to import in components / hooks) ───────────────────
// Uses the public anon key — only what RLS allows is accessible.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Server client (API routes only — never imported client-side) ────────────
// Uses the service role key which bypasses RLS.
// Import this ONLY in src/app/**/api/**/route.ts files.
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — server client unavailable");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
