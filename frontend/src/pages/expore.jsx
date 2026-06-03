import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
const exploreCards = [
  {
    id: "dsa-visualizer",
    tag: "INTERACTIVE",
    title: "Visualize DSA Algorithms",
    desc: "Watch sorting, searching, and graph algorithms animate step-by-step in real time.",
    icon: "◈",
    accent: "#ffa116",
    accentBg: "#1e1608",
    accentBorder: "#3a2e0f",
    accentGlow: "rgba(255,161,22,0.12)",
    items: ["Sorting Algorithms", "Graph Traversal", "Tree Operations", "Dynamic Programming"],
    badge: "20+ Animations",
    route: "/explore/dsa-visualizer",
  },
  {
    id: "google-interview",
    tag: "CURATED",
    title: "Google Interview Problems",
    desc: "Top 75 problems handpicked from real Google interviews, organized by topic and difficulty.",
    icon: "◎",
    accent: "#4493f8",
    accentBg: "#0a1220",
    accentBorder: "#1c2a3a",
    accentGlow: "rgba(68,147,248,0.12)",
    items: ["Arrays & Strings", "Trees & Graphs", "System Design", "Dynamic Programming"],
    badge: "75 Problems",
    route: "/explore/google-interview",
  },
  {
    id: "blind75",
    tag: "POPULAR",
    title: "Blind 75",
    desc: "The legendary list. Master these 75 problems and crack any FAANG interview.",
    icon: "◉",
    accent: "#00b86b",
    accentBg: "#071a10",
    accentBorder: "#1a3a2a",
    accentGlow: "rgba(0,184,107,0.12)",
    items: ["Two Pointers", "Sliding Window", "Binary Search", "Backtracking"],
    badge: "75 Problems",
    route: "/explore/blind75",
  },
  {
    id: "data-structures",
    tag: "FOUNDATIONS",
    title: "Data Structures Deep Dive",
    desc: "Build intuition for every data structure with interactive diagrams and guided exercises.",
    icon: "⬡",
    accent: "#c084fc",
    accentBg: "#120d1e",
    accentBorder: "#2a1a3a",
    accentGlow: "rgba(192,132,252,0.12)",
    items: ["Linked Lists", "Heaps & Tries", "Hash Tables", "Segment Trees"],
    badge: "12 Structures",
    route: "/explore/data-structures",
  },
  {
    id: "daily-challenge",
    tag: "DAILY",
    title: "Daily Challenge",
    desc: "One new problem every day. Build a streak and track your consistency over time.",
    icon: "◇",
    accent: "#ff4444",
    accentBg: "#1a0808",
    accentBorder: "#3a1a1a",
    accentGlow: "rgba(255,68,68,0.12)",
    items: ["Streak Tracking", "Global Leaderboard", "Difficulty Mix", "Solutions at Midnight"],
    badge: "New Daily",
    route: "/explore/daily",
  },
  {
    id: "system-design",
    tag: "ADVANCED",
    title: "System Design Primer",
    desc: "Learn to design scalable systems. Covers caching, load balancing, databases, and more.",
    icon: "⬢",
    accent: "#2dd4bf",
    accentBg: "#071518",
    accentBorder: "#0f2a28",
    accentGlow: "rgba(45,212,191,0.12)",
    items: ["Scalability Basics", "Database Design", "API Design", "Real-world Cases"],
    badge: "30 Concepts",
    route: "/explore/system-design",
  },
];

