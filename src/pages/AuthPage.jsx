/**
 * src/pages/AuthPage.jsx
 * Login + Forgot Password — NO register (admin tambah user via Supabase)
 * Update: logo 🐻‍❄️ (polar bear)
 */

import { useState } from "react";
import { supabase } from "../lib/supabase";

const GRADIENT = "linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)";
const PURPLE   = "#C44DFF";
const PINK     = "#FF6B9D";

export default function AuthPage() {
  const [mode, setMode]         = useState("login"); // "login" | "forgot"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true); setError(""); setSuccess("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message === "Invalid login credentials" ? "Email atau password salah." : err.message);
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) { setError("Masukkan email kamu."); return; }
    setLoading(true); setError(""); setSuccess("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) setError(err.message);
    else setSuccess("Link reset password telah dikirim ke email kamu. Cek inbox atau folder spam.");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FDF4FF 0%, #F8F5FF 40%, #FFF5FB 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "'DM Sans', 'Nunito', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        :root { color-scheme: light only; }
        input { color-scheme: light; background-color: #FFFFFF !important; color: #1F2937 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.4s ease" }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            background: GRADIENT,
            borderRadius: 28, width: 80, height: 80,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 12px 40px rgba(196,77,255,0.35)",
          }}>
            {/* 🐻‍❄️ Polar Bear */}
            <span style={{ fontSize: 38, lineHeight: 1 }}>🐻‍❄️</span>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#1F2937" }}>
            AlphaBear
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#9CA3AF" }}>
            Catat Keuangan Icebear
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: 28,
          padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(180,120,255,0.12), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.9)",
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
            {mode === "login" ? "Masuk ke Akun" : "Reset Password"}
          </h2>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FFF0F5", border: "1.5px solid #FFB3CC",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#CC2255", display: "flex", gap: 8, alignItems: "center"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: "#F0FFF4", border: "1.5px solid #6EE7B7",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#065F46", display: "flex", gap: 8, alignItems: "flex-start"
            }}>
              ✅ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === "login" ? handleLogin : handleForgot}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="nama@email.com"
                autoComplete="email"
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 14,
                  border: "1.5px solid #E5E7EB", fontSize: 15,
                  fontFamily: "'DM Sans', sans-serif", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = PURPLE}
                onBlur={e => e.target.style.borderColor = "#E5E7EB"}
              />
            </div>

            {/* Password (hanya di mode login) */}
            {mode === "login" && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: "100%", padding: "13px 48px 13px 16px", borderRadius: 14,
                      border: "1.5px solid #E5E7EB", fontSize: 15,
                      fontFamily: "'DM Sans', sans-serif", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = PURPLE}
                    onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 16, color: "#9CA3AF", padding: 4,
                    }}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot link */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: PURPLE, fontWeight: 600, fontFamily: "inherit" }}
                >
                  Lupa password?
                </button>
              </div>
            )}

            {mode === "forgot" && <div style={{ marginBottom: 24 }} />}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: loading ? "#E9D5FF" : GRADIENT,
                color: "white", fontSize: 15, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 20px rgba(196,77,255,0.4)",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {mode === "login" ? "Masuk..." : "Mengirim..."}
                </>
              ) : (
                mode === "login" ? "Masuk" : "Kirim Link Reset"
              )}
            </button>
          </form>

          {/* Back to login (mode forgot) */}
          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              style={{
                width: "100%", marginTop: 12, padding: "12px",
                background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#6B7280",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← Kembali ke Login
            </button>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#C4B5FD", lineHeight: 1.6 }}>
          Akun dibuat oleh admin keluarga.<br />
          Tidak ada registrasi publik. 🔒
        </p>
      </div>
    </div>
  );
}
