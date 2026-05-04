import { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#FFD700', '#FF2D2D', '#00E676', '#448AFF', '#FF6D00', '#E040FB', '#fff'];

function generateConfetti() {
  return Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: `${Math.random() * 3}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
    shape: Math.random() > 0.5 ? '50%' : '2px'
  }));
}

export default function WinnerScreen({ username, winners }) {
  const [confetti] = useState(generateConfetti);
  const previousWinners = (winners || []).slice(1, 4);

  return (
    <div className="winner-screen">
      <div className="confetti-container">
        {confetti.map(c => (
          <div
            key={c.id}
            className="confetti-piece"
            style={{
              left: c.left,
              top: '-20px',
              background: c.color,
              width: c.size,
              height: c.size,
              borderRadius: c.shape,
              animationDuration: c.duration,
              animationDelay: c.delay
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        <div className="winner-trophy">🏆</div>

        <div className="winner-title">¡GANADOR!</div>

        <div className="winner-name">{username}</div>

        <div className="winner-sub">ES EL ÚLTIMO SOBREVIVIENTE</div>

        <div
          style={{
            marginTop: 24,
            padding: '12px 20px',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 12,
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)'
          }}
        >
          🔄 Nueva ronda en breve...
        </div>

        {previousWinners.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 }}>
              GANADORES ANTERIORES
            </div>
            {previousWinners.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: 'rgba(255,215,0,0.6)', marginBottom: 4 }}>
                #{i + 2} — {w.username}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
