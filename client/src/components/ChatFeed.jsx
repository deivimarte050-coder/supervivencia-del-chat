function getAvatarColor(username) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const idx = Math.abs((username || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return colors[idx];
}

export default function ChatFeed({ messages }) {
  const visible = (messages || []).slice(0, 3);

  return (
    <div className="chat-feed">
      {visible.map((msg) => (
        <div key={msg.id} className={`chat-message ${msg.type || 'comment'}`}>
          <div
            className="chat-avatar"
            style={{ background: getAvatarColor(msg.username) }}
          >
            {(msg.username || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="chat-username">{msg.username}</div>
            <div className="chat-text">{msg.message}</div>
          </div>
          <div className="chat-heart">
            {msg.type === 'gift' ? '🎁' : msg.type === 'join' ? '🎮' : msg.type === 'elimination' ? '💀' : '❤️'}
          </div>
        </div>
      ))}
    </div>
  );
}
