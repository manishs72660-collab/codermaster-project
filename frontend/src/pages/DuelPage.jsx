import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import socket from '../utils/socket';
import Backbutton from "../component/backbutton"
import DuelChatPanel from "../component/Duelchatpanel"
import mylogo from "../assets/mylogo.png";

/* ------------------------------------------------------------------ */
/*  CodeMaster Color Palette (matches RoadmapExplorer / Navbar)       */
/* ------------------------------------------------------------------ */
const CM = {
  bg:        "#0a0d13",
  surface:   "#11161f",
  surface2:  "#1a2130",
  border:    "#1f2733",
  border2:   "#2c3646",
  text:      "#e6edf3",
  muted:     "#8b949e",
  dim:       "#4b5768",
  accent:    "#ffa116",
  accentDim: "#1e1608",
  green:     "#00c97a",
  red:       "#ff5566",
  blue:      "#4493f8",
  purple:    "#c084fc",
  teal:      "#2dd4bf",
  pink:      "#ff5fa6",
  sky:       "#38bdf8",
};

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Outfit', system-ui, sans-serif";

// ✅ NEW: 4 languages, each with its display label, icon, and Monaco language id
const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', icon: '🟨', monaco: 'javascript' },
  { key: 'python', label: 'Python', icon: '🐍', monaco: 'python' },
  { key: 'java', label: 'Java', icon: '☕', monaco: 'java' },
  { key: 'cpp', label: 'C++', icon: '⚙️', monaco: 'cpp' },
];

function Badge({ label, color, pulse }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700,
      fontFamily: MONO, letterSpacing: 0.3, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 6,
      backdropFilter: "blur(6px)",
    }}>
      {pulse && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: color,
          boxShadow: `0 0 6px ${color}`, animation: 'cmPulse 1.4s ease-in-out infinite'
        }} />
      )}
      {label}
    </span>
  );
}

// ✅ NEW: shared grid backdrop, matches RoadmapExplorer's GridBackdrop
function GridBackdrop({ color = CM.accent, opacity = "14" }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${color}${opacity} 1px, transparent 1px), linear-gradient(90deg, ${color}${opacity} 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 90%)",
      }}
    />
  );
}

// ✅ NEW: top navbar, same shape/behavior as the one on the Roadmap page
function DuelNavbar({ roomCode, statusLabel, statusColor, spectatorCount }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${CM.surface} 0%, ${CM.bg} 100%)`,
      borderBottom: `1px solid ${CM.border}`,
      flexShrink: 0, zIndex: 100,
      position: 'relative',
    }}>
      <div style={{
        height: 54, display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
      }}>
        {/* ✅ Logo — transparent container, no background block, just the mark itself */}
        <div style={{
          width: 34, height: 34,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <img
            src={mylogo}
            alt="CodeMaster logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 0 6px rgba(255,161,22,0.35))",
              mixBlendMode: "screen",
            }}
          />
        </div>

        <NavLink to="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontWeight: 800, fontSize: 15, letterSpacing: -0.3,
            background: "linear-gradient(135deg, #f2f5f9, #9fb0c2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            CodeMaster
          </span>
        </NavLink>

        <div style={{ width: 1, height: 20, background: `linear-gradient(${CM.border}, ${CM.border2}, ${CM.border})`, margin: "0 4px", flexShrink: 0 }} />

        <span style={{ fontFamily: MONO, fontSize: 11, color: CM.muted, whiteSpace: "nowrap" }}>
          <NavLink to="/duel" style={{ color: CM.muted, textDecoration: "none" }}>
            Duel
          </NavLink>
          {" / "}
          <span style={{ color: CM.accent }}>{roomCode || 'Room'}</span>
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {spectatorCount > 0 && <Badge label={`${spectatorCount} watching`} color={CM.purple} />}
          <Badge label={statusLabel} color={statusColor} pulse={statusLabel === 'LIVE'} />
        </div>
      </div>

      {/* subtle glowing underline for extra polish */}
      <div style={{
        position: 'absolute', bottom: -1, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${CM.accent}55, transparent)`,
      }} />
    </div>
  );
}

const DuelPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [gameStatus, setGameStatus] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(null);
  const [myProgress, setMyProgress] = useState({ passed: 0, total: 0 });
  const [opponentProgress, setOpponentProgress] = useState({ passed: 0, total: 0 });
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [result, setResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // ✅ NEW: rematch state
  const [rematching, setRematching] = useState(false);
  const [rematchInvite, setRematchInvite] = useState(null);

  // ✅ NEW: how many people are watching this duel
  const [spectatorCount, setSpectatorCount] = useState(0);

  // ✅ NEW: post-duel "view opponent's code" modal
  const [showOpponentCode, setShowOpponentCode] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [loadingReplay, setLoadingReplay] = useState(false);

  const timerRef = useRef(null);
  const editorRef = useRef(null);
  const gameStatusRef = useRef('waiting');
  const codeUpdateTimeoutRef = useRef(null); // ✅ NEW: debounce handle for live code streaming

  const startTimer = (timeLimit, startedAt) => {
    clearInterval(timerRef.current);
    const endTime = new Date(startedAt).getTime() + timeLimit * 60 * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        setGameStatus('finished');
      }
    }, 1000);
  };

  const setActiveGame = (roomData) => {
    setGameStatus('active');
    gameStatusRef.current = 'active';
    setOpponentJoined(true);
    if (roomData?.startedAt) {
      startTimer(roomData.timeLimit, roomData.startedAt);
    }
  };

  const loadProblem = (prob, lang) => {
    if (!prob?.startCode) return;
    const initialCode = prob.startCode.find(
      sc => sc.language.toLowerCase() === lang.toLowerCase() ||
           (lang === 'cpp' && sc.language.toLowerCase() === 'c++')
    )?.initialCode || '// Write your solution here';
    setCode(initialCode);
  };

 useEffect(() => {
  socket.connect();
  socket.emit('duel:join_room', { roomCode, userId: user?._id });

  const init = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const joinRes = await axiosClient.get(`/duel/join/${roomCode}`);
      const joinData = joinRes.data;

      const roomRes = await axiosClient.get(`/duel/room/${roomCode}`);
      const roomData = roomRes.data;

      setRoom(roomData);

      const prob = roomData.problemId || joinData.problem;
      setProblem(prob);
      loadProblem(prob, selectedLanguage);

      if (joinData.status === 'active' || roomData.status === 'active') {
        setActiveGame(roomData.startedAt
          ? roomData
          : { ...roomData, startedAt: joinData.startedAt, timeLimit: joinData.timeLimit }
        );
      }

      if (roomData.player2) setOpponentJoined(true);

    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  init();
  socket.on('duel:opponent_joined', async () => {
    setOpponentJoined(true);
    try {
      const roomRes = await axiosClient.get(`/duel/room/${roomCode}`);
      const roomData = roomRes.data;
      setRoom(roomData);
      const prob = roomData.problemId;
      setProblem(prob);
      loadProblem(prob, selectedLanguage);
      setActiveGame(roomData);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('duel:start', ({ startedAt, timeLimit }) => {
    setGameStatus('active');
    gameStatusRef.current = 'active';
    setOpponentJoined(true);
    startTimer(timeLimit, startedAt);
  });

  socket.on('duel:opponent_progress', ({ testCasesPassed, total }) => {
    setOpponentProgress({ passed: testCasesPassed, total });
  });

  socket.on('duel:finished', ({ winnerId, winnerGain, loserLoss, testCasesPassed, totalTestCases }) => {
    setGameStatus('finished');
    clearInterval(timerRef.current);
    const iWon = winnerId?.toString() === user?._id?.toString();
    setResult({
      won: iWon,
      ratingChange: iWon ? `+${winnerGain}` : `-${Math.abs(loserLoss)}`,
      testCasesPassed,
      totalTestCases
    });
  });

  socket.on('duel:opponent_left', () => {
    alert('Opponent disconnected!');
  });

  // ✅ NEW: opponent created a rematch room — show an invite banner
  socket.on('duel:rematch_invite', ({ fromUserId, roomCode: newRoomCode, problem: newProblem }) => {
    if (fromUserId?.toString() === user?._id?.toString()) return; // ignore our own invite
    setRematchInvite({ roomCode: newRoomCode, problem: newProblem });
  });

  // ✅ NEW: live spectator count (people watching this duel)
  socket.on('duel:spectator_count', ({ count }) => {
    setSpectatorCount(count);
  });

  return () => {
    socket.off('duel:opponent_joined');
    socket.off('duel:start');
    socket.off('duel:opponent_progress');
    socket.off('duel:finished');
    socket.off('duel:opponent_left');
    socket.off('duel:rematch_invite');
    socket.off('duel:spectator_count');
    socket.disconnect();
    clearInterval(timerRef.current);
    clearTimeout(codeUpdateTimeoutRef.current); // ✅ NEW
  };
}, [roomCode]);

  useEffect(() => {
    if (problem) loadProblem(problem, selectedLanguage);
  }, [selectedLanguage, problem]);

  // ✅ NEW: debounced live code broadcast — spectators only, never the opponent
  const handleCodeChange = (val) => {
    const newCode = val || '';
    setCode(newCode);

    if (gameStatusRef.current !== 'active') return;

    clearTimeout(codeUpdateTimeoutRef.current);
    codeUpdateTimeoutRef.current = setTimeout(() => {
      socket.emit('duel:code_update', {
        roomCode,
        userId: user?._id,
        code: newCode,
        language: selectedLanguage
      });
    }, 400);
  };

  // ✅ NEW: fetch both players' final code after the duel ends
  const handleViewOpponentCode = async () => {
    if (!room) return;
    setShowOpponentCode(true);
    if (replayData) return; // already fetched
    setLoadingReplay(true);
    try {
      const res = await axiosClient.get(`/duel/replay/${room._id}`);
      setReplayData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReplay(false);
    }
  };

  // ✅ FIXED: this declaration was missing its `const formatTime = (ms) => {` wrapper
  const formatTime = (ms) => {
    if (!ms) return '--:--';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!room || submitting) return;
    setSubmitting(true);
    try {
      const res = await axiosClient.post(`/duel/submit/${room._id}`, {
        code,
        language: selectedLanguage
      });
      const data = res.data;
      setMyProgress({ passed: data.testCasesPassed, total: data.totalTestCases });
      setSubmitResult(data);

      socket.emit('duel:progress', {
        roomCode,
        userId: user?._id,
        testCasesPassed: data.testCasesPassed,
        total: data.totalTestCases
      });

      if (data.won) {
        setGameStatus('finished');
        setResult({
          won: true,
          ratingChange: data.ratingChange,
          newRating: data.newRating,
          testCasesPassed: data.testCasesPassed,
          totalTestCases: data.totalTestCases
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ NEW: rematch handler — creates a new room via the backend and waits for opponent
  const handleRematch = async () => {
    if (!room || rematching) return;
    setRematching(true);
    try {
      const res = await axiosClient.post(`/duel/rematch/${room._id}`);
      navigate(`/duel/${res.data.roomCode}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create rematch');
    } finally {
      setRematching(false);
    }
  };

  const ProgressBar = ({ passed, total, color, label }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: CM.muted, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: MONO }}>
          {passed}/{total || '?'}
        </span>
      </div>
      <div style={{ height: 6, background: CM.surface2, borderRadius: 3, overflow: 'hidden', border: `1px solid ${CM.border}` }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: total ? `${(passed / total) * 100}%` : '0%',
          transition: 'width 0.4s ease',
          boxShadow: `0 0 8px ${color}80`
        }} />
      </div>
    </div>
  );

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes cmPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes cmFadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .lang-pill {
      background: none; border: 1px solid ${CM.border}; border-radius: 8px; cursor: pointer;
      padding: 5px 13px; font-family: ${MONO}; font-size: 11px;
      font-weight: 600; color: ${CM.dim}; transition: all 0.18s ease;
      display: flex; align-items: center; gap: 5px;
    }
    .lang-pill.active { background: rgba(255,161,22,0.1); color: ${CM.accent}; border-color: rgba(255,161,22,0.45); box-shadow: 0 0 12px rgba(255,161,22,0.15); }
    .lang-pill:hover:not(.active) { border-color: ${CM.border2}; color: ${CM.muted}; transform: translateY(-1px); }
    .cm-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .cm-scrollbar::-webkit-scrollbar-thumb { background: ${CM.border2}; border-radius: 8px; }
    .cm-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .cm-btn { transition: all 0.18s ease; }
    .cm-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
    .cm-btn:active:not(:disabled) { transform: translateY(0); }
  `;

  if (loading) return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: CM.bg, overflow: 'hidden' }}>
      <style>{globalStyles}</style>
      <GridBackdrop color={CM.accent} />
      <div style={{ width: 40, height: 40, border: `3px solid ${CM.surface2}`, borderTop: `3px solid ${CM.accent}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  );

  if (gameStatus === 'finished' && result) {
    return (
      <div style={{
        minHeight: '100vh', background: CM.bg, color: CM.text,
        display: 'flex', flexDirection: 'column',
        fontFamily: SANS
      }}>
        <style>{globalStyles}</style>
        <DuelNavbar roomCode={roomCode} statusLabel="FINISHED" statusColor={CM.muted} spectatorCount={spectatorCount} />
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <GridBackdrop color={result.won ? CM.green : CM.red} />
          <Backbutton></Backbutton>
          <div style={{
            position: 'relative',
            background: `linear-gradient(180deg, ${CM.surface} 0%, ${CM.bg} 140%)`,
            border: `1px solid ${result.won ? 'rgba(0,201,122,0.3)' : 'rgba(255,85,102,0.3)'}`,
            borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480, width: '90%',
            boxShadow: `0 0 60px ${result.won ? 'rgba(0,201,122,0.15)' : 'rgba(255,85,102,0.15)'}, 0 20px 50px rgba(0,0,0,0.4)`,
            animation: 'popIn 0.35s ease'
          }}>
            <div style={{ fontSize: 72, marginBottom: 16, filter: `drop-shadow(0 0 20px ${result.won ? 'rgba(0,201,122,0.4)' : 'rgba(255,85,102,0.4)'})` }}>{result.won ? '🏆' : '💀'}</div>
            <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, marginBottom: 8, color: result.won ? CM.green : CM.red, fontFamily: MONO }}>
              {result.won ? 'You Won!' : 'You Lost!'}
            </h1>
            <p style={{ color: CM.muted, marginBottom: 32, fontFamily: MONO, fontSize: 13 }}>
              {result.testCasesPassed}/{result.totalTestCases} test cases passed
            </p>
            <div style={{ background: CM.bg, borderRadius: 12, padding: '16px 24px', marginBottom: 32, border: `1px solid ${CM.border}` }}>
              <div style={{ fontSize: 12, color: CM.muted, marginBottom: 4, fontFamily: MONO }}>RATING CHANGE</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: result.won ? CM.green : CM.red, fontFamily: MONO }}>
                {result.ratingChange}
              </div>
              {result.newRating && (
                <div style={{ fontSize: 13, color: CM.muted, marginTop: 4 }}>
                  New rating: <span style={{ color: CM.accent, fontWeight: 700 }}>{result.newRating}</span>
                </div>
              )}
            </div>

            {/* ✅ NEW: rematch invite banner */}
            {rematchInvite && (
              <div style={{
                background: 'rgba(196,132,252,0.08)', border: '1px solid rgba(196,132,252,0.3)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'left',
                animation: 'cmFadeUp 0.3s ease'
              }}>
                <div style={{ fontSize: 12, color: CM.purple, fontFamily: MONO, marginBottom: 8 }}>
                  ⚔ Your opponent started a rematch — {rematchInvite.problem?.title}
                </div>
                <button
                  className="cm-btn"
                  onClick={() => navigate(`/duel/${rematchInvite.roomCode}`)}
                  style={{
                    background: CM.purple, color: '#0d1117', border: 'none', borderRadius: 8,
                    padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12,
                    fontFamily: SANS
                  }}
                >
                  Join Rematch →
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="cm-btn"
                onClick={handleRematch}
                disabled={rematching}
                style={{
                  background: 'linear-gradient(135deg, #c084fc, #9333ea)', color: '#fff',
                  border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700,
                  cursor: rematching ? 'not-allowed' : 'pointer', fontSize: 14,
                  fontFamily: SANS, opacity: rematching ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(147,51,234,0.3)'
                }}
              >
                {rematching ? '⏳ Creating...' : '🔁 Rematch'}
              </button>
              {/* ✅ NEW: view opponent's final code */}
              <button
                className="cm-btn"
                onClick={handleViewOpponentCode}
                style={{
                  background: 'transparent', color: CM.purple, border: '1px solid rgba(196,132,252,0.4)',
                  borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer',
                  fontSize: 14, fontFamily: SANS
                }}
              >
                👁 View Opponent's Code
              </button>
              <button className="cm-btn" onClick={() => navigate('/duel')} style={{ background: 'linear-gradient(135deg, #ffa116, #e08a00)', color: '#0d1117', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: SANS, boxShadow: '0 4px 16px rgba(255,161,22,0.3)' }}>
                ⚔ New Duel
              </button>
              <button className="cm-btn" onClick={() => navigate('/')} style={{ background: 'transparent', color: CM.text, border: `1px solid ${CM.border2}`, borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: SANS }}>
                Home
              </button>
            </div>
          </div>

          {/* ✅ NEW: opponent code modal — side-by-side comparison with your own final submission */}
          {showOpponentCode && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(3,5,8,0.8)', backdropFilter: 'blur(6px)', zIndex: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}>
              <div style={{
                background: CM.bg, border: `1px solid ${CM.border}`, borderRadius: 16,
                width: '100%', maxWidth: 1100, height: '85vh', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
              }}>
                <div style={{
                  padding: '14px 20px', borderBottom: `1px solid ${CM.border}`, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: CM.surface
                }}>
                  <span style={{ fontWeight: 700, fontSize: 15, fontFamily: MONO }}>🔍 Code Comparison</span>
                  <button
                    onClick={() => setShowOpponentCode(false)}
                    style={{ background: 'none', border: 'none', color: CM.muted, fontSize: 20, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {loadingReplay || !replayData ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 32, height: 32, border: `3px solid ${CM.surface2}`, borderTop: `3px solid ${CM.purple}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {[replayData.player1, replayData.player2].filter(Boolean).map((p, i) => {
                      const isMe = p.userId?._id?.toString() === user?._id?.toString() || p.userId?.toString() === user?._id?.toString();
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: i === 0 ? `1px solid ${CM.border}` : 'none', overflow: 'hidden' }}>
                          <div style={{
                            padding: '10px 16px', background: CM.surface, borderBottom: `1px solid ${CM.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? CM.accent : CM.blue, fontFamily: MONO }}>
                              {isMe ? 'You' : (p.userId?.firstName || 'Opponent')}
                            </span>
                            <span style={{ fontSize: 11, color: CM.muted, fontFamily: MONO }}>
                              {p.testCasesPassed}/{p.totalTestCases} · {p.language}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Editor
                              height="100%"
                              language={LANGUAGES.find(l => l.key === p.language)?.monaco || p.language || 'javascript'}
                              value={p.code || '// No submission'}
                              theme="vs-dark"
                              options={{ readOnly: true, fontSize: 12, minimap: { enabled: false }, scrollBeyondLastLine: false, fontFamily: MONO }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ✅ NEW: chat stays available after the duel ends — talk it out with your opponent (and any spectators) */}
        <DuelChatPanel roomCode={roomCode} userId={user?._id} userName={user?.firstName} role="player" accentColor={CM.accent} />
      </div>
    );
  }

  const statusLabel = gameStatus === 'active' ? 'LIVE' : gameStatus === 'waiting' ? 'WAITING' : 'FINISHED';
  const statusColor = gameStatus === 'active' ? CM.green : gameStatus === 'waiting' ? CM.accent : CM.muted;

  return (
    <div style={{ height: '100vh', background: CM.bg, color: CM.text, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}>
      <style>{globalStyles}</style>

      {/* ✅ NEW: shared navbar matching the Roadmap page */}
      <DuelNavbar roomCode={roomCode} statusLabel={statusLabel} statusColor={statusColor} spectatorCount={spectatorCount} />

      {/* SUB-TOPBAR — problem title, difficulty, timer */}
      <div style={{ position: 'relative', height: 54, background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, overflow: 'hidden' }}>
        <GridBackdrop color={CM.accent} opacity="0d" />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚔</span>
          <span style={{ fontWeight: 700, fontSize: 14, fontFamily: MONO }}>{problem?.title || 'Duel'}</span>
          {problem?.difficulty && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              fontFamily: MONO, textTransform: 'uppercase',
              background: problem.difficulty === 'easy' ? 'rgba(0,201,122,0.1)' : problem.difficulty === 'medium' ? 'rgba(255,161,22,0.1)' : 'rgba(255,85,102,0.1)',
              color: problem.difficulty === 'easy' ? CM.green : problem.difficulty === 'medium' ? CM.accent : CM.red,
              border: `1px solid ${problem.difficulty === 'easy' ? 'rgba(0,201,122,0.3)' : problem.difficulty === 'medium' ? 'rgba(255,161,22,0.3)' : 'rgba(255,85,102,0.3)'}`
            }}>
              {problem.difficulty}
            </span>
          )}
        </div>

        <div style={{ position: 'relative', fontFamily: MONO, fontSize: 22, fontWeight: 700, color: timeLeft !== null && timeLeft < 60000 ? CM.red : CM.accent, letterSpacing: 2, textShadow: `0 0 16px ${timeLeft !== null && timeLeft < 60000 ? 'rgba(255,85,102,0.4)' : 'rgba(255,161,22,0.35)'}` }}>
          {gameStatus === 'waiting' ? (
            <span style={{ fontSize: 13, color: CM.muted, textShadow: 'none' }}>
              {opponentJoined ? '✅ Opponent joined! Starting...' : '⏳ Waiting for opponent...'}
            </span>
          ) : formatTime(timeLeft)}
        </div>

        <div style={{ position: 'relative' }} />
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Problem */}
        <div style={{ width: '40%', minWidth: 320, borderRight: `1px solid ${CM.border}`, background: CM.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${CM.border}`, flexShrink: 0 }}>
            <ProgressBar passed={myProgress.passed} total={myProgress.total || problem?.hiddenTestCases?.length || 0} color={CM.accent} label="You" />
            <ProgressBar passed={opponentProgress.passed} total={opponentProgress.total || problem?.hiddenTestCases?.length || 0} color={CM.blue} label="Opponent" />
          </div>

          <div className="cm-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, fontFamily: MONO }}>{problem?.title}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: '#9ab0c8', fontFamily: MONO, whiteSpace: 'pre-wrap' }}>
              {problem?.description}
            </p>
            {problem?.visibleTestCases?.length > 0 && (
              <>
                <div style={{ height: 1, background: CM.border, margin: '20px 0' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: CM.dim, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14, fontFamily: MONO }}>Examples</div>
                {problem.visibleTestCases.map((ex, i) => (
                  <div key={i} style={{ background: CM.bg, border: `1px solid ${CM.border}`, borderLeft: `3px solid ${CM.border2}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: CM.dim, fontFamily: MONO, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Example {i + 1}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: CM.muted, lineHeight: 1.8 }}>Input: <span style={{ color: CM.text }}>{ex.input}</span></div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: CM.muted, lineHeight: 1.8 }}>Output: <span style={{ color: CM.text }}>{ex.output}</span></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {/* ✅ CHANGED: now 4 languages instead of 2 */}
              {LANGUAGES.map(({ key, label, icon }) => (
                <button key={key} className={`lang-pill ${selectedLanguage === key ? 'active' : ''}`} onClick={() => setSelectedLanguage(key)}>
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>
            {submitResult && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: submitResult.accepted ? CM.green : CM.red }}>
                {submitResult.testCasesPassed}/{submitResult.totalTestCases} passed
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.key === selectedLanguage)?.monaco || 'javascript'}
              value={code}
              onChange={handleCodeChange}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                fontFamily: MONO,
                fontLigatures: true,
                padding: { top: 14 },
                readOnly: gameStatus !== 'active'
              }}
            />
          </div>

          <div style={{ padding: '12px 16px', background: CM.surface, borderTop: `1px solid ${CM.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: CM.muted, fontFamily: MONO }}>
              {gameStatus === 'waiting' && (opponentJoined ? '✅ Starting soon...' : '⏳ Waiting for opponent...')}
              {gameStatus === 'active' && '🟢 Duel in progress'}
              {gameStatus === 'finished' && '🏁 Duel finished'}
            </span>

            <button
              className="cm-btn"
              onClick={handleSubmit}
              disabled={submitting || gameStatus !== 'active'}
              style={{
                background: gameStatus !== 'active' ? CM.surface2 : submitting ? CM.surface2 : 'linear-gradient(135deg, #ffa116, #e08a00)',
                color: gameStatus !== 'active' || submitting ? CM.muted : '#0d1117',
                border: 'none', borderRadius: 8,
                padding: '10px 28px', fontWeight: 700,
                cursor: gameStatus !== 'active' || submitting ? 'not-allowed' : 'pointer',
                fontSize: 13, fontFamily: SANS,
                boxShadow: gameStatus === 'active' && !submitting ? '0 4px 16px rgba(255,161,22,0.3)' : 'none',
                transition: 'all 0.15s', opacity: gameStatus !== 'active' ? 0.5 : 1
              }}
            >
              {submitting ? '⏳ Judging...' : '⚡ Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ NEW: chat button/panel, bottom-right */}
      <DuelChatPanel roomCode={roomCode} userId={user?._id} userName={user?.firstName} role="player" accentColor={CM.accent} />
    </div>
  );
};

export default DuelPage;