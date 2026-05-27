import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA — replace with your real API response ───────────────────────
// const MOCK_USER = {
//   name: "Arjun Sharma",
//   email: "arjun.sharma@gmail.com",
//   username: "arjun_dev",
//   joinedAt: "January 2024",
//   avatar: null, // set to image URL if available
//   stats: {
//     easy: 2,
//     medium: 0,
//     hard: 0,
//     rank: 1,
//     total: 2,
//   },
//   // totals available on platform
//   platform: { easy: 820, medium: 1340, hard: 540, total: 2400 },
//   streak: 5,
//   submissions: 8,
//   acceptanceRate: 75,
//   languages: ["Python", "JavaScript", "C++"],
//   recentActivity: [
//     { title: "Two Sum", difficulty: "Easy", status: "Accepted", time: "2h ago" },
//     { title: "Valid Parentheses", difficulty: "Easy", status: "Accepted", time: "1d ago" },
//     { title: "Merge Intervals", difficulty: "Medium", status: "Wrong Answer", time: "2d ago" },
//     { title: "Climbing Stairs", difficulty: "Easy", status: "Accepted", time: "3d ago" },
//     { title: "Binary Search", difficulty: "Easy", status: "Accepted", time: "4d ago" },
//   ],
//   badges: [
//     { icon: "🔥", label: "5-Day Streak" },
//     { icon: "⚡", label: "First Solve" },
//     { icon: "🏆", label: "Rank #1" },
//   ],
// };

