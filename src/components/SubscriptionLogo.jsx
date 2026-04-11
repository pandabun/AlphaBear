/**
 * src/components/SubscriptionLogo.jsx
 *
 * Strategy logo (berurutan, fallback ke berikutnya jika gagal):
 * 1. SVG inline hardcoded — untuk ~30 brand paling umum (100% reliable, no network)
 * 2. Google Favicon API (sz=128) — tidak butuh API key, jarang diblok
 * 3. Inisial berwarna — selalu berhasil
 */

import { useState } from 'react';

// ─── Warna & inisial fallback ─────────────────────────────────────────────────
const FALLBACK_COLORS = [
  '#FF6B9D','#C44DFF','#8B5CF6','#3B82F6',
  '#10B981','#F59E0B','#EF4444','#06B6D4',
  '#84CC16','#F97316','#EC4899','#6366F1',
];
function getColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length];
}
function getInitials(name) {
  return name.split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()||'').join('') || '?';
}

// ─── SVG Inline untuk brand utama ────────────────────────────────────────────
// Semua SVG ini berbasis path resmi / well-known brand marks
// bg = warna background icon, fg = warna logo di atasnya
const BRAND_SVG = {
  // Netflix — N merah
  netflix: { bg: '#000000', svg: <svg viewBox="0 0 24 24" fill="none"><path d="M5 2h3.5l3.5 10V2H15.5V22H12L8.5 12V22H5V2z" fill="#E50914"/></svg> },

  // Spotify — lingkaran hijau + gelombang
  spotify: { bg: '#1DB954', svg: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path d="M7 15.5c2.8-1.7 6.3-1.8 9.2-.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M6.5 12.5c3.5-2 7.8-2.1 11.1-.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M6 9.5c4-2.3 9.2-2.4 13-.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg> },

  // YouTube — play button merah
  youtube: { bg: '#FF0000', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#FF0000"/><polygon points="10,8 10,16 17,12" fill="white"/></svg> },

  // Apple / iCloud — apel putih
  apple: { bg: '#000000', svg: <svg viewBox="0 0 24 24"><path d="M17.05 12.536c-.02-2.042 1.664-3.024 1.74-3.073-0.95-1.384-2.422-1.573-2.944-1.594-1.256-.127-2.452.74-3.087.74-.634 0-1.614-.724-2.654-.703-1.365.02-2.624.794-3.328 2.018-1.42 2.464-.364 6.117 1.02 8.117.676.98 1.48 2.08 2.535 2.04 1.02-.04 1.404-.657 2.636-.657 1.23 0 1.574.657 2.655.636 1.096-.02 1.79-1 2.46-1.98.775-1.135 1.094-2.235 1.11-2.292-.024-.012-2.13-.82-2.143-3.252z" fill="white"/><path d="M15.24 5.57c.562-.68.942-1.626.838-2.57-.81.033-1.79.54-2.37 1.22-.52.6-.975 1.56-.853 2.48.903.07 1.824-.455 2.385-1.13z" fill="white"/></svg> },

  // iCloud — alias ke apple
  icloud: { bg: '#3478F6', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#3478F6"/><path d="M17.5 10.5A4 4 0 0 0 10 9.1 3 3 0 0 0 7 12H7a3 3 0 0 0 3 3h7a2.5 2.5 0 0 0 .5-5z" fill="white"/></svg> },

  // Disney+ — teks biru
  disney: { bg: '#113CCF', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#113CCF"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="serif">D+</text></svg> },

  // Google / Google One — G warna-warni
  google: { bg: '#FFFFFF', svg: <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },

  // Microsoft / OneDrive / Office 365
  microsoft: { bg: '#FFFFFF', svg: <svg viewBox="0 0 24 24"><rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/><rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/><rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/><rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/></svg> },

  // Notion — N hitam
  notion: { bg: '#FFFFFF', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FFFFFF" stroke="#E5E7EB"/><path d="M7 7h10M7 12h10M7 17h6" stroke="#000000" strokeWidth="2" strokeLinecap="round"/></svg> },

  // Adobe / Adobe CC — merah
  adobe: { bg: '#FF0000', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FF0000"/><path d="M12 4L4 20h4l1.5-4h5L16 20h4L12 4zm0 5l1.8 5H10.2L12 9z" fill="white"/></svg> },

  // Figma
  figma: { bg: '#FFFFFF', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FFFFFF" stroke="#E5E7EB"/><path d="M8 2h4a4 4 0 0 1 0 8H8V2z" fill="#FF7262"/><path d="M8 10h4a4 4 0 0 1 0 8H8v-8z" fill="#A259FF"/><path d="M8 18a4 4 0 1 1 4 0H8z" fill="#0ACF83"/><path d="M8 2H4a4 4 0 0 0 0 8h4V2z" fill="#F24E1E"/><circle cx="16" cy="12" r="4" fill="#1ABCFE"/></svg> },

  // Canva
  canva: { bg: '#00C4CC', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#00C4CC"/><text x="12" y="17" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">C</text></svg> },

  // Dropbox
  dropbox: { bg: '#0061FE', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0061FE"/><path d="M12 7L8 10l4 3-4 3 4 3 4-3-4-3 4-3zM8 16l-4-3 4-3-4-3 4 3 4-3-4 3 4 3z" fill="white"/></svg> },

  // OpenAI / ChatGPT
  openai: { bg: '#000000', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000000"/><path d="M12 4.5A7.5 7.5 0 0 0 4.5 12 7.5 7.5 0 0 0 12 19.5 7.5 7.5 0 0 0 19.5 12 7.5 7.5 0 0 0 12 4.5zm0 2a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5A5.5 5.5 0 0 1 6.5 12 5.5 5.5 0 0 1 12 6.5z" fill="white"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg> },

  // Claude / Anthropic
  claude: { bg: '#CC785C', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#CC785C"/><text x="12" y="17" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">cl</text></svg> },

  // GitHub
  github: { bg: '#24292E', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#24292E"/><path d="M12 3C7.03 3 3 7.03 3 12c0 3.97 2.58 7.34 6.16 8.53.45.08.61-.2.61-.44v-1.53c-2.5.54-3.03-1.2-3.03-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.1.97 2.62.74.08-.58.31-.97.57-1.2-2-.23-4.1-1-4.1-4.45 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.38 0 0 .76-.24 2.49.93a8.73 8.73 0 0 1 2.27-.31c.77 0 1.55.1 2.27.31 1.73-1.17 2.49-.93 2.49-.93.49 1.24.18 2.15.09 2.38.58.63.93 1.43.93 2.41 0 3.46-2.11 4.22-4.12 4.44.32.28.61.83.61 1.67v2.48c0 .24.16.52.62.43C18.43 19.34 21 16 21 12c0-4.97-4.03-9-9-9z" fill="white"/></svg> },

  // Zoom
  zoom: { bg: '#2D8CFF', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2D8CFF"/><path d="M4 8h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm16 .5-4 3 4 3V8.5z" fill="white"/></svg> },

  // Slack
  slack: { bg: '#4A154B', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#4A154B"/><path d="M10 6.5A1.5 1.5 0 0 0 8.5 8v.5H7a1.5 1.5 0 0 0 0 3h1.5v1H7a1.5 1.5 0 0 0 0 3h1.5v1.5a1.5 1.5 0 0 0 3 0V16h1v1.5a1.5 1.5 0 0 0 3 0V16H17a1.5 1.5 0 0 0 0-3h-1.5v-1H17a1.5 1.5 0 0 0 0-3h-1.5V6.5a1.5 1.5 0 0 0-3 0V8h-1V6.5A1.5 1.5 0 0 0 10 6.5z" fill="white"/></svg> },

  // PlayStation
  playstation: { bg: '#003087', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#003087"/><path d="M9 17V7l2 .6v7.2l2.5-.9V7.5L16 8.5v5.5l-7 3z" fill="white"/></svg> },

  // Xbox
  xbox: { bg: '#107C10', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#107C10"/><path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm-2 11L6 9.5c.7-1.1 1.6-2 2.7-2.7L12 10l3.3-3.2c1.1.7 2 1.6 2.7 2.7L14 15l-2-2-2 2z" fill="white"/></svg> },

  // Duolingo — burung hijau
  duolingo: { bg: '#58CC02', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="8" fill="#58CC02"/><text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontFamily="sans-serif">🦉</text></svg> },

  // Grammarly
  grammarly: { bg: '#15C39A', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#15C39A"/><text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="serif">G</text></svg> },

  // NordVPN
  nordvpn: { bg: '#4687FF', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#4687FF"/><path d="M12 4L5 19h5l2-5 2 5h5L12 4z" fill="white"/></svg> },

  // Grab
  grab: { bg: '#00B14F', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#00B14F"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">grab</text></svg> },

  // Strava
  strava: { bg: '#FC4C02', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FC4C02"/><path d="M10 17l-3-6h2.5l.5 1.5L11 10l1.5 4L14 10l1.5 3H18l-4-9-4 9z" fill="white"/></svg> },

  // Headspace
  headspace: { bg: '#F47D31', svg: <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#F47D31"/><circle cx="12" cy="10" r="4" fill="white"/><path d="M5 18c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="white" strokeWidth="2" fill="none"/></svg> },
};

// ─── Domain map untuk Google Favicon fallback ─────────────────────────────────
const DOMAIN_MAP = {
  'netflix': 'netflix.com', 'disney': 'disneyplus.com', 'disney+': 'disneyplus.com',
  'disney plus': 'disneyplus.com', 'youtube': 'youtube.com', 'youtube premium': 'youtube.com',
  'youtube music': 'youtube.com', 'hbo': 'hbomax.com', 'hbo max': 'hbomax.com',
  'max': 'hbomax.com', 'hulu': 'hulu.com', 'apple tv': 'apple.com', 'apple tv+': 'apple.com',
  'vidio': 'vidio.com', 'viu': 'viu.com', 'mola': 'mola.tv', 'amazon prime': 'amazon.com',
  'prime video': 'amazon.com', 'spotify': 'spotify.com', 'apple music': 'apple.com',
  'tidal': 'tidal.com', 'deezer': 'deezer.com', 'joox': 'joox.com',
  'icloud': 'apple.com', 'icloud+': 'apple.com', 'google one': 'google.com',
  'google drive': 'google.com', 'dropbox': 'dropbox.com', 'onedrive': 'microsoft.com',
  'mega': 'mega.io', 'microsoft 365': 'microsoft.com', 'office 365': 'microsoft.com',
  'microsoft': 'microsoft.com', 'adobe': 'adobe.com', 'adobe creative cloud': 'adobe.com',
  'notion': 'notion.so', 'figma': 'figma.com', 'canva': 'canva.com',
  'zoom': 'zoom.us', 'slack': 'slack.com', 'grammarly': 'grammarly.com',
  'nordvpn': 'nordvpn.com', 'expressvpn': 'expressvpn.com', 'surfshark': 'surfshark.com',
  '1password': '1password.com', 'lastpass': 'lastpass.com', 'bitwarden': 'bitwarden.com',
  'chatgpt': 'openai.com', 'openai': 'openai.com', 'claude': 'anthropic.com',
  'anthropic': 'anthropic.com', 'midjourney': 'midjourney.com',
  'github copilot': 'github.com', 'github': 'github.com',
  'playstation': 'playstation.com', 'ps plus': 'playstation.com',
  'xbox': 'xbox.com', 'xbox game pass': 'xbox.com', 'game pass': 'xbox.com',
  'nintendo': 'nintendo.com', 'steam': 'steampowered.com', 'ea play': 'ea.com',
  'twitter': 'twitter.com', 'x premium': 'twitter.com', 'twitter blue': 'twitter.com',
  'patreon': 'patreon.com', 'substack': 'substack.com', 'medium': 'medium.com',
  'duolingo': 'duolingo.com', 'duolingo plus': 'duolingo.com',
  'grab': 'grab.com', 'grabpay': 'grab.com', 'gojek': 'gojek.com',
  'tokopedia': 'tokopedia.com', 'shopee': 'shopee.co.id',
  'strava': 'strava.com', 'headspace': 'headspace.com', 'calm': 'calm.com',
};

// ─── Resolve key dari nama ─────────────────────────────────────────────────────
function resolveKey(name) {
  const key = name.toLowerCase().trim();
  if (BRAND_SVG[key]) return key;
  // partial match ke SVG keys
  for (const k of Object.keys(BRAND_SVG)) {
    if (key.includes(k) || k.includes(key)) return k;
  }
  return null;
}

function resolveDomain(name) {
  const key = name.toLowerCase().trim();
  if (DOMAIN_MAP[key]) return DOMAIN_MAP[key];
  for (const [k, v] of Object.entries(DOMAIN_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Best-effort: pakai nama langsung sebagai domain
  const clean = key.replace(/[^a-z0-9]/g, '');
  return clean.length > 1 ? `${clean}.com` : null;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function SubscriptionLogo({ name = '', size = 44, fallbackColor }) {
  const [faviconError, setFaviconError] = useState(false);

  const svgKey     = resolveKey(name);
  const brand      = svgKey ? BRAND_SVG[svgKey] : null;
  const domain     = resolveDomain(name);
  const bgColor    = brand?.bg || fallbackColor || getColor(name);
  const initials   = getInitials(name);
  const radius     = Math.round(size * 0.25);

  // Google Favicon API — sangat reliable, tidak perlu API key
  const faviconUrl = domain && !faviconError
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  const containerStyle = {
    width:  size, height: size,
    borderRadius: radius,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bgColor,
    border: '1px solid rgba(0,0,0,0.06)',
  };

  // ── Case 1: ada SVG hardcoded → render langsung, paling reliable ─────────
  if (brand) {
    return (
      <div style={{ ...containerStyle, background: brand.bg, padding: Math.round(size * 0.15) }}>
        {brand.svg}
      </div>
    );
  }

  // ── Case 2: tidak ada SVG → coba Google Favicon ─────────────────────────
  if (faviconUrl) {
    return (
      <div style={containerStyle}>
        {/* Inisial sebagai background saat favicon loading */}
        <span style={{
          position: 'absolute',
          color: 'white', fontWeight: 700,
          fontSize: Math.round(size * 0.35),
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1,
        }}>
          {initials}
        </span>
        <img
          src={faviconUrl}
          alt={name}
          onLoad={e => {
            // Cek apakah favicon valid (Google return 16x16 dummy jika tidak ada)
            if (e.target.naturalWidth <= 16) {
              setFaviconError(true);
            } else {
              e.target.style.opacity = '1';
              e.target.previousSibling.style.display = 'none';
            }
          }}
          onError={() => setFaviconError(true)}
          style={{
            width: '75%', height: '75%',
            objectFit: 'contain',
            position: 'absolute',
            opacity: 0,
            transition: 'opacity 0.2s',
            imageRendering: 'crisp-edges',
          }}
        />
      </div>
    );
  }

  // ── Case 3: fallback inisial ─────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <span style={{
        color: 'white', fontWeight: 700,
        fontSize: Math.round(size * 0.35),
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1,
      }}>
        {initials}
      </span>
    </div>
  );
}
