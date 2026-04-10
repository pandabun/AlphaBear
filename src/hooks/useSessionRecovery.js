/**
 * useSessionRecovery
 *
 * Masalah: Browser men-suspend tab yang tidak aktif.
 * Saat user kembali, Supabase mungkin belum sempat refresh token,
 * sehingga request ke DB gagal dengan 401 dan app terlihat "stuck".
 *
 * Solusi: Saat tab kembali visible, paksa getSession() ulang.
 * Jika session masih valid → update state.
 * Jika session expired → tampilkan notifikasi, redirect ke login.
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useSessionRecovery({ onSessionExpired } = {}) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastActive, setLastActive]     = useState(Date.now());

  const checkSession = useCallback(async () => {
    // Hanya jalankan jika tab sudah tidak aktif > 30 detik
    const inactiveDuration = Date.now() - lastActive;
    if (inactiveDuration < 30_000) return;

    setIsRecovering(true);

    try {
      // refreshSession akan gunakan refresh token untuk dapat access token baru
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session) {
        // Refresh token juga expired (biasanya > 7 hari tidak aktif)
        console.warn("[SessionRecovery] Refresh token expired, logging out");
        await supabase.auth.signOut();
        onSessionExpired?.();
      }
      // Session berhasil di-refresh → Supabase SDK otomatis update token
    } catch (err) {
      console.warn("[SessionRecovery] refreshSession threw:", err);
      // Jaringan bermasalah → jangan logout, beri kesempatan user coba lagi
    } finally {
      setIsRecovering(false);
    }
  }, [lastActive, onSessionExpired]);

  useEffect(() => {
    const handleHidden  = () => setLastActive(Date.now());
    const handleVisible = () => checkSession();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleHidden();
      else handleVisible();
    });

    // Juga handle saat window kembali focus (misal: pindah app di desktop)
    window.addEventListener("focus", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("focus", handleVisible);
    };
  }, [checkSession]);

  return { isRecovering };
}
