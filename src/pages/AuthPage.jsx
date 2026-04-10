// AuthPage.jsx — AlphaBear · Login Only (no public register)
// Bug fix: Lucide icons TIDAK boleh dirender di luar React tree (ForwardRef error)
// Solusi: semua icon hanya dipakai di dalam JSX, bukan sebagai prop yang di-render di luar komponen

import { useState } from "react";
import { supabase } from "../lib/supabase";

const GRADIENT = "linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)";
const PURPLE   = "#C44DFF";

// ── Inline SVG icons (menggantikan lucide-react di AuthPage) ──────────────────
// Root cause error: lucide-react menggunakan React.forwardRef + useContext internal.
// Saat icon di-pass sebagai prop `icon={Mail}` lalu di-render di dalam komponen
// non-function (misal: konstanta, atau di luar StrictMode tree), React menganggap
// hooks dipanggil di luar function component → "Invalid hook call" error.
// Solusi: gunakan inline SVG sederhana di AuthPage, tidak ada dependency lucide.

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ── Shared components ─────────────────────────────────────────────────────────
const GradientText = ({ children, style = {} }) => (
  <span style={{
    background: GRADIENT,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    ...style
  }}>
    {children}
  </span>
);

const AuthInput = ({ label, IconLeft, type = "text", value, onChange, placeholder, rightSlot }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
        border: `1.5px solid ${focused ? PURPLE : "#E5E7EB"}`,
        borderRadius: 14, background: "white",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: focused ? `0 0 0 3px ${PURPLE}18` : "none"
      }}>
        {IconLeft && <IconLeft />}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: "none", outline: "none", padding: "13px 0",
            fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: "#1F2937",
            background: "transparent"
          }}
        />
        {rightSlot}
      </div>
    </div>
  );
};

const PrimaryBtn = ({ children, onClick, isLoading }) => (
  <button onClick={onClick} disabled={isLoading} style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "14px 24px", border: "none", borderRadius: 16,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
    cursor: isLoading ? "not-allowed" : "pointer",
    opacity: isLoading ? 0.75 : 1,
    background: GRADIENT, color: "white",
    boxShadow: "0 6px 24px rgba(196,77,255,0.35)",
    transition: "all 0.2s"
  }}>
    {isLoading ? <IconSpinner /> : children}
  </button>
);

const GhostBtn = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px 24px",
    border: "1.5px solid #E5E7EB", borderRadius: 16,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15,
    cursor: "pointer", background: "#F9FAFB", color: "#6B7280", transition: "all 0.2s"
  }}>
    {children}
  </button>
);

// ── Login Form ─────────────────────────────────────────────────────────────────
function LoginForm({ onForgot }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email atau password salah."
          : err.message
      );
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#1F2937" }}>
          Selamat Datang 👋
        </h2>
        <p style={{ margin: 0, color: "#9CA3AF", fontSize: 14 }}>
          Login ke akun AlphaBear kamu
        </p>
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626",
          display: "flex", alignItems: "center", gap: 8
        }}>
          ⚠️ {error}
        </div>
      )}

      <AuthInput
        label="Email"
        IconLeft={IconMail}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="nama@email.com"
      />

      <AuthInput
        label="Password"
        IconLeft={IconLock}
        type={showPw ? "text" : "password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Masukkan password"
        rightSlot={
          <button
            onClick={() => setShowPw(v => !v)}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", color: "#9CA3AF" }}
          >
            <IconEye off={showPw} />
          </button>
        }
      />

      <div style={{ textAlign: "right", marginTop: -8, marginBottom: 20 }}>
        <button onClick={onForgot} style={{
          border: "none", background: "none", cursor: "pointer",
          fontSize: 13, color: PURPLE, fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
        }}>
          Lupa password?
        </button>
      </div>

      <PrimaryBtn onClick={handleLogin} isLoading={loading}>
        <span>Login</span> <IconArrow />
      </PrimaryBtn>

      {/* ── Daftar dihapus — akun ditambah manual via Supabase dashboard ── */}
      <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#D1D5DB" }}>
        Hubungi admin untuk mendapatkan akses
      </p>
    </div>
  );
}

// ── Forgot Password Form ───────────────────────────────────────────────────────
function ForgotForm({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleReset = async () => {
    if (!email) { setError("Email wajib diisi."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
        <h3 style={{ margin: "0 0 8px", fontWeight: 800, color: "#1F2937", fontSize: 20 }}>
          Email Terkirim!
        </h3>
        <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>
          Cek inbox <strong>{email}</strong><br />untuk link reset password.
        </p>
        <GhostBtn onClick={onBack}>Kembali ke Login</GhostBtn>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={{
        border: "none", background: "none", cursor: "pointer",
        fontSize: 14, color: PURPLE, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0
      }}>
        ← Kembali
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1F2937" }}>
        Reset Password
      </h2>
      <p style={{ margin: "0 0 24px", color: "#9CA3AF", fontSize: 14 }}>
        Masukkan email dan kami kirimkan link reset.
      </p>
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
          ⚠️ {error}
        </div>
      )}
      <AuthInput
        IconLeft={IconMail}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="nama@email.com"
      />
      <PrimaryBtn onClick={handleReset} isLoading={loading}>
        Kirim Link Reset
      </PrimaryBtn>
    </div>
  );
}

// ── Main Auth Page ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState("login"); // "login" | "forgot"

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FDF4FF 0%, #F8F5FF 40%, #FFF5FB 100%)",
      fontFamily: "'DM Sans', 'Nunito', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin    { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float   { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "slideUp 0.45s ease" }}>

        {/* ── Branding ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            background: GRADIENT, borderRadius: 24,
            width: 76, height: 76,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 12px 40px rgba(196,77,255,0.35)",
            animation: "float 3s ease-in-out infinite"
          }}>
            <span style={{ fontSize: 34 }}>🐻</span>
          </div>
          <GradientText style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
            AlphaBear
          </GradientText>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9CA3AF" }}>
            Keuangan Keluarga · Aman & Privat
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: "white", borderRadius: 28, padding: 28,
          boxShadow: "0 8px 48px rgba(180,120,255,0.12), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid rgba(233,213,255,0.5)"
        }}>
          {view === "login"  && <LoginForm  onForgot={() => setView("forgot")} />}
          {view === "forgot" && <ForgotForm onBack={() => setView("login")}   />}
        </div>

        {/* ── Footer note ── */}
        <div style={{
          textAlign: "center", marginTop: 20, fontSize: 12, color: "#9CA3AF",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          <span>🔒</span>
          <span>Data dienkripsi & diamankan oleh Supabase</span>
        </div>
      </div>
    </div>
  );
}
