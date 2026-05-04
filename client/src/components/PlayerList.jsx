function getAvatarColor(username) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F0A500', '#E74C3C'];
  const idx = Math.abs((username || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return colors[idx];
}

function RankBadge({ rank }) {
  if (rank === 1) return <div className="rank-badge rank-gold">1</div>;
  if (rank === 2) return <div className="rank-badge rank-silver">2</div>;
  if (rank === 3) return <div className="rank-badge rank-bronze">3</div>;
  return <div className="rank-badge rank-plain">{rank}</div>;
}

function ProtectionBadge({ level }) {
  if (level === 3) return <div className="protection-badge prot-immune">🛡 PROTEGIDO</div>;
  if (level === 2) return <div className="protection-badge prot-half">🔵 PROTECCIÓN 50%</div>;
  if (level === 1) return <div className="protection-badge prot-slight">⭐ BONUS</div>;
  return <div className="prot-none">1 VIDA</div>;
}

function Lives({ count }) {
  return (
    <div className="lives-display">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <span key={i}>❤️</span>
      ))}
    </div>
  );
}

export default function PlayerList({ players, eliminated, flashPlayer }) {
  const rowClass = (p, rank) => {
    let cls = 'player-row';
    if (rank === 1) cls += ' top1';
    else if (rank === 2) cls += ' top2';
    else if (rank === 3) cls += ' top3';
    if (p.username === flashPlayer) cls += ' flash-eliminate';
    return cls;
  };

  return (
    <div className="player-list-section">
      {players.map((player, i) => {
        const rank = i + 1;
        return (
          <div key={player.id} className={rowClass(player, rank)}>
            <RankBadge rank={rank} />
            <div
              className="player-avatar"
              style={{ background: player.avatar || getAvatarColor(player.username) }}
            >
              {player.username.charAt(0).toUpperCase()}
            </div>
            <div className="player-name">{player.username}</div>
            <ProtectionBadge level={player.protectionLevel} />
            <Lives count={player.lives} />
          </div>
        );
      })}

      {eliminated.map((player) => (
        <div key={`elim_${player.id}`} className="eliminated-row">
          <div className="elim-skull-icon">💀</div>
          <div className="elim-name">Eliminado: {player.username}</div>
          <div className="elim-label">ELIMINADO</div>
          <div className="elim-skull-right">💀</div>
        </div>
      ))}
    </div>
  );
}
