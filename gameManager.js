class GameManager {
  constructor(io) {
    this.io = io;
    this.state = this.getInitialState();
    this.roundTimer = null;
    this.chaosTimer = null;
    this.tiktokConnection = null;
    this.startTimers();
  }

  getInitialState() {
    return {
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
      tiktokConnecting: false,
      tiktokError: null,
      tiktokUser: null,
      totalJoined: 0,
      maxPlayers: 50
    };
  }

  startTimers() {
    this.roundTimer = setInterval(() => {
      if (this.state.gamePhase === 'active' || this.state.gamePhase === 'final') {
        this.state.roundTime = Math.max(0, this.state.roundTime - 1);
        if (this.state.roundTime <= 0) this.endRound();
        if (this.state.players.length <= 10 && this.state.gamePhase === 'active') {
          this.state.gamePhase = 'final';
          this.broadcastEvent('phase_change', { phase: 'final' });
        }
        this.broadcast();
      }
    }, 1000);

    this.chaosTimer = setInterval(() => {
      if (this.state.gamePhase === 'active' || this.state.gamePhase === 'final') {
        this.state.chaosEventIn = Math.max(0, this.state.chaosEventIn - 1);
        if (this.state.chaosEventIn <= 0) {
          this.triggerChaosEvent();
          this.state.chaosEventIn = Math.floor(Math.random() * 90) + 60;
        }
        this.broadcast();
      }
    }, 1000);
  }

  addPlayer(username) {
    if (!username || typeof username !== 'string' || username.length > 50) return;
    if (this.state.gamePhase === 'ended') return;
    if (this.state.players.find(p => p.username === username)) return;
    if (this.state.players.length >= this.state.maxPlayers) return;

    const wasEliminated = this.state.eliminated.find(p => p.username === username);

    const player = {
      id: `${username}_${Date.now()}`,
      username,
      lives: 1,
      donations: wasEliminated ? wasEliminated.donations : 0,
      protectionLevel: 0,
      avatar: this.generateAvatar(username),
      joinedAt: Date.now()
    };

    if (wasEliminated) {
      this.state.eliminated = this.state.eliminated.filter(p => p.username !== username);
      this.broadcastEvent('player_revived', { username });
    }

    this.state.players.push(player);
    this.state.totalJoined++;

    if (this.state.gamePhase === 'waiting' && this.state.players.length >= 2) {
      this.state.gamePhase = 'active';
      this.broadcastEvent('game_started', {});
    }

    this.addChat({ username, message: 'ENTRO 🎮', type: 'join' });
    this.updateTopDonors();
    this.broadcast();
  }

  addGift(username, giftName, diamonds) {
    if (!username || diamonds <= 0) return;

    let donor = this.state.players.find(p => p.username === username);
    const eliminatedDonor = this.state.eliminated.find(p => p.username === username);

    if (donor) {
      donor.donations += diamonds;
    } else if (eliminatedDonor) {
      eliminatedDonor.donations += diamonds;
      this.addPlayer(username);
      donor = this.state.players.find(p => p.username === username);
      if (donor) donor.donations += diamonds;
    } else {
      this.addChat({ username, message: `🎁 ${giftName} (${diamonds} 💎)`, type: 'gift' });
      this.updateTopDonors();
      this.broadcast();
      return;
    }

    if (donor && diamonds >= 500) {
      donor.lives = Math.min(donor.lives + 1, 5);
      this.broadcastEvent('life_gained', { username, lives: donor.lives });
    }

    let eliminateCount = 1;
    if (diamonds >= 1000) eliminateCount = 5;
    else if (diamonds >= 500) eliminateCount = 3;
    else if (diamonds >= 100) eliminateCount = 2;

    if (this.state.gamePhase === 'final') eliminateCount = Math.min(eliminateCount + 1, 5);

    this.addChat({ username, message: `🎁 Envió ${giftName} (${diamonds} 💎) → elimina ${eliminateCount}`, type: 'gift' });
    this.updateTopDonors();

    for (let i = 0; i < eliminateCount; i++) {
      setTimeout(() => {
        this.eliminateByProbability(username);
        this.broadcast();
      }, i * 800);
    }

    this.broadcast();
  }

  eliminateByProbability(donorUsername) {
    const eligible = this.state.players.filter(p => p.username !== donorUsername);
    if (eligible.length === 0) return;

    const weights = eligible.map(player => {
      if (player.protectionLevel === 3) return 0;
      let weight = 100;
      if (player.protectionLevel === 2) weight *= 0.5;
      if (player.protectionLevel === 1) weight *= 0.75;
      weight = Math.max(weight - Math.min(player.donations * 0.05, 70), 1);
      return weight;
    });

    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return;

    let rand = Math.random() * total;
    for (let i = 0; i < eligible.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        this.eliminatePlayer(eligible[i].username, 'gift');
        return;
      }
    }
    this.eliminatePlayer(eligible[eligible.length - 1].username, 'gift');
  }

  eliminatePlayer(username, reason = 'gift') {
    const idx = this.state.players.findIndex(p => p.username === username);
    if (idx === -1) return;

    const player = this.state.players[idx];
    player.lives--;

    if (player.lives > 0) {
      this.broadcastEvent('life_lost', { username, livesLeft: player.lives });
      this.broadcast();
      return;
    }

    this.state.players.splice(idx, 1);
    this.state.eliminated.unshift({ ...player, eliminatedAt: Date.now(), reason });
    this.state.lastElimination = username;

    this.broadcastEvent('player_eliminated', { username, reason });
    this.addChat({ username: '💀', message: `${username} fue ELIMINADO`, type: 'elimination' });

    if (this.state.players.length === 1) {
      this.declareWinner(this.state.players[0].username);
    } else if (this.state.players.length === 0) {
      this.endRound();
    }

    this.updateTopDonors();
    this.broadcast();
  }

  triggerChaosEvent() {
    if (this.state.players.length < 2) return;
    const events = [
      { type: 'double_elimination', name: '⚡ DOBLE ELIMINACIÓN', eliminations: 2 },
      { type: 'mass_elimination', name: '💥 ELIMINACIÓN MASIVA', eliminations: 4 },
      { type: 'time_reduction', name: '⏰ REDUCCIÓN DE TIEMPO', timeReduction: 120 },
      { type: 'danger_zone', name: '🔴 ZONA DE PELIGRO', eliminations: 3 },
      { type: 'chaos', name: '🌪️ MODO CAOS TOTAL', eliminations: 2, timeReduction: 60 }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    this.state.chaosActive = true;
    this.broadcastEvent('chaos_event', event);
    this.addChat({ username: '🌪️ SISTEMA', message: `EVENTO: ${event.name}`, type: 'chaos' });

    if (event.eliminations) {
      for (let i = 0; i < event.eliminations; i++) {
        setTimeout(() => { this.eliminateByProbability('__chaos__'); this.broadcast(); }, i * 600);
      }
    }
    if (event.timeReduction) {
      this.state.roundTime = Math.max(30, this.state.roundTime - event.timeReduction);
    }

    setTimeout(() => { this.state.chaosActive = false; this.broadcast(); }, 6000);
  }

  declareWinner(username) {
    this.state.gamePhase = 'ended';
    const entry = { username, round: this.state.roundNumber, date: new Date().toISOString() };
    this.state.winners.unshift(entry);
    if (this.state.winners.length > 10) this.state.winners.pop();
    this.broadcastEvent('winner', { username });
    this.addChat({ username: '🏆 SISTEMA', message: `${username} ES EL GANADOR!`, type: 'winner' });
    this.broadcast();
    setTimeout(() => this.restartRound(), 18000);
  }

  endRound() {
    this.state.gamePhase = 'ended';
    this.broadcast();
    setTimeout(() => this.restartRound(), 10000);
  }

  restartRound() {
    const previousWinners = this.state.winners;
    const previousRound = this.state.roundNumber + 1;
    this.state = this.getInitialState();
    this.state.winners = previousWinners;
    this.state.roundNumber = previousRound;
    this.broadcast();
    this.broadcastEvent('round_restart', { round: previousRound });
  }

  updateTopDonors() {
    const all = [...this.state.players, ...this.state.eliminated];
    const sorted = all.sort((a, b) => b.donations - a.donations).filter(p => p.donations > 0);
    this.state.topDonors = sorted.slice(0, 3);

    this.state.players.forEach(p => { p.protectionLevel = 0; });
    [3, 2, 1].forEach((level, i) => {
      if (this.state.topDonors[i]) {
        const p = this.state.players.find(pl => pl.username === this.state.topDonors[i].username);
        if (p) p.protectionLevel = level;
      }
    });
  }

  generateAvatar(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F0A500', '#E74C3C'];
    const idx = Math.abs(username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;
    return colors[idx];
  }

  addChat(msg) {
    this.state.recentChat.unshift({ ...msg, id: `${Date.now()}_${Math.random()}` });
    if (this.state.recentChat.length > 25) this.state.recentChat.pop();
  }

  getState() { return this.state; }
  broadcast() { this.io.emit('game_state', this.state); }
  broadcastEvent(event, data) { this.io.emit(event, data); }

  connectTikTok(rawUsername, sessionId, ttTargetIdc) {
    const username = rawUsername.replace(/^@/, '').trim();
    if (!username) return;

    try {
      const { TikTokLiveConnection } = require('tiktok-live-connector');
      if (this.tiktokConnection) {
        try { this.tiktokConnection.disconnect(); } catch (e) {}
        this.tiktokConnection = null;
      }

      this.state.tiktokConnecting = true;
      this.state.tiktokUser = username;
      this.state.tiktokError = null;
      this.broadcast();

      const options = {};
      if (sessionId && sessionId.trim() && ttTargetIdc && ttTargetIdc.trim()) {
        options.sessionId = sessionId.trim();
        options['tt-target-idc'] = ttTargetIdc.trim();
        console.log(`[TIKTOK] Conectando con sessionId a @${username}`);
      } else {
        console.log(`[TIKTOK] Conectando sin sesion a @${username} (modo publico)`);
      }

      this.tiktokConnection = new TikTokLiveConnection(username, options);

      this.tiktokConnection.connect()
        .then((state) => {
          console.log(`✅ Conectado a TikTok Live: @${username}`, state?.roomInfo?.title || '');
          this.state.connected = true;
          this.state.tiktokConnecting = false;
          this.state.tiktokError = null;
          this.state.tiktokUser = username;
          this.broadcast();
          this.broadcastEvent('tiktok_connected', { username });
        })
        .catch(err => {
          console.error('Error conectando TikTok:', err.message);
          const msg = err.message?.includes('LIVE') || err.message?.includes('live')
            ? `@${username} no está en LIVE ahora mismo`
            : err.message?.includes('not found') || err.message?.includes('exist')
            ? `Usuario @${username} no encontrado`
            : err.message || 'Error desconocido al conectar';
          this.state.connected = false;
          this.state.tiktokConnecting = false;
          this.state.tiktokError = msg;
          this.broadcast();
          this.broadcastEvent('tiktok_error', { message: msg });
        });

      this.tiktokConnection.on('chat', (data) => {
        console.log('[CHAT RAW]', JSON.stringify(data).substring(0, 400));
        const user = data.user?.uniqueId || data.uniqueId || data.userId || data.nickname || '';
        const commentText = data.comment || data.content || data.text || '';
        const msg = commentText.trim().toUpperCase();
        console.log(`[CHAT] @${user}: ${commentText}`);
        if (msg.includes('ENTRO')) {
          console.log(`[JOIN] *** ENTRO detectado de @${user} ***`);
          this.addPlayer(user);
        }
        if (user) this.addChat({ username: user, message: commentText || '...', type: 'comment' });
        this.broadcast();
      });

      this.tiktokConnection.on('gift', (data) => {
        console.log('[GIFT RAW]', JSON.stringify(data).substring(0, 400));
        if (data.giftType === 1 && !data.repeatEnd) return;
        const user = data.user?.uniqueId || data.uniqueId || data.userId || data.nickname || '';
        const diamonds = (data.diamondCount || 0) * (data.repeatCount || 1);
        const giftName = data.gift?.name || data.giftName || data.describe || 'Regalo';
        console.log(`[GIFT] @${user}: ${giftName} (${diamonds}💎)`);
        if (user) this.addGift(user, giftName, diamonds);
      });

      this.tiktokConnection.on('like', (data) => {
        const user = data.user?.uniqueId || data.uniqueId || data.userId || data.nickname || '';
        if (user) this.addChat({ username: user, message: `❤️ x${data.likeCount || 1}`, type: 'like' });
        this.broadcast();
      });

      this.tiktokConnection.on('member', (data) => {
        const user = data.user?.uniqueId || data.uniqueId || data.userId || data.nickname || '';
        if (user) {
          console.log(`[MEMBER] @${user} se unió al live`);
          this.addChat({ username: user, message: '👋 se unió al live', type: 'join' });
        }
        this.broadcast();
      });

      this.tiktokConnection.on('streamEnd', () => {
        console.log('[TIKTOK] Stream terminado');
        this.state.connected = false;
        this.state.tiktokError = 'El live ha terminado';
        this.broadcast();
        this.broadcastEvent('tiktok_error', { message: 'El live ha terminado' });
      });

      this.tiktokConnection.on('disconnected', () => {
        console.log('[TIKTOK] Desconectado');
        this.state.connected = false;
        this.broadcast();
      });

      this.tiktokConnection.on('error', (err) => {
        console.error('[TIKTOK ERROR]', err?.message || err);
      });

    } catch (err) {
      console.error('TikTok connector error:', err.message);
      this.broadcastEvent('tiktok_error', { message: 'tiktok-live-connector no disponible. Usa modo demo.' });
    }
  }

  disconnectTikTok() {
    if (this.tiktokConnection) {
      try { this.tiktokConnection.disconnect(); } catch (e) {}
      this.tiktokConnection = null;
    }
    this.state.connected = false;
    this.state.tiktokConnecting = false;
    this.state.tiktokError = null;
    this.state.tiktokUser = null;
    this.broadcast();
  }

  startDemoMode() {
    this.restartRound();
    const users = ['LaNenaLinda', 'ElCampeon', 'Sofi_Beauty', 'MrMiguel', 'DarkAngel', 'Ferchoo', 'TikTokKing', 'PandaReal', 'LaPatrona', 'ReyDeTikTok', 'Princesa_23', 'Alexito', 'CobraKai99', 'BlazeRunner', 'NightWolf'];

    users.forEach((user, i) => {
      setTimeout(() => this.addPlayer(user), i * 400);
    });

    setTimeout(() => this.addGift('LaPatrona', 'Rosa', 5), 8000);
    setTimeout(() => this.addGift('TikTokKing', 'Rosa', 5), 10000);
    setTimeout(() => this.addGift('LaPatrona', 'León', 200), 13000);
    setTimeout(() => this.addGift('ElCampeon', 'Galaxia', 1000), 16000);
    setTimeout(() => this.addGift('PandaReal', 'Rosa', 5), 20000);
    setTimeout(() => this.addGift('LaPatrona', 'León', 200), 24000);
    setTimeout(() => this.addGift('TikTokKing', 'Galaxia', 1000), 28000);

    this.addChat({ username: 'PandaReal', message: 'ENTRO', type: 'comment' });
    this.addChat({ username: 'LaPatrona', message: 'Vamos a ganar 🔥', type: 'comment' });
    this.addChat({ username: 'TikTokKing', message: 'A eliminar 😈', type: 'comment' });
    this.broadcast();
  }
}

module.exports = GameManager;
