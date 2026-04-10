import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadingTimer = useRef(null);
  const initialized  = useRef(false);

  const clearLoadingTimer = () => {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
  };

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from("profiles").select("*").eq("id", userId).single();
      if (data) setProfile(data);
    } catch { /* profile fetch gagal — non-kritis */ }
  }, []);

  const upsertProfile = useCallback(async (u) => {
    try {
      const updates = {
        id:         u.id,
        email:      u.email,
        full_name:  u.user_metadata?.full_name || u.email.split("@")[0],
        updated_at: new Date().toISOString(),
      };
      const { data } = await supabase
        .from("profiles").upsert(updates, { onConflict: "id" }).select().single();
      if (data) setProfile(data);
    } catch { /* upsert gagal — non-kritis */ }
  }, []);

  useEffect(() => {
    // Failsafe: paksa stop loading setelah 5 detik jika getSession tidak resolve
    loadingTimer.current = setTimeout(() => {
      if (!initialized.current) {
        console.warn("[Auth] getSession timeout — paksa stop loading");
        setLoading(false);
        initialized.current = true;
      }
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearLoadingTimer();
        if (error) console.warn("[Auth] getSession error:", error.message);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        setLoading(false);
        initialized.current = true;
      })
      .catch((err) => {
        console.warn("[Auth] getSession threw:", err);
        clearLoadingTimer();
        setLoading(false);
        initialized.current = true;
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
        if (event === "SIGNED_IN") upsertProfile(session.user);

        // Pastikan loading berhenti saat ada event auth apapun
        if (!initialized.current) {
          clearLoadingTimer();
          setLoading(false);
          initialized.current = true;
        }
      }
    );

    return () => { clearLoadingTimer(); subscription.unsubscribe(); };
  }, [fetchProfile, upsertProfile]);

  // Pulihkan session saat user kembali ke tab ini
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else if (!session) {
          // Session expired, tidak bisa di-refresh
          setUser(null);
          setProfile(null);
        }
      } catch { /* jaringan tidak tersedia saat tab aktif */ }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* tetap bersihkan state */ }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, isAuthenticated: !!user, refreshProfile: () => user && fetchProfile(user.id) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
