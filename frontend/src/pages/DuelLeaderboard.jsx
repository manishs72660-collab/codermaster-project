import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import mylogo from "../assets/mylogo.png";
/* ------------------------------------------------------------------ */
/*  CodeMaster Color Palette (matches RoadmapExplorer / DuelPage /    */
/*  DuelLobby)                                                        */
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

// ✅ NEW: shared grid backdrop, matches RoadmapExplorer / DuelPage / DuelLobby
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

// ✅ NEW: top navbar — identical shape/behavior to Roadmap / DuelPage / DuelLobby
function LeaderboardNavbar() {
  return (
    <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, flexShrink: 0, zIndex: 100 }}>
      <div style={{
        height: 48, display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
        maxWidth: 1280, margin: "0 auto",
      }}>
        <div style={{
  width: 28, height: 28, borderRadius: 6,
  overflow: "hidden",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
}}>
  <img
    src={mylogo}
    alt="CodeMaster logo"
    style={{ width: "100%", height: "100%", objectFit: "contain" }}
  />
</div>

        <NavLink to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: CM.text }}>
            CodeMaster
          </span>
        </NavLink>

        <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px", flexShrink: 0 }} />

        <span style={{ fontFamily: MONO, fontSize: 11, color: CM.muted, whiteSpace: "nowrap" }}>
          <NavLink to="/duel" style={{ color: CM.muted, textDecoration: "none" }}>
            Duel
          </NavLink>
          {" / "}
          <span style={{ color: CM.accent }}>Leaderboard</span>
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Badge label="ELO Ranked" color={CM.accent} />
        </div>
      </div>
    </div>
  );
}

const DuelLeaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [lbRes, statsRes] = await Promise.all([
          axiosClient.get('/duel/leaderboard'),
          axiosClient.get('/duel/stats')
        ]);
        setLeaderboard(lbRes.data);
        setMyStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getRankColor = (i) => {
    if (i === 0) return '#ffd700';
    if (i === 1) return '#c0c0c0';
    if (i === 2) return '#cd7f32';
    return CM.dim;
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${CM.border2}; border-radius: 3px; }
  `;

  if (loading) return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: CM.bg, overflow: 'hidden' }}>
      <style>{globalStyles}</style>
      <LeaderboardNavbar />
      <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <GridBackdrop color={CM.accent} />
        <div style={{ width: 40, height: 40, border: `3px solid ${CM.surface2}`, borderTop: `3px solid ${CM.accent}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: CM.bg, color: CM.text,
      fontFamily: SANS, display: 'flex', flexDirection: 'column'
    }}>
      <style>{globalStyles}</style>

      {/* ✅ NEW: shared navbar matching Roadmap / DuelPage / DuelLobby */}
      <LeaderboardNavbar />

      <div style={{ position: 'relative', flex: 1, padding: '40px 20px' }}>
        <GridBackdrop color={CM.accent} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: CM.dim, fontFamily: MONO, marginBottom: 6 }}>
                rank_players()
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, fontFamily: MONO }}>🏆 Duel Leaderboard</h1>
              <p style={{ color: CM.muted, fontSize: 13, marginTop: 4, fontFamily: MONO }}>Top players by ELO rating</p>
            </div>
            <button
              onClick={() => navigate('/duel')}
              style={{
                background: 'linear-gradient(135deg, #ffa116, #e08a00)',
                color: '#0d1117', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontWeight: 700, cursor: 'pointer',
                fontSize: 13, fontFamily: SANS,
                boxShadow: '0 4px 16px rgba(255,161,22,0.25)'
              }}
            >
              ⚔ New Duel
            </button>
          </div>

          {/* My Stats */}
          {myStats && (
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: CM.surface, border: '1px solid rgba(255,161,22,0.3)',
              borderRadius: 14, padding: '20px 24px', marginBottom: 24,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16
            }}>
              <GridBackdrop color={CM.accent} opacity="0d" />
              {[
                { label: 'Rating', value: myStats.rating, color: CM.accent },
                { label: 'Wins', value: myStats.wins, color: CM.green },
                { label: 'Losses', value: myStats.losses, color: CM.red },
                { label: 'Win Rate', value: `${myStats.winRate}%`, color: CM.blue },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: CM.muted, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: MONO }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard table */}
          <div style={{ position: 'relative', overflow: 'hidden', background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 14 }}>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: CM.dim, fontFamily: MONO, fontSize: 12 }}>
                No ranked duels yet — be the first to climb the board.
              </div>
            ) : leaderboard.map((entry, i) => (
              <div key={entry._id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                borderBottom: i < leaderboard.length - 1 ? `1px solid ${CM.border}` : 'none',
                background: i < 3 ? `rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'},0.04)` : 'transparent'
              }}>
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontWeight: 800,
                  fontSize: i < 3 ? 16 : 13,
                  color: getRankColor(i),
                  background: CM.bg, border: `1px solid ${getRankColor(i)}30`
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: CM.text }}>
                    {entry.userId?.firstName || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: CM.muted, fontFamily: MONO }}>
                    {entry.wins}W · {entry.losses}L · {entry.totalDuels} duels
                  </div>
                </div>

                {/* Rating */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: CM.accent, fontFamily: MONO }}>
                    {entry.rating}
                  </div>
                  <div style={{ fontSize: 10, color: CM.muted, fontFamily: MONO }}>ELO</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelLeaderboard;