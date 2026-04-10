import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Supabase env vars tidak ditemukan!\n" +
    "Buat file .env.local dengan:\n" +
    "VITE_SUPABASE_URL=...\n" +
    "VITE_SUPABASE_ANON_KEY=..."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Token disimpan di localStorage agar user tetap login setelah refresh
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
