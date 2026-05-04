function getAvatarColor(username) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const idx = Math.abs((username || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return colors[idx];
}

export default function BottomSection({ lastElimination, eliminated, players }) {
  return (
    <div className="bottom-section">
      <div className="entro-prompt">
        <div className="entro-arrows">
          <span style={{ color: '#ff9800', fontSize: 14 }}>◀◀</span>
          <span style={{ color: '#ff6d00', fontSize: 12 }}>◀</span>
        </div>
        <div className="entro-content">
          <div className="entro-label-text">COMENTA</div>
          <div className="entro-word">ENTRO</div>
          <div className="entro-label-text">PARA JUGAR</div>
        </div>
        <div className="entro-arrows" style={{ alignItems: 'flex-end' }}>
          <span style={{ color: '#ff9800', fontSize: 12 }}>▶</span>
          <span style={{ color: '#ff6d00', fontSize: 14 }}>▶▶</span>
        </div>
      </div>

      <div className="last-elimination">
        <div className="last-elim-label">ÚLTIMA ELIMINACIÓN</div>
        {lastElimination ? (
          <div className="last-elim-player">
            <div
              className="last-elim-avatar"
              style={{ background: getAvatarColor(lastElimination) }}
            >
              <span style={{ fontSize: 14 }}>💀</span>
            </div>
            <div className="last-elim-name">{lastElimination}</div>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
            Nadie aún
          </div>
        )}
        {eliminated.length > 0 && (
          <div style={{ fontSize: 9, color: 'rgba(255,100,100,0.5)', textAlign: 'center' }}>
            {eliminated.length} eliminado{eliminated.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
