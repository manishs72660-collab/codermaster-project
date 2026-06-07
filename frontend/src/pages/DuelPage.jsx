import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import socket from '../utils/socket';

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

  const timerRef = useRef(null);
  const editorRef = useRef(null);
  const gameStatusRef = useRef('waiting'); // ✅ ref to track gameStatus in socket callbacks

  const startTimer = (timeLimit, startedAt) => {
    clearInterval(timerRef.current); // ✅ clear any existing timer first
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
           (sc.language.toLowerCase() === 'c++' && lang === 'cpp')
    )?.initialCode || '// Write your solution here';
    setCode(initialCode);
  };

 useEffect(() => {
  // ✅ Connect socket FIRST before anything else
  socket.connect();
  socket.emit('duel:join_room', { roomCode, userId: user?._id });

  const init = async () => {
    try {
      // ✅ Small delay to ensure socket is joined before join API fires
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 1 — join first (activates room for player2)
      const joinRes = await axiosClient.get(`/duel/join/${roomCode}`);
      const joinData = joinRes.data;

      // Step 2 — get full room info
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

  return () => {
    socket.off('duel:opponent_joined');
    socket.off('duel:start');
    socket.off('duel:opponent_progress');
    socket.off('duel:finished');
    socket.off('duel:opponent_left');
    socket.disconnect();
    clearInterval(timerRef.current);
  };
}, [roomCode]);

  // language change
  useEffect(() => {
    if (problem) loadProblem(problem, selectedLanguage);
  }, [selectedLanguage, problem]);

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

  const ProgressBar = ({ passed, total, color, label }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
          {passed}/{total || '?'}
        </span>
      </div>
      <div style={{ height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: total ? `${(passed / total) * 100}%` : '0%',
          transition: 'width 0.4s ease',
          boxShadow: `0 0 8px ${color}80`
        }} />
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0e1117' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #1c2535', borderTop: '3px solid #ffa116', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (gameStatus === 'finished' && result) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0e1117', color: '#e6edf3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', system-ui, sans-serif"
      }}>
        <div style={{
          background: '#161b22',
          border: `1px solid ${result.won ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
          borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480, width: '90%',
          boxShadow: `0 0 60px ${result.won ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)'}`
        }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{result.won ? '🏆' : '💀'}</div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, marginBottom: 8, color: result.won ? '#3fb950' : '#f85149' }}>
            {result.won ? 'You Won!' : 'You Lost!'}
          </h1>
          <p style={{ color: '#7d8590', marginBottom: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            {result.testCasesPassed}/{result.totalTestCases} test cases passed
          </p>
          <div style={{ background: '#0d1117', borderRadius: 12, padding: '16px 24px', marginBottom: 32, border: '1px solid #21262d' }}>
            <div style={{ fontSize: 12, color: '#7d8590', marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>RATING CHANGE</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: result.won ? '#3fb950' : '#f85149' }}>
              {result.ratingChange}
            </div>
            {result.newRating && (
              <div style={{ fontSize: 13, color: '#7d8590', marginTop: 4 }}>
                New rating: <span style={{ color: '#ffa116', fontWeight: 700 }}>{result.newRating}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/duel')} style={{ background: 'linear-gradient(135deg, #ffa116, #e08a00)', color: '#0e1117', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
              ⚔ New Duel
            </button>
            <button onClick={() => navigate('/')} style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#0e1117', color: '#e6edf3', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;700;800&display=swap');
        .lang-pill { background: none; border: 1px solid #21262d; border-radius: 6px; cursor: pointer; padding: 4px 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: #484f58; transition: all 0.15s; }
        .lang-pill.active { background: rgba(255,161,22,0.07); color: #ffa116; border-color: rgba(255,161,22,0.35); }
        .lang-pill:hover:not(.active) { border-color: #30363d; color: #7d8590; }
      `}</style>

      {/* TOPBAR */}
      <div style={{ height: 52, background: 'rgba(22,27,34,0.97)', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚔</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{problem?.title || 'Duel'}</span>
          {problem?.difficulty && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
              background: problem.difficulty === 'easy' ? 'rgba(63,185,80,0.1)' : problem.difficulty === 'medium' ? 'rgba(210,153,34,0.1)' : 'rgba(248,81,73,0.1)',
              color: problem.difficulty === 'easy' ? '#3fb950' : problem.difficulty === 'medium' ? '#d29922' : '#f85149',
              border: `1px solid ${problem.difficulty === 'easy' ? 'rgba(63,185,80,0.3)' : problem.difficulty === 'medium' ? 'rgba(210,153,34,0.3)' : 'rgba(248,81,73,0.3)'}`
            }}>
              {problem.difficulty}
            </span>
          )}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: timeLeft !== null && timeLeft < 60000 ? '#f85149' : '#ffa116', letterSpacing: 2 }}>
          {gameStatus === 'waiting' ? (
            <span style={{ fontSize: 13, color: '#7d8590' }}>
              {opponentJoined ? '✅ Opponent joined! Starting...' : '⏳ Waiting for opponent...'}
            </span>
          ) : formatTime(timeLeft)}
        </div>

        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7d8590', background: '#1c2130', padding: '4px 10px', borderRadius: 6, border: '1px solid #21262d' }}>
          {roomCode}
        </span>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Problem */}
        <div style={{ width: '40%', minWidth: 320, borderRight: '1px solid #21262d', background: '#161b22', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
            <ProgressBar passed={myProgress.passed} total={myProgress.total || problem?.hiddenTestCases?.length || 0} color="#ffa116" label="You" />
            <ProgressBar passed={opponentProgress.passed} total={opponentProgress.total || problem?.hiddenTestCases?.length || 0} color="#388bfd" label="Opponent" />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{problem?.title}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: '#9ab0c8', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap' }}>
              {problem?.description}
            </p>
            {problem?.visibleTestCases?.length > 0 && (
              <>
                <div style={{ height: 1, background: '#21262d', margin: '20px 0' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#484f58', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>Examples</div>
                {problem.visibleTestCases.map((ex, i) => (
                  <div key={i} style={{ background: '#0d1117', border: '1px solid #21262d', borderLeft: '3px solid #30363d', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#484f58', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Example {i + 1}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7d8590', lineHeight: 1.8 }}>Input: <span style={{ color: '#e6edf3' }}>{ex.input}</span></div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7d8590', lineHeight: 1.8 }}>Output: <span style={{ color: '#e6edf3' }}>{ex.output}</span></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', background: '#161b22', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['javascript', 'cpp'].map(lang => (
                <button key={lang} className={`lang-pill ${selectedLanguage === lang ? 'active' : ''}`} onClick={() => setSelectedLanguage(lang)}>
                  {lang === 'cpp' ? 'C++' : 'JavaScript'}
                </button>
              ))}
            </div>
            {submitResult && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: submitResult.accepted ? '#3fb950' : '#f85149' }}>
                {submitResult.testCasesPassed}/{submitResult.totalTestCases} passed
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : 'javascript'}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                padding: { top: 14 },
                readOnly: gameStatus !== 'active' // ✅ editable only when active
              }}
            />
          </div>

          <div style={{ padding: '12px 16px', background: '#161b22', borderTop: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            {/* ✅ status message on left */}
            <span style={{ fontSize: 12, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace" }}>
              {gameStatus === 'waiting' && (opponentJoined ? '✅ Starting soon...' : '⏳ Waiting for opponent...')}
              {gameStatus === 'active' && '🟢 Duel in progress'}
              {gameStatus === 'finished' && '🏁 Duel finished'}
            </span>

            {/* ✅ submit button always visible, disabled when not active */}
            <button
              onClick={handleSubmit}
              disabled={submitting || gameStatus !== 'active'}
              style={{
                background: gameStatus !== 'active' ? '#1c2130' : submitting ? '#1c2130' : 'linear-gradient(135deg, #ffa116, #e08a00)',
                color: gameStatus !== 'active' || submitting ? '#7d8590' : '#0e1117',
                border: 'none', borderRadius: 8,
                padding: '10px 28px', fontWeight: 700,
                cursor: gameStatus !== 'active' || submitting ? 'not-allowed' : 'pointer',
                fontSize: 13, fontFamily: "'Outfit', sans-serif",
                boxShadow: gameStatus === 'active' && !submitting ? '0 4px 16px rgba(255,161,22,0.3)' : 'none',
                transition: 'all 0.15s', opacity: gameStatus !== 'active' ? 0.5 : 1
              }}
            >
              {submitting ? '⏳ Judging...' : '⚡ Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelPage;