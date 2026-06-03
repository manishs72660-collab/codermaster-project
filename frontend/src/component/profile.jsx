import { useState } from "react";
import { NavLink } from "react-router-dom";

// ─── ALL MOCK DATA — replace with real API/redux later ──────────────────────
const USER = {
  firstName:  "Manish Kumar",
  email:      "manishsingh3631@gmail.com",
  role:       "admin",
  username:   "manish_dev",
  joinedAt:   "January 2024",
  location:   "India",
  languages:  ["JavaScript", "C++"],
};

const STATS = {
  rank:   1,
  easy:   2,
  medium: 0,
  hard:   0,
  total:  2,
  streak: 3,
  submissions: 5,
  acceptanceRate: 100,
};

const SOLVED_PROBLEMS = [
  {
    id:         1,
    title:      "Two Sum",
    difficulty: "Easy",
    tag:        "Array",
    language:   "JavaScript",
    runtime:    "72ms",
    memory:     "42.1 MB",
    status:     "Accepted",
    solvedAt:   "25 May 2024",
  },
  {
    id:         2,
    title:      "Valid Parentheses",
    difficulty: "Easy",
    tag:        "Stack",
    language:   "JavaScript",
    runtime:    "56ms",
    memory:     "41.3 MB",
    status:     "Accepted",
    solvedAt:   "26 May 2024",
  },
];

const BADGES = [
  { icon: "⚡", label: "First Solve",   desc: "Solved your first problem",  earned: true  },
  { icon: "👑", label: "Admin",         desc: "Platform administrator",     earned: true  },
  { icon: "🔥", label: "3-Day Streak",  desc: "Solved 3 days in a row",     earned: true  },
  { icon: "🎯", label: "Sharp Shooter", desc: "Solve 10 problems",          earned: false },
  { icon: "🚀", label: "Speed Demon",   desc: "Solve in under 2 min",       earned: false },
  { icon: "💎", label: "Diamond",       desc: "Solve 100 problems",         earned: false },
];

