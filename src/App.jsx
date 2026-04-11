// ─── App.jsx — AlphaBear Finance Tracker ─────────────────────────────────────
// Fix: SEMUA lucide icon dihapus dari App.jsx dan diganti inline SVG.
// Root cause: lucide-react menggunakan React.forwardRef + useContext internal.
// Ketika icon di-pass sebagai prop object (icon: Home) lalu dirender sebagai
// <cat.icon />, React tidak bisa track hook call-nya → "Invalid hook call" crash.
// Solusi: inline SVG tidak punya hook, tidak bisa crash.

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./context/AuthContext";
import { useTransactions, useGoals, useSubscriptions } from "./hooks/useData";
import { useSessionRecovery } from "./hooks/useSessionRecovery";
import { usePWA } from "./hooks/usePWA";
import InstallBanner from "./components/InstallBanner";
import ScanPage from "./pages/ScanPage";
import SubscriptionLogo from "./components/SubscriptionLogo";

// ─── Theme ────────────────────────────────────────────────────────────────────
const GRADIENT = "linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)";
const PINK   = "#FF6B9D";
const PURPLE = "#C44DFF";

// ─── Inline SVG Icons (zero dependencies, zero hooks) ────────────────────────
const Svg = ({ children, size = 20, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

// Nav icons
const IcoHome      = ({s,c}) => <Svg size={s} color={c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IcoWallet    = ({s,c}) => <Svg size={s} color={c}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={c}/></Svg>;
const IcoBar       = ({s,c}) => <Svg size={s} color={c}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Svg>;
const IcoBell      = ({s,c}) => <Svg size={s} color={c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
const IcoScan      = ({s,c}) => <Svg size={s} color={c}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></Svg>;
const IcoUser      = ({s,c}) => <Svg size={s} color={c}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;

// Category icons
const IcoHouseC    = ({c}) => <Svg size={18} color={c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IcoBag       = ({c}) => <Svg size={18} color={c}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Svg>;
const IcoPlane     = ({c}) => <Svg size={18} color={c}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.9.4-2.6 1L11 8.2 3.8 6.1 2 8l6.9 4.2-1.7 3.7L4 17l2 2 2.1-1.2L11.8 22l2-1.8z"/></Svg>;
const IcoBriefcase = ({c}) => <Svg size={18} color={c}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Svg>;
const IcoDumbbell  = ({c}) => <Svg size={18} color={c}><path d="m6.5 6.5 11 11M21 7l-3-3-7 7-3 3-3 3 3-3 3-3 7-7 3 3z"/></Svg>;
const IcoCoffee    = ({c}) => <Svg size={18} color={c}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></Svg>;
const IcoMusic     = ({c}) => <Svg size={18} color={c}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></Svg>;

// Action icons
const IcoPlus      = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const IcoX         = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const IcoCheck     = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><polyline points="20 6 9 17 4 12"/></Svg>;
const IcoTrash     = ({s=14,c="#EF4444"})      => <Svg size={s} color={c}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>;
const IcoSearch    = ({s=16,c="#6B7280"})      => <Svg size={s} color={c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
const IcoArrowUp   = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></Svg>;
const IcoArrowDn   = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></Svg>;
const IcoRefresh   = ({s=16,c="currentColor",style={}}) => <Svg size={s} color={c} style={style}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Svg>;
const IcoPiggy     = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z"/><path d="M2 9v1a2 2 0 0 0 2 2h1"/><path d="M16 11h.01"/></Svg>;
const IcoEdit      = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const IcoReceipt   = ({s=20,c="currentColor"}) => <Svg size={s} color={c}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></Svg>;
const IcoUsers     = ({s=20,c="currentColor"}) => <Svg size={s} color={c}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const IcoAlert     = ({s=14,c="white"})        => <Svg size={s} color={c}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
const IcoStar      = ({s=18,c="currentColor"}) => <Svg size={s} color={c}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const IcoLogout    = ({s=15,c="currentColor"}) => <Svg size={s} color={c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const IcoChevR     = ({s=18,c="#9CA3AF"})      => <Svg size={s} color={c}><polyline points="9 18 15 12 9 6"/></Svg>;

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "home",          label: "Rumah",      renderIcon: (c) => <IcoHouseC    c={c} />, color: "#FF6B9D" },
  { id: "shopping",      label: "Belanja",    renderIcon: (c) => <IcoBag       c={c} />, color: "#C44DFF" },
  { id: "travel",        label: "Perjalanan", renderIcon: (c) => <IcoPlane     c={c} />, color: "#8B5CF6" },
  { id: "work",          label: "Pekerjaan",  renderIcon: (c) => <IcoBriefcase c={c} />, color: "#06B6D4" },
  { id: "sport",         label: "Olahraga",   renderIcon: (c) => <IcoDumbbell  c={c} />, color: "#10B981" },
  { id: "food",          label: "Makanan",    renderIcon: (c) => <IcoCoffee    c={c} />, color: "#F59E0B" },
  { id: "entertainment", label: "Hiburan",    renderIcon: (c) => <IcoMusic     c={c} />, color: "#EF4444" },
];

// ─── Income Categories ────────────────────────────────────────────────────────
const INCOME_CATEGORIES = [
  { id: "salary",     label: "Gaji",          color: "#10B981" },
  { id: "bonus",      label: "Bonus",         color: "#06B6D4" },
  { id: "freelance",  label: "Freelance",     color: "#8B5CF6" },
  { id: "investment", label: "Investasi",     color: "#F59E0B" },
  { id: "business",   label: "Bisnis",        color: "#EF4444" },
  { id: "gift",       label: "Hadiah/Angpao", color: "#EC4899" },
  { id: "other_in",   label: "Lainnya",       color: "#6B7280" },
];

// ─── Monthly Chart Builder ────────────────────────────────────────────────────
function buildMonthlyData(transactions) {
  if (!transactions || transactions.length === 0) {
    const now = new Date();
    const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    return [{ month: BULAN[now.getMonth()], pengeluaran: 0, pemasukan: 0 }];
  }
  const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const now = new Date();
  const dates = transactions.map(t => new Date(t.date));
  const earliest = new Date(Math.min(...dates));
  const months = [];
  let cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months.slice(-6).map(({ year, month }) => {
    const label = BULAN[month];
    const txMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      month: label,
      pengeluaran: txMonth.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0),
      pemasukan:   txMonth.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0),
    };
  });
}

// ─── Format Rupiah ────────────────────────────────────────────────────────────
const rp = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

const rpShort = (n) => {
  if (Math.abs(n) >= 1_000_000_000) return `Rp${(n/1_000_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000_000)     return `Rp${(n/1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000)         return `Rp${(n/1_000).toFixed(0)}rb`;
  return rp(n);
};

// ─── Shared UI Components ─────────────────────────────────────────────────────
const GradientText = ({ children, style = {} }) => (
  <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...style }}>
    {children}
  </span>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: "white", borderRadius: 24, padding: "20px 24px",
    boxShadow: "0 4px 24px rgba(180,120,255,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    border: "1px solid rgba(255,255,255,0.8)",
    cursor: onClick ? "pointer" : "default", ...style
  }}>
    {children}
  </div>
);

