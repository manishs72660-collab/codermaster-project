import { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';

// Live-only chat scoped to a duel roomCode. Works for players during the
// duel and for spectators — everyone in the socket.io room receives every
// message, so player <-> player and player <-> spectator chat share the
// same channel. Nothing is persisted (no DB), matches/refreshes reset it.
const DuelChatPanel = ({ roomCode, userId, userName, role = 'player', accentColor = '#ffa116' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setOpen((isOpen) => {
        if (!isOpen) setUnread((u) => u + 1);
        return isOpen;
      });
    };
    socket.on('duel:chat_message', handler);
    return () => socket.off('duel:chat_message', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('duel:chat_message', {
      roomCode,
      userId,
      name: userName || 'Player',
      text: input.trim()
    });
    setInput('');
  };

  const formatTime = (d) => {
    try {
      return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .duel-chat-msgs::-webkit-scrollbar { width: 4px; }
        .duel-chat-msgs::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .duel-chat-input::placeholder { color: #484f58; }
      `}</style>

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? '#161b22' : `linear-gradient(135deg, ${accentColor}, #e08a00)`,
          border: open ? '1px solid #30363d' : 'none',
          color: open ? '#e6edf3' : '#0e1117',
          fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.4)' : `0 4px 20px ${accentColor}55`,
          transition: 'all 0.2s'
        }}
      >
        {open ? '✕' : '💬'}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, background: '#f85149',
            color: '#fff', borderRadius: '50%', minWidth: 18, height: 18,
            fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace",
            padding: '0 3px', border: '2px solid #0e1117'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 20, zIndex: 199,
          width: 320, maxWidth: 'calc(100vw - 40px)', height: 420,
          background: '#161b22', border: '1px solid #21262d', borderRadius: 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          animation: 'chatSlideUp 0.2s ease',
          fontFamily: "'Outfit', system-ui, sans-serif"
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #21262d',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#0d1117', flexShrink: 0
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>💬 Duel Chat</span>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              color: '#7d8590', fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 0.5, background: '#1c2130', padding: '2px 8px', borderRadius: 20
            }}>
              live · no history
            </span>
          </div>

          <div ref={scrollRef} className="duel-chat-msgs" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#484f58', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                No messages yet.<br />Say hello 👋
              </div>
            )}
            {messages.map((m, i) => {
              const isMe = m.userId?.toString() === userId?.toString();
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    fontSize: 10, color: '#7d8590', marginBottom: 3,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {isMe ? 'You' : m.name} · {formatTime(m.createdAt)}
                  </div>
                  <div style={{
                    maxWidth: '85%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? `${accentColor}20` : '#0d1117',
                    border: `1px solid ${isMe ? accentColor + '50' : '#21262d'}`,
                    color: '#e6edf3', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #21262d', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              className="duel-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={role === 'spectator' ? 'Cheer them on...' : 'Type a message...'}
              style={{
                flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8,
                padding: '9px 12px', color: '#e6edf3', fontSize: 13, outline: 'none',
                fontFamily: "'Outfit', sans-serif"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? accentColor : '#1c2130',
                color: input.trim() ? '#0e1117' : '#484f58',
                border: 'none', borderRadius: 8, padding: '0 16px',
                fontWeight: 700, fontSize: 13, cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s'
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DuelChatPanel;