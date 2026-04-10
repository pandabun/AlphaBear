// ─── App.jsx — AlphaBear Finance Tracker ─────────────────────────────────────
// Fix: SEMUA lucide icon dihapus dari App.jsx dan diganti inline SVG.
// Root cause: lucide-react menggunakan React.forwardRef + useContext internal.
// Ketika icon di-pass sebagai prop object (icon: Home) lalu dirender sebagai
// <cat.icon />, React tidak bisa track hook call-nya → "Invalid hook call" crash.
// Solusi: inline SVG tidak punya hook, tidak bisa crash.

import { useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./context/AuthContext";
import { useTransactions, useGoals, useSubscriptions } from "./hooks/useData";
import { useSessionRecovery } from "./hooks/useSessionRecovery";

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
const IcoHome     = ({s,c}) => <Svg size={s} color={c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IcoWallet   = ({s,c}) => <Svg size={s} color={c}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={c}/></Svg>;
const IcoBar      = ({s,c}) => <Svg size={s} color={c}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Svg>;
const IcoBell     = ({s,c}) => <Svg size={s} color={c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
const IcoScan     = ({s,c}) => <Svg size={s} color={c}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></Svg>;
const IcoUser     = ({s,c}) => <Svg size={s} color={c}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;

// Category icons
const IcoHouseC   = ({c}) => <Svg size={18} color={c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IcoBag      = ({c}) => <Svg size={18} color={c}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Svg>;
const IcoPlane    = ({c}) => <Svg size={18} color={c}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.9.4-2.6 1L11 8.2 3.8 6.1 2 8l6.9 4.2-1.7 3.7L4 17l2 2 2.1-1.2L11.8 22l2-1.8z"/></Svg>;
const IcoBriefcase= ({c}) => <Svg size={18} color={c}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Svg>;
const IcoDumbbell = ({c}) => <Svg size={18} color={c}><path d="m6.5 6.5 11 11M21 7l-3-3-7 7-3 3-3 3 3-3 3-3 7-7 3 3z"/></Svg>;
const IcoCoffee   = ({c}) => <Svg size={18} color={c}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></Svg>;
const IcoMusic    = ({c}) => <Svg size={18} color={c}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></Svg>;

// Action icons
const IcoPlus     = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>;
const IcoX        = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const IcoCheck    = ({s=16,c="currentColor"}) => <Svg size={s} color={c}><polyline points="20 6 9 17 4 12"/></Svg>;
const IcoTrash    = ({s=14,c="#EF4444"})      => <Svg size={s} color={c}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>;
const IcoSearch   = ({s=16,c="#6B7280"})      => <Svg size={s} color={c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>;
const IcoArrowUp  = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></Svg>;
const IcoArrowDn  = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></Svg>;
const IcoRefresh  = ({s=16,c="currentColor",style={}}) => <Svg size={s} color={c} style={style}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Svg>;
const IcoPiggy    = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z"/><path d="M2 9v1a2 2 0 0 0 2 2h1"/><path d="M16 11h.01"/></Svg>;
const IcoEdit     = ({s=14,c="currentColor"}) => <Svg size={s} color={c}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const IcoReceipt  = ({s=20,c="currentColor"}) => <Svg size={s} color={c}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></Svg>;
const IcoUsers    = ({s=20,c="currentColor"}) => <Svg size={s} color={c}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const IcoAlert    = ({s=14,c="white"})        => <Svg size={s} color={c}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
const IcoStar     = ({s=18,c="currentColor"}) => <Svg size={s} color={c}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const IcoLogout   = ({s=15,c="currentColor"}) => <Svg size={s} color={c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const IcoTv       = ({s=18,c="currentColor"}) => <Svg size={s} color={c}><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></Svg>;
const IcoPhone    = ({s=18,c="currentColor"}) => <Svg size={s} color={c}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Svg>;
const IcoZap      = ({s=18,c="currentColor"}) => <Svg size={s} color={c}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
const IcoChevR    = ({s=18,c="#9CA3AF"})      => <Svg size={s} color={c}><polyline points="9 18 15 12 9 6"/></Svg>;

// ─── Categories (icon sebagai render function, bukan component reference) ─────
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
  { id: "salary",     label: "Gaji",           color: "#10B981" },
  { id: "bonus",      label: "Bonus",          color: "#06B6D4" },
  { id: "freelance",  label: "Freelance",      color: "#8B5CF6" },
  { id: "investment", label: "Investasi",      color: "#F59E0B" },
  { id: "business",   label: "Bisnis",         color: "#EF4444" },
  { id: "gift",       label: "Hadiah/Angpao",  color: "#EC4899" },
  { id: "other_in",  label: "Lainnya",         color: "#6B7280" },
];

// ─── Subscription icon map (render functions) ─────────────────────────────────
const SUB_ICON = {
  Netflix:    (c) => <IcoTv    c={c} s={18} />,
  Spotify:    (c) => <IcoMusic c={c} />,
  iCloud:     (c) => <IcoPhone c={c} s={18} />,
  "Adobe CC": (c) => <IcoZap   c={c} s={18} />,
};

// ─── Sample data ──────────────────────────────────────────────────────────────
// MONTHLY_SAMPLE diganti dengan buildMonthlyData() — dihitung dari transaksi nyata,
// mulai dari bulan pertama transaksi ada, sampai bulan berjalan.
function buildMonthlyData(transactions) {
  if (!transactions || transactions.length === 0) {
    // Fallback: tampilkan bulan berjalan saja
    const now = new Date();
    const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    return [{ month: BULAN[now.getMonth()], pengeluaran: 0, pemasukan: 0 }];
  }
  const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const now = new Date();
  // Cari bulan paling awal dari semua transaksi
  const dates = transactions.map(t => new Date(t.date));
  const earliest = new Date(Math.min(...dates));
  // Bangun daftar bulan dari earliest s.d. sekarang
  const months = [];
  let cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  // Aggregate per bulan — max 6 bulan terakhir untuk keterbacaan chart
  const result = months.slice(-6).map(({ year, month }) => {
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
  return result;
}

const SPLIT_SAMPLE = [
  { name: "Nasi Goreng",  price: 35000, qty: 2 },
  { name: "Es Teh Manis", price: 8000,  qty: 3 },
  { name: "Ayam Bakar",   price: 45000, qty: 1 },
  { name: "Jus Alpukat",  price: 15000, qty: 2 },
];

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
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 28, padding: 28, width: "100%", maxWidth: 480,
        boxShadow: "0 24px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto"
      }}>
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
          <Badge color={PINK}>2025</Badge>
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
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "expense", title: "", amount: "", category: "shopping", date: new Date().toISOString().split("T")[0], note: "" });
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
          style={{ flex: 1, border: "none", outline: "none", padding: "12px 0", fontSize: 14, fontFamily: "'DM Sans',sans-serif", background: "transparent" }} />
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{tx.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{tx.date} · {cat.label}</div>
                {tx.note && <div style={{ fontSize: 12, color: "#C4B5FD", marginTop: 2 }}>{tx.note}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

// ─── Subscriptions ────────────────────────────────────────────────────────────
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
      ) : subscriptions.map(sub => {
        const renderSubIcon = SUB_ICON[sub.name] || (() => <IcoStar s={18} c={sub.color||PURPLE} />);
        return (
          <Card key={sub.id} style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: (sub.color||PURPLE) + "18", borderRadius: 14, padding: 10 }}>
                {renderSubIcon(sub.color||PURPLE)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{sub.next_date ? `Tagihan: ${sub.next_date}` : ""} {sub.billing_cycle && `· ${sub.billing_cycle}`}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: PURPLE }}>{rp(sub.amount)}</div>
                <button onClick={() => remove(sub.id)} style={{ border: "none", background: "#FEF2F2", borderRadius: 10, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IcoTrash />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Langganan">
        <FieldInput label="Nama Layanan" placeholder="e.g. Netflix" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        <FieldInput label="Biaya per Bulan (Rp)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
        {form.amount && <div style={{ marginTop:-12, marginBottom:12, fontSize:13, color:PURPLE, fontWeight:600 }}>{rp(parseFloat(form.amount)||0)}</div>}
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

// ─── Scan Bill ────────────────────────────────────────────────────────────────
function ScanBill({ add }) {
  const [mode, setMode]       = useState(null);
  const [step, setStep]       = useState("upload");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [taxPct, setTaxPct]   = useState(10);
  const [svcPct, setSvcPct]   = useState(5);
  const [taxOn, setTaxOn]     = useState(true);
  const [svcOn, setSvcOn]     = useState(true);
  const [disc, setDisc]       = useState(0);
  const [people, setPeople]   = useState(["Saya","Budi","Sari"]);
  const [newP, setNewP]       = useState("");
  const [splitM, setSplitM]   = useState("equal");
  const [shares, setShares]   = useState({Saya:1,Budi:1,Sari:1});
  const [eForm, setEForm]     = useState({title:"Makan di Restoran",category:"food",note:""});
  const [saved, setSaved]     = useState(null);

  const sub  = items.reduce((s,i) => s + (i.price||0)*(i.qty||1), 0);
  const tax  = taxOn ? sub*(taxPct/100) : 0;
  const svc  = svcOn ? sub*(svcPct/100) : 0;
  const discA= Math.min(disc||0, sub);
  const grand= sub + tax + svc - discA;
  const perP = people.length > 0 ? grand/people.length : 0;
  const totSh= Object.values(shares).reduce((s,v) => s+(parseFloat(v)||0), 0);
  const custA= (p) => totSh > 0 ? ((parseFloat(shares[p])||0)/totSh)*grand : 0;

  const scan  = (m) => { setMode(m); setLoading(true); setStep("scanning"); setTimeout(() => { setItems(SPLIT_SAMPLE.map(i => ({...i,id:Date.now()+Math.random()}))); setStep("preview"); setLoading(false); }, 2000); };
  const manual= (m) => { setMode(m); setItems([{id:Date.now(),name:"",price:0,qty:1}]); setStep("preview"); };
  const addIt = () => setItems(p => [...p,{id:Date.now(),name:"",price:0,qty:1}]);
  const updIt = (id,f,v) => setItems(p => p.map(i => i.id===id ? {...i,[f]:f==="name"?v:(parseFloat(v)||0)} : i));
  const delIt = (id) => setItems(p => p.filter(i => i.id!==id));
  const addP  = () => { const n=newP.trim(); if(n&&!people.includes(n)){setPeople(p=>[...p,n]);setShares(s=>({...s,[n]:1}));setNewP(""); }};

  const saveExp = async () => {
    const noteArr = [eForm.note,`Subtotal ${rp(sub)}`,taxOn?`PPN ${taxPct}%: +${rp(tax)}`:"",svcOn?`Service ${svcPct}%: +${rp(svc)}`:"",discA>0?`Diskon: -${rp(discA)}`:""].filter(Boolean);
    await add({type:"expense",title:eForm.title||"Makan di Restoran",amount:grand,category:eForm.category,date:new Date().toISOString().split("T")[0],note:noteArr.join(" | ")});
    setSaved({type:"expense",amount:grand}); setStep("done");
  };
  const saveSplit = async () => {
    const my = splitM==="equal" ? perP : custA("Saya");
    await add({type:"expense",title:`Split Bill (${people.length} orang)`,amount:my,category:"food",date:new Date().toISOString().split("T")[0],note:`Bagian saya: ${rp(my)} dari total ${rp(grand)} | incl. Pajak & Service`});
    setSaved({type:"split",amount:my,people:people.length}); setStep("done");
  };
  const reset = () => { setMode(null);setStep("upload");setItems([]);setLoading(false);setTaxPct(10);setSvcPct(5);setTaxOn(true);setSvcOn(true);setDisc(0);setPeople(["Saya","Budi","Sari"]);setNewP("");setSplitM("equal");setShares({Saya:1,Budi:1,Sari:1});setEForm({title:"Makan di Restoran",category:"food",note:""});setSaved(null); };

  const TaxRow = ({ label, amount, pct, on, toggle, setPct, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
      <button onClick={toggle} style={{ width:22,height:22,borderRadius:6,border:`2px solid ${on?PURPLE:"#D1D5DB"}`,background:on?PURPLE:"white",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {on && <IcoCheck s={11} c="white" />}
      </button>
      <span style={{ flex:1,fontSize:14,color:on?"#374151":"#9CA3AF",fontWeight:500 }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
        <input type="number" value={pct} onChange={e=>setPct(parseFloat(e.target.value)||0)} disabled={!on}
          style={{ width:44,padding:"4px 6px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,textAlign:"center",outline:"none",background:on?"white":"#F9FAFB" }} />
        <span style={{ fontSize:12,color:"#9CA3AF" }}>%</span>
        <span style={{ minWidth:82,textAlign:"right",fontSize:13,fontWeight:600,color:on?color:"#D1D5DB" }}>+{rp(amount)}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <h1 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1F2937" }}>Scan Struk</h1>

      {step==="upload" && (
        <>
          <Card style={{ textAlign:"center",padding:"32px 20px" }}>
            <div style={{ background:GRADIENT,borderRadius:999,width:76,height:76,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(196,77,255,0.3)" }}>
              <IcoScan s={34} c="white" />
            </div>
            <h3 style={{ margin:"0 0 6px",fontSize:18,fontWeight:700,color:"#1F2937" }}>Scan atau Input Struk</h3>
            <p style={{ margin:"0 0 20px",color:"#9CA3AF",fontSize:13 }}>Pilih tujuan: catat sebagai pengeluaran atau bagi dengan teman.</p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
              {[{id:"expense",label:"Ke Pengeluaran",Icon:IcoReceipt,desc:"Full bill → catatanku",color:PINK},{id:"split",label:"Split Bill",Icon:IcoUsers,desc:"Bagi dengan teman",color:PURPLE}].map(m => (
                <div key={m.id} onClick={() => scan(m.id)} style={{ border:`2px solid ${m.color}30`,borderRadius:18,padding:"16px 10px",cursor:"pointer",background:m.color+"08" }}>
                  <div style={{ background:m.color+"18",borderRadius:12,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px" }}>
                    <m.Icon s={20} c={m.color} />
                  </div>
                  <div style={{ fontWeight:700,fontSize:13,color:"#1F2937",marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:11,color:"#9CA3AF" }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <Btn onClick={() => manual("expense")} variant="ghost" size="sm" style={{ justifyContent:"center" }}><IcoEdit /> Manual Expense</Btn>
              <Btn onClick={() => manual("split")}   variant="ghost" size="sm" style={{ justifyContent:"center" }}><IcoEdit /> Manual Split</Btn>
            </div>
          </Card>
          <Card style={{ background:"linear-gradient(135deg,#F0FFF4,#ECFDF5)",border:"1px solid #A7F3D0" }}>
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ background:"#10B981",borderRadius:10,padding:6,flexShrink:0 }}><IcoAlert /></div>
              <div><div style={{ fontWeight:700,fontSize:13,color:"#065F46",marginBottom:3 }}>Gemini AI OCR Ready</div>
              <div style={{ fontSize:12,color:"#6B7280" }}>Tambahkan VITE_GEMINI_API_KEY di .env.local untuk scan struk sungguhan (gratis). Demo ini pakai data simulasi.</div></div>
            </div>
          </Card>
        </>
      )}

      {step==="scanning" && (
        <Card style={{ textAlign:"center",padding:"56px 24px" }}>
          <div style={{ position:"relative",width:76,height:76,margin:"0 auto 20px" }}>
            <div style={{ position:"absolute",inset:0,borderRadius:999,background:GRADIENT,opacity:0.2,animation:"ping 1.5s ease-out infinite" }} />
            <div style={{ position:"absolute",inset:0,background:GRADIENT,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <IcoRefresh s={28} c="white" style={{ animation:"spin 1s linear infinite" }} />
            </div>
          </div>
          <h3 style={{ margin:"0 0 8px",fontWeight:700,color:"#1F2937" }}>Memindai Struk...</h3>
          <p style={{ margin:0,color:"#9CA3AF",fontSize:14 }}>AI sedang mengekstrak item</p>
        </Card>
      )}

      {step==="preview" && (
        <>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Badge color={mode==="split"?PURPLE:PINK}>{mode==="split"?"✂️ Mode Split":"🧾 Mode Expense"}</Badge>
            <button onClick={reset} style={{ fontSize:13,color:"#9CA3AF",border:"none",background:"none",cursor:"pointer" }}>← Ulang</button>
          </div>
          <Card>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:"#1F2937" }}>Item Struk</h2>
              <Btn onClick={addIt} size="sm" variant="ghost"><IcoPlus /> Tambah</Btn>
            </div>
            <div style={{ display:"flex",gap:6,marginBottom:6 }}>
              <span style={{ flex:3,fontSize:11,color:"#9CA3AF" }}>Nama Item</span>
              <span style={{ width:36,fontSize:11,color:"#9CA3AF",textAlign:"center" }}>Qty</span>
              <span style={{ flex:2,fontSize:11,color:"#9CA3AF" }}>Harga (Rp)</span>
              <span style={{ width:28 }} />
            </div>
            {items.map(item => (
              <div key={item.id} style={{ display:"flex",gap:6,alignItems:"center",marginBottom:6 }}>
                <input value={item.name} onChange={e=>updIt(item.id,"name",e.target.value)} placeholder="Nama item"
                  style={{ flex:3,padding:"8px 10px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none",fontFamily:"inherit" }} />
                <input type="number" value={item.qty} onChange={e=>updIt(item.id,"qty",e.target.value)}
                  style={{ width:36,padding:"8px 4px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none",textAlign:"center" }} />
                <input type="number" value={item.price} onChange={e=>updIt(item.id,"price",e.target.value)}
                  style={{ flex:2,padding:"8px 10px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none" }} />
                <button onClick={() => delIt(item.id)} style={{ border:"none",background:"#FEF2F2",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <IcoX s={12} c="#EF4444" />
                </button>
              </div>
            ))}
            <div style={{ marginTop:12,paddingTop:12,borderTop:"1.5px solid #F3F4F6",display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontWeight:600,fontSize:14,color:"#6B7280" }}>Subtotal</span>
              <span style={{ fontWeight:700,fontSize:14,color:"#1F2937" }}>{rp(sub)}</span>
            </div>
          </Card>

          <Card>
            <h2 style={{ margin:"0 0 4px",fontSize:16,fontWeight:700,color:"#1F2937" }}>Pajak & Biaya</h2>
            <p style={{ margin:"0 0 12px",fontSize:12,color:"#9CA3AF" }}>Toggle aktif/nonaktif, sesuaikan sesuai struk</p>
            <TaxRow label="PPN / Pajak"    amount={tax}  pct={taxPct} on={taxOn} toggle={()=>setTaxOn(v=>!v)} setPct={setTaxPct} color={PINK} />
            <TaxRow label="Biaya Layanan"  amount={svc}  pct={svcPct} on={svcOn} toggle={()=>setSvcOn(v=>!v)} setPct={setSvcPct} color={PURPLE} />
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ width:22,height:22,borderRadius:6,background:"#10B981",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <span style={{ fontSize:11,color:"white",fontWeight:800 }}>%</span>
              </div>
              <span style={{ flex:1,fontSize:14,color:"#374151",fontWeight:500 }}>Diskon / Promo</span>
              <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                <span style={{ fontSize:12,color:"#9CA3AF" }}>Rp</span>
                <input type="number" value={disc} onChange={e=>setDisc(parseFloat(e.target.value)||0)}
                  style={{ width:80,padding:"4px 8px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none" }} />
                <span style={{ minWidth:80,textAlign:"right",fontSize:13,fontWeight:600,color:"#10B981" }}>-{rp(discA)}</span>
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14 }}>
              <span style={{ fontSize:15,fontWeight:800,color:"#1F2937" }}>Grand Total</span>
              <GradientText style={{ fontSize:20,fontWeight:900 }}>{rp(grand)}</GradientText>
            </div>
          </Card>

          {mode==="expense" && (
            <Card>
              <h2 style={{ margin:"0 0 14px",fontSize:16,fontWeight:700,color:"#1F2937" }}>Simpan sebagai Pengeluaran</h2>
              <FieldInput label="Judul" value={eForm.title} onChange={e=>setEForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Makan Siang" />
              <FieldSelect label="Kategori" value={eForm.category} onChange={e=>setEForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </FieldSelect>
              <FieldInput label="Catatan (opsional)" value={eForm.note} onChange={e=>setEForm(f=>({...f,note:e.target.value}))} placeholder="Tambah catatan..." />
              <div style={{ background:"linear-gradient(135deg,#F0E6FF,#FFE6F0)",borderRadius:14,padding:"12px 16px",marginBottom:16 }}>
                <div style={{ fontSize:13,color:"#7C3AED",marginBottom:2 }}>Akan dicatat sebagai</div>
                <GradientText style={{ fontSize:18,fontWeight:800 }}>{rp(grand)}</GradientText>
              </div>
              <Btn onClick={saveExp} style={{ width:"100%",justifyContent:"center" }}><IcoCheck /> Konfirmasi & Simpan</Btn>
            </Card>
          )}

          {mode==="split" && (
            <>
              <Card>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:"#1F2937" }}>Bagi Tagihan</h2>
                  <Badge color={PINK}>{people.length} orang</Badge>
                </div>
                <div style={{ display:"flex",gap:6,background:"#F3F4F6",borderRadius:12,padding:4,marginBottom:14 }}>
                  {[{id:"equal",l:"Rata"},{id:"custom",l:"Custom %"}].map(m => (
                    <button key={m.id} onClick={()=>setSplitM(m.id)} style={{ flex:1,padding:"8px",border:"none",borderRadius:8,cursor:"pointer",background:splitM===m.id?"white":"transparent",color:splitM===m.id?PURPLE:"#9CA3AF",fontWeight:splitM===m.id?700:400,fontSize:13,fontFamily:"inherit",boxShadow:splitM===m.id?"0 2px 8px rgba(0,0,0,0.06)":"none" }}>{m.l}</button>
                  ))}
                </div>
                {people.map(p => (
                  <div key={p} style={{ display:"flex",alignItems:"center",gap:10,background:"#FAFAFA",borderRadius:12,padding:"10px 12px",marginBottom:8 }}>
                    <div style={{ background:PURPLE+"18",borderRadius:999,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:PURPLE }}>{p[0]}</div>
                    <span style={{ flex:1,fontSize:14,fontWeight:600,color:"#374151" }}>{p}</span>
                    {splitM==="custom" ? (
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <input type="number" value={shares[p]??1} onChange={e=>setShares(s=>({...s,[p]:parseFloat(e.target.value)||0}))}
                          style={{ width:48,padding:"4px 6px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none",textAlign:"center" }} />
                        <span style={{ fontSize:11,color:"#9CA3AF" }}>bagian</span>
                        <span style={{ fontSize:12,fontWeight:700,color:PURPLE,minWidth:70,textAlign:"right" }}>{rp(custA(p))}</span>
                      </div>
                    ) : (
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:13,fontWeight:700,color:PURPLE }}>{rp(perP)}</span>
                        <button onClick={()=>setPeople(prev=>prev.filter(x=>x!==p))} style={{ border:"none",background:"#FEF2F2",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                          <IcoX s={12} c="#EF4444" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display:"flex",gap:8 }}>
                  <input value={newP} onChange={e=>setNewP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()}
                    placeholder="Tambah orang..." style={{ flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,fontFamily:"inherit",outline:"none" }} />
                  <Btn onClick={addP} size="sm"><IcoPlus /></Btn>
                </div>
              </Card>
              <Card style={{ background:"linear-gradient(135deg,#F0E6FF,#FFE6F0)",border:"none" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:"0 0 4px",fontSize:13,color:"#7C3AED" }}>Bagian kamu</p>
                    <GradientText style={{ fontSize:26,fontWeight:900 }}>{rp(splitM==="equal"?perP:custA("Saya"))}</GradientText>
                    <p style={{ margin:"4px 0 0",fontSize:12,color:"#9CA3AF" }}>{rp(grand)} / {people.length} orang · incl. pajak & service</p>
                  </div>
                  <div style={{ textAlign:"right",fontSize:11,color:"#7C3AED",display:"flex",flexDirection:"column",gap:2 }}>
                    {taxOn && <span>+Pajak {taxPct}%</span>}
                    {svcOn && <span>+Service {svcPct}%</span>}
                    {discA>0 && <span style={{color:"#10B981"}}>-Diskon</span>}
                  </div>
                </div>
              </Card>
              <Btn onClick={saveSplit} style={{ width:"100%",justifyContent:"center" }}><IcoCheck /> Konfirmasi & Simpan Bagianku</Btn>
            </>
          )}
        </>
      )}

      {step==="done" && saved && (
        <Card style={{ textAlign:"center",padding:"48px 24px" }}>
          <div style={{ background:"#D1FAE5",borderRadius:999,width:76,height:76,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
            <IcoCheck s={36} c="#10B981" />
          </div>
          <h3 style={{ margin:"0 0 8px",fontSize:20,fontWeight:800,color:"#1F2937" }}>{saved.type==="split"?"Split Selesai! 🎉":"Tersimpan! 🧾"}</h3>
          <p style={{ margin:"0 0 6px",color:"#6B7280",fontSize:14 }}>{saved.type==="split"?`Bagianmu ${rp(saved.amount)} telah disimpan.`:`${rp(saved.amount)} ditambahkan ke pengeluaranmu.`}</p>
          {saved.people && <p style={{ margin:"0 0 24px",color:"#9CA3AF",fontSize:13 }}>Dibagi {saved.people} orang · incl. pajak & service</p>}
          {!saved.people && <p style={{ margin:"0 0 24px",color:"#9CA3AF",fontSize:13 }}>Lihat di tab Dompet</p>}
          <Btn onClick={reset} style={{ justifyContent:"center" }}><IcoScan s={16} c="white" /> Scan Struk Lain</Btn>
        </Card>
      )}
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2);opacity:0} }`}</style>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfilePage({ profile, signOut }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => { setLoggingOut(true); await signOut(); };
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <h1 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1F2937" }}>Profil</h1>
      <GradCard style={{ textAlign:"center",padding:"32px 24px" }}>
        <div style={{ background:"rgba(255,255,255,0.2)",borderRadius:999,width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:32 }}>
          {profile?.full_name?.[0]?.toUpperCase()||"👤"}
        </div>
        <h2 style={{ margin:"0 0 4px",fontSize:20,fontWeight:800 }}>{profile?.full_name||"Pengguna"}</h2>
        <p style={{ margin:0,opacity:0.8,fontSize:14 }}>{profile?.email}</p>
      </GradCard>
      <Card>
        <h3 style={{ margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1F2937" }}>Informasi Akun</h3>
        {[{l:"Nama",v:profile?.full_name||"-"},{l:"Email",v:profile?.email||"-"},{l:"Status",v:"Aktif ✅"}].map(item => (
          <div key={item.l} style={{ display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #F3F4F6" }}>
            <span style={{ fontSize:14,color:"#9CA3AF" }}>{item.l}</span>
            <span style={{ fontSize:14,fontWeight:600,color:"#1F2937" }}>{item.v}</span>
          </div>
        ))}
      </Card>
      <Card style={{ background:"linear-gradient(135deg,#FFF5F5,#FEE2E2)",border:"1px solid #FECACA" }}>
        <h3 style={{ margin:"0 0 8px",fontSize:14,fontWeight:700,color:"#DC2626" }}>Keamanan Data</h3>
        <p style={{ margin:"0 0 14px",fontSize:13,color:"#6B7280",lineHeight:1.6 }}>
          Semua data keuangan dienkripsi dan disimpan di Supabase. Hanya kamu yang bisa mengaksesnya.
        </p>
        <Btn onClick={handleLogout} disabled={loggingOut} variant="danger" style={{ width:"100%",justifyContent:"center" }}>
          {loggingOut ? <IcoRefresh s={15} c="#EF4444" style={{animation:"spin 1s linear infinite"}} /> : <><IcoLogout /> Keluar dari Akun</>}
        </Btn>
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, profile, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { transactions, loading: txLoading,   add: addTx,  remove: removeTx }  = useTransactions();
  const { goals,        loading: goalsLoading }                                  = useGoals();
  const { subscriptions,loading: subsLoading,  add: addSub, remove: removeSub } = useSubscriptions();
  const [page, setPage]     = useState("dashboard");
  const [toast, setToast]   = useState(null);

  const { isRecovering } = useSessionRecovery({
    onSessionExpired: () => setToast({ msg: "Sesi berakhir. Silakan login kembali.", type: "warn" })
  });

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)" }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign:"center" }}>
          <div style={{ background:GRADIENT,borderRadius:999,width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 32px rgba(196,77,255,0.3)" }}>
            <span style={{ fontSize:28 }}>🐻</span>
          </div>
          <p style={{ color:"#9CA3AF",fontSize:14,margin:0 }}>Memuat AlphaBear...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  const NAV = [
    { id: "dashboard",     label: "Beranda",   renderIcon: (c) => <IcoHome  s={20} c={c} /> },
    { id: "transactions",  label: "Dompet",    renderIcon: (c) => <IcoWallet s={20} c={c} /> },
    { id: "reports",       label: "Laporan",   renderIcon: (c) => <IcoBar   s={20} c={c} /> },
    { id: "subscriptions", label: "Langganan", renderIcon: (c) => <IcoBell  s={20} c={c} /> },
    { id: "scan",          label: "Scan",      renderIcon: (c) => <IcoScan  s={20} c={c} /> },
  ];

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(160deg,#FDF4FF 0%,#F8F5FF 40%,#FFF5FB 100%)",fontFamily:"'DM Sans','Nunito',sans-serif",display:"flex",justifyContent:"center",alignItems:"flex-start" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E9D5FF; border-radius: 999px; }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ping    { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2);opacity:0} }
        select { appearance: none; }
        /* Force light mode — prevent browser/OS dark mode from inverting form fields */
        :root { color-scheme: light only; }
        input, select, textarea { color-scheme: light; background-color: #FFFFFF !important; color: #1F2937 !important; }
      `}</style>

      <div style={{ width:"100%",maxWidth:430,minHeight:"100vh",display:"flex",flexDirection:"column" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,maxWidth:380,width:"calc(100% - 32px)",background:toast.type==="warn"?"#FEF3C7":"#F0FFF4",border:`1px solid ${toast.type==="warn"?"#FCD34D":"#6EE7B7"}`,borderRadius:14,padding:"12px 18px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:10,animation:"fadeIn 0.3s ease",fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>
            <span style={{ fontSize:18 }}>{toast.type==="warn"?"⚠️":"✅"}</span>
            <span style={{ color:"#374151",fontWeight:500,flex:1 }}>{toast.msg}</span>
            <button onClick={()=>setToast(null)} style={{ border:"none",background:"none",cursor:"pointer",padding:0,display:"flex" }}><IcoX s={14} c="#9CA3AF" /></button>
          </div>
        )}

        {/* Session recovery banner */}
        {isRecovering && (
          <div style={{ position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:9998,background:GRADIENT,color:"white",fontSize:12,fontWeight:600,padding:"6px 16px",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'DM Sans',sans-serif" }}>
            <IcoRefresh s={12} c="white" style={{animation:"spin 1s linear infinite"}} /> Memperbarui sesi...
          </div>
        )}

        {/* Header */}
        <div style={{ padding:"16px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100,background:"rgba(253,244,255,0.88)",backdropFilter:"blur(14px)" }}>
          <div>
            <p style={{ margin:0,fontSize:13,color:"#9CA3AF" }}>{greeting} 👋</p>
            <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:"#1F2937" }}>
              {profile?.full_name?.split(" ")[0] || "AlphaBear"}
            </h2>
          </div>
          <button onClick={() => setPage("profile")} style={{ background:page==="profile"?GRADIENT:"white",border:page==="profile"?"none":"1.5px solid #E5E7EB",borderRadius:14,width:40,height:40,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",fontSize:18 }}>
            {page==="profile" ? <IcoUser s={18} c="white" /> : <span>{profile?.full_name?.[0]?.toUpperCase()||"🐻"}</span>}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1,padding:"4px 16px 100px",overflowY:"auto",animation:"fadeIn 0.3s ease" }} key={page}>
          {page==="dashboard"     && <Dashboard     transactions={transactions} goals={goals}             loading={txLoading||goalsLoading} />}
          {page==="transactions"  && <Transactions  transactions={transactions} add={addTx} remove={removeTx} loading={txLoading} />}
          {page==="reports"       && <Reports       transactions={transactions} loading={txLoading} />}
          {page==="subscriptions" && <Subscriptions subscriptions={subscriptions} add={addSub} remove={removeSub} loading={subsLoading} />}
          {page==="scan"          && <ScanBill      add={addTx} />}
          {page==="profile"       && <ProfilePage   profile={profile} signOut={signOut} />}
        </div>

        {/* Bottom Nav */}
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,255,255,0.93)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(233,213,255,0.4)",padding:"8px 8px 16px",display:"flex",justifyContent:"space-around",zIndex:200,boxShadow:"0 -4px 24px rgba(196,77,255,0.08)" }}>
          {NAV.map(n => <NavItem key={n.id} {...n} active={page===n.id} onClick={()=>setPage(n.id)} />)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
