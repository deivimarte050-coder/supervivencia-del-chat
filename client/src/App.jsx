import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import TopBar from './components/TopBar';
import PlayerList from './components/PlayerList';
import BottomSection from './components/BottomSection';
import GiftPanel from './components/GiftPanel';
import ChatFeed from './components/ChatFeed';
import AdminPanel from './components/AdminPanel';
import WinnerScreen from './components/WinnerScreen';

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });

const INITIAL_STATE = {
  players: [],
  eliminated: [],
  topDonors: [],
  roundTime: 1200,
  maxRoundTime: 1200,
  roundNumber: 1,
  gamePhase: 'waiting',
  lastElimination: null,
  winners: [],
  recentChat: [],
  chaosEventIn: 135,
  chaosActive: false,
  connected: false,
  tiktokUser: null,
  totalJoined: 0,
  maxPlayers: 50
};

export default function App() {
  const [gs, setGs] = useState(INITIAL_STATE);
  const [showAdmin, setShowAdmin] = useState(false);
  const [chaosEvent, setChaosEvent] = useState(null);
  const [winner, setWinner] = useState(null);
  const [flashPlayer, setFlashPlayer] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [tiktokError, setTiktokError] = useState(null);
  const chaosTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('game_state', (state) => {
      setGs(state);
      if (state.tiktokError) setTiktokError(state.tiktokError);
      else if (state.connected) setTiktokError(null);
    });

    socket.on('player_eliminated', ({ username }) => {
      setFlashPlayer(username);
      setTimeout(() => setFlashPlayer(null), 1500);
    });

    socket.on('chaos_event', (event) => {
      setChaosEvent(event);
      if (chaosTimeoutRef.current) clearTimeout(chaosTimeoutRef.current);
      chaosTimeoutRef.current = setTimeout(() => setChaosEvent(null), 5500);
    });

    socket.on('winner', ({ username }) => {
      setWinner(username);
      setTimeout(() => setWinner(null), 18000);
    });

    socket.on('round_restart', () => {
      setWinner(null);
      setChaosEvent(null);
    });

    socket.on('tiktok_error', ({ message }) => {
      setTiktokError(message);
    });

    socket.on('tiktok_connected', () => {
      setTiktokError(null);
    });

    return () => {
      socket.removeAllListeners();
      if (chaosTimeoutRef.current) clearTimeout(chaosTimeoutRef.current);
    };
  }, []);

  const phaseLabel = {
    waiting: '⏳ ESPERANDO JUGADORES',
    active: '🟢 RONDA EN CURSO',
    final: '🔴 FASE FINAL',
    ended: '🏁 RONDA TERMINADA'
  }[gs.gamePhase] || '';

  const phaseClass = {
    waiting: 'phase-waiting',
    active: 'phase-active',
    final: 'phase-final',
    ended: 'phase-ended'
  }[gs.gamePhase] || '';

  return (
    <div
      className="app-root"
      style={{
        filter: gs.chaosActive ? 'saturate(1.4) hue-rotate(8deg)' : 'none',
        transition: 'filter 0.3s'
      }}
    >
      {chaosEvent && (
        <div className="chaos-overlay">
          <div className="chaos-content">
            <div style={{ fontSize: 36 }}>🌪️</div>
            <div className="chaos-name">{chaosEvent.name}</div>
            {chaosEvent.eliminations && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                💀 Eliminando {chaosEvent.eliminations} jugadores
              </div>
            )}
            {chaosEvent.timeReduction && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                ⏰ -{chaosEvent.timeReduction}s del reloj
              </div>
            )}
          </div>
        </div>
      )}

      {winner && <WinnerScreen username={winner} winners={gs.winners} />}

      <TopBar
        topDonors={gs.topDonors}
        roundTime={gs.roundTime}
        gamePhase={gs.gamePhase}
        activePlayers={gs.players.length}
        maxPlayers={gs.maxPlayers}
        roundNumber={gs.roundNumber}
      />

      <div className="title-section">
        <div className="title-main">SUPERVIVENCIA</div>
        <div className="title-sub">
          <span className="title-del">DEL</span>
          <span className="title-skull">☠</span>
          <span className="title-chat">CHAT</span>
        </div>
      </div>

      <div className={`phase-banner ${phaseClass}`}>{phaseLabel}</div>

      {gs.gamePhase === 'waiting' && gs.players.length === 0 ? (
        <div className="waiting-screen">
          <div className="waiting-title">COMENTA PARA UNIRTE</div>
          <div className="waiting-entro">ENTRO</div>
          <div className="waiting-sub">Esperando jugadores...</div>
          <div className="waiting-sub" style={{ fontSize: 11, marginTop: 8 }}>
            Ronda #{gs.roundNumber} • {gs.winners.length > 0 && `Último ganador: 🏆 ${gs.winners[0].username}`}
          </div>
        </div>
      ) : (
        <PlayerList
          players={gs.players}
          eliminated={gs.eliminated.slice(0, 3)}
          flashPlayer={flashPlayer}
        />
      )}

      <BottomSection
        lastElimination={gs.lastElimination}
        eliminated={gs.eliminated}
        players={gs.players}
      />

      <GiftPanel chaosEventIn={gs.chaosEventIn} gamePhase={gs.gamePhase} />

      <ChatFeed messages={gs.recentChat} />

      <div className="status-bar">
        <span className={`status-dot ${
          !socketConnected ? 'dot-red'
          : gs.connected ? 'dot-green'
          : gs.tiktokConnecting ? 'dot-gray'
          : 'dot-gray'
        }`}></span>
        {!socketConnected ? (
          <span style={{ color: '#ff4444' }}>DESCONECTADO DEL SERVIDOR</span>
        ) : gs.connected ? (
          <span style={{ color: '#00e676' }}>🔴 LIVE @{gs.tiktokUser}</span>
        ) : gs.tiktokConnecting ? (
          <span style={{ color: '#ffb300' }}>⏳ CONECTANDO A @{gs.tiktokUser}...</span>
        ) : (
          <span>SERVIDOR ACTIVO • DEMO LISTO</span>
        )}
      </div>

      <button className="admin-toggle" onClick={() => setShowAdmin(!showAdmin)} title="Panel Admin">
        ⚙️
      </button>

      {showAdmin && (
        <AdminPanel
          socket={socket}
          gameState={gs}
          onClose={() => setShowAdmin(false)}
          socketConnected={socketConnected}
          tiktokError={tiktokError}
          onClearError={() => setTiktokError(null)}
        />
      )}
    </div>
  );
}
