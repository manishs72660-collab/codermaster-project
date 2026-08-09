import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Loader2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { fetchProblems } from '../problemslice';
import BackButton from '../component/backbutton';

const PROBLEM_FETCH_LIMIT = 200;

/* ------------------------------------------------------------------ */
/*  CodeMaster Color Palette (matches RoadmapExplorer / DuelPage)     */
/* ------------------------------------------------------------------ */
const CM = {
  bg:        "#0d1117",
  surface:   "#161b22",
  surface2:  "#1c2130",
  border:    "#21262d",
  border2:   "#30363d",
  text:      "#e6edf3",
  muted:     "#8b949e",
  dim:       "#495366",
  accent:    "#ffa116",
  accentDim: "#1e1608",
  green:     "#00b86b",
  red:       "#ff4444",
  blue:      "#4493f8",
  purple:    "#c084fc",
  teal:      "#2dd4bf",
  pink:      "#ff5fa6",
  sky:       "#38bdf8",
  whatsapp:  "#25D366",
};

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Outfit', system-ui, sans-serif";

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700,
      fontFamily: MONO, letterSpacing: 0.3, whiteSpace: "nowrap",
      display: "inline-block",
    }}>{label}</span>
  );
}

// ✅ NEW: shared grid backdrop, matches RoadmapExplorer / DuelPage
function GridBackdrop({ color = CM.accent, opacity = "14" }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${color}${opacity} 1px, transparent 1px), linear-gradient(90deg, ${color}${opacity} 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 40%, transparent 90%)",
      }}
    />
  );
}