// ─── TINY DONUT ──────────────────────────────────────────────────────────────
function Donut({ easy, medium, hard }) {
  const R = 44, sw = 7, cx = 52, cy = 52, C = 2 * Math.PI * R;
  const total = easy + medium + hard || 1;
  const eD = (easy   / total) * C * 0.96;
  const mD = (medium / total) * C * 0.96;
  const hD = (hard   / total) * C * 0.96;
  const gap = C * 0.02;
  return (
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#21262d" strokeWidth={sw} />
      {easy > 0 && (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#3fb950" strokeWidth={sw}
          strokeDasharray={`${eD} ${C}`} strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      {medium > 0 && (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffa116" strokeWidth={sw}
          strokeDasharray={`${mD} ${C}`} strokeDashoffset={-(eD + gap)}
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      {hard > 0 && (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f85149" strokeWidth={sw}
          strokeDasharray={`${hD} ${C}`} strokeDashoffset={-(eD + gap + mD + gap)}
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
      {easy === 0 && medium === 0 && hard === 0 && (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#21262d" strokeWidth={sw}
          strokeDasharray={`${C * 0.97} ${C * 0.03}`}
          transform={`rotate(-90 ${cx} ${cy})`} />
      )}
    </svg>
  );
}

// ─── HEATMAP (16 weeks mock) ─────────────────────────────────────────────────
function HeatMap() {
  const weeks = 16, days = 7;
  const grid = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      if (w === 15 && d === 1) return 2;
      if (w === 15 && d === 3) return 1;
      return 0;
    })
  );
  const color = (v) =>
    v === 0 ? "#161b22" : v === 1 ? "#0e2a1a" : v === 2 ? "#1a4228" : "#3fb950";
  const dl = ["S","M","T","W","T","F","S"];
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 3, minWidth: "fit-content" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 1, marginRight: 3 }}>
          {dl.map((d, i) => (
            <div key={i} style={{ height: 11, width: 8, fontSize: 8, fontFamily: "monospace", color: "#484f58", display: "flex", alignItems: "center" }}>
              {i % 2 === 1 ? d : ""}
            </div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((v, di) => (
              <div key={di} style={{ width: 11, height: 11, borderRadius: 2, background: color(v), border: "1px solid rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 8, fontFamily: "monospace", color: "#484f58" }}>Less</span>
        {["#161b22", "#0e2a1a", "#1a4228", "#3fb950"].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: "1px solid #21262d" }} />
        ))}
        <span style={{ fontSize: 8, fontFamily: "monospace", color: "#484f58" }}>More</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [tab, setTab] = useState("problems");

  const initials = USER.firstName.split(" ").map(w => w[0]).join("").toUpperCase();
  const isAdmin  = USER.role === "admin";

  const diffColor = { Easy: "#3fb950", Medium: "#ffa116", Hard: "#f85149" };
  const diffBg    = { Easy: "rgba(63,185,80,0.1)", Medium: "rgba(255,161,22,0.1)", Hard: "rgba(248,81,73,0.1)" };
  const diffBdr   = { Easy: "rgba(63,185,80,0.25)", Medium: "rgba(255,161,22,0.25)", Hard: "rgba(248,81,73,0.25)" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0e1117;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px;}
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0e1117",
        color: "#e6edf3",
        fontFamily: "'Outfit', sans-serif",
      }}>

        {/* ── NAV ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          height: 52,
          background: "rgba(22,27,34,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #21262d",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 12,
        }}>
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 28, height: 28,
              background: "linear-gradient(135deg,#ffa116,#e08a00)",
              borderRadius: 7, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0e1117",
              boxShadow: "0 0 14px rgba(255,161,22,0.3)",
            }}>⌨</div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 15, color: "#e6edf3", letterSpacing: -0.3 }}>
              CodeMaster
            </span>
          </NavLink>

          <div style={{ width: 1, height: 16, background: "#30363d", margin: "0 4px" }} />
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#484f58" }}>
            Profile / <span style={{ color: "#ffa116" }}>{USER.username}</span>
          </span>

          <div style={{ marginLeft: "auto" }}>
            <NavLink to="/" style={{ textDecoration: "none" }}>
              <button style={{
                background: "none", border: "1px solid #30363d", borderRadius: 7,
                color: "#7d8590", fontFamily: "'Outfit',sans-serif", fontSize: 12,
                padding: "5px 14px", cursor: "pointer",
              }}>← Problems</button>
            </NavLink>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 80px" }}>

          {/* ── PROFILE CARD ── */}
          <div style={{
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 20,
          }}>
            {/* orange top bar */}
            <div style={{ height: 4, background: "linear-gradient(90deg,#ffa116,#ff6b00,#ffa116)", opacity: 0.8 }} />

            <div style={{ padding: "28px 28px 24px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

              {/* Avatar */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  {isAdmin && (
                    <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 16, filter: "drop-shadow(0 2px 4px rgba(255,161,22,0.5))" }}>👑</span>
                  )}
                  <div style={{
                    width: 80, height: 80,
                    marginTop: isAdmin ? 10 : 0,
                    borderRadius: 14,
                    background: "#0e1117",
                    border: "2px solid #30363d",
                    outline: "3px solid rgba(255,161,22,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: "#ffa116",
                  }}>
                    {initials}
                  </div>
                </div>
                {/* online dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb950", boxShadow: "0 0 7px rgba(63,185,80,0.7)" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#3fb950", letterSpacing: 1 }}>ONLINE</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 220 }}>
                {/* role badge */}
                {isAdmin && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(56,139,253,0.1)", border: "1px solid rgba(56,139,253,0.25)",
                    borderRadius: 20, padding: "3px 10px", marginBottom: 10,
                    fontFamily: "monospace", fontSize: 9, fontWeight: 600,
                    color: "#388bfd", letterSpacing: 1.5, textTransform: "uppercase",
                  }}>⚙ Administrator</div>
                )}

                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
                  {USER.firstName}
                </h1>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#ffa116", marginBottom: 4 }}>
                  @{USER.username}
                </p>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#484f58", marginBottom: 16 }}>
                  {USER.email}
                </p>

                {/* tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { text: `📅 Joined ${USER.joinedAt}` },
                    { text: `📍 ${USER.location}` },
                    ...USER.languages.map(l => ({ text: `⌨ ${l}` })),
                    { text: `✓ ${STATS.total} Solved`, color: "#3fb950", bg: "rgba(63,185,80,0.08)", bdr: "rgba(63,185,80,0.2)" },
                  ].map((t, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center",
                      background: t.bg || "#1c2130", border: `1px solid ${t.bdr || "#21262d"}`,
                      borderRadius: 6, padding: "4px 10px",
                      fontFamily: "monospace", fontSize: 10,
                      color: t.color || "#7d8590",
                    }}>{t.text}</span>
                  ))}
                </div>
              </div>

              {/* Rank */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontFamily: "'Outfit',sans-serif", fontSize: 52, fontWeight: 800,
                  color: "#ffa116", letterSpacing: -3, lineHeight: 1,
                  textShadow: "0 0 32px rgba(255,161,22,0.35)",
                }}>#{STATS.rank}</div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
                  Global Rank
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7d8590" }}>
                    <span style={{ color: "#ffa116", fontWeight: 700 }}>{STATS.total}</span> / 2700 solved
                  </span>
                  <div style={{ width: 110, height: 3, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(STATS.total / 2700) * 100}%`, background: "#ffa116", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4 QUICK STAT BOXES ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #21262d" }}>
              {[
                { label: "Rank",        value: `#${STATS.rank}`,           color: "#ffa116" },
                { label: "Submissions", value: STATS.submissions,           color: "#388bfd" },
                { label: "Acceptance",  value: `${STATS.acceptanceRate}%`,  color: "#3fb950" },
                { label: "Streak",      value: `${STATS.streak} 🔥`,        color: "#ffa116" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "16px 20px",
                  borderRight: i < 3 ? "1px solid #21262d" : "none",
                  background: "#161b22",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1c2130"}
                  onMouseLeave={e => e.currentTarget.style.background = "#161b22"}
                >
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 284px", gap: 16, alignItems: "start" }}>

            {/* ── LEFT ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 2, background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: 4, width: "fit-content" }}>
                {[
                  { id: "problems", label: "Problems" },
                  { id: "stats",    label: "Stats" },
                  { id: "activity", label: "Activity" },
                  { id: "badges",   label: "Badges" },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: tab === t.id ? "#1c2130" : "none",
                    border: tab === t.id ? "1px solid #30363d" : "1px solid transparent",
                    borderRadius: 7,
                    cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
                    color: tab === t.id ? "#ffa116" : "#484f58",
                    padding: "6px 16px",
                    transition: "all 0.12s",
                  }}>{t.label}</button>
                ))}
              </div>

              {/* ── PROBLEMS TAB ── */}
              {tab === "problems" && (
                <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                  {/* header */}
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3fb950" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 600, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      Solved Problems
                    </span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#484f58" }}>
                      {SOLVED_PROBLEMS.length} accepted
                    </span>
                  </div>

                  {/* column headers */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "24px 1fr 80px 70px 80px",
                    gap: 12, padding: "10px 20px",
                    borderBottom: "1px solid #21262d",
                  }}>
                    {["#", "Problem", "Difficulty", "Language", "Solved On"].map((h, i) => (
                      <span key={h} style={{
                        fontFamily: "monospace", fontSize: 9, color: "#30363d",
                        letterSpacing: 1.5, textTransform: "uppercase",
                        textAlign: i > 0 && i < 2 ? "left" : i === 0 ? "right" : "right",
                      }}>{h}</span>
                    ))}
                  </div>

                  {/* rows */}
                  {SOLVED_PROBLEMS.map((p, i) => (
                    <div key={p.id}
                      style={{
                        display: "grid", gridTemplateColumns: "24px 1fr 80px 70px 80px",
                        gap: 12, padding: "12px 20px", alignItems: "center",
                        borderBottom: i < SOLVED_PROBLEMS.length - 1 ? "1px solid #161b22" : "none",
                        transition: "background 0.1s", cursor: "pointer",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1c2130"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#30363d", textAlign: "right" }}>{i + 1}</span>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: diffColor[p.difficulty], flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.title}
                        </span>
                        <span style={{
                          fontFamily: "monospace", fontSize: 9, color: "#3fb950",
                          background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)",
                          padding: "1px 6px", borderRadius: 3, flexShrink: 0, letterSpacing: 0.5,
                        }}>✓ AC</span>
                      </div>

                      <span style={{
                        fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                        color: diffColor[p.difficulty],
                        background: diffBg[p.difficulty],
                        border: `1px solid ${diffBdr[p.difficulty]}`,
                        padding: "2px 8px", borderRadius: 4,
                        textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5,
                        display: "block",
                      }}>{p.difficulty}</span>

                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7d8590", textAlign: "right" }}>{p.language}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", textAlign: "right" }}>{p.solvedAt}</span>
                    </div>
                  ))}

                  {/* runtime/memory detail */}
                  <div style={{ borderTop: "1px solid #21262d", padding: "12px 20px", background: "#0e1117", display: "flex", gap: 20 }}>
                    {SOLVED_PROBLEMS.map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#484f58" }}>{p.title}:</span>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#3fb950" }}>⚡ {p.runtime}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#388bfd" }}>◉ {p.memory}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STATS TAB ── */}
              {tab === "stats" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* big numbers */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                    border: "1px solid #21262d", borderRadius: 14, overflow: "hidden",
                    background: "#161b22",
                  }}>
                    {[
                      { label: "Easy Solved",   value: STATS.easy,   color: "#3fb950" },
                      { label: "Medium Solved",  value: STATS.medium, color: "#ffa116" },
                      { label: "Hard Solved",    value: STATS.hard,   color: "#f85149" },
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: "20px", textAlign: "center",
                        borderRight: i < 2 ? "1px solid #21262d" : "none",
                      }}>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                          {s.label}
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 800, color: s.color, letterSpacing: -2 }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* donut + bars */}
                  <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3fb950" }} />
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 600, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Problem Breakdown</span>
                      <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#484f58" }}>{STATS.total} / 2700</span>
                    </div>
                    <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 28 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Donut easy={STATS.easy} medium={STATS.medium} hard={STATS.hard} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#e6edf3", letterSpacing: -1, lineHeight: 1 }}>{STATS.total}</span>
                          <span style={{ fontFamily: "monospace", fontSize: 8, color: "#484f58", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>solved</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        {[
                          { label: "Easy",   solved: STATS.easy,   total: 820,  color: "#3fb950" },
                          { label: "Medium", solved: STATS.medium, total: 1340, color: "#ffa116" },
                          { label: "Hard",   solved: STATS.hard,   total: 540,  color: "#f85149" },
                        ].map(row => (
                          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: row.color, width: 50, flexShrink: 0 }}>{row.label}</span>
                            <div style={{ flex: 1, height: 3, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(row.solved / row.total) * 100}%`, background: row.color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7d8590", flexShrink: 0 }}>
                              <strong style={{ color: "#e6edf3" }}>{row.solved}</strong> / {row.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* summary boxes */}
                    <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
                      {[
                        { label: "Easy",   val: STATS.easy,   total: 820,  color: "#3fb950", bg: "rgba(63,185,80,0.07)",   bdr: "rgba(63,185,80,0.18)"  },
                        { label: "Medium", val: STATS.medium, total: 1340, color: "#ffa116", bg: "rgba(255,161,22,0.07)",  bdr: "rgba(255,161,22,0.18)" },
                        { label: "Hard",   val: STATS.hard,   total: 540,  color: "#f85149", bg: "rgba(248,81,73,0.07)",   bdr: "rgba(248,81,73,0.18)"  },
                      ].map(b => (
                        <div key={b.label} style={{ flex: 1, background: b.bg, border: `1px solid ${b.bdr}`, borderRadius: 10, padding: "12px 0", textAlign: "center" }}>
                          <div style={{ fontFamily: "monospace", fontSize: 8, color: b.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{b.label}</div>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: b.color, letterSpacing: -1.5, lineHeight: 1 }}>{b.val}</div>
                          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#484f58", marginTop: 4 }}>/ {b.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACTIVITY TAB ── */}
              {tab === "activity" && (
                <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#388bfd" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 600, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Submission Heatmap</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#484f58" }}>Last 16 weeks</span>
                  </div>
                  <div style={{ padding: "20px" }}>
                    <HeatMap />
                  </div>

                  {/* monthly bars */}
                  <div style={{ borderTop: "1px solid #21262d", padding: "20px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Monthly Activity</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      {[
                        { m: "Jan", n: 0 }, { m: "Feb", n: 0 }, { m: "Mar", n: 0 },
                        { m: "Apr", n: 0 }, { m: "May", n: 2, now: true },
                      ].map(({ m, n, now }) => (
                        <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 9, color: now ? "#ffa116" : "#484f58" }}>{n || ""}</span>
                          <div style={{ width: "100%", height: 56, background: "#0e1117", border: "1px solid #21262d", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                            <div style={{ width: "100%", height: n === 0 ? 0 : `${(n / 2) * 100}%`, background: now ? "linear-gradient(180deg,#ffa116,#e08a00)" : "#21262d", transition: "height 0.3s" }} />
                          </div>
                          <span style={{ fontFamily: "monospace", fontSize: 9, color: now ? "#ffa116" : "#30363d" }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BADGES TAB ── */}
              {tab === "badges" && (
                <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ffa116" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 600, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Achievements</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#484f58" }}>
                      {BADGES.filter(b => b.earned).length} / {BADGES.length}
                    </span>
                  </div>
                  <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {BADGES.map(b => (
                      <div key={b.label} style={{
                        background: b.earned ? "#1c2130" : "#0e1117",
                        border: `1px solid ${b.earned ? "#30363d" : "#21262d"}`,
                        borderRadius: 10, padding: "14px 12px",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 6, textAlign: "center",
                        opacity: b.earned ? 1 : 0.4,
                        transition: "border-color 0.15s, background 0.15s",
                        cursor: "default",
                      }}
                        onMouseEnter={e => { if (b.earned) { e.currentTarget.style.borderColor = "#ffa116"; e.currentTarget.style.background = "rgba(255,161,22,0.05)"; } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = b.earned ? "#30363d" : "#21262d"; e.currentTarget.style.background = b.earned ? "#1c2130" : "#0e1117"; }}
                      >
                        <span style={{ fontSize: 22 }}>{b.earned ? b.icon : "🔒"}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>{b.label}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", lineHeight: 1.4 }}>{b.desc}</span>
                        {b.earned && (
                          <span style={{ fontFamily: "monospace", fontSize: 8, color: "#3fb950", background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.2)", padding: "1px 7px", borderRadius: 10, marginTop: 2 }}>
                            Earned
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* next achievement */}
                  <div style={{ margin: "0 20px 20px", background: "#0e1117", border: "1px solid #21262d", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7d8590", fontWeight: 600 }}>Next: 🎯 Sharp Shooter</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#ffa116" }}>2 / 10</span>
                    </div>
                    <div style={{ height: 3, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "20%", background: "linear-gradient(90deg,#ffa116,#ff6b00)", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", marginTop: 6 }}>Solve 8 more problems to unlock</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Account info */}
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ffa116" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Account</span>
                </div>
                <div style={{ padding: "4px 0" }}>
                  {[
                    { key: "Name",     val: USER.firstName,                       color: "#e6edf3" },
                    { key: "Role",     val: isAdmin ? "Administrator" : "Member",  color: isAdmin ? "#388bfd" : "#7d8590" },
                    { key: "Joined",   val: USER.joinedAt,                         color: "#7d8590" },
                    { key: "Location", val: USER.location,                          color: "#7d8590" },
                    { key: "Status",   val: "Active",                               color: "#3fb950" },
                  ].map(({ key, val, color }) => (
                    <div key={key} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 18px", borderBottom: "1px solid #161b22",
                    }}>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "#484f58", letterSpacing: 1.2, textTransform: "uppercase" }}>{key}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color }}>{val}</span>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div style={{ padding: "12px 16px", borderTop: "1px solid #21262d" }}>
                    <NavLink to="/admin" style={{ textDecoration: "none" }}>
                      <button style={{
                        width: "100%", background: "rgba(56,139,253,0.1)",
                        border: "1px solid rgba(56,139,253,0.25)", borderRadius: 8,
                        color: "#388bfd", fontFamily: "'Outfit',sans-serif", fontSize: 12,
                        fontWeight: 700, padding: "8px 0", cursor: "pointer", letterSpacing: 0.3,
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.target.style.background = "rgba(56,139,253,0.18)"}
                        onMouseLeave={e => e.target.style.background = "rgba(56,139,253,0.1)"}
                      >🔧 Admin Panel →</button>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Solve progress */}
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3fb950" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Progress</span>
                </div>
                <div style={{ padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    <Donut easy={STATS.easy} medium={STATS.medium} hard={STATS.hard} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#e6edf3", letterSpacing: -1, lineHeight: 1 }}>{STATS.total}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 8, color: "#484f58", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>solved</span>
                    </div>
                  </div>
                  <div style={{ width: "100%" }}>
                    {[
                      { label: "Easy",   val: STATS.easy,   color: "#3fb950" },
                      { label: "Medium", val: STATS.medium, color: "#ffa116" },
                      { label: "Hard",   val: STATS.hard,   color: "#f85149" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7d8590", flex: 1 }}>{r.label}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid #21262d", background: "#1c2130", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#388bfd" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#484f58", letterSpacing: 1.5, textTransform: "uppercase" }}>Languages</span>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {USER.languages.map((l, i) => (
                    <span key={l} style={{
                      fontFamily: "monospace", fontSize: 10, fontWeight: 600,
                      color: i === 0 ? "#ffa116" : "#388bfd",
                      background: i === 0 ? "rgba(255,161,22,0.08)" : "rgba(56,139,253,0.08)",
                      border: `1px solid ${i === 0 ? "rgba(255,161,22,0.2)" : "rgba(56,139,253,0.2)"}`,
                      padding: "4px 12px", borderRadius: 6,
                    }}>{l}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}