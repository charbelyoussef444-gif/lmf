// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const missingConfigMessage =
  "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.";

function makeMissingConfigClient() {
  const error = new Error(missingConfigMessage);

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error };
      },
      async getUser() {
        return { data: { user: null }, error };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signOut() {
        return { error };
      },
      async exchangeCodeForSession() {
        return { error };
      },
      async updateUser() {
        return { data: { user: null }, error };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error };
      },
      async resetPasswordForEmail() {
        return { data: {}, error };
      },
      async signUp() {
        return { data: { user: null, session: null }, error };
      },
    },
  };
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (makeMissingConfigClient() as unknown as ReturnType<typeof createClient>);