const GradCard = ({ children, style = {} }) => (
  <div style={{ background: GRADIENT, borderRadius: 24, padding: 24, color: "white", boxShadow: "0 8px 32px rgba(196,77,255,0.35)", ...style }}>
    {children}
  </div>
);

const Badge = ({ children, color = PINK }) => (
  <span style={{ background: color + "18", color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{children}</span>
);

const ProgressBar = ({ value, max }) => (
  <div style={{ background: "#F3F0FF", borderRadius: 999, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, (value / Math.max(max, 1)) * 100)}%`, background: GRADIENT, height: "100%", borderRadius: 999, transition: "width 0.8s ease" }} />
  </div>
);

const NavItem = ({ renderIcon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "8px 14px", borderRadius: 16, border: "none", cursor: "pointer",
    background: active ? "rgba(196,77,255,0.1)" : "transparent",
    color: active ? PURPLE : "#9CA3AF", transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif"
  }}>
    {renderIcon(active ? PURPLE : "#9CA3AF")}
    <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</span>
  </button>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px",
        width: "100%", maxWidth: 480,
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)", maxHeight: "92vh", overflowY: "auto"
      }}>
        <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 999, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", borderRadius: 12, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IcoX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FieldInput = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB",
      fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
      color: "#1F2937", backgroundColor: "#FFFFFF", transition: "border-color 0.2s",
      colorScheme: "light", WebkitTextFillColor: "#1F2937", ...props.style
    }}
      onFocus={e => e.target.style.borderColor = PURPLE}
      onBlur={e => e.target.style.borderColor = "#E5E7EB"}
    />
  </div>
);

const FieldSelect = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB",
      fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1F2937",
      backgroundColor: "#FFFFFF", appearance: "none", colorScheme: "light", ...props.style
    }}>
      {children}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, disabled }) => {
  const pad = size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px";
  const fs  = size === "sm" ? 13 : size === "lg" ? 16 : 15;
  const vars = {
    primary: { background: GRADIENT, color: "white", boxShadow: "0 4px 16px rgba(196,77,255,0.35)", border: "none" },
    ghost:   { background: "#F9FAFB", color: "#6B7280", border: "1.5px solid #E5E7EB" },
    danger:  { background: "#FEF2F2", color: "#EF4444", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: pad, borderRadius: 14, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: fs,
      opacity: disabled ? 0.6 : 1, transition: "all 0.2s", ...vars[variant], ...style
    }}>
      {children}
    </button>
  );
};

const PageLoading = () => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <IcoRefresh s={28} c={PURPLE} style={{ animation: "spin 1s linear infinite" }} />
    <p style={{ marginTop: 12, color: "#9CA3AF", fontSize: 14 }}>Memuat data...</p>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ transactions, goals, loading }) {
  if (loading) return <PageLoading />;
  const inc  = transactions.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
  const exp  = transactions.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const bal  = inc - exp;
  const cats = CATEGORIES.map(c => ({
    ...c, total: transactions.filter(t => t.type === "expense" && t.category === c.id).reduce((s,t) => s + t.amount, 0)
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "white", borderRadius: 12, padding: "8px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: "#6B7280", marginBottom: 2 }}>{label}</div>
        {payload.map((p,i) => <div key={i} style={{ color: p.color, fontWeight: 700 }}>{rpShort(p.value)}</div>)}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <GradCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 14 }}>Saldo Tersedia</p>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>{rp(bal)}</h1>
            <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 13 }}>Periode bulan ini</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 16, padding: 12 }}>
            <IcoWallet s={24} c="white" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
          {[{ label: "Pemasukan", val: inc, Icon: IcoArrowUp }, { label: "Pengeluaran", val: exp, Icon: IcoArrowDn }].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.85, fontSize: 13, marginBottom: 4 }}>
                <item.Icon s={14} c="white" /> {item.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{rpShort(item.val)}</div>
            </div>
          ))}
        </div>
      </GradCard>

      {goals.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Target Tabungan</h2>
            <Badge color={PURPLE}>{goals.length} aktif</Badge>
          </div>
          {goals.map(g => {
            const pct = Math.round((g.current_amount / g.target) * 100);
            return (
              <div key={g.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{g.icon || "🎯"}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{g.title}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>Target: {rp(g.target)} · {g.deadline}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: PURPLE }}>{pct}%</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{rpShort(g.current_amount)}</div>
                  </div>
                </div>
                <ProgressBar value={g.current_amount} max={g.target} />
              </div>
            );
          })}
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Ringkasan Bulanan</h2>
          <Badge color={PINK}>{new Date().getFullYear()}</Badge>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={buildMonthlyData(transactions)} barGap={4}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
            <YAxis hide />
            <Tooltip content={<Tip />} />
            <Bar dataKey="pengeluaran" fill={PINK}    radius={[6,6,0,0]} name="Pengeluaran" />
            <Bar dataKey="pemasukan"   fill="#E9D5FF" radius={[6,6,0,0]} name="Pemasukan" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          {[{c:PINK,l:"Pengeluaran"},{c:"#E9D5FF",l:"Pemasukan"}].map(x => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: x.c }} /> {x.l}
            </div>
          ))}
        </div>
      </Card>

      {cats.length > 0 && (
        <Card>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Per Kategori</h2>
          {cats.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ background: c.color + "18", borderRadius: 12, padding: 8 }}>
                {c.renderIcon(c.color)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{c.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{rp(c.total)}</span>
                </div>
                <div style={{ background: "#F3F4F6", borderRadius: 999, height: 6 }}>
                  <div style={{ width: `${Math.round((c.total / exp) * 100)}%`, background: c.color, height: "100%", borderRadius: 999 }} />
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Transaksi Terbaru</h2>
          <IcoChevR />
        </div>
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 14 }}>Belum ada transaksi 💸</div>
        ) : transactions.slice(0, 5).map(tx => {
          const cat = CATEGORIES.find(c => c.id === tx.category) || CATEGORIES[0];
          return (
            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ background: cat.color + "18", borderRadius: 14, padding: 10 }}>{cat.renderIcon(cat.color)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{tx.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{tx.date}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: tx.type === "income" ? "#10B981" : "#EF4444" }}>
                {tx.type === "income" ? "+" : "-"}{rp(tx.amount)}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function Transactions({ transactions, add, remove, loading }) {
  const [modal, setModal]   = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({ type: "expense", title: "", amount: "", category: "shopping", date: new Date().toISOString().split("T")[0], note: "" });
  const activeCats = form.type === "income" ? INCOME_CATEGORIES : CATEGORIES;

  const filtered = transactions.filter(t =>
    (filter === "all" || t.type === filter) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const submit = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    await add({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
    setModal(false);
    setForm({ type: "expense", title: "", amount: "", category: "shopping", date: new Date().toISOString().split("T")[0], note: "" });
  };

  if (loading) return <PageLoading />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1F2937" }}>Dompet</h1>
        <Btn onClick={() => setModal(true)} size="sm"><IcoPlus /> Tambah</Btn>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 14, padding: "0 14px", border: "1.5px solid #E5E7EB" }}>
        <IcoSearch />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi..."
          style={{ flex: 1, border: "none", outline: "none", padding: "12px 0", fontSize: 14, fontFamily: "'DM Sans',sans-serif", background: "transparent", color: "#1F2937" }} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 4, background: "#F3F4F6", borderRadius: 14 }}>
        {[{id:"all",l:"Semua"},{id:"income",l:"Pemasukan"},{id:"expense",l:"Pengeluaran"}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flex: 1, padding: "8px", border: "none", borderRadius: 10, cursor: "pointer",
            background: filter === f.id ? "white" : "transparent",
            color: filter === f.id ? PURPLE : "#9CA3AF",
            fontWeight: filter === f.id ? 700 : 400, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
            boxShadow: filter === f.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
          }}>{f.l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
          <div style={{ color: "#9CA3AF", fontSize: 14 }}>Tidak ada transaksi</div>
        </Card>
      ) : filtered.map(tx => {
        const cat = CATEGORIES.find(c => c.id === tx.category) || CATEGORIES[0];
        return (
          <Card key={tx.id} style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: cat.color + "18", borderRadius: 14, padding: 10 }}>{cat.renderIcon(cat.color)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{tx.date} · {cat.label}</div>
                {tx.note && <div style={{ fontSize: 12, color: "#C4B5FD", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tx.type === "income" ? "#10B981" : "#EF4444" }}>
                  {tx.type === "income" ? "+" : "-"}{rp(tx.amount)}
                </div>
                <button onClick={() => remove(tx.id)} style={{ border: "none", background: "#FEF2F2", borderRadius: 10, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IcoTrash />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Transaksi">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{id:"expense",l:"Pengeluaran"},{id:"income",l:"Pemasukan"}].map(t => (
            <button key={t.id} onClick={() => setForm(f => ({...f, type: t.id, category: t.id === "income" ? "salary" : "shopping"}))} style={{
              flex: 1, padding: "10px", border: `2px solid ${form.type === t.id ? PURPLE : "#E5E7EB"}`,
              borderRadius: 12, cursor: "pointer", background: form.type === t.id ? PURPLE+"12" : "white",
              color: form.type === t.id ? PURPLE : "#9CA3AF", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans',sans-serif"
            }}>{t.l}</button>
          ))}
        </div>
        <FieldInput label="Judul" placeholder="e.g. Belanja bulanan" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
        <FieldInput label="Jumlah (Rp)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
        {form.amount && <div style={{ marginTop: -12, marginBottom: 12, fontSize: 13, color: PURPLE, fontWeight: 600 }}>{rp(parseFloat(form.amount)||0)}</div>}
        <FieldSelect label="Kategori" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
          {activeCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </FieldSelect>
        <FieldInput label="Tanggal" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
        <FieldInput label="Catatan (opsional)" placeholder="Tambah catatan..." value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={submit} disabled={saving} style={{ flex: 1 }}>
            {saving ? <IcoRefresh s={15} c="white" style={{animation:"spin 1s linear infinite"}} /> : <><IcoCheck /> Simpan</>}
          </Btn>
          <Btn onClick={() => setModal(false)} variant="ghost">Batal</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({ transactions, loading }) {
  if (loading) return <PageLoading />;
  const inc  = transactions.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
  const exp  = transactions.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const net  = inc - exp;
  const cats = CATEGORIES.map(c => ({
    name: c.label, color: c.color,
    value: transactions.filter(t => t.type === "expense" && t.category === c.id).reduce((s,t) => s + t.amount, 0)
  })).filter(c => c.value > 0);
  const RADIAN = Math.PI / 180;
  const lbl = ({ cx,cy,midAngle,innerRadius,outerRadius,value }) => {
    if (value < exp * 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN), y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{Math.round((value/exp)*100)}%</text>;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1F2937" }}>Laporan & Insight</h1>
      <GradCard>
        <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 14 }}>Kekayaan Bersih</p>
        <h2 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800 }}>{rp(net)}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <IcoArrowUp s={14} c="white" /> Pemasukan: {rp(inc)}
        </div>
        <ResponsiveContainer width="100%" height={70} style={{ marginTop: 12 }}>
          <AreaChart data={buildMonthlyData(transactions).map(m => ({...m, net: m.pemasukan - m.pengeluaran}))}>
            <Area type="monotone" dataKey="net" stroke="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.15)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GradCard>
      {cats.length > 0 ? (
        <Card>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Distribusi Pengeluaran</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={cats} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" labelLine={false} label={lbl}>
                  {cats.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {cats.map(c => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>{rpShort(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>Belum ada data pengeluaran.</Card>
      )}
      <Card>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Tren Bulanan</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={buildMonthlyData(transactions)}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
            <YAxis hide />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} formatter={v => [rp(v)]} />
            <Line type="monotone" dataKey="pemasukan"   stroke={PURPLE} strokeWidth={2.5} dot={{ fill: PURPLE, r: 4 }} name="Pemasukan" />
            <Line type="monotone" dataKey="pengeluaran" stroke={PINK}   strokeWidth={2.5} dot={{ fill: PINK, r: 4 }}   name="Pengeluaran" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { l: "Pengeluaran Terbesar", v: transactions.filter(t=>t.type==="expense").length ? rp(Math.max(...transactions.filter(t=>t.type==="expense").map(t=>t.amount))) : "Rp0", I: IcoArrowDn, c: "#EF4444" },
          { l: "Rata-rata Pengeluaran", v: exp > 0 ? rpShort(exp / Math.max(1, transactions.filter(t=>t.type==="expense").length)) : "Rp0", I: IcoBar, c: PURPLE },
          { l: "Total Pemasukan", v: rp(inc), I: IcoArrowUp, c: "#10B981" },
          { l: "Tingkat Tabungan", v: inc > 0 ? `${Math.round((net/inc)*100)}%` : "0%", I: IcoPiggy, c: PINK },
        ].map(s => (
          <Card key={s.l} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ background: s.c + "18", borderRadius: 10, padding: 6 }}><s.I s={14} c={s.c} /></div>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{s.l}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1F2937" }}>{s.v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Subscriptions (dengan SubscriptionLogo real brand) ───────────────────────
function Subscriptions({ subscriptions, add, remove, loading }) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", billing_cycle: "Monthly", next_date: "", color: PURPLE });
  const total = subscriptions.reduce((s,x) => s + (x.amount||0), 0);

  const submit = async () => {
    if (!form.name || !form.amount) return;
    setSaving(true);
    await add({ ...form, amount: parseFloat(form.amount) });
    setSaving(false); setModal(false);
    setForm({ name: "", amount: "", billing_cycle: "Monthly", next_date: "", color: PURPLE });
  };

  if (loading) return <PageLoading />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1F2937" }}>Langganan</h1>
        <Btn onClick={() => setModal(true)} size="sm"><IcoPlus /> Tambah</Btn>
      </div>
      <GradCard style={{ padding: "20px 24px" }}>
        <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 14 }}>Total Biaya per Bulan</p>
        <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800 }}>{rp(total)}</h2>
        <p style={{ margin: 0, opacity: 0.75, fontSize: 13 }}>{subscriptions.length} layanan aktif</p>
      </GradCard>
      {subscriptions.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 14 }}>
          Belum ada langganan. Tambah Netflix, Spotify, dll!
        </Card>
      ) : subscriptions.map(sub => (
        <Card key={sub.id} style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo brand real via SubscriptionLogo */}
            <SubscriptionLogo name={sub.name} size={44} fallbackColor={sub.color || PURPLE} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{sub.name}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                {sub.next_date ? `Tagihan: ${sub.next_date}` : ""}{sub.billing_cycle ? ` · ${sub.billing_cycle}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: PURPLE }}>{rp(sub.amount)}</div>
              <button onClick={() => remove(sub.id)} style={{ border: "none", background: "#FEF2F2", borderRadius: 10, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IcoTrash />
              </button>
            </div>
          </div>
        </Card>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Langganan">
        <FieldInput label="Nama Layanan" placeholder="e.g. Netflix, Spotify" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        {/* Preview logo saat mengetik nama */}
        {form.name.trim().length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F9FAFB", borderRadius: 14, padding: "10px 14px", marginTop: -8, marginBottom: 16 }}>
            <SubscriptionLogo name={form.name} size={36} fallbackColor={PURPLE} />
            <span style={{ fontSize: 13, color: "#6B7280" }}>Preview logo otomatis</span>
          </div>
        )}
        <FieldInput label="Biaya per Bulan (Rp)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
        {form.amount && <div style={{ marginTop: -12, marginBottom: 12, fontSize: 13, color: PURPLE, fontWeight: 600 }}>{rp(parseFloat(form.amount)||0)}</div>}
        <FieldSelect label="Siklus Tagihan" value={form.billing_cycle} onChange={e => setForm(f => ({...f, billing_cycle: e.target.value}))}>
          <option value="Monthly">Bulanan</option>
          <option value="Yearly">Tahunan</option>
          <option value="Weekly">Mingguan</option>
        </FieldSelect>
        <FieldInput label="Tanggal Tagihan Berikutnya" placeholder="e.g. 15 Jun" value={form.next_date} onChange={e => setForm(f => ({...f, next_date: e.target.value}))} />
        <Btn onClick={submit} disabled={saving} style={{ width: "100%" }}>
          {saving ? <IcoRefresh s={15} c="white" style={{animation:"spin 1s linear infinite"}} /> : <><IcoCheck /> Simpan</>}
        </Btn>
      </Modal>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfilePage({ profile, signOut }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => { setLoggingOut(true); await signOut(); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1F2937" }}>Profil</h1>
      <GradCard style={{ textAlign: "center", padding: "32px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999, width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>
          {profile?.full_name?.[0]?.toUpperCase() || "👤"}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{profile?.full_name || "Pengguna"}</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>{profile?.email}</p>
      </GradCard>
      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1F2937" }}>Informasi Akun</h3>
        {[{l:"Nama",v:profile?.full_name||"-"},{l:"Email",v:profile?.email||"-"},{l:"Status",v:"Aktif ✅"}].map(item => (
          <div key={item.l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 14, color: "#9CA3AF" }}>{item.l}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>{item.v}</span>
          </div>
        ))}
      </Card>
      <Card style={{ background: "linear-gradient(135deg,#FFF5F5,#FEE2E2)", border: "1px solid #FECACA" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#DC2626" }}>Keamanan Data</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Semua data keuangan dienkripsi dan disimpan di Supabase. Hanya kamu yang bisa mengaksesnya.
        </p>
        <Btn onClick={handleLogout} disabled={loggingOut} variant="danger" style={{ width: "100%", justifyContent: "center" }}>
          {loggingOut ? <IcoRefresh s={15} c="#EF4444" style={{animation:"spin 1s linear infinite"}} /> : <><IcoLogout /> Keluar dari Akun</>}
        </Btn>
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, profile, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { transactions, loading: txLoading,    add: addTx,  remove: removeTx }  = useTransactions();
  const { goals,        loading: goalsLoading }                                   = useGoals();
  const { subscriptions,loading: subsLoading,  add: addSub, remove: removeSub }  = useSubscriptions();
  const [page, setPage]             = useState("dashboard");
  const [toast, setToast]           = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // PWA: register service worker + detect install prompt
  const { isInstallable, promptInstall } = usePWA();

  const { isRecovering } = useSessionRecovery({
    onSessionExpired: () => setToast({ msg: "Sesi berakhir. Silakan login kembali.", type: "warn" })
  });

  // Helper toast untuk dipass ke ScanPage
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)" }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ background: GRADIENT, borderRadius: 999, width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(196,77,255,0.3)" }}>
            {/* 🐻‍❄️ Polar Bear */}
            <span style={{ fontSize: 28 }}>🐻‍❄️</span>
          </div>
          <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0 }}>Memuat AlphaBear...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  const NAV = [
    { id: "dashboard",     label: "Beranda",   renderIcon: (c) => <IcoHome   s={20} c={c} /> },
    { id: "transactions",  label: "Dompet",    renderIcon: (c) => <IcoWallet s={20} c={c} /> },
    { id: "reports",       label: "Laporan",   renderIcon: (c) => <IcoBar    s={20} c={c} /> },
    { id: "subscriptions", label: "Langganan", renderIcon: (c) => <IcoBell   s={20} c={c} /> },
    { id: "scan",          label: "Scan",      renderIcon: (c) => <IcoScan   s={20} c={c} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)", fontFamily: "'DM Sans','Nunito',sans-serif", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E9D5FF; border-radius: 999px; }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ping    { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2);opacity:0} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        select { appearance: none; }
        :root { color-scheme: light only; }
        input, select, textarea { color-scheme: light; background-color: #FFFFFF !important; color: #1F2937 !important; }
        /* Safe area untuk iPhone notch */
        .bottom-nav { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, maxWidth: 380, width: "calc(100% - 32px)", background: toast.type === "warn" ? "#FEF3C7" : "#F0FFF4", border: `1px solid ${toast.type === "warn" ? "#FCD34D" : "#6EE7B7"}`, borderRadius: 14, padding: "12px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
            <span style={{ fontSize: 18 }}>{toast.type === "warn" ? "⚠️" : "✅"}</span>
            <span style={{ color: "#374151", fontWeight: 500, flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}><IcoX s={14} c="#9CA3AF" /></button>
          </div>
        )}

        {/* Session recovery banner */}
        {isRecovering && (
          <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 9998, background: GRADIENT, color: "white", fontSize: 12, fontWeight: 600, padding: "6px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
            <IcoRefresh s={12} c="white" style={{animation:"spin 1s linear infinite"}} /> Memperbarui sesi...
          </div>
        )}

        {/* PWA Install Banner */}
        {isInstallable && showInstallBanner && (
          <InstallBanner
            onInstall={promptInstall}
            onDismiss={() => setShowInstallBanner(false)}
          />
        )}

        {/* Header — disembunyikan di halaman Scan karena ScanPage punya header sendiri */}
        {page !== "scan" && (
          <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, background: "rgba(253,244,255,0.88)", backdropFilter: "blur(14px)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>{greeting} 👋</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1F2937" }}>
                {profile?.full_name?.split(" ")[0] || "AlphaBear"}
              </h2>
            </div>
            <button onClick={() => setPage("profile")} style={{ background: page === "profile" ? GRADIENT : "white", border: page === "profile" ? "none" : "1.5px solid #E5E7EB", borderRadius: 14, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: 18 }}>
              {page === "profile" ? <IcoUser s={18} c="white" /> : <span>{profile?.full_name?.[0]?.toUpperCase() || "🐻‍❄️"}</span>}
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: page === "scan" ? "0" : "4px 16px 100px", overflowY: "auto", animation: "fadeIn 0.3s ease" }} key={page}>
          {page === "dashboard"     && <Dashboard     transactions={transactions} goals={goals} loading={txLoading||goalsLoading} />}
          {page === "transactions"  && <Transactions  transactions={transactions} add={addTx} remove={removeTx} loading={txLoading} />}
          {page === "reports"       && <Reports       transactions={transactions} loading={txLoading} />}
          {page === "subscriptions" && <Subscriptions subscriptions={subscriptions} add={addSub} remove={removeSub} loading={subsLoading} />}
          {page === "scan"          && (
            <ScanPage
              onSaveTransaction={addTx}
              showToast={showToast}
            />
          )}
          {page === "profile"       && <ProfilePage   profile={profile} signOut={signOut} />}
        </div>

        {/* Bottom Nav */}
        <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.93)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(233,213,255,0.4)", paddingTop: 8, paddingLeft: 8, paddingRight: 8, display: "flex", justifyContent: "space-around", zIndex: 200, boxShadow: "0 -4px 24px rgba(196,77,255,0.08)" }}>
          {NAV.map(n => <NavItem key={n.id} {...n} active={page === n.id} onClick={() => setPage(n.id)} />)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
