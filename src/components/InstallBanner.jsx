/**
 * src/components/InstallBanner.jsx
 * Banner "Tambahkan ke Homescreen" yang muncul di bawah layar
 * Hanya muncul jika browser support A2HS dan belum diinstall
 */

import { useState } from 'react';

const GRADIENT = 'linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)';

export default function InstallBanner({ onInstall, onDismiss }) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await onInstall();
    if (!accepted) setInstalling(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // di atas bottom nav
      left: '16px',
      right: '16px',
      zIndex: 9999,
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 8px 40px rgba(180,120,255,0.25)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      border: '1.5px solid rgba(196,77,255,0.15)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Icon */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: GRADIENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '24px',
      }}>
        🐻‍❄️
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1A1035', fontFamily: "'DM Sans', sans-serif" }}>
          Pasang AlphaBear
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>
          Tambah ke homescreen untuk akses cepat
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#AAA',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            background: GRADIENT,
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: installing ? 0.7 : 1,
          }}
        >
          {installing ? '...' : 'Pasang'}
        </button>
      </div>
    </div>
  );
}
