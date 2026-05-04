import { useState } from 'react';

export default function AdminPanel({ socket, gameState, onClose, socketConnected, tiktokError, onClearError }) {
  const [tiktokUser, setTiktokUser] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [showSessionHelp, setShowSessionHelp] = useState(false);
  const [manualPlayer, setManualPlayer] = useState('');
  const [elimTarget, setElimTarget] = useState('');
  const [giftUser, setGiftUser] = useState('');
  const [giftDiamonds, setGiftDiamonds] = useState('5');
  const [giftName, setGiftName] = useState('Rosa');
  const [log, setLog] = useState([]);

  const addLog = (msg) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const emit = (event, data, msg) => {
    socket.emit(event, data || {});
    addLog(msg || event);
  };

  const connectTikTok = () => {
    const clean = tiktokUser.replace(/^@/, '').trim();
    if (!clean) return;
    if (onClearError) onClearError();
    emit('connect_tiktok', { username: clean, sessionId: sessionId.trim() }, `⏳ Conectando a @${clean}...`);
  };

  const disconnectTikTok = () => {
    emit('disconnect_tiktok', {}, 'TikTok desconectado');
    if (onClearError) onClearError();
  };

  const addPlayer = () => {
    if (!manualPlayer.trim()) return;
    emit('admin_add_player', { username: manualPlayer.trim() }, `Jugador añadido: ${manualPlayer.trim()}`);
    setManualPlayer('');
  };

  const eliminatePlayer = () => {
    if (!elimTarget.trim()) return;
    emit('admin_eliminate', { username: elimTarget.trim() }, `Eliminado: ${elimTarget.trim()}`);
    setElimTarget('');
  };

  const simulateGift = () => {
    if (!giftUser.trim()) return;
    emit('admin_simulate_gift', {
      username: giftUser.trim(),
      giftName: giftName,
      diamonds: parseInt(giftDiamonds) || 5
    }, `Regalo simulado: ${giftUser.trim()} → ${giftDiamonds}💎`);
  };

  const gs = gameState;

  return (
    <div className="admin-panel">
      <div className="admin-title">
        <span>⚙️ Panel Admin</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}
        >
          ✕
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Estado</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <span className={`status-dot ${socketConnected ? 'dot-green' : 'dot-red'}`}></span>
            Servidor: {socketConnected ? 'Conectado ✅' : 'Desconectado ❌'}
          </div>
          <div>
            <span className={`status-dot ${gs.connected ? 'dot-green' : gs.tiktokConnecting ? 'dot-gray' : 'dot-red'}`}></span>
            TikTok: {gs.connected ? `🔴 LIVE @${gs.tiktokUser}` : gs.tiktokConnecting ? `⏳ conectando @${gs.tiktokUser}...` : 'Sin conectar'}
          </div>
          <div>🎮 Fase: {gs.gamePhase} | Ronda #{gs.roundNumber}</div>
          <div>👥 Jugadores: {gs.players.length} | Eliminados: {gs.eliminated.length}</div>
        </div>
      </div>

      {tiktokError && (
        <div style={{
          background: 'rgba(200,20,20,0.2)',
          border: '1px solid rgba(255,60,60,0.5)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 11,
          color: '#ff8080',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ fontWeight: 700, fontSize: 12 }}>❌ Error de conexión TikTok</div>
          <div>{tiktokError}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.4 }}>
            Verifica que:<br/>
            • El usuario esté en LIVE ahora mismo<br/>
            • El nombre sea correcto (sin @)<br/>
            • TikTok no bloquee la conexión
          </div>
          <button
            className="admin-btn btn-gray"
            style={{ fontSize: 10, padding: '4px 8px', alignSelf: 'flex-start' }}
            onClick={onClearError}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-label">Conectar TikTok Live</div>

        <input
          className="admin-input"
          placeholder="usuario TikTok (sin @)"
          value={tiktokUser}
          onChange={e => setTiktokUser(e.target.value.replace(/^@/, ''))}
          onKeyDown={e => e.key === 'Enter' && connectTikTok()}
          disabled={gs.tiktokConnecting}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            className="admin-input"
            placeholder="sessionid (cookie TikTok)"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: 10 }}
            disabled={gs.tiktokConnecting}
          />
          <button
            className="admin-btn btn-gray"
            style={{ fontSize: 11, padding: '6px 8px', whiteSpace: 'nowrap' }}
            onClick={() => setShowSessionHelp(!showSessionHelp)}
          >
            ?
          </button>
        </div>

        {showSessionHelp && (
          <div style={{
            background: 'rgba(0,100,200,0.15)',
            border: '1px solid rgba(68,138,255,0.3)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 10,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 700, color: '#448aff', marginBottom: 4 }}>📋 Cómo obtener el sessionid:</div>
            <div>1. Abre <b>tiktok.com</b> en Chrome y entra a tu cuenta</div>
            <div>2. Presiona <b>F12</b> → pestaña <b>Application</b></div>
            <div>3. Sidebar: <b>Storage → Cookies → tiktok.com</b></div>
            <div>4. Busca la cookie llamada <b>sessionid</b></div>
            <div>5. Copia el valor y pégalo aquí</div>
            <div style={{ marginTop: 6, color: 'rgba(255,200,0,0.7)' }}>
              ⚠️ El sessionid expira. Si falla, sácalo de nuevo.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`admin-btn ${gs.tiktokConnecting ? 'btn-gray' : 'btn-green'}`}
            style={{ flex: 1 }}
            onClick={connectTikTok}
            disabled={gs.tiktokConnecting || !tiktokUser.trim()}
          >
            {gs.tiktokConnecting ? '⏳ Conectando...' : '🔗 Conectar'}
          </button>
          <button className="admin-btn btn-gray" onClick={disconnectTikTok} title="Desconectar">
            ✕
          </button>
        </div>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
          ⚠️ El usuario debe estar en LIVE ahora mismo
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Modo Demo</div>
        <button className="admin-btn btn-blue" onClick={() => emit('start_demo', {}, 'Modo demo iniciado')}>
          🎭 Iniciar Demo (15 jugadores)
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Control de Ronda</div>
        <button className="admin-btn btn-red" onClick={() => emit('admin_restart', {}, 'Ronda reiniciada')}>
          🔄 Reiniciar Ronda
        </button>
        <button className="admin-btn btn-orange" onClick={() => emit('admin_chaos', {}, 'Evento caos forzado')}>
          🌪️ Forzar Evento Caos
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Añadir Jugador Manual</div>
        <input
          className="admin-input"
          placeholder="Nombre de usuario"
          value={manualPlayer}
          onChange={e => setManualPlayer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPlayer()}
        />
        <button className="admin-btn btn-green" onClick={addPlayer}>
          ➕ Añadir Jugador
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Eliminar Jugador Manual</div>
        <select
          className="admin-input"
          value={elimTarget}
          onChange={e => setElimTarget(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Seleccionar jugador —</option>
          {gs.players.map(p => (
            <option key={p.id} value={p.username}>{p.username}</option>
          ))}
        </select>
        <button className="admin-btn btn-red" onClick={eliminatePlayer} disabled={!elimTarget}>
          💀 Eliminar
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Simular Regalo</div>
        <select
          className="admin-input"
          value={giftUser}
          onChange={e => setGiftUser(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Seleccionar donante —</option>
          {gs.players.map(p => (
            <option key={p.id} value={p.username}>{p.username}</option>
          ))}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <select
            className="admin-input"
            value={giftName}
            onChange={e => setGiftName(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="Rosa">🌹 Rosa (5💎)</option>
            <option value="León">🦁 León (200💎)</option>
            <option value="Galaxia">🌀 Galaxia (1000💎)</option>
          </select>
          <input
            className="admin-input"
            type="number"
            placeholder="💎 Diamantes"
            value={giftDiamonds}
            onChange={e => setGiftDiamonds(e.target.value)}
            min="1"
          />
        </div>
        <button className="admin-btn btn-orange" onClick={simulateGift} disabled={!giftUser}>
          🎁 Enviar Regalo
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-section-label">🏆 Ganadores</div>
        {gs.winners.length === 0 ? (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Sin ganadores aún</div>
        ) : (
          gs.winners.slice(0, 5).map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: 'rgba(255,215,0,0.7)', padding: '3px 0' }}>
              🏆 Ronda {w.round}: {w.username}
            </div>
          ))
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-label">Log de Eventos</div>
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 8,
            padding: '8px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace'
          }}
        >
          {log.length === 0 ? (
            <div>Sin eventos aún...</div>
          ) : (
            log.map((l, i) => <div key={i} style={{ marginBottom: 2 }}>{l}</div>)
          )}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
