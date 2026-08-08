import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Loader2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { fetchProblems } from '../problemslice';
import BackButton from '../component/backbutton';

const PROBLEM_FETCH_LIMIT = 200;

const DuelLobby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    problems: allProblems,
    loading: problemsLoading,
    error: problemsError,
    initialized: problemsInitialized,
  } = useSelector((state) => state.problem);

  const [roomCode, setRoomCode] = useState('');
  const [watchCode, setWatchCode] = useState(''); // ✅ NEW
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemSearch, setProblemSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeLimit, setTimeLimit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    if (!problemsInitialized) {
      dispatch(fetchProblems({ page: 1, limit: PROBLEM_FETCH_LIMIT }));
    }
  }, [dispatch, problemsInitialized]);

  const problemsList = Array.isArray(allProblems) ? allProblems : [];

  const filteredProblems = problemsList.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(problemSearch.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const diffColor = (d) => {
    if (d === 'easy') return '#3fb950';
    if (d === 'medium') return '#d29922';
    if (d === 'hard') return '#f85149';
    return '#7d8590';
  };

  const handleCreate = async () => {
    if (!selectedProblem) return setError('Pick a problem first');
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.post('/duel/create', { problemId: selectedProblem._id, timeLimit });
      setCreatedRoom(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/duel/room/${roomCode.toUpperCase()}`);
      if (!res.data) return setError('Room not found');
      navigate(`/duel/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: watch a duel without joining it as a player
  const handleWatch = async () => {
    if (!watchCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/duel/room/${watchCode.toUpperCase()}`);
      if (!res.data) return setError('Room not found');
      navigate(`/duel/watch/${watchCode.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b10',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hud-root { width: 100%; max-width: 900px; }

        .hud-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 40px;
        }
        .hud-logo { display: flex; align-items: center; gap: 10px; }
        .hud-logo-icon {
          width: 36px; height: 36px; background: #ff6b00;
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 18px;
        }
        .hud-logo-text { font-size: 16px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
        .hud-leaderboard-btn {
          background: #0f1520; border: 1px solid #1e2d3d;
          color: #64748b; padding: 8px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .hud-leaderboard-btn:hover { border-color: #ff6b00; color: #ff6b00; }

        .hud-vs-section {
          display: grid; grid-template-columns: 1fr 80px 1fr;
          gap: 0; align-items: center; margin-bottom: 28px;
        }
        .hud-player-card {
          background: #0d1520; border: 1px solid #1a2535;
          padding: 24px; display: flex; flex-direction: column;
          align-items: center; gap: 8px; position: relative;
        }
        .hud-player-card.left { border-radius: 16px 0 0 16px; border-right: none; }
        .hud-player-card.right { border-radius: 0 16px 16px 0; border-left: none; }
        .hud-player-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; margin-bottom: 4px;
        }
        .hud-player-avatar.you { background: #ff6b0020; border: 2px solid #ff6b00; color: #ff6b00; }
        .hud-player-avatar.opp { background: #6366f120; border: 2px solid #6366f1; color: #818cf8; }
        .hud-player-name { font-size: 14px; font-weight: 600; color: #f1f5f9; }
        .hud-player-elo { font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace; }

        .hud-vs-center {
          background: #0d1520; border-top: 1px solid #1a2535;
          border-bottom: 1px solid #1a2535;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; padding: 24px 0; gap: 6px;
        }
        .hud-vs-text { font-size: 28px; font-weight: 800; color: #ff6b00; font-family: 'JetBrains Mono', monospace; letter-spacing: 2px; }
        .hud-vs-sub { font-size: 9px; color: #334155; letter-spacing: 3px; }

        .hud-tabs {
          display: flex; gap: 0; margin-bottom: 20px;
          background: #0d1520; border: 1px solid #1a2535;
          border-radius: 12px; padding: 4px;
        }
        .hud-tab {
          flex: 1; padding: 10px; text-align: center;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border-radius: 9px; transition: all 0.15s;
          color: #475569; border: none; background: transparent;
          font-family: 'Inter', sans-serif;
        }
        .hud-tab.active-create { background: #ff6b00; color: #000; }
        .hud-tab.active-join { background: #6366f1; color: #fff; }
        .hud-tab.active-watch { background: #818cf8; color: #000; }

        .hud-panel {
          background: #0d1520; border: 1px solid #1a2535;
          border-radius: 12px; padding: 24px;
        }

        .hud-label {
          font-size: 11px; font-weight: 600; color: #475569;
          letter-spacing: 0.5px; text-transform: uppercase;
          margin-bottom: 8px; display: block;
        }
        .hud-input {
          width: 100%; background: #080b10; border: 1px solid #1a2535;
          border-radius: 8px; padding: 11px 14px; color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace; font-size: 13px;
          outline: none; transition: border-color 0.15s;
        }
        .hud-input:focus { border-color: #ff6b00; }
        .hud-input.join-input {
          text-align: center; font-size: 22px; letter-spacing: 8px;
          font-weight: 700; color: #6366f1;
        }
        .hud-input.join-input:focus { border-color: #6366f1; }

        .hud-time-pills { display: flex; gap: 8px; }
        .hud-time-pill {
          flex: 1; padding: 9px; text-align: center;
          border-radius: 8px; cursor: pointer; font-size: 13px;
          font-weight: 600; font-family: 'JetBrains Mono', monospace;
          border: 1px solid #1a2535; background: #080b10;
          color: #475569; transition: all 0.15s;
        }
        .hud-time-pill.active { background: #ff6b0015; border-color: #ff6b00; color: #ff6b00; }

        .hud-diff-pills { display: flex; gap: 6px; }
        .hud-diff-pill {
          padding: 6px 12px; border-radius: 7px; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
          border: 1px solid #1a2535; background: #080b10; color: #475569;
          transition: all 0.15s; text-transform: uppercase;
        }

        .hud-btn-create {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          background: #ff6b00; color: #000; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.15s; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .hud-btn-create:hover:not(:disabled) { background: #ff8c30; }
        .hud-btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

        .hud-btn-join {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          background: #6366f1; color: #fff; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.15s; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .hud-btn-join:hover:not(:disabled) { background: #818cf8; }
        .hud-btn-join:disabled { opacity: 0.5; cursor: not-allowed; }

        .hud-room-code-box {
          background: #080b10; border: 2px dashed #ff6b00;
          border-radius: 12px; padding: 28px; text-align: center;
          margin-bottom: 20px;
        }
        .hud-room-code { font-size: 52px; font-weight: 800; color: #ff6b00; font-family: 'JetBrains Mono', monospace; letter-spacing: 10px; }
        .hud-room-meta { font-size: 12px; color: #475569; margin-top: 8px; font-family: 'JetBrains Mono', monospace; }
        .hud-copy-btn {
          background: #0f1520; border: 1px solid #1e2d3d;
          color: #94a3b8; padding: 8px 20px; border-radius: 8px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
          margin-top: 12px; display: inline-block;
        }
        .hud-copy-btn:hover { border-color: #ff6b00; color: #ff6b00; }

        .hud-error {
          margin-top: 14px; padding: 10px 14px; border-radius: 8px;
          background: #ff000010; border: 1px solid #ff000030;
          color: #f87171; font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
        }

        .hud-divider { height: 1px; background: #1a2535; margin: 20px 0; }

        .prob-search-wrap { position: relative; }
        .prob-search {
          width: 100%; background: #080b10; border: 1px solid #1a2535;
          border-radius: 8px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;
          font-size: 12px; padding: 9px 12px 9px 34px; outline: none; transition: border-color 0.15s;
        }
        .prob-search:focus { border-color: #ff6b00; }
        .prob-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #475569; }

        .prob-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; background: #080b10; border: 1px solid #1a2535;
          border-radius: 8px; cursor: pointer; transition: all 0.12s; margin-bottom: 6px;
        }
        .prob-row:hover { border-color: #ff6b0060; }
        .prob-row.selected { border-color: #ff6b00; background: #ff6b0010; }

        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 3px; }
      `}</style>

      <div className="hud-root">

        <div className="hud-topbar">
          <BackButton></BackButton>
          <div className="hud-logo">
            <div className="hud-logo-icon">⚔</div>
            <span className="hud-logo-text">Coding Duels</span>
          </div>
          <button className="hud-leaderboard-btn" onClick={() => navigate('/duel/leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>

        <div className="hud-vs-section">
          <div className="hud-player-card left">
            <div className="hud-player-avatar you">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'Y'}
            </div>
            <div className="hud-player-name">{user?.firstName || 'You'}</div>
            <div className="hud-player-elo">Ready to duel</div>
          </div>

          <div className="hud-vs-center">
            <div className="hud-vs-text">VS</div>
            <div className="hud-vs-sub">DUEL</div>
          </div>

          <div className="hud-player-card right">
            <div className="hud-player-avatar opp">?</div>
            <div className="hud-player-name">Opponent</div>
            <div className="hud-player-elo">Waiting...</div>
          </div>
        </div>

        <div className="hud-tabs">
          <button
            className={`hud-tab ${activeTab === 'create' ? 'active-create' : ''}`}
            onClick={() => { setActiveTab('create'); setError(''); setCreatedRoom(null); }}
          >
            ⚡ Create Room
          </button>
          <button
            className={`hud-tab ${activeTab === 'join' ? 'active-join' : ''}`}
            onClick={() => { setActiveTab('join'); setError(''); }}
          >
            🔗 Join Room
          </button>
          <button
            className={`hud-tab ${activeTab === 'watch' ? 'active-watch' : ''}`}
            onClick={() => { setActiveTab('watch'); setError(''); }}
          >
            👁 Watch
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="hud-panel">
            {!createdRoom ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label className="hud-label">Pick a Problem</label>

                  {selectedProblem ? (
                    <div className="prob-row selected" style={{ cursor: 'default', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{selectedProblem.title}</span>
                        <span style={{
                          marginLeft: 10, fontSize: 10, fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                          color: diffColor(selectedProblem.difficulty)
                        }}>
                          {selectedProblem.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProblem(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="prob-search-wrap" style={{ marginBottom: 8 }}>
                        <Search size={13} className="prob-search-icon" />
                        <input
                          className="prob-search"
                          placeholder="Search problems..."
                          value={problemSearch}
                          onChange={(e) => setProblemSearch(e.target.value)}
                        />
                      </div>

                      <div className="hud-diff-pills" style={{ marginBottom: 10 }}>
                        {['all', 'easy', 'medium', 'hard'].map((d) => (
                          <div
                            key={d}
                            className="hud-diff-pill"
                            onClick={() => setDifficultyFilter(d)}
                            style={difficultyFilter === d ? {
                              borderColor: d === 'all' ? '#ff6b00' : diffColor(d),
                              color: d === 'all' ? '#ff6b00' : diffColor(d),
                              background: `${d === 'all' ? '#ff6b00' : diffColor(d)}15`
                            } : {}}
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                        {problemsLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', color: '#475569' }}>
                            <Loader2 size={14} className="spin-slow" />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>Loading problems…</span>
                          </div>
                        ) : problemsError ? (
                          <div style={{ padding: '20px 0', textAlign: 'center', color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                            {problemsError}
                          </div>
                        ) : filteredProblems.length === 0 ? (
                          <div style={{ padding: '20px 0', textAlign: 'center', color: '#475569', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                            No problems found
                          </div>
                        ) : filteredProblems.map((p) => (
                          <div key={p._id} className="prob-row" onClick={() => setSelectedProblem(p)}>
                            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{p.title}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                              textTransform: 'uppercase', color: diffColor(p.difficulty)
                            }}>
                              {p.difficulty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="hud-label">Time Limit</label>
                  <div className="hud-time-pills">
                    {[15, 30, 45, 60].map(t => (
                      <div
                        key={t}
                        className={`hud-time-pill ${timeLimit === t ? 'active' : ''}`}
                        onClick={() => setTimeLimit(t)}
                      >
                        {t}m
                      </div>
                    ))}
                  </div>
                </div>

                <button className="hud-btn-create" onClick={handleCreate} disabled={loading || !selectedProblem}>
                  {loading ? 'Creating...' : '⚔ Create Duel Room'}
                </button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginBottom: 16 }}>
                    ✓ Room created! Share the code with your opponent.
                  </div>
                </div>

                <div className="hud-room-code-box">
                  <div className="hud-room-code">{createdRoom.roomCode}</div>
                  <div className="hud-room-meta">
                    {createdRoom.problem?.title} · {createdRoom.timeLimit} min
                  </div>
                  <button
                    className="hud-copy-btn"
                    onClick={() => { navigator.clipboard.writeText(createdRoom.roomCode); }}
                  >
                    📋 Copy code
                  </button>
                </div>

                <button
                  className="hud-btn-create"
                  onClick={() => navigate(`/duel/${createdRoom.roomCode}`)}
                >
                  Enter Room →
                </button>

                <div className="hud-divider" />

                <button
                  onClick={() => { setCreatedRoom(null); setSelectedProblem(null); }}
                  style={{
                    background: 'none', border: 'none', color: '#475569',
                    fontSize: 12, cursor: 'pointer', width: '100%',
                    textAlign: 'center', fontFamily: 'Inter, sans-serif'
                  }}
                >
                  ← Create a different room
                </button>
              </>
            )}

            {error && <div className="hud-error">{error}</div>}
          </div>
        )}

        {activeTab === 'join' && (
          <div className="hud-panel">
            <div style={{ marginBottom: 20 }}>
              <label className="hud-label">Room Code</label>
              <input
                className="hud-input join-input"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>

            <button className="hud-btn-join" onClick={handleJoin} disabled={loading}>
              {loading ? 'Joining...' : '→ Enter the Arena'}
            </button>

            {error && <div className="hud-error">{error}</div>}
          </div>
        )}

        {/* ✅ NEW: Watch panel — spectate a live duel without playing */}
        {activeTab === 'watch' && (
          <div className="hud-panel">
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
              Enter a room code to watch a duel live — see both players' progress, the problem, and chat once it wraps up.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="hud-label">Room Code</label>
              <input
                className="hud-input join-input"
                placeholder="ABC123"
                value={watchCode}
                onChange={(e) => setWatchCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ color: '#818cf8' }}
              />
            </div>

            <button
              className="hud-btn-join"
              style={{ background: '#818cf8' }}
              onClick={handleWatch}
              disabled={loading}
            >
              {loading ? 'Loading...' : '👁 Start Watching'}
            </button>

            {error && <div className="hud-error">{error}</div>}
          </div>
        )}

      </div>
    </div>
  );
};

export default DuelLobby;