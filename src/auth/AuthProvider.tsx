import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
//vercellll
type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user;
      setUser(u ? toAuthUser(u) : null);
      setLoading(false);
    });

    // 2) react to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? toAuthUser(u) : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      // The onAuthStateChange listener will set user to null
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function toAuthUser(u: any): AuthUser {
  return {
    id: u.id,
    email: u.email ?? u.user_metadata?.email ?? null,
    name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? null,
    avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
  };
}

export function useAuth() {
  return useContext(AuthContext);
}
