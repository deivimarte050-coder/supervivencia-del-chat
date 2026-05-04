function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TopBar({ topDonors, roundTime, gamePhase, activePlayers, maxPlayers, roundNumber }) {
  const topDonor = topDonors?.[0];
  const isFinal = gamePhase === 'final';
  const isEnded = gamePhase === 'ended';

  return (
    <div className="top-bar">
      <div className="top-card">
        <div className="top-card-label">🏆 TOP DONADOR</div>
        {topDonor ? (
          <>
            <div className="top-donor-name">{topDonor.username}</div>
            <div className="top-donor-diamonds">
              <span>💎</span>
              <span>{topDonor.donations.toLocaleString()}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            —
          </div>
        )}
      </div>

      <div className="top-card" style={{ gap: 2 }}>
        <div className="top-card-label">TIEMPO RESTANTE</div>
        <div className={`timer-value ${isFinal ? 'final' : ''}`}>
          {isEnded ? 'FIN' : formatTime(roundTime)}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
          RONDA #{roundNumber}
        </div>
      </div>

      <div className="top-card">
        <div className="top-card-label">JUGADORES</div>
        <div className="players-count">
          <span>👥</span>
          <span>{activePlayers}</span>
        </div>
        <div className="players-count-sub">de {maxPlayers}</div>
      </div>
    </div>
  );
}
