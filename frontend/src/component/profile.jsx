import { useState, useEffect } from "react";

// ─── MINI BAR (no animation, clean) ────────────────────────────────────────
function Bar({ value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: "#1a1a1a", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#555", width: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ─── DONUT (static, no animation) ──────────────────────────────────────────
function Donut({ easy, medium, hard, total }) {
  const R = 44, sw = 8, cx = 52, cy = 52;
  const C = 2 * Math.PI * R;
  const gap = 0.02 * C;
  const eD = total ? (easy   / total) * C : 0;
  const mD = total ? (medium / total) * C : 0;
  const hD = total ? (hard   / total) * C : 0;
  const solved = easy + medium + hard;
  return (
    <div style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1a1a" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#00b86b" strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${eD} ${C}`} strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffa116" strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${mD} ${C}`} strokeDashoffset={-(eD + gap)}
          transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ff4444" strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${hD} ${C}`} strokeDashoffset={-(eD + gap + mD + gap)}
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "#e6edf3", lineHeight: 1 }}>{solved}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#444", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>solved</span>
      </div>
    </div>
  );
}

// ─── HEATMAP ────────────────────────────────────────────────────────────────
function HeatMap({ data }) {
  const weeks = 20, days = 7;
  const grid = data || Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      if (w === weeks - 1 && d > 4) return 0;
      return Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : 0;
    })
  );
  const col = (v) => {
    if (v === 0) return "#111";
    if (v === 1) return "#0d2318";
    if (v === 2) return "#154228";
    if (v === 3) return "#1f6b42";
    return "#00b86b";
  };
  const dayLabels = ["S","M","T","W","T","F","S"];
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-start", minWidth: "fit-content" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 1, marginRight: 2 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ height: 11, width: 8, fontSize: 8, fontFamily: "var(--mono)", color: "#333", display: "flex", alignItems: "center" }}>
              {i % 2 === 1 ? d : ""}
            </div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((val, di) => (
              <div key={di} title={`${val} submission${val !== 1 ? "s" : ""}`} style={{
                width: 11, height: 11, borderRadius: 2,
                background: col(val),
                border: "1px solid rgba(255,255,255,0.04)",
                cursor: val > 0 ? "pointer" : "default",
              }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#333" }}>Less</span>
        {["#111","#0d2318","#154228","#1f6b42","#00b86b"].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: "1px solid rgba(255,255,255,0.06)" }} />
        ))}
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#333" }}>More</span>
      </div>
    </div>
  );
}

