function formatChaosTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

const GIFTS = [
  { icon: '🌹', name: 'REGALO PEQUEÑO', elim: 'ELIMINA 1', color: '#ff6b9d' },
  { icon: '🦁', name: 'REGALO MEDIANO', elim: 'ELIMINA 2', color: '#ffb347' },
  { icon: '🌀', name: 'REGALO GRANDE', elim: 'ELIMINA 3', color: '#a78bfa' }
];

export default function GiftPanel({ chaosEventIn, gamePhase }) {
  const isFinal = gamePhase === 'final';

  return (
    <div className="gift-panel">
      {GIFTS.map((g, i) => (
        <div className="gift-card" key={i} style={{ borderColor: `${g.color}40` }}>
          <div className="gift-icon">{g.icon}</div>
          <div className="gift-name" style={{ color: g.color }}>{g.name}</div>
          <div className="gift-elim" style={{ color: isFinal ? '#ff4444' : '#ff2d2d' }}>
            {isFinal && i === 2 ? 'ELIMINA 5' : g.elim}
          </div>
        </div>
      ))}
      <div className="gift-card chaos">
        <div className="gift-icon">💀</div>
        <div className="chaos-label">MODO CAOS</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>PRÓXIMO EVENTO</div>
        <div className="chaos-timer">{formatChaosTime(chaosEventIn)}</div>
      </div>
    </div>
  );
}