const stats = [
  { label: "Problems", value: "2,400+", sub: "and growing" },
  { label: "Categories", value: "18", sub: "topics covered" },
  { label: "Active Users", value: "84k", sub: "this month" },
  { label: "Avg Rating", value: "4.9★", sub: "from learners" },
];
export default function Explore() {
  const [hovered, setHovered] = useState(null);
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Interactive", "Curated", "Daily", "Foundations", "Advanced", "Popular"];
   const navigate = useNavigate();
  const filtered =
    filter === "All"
      ? exploreCards
      : exploreCards.filter((c) => c.tag.toLowerCase() === filter.toLowerCase());

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ex-root {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }

        /* ── TOPBAR ── */
        .ex-topbar {
          background: #161b22;
          border-bottom: 1px solid #21262d;
          height: 48px;
          display: flex; align-items: center;
          padding: 0 20px; gap: 8px;
          position: sticky; top: 0; z-index: 20;
        }
        .ex-logo-icon {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #0d1117; flex-shrink: 0;
        }
        .ex-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .ex-nav-sep { width: 1px; height: 20px; background: #21262d; margin: 0 6px; }
        .ex-nav-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .ex-nav-crumb span { color: #ffa116; }
        .ex-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .ex-search {
          background: #21262d; border: 1px solid #30363d; border-radius: 6px;
          color: #e6edf3; font-family: 'JetBrains Mono', monospace; font-size: 12px;
          padding: 5px 12px; outline: none; width: 200px;
          transition: border-color 0.15s;
        }
        .ex-search::placeholder { color: #495366; }
        .ex-search:focus { border-color: #ffa116; }

        /* ── HERO ── */
        .ex-hero {
          padding: 52px 24px 0;
          max-width: 960px; margin: 0 auto;
        }
        .ex-hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 1.8px;
          text-transform: uppercase; color: #ffa116;
          background: #1e1608; border: 1px solid #3a2e0f;
          border-radius: 4px; padding: 3px 10px; margin-bottom: 18px;
        }
        .ex-hero-tag::before {
          content: '';width: 5px; height: 5px; border-radius: 50%;
          background: #ffa116;
          animation: ex-blink 2s ease-in-out infinite;
        }
        @keyframes ex-blink { 0%,100%{opacity:1} 50%{opacity:.25} }

        .ex-hero-h1 {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800; letter-spacing: -1px;
          color: #e6edf3; line-height: 1.15;
          margin-bottom: 14px;
        }
        .ex-hero-h1 em {
          font-style: normal;
          background: linear-gradient(90deg, #ffa116, #ff6b00);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ex-hero-sub {
          font-size: 14px; color: #8b949e; line-height: 1.75;
          max-width: 500px; margin-bottom: 36px;
        }

        /* ── STATS ROW ── */
        .ex-stats {
          display: flex; gap: 0;
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; overflow: hidden;
          margin-bottom: 40px;
        }
        .ex-stat {
          flex: 1; padding: 14px 20px;
          border-right: 1px solid #21262d;
          display: flex; flex-direction: column; gap: 2px;
        }
        .ex-stat:last-child { border-right: none; }
        .ex-stat-val {
          font-size: 20px; font-weight: 700;
          letter-spacing: -0.5px; color: #e6edf3; line-height: 1;
        }
        .ex-stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase; color: #495366;
          margin-bottom: 2px;
        }
        .ex-stat-sub { font-size: 11px; color: #8b949e; font-family: 'JetBrains Mono', monospace; }

        /* ── DIVIDER ── */
        .ex-divider { height: 1px; background: #21262d; margin: 0 0 28px; }

        /* ── MAIN ── */
        .ex-main { max-width: 960px; margin: 0 auto; padding: 0 24px 80px; }

        /* ── FILTERS ── */
        .ex-filter-row {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap; margin-bottom: 28px;
        }
        .ex-filter-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #495366; letter-spacing: 1px; text-transform: uppercase;
          margin-right: 4px;
        }
        .ex-filter-btn {
          background: none; border: 1px solid #21262d; border-radius: 6px;
          cursor: pointer; padding: 4px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          font-weight: 500; color: #8b949e;
          transition: all 0.15s;
        }
        .ex-filter-btn:hover { border-color: #30363d; color: #e6edf3; }
        .ex-filter-btn.active {
          background: #ffa116; color: #0d1117;
          border-color: #ffa116; font-weight: 700;
        }

        /* ── GRID ── */
        .ex-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }

        /* ── CARD ── */
        .ex-card {
          position: relative; overflow: hidden;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 10px;
          padding: 22px 20px 20px;
          text-decoration: none; color: #e6edf3;
          display: flex; flex-direction: column;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.18s cubic-bezier(.22,1,.36,1), background 0.15s;
        }
        .ex-card::before {
          /* top accent line */
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: var(--accent);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .ex-card::after {
          /* glow bleed top-left */
          content: ''; position: absolute;
          top: -40px; left: -40px;
          width: 140px; height: 140px;
          background: radial-gradient(circle, var(--glow), transparent 70%);
          opacity: 0; transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .ex-card:hover {
          border-color: var(--accent-border);
          background: var(--accent-bg);
          transform: translateY(-3px);
        }
        .ex-card:hover::before { transform: scaleX(1); }
        .ex-card:hover::after  { opacity: 1; }
        .ex-card:active { transform: translateY(-1px); }

        /* ── CARD HEADER ── */
        .ex-card-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 16px;
        }
        .ex-card-icon-wrap {
          width: 42px; height: 42px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          font-size: 20px; color: var(--accent);
          flex-shrink: 0; line-height: 1;
          transition: background 0.15s;
        }
        .ex-card:hover .ex-card-icon-wrap { background: var(--accent-border); }

        .ex-card-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: var(--accent); opacity: 0.7;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          border-radius: 4px; padding: 2px 7px;
          white-space: nowrap;
        }

        /* ── CARD BODY ── */
        .ex-card-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--accent); margin-bottom: 6px; opacity: 0.7;
        }
        .ex-card-title {
          font-size: 15px; font-weight: 700;
          color: #e6edf3; letter-spacing: -0.3px;
          margin-bottom: 8px; line-height: 1.3;
        }
        .ex-card-desc {
          font-size: 12px; color: #8b949e;
          line-height: 1.7; margin-bottom: 18px; flex: 1;
        }

        /* ── CARD ITEMS ── */
        .ex-card-items {
          display: flex; flex-wrap: wrap; gap: 5px;
          margin-bottom: 20px;
        }
        .ex-card-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #8b949e;
          background: #0d1117; border: 1px solid #21262d;
          border-radius: 4px; padding: 2px 8px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ex-card:hover .ex-card-item {
          color: var(--accent); border-color: var(--accent-border);
        }

        /* ── CARD CTA ── */
        .ex-card-cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 600;
          color: var(--accent);
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          border-radius: 6px; padding: 6px 14px;
          width: fit-content; text-decoration: none;
          transition: gap 0.15s, background 0.15s;
        }
        .ex-card:hover .ex-card-cta { gap: 10px; background: var(--accent-border); }
        .ex-card-cta-arrow { transition: transform 0.15s; }
        .ex-card:hover .ex-card-cta-arrow { transform: translateX(3px); }

        /* ── FEATURED CARD (first card, full width) ── */
        .ex-card.featured {
          grid-column: 1 / -1;
          flex-direction: row; gap: 32px; padding: 28px 28px;
          align-items: center;
        }
        .ex-card.featured .ex-card-left { flex: 1; }
        .ex-card.featured .ex-card-items { margin-bottom: 20px; }
        .ex-card.featured .ex-card-icon-wrap {
          width: 64px; height: 64px; border-radius: 14px;
          font-size: 30px; flex-shrink: 0;
        }
        .ex-card.featured .ex-card-title { font-size: 18px; }
        .ex-card.featured .ex-card-desc { font-size: 13px; }

        /* ── SECTION LABEL ── */
        .ex-section-label {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px;
        }
        .ex-section-label-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #495366; white-space: nowrap;
        }
        .ex-section-label-line {
          flex: 1; height: 1px; background: #21262d;
        }

        /* ── ANIMATIONS ── */
        @keyframes ex-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ex-hero  { animation: ex-fadein 0.4s ease both; }
        .ex-card  { animation: ex-fadein 0.35s ease both; }
        .ex-card:nth-child(1) { animation-delay: 0.05s; }
        .ex-card:nth-child(2) { animation-delay: 0.10s; }
        .ex-card:nth-child(3) { animation-delay: 0.15s; }
        .ex-card:nth-child(4) { animation-delay: 0.20s; }
        .ex-card:nth-child(5) { animation-delay: 0.25s; }
        .ex-card:nth-child(6) { animation-delay: 0.30s; }
      `}</style>

      <div className="ex-root">

        {/* ── TOPBAR ── */}
        <div className="ex-topbar">
          <div className="ex-logo-icon">⌨</div>
          <span className="ex-logo-text">CodeMaster</span>
          <div className="ex-nav-sep" />
          <span className="ex-nav-crumb">
            <NavLink  to={`/`}>
            Home  </NavLink>/ <span>Explore</span>
           
          </span>
          <div className="ex-topbar-right">
            <input className="ex-search" placeholder="Search topics…" />
          </div>
        </div>

        {/* ── HERO ── */}
        <div className="ex-hero">
          <div className="ex-hero-tag">Explore CodeMaster</div>
          <h1 className="ex-hero-h1">
            Everything you need to<br />
            <em>ace your next interview</em>
          </h1>
          <p className="ex-hero-sub">
            From DSA visualizations to curated FAANG problem sets — pick a path and start building real skills today.
          </p>

          {/* Stats */}
          <div className="ex-stats">
            {stats.map((s) => (
              <div key={s.label} className="ex-stat">
                <span className="ex-stat-label">{s.label}</span>
                <span className="ex-stat-val">{s.value}</span>
                <span className="ex-stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="ex-main">
          <div className="ex-divider" />

          {/* Filter row */}
          <div className="ex-filter-row">
            <span className="ex-filter-label">Filter:</span>
            {filters.map((f) => (
              <button
                key={f}
                className={`ex-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Section label */}
          <div className="ex-section-label">
            <span className="ex-section-label-text">
              {filtered.length} {filter === "All" ? "collections" : filter.toLowerCase()} available
            </span>
            <div className="ex-section-label-line" />
          </div>

          {/* Cards */}
          <div className="ex-grid">
            {filtered.map((card, i) => (
              <div
                key={card.id}
                className={`ex-card${i === 0 && filter === "All" ? " featured" : ""}`}
                style={{
                  "--accent":        card.accent,
                  "--accent-bg":     card.accentBg,
                  "--accent-border": card.accentBorder,
                  "--glow":          card.accentGlow,
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                {/* Featured layout */}
                {i === 0 && filter === "All" ? (
                  <>
                    <div className="ex-card-icon-wrap">{card.icon}</div>
                    <div className="ex-card-left">
                      <div className="ex-card-tag">{card.tag}</div>
                      <div className="ex-card-title">{card.title}</div>
                      <div className="ex-card-desc">{card.desc}</div>
                      <div className="ex-card-items">
                        {card.items.map((item) => (
                          <span key={item} className="ex-card-item">{item}</span>
                        ))}
                      </div>
                      <span className="ex-card-cta">
                        Explore now
                        <span className="ex-card-cta-arrow">→</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ex-card-head">
                      <div className="ex-card-icon-wrap">{card.icon}</div>
                      <span className="ex-card-badge">{card.badge}</span>
                    </div>
                    <div className="ex-card-tag">{card.tag}</div>
                    <div className="ex-card-title">{card.title}</div>
                    <div className="ex-card-desc">{card.desc}</div>
                    <div className="ex-card-items">
                      {card.items.map((item) => (
                        <span key={item} className="ex-card-item">{item}</span>
                      ))}
                    </div>
                    <span className="ex-card-cta">
                      Explore <span className="ex-card-cta-arrow">→</span>
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}