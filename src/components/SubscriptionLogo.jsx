/**
 * src/components/SubscriptionLogo.jsx
 * Menampilkan logo brand asli untuk subscription
 * menggunakan Clearbit Logo API (gratis, no API key)
 *
 * Fallback: warna + inisial jika logo tidak tersedia
 */

import { useState } from 'react';

// ── Mapping nama brand → domain untuk Clearbit Logo API ──────────────────────
const BRAND_DOMAIN_MAP = {
  // Streaming video
  'netflix': 'netflix.com',
  'disney': 'disneyplus.com',
  'disney+': 'disneyplus.com',
  'disney plus': 'disneyplus.com',
  'youtube': 'youtube.com',
  'youtube premium': 'youtube.com',
  'youtube music': 'youtube.com',
  'hbo': 'hbomax.com',
  'hbo max': 'hbomax.com',
  'max': 'hbomax.com',
  'hulu': 'hulu.com',
  'apple tv': 'apple.com',
  'apple tv+': 'apple.com',
  'vidio': 'vidio.com',
  'viu': 'viu.com',
  'mola': 'mola.tv',
  'amazon prime': 'amazon.com',
  'prime video': 'amazon.com',

  // Streaming musik
  'spotify': 'spotify.com',
  'apple music': 'apple.com',
  'tidal': 'tidal.com',
  'deezer': 'deezer.com',
  'joox': 'joox.com',
  'resso': 'resso.com',

  // Cloud storage
  'icloud': 'icloud.com',
  'icloud+': 'icloud.com',
  'google one': 'google.com',
  'google drive': 'google.com',
  'dropbox': 'dropbox.com',
  'onedrive': 'microsoft.com',
  'mega': 'mega.io',
  'box': 'box.com',

  // Produktivitas & tools
  'microsoft 365': 'microsoft.com',
  'office 365': 'microsoft.com',
  'microsoft': 'microsoft.com',
  'adobe': 'adobe.com',
  'adobe creative cloud': 'adobe.com',
  'notion': 'notion.so',
  'figma': 'figma.com',
  'canva': 'canva.com',
  'zoom': 'zoom.us',
  'slack': 'slack.com',
  'grammarly': 'grammarly.com',
  'nordvpn': 'nordvpn.com',
  'expressvpn': 'expressvpn.com',
  'surfshark': 'surfshark.com',
  '1password': '1password.com',
  'lastpass': 'lastpass.com',
  'bitwarden': 'bitwarden.com',

  // AI tools
  'chatgpt': 'openai.com',
  'openai': 'openai.com',
  'claude': 'anthropic.com',
  'anthropic': 'anthropic.com',
  'midjourney': 'midjourney.com',
  'github copilot': 'github.com',
  'github': 'github.com',

  // Gaming
  'playstation': 'playstation.com',
  'ps plus': 'playstation.com',
  'ps now': 'playstation.com',
  'xbox': 'xbox.com',
  'xbox game pass': 'xbox.com',
  'game pass': 'xbox.com',
  'nintendo': 'nintendo.com',
  'steam': 'steampowered.com',
  'ea play': 'ea.com',
  'ubisoft': 'ubisoft.com',

  // Sosial media / konten
  'twitter': 'twitter.com',
  'x': 'twitter.com',
  'x premium': 'twitter.com',
  'twitter blue': 'twitter.com',
  'youtube premium music': 'youtube.com',
  'patreon': 'patreon.com',
  'substack': 'substack.com',
  'medium': 'medium.com',
  'duolingo': 'duolingo.com',
  'duolingo plus': 'duolingo.com',
  'duolingo super': 'duolingo.com',

  // Finance & utility
  'grabpay': 'grab.com',
  'gopay': 'gojek.com',
  'tokopedia': 'tokopedia.com',
  'shopee': 'shopee.co.id',

  // Fitness & lifestyle
  'strava': 'strava.com',
  'headspace': 'headspace.com',
  'calm': 'calm.com',
  'peloton': 'onepeloton.com',
  'myfitnesspal': 'myfitnesspal.com',
};

// ── Warna fallback per kategori (jika logo tidak ada) ────────────────────────
const FALLBACK_COLORS = [
  '#FF6B9D', '#C44DFF', '#8B5CF6', '#3B82F6',
  '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  '#84CC16', '#F97316', '#EC4899', '#6366F1',
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

function getDomain(name) {
  const key = name.toLowerCase().trim();
  // Exact match
  if (BRAND_DOMAIN_MAP[key]) return BRAND_DOMAIN_MAP[key];
  // Partial match
  for (const [brand, domain] of Object.entries(BRAND_DOMAIN_MAP)) {
    if (key.includes(brand) || brand.includes(key)) return domain;
  }
  return null;
}

/**
 * SubscriptionLogo
 * @param {string} name - nama subscription (e.g. "Netflix", "Spotify")
 * @param {number} size - ukuran dalam px (default 40)
 * @param {string} fallbackColor - override warna fallback
 */
export default function SubscriptionLogo({ name = '', size = 40, fallbackColor }) {
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const domain = getDomain(name);
  const logoUrl = domain && !logoError
    ? `https://logo.clearbit.com/${domain}?size=${size * 2}` // 2x untuk retina
    : null;

  const bgColor = fallbackColor || getColor(name);
  const initials = getInitials(name) || '?';
  const borderRadius = size * 0.25; // proporsional

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${borderRadius}px`,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: logoUrl && !logoError ? (logoLoaded ? 'white' : bgColor) : bgColor,
    border: logoUrl && !logoError && logoLoaded ? '1px solid #F0E8FF' : 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Fallback: inisial */}
      {(!logoUrl || logoError) && (
        <span style={{
          color: 'white',
          fontWeight: '700',
          fontSize: `${Math.round(size * 0.35)}px`,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}>
          {initials}
        </span>
      )}

      {/* Logo dari Clearbit */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoError(true)}
          style={{
            width: '72%',
            height: '72%',
            objectFit: 'contain',
            position: 'absolute',
            opacity: logoLoaded ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      )}
    </div>
  );
}
