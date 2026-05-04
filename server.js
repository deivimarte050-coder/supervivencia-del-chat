const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const game = new GameManager(io);

app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/api/state', (req, res) => res.json(game.getState()));

app.post('/api/admin/restart', (req, res) => {
  game.restartRound();
  res.json({ success: true, message: 'Ronda reiniciada' });
});

app.post('/api/admin/eliminate', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username requerido' });
  game.eliminatePlayer(username, 'admin');
  res.json({ success: true });
});

app.post('/api/admin/chaos', (req, res) => {
  game.triggerChaosEvent();
  res.json({ success: true, message: 'Evento caos activado' });
});

app.post('/api/admin/add-player', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username requerido' });
  game.addPlayer(username);
  res.json({ success: true });
});

app.post('/api/admin/simulate-gift', (req, res) => {
  const { username, giftName, diamonds } = req.body;
  game.addGift(username, giftName || 'Rosa', parseInt(diamonds) || 1);
  res.json({ success: true });
});

app.post('/api/connect', (req, res) => {
  const { username, sessionId } = req.body;
  if (!username) return res.status(400).json({ error: 'Username de TikTok requerido' });
  game.connectTikTok(username, sessionId);
  res.json({ success: true, message: `Conectando a @${username}...` });
});

app.post('/api/disconnect', (req, res) => {
  game.disconnectTikTok();
  res.json({ success: true });
});

app.post('/api/demo', (req, res) => {
  game.startDemoMode();
  res.json({ success: true, message: 'Modo demo iniciado' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.emit('game_state', game.getState());

  socket.on('admin_restart', () => game.restartRound());
  socket.on('admin_eliminate', ({ username }) => game.eliminatePlayer(username, 'admin'));
  socket.on('admin_chaos', () => game.triggerChaosEvent());
  socket.on('admin_add_player', ({ username }) => game.addPlayer(username));
  socket.on('admin_simulate_gift', ({ username, giftName, diamonds }) => game.addGift(username, giftName, diamonds));
  socket.on('connect_tiktok', ({ username, sessionId }) => game.connectTikTok(username, sessionId));
  socket.on('disconnect_tiktok', () => game.disconnectTikTok());
  socket.on('start_demo', () => game.startDemoMode());

  socket.on('disconnect', () => console.log(`🔌 Cliente desconectado: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🎮 SUPERVIVENCIA DEL CHAT SERVER       ║');
  console.log(`║   http://localhost:${PORT}                  ║`);
  console.log('║   Panel Admin: click ⚙️ en la interfaz   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