// ─── ANIMATED DONUT CHART ───────────────────────────────────────────────────
function DonutChart({ easy, medium, hard, total, platformTotal }) {
  const [animated, setAnimated] = useState(false);
  const radius = 54;
  const stroke = 9;
  const cx = 70, cy = 70;
  const circumference = 2 * Math.PI * radius;

  const solved = easy + medium + hard;
  const easyPct    = platformTotal ? easy    / platformTotal : 0;
  const mediumPct  = platformTotal ? medium  / platformTotal : 0;
  const hardPct    = platformTotal ? hard    / platformTotal : 0;
  const gap = 0.018;

  const easyDash   = animated ? easyPct   * circumference : 0;
  const mediumDash = animated ? mediumPct * circumference : 0;
  const hardDash   = animated ? hardPct   * circumference : 0;

  // offsets (each arc starts after the previous + gap)
  const gapDash = gap * circumference;
  const easyOffset   = 0;
  const mediumOffset = -(easyDash + gapDash);
  const hardOffset   = -(easyDash + gapDash + mediumDash + gapDash);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth={stroke} />
        {/* easy — green */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#00b86b" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${easyDash} ${circumference}`}
          strokeDashoffset={easyOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
        {/* medium — orange */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#ffa116" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${mediumDash} ${circumference}`}
          strokeDashoffset={mediumOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1) 0.1s" }}
        />
        {/* hard — red */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#ff4444" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${hardDash} ${circumference}`}
          strokeDashoffset={hardOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1) 0.2s" }}
        />
      </svg>
      {/* center text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", letterSpacing: -1, lineHeight: 1 }}>
          {solved}
        </span>
        <span style={{ fontSize: 10, color: "#495366", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
          solved
        </span>
      </div>
    </div>
  );
}

// ─── ANIMATED COUNT-UP ──────────────────────────────────────────────────────
function CountUp({ to, duration = 1000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{val}</>;
}

// ─── MINI BAR ───────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(max ? (value / max) * 100 : 0), 400);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div style={{ flex: 1, height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 2,
        background: color, width: `${w}%`,
        transition: "width 1s cubic-bezier(.22,1,.36,1)",
      }} />
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ProfileDashboard({user}) {
  const { name, email, username, joinedAt, avatar, stats, platform,
          streak, submissions, acceptanceRate, languages, recentActivity, badges } = user;

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const diffRows = [
    { label: "Easy",   solved: stats.easy,   total: platform.easy,   color: "#00b86b", bg: "#0f2a1a", border: "#1a3a2a" },
    { label: "Medium", solved: stats.medium, total: platform.medium, color: "#ffa116", bg: "#1e1608", border: "#3a2e0f" },
    { label: "Hard",   solved: stats.hard,   total: platform.hard,   color: "#ff4444", bg: "#1a0808", border: "#3a1a1a" },
  ];

  const statusColor = (s) => s === "Accepted" ? "#00b86b" : s === "Wrong Answer" ? "#ff4444" : "#ffa116";
  const diffColor   = (d) => d === "Easy" ? "#00b86b" : d === "Medium" ? "#ffa116" : "#ff4444";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pd-root {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }

        /* ── TOPBAR ── */
        .pd-topbar {
          background: #161b22; border-bottom: 1px solid #21262d;
          height: 48px; display: flex; align-items: center;
          padding: 0 20px; gap: 8px; position: sticky; top: 0; z-index: 20;
        }
        .pd-logo-icon {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          border-radius: 6px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117;
        }
        .pd-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .pd-nav-sep { width: 1px; height: 20px; background: #21262d; margin: 0 6px; }
        .pd-nav-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .pd-nav-crumb span { color: #ffa116; }

        /* ── LAYOUT ── */
        .pd-layout {
          max-width: 1000px; margin: 0 auto;
          padding: 36px 20px 80px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 720px) {
          .pd-layout { grid-template-columns: 1fr; }
        }

        /* ── CARD ── */
        .pd-card {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; overflow: hidden;
        }
        .pd-card-header {
          padding: 14px 18px; border-bottom: 1px solid #21262d;
          display: flex; align-items: center; gap: 8px;
        }
        .pd-card-header-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: #495366;
        }
        .pd-card-header-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── AVATAR CARD ── */
        .pd-avatar-section {
          padding: 28px 20px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 0;
          text-align: center;
        }
        .pd-avatar-ring {
          width: 84px; height: 84px; border-radius: 50%;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          padding: 2.5px; margin-bottom: 14px; flex-shrink: 0;
        }
        .pd-avatar-inner {
          width: 100%; height: 100%; border-radius: 50%;
          background: #0d1117;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 800; color: #ffa116;
          letter-spacing: -1px;
          overflow: hidden;
        }
        .pd-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }
        .pd-user-name {
          font-size: 18px; font-weight: 700;
          letter-spacing: -0.4px; margin-bottom: 4px;
        }
        .pd-user-handle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #ffa116; margin-bottom: 4px;
        }
        .pd-user-email {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #495366; margin-bottom: 14px;
        }
        .pd-joined {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #495366; letter-spacing: 0.5px;
        }
        .pd-divider { height: 1px; background: #21262d; margin: 16px 0; width: 100%; }

        /* ── BADGES ── */
        .pd-badges {
          display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
          padding: 0 0 4px;
        }
        .pd-badge {
          display: flex; align-items: center; gap: 5px;
          background: #0d1117; border: 1px solid #21262d;
          border-radius: 6px; padding: 4px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #8b949e;
          transition: border-color 0.15s, color 0.15s;
        }
        .pd-badge:hover { border-color: #ffa116; color: #ffa116; }

        /* ── LANGUAGES ── */
        .pd-lang-row {
          display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
        }
        .pd-lang-pill {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #8b949e; background: #0d1117; border: 1px solid #21262d;
          border-radius: 4px; padding: 2px 8px;
        }

        /* ── RANK CARD ── */
        .pd-rank-body { padding: 20px 18px; }
        .pd-rank-num {
          font-size: 48px; font-weight: 800; letter-spacing: -3px;
          color: #ffa116; line-height: 1; margin-bottom: 4px;
        }
        .pd-rank-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #495366; letter-spacing: 1px; text-transform: uppercase; }
        .pd-rank-sub { font-size: 12px; color: #8b949e; margin-top: 6px; }

        /* ── MINI STAT GRID ── */
        .pd-mini-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px; background: #21262d;
          border-top: 1px solid #21262d;
        }
        .pd-mini-stat {
          background: #161b22; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .pd-mini-val {
          font-size: 20px; font-weight: 700; letter-spacing: -0.5px;
          line-height: 1;
        }
        .pd-mini-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; color: #495366;
          letter-spacing: 1px; text-transform: uppercase;
        }

        /* ── PROGRESS CARD ── */
        .pd-progress-body { padding: 20px 18px; }
        .pd-donut-row {
          display: flex; align-items: center; gap: 24px; margin-bottom: 22px;
        }
        .pd-diff-rows { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .pd-diff-row { display: flex; align-items: center; gap: 10px; }
        .pd-diff-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 600; width: 48px; flex-shrink: 0;
        }
        .pd-diff-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #8b949e;
          white-space: nowrap; flex-shrink: 0;
        }
        .pd-diff-count strong { color: #e6edf3; }

        /* ── RECENT ACTIVITY ── */
        .pd-activity-body { padding: 0; }
        .pd-activity-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 18px; border-bottom: 1px solid #21262d;
          transition: background 0.12s;
        }
        .pd-activity-row:last-child { border-bottom: none; }
        .pd-activity-row:hover { background: #1c2130; }
        .pd-activity-title {
          font-size: 13px; font-weight: 500; color: #e6edf3;
          flex: 1; min-width: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pd-activity-diff {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          padding: 2px 7px; border-radius: 4px;
          flex-shrink: 0;
        }
        .pd-activity-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; flex-shrink: 0; min-width: 90px; text-align: right;
        }
        .pd-activity-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #495366; flex-shrink: 0; min-width: 50px; text-align: right;
        }

        /* ── ANIMATIONS ── */
        @keyframes pd-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pd-left  { animation: pd-in 0.35s ease both 0.05s; }
        .pd-right { animation: pd-in 0.35s ease both 0.12s; }
        .pd-card  { animation: pd-in 0.35s ease both; }
      `}</style>

      <div className="pd-root">

        {/* Topbar */}
        <div className="pd-topbar">
          <div className="pd-logo-icon">⌨</div>
          <span className="pd-logo-text">CodeMaster</span>
          <div className="pd-nav-sep" />
          <span className="pd-nav-crumb">Home / <span>Profile</span></span>
        </div>

        <div className="pd-layout">

          {/* ═══ LEFT COLUMN ═══════════════════════════════════════════════ */}
          <div className="pd-left" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Avatar + Identity card */}
            <div className="pd-card">
              <div className="pd-avatar-section">
                <div className="pd-avatar-ring">
                  <div className="pd-avatar-inner">
                    {avatar ? <img src={avatar} alt={name} /> : initials}
                  </div>
                </div>
                <div className="pd-user-name">{name}</div>
                <div className="pd-user-handle">@{username}</div>
                <div className="pd-user-email">{email}</div>
                <div className="pd-joined">Joined {joinedAt}</div>

                <div className="pd-divider" />

                {/* Badges */}
                <div className="pd-badges">
                  {badges.map((b) => (
                    <div key={b.label} className="pd-badge">
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pd-divider" />

                {/* Languages */}
                <div style={{ marginBottom: 4, width: "100%" }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, color: "#495366", letterSpacing: 1.2,
                    textTransform: "uppercase", marginBottom: 8, textAlign: "left",
                  }}>Languages</div>
                  <div className="pd-lang-row">
                    {languages.map((l) => (
                      <span key={l} className="pd-lang-pill">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rank card */}
            <div className="pd-card">
              <div className="pd-card-header">
                <div className="pd-card-header-dot" style={{ background: "#ffa116" }} />
                <span className="pd-card-header-title">Global Rank</span>
              </div>
              <div className="pd-rank-body">
                <div className="pd-rank-num">
                  #<CountUp to={stats.rank} duration={900} />
                </div>
                <div className="pd-rank-label">Platform Ranking</div>
                <div className="pd-rank-sub">You're in the top performers 🎉</div>
              </div>
              <div className="pd-mini-grid">
                <div className="pd-mini-stat">
                  <span className="pd-mini-lbl">Streak</span>
                  <span className="pd-mini-val" style={{ color: "#ffa116" }}>
                    <CountUp to={streak} />🔥
                  </span>
                </div>
                <div className="pd-mini-stat">
                  <span className="pd-mini-lbl">Submissions</span>
                  <span className="pd-mini-val" style={{ color: "#4493f8" }}>
                    <CountUp to={submissions} />
                  </span>
                </div>
                <div className="pd-mini-stat">
                  <span className="pd-mini-lbl">Acceptance</span>
                  <span className="pd-mini-val" style={{ color: "#00b86b" }}>
                    <CountUp to={acceptanceRate} />%
                  </span>
                </div>
                <div className="pd-mini-stat">
                  <span className="pd-mini-lbl">Total Solved</span>
                  <span className="pd-mini-val" style={{ color: "#c084fc" }}>
                    <CountUp to={stats.total} />
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ═══ RIGHT COLUMN ══════════════════════════════════════════════ */}
          <div className="pd-right" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Problems solved progress */}
            <div className="pd-card">
              <div className="pd-card-header">
                <div className="pd-card-header-dot" style={{ background: "#00b86b" }} />
                <span className="pd-card-header-title">Problems Solved</span>
                <span style={{
                  marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: "#8b949e",
                }}>
                  {stats.total} / {platform.total}
                </span>
              </div>
              <div className="pd-progress-body">
                <div className="pd-donut-row">
                  <DonutChart
                    easy={stats.easy}
                    medium={stats.medium}
                    hard={stats.hard}
                    total={stats.total}
                    platformTotal={platform.total}
                  />
                  <div className="pd-diff-rows">
                    {diffRows.map((row) => (
                      <div key={row.label} className="pd-diff-row">
                        <span className="pd-diff-label" style={{ color: row.color }}>{row.label}</span>
                        <MiniBar value={row.solved} max={row.total} color={row.color} />
                        <span className="pd-diff-count">
                          <strong>{row.solved}</strong>/{row.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diff badges summary */}
                <div style={{ display: "flex", gap: 8 }}>
                  {diffRows.map((row) => (
                    <div key={row.label} style={{
                      flex: 1, background: row.bg, border: `1px solid ${row.border}`,
                      borderRadius: 8, padding: "10px 14px", textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, color: row.color,
                        letterSpacing: 1, textTransform: "uppercase", marginBottom: 4,
                      }}>{row.label}</div>
                      <div style={{
                        fontSize: 22, fontWeight: 800, color: row.color,
                        letterSpacing: -1, lineHeight: 1,
                      }}>{row.solved}</div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, color: "#495366", marginTop: 3,
                      }}>/ {row.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pd-card">
              <div className="pd-card-header">
                <div className="pd-card-header-dot" style={{ background: "#4493f8" }} />
                <span className="pd-card-header-title">Recent Activity</span>
                <span style={{
                  marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: "#495366",
                }}>last 5 submissions</span>
              </div>
              <div className="pd-activity-body">
                {recentActivity.map((act, i) => (
                  <div key={i} className="pd-activity-row">
                    {/* index */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: "#495366", width: 16, flexShrink: 0,
                    }}>{i + 1}.</span>

                    <span className="pd-activity-title">{act.title}</span>

                    <span className="pd-activity-diff" style={{
                      color: diffColor(act.difficulty),
                      background: act.difficulty === "Easy" ? "#0f2a1a"
                               : act.difficulty === "Medium" ? "#1e1608" : "#1a0808",
                      border: `1px solid ${
                        act.difficulty === "Easy" ? "#1a3a2a"
                        : act.difficulty === "Medium" ? "#3a2e0f" : "#3a1a1a"}`,
                    }}>
                      {act.difficulty}
                    </span>

                    <span className="pd-activity-status" style={{ color: statusColor(act.status) }}>
                      {act.status === "Accepted" ? "✓ " : "✗ "}{act.status}
                    </span>

                    <span className="pd-activity-time">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap placeholder */}
            <div className="pd-card">
              <div className="pd-card-header">
                <div className="pd-card-header-dot" style={{ background: "#c084fc" }} />
                <span className="pd-card-header-title">Submission Heatmap</span>
                <span style={{
                  marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: "#495366",
                }}>last 12 weeks</span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <HeatMap />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─── HEATMAP ────────────────────────────────────────────────────────────────
function HeatMap() {
  const weeks = 16;
  const days  = 7;
  // fake data — replace with real daily submission counts
  const data = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      if (w === weeks - 1 && d > 4) return 0;
      return Math.random() > 0.62 ? Math.floor(Math.random() * 5) + 1 : 0;
    })
  );
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const cellColor = (v) => {
    if (v === 0) return "#161b22";
    if (v === 1) return "#0f2a1a";
    if (v === 2) return "#1a3a2a";
    if (v === 3) return "#00804a";
    return "#00b86b";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        {/* day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{
              height: 12, width: 12, fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#495366", display: "flex", alignItems: "center", justifyContent: "center",
            }}>{i % 2 === 1 ? d : ""}</div>
          ))}
        </div>
        {/* cells */}
        {data.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((val, di) => (
              <div key={di} title={`${val} submission${val !== 1 ? "s" : ""}`} style={{
                width: 12, height: 12, borderRadius: 2,
                background: cellColor(val),
                border: `1px solid ${val > 0 ? "#21262d" : "#1c2130"}`,
                transition: "background 0.15s",
                cursor: val > 0 ? "pointer" : "default",
              }} />
            ))}
          </div>
        ))}
      </div>
      {/* legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginTop: 10,
        justifyContent: "flex-end",
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#495366" }}>Less</span>
        {["#161b22", "#0f2a1a", "#1a3a2a", "#00804a", "#00b86b"].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: "1px solid #21262d" }} />
        ))}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#495366" }}>More</span>
      </div>
    </div>
  );
}