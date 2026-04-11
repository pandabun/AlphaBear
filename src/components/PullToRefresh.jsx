/**
 * src/components/PullToRefresh.jsx
 * Visual indicator pull-to-refresh — polar bear turun dari atas.
 *
 * Props:
 *   pullDistance  — px sudah ditarik (0–MAX_PULL)
 *   pullProgress  — 0.0–1.0 progress menuju threshold
 *   isRefreshing  — boolean, sedang loading
 *   isTriggered   — boolean, sudah melewati threshold
 */

const GRADIENT = 'linear-gradient(135deg, #FF6B9D 0%, #C44DFF 50%, #8B5CF6 100%)';
const MAX_PULL = 110;

export default function PullToRefresh({ pullDistance, pullProgress, isRefreshing, isTriggered }) {
  // Tidak render sama sekali kalau tidak ada aktivitas
  if (pullDistance <= 0 && !isRefreshing) return null;

  // Posisi container: turun sesuai pull
  const translateY = isRefreshing ? 0 : pullDistance - MAX_PULL;

  // Rotasi spinner berdasarkan progress (0→360 saat mencapai threshold)
  const spinDeg = isRefreshing
    ? undefined  // animasi CSS infinite saat loading
    : Math.round(pullProgress * 360);

  // Scale bear: muncul saat mendekati threshold
  const bearScale = 0.5 + pullProgress * 0.5;
  const bearOpacity = 0.3 + pullProgress * 0.7;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: `translateX(-50%) translateY(${translateY}px)`,
      zIndex: 9990,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: MAX_PULL,
      pointerEvents: 'none',
      transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
    }}>

      {/* Lingkaran background */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 4px 20px rgba(196,77,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 8,
        opacity: bearOpacity,
        transform: `scale(${bearScale})`,
        transition: pullDistance === 0 ? 'all 0.3s ease' : 'none',
      }}>

        {/* Ring progress */}
        <svg
          width="52" height="52"
          viewBox="0 0 52 52"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            transform: 'rotate(-90deg)',
            animation: isRefreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
          }}
        >
          <circle
            cx="26" cy="26" r="23"
            fill="none"
            stroke="#F0E8FF"
            strokeWidth="3"
          />
          <circle
            cx="26" cy="26" r="23"
            fill="none"
            stroke={isTriggered ? '#C44DFF' : '#FF6B9D'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 23}`}
            strokeDashoffset={
              isRefreshing
                ? `${2 * Math.PI * 23 * 0.25}` // arc saat spinning
                : `${2 * Math.PI * 23 * (1 - pullProgress)}`
            }
            style={{ transition: pullDistance === 0 ? 'stroke-dashoffset 0.3s' : 'none' }}
          />
          <style>{`
            @keyframes ptr-spin {
              from { transform: rotate(-90deg); }
              to   { transform: rotate(270deg); }
            }
          `}</style>
        </svg>

        {/* Polar bear emoji */}
        <span style={{
          fontSize: isRefreshing ? 24 : 20 + pullProgress * 4,
          lineHeight: 1,
          userSelect: 'none',
          filter: isTriggered ? 'none' : 'grayscale(0.3)',
          transition: 'font-size 0.1s, filter 0.2s',
        }}>
          🐻‍❄️
        </span>
      </div>

      {/* Label teks */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: isTriggered ? '#C44DFF' : '#C4B5FD',
        fontFamily: "'DM Sans', sans-serif",
        opacity: bearOpacity,
        transform: `scale(${bearScale})`,
        transition: pullDistance === 0 ? 'all 0.3s ease' : 'none',
        letterSpacing: 0.3,
        marginBottom: 4,
      }}>
        {isRefreshing
          ? 'Memperbarui...'
          : isTriggered
            ? 'Lepas untuk refresh ✓'
            : 'Tarik untuk refresh'}
      </div>
    </div>
  );
}