// ─── SKILL RADAR (SVG, static) ──────────────────────────────────────────────
function SkillRadar({ skills }) {
  const cx = 100, cy = 100, r = 75;
  const n = skills.length;
  const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, pct) => ({
    x: cx + pct * r * Math.cos(angle(i)),
    y: cy + pct * r * Math.sin(angle(i)),
  });
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPath = skills.map((s, i) => {
    const p = pt(i, s.value / 100);
    return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ") + " Z";
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {rings.map((ring, ri) => (
        <polygon key={ri}
          points={skills.map((_, i) => { const p = pt(i, ring); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
          fill="none" stroke="#1e1e1e" strokeWidth={1}
        />
      ))}
      {skills.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#1e1e1e" strokeWidth={1} />;
      })}
      <path d={dataPath} fill="rgba(255,161,22,0.1)" stroke="#ffa116" strokeWidth={1.5} />
      {skills.map((s, i) => {
        const p = pt(i, s.value / 100);
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill="#ffa116" />;
      })}
      {skills.map((s, i) => {
        const p = pt(i, 1.28);
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 9, fill: "#555", fontFamily: "var(--mono)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SECTION HEADING ────────────────────────────────────────────────────────
function SectionHead({ label, right }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700,
          color: "#444", letterSpacing: 2, textTransform: "uppercase",
        }}>{label}</span>
        {right && <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "#333" }}>{right}</span>}
      </div>
      <div style={{ height: 1, background: "#1e1e1e" }} />
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ProfileDashboard({ user }) {
  const {
    name, email, username, joinedAt, avatar,
    stats, platform, streak, submissions,
    acceptanceRate, languages, recentActivity, badges,
  } = user;

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [tab, setTab] = useState("overview");

  const diffRows = [
    { label: "Easy",   solved: stats.easy,   total: platform.easy,   color: "#00b86b" },
    { label: "Medium", solved: stats.medium, total: platform.medium, color: "#ffa116" },
    { label: "Hard",   solved: stats.hard,   total: platform.hard,   color: "#ff4444" },
  ];

  const skillData = [
    { label: "Arrays",  value: 82 },
    { label: "DP",      value: 48 },
    { label: "Graphs",  value: 65 },
    { label: "Trees",   value: 74 },
    { label: "Strings", value: 58 },
    { label: "Math",    value: 77 },
  ];

  const langColors = { JavaScript: "#ffa116", "C++": "#4493f8", Python: "#00b86b", Java: "#c084fc" };

  const statusColor = (s) => s === "Accepted" ? "#00b86b" : s === "Wrong Answer" ? "#ff4444" : "#ffa116";
  const diffColor   = (d) => d === "Easy" ? "#00b86b" : d === "Medium" ? "#ffa116" : "#ff4444";

  // Mock extended data
  const certifications = [
    { title: "Advanced Algorithms Track",   date: "Mar 2024", badge: "🎓" },
    { title: "Data Structures Mastery",     date: "Jan 2024", badge: "📐" },
    { title: "30-Day Coding Challenge",     date: "Dec 2023", badge: "🔥" },
  ];

  const timeline = [
    { month: "May 2024", count: 14, note: "Best month" },
    { month: "Apr 2024", count: 9,  note: "" },
    { month: "Mar 2024", count: 11, note: "" },
    { month: "Feb 2024", count: 6,  note: "" },
    { month: "Jan 2024", count: 8,  note: "Joined" },
  ];

  const maxTimeline = Math.max(...timeline.map(t => t.count));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --mono:    'IBM Plex Mono', monospace;
          --sans:    'IBM Plex Sans', sans-serif;
          --bg:      #0a0a0a;
          --paper:   #0f0f0f;
          --card:    #111111;
          --line:    #1e1e1e;
          --line2:   #2a2a2a;
          --text:    #e6edf3;
          --muted:   #888;
          --dim:     #444;
          --orange:  #ffa116;
          --green:   #00b86b;
          --red:     #ff4444;
          --blue:    #4493f8;
          --purple:  #c084fc;
        }

        .pd-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 400;
          line-height: 1.6;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }

        /* ── TOPBAR ── */
        .pd-topbar {
          height: 48px;
          background: var(--paper);
          border-bottom: 1px solid var(--line);
          display: flex; align-items: center;
          padding: 0 32px; gap: 0;
          position: sticky; top: 0; z-index: 50;
        }
        .pd-topbar-logo {
          display: flex; align-items: center; gap: 9px;
          padding-right: 24px;
          border-right: 1px solid var(--line);
        }
        .pd-logo-sq {
          width: 26px; height: 26px;
          background: var(--orange);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #0a0a0a;
        }
        .pd-logo-name {
          font-family: var(--sans); font-size: 13px; font-weight: 700;
          color: var(--text); letter-spacing: -0.2px;
        }
        .pd-topbar-crumb {
          padding-left: 24px;
          font-family: var(--mono); font-size: 11px; color: var(--dim);
          display: flex; align-items: center; gap: 8px;
        }
        .pd-topbar-crumb span { color: var(--orange); }
        .pd-topbar-right {
          margin-left: auto;
          font-family: var(--mono); font-size: 10px; color: var(--dim);
          display: flex; align-items: center; gap: 16px;
        }
        .pd-share-btn {
          background: none; border: 1px solid var(--line2); border-radius: 4px;
          color: var(--muted); font-family: var(--mono); font-size: 10px;
          padding: 4px 12px; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .pd-share-btn:hover { border-color: var(--orange); color: var(--orange); }

        /* ── PAGE WRAPPER ── */
        .pd-wrap {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 32px 80px;
        }

        /* ── RESUME HEADER ── */
        .pd-resume-hdr {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0;
          padding: 40px 0 32px;
          border-bottom: 2px solid var(--line);
          align-items: start;
        }

        /* left: avatar + name */
        .pd-hdr-left { padding-right: 28px; border-right: 1px solid var(--line); }
        .pd-avatar-box {
          width: 72px; height: 72px;
          background: var(--card);
          border: 1px solid var(--line2);
          border-left: 3px solid var(--orange);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mono); font-size: 22px; font-weight: 700;
          color: var(--orange); overflow: hidden; margin-bottom: 12px;
        }
        .pd-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
        .pd-hdr-name {
          font-family: var(--sans); font-size: 26px; font-weight: 700;
          color: var(--text); letter-spacing: -0.5px; line-height: 1.1;
          margin-bottom: 3px;
        }
        .pd-hdr-handle {
          font-family: var(--mono); font-size: 11px; color: var(--orange);
          margin-bottom: 2px;
        }
        .pd-hdr-email {
          font-family: var(--mono); font-size: 10px; color: var(--dim);
        }

        /* center: meta info */
        .pd-hdr-center {
          padding: 0 28px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .pd-meta-row {
          display: flex; align-items: baseline; gap: 12px;
        }
        .pd-meta-key {
          font-family: var(--mono); font-size: 9px; font-weight: 600;
          color: var(--dim); letter-spacing: 1.5px; text-transform: uppercase;
          width: 88px; flex-shrink: 0;
        }
        .pd-meta-val {
          font-family: var(--mono); font-size: 11px; color: var(--muted);
        }
        .pd-meta-val.accent { color: var(--orange); font-weight: 600; }

        /* right: key numbers */
        .pd-hdr-right {
          padding-left: 28px;
          border-left: 1px solid var(--line);
          display: flex; flex-direction: column; gap: 0;
        }
        .pd-hdr-stat {
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 24px;
        }
        .pd-hdr-stat:last-child { border-bottom: none; }
        .pd-hdr-stat-lbl {
          font-family: var(--mono); font-size: 9px; color: var(--dim);
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .pd-hdr-stat-val {
          font-family: var(--mono); font-size: 18px; font-weight: 700;
          letter-spacing: -0.5px; line-height: 1;
        }

        /* ── NAV TABS ── */
        .pd-nav {
          display: flex; gap: 0;
          border-bottom: 1px solid var(--line);
          margin-bottom: 32px;
        }
        .pd-nav-tab {
          background: none; border: none; cursor: pointer;
          font-family: var(--mono); font-size: 10px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: var(--dim);
          padding: 14px 20px 13px;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.12s, border-color 0.12s;
        }
        .pd-nav-tab:hover { color: var(--muted); }
        .pd-nav-tab.active { color: var(--orange); border-bottom-color: var(--orange); }

        /* ── TWO COLUMN BODY ── */
        .pd-body {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 0;
          align-items: start;
        }
        @media (max-width: 720px) {
          .pd-body { grid-template-columns: 1fr; }
          .pd-resume-hdr { grid-template-columns: 1fr; gap: 24px; }
          .pd-hdr-left { border-right: none; padding-right: 0; border-bottom: 1px solid var(--line); padding-bottom: 20px; }
          .pd-hdr-center { padding: 20px 0; }
          .pd-hdr-right { border-left: none; padding-left: 0; }
        }

        /* ── MAIN CONTENT ── */
        .pd-main { padding-right: 40px; border-right: 1px solid var(--line); }

        /* ── SIDEBAR ── */
        .pd-sidebar { padding-left: 32px; }

        /* ── SECTION ── */
        .pd-section { margin-bottom: 36px; }

        /* ── PROBLEM ROW ── */
        .pd-prob-row {
          display: grid;
          grid-template-columns: 18px 1fr 70px 80px 50px;
          gap: 12px; align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid var(--line);
          transition: background 0.1s;
        }
        .pd-prob-row:last-child { border-bottom: none; }
        .pd-prob-row:hover { background: rgba(255,255,255,0.015); margin: 0 -8px; padding: 9px 8px; }
        .pd-prob-idx { font-family: var(--mono); font-size: 9px; color: var(--dim); text-align: right; }
        .pd-prob-title { font-size: 12.5px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pd-prob-diff {
          font-family: var(--mono); font-size: 9px; font-weight: 600;
          letter-spacing: 0.5px; text-align: center; padding: 2px 0;
          text-transform: uppercase;
        }
        .pd-prob-status { font-family: var(--mono); font-size: 10px; font-weight: 600; text-align: right; }
        .pd-prob-time { font-family: var(--mono); font-size: 9px; color: var(--dim); text-align: right; }

        /* ── DIFF BREAKDOWN ── */
        .pd-diff-table { width: 100%; }
        .pd-diff-tr {
          display: grid; grid-template-columns: 52px 1fr 64px;
          gap: 12px; align-items: center;
          padding: 7px 0; border-bottom: 1px solid var(--line);
        }
        .pd-diff-tr:last-child { border-bottom: none; }
        .pd-diff-name { font-family: var(--mono); font-size: 10px; font-weight: 600; }
        .pd-diff-frac { font-family: var(--mono); font-size: 10px; color: var(--dim); text-align: right; white-space: nowrap; }
        .pd-diff-frac strong { color: var(--text); }

        /* ── CERT ROW ── */
        .pd-cert-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 12px 0; border-bottom: 1px solid var(--line);
        }
        .pd-cert-row:last-child { border-bottom: none; }
        .pd-cert-icon {
          width: 32px; height: 32px; flex-shrink: 0;
          background: var(--card); border: 1px solid var(--line2);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .pd-cert-title { font-size: 12.5px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
        .pd-cert-date { font-family: var(--mono); font-size: 10px; color: var(--dim); }
        .pd-cert-badge {
          margin-left: auto; flex-shrink: 0;
          font-family: var(--mono); font-size: 9px; color: var(--green);
          background: rgba(0,184,107,0.08); border: 1px solid rgba(0,184,107,0.2);
          padding: 2px 8px; align-self: center;
        }

        /* ── TIMELINE BAR CHART ── */
        .pd-timeline { display: flex; flex-direction: column; gap: 8px; }
        .pd-tl-row { display: flex; align-items: center; gap: 10px; }
        .pd-tl-label { font-family: var(--mono); font-size: 9px; color: var(--dim); width: 56px; flex-shrink: 0; }
        .pd-tl-bar-wrap { flex: 1; height: 14px; background: var(--card); border: 1px solid var(--line); display: flex; align-items: center; }
        .pd-tl-bar { height: 100%; background: var(--orange); opacity: 0.7; }
        .pd-tl-count { font-family: var(--mono); font-size: 10px; color: var(--muted); width: 20px; text-align: right; flex-shrink: 0; }
        .pd-tl-note { font-family: var(--mono); font-size: 9px; color: var(--dim); width: 54px; flex-shrink: 0; }

        /* ── SIDEBAR SKILL ROWS ── */
        .pd-skill-row {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 0; border-bottom: 1px solid var(--line);
        }
        .pd-skill-row:last-child { border-bottom: none; }
        .pd-skill-name { font-family: var(--mono); font-size: 10px; color: var(--muted); width: 56px; flex-shrink: 0; }
        .pd-skill-score { font-family: var(--mono); font-size: 10px; color: var(--orange); width: 28px; text-align: right; flex-shrink: 0; }

        /* ── LANG PILLS ── */
        .pd-lang-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .pd-lang-pill {
          font-family: var(--mono); font-size: 9px; font-weight: 600;
          padding: 3px 10px; border: 1px solid var(--line2);
          letter-spacing: 0.3px; color: var(--muted);
          transition: border-color 0.15s, color 0.15s;
        }
        .pd-lang-pill:hover { border-color: var(--orange); color: var(--orange); }

        /* ── BADGE LIST ── */
        .pd-badge-list { display: flex; flex-direction: column; gap: 0; }
        .pd-badge-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0; border-bottom: 1px solid var(--line);
        }
        .pd-badge-row:last-child { border-bottom: none; }
        .pd-badge-emoji { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
        .pd-badge-name { font-size: 12px; font-weight: 500; color: var(--text); flex: 1; }
        .pd-badge-locked { font-family: var(--mono); font-size: 9px; color: var(--dim); }

        /* ── PRINT / EXPORT BTN ── */
        .pd-export-row {
          margin-top: 40px; padding-top: 20px;
          border-top: 1px solid var(--line);
          display: flex; align-items: center; gap: 12px;
        }
        .pd-export-btn {
          background: none; border: 1px solid var(--line2);
          color: var(--muted); font-family: var(--mono); font-size: 10px;
          padding: 7px 18px; cursor: pointer; letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .pd-export-btn:hover { border-color: var(--orange); color: var(--orange); }
        .pd-export-btn.primary {
          background: var(--orange); border-color: var(--orange);
          color: #0a0a0a; font-weight: 700;
        }
        .pd-export-btn.primary:hover { background: #ffb347; border-color: #ffb347; color: #0a0a0a; }
        .pd-export-note { font-family: var(--mono); font-size: 9px; color: var(--dim); }

        /* ── OVERVIEW NUMBERS STRIP ── */
        .pd-numbers-strip {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--line); margin-bottom: 32px;
        }
        .pd-number-cell {
          padding: 20px 18px;
          border-right: 1px solid var(--line);
          position: relative;
        }
        .pd-number-cell:last-child { border-right: none; }
        .pd-number-big {
          font-family: var(--mono); font-size: 32px; font-weight: 700;
          letter-spacing: -1.5px; line-height: 1; margin-bottom: 4px;
        }
        .pd-number-lbl {
          font-family: var(--mono); font-size: 9px; color: var(--dim);
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .pd-number-cell::after {
          content: attr(data-index);
          position: absolute; top: 8px; right: 10px;
          font-family: var(--mono); font-size: 9px; color: var(--line2);
        }

        /* ── STATUS LINE ── */
        .pd-status-line {
          display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
        }
        .pd-status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .pd-status-text { font-family: var(--mono); font-size: 10px; color: var(--dim); }
      `}</style>

      <div className="pd-root">

        {/* ── TOPBAR ── */}
        <div className="pd-topbar">
          <div className="pd-topbar-logo">
            <div className="pd-logo-sq">⌨</div>
            <span className="pd-logo-name">CodeMaster</span>
          </div>
          <div className="pd-topbar-crumb">
            Profile · <span>@{username}</span>
          </div>
          <div className="pd-topbar-right">
            <span>Last active: 2h ago</span>
            <button className="pd-share-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
              ↗ Share Profile
            </button>
          </div>
        </div>

        <div className="pd-wrap">

          {/* ── RESUME HEADER ── */}
          <div className="pd-resume-hdr">

            {/* LEFT — avatar + name */}
            <div className="pd-hdr-left">
              <div className="pd-avatar-box">
                {avatar ? <img src={avatar} alt={name} /> : initials}
              </div>
              <div className="pd-hdr-name">{name}</div>
              <div className="pd-hdr-handle">@{username}</div>
              <div className="pd-hdr-email">{email}</div>
            </div>

            {/* CENTER — meta */}
            <div className="pd-hdr-center">
              {[
                { key: "Role",       val: "Software Engineer",           accent: false },
                { key: "Joined",     val: joinedAt,                      accent: false },
                { key: "Rank",       val: `#${stats.rank} Global`,       accent: true  },
                { key: "Streak",     val: `${streak} days 🔥`,           accent: true  },
                { key: "Languages",  val: languages.join(" · "),         accent: false },
                { key: "Status",     val: "Actively solving",            accent: false },
              ].map(({ key, val, accent }) => (
                <div key={key} className="pd-meta-row">
                  <span className="pd-meta-key">{key}</span>
                  <span className={`pd-meta-val${accent ? " accent" : ""}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* RIGHT — key numbers */}
            <div className="pd-hdr-right">
              {[
                { lbl: "Solved",      val: stats.total,       color: "#e6edf3" },
                { lbl: "Submissions", val: submissions,       color: "#4493f8" },
                { lbl: "Acceptance",  val: `${acceptanceRate}%`, color: "#00b86b" },
                { lbl: "Rank",        val: `#${stats.rank}`,  color: "#ffa116" },
              ].map(({ lbl, val, color }) => (
                <div key={lbl} className="pd-hdr-stat">
                  <span className="pd-hdr-stat-lbl">{lbl}</span>
                  <span className="pd-hdr-stat-val" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>

          </div>

          {/* ── NAV TABS ── */}
          <div className="pd-nav">
            {[
              { id: "overview",  label: "Overview"   },
              { id: "activity",  label: "Activity"   },
              { id: "skills",    label: "Skills"     },
              { id: "certs",     label: "Certs"      },
            ].map(({ id, label }) => (
              <button key={id} className={`pd-nav-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* ════════ OVERVIEW ════════ */}
          {tab === "overview" && (
            <div>
              {/* numbers strip */}
              <div className="pd-numbers-strip">
                {[
                  { lbl: "Easy Solved",   val: stats.easy,         color: "#00b86b", idx: "01" },
                  { lbl: "Medium Solved", val: stats.medium,       color: "#ffa116", idx: "02" },
                  { lbl: "Hard Solved",   val: stats.hard,         color: "#ff4444", idx: "03" },
                  { lbl: "Total",         val: stats.total,        color: "#e6edf3", idx: "04" },
                ].map(({ lbl, val, color, idx }) => (
                  <div key={lbl} className="pd-number-cell" data-index={idx}>
                    <div className="pd-number-big" style={{ color }}>{val}</div>
                    <div className="pd-number-lbl">{lbl}</div>
                  </div>
                ))}
              </div>

              <div className="pd-body">
                {/* MAIN */}
                <div className="pd-main">

                  {/* Problem Breakdown */}
                  <div className="pd-section">
                    <SectionHead label="Problem Breakdown" right={`${stats.total} / ${platform.total} total`} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 32, marginBottom: 20 }}>
                      <Donut easy={stats.easy} medium={stats.medium} hard={stats.hard} total={platform.total} />
                      <div style={{ flex: 1 }}>
                        <div className="pd-diff-table">
                          {diffRows.map((row) => (
                            <div key={row.label} className="pd-diff-tr">
                              <span className="pd-diff-name" style={{ color: row.color }}>{row.label}</span>
                              <Bar value={row.solved} max={row.total} color={row.color} />
                              <span className="pd-diff-frac"><strong>{row.solved}</strong> / {row.total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Activity */}
                  <div className="pd-section">
                    <SectionHead label="Monthly Solve Rate" right="last 5 months" />
                    <div className="pd-timeline">
                      {timeline.map((t) => (
                        <div key={t.month} className="pd-tl-row">
                          <span className="pd-tl-label">{t.month}</span>
                          <div className="pd-tl-bar-wrap">
                            <div className="pd-tl-bar" style={{ width: `${(t.count / maxTimeline) * 100}%` }} />
                          </div>
                          <span className="pd-tl-count">{t.count}</span>
                          <span className="pd-tl-note" style={{ color: t.note ? "var(--orange)" : "transparent" }}>{t.note || "·"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission Heatmap */}
                  <div className="pd-section">
                    <SectionHead label="Submission Heatmap" right="last 20 weeks" />
                    <HeatMap />
                  </div>

                </div>

                {/* SIDEBAR */}
                <div className="pd-sidebar">

                  <div className="pd-section">
                    <SectionHead label="Quick Stats" />
                    {[
                      { lbl: "Submissions", val: submissions,          color: "var(--blue)"   },
                      { lbl: "Acceptance",  val: `${acceptanceRate}%`, color: "var(--green)"  },
                      { lbl: "Streak",      val: `${streak}d 🔥`,      color: "var(--orange)" },
                      { lbl: "Rank",        val: `#${stats.rank}`,     color: "var(--orange)" },
                    ].map(({ lbl, val, color }) => (
                      <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--dim)", letterSpacing: 1.5, textTransform: "uppercase" }}>{lbl}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pd-section">
                    <SectionHead label="Languages" />
                    <div className="pd-lang-row">
                      {languages.map((l) => (
                        <span key={l} className="pd-lang-pill" style={{ borderColor: langColors[l] ? `${langColors[l]}33` : undefined, color: langColors[l] || "var(--muted)" }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pd-section">
                    <SectionHead label="Achievements" right={`${badges.length} / 6`} />
                    <div className="pd-badge-list">
                      {badges.map((b) => (
                        <div key={b.label} className="pd-badge-row">
                          <span className="pd-badge-emoji">{b.icon}</span>
                          <span className="pd-badge-name">{b.label}</span>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 3 - badges.length) }).map((_, i) => (
                        <div key={`lock-${i}`} className="pd-badge-row" style={{ opacity: 0.3 }}>
                          <span className="pd-badge-emoji">🔒</span>
                          <span className="pd-badge-name">Locked</span>
                          <span className="pd-badge-locked">—</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ════════ ACTIVITY ════════ */}
          {tab === "activity" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div className="pd-status-line">
                  <div className="pd-status-dot" style={{ background: "var(--green)", boxShadow: "0 0 6px rgba(0,184,107,0.6)" }} />
                  <span className="pd-status-text">Showing last {recentActivity.length} submissions</span>
                </div>
                {/* column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 70px 80px 50px", gap: 12, padding: "6px 0", borderBottom: "2px solid var(--line2)" }}>
                  {["#", "Problem", "Diff", "Status", "Time"].map((h) => (
                    <span key={h} style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--dim)", letterSpacing: 1.5, textTransform: "uppercase", textAlign: h === "#" ? "right" : h === "Status" ? "right" : h === "Time" ? "right" : "left" }}>{h}</span>
                  ))}
                </div>
                {recentActivity.map((act, i) => (
                  <div key={i} className="pd-prob-row">
                    <span className="pd-prob-idx">{i + 1}</span>
                    <span className="pd-prob-title">{act.title}</span>
                    <span className="pd-prob-diff" style={{ color: diffColor(act.difficulty) }}>{act.difficulty}</span>
                    <span className="pd-prob-status" style={{ color: statusColor(act.status) }}>
                      {act.status === "Accepted" ? "✓ AC" : "✗ WA"}
                    </span>
                    <span className="pd-prob-time">{act.time}</span>
                  </div>
                ))}
              </div>

              {/* Heatmap in activity tab too */}
              <div className="pd-section" style={{ marginTop: 32 }}>
                <SectionHead label="Submission Heatmap" right="last 20 weeks" />
                <HeatMap />
              </div>
            </div>
          )}

          {/* ════════ SKILLS ════════ */}
          {tab === "skills" && (
            <div className="pd-body">
              <div className="pd-main">
                <div className="pd-section">
                  <SectionHead label="Skill Distribution" right="based on solved problems" />
                  <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <SkillRadar skills={skillData} />
                    <div style={{ flex: 1, minWidth: 200, paddingTop: 8 }}>
                      <div className="pd-diff-table">
                        {skillData.map(({ label, value }) => (
                          <div key={label} className="pd-diff-tr">
                            <span className="pd-diff-name" style={{ color: "var(--muted)", width: 56 }}>{label}</span>
                            <Bar value={value} max={100} color="var(--orange)" />
                            <span className="pd-diff-frac" style={{ color: "var(--orange)" }}><strong>{value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pd-section">
                  <SectionHead label="Problem Breakdown" />
                  {diffRows.map((row) => (
                    <div key={row.label} className="pd-diff-tr">
                      <span className="pd-diff-name" style={{ color: row.color }}>{row.label}</span>
                      <Bar value={row.solved} max={row.total} color={row.color} />
                      <span className="pd-diff-frac"><strong>{row.solved}</strong> / {row.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pd-sidebar">
                <div className="pd-section">
                  <SectionHead label="Top Skills" />
                  {skillData.sort((a, b) => b.value - a.value).map(({ label, value }) => (
                    <div key={label} className="pd-skill-row">
                      <span className="pd-skill-name">{label}</span>
                      <div style={{ flex: 1 }}>
                        <Bar value={value} max={100} color="var(--orange)" />
                      </div>
                      <span className="pd-skill-score">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="pd-section">
                  <SectionHead label="Languages" />
                  <div className="pd-lang-row">
                    {languages.map((l) => (
                      <span key={l} className="pd-lang-pill" style={{ color: langColors[l] || "var(--muted)", borderColor: langColors[l] ? `${langColors[l]}44` : undefined }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ CERTS ════════ */}
          {tab === "certs" && (
            <div className="pd-body">
              <div className="pd-main">
                <div className="pd-section">
                  <SectionHead label="Certifications & Completions" right={`${certifications.length} earned`} />
                  {certifications.map((c) => (
                    <div key={c.title} className="pd-cert-row">
                      <div className="pd-cert-icon">{c.badge}</div>
                      <div>
                        <div className="pd-cert-title">{c.title}</div>
                        <div className="pd-cert-date">{c.date}</div>
                      </div>
                      <div className="pd-cert-badge">✓ Completed</div>
                    </div>
                  ))}
                </div>

                <div className="pd-section">
                  <SectionHead label="Achievements" right={`${badges.length} earned`} />
                  <div className="pd-badge-list">
                    {badges.map((b) => (
                      <div key={b.label} className="pd-badge-row">
                        <span className="pd-badge-emoji">{b.icon}</span>
                        <span className="pd-badge-name">{b.label}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--green)" }}>Earned</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pd-sidebar">
                <div className="pd-section">
                  <SectionHead label="Summary" />
                  {[
                    { lbl: "Certs",      val: certifications.length, color: "var(--orange)" },
                    { lbl: "Badges",     val: badges.length,         color: "var(--orange)" },
                    { lbl: "Solved",     val: stats.total,           color: "var(--green)"  },
                    { lbl: "Rank",       val: `#${stats.rank}`,      color: "var(--orange)" },
                  ].map(({ lbl, val, color }) => (
                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--dim)", letterSpacing: 1.5, textTransform: "uppercase" }}>{lbl}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EXPORT ROW ── */}
          <div className="pd-export-row">
            <button className="pd-export-btn primary" onClick={() => window.print()}>
              ↓ Export PDF
            </button>
            <button className="pd-export-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
              ↗ Copy Link
            </button>
            <span className="pd-export-note">
              Profile last updated · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

        </div>
      </div>
    </>
  );
}