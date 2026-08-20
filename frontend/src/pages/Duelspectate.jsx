import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import socket from '../utils/socket';
import Backbutton from '../component/backbutton';
import DuelChatPanel from '../component/Duelchatpanel';

const LANGUAGES = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp'
};

// Watch-only view of a duel: no submissions, no editor — just both players'
// live progress, the problem being fought over, and a chat you can join
// (especially once the match is over). Never calls /duel/join/:roomCode,
// so spectators are never turned into player2.
const DuelSpectate = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(null);
  const [progress, setProgress] = useState({}); // { [userId]: { passed, total } }
  const [winnerId, setWinnerId] = useState(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [liveCode, setLiveCode] = useState({}); // ✅ NEW: { [userId]: { code, language } }

  const timerRef = useRef(null);

  const startTimer = (timeLimit, startedAt) => {
    clearInterval(timerRef.current);
    const endTime = new Date(startedAt).getTime() + timeLimit * 60 * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    }, 1000);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const res = await axiosClient.get(`/duel/room/${roomCode}`);
        if (cancelled) return;
        const roomData = res.data;
        setRoom(roomData);
        setStatus(roomData.status);
        setWinnerId(roomData.winnerId?._id || roomData.winnerId || null);

        const initialProgress = {};
        const initialCode = {}; // ✅ NEW
        if (roomData.player1) {
          const pid1 = roomData.player1.userId._id;
          initialProgress[pid1] = {
            passed: roomData.player1.testCasesPassed || 0,
            total: roomData.player1.totalTestCases || roomData.problemId?.hiddenTestCases?.length || 0
          };
          if (roomData.player1.code) {
            initialCode[pid1] = { code: roomData.player1.code, language: roomData.player1.language || 'javascript' };
          }
        }
        if (roomData.player2) {
          const pid2 = roomData.player2.userId._id;
          initialProgress[pid2] = {
            passed: roomData.player2.testCasesPassed || 0,
            total: roomData.player2.totalTestCases || roomData.problemId?.hiddenTestCases?.length || 0
          };
          if (roomData.player2.code) {
            initialCode[pid2] = { code: roomData.player2.code, language: roomData.player2.language || 'javascript' };
          }
        }
        setProgress(initialProgress);
        setLiveCode(initialCode); // ✅ NEW

        if (roomData.status === 'active' && roomData.startedAt) {
          startTimer(roomData.timeLimit, roomData.startedAt);
        }
      } catch (err) {
        console.error('Spectate init error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    socket.connect();
    socket.emit('duel:spectate_join', { roomCode, userId: user?._id });

    init();

    socket.on('duel:start', ({ startedAt, timeLimit }) => {
      setStatus('active');
      startTimer(timeLimit, startedAt);
    });

    socket.on('duel:opponent_progress', ({ userId, testCasesPassed, total }) => {
      setProgress((prev) => ({ ...prev, [userId]: { passed: testCasesPassed, total } }));
    });

    socket.on('duel:finished', ({ winnerId: wId, testCasesPassed, totalTestCases }) => {
      setStatus('finished');
      setWinnerId(wId);
      clearInterval(timerRef.current);
      setProgress((prev) => ({ ...prev, [wId]: { passed: testCasesPassed, total: totalTestCases } }));
    });

    socket.on('duel:spectator_count', ({ count }) => setSpectatorCount(count));

    // ✅ NEW: live code stream — updates whichever player's editor changed
    socket.on('duel:opponent_code_update', ({ userId, code, language }) => {
      setLiveCode((prev) => ({ ...prev, [userId]: { code, language } }));
    });

    return () => {
      socket.emit('duel:spectate_leave', { roomCode, userId: user?._id });
      socket.off('duel:start');
      socket.off('duel:opponent_progress');
      socket.off('duel:finished');
      socket.off('duel:spectator_count');
      socket.off('duel:opponent_code_update'); // ✅ NEW
      socket.disconnect();
      clearInterval(timerRef.current);
      cancelled = true;
    };
  }, [roomCode]);

  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStopWatching = () => {
    navigate('/duel');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0e1117' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #1c2535', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound || !room) return (
    <div style={{ minHeight: '100vh', background: '#0e1117', color: '#e6edf3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Outfit', sans-serif" }}>
      <Backbutton></Backbutton>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 16, color: '#7d8590' }}>Room not found</div>
      <button onClick={() => navigate('/duel')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
        Back to Lobby
      </button>
    </div>
  );

  const problem = room.problemId;
  const player1 = room.player1;
  const player2 = room.player2;

  const PlayerCard = ({ player, color }) => {
    if (!player) {
      return (
        <div style={{
          flex: 1, background: '#161b22', border: '1px solid #21262d', borderRadius: 14,
          padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: 0.5
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1c2130', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>?</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7d8590' }}>Waiting for player...</div>
        </div>
      );
    }
    const pid = player.userId._id || player.userId;
    const p = progress[pid] || { passed: 0, total: 0 };
    const isWinner = winnerId?.toString() === pid?.toString();
    return (
      <div style={{
        flex: 1, background: '#161b22', border: `1px solid ${isWinner && status === 'finished' ? 'rgba(63,185,80,0.4)' : '#21262d'}`,
        borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        position: 'relative', boxShadow: isWinner && status === 'finished' ? '0 0 24px rgba(63,185,80,0.15)' : 'none'
      }}>
        {isWinner && status === 'finished' && (
          <div style={{ position: 'absolute', top: -12, fontSize: 22 }}>🏆</div>
        )}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color
        }}>
          {player.userId?.firstName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{player.userId?.firstName || 'Player'}</div>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{p.passed}/{p.total || '?'}</span>
          </div>
          <div style={{ height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, background: color,
              width: p.total ? `${(p.passed / p.total) * 100}%` : '0%',
              transition: 'width 0.4s ease', boxShadow: `0 0 8px ${color}80`
            }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e1117', color: '#e6edf3', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;700;800&display=swap');
      `}</style>

      {/* TOPBAR */}
      <div style={{ height: 52, background: 'rgba(22,27,34,0.97)', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)',
            fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            👁 Spectating
          </span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{problem?.title}</span>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: timeLeft !== null && timeLeft < 60000 ? '#f85149' : '#ffa116' }}>
          {status === 'waiting' ? <span style={{ fontSize: 13, color: '#7d8590' }}>⏳ Waiting to start...</span> :
           status === 'finished' ? <span style={{ fontSize: 13, color: '#3fb950' }}>🏁 Finished</span> :
           formatTime(timeLeft)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#818cf8',
            background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 6,
            border: '1px solid rgba(99,102,241,0.3)'
          }}>
            👀 {spectatorCount}
          </span>
          <button
            onClick={handleStopWatching}
            style={{
              background: 'transparent', border: '1px solid #30363d', color: '#e6edf3',
              borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
            }}
          >
            Stop Watching
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* Players */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
          <PlayerCard player={player1} color="#ffa116" />
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 800, color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>VS</div>
          <PlayerCard player={player2} color="#388bfd" />
        </div>

        {status === 'finished' && winnerId && (
          <div style={{
            background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.3)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 24, textAlign: 'center',
            fontSize: 13, color: '#3fb950', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700
          }}>
            🏆 {[player1, player2].find(p => (p?.userId?._id || p?.userId)?.toString() === winnerId?.toString())?.userId?.firstName || 'A player'} won this duel
          </div>
        )}

        {/* ✅ NEW: live dual-editor view — both players' code, updating in real time */}
        {status !== 'waiting' && (
          <div style={{
            display: 'flex', gap: 16, marginBottom: 24,
            border: '1px solid #21262d', borderRadius: 14, overflow: 'hidden', height: 420
          }}>
            {[
              { player: player1, color: '#ffa116', label: 'Player 1' },
              { player: player2, color: '#388bfd', label: 'Player 2' }
            ].map(({ player, color, label }, i) => {
              const pid = player?.userId?._id || player?.userId;
              const entry = pid ? liveCode[pid] : null;
              return (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  borderRight: i === 0 ? '1px solid #21262d' : 'none', overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '10px 16px', background: '#161b22', borderBottom: '1px solid #21262d',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>
                      {player?.userId?.firstName || label}
                    </span>
                    <span style={{ fontSize: 10, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
                      {entry?.language || '—'}
                    </span>
                  </div>
                  <div style={{ flex: 1, background: '#0e1117' }}>
                    {entry ? (
                      <Editor
                        height="100%"
                        language={LANGUAGES[entry.language?.toLowerCase()] || 'javascript'}
                        value={entry.code}
                        theme="vs-dark"
                        options={{
                          readOnly: true, fontSize: 12, minimap: { enabled: false },
                          scrollBeyondLastLine: false, automaticLayout: true,
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      />
                    ) : (
                      <div style={{
                        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#484f58', fontSize: 12, fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        Waiting for code...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Problem statement */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{problem?.title}</h2>
            {problem?.difficulty && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                background: problem.difficulty === 'easy' ? 'rgba(63,185,80,0.1)' : problem.difficulty === 'medium' ? 'rgba(210,153,34,0.1)' : 'rgba(248,81,73,0.1)',
                color: problem.difficulty === 'easy' ? '#3fb950' : problem.difficulty === 'medium' ? '#d29922' : '#f85149',
              }}>
                {problem.difficulty}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: '#9ab0c8', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
            {problem?.description}
          </p>
          {problem?.visibleTestCases?.length > 0 && (
            <>
              <div style={{ height: 1, background: '#21262d', margin: '20px 0' }} />
              {problem.visibleTestCases.map((ex, i) => (
                <div key={i} style={{ background: '#0d1117', border: '1px solid #21262d', borderLeft: '3px solid #30363d', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#484f58', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: 'uppercase' }}>Example {i + 1}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7d8590' }}>Input: <span style={{ color: '#e6edf3' }}>{ex.input}</span></div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7d8590' }}>Output: <span style={{ color: '#e6edf3' }}>{ex.output}</span></div>
                </div>
              ))}
            </>
          )}
        </div>

        {status !== 'finished' && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#484f58', fontFamily: "'JetBrains Mono', monospace" }}>
            💡 Chat unlocks the full conversation once the duel wraps up — jump in anytime though.
          </div>
        )}
      </div>

      {/* Chat — available throughout, most useful once the duel ends */}
      <DuelChatPanel roomCode={roomCode} userId={user?._id} userName={user?.firstName} role="spectator" accentColor="#6366f1" />
    </div>
  );
};

export default DuelSpectate;