// ✅ NEW: top navbar — identical shape/behavior to the one on the Roadmap & Duel pages
function DuelLobbyNavbar() {
  return (
    <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, flexShrink: 0, zIndex: 100 }}>
      <div style={{
        height: 48, display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
        maxWidth: 1280, margin: "0 auto",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "linear-gradient(135deg,#ffa116,#ff6b00)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#0d1117", flexShrink: 0,
        }}>⌨</div>

        <NavLink to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: CM.text }}>
            CodeMaster
          </span>
        </NavLink>

        <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px", flexShrink: 0 }} />

        <span style={{ fontFamily: MONO, fontSize: 11, color: CM.muted, whiteSpace: "nowrap" }}>
          <NavLink to="/explore" style={{ color: CM.muted, textDecoration: "none" }}>
            Explore
          </NavLink>
          {" / "}
          <span style={{ color: CM.accent }}>Duel Lobby</span>
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Badge label="Ranked" color={CM.green} />
          <Badge label="1v1" color={CM.accent} />
        </div>
      </div>
    </div>
  );
}

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
  const [copied, setCopied] = useState(false); // ✅ NEW: copy feedback

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
    if (d === 'easy') return CM.green;
    if (d === 'medium') return CM.accent;
    if (d === 'hard') return CM.red;
    return CM.muted;
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

  // ✅ NEW: copy room code with brief visual feedback
  const handleCopyCode = () => {
    if (!createdRoom?.roomCode) return;
    navigator.clipboard.writeText(createdRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ✅ NEW: share the room invite on WhatsApp
  const handleShareWhatsApp = () => {
    if (!createdRoom?.roomCode) return;
    const link = `${window.location.origin}/duel/${createdRoom.roomCode}`;
    const message =
      `⚔ Join my coding duel on CodeMaster!\n` +
      `Room Code: ${createdRoom.roomCode}\n` +
      `Problem: ${createdRoom.problem?.title || 'N/A'} · ${createdRoom.timeLimit} min\n\n` +
      `Join here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: CM.bg,
      color: CM.text,
      fontFamily: SANS,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .hud-root { width: 100%; max-width: 900px; margin: 0 auto; padding: 32px 24px 48px; position: relative; }

        .hud-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px;
        }
        .hud-logo { display: flex; align-items: center; gap: 10px; }
        .hud-eyebrow {
          font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
          color: ${CM.dim}; font-family: ${MONO}; margin-bottom: 4px;
        }
        .hud-title { font-size: 22px; font-weight: 800; color: ${CM.text}; letter-spacing: -0.4px; font-family: ${MONO}; }
        .hud-leaderboard-btn {
          background: ${CM.surface}; border: 1px solid ${CM.border};
          color: ${CM.muted}; padding: 8px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: ${SANS}; transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .hud-leaderboard-btn:hover { border-color: ${CM.accent}; color: ${CM.accent}; }

        .hud-vs-section {
          display: grid; grid-template-columns: 1fr 88px 1fr;
          gap: 0; align-items: stretch; margin-bottom: 28px;
          position: relative;
        }
        .hud-player-card {
          background: ${CM.surface}; border: 1px solid ${CM.border};
          padding: 24px; display: flex; flex-direction: column;
          align-items: center; gap: 8px; position: relative;
        }
        .hud-player-card.left { border-radius: 16px 0 0 16px; border-right: none; }
        .hud-player-card.right { border-radius: 0 16px 16px 0; border-left: none; }
        .hud-player-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; margin-bottom: 4px; font-family: ${MONO};
        }
        .hud-player-avatar.you { background: ${CM.accent}20; border: 2px solid ${CM.accent}; color: ${CM.accent}; }
        .hud-player-avatar.opp { background: ${CM.purple}20; border: 2px solid ${CM.purple}; color: ${CM.purple}; }
        .hud-player-name { font-size: 14px; font-weight: 700; color: ${CM.text}; }
        .hud-player-elo { font-size: 11px; color: ${CM.muted}; font-family: ${MONO}; }

        .hud-vs-center {
          background: ${CM.surface2}; border-top: 1px solid ${CM.border};
          border-bottom: 1px solid ${CM.border};
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; padding: 24px 0; gap: 6px;
        }
        .hud-vs-text { font-size: 26px; font-weight: 800; color: ${CM.accent}; font-family: ${MONO}; letter-spacing: 2px; }
        .hud-vs-sub { font-size: 9px; color: ${CM.dim}; letter-spacing: 3px; font-family: ${MONO}; }

        .hud-tabs {
          display: flex; gap: 0; margin-bottom: 20px;
          background: ${CM.surface}; border: 1px solid ${CM.border};
          border-radius: 12px; padding: 4px;
        }
        .hud-tab {
          flex: 1; padding: 10px; text-align: center;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border-radius: 9px; transition: all 0.15s;
          color: ${CM.dim}; border: none; background: transparent;
          font-family: ${SANS};
        }
        .hud-tab.active-create { background: ${CM.accent}; color: #0d1117; }
        .hud-tab.active-join { background: ${CM.purple}; color: #0d1117; }
        .hud-tab.active-watch { background: ${CM.sky}; color: #0d1117; }

        .hud-panel {
          position: relative; overflow: hidden;
          background: ${CM.surface}; border: 1px solid ${CM.border};
          border-radius: 12px; padding: 24px;
        }

        .hud-label {
          font-size: 11px; font-weight: 700; color: ${CM.dim};
          letter-spacing: 0.5px; text-transform: uppercase;
          margin-bottom: 8px; display: block; font-family: ${MONO};
        }
        .hud-input {
          width: 100%; background: ${CM.bg}; border: 1px solid ${CM.border};
          border-radius: 8px; padding: 11px 14px; color: ${CM.text};
          font-family: ${MONO}; font-size: 13px;
          outline: none; transition: border-color 0.15s;
        }
        .hud-input:focus { border-color: ${CM.accent}; }
        .hud-input.join-input {
          text-align: center; font-size: 22px; letter-spacing: 8px;
          font-weight: 700; color: ${CM.purple};
        }
        .hud-input.join-input:focus { border-color: ${CM.purple}; }

        .hud-time-pills { display: flex; gap: 8px; }
        .hud-time-pill {
          flex: 1; padding: 9px; text-align: center;
          border-radius: 8px; cursor: pointer; font-size: 13px;
          font-weight: 700; font-family: ${MONO};
          border: 1px solid ${CM.border}; background: ${CM.bg};
          color: ${CM.dim}; transition: all 0.15s;
        }
        .hud-time-pill.active { background: ${CM.accent}15; border-color: ${CM.accent}; color: ${CM.accent}; }

        .hud-diff-pills { display: flex; gap: 6px; }
        .hud-diff-pill {
          padding: 6px 12px; border-radius: 7px; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: ${MONO};
          border: 1px solid ${CM.border}; background: ${CM.bg}; color: ${CM.dim};
          transition: all 0.15s; text-transform: uppercase;
        }

        .hud-btn-create {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, ${CM.accent}, #e08a00); color: #0d1117; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: ${SANS};
          transition: all 0.15s; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(255,161,22,0.25);
        }
        .hud-btn-create:hover:not(:disabled) { filter: brightness(1.08); }
        .hud-btn-create:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

        .hud-btn-join {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, ${CM.purple}, #9333ea); color: #fff; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: ${SANS};
          transition: all 0.15s; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .hud-btn-join:hover:not(:disabled) { filter: brightness(1.08); }
        .hud-btn-join:disabled { opacity: 0.5; cursor: not-allowed; }

        .hud-room-code-box {
          position: relative; overflow: hidden;
          background: ${CM.bg}; border: 2px dashed ${CM.accent};
          border-radius: 12px; padding: 28px; text-align: center;
          margin-bottom: 20px;
        }
        .hud-room-code { font-size: 52px; font-weight: 800; color: ${CM.accent}; font-family: ${MONO}; letter-spacing: 10px; }
        .hud-room-meta { font-size: 12px; color: ${CM.muted}; margin-top: 8px; font-family: ${MONO}; }

        /* ✅ NEW: row that holds the copy + whatsapp buttons side by side */
        .hud-share-row {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-top: 14px; flex-wrap: wrap;
        }
        .hud-copy-btn {
          background: ${CM.surface}; border: 1px solid ${CM.border};
          color: ${CM.muted}; padding: 8px 20px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: ${SANS}; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .hud-copy-btn:hover { border-color: ${CM.accent}; color: ${CM.accent}; }
        .hud-copy-btn.copied { border-color: ${CM.green}; color: ${CM.green}; }

        /* ✅ NEW: whatsapp share button */
        .hud-whatsapp-btn {
          background: ${CM.whatsapp}15; border: 1px solid ${CM.whatsapp}55;
          color: ${CM.whatsapp}; padding: 8px 20px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: ${SANS}; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .hud-whatsapp-btn:hover { background: ${CM.whatsapp}25; border-color: ${CM.whatsapp}; }

        .hud-error {
          margin-top: 14px; padding: 10px 14px; border-radius: 8px;
          background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.3);
          color: #ff8080; font-size: 12px;
          font-family: ${MONO};
        }

        .hud-divider { height: 1px; background: ${CM.border}; margin: 20px 0; }

        .prob-search-wrap { position: relative; }
        .prob-search {
          width: 100%; background: ${CM.bg}; border: 1px solid ${CM.border};
          border-radius: 8px; color: ${CM.text}; font-family: ${MONO};
          font-size: 12px; padding: 9px 12px 9px 34px; outline: none; transition: border-color 0.15s;
        }
        .prob-search:focus { border-color: ${CM.accent}; }
        .prob-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: ${CM.dim}; }

        .prob-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; background: ${CM.bg}; border: 1px solid ${CM.border};
          border-radius: 8px; cursor: pointer; transition: all 0.12s; margin-bottom: 6px;
        }
        .prob-row:hover { border-color: rgba(255,161,22,0.4); }
        .prob-row.selected { border-color: ${CM.accent}; background: rgba(255,161,22,0.06); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin 1s linear infinite; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${CM.border2}; border-radius: 3px; }
      `}</style>

      {/* ✅ NEW: shared navbar matching the Roadmap / Duel pages */}
      <DuelLobbyNavbar />

      <div style={{ position: 'relative', flex: 1 }}>
        <GridBackdrop color={CM.accent} />

        <div className="hud-root">

          <div className="hud-topbar">
            <BackButton></BackButton>
            <div className="hud-logo" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="hud-eyebrow">start_a_match()</span>
              <span className="hud-title">⚔ Coding Duels</span>
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
              <GridBackdrop color={CM.accent} opacity="0a" />
              {!createdRoom ? (
                <>
                  <div style={{ marginBottom: 18, position: 'relative' }}>
                    <label className="hud-label">Pick a Problem</label>

                    {selectedProblem ? (
                      <div className="prob-row selected" style={{ cursor: 'default', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 13, color: CM.text, fontWeight: 600 }}>{selectedProblem.title}</span>
                          <span style={{
                            marginLeft: 10, fontSize: 10, fontWeight: 700,
                            fontFamily: MONO, textTransform: 'uppercase',
                            color: diffColor(selectedProblem.difficulty)
                          }}>
                            {selectedProblem.difficulty}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedProblem(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: CM.dim, display: 'flex' }}
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
                                borderColor: d === 'all' ? CM.accent : diffColor(d),
                                color: d === 'all' ? CM.accent : diffColor(d),
                                background: `${d === 'all' ? CM.accent : diffColor(d)}15`
                              } : {}}
                            >
                              {d}
                            </div>
                          ))}
                        </div>

                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                          {problemsLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', color: CM.dim }}>
                              <Loader2 size={14} className="spin-slow" />
                              <span style={{ fontFamily: MONO, fontSize: 11 }}>Loading problems…</span>
                            </div>
                          ) : problemsError ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: '#ff8080', fontFamily: MONO, fontSize: 11 }}>
                              {problemsError}
                            </div>
                          ) : filteredProblems.length === 0 ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: CM.dim, fontFamily: MONO, fontSize: 11 }}>
                              No problems found
                            </div>
                          ) : filteredProblems.map((p) => (
                            <div key={p._id} className="prob-row" onClick={() => setSelectedProblem(p)}>
                              <span style={{ fontSize: 13, color: CM.text, fontWeight: 500 }}>{p.title}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: MONO,
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

                  <div style={{ marginBottom: 20, position: 'relative' }}>
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

                  <div style={{ position: 'relative' }}>
                    <button className="hud-btn-create" onClick={handleCreate} disabled={loading || !selectedProblem}>
                      {loading ? 'Creating...' : '⚔ Create Duel Room'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: CM.green, fontWeight: 700, marginBottom: 16, fontFamily: MONO }}>
                      ✓ Room created! Share the code with your opponent.
                    </div>
                  </div>

                  <div className="hud-room-code-box">
                    <GridBackdrop color={CM.accent} opacity="10" />
                    <div style={{ position: 'relative' }}>
                      <div className="hud-room-code">{createdRoom.roomCode}</div>
                      <div className="hud-room-meta">
                        {createdRoom.problem?.title} · {createdRoom.timeLimit} min
                      </div>

                      {/* ✅ NEW: copy + WhatsApp share, side by side */}
                      <div className="hud-share-row">
                        <button
                          className={`hud-copy-btn ${copied ? 'copied' : ''}`}
                          onClick={handleCopyCode}
                        >
                          {copied ? '✓ Copied!' : '📋 Copy code'}
                        </button>
                        <button
                          className="hud-whatsapp-btn"
                          onClick={handleShareWhatsApp}
                        >
                          📲 Share on WhatsApp
                        </button>
                      </div>
                    </div>
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
                      background: 'none', border: 'none', color: CM.dim,
                      fontSize: 12, cursor: 'pointer', width: '100%',
                      textAlign: 'center', fontFamily: SANS
                    }}
                  >
                    ← Create a different room
                  </button>
                </div>
              )}

              {error && <div className="hud-error">{error}</div>}
            </div>
          )}

          {activeTab === 'join' && (
            <div className="hud-panel">
              <GridBackdrop color={CM.purple} opacity="0a" />
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <label className="hud-label">Room Code</label>
                <input
                  className="hud-input join-input"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <button className="hud-btn-join" onClick={handleJoin} disabled={loading}>
                  {loading ? 'Joining...' : '→ Enter the Arena'}
                </button>
              </div>

              {error && <div className="hud-error">{error}</div>}
            </div>
          )}

          {/* ✅ NEW: Watch panel — spectate a live duel without playing */}
          {activeTab === 'watch' && (
            <div className="hud-panel">
              <GridBackdrop color={CM.sky} opacity="0a" />
              <p style={{ position: 'relative', fontSize: 12, color: CM.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Enter a room code to watch a duel live — see both players' progress, the problem, and chat once it wraps up.
              </p>
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <label className="hud-label">Room Code</label>
                <input
                  className="hud-input join-input"
                  placeholder="ABC123"
                  value={watchCode}
                  onChange={(e) => setWatchCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ color: CM.sky }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  className="hud-btn-join"
                  style={{ background: 'none', backgroundImage: `linear-gradient(135deg, ${CM.sky}, #0ea5e9)` }}
                  onClick={handleWatch}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : '👁 Start Watching'}
                </button>
              </div>

              {error && <div className="hud-error">{error}</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DuelLobby;