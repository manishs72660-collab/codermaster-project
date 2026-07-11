import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/navbar";

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
    accentGlow: "rgba(255,161,22,0.14)",
    items: ["Sorting Algorithms", "Graph Traversal", "Tree Operations", "Dynamic Programming"],
    badge: "20+ Animations",
    route: "/explore/dsa-visualizer",
  },
  {
    id: "cheatsheet",
    tag: "CURATED",
    title: "Cheat Sheet",
    desc: "Quick-reference sheets for syntax, patterns, and formulas — everything you need before an interview, on one page.",
    icon: "◎",
    accent: "#ff8a00",
    accentBg: "#1f1207",
    accentBorder: "#3d260d",
    accentGlow: "rgba(255,138,0,0.14)",
    items: ["Big-O Reference", "Pattern Recognition", "Syntax Snippets", "Formula Sheet"],
    badge: "50+ Sheets",
    route: "/explore/cheatsheet",
  },
  {
    id: "complexity",
    tag: "INTERACTIVE",
    title: "Visualize Time Complexity",
    desc: "See how algorithms scale with interactive Big-O growth curves — compare runtime and space complexity side by side.",
    icon: "◇",
    accent: "#ffb84d",
    accentBg: "#201607",
    accentBorder: "#3f2c0e",
    accentGlow: "rgba(255,184,77,0.14)",
    items: ["Big O Notation", "Growth Curves", "Space Complexity", "Algorithm Comparison"],
    badge: "Interactive Graphs",
    route: "/explore/complexity",
  },
  {
    id: "talk-admin",
    tag: "DAILY",
    title: "Talk to an Admin",
    desc: "Stuck on a problem? Start a live chat with an available admin or mentor and get real-time help with your doubts.",
    icon: "◆",
    accent: "#ff6b00",
    accentBg: "#1f1006",
    accentBorder: "#3d220c",
    accentGlow: "rgba(255,107,0,0.14)",
    items: ["Live Chat", "Real-time Help", "Doubt Solving", "1-on-1 Support"],
    badge: "Live Support",
    route: "/explore/talkadmin",
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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .ex-root {
          min-height: 100vh;
          background: #0a0a0a;
          background-image:
            radial-gradient(circle at 15% 0%, rgba(255,138,0,0.07), transparent 40%),
            radial-gradient(circle at 85% 15%, rgba(255,107,0,0.05), transparent 35%);
          color: #f2f2f2;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ff8a00; }

        /* ── HERO ── */
        .ex-hero { padding: 56px 24px 0; max-width: 1000px; margin: 0 auto; }

        .ex-hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #ff8a00;
          background: rgba(255,138,0,0.08); border: 1px solid rgba(255,138,0,0.25);
          border-radius: 20px; padding: 5px 12px 5px 10px; margin-bottom: 22px;
        }
        .ex-hero-tag::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%;
          background: #ff8a00; box-shadow: 0 0 8px #ff8a00;
          animation: ex-blink 2s ease-in-out infinite;
        }
        @keyframes ex-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

        .ex-hero-h1 {
          font-size: clamp(30px, 4.2vw, 44px);
          font-weight: 800; letter-spacing: -1.2px;
          color: #f7f7f7; line-height: 1.12;
          margin-bottom: 16px;
        }
        .ex-hero-h1 em {
          font-style: normal;
          background: linear-gradient(90deg, #ffb84d, #ff6b00);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ex-hero-sub {
          font-size: 15px; color: #9a9a9a; line-height: 1.75;
          max-width: 520px; margin-bottom: 40px;
        }

        /* ── STATS ── */
        .ex-stats {
          display: flex; background: #131313;
          border: 1px solid #232323; border-radius: 14px;
          overflow: hidden; margin-bottom: 44px;
        }
        .ex-stat {
          flex: 1; padding: 18px 22px;
          border-right: 1px solid #232323;
          position: relative;
        }
        .ex-stat:last-child { border-right: none; }
        .ex-stat::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #ff8a00, transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .ex-stat:hover::before { opacity: 1; }
        .ex-stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600; letter-spacing: 1.4px;
          text-transform: uppercase; color: #666; margin-bottom: 6px; display: block;
        }
        .ex-stat-val { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #f7f7f7; display: block; }
        .ex-stat-sub { font-size: 11px; color: #777; font-family: 'JetBrains Mono', monospace; }

        .ex-divider { height: 1px; background: linear-gradient(90deg, #232323, transparent); margin: 0 0 32px; }

        .ex-main { max-width: 1000px; margin: 0 auto; padding: 0 24px 90px; }

        /* ── FILTERS ── */
        .ex-filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
        .ex-filter-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #666; letter-spacing: 1px; text-transform: uppercase; margin-right: 6px;
        }
        .ex-filter-btn {
          background: #131313; border: 1px solid #232323; border-radius: 20px;
          cursor: pointer; padding: 6px 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
          color: #999; transition: all 0.15s;
        }
        .ex-filter-btn:hover { border-color: #ff8a00; color: #f7f7f7; }
        .ex-filter-btn.active {
          background: linear-gradient(135deg, #ff8a00, #ff6b00);
          color: #0a0a0a; border-color: transparent; font-weight: 700;
        }

        /* ── GRID ── */
        .ex-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

        /* ── CARD ── */
        .ex-card {
          position: relative; overflow: hidden;
          background: #121212; border: 1px solid #232323; border-radius: 16px;
          padding: 24px 22px 22px; color: #f2f2f2;
          display: flex; flex-direction: column; cursor: pointer;
          transition: border-color 0.2s, transform 0.2s cubic-bezier(.22,1,.36,1), background 0.2s;
        }
        .ex-card::after {
          content: ''; position: absolute; top: -50px; right: -50px;
          width: 160px; height: 160px;
          background: radial-gradient(circle, var(--glow), transparent 70%);
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
        }
        .ex-card:hover {
          border-color: var(--accent-border);
          background: var(--accent-bg);
          transform: translateY(-4px);
        }
        .ex-card:hover::after { opacity: 1; }
        .ex-card:active { transform: translateY(-1px); }

        .ex-card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
        .ex-card-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-bg); border: 1px solid var(--accent-border);
          font-size: 21px; color: var(--accent); flex-shrink: 0;
          transition: transform 0.2s, background 0.15s;
        }
        .ex-card:hover .ex-card-icon-wrap { transform: scale(1.08) rotate(-4deg); background: var(--accent-border); }

        .ex-card-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent);
          background: var(--accent-bg); border: 1px solid var(--accent-border);
          border-radius: 20px; padding: 3px 9px; white-space: nowrap;
        }

        .ex-card-tag {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase; color: var(--accent);
          margin-bottom: 7px; opacity: 0.85;
        }
        .ex-card-title { font-size: 16px; font-weight: 700; color: #f7f7f7; letter-spacing: -0.3px; margin-bottom: 9px; line-height: 1.3; }
        .ex-card-desc { font-size: 12.5px; color: #999; line-height: 1.7; margin-bottom: 18px; flex: 1; }

        .ex-card-items { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
        .ex-card-item {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #888;
          background: #0a0a0a; border: 1px solid #232323; border-radius: 6px; padding: 3px 9px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ex-card:hover .ex-card-item { color: var(--accent); border-color: var(--accent-border); }

        .ex-card-cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
          color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-border);
          border-radius: 8px; padding: 8px 15px; width: fit-content;
          transition: gap 0.15s, background 0.15s;
        }
        .ex-card:hover .ex-card-cta { gap: 11px; background: var(--accent-border); }
        .ex-card-cta-arrow { transition: transform 0.15s; }
        .ex-card:hover .ex-card-cta-arrow { transform: translateX(3px); }

        /* ── FEATURED ── */
        .ex-card.featured {
          grid-column: 1 / -1; flex-direction: row; gap: 34px; padding: 30px 30px; align-items: center;
        }
        .ex-card.featured .ex-card-left { flex: 1; }
        .ex-card.featured .ex-card-icon-wrap { width: 68px; height: 68px; border-radius: 16px; font-size: 32px; flex-shrink: 0; }
        .ex-card.featured .ex-card-title { font-size: 19px; }
        .ex-card.featured .ex-card-desc { font-size: 13.5px; }

        .ex-section-label { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .ex-section-label-text {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: #666; white-space: nowrap;
        }
        .ex-section-label-line { flex: 1; height: 1px; background: #232323; }

        @keyframes ex-fadein { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .ex-hero { animation: ex-fadein 0.4s ease both; }
        .ex-card { animation: ex-fadein 0.4s ease both; }
        .ex-card:nth-child(1) { animation-delay: 0.05s; }
        .ex-card:nth-child(2) { animation-delay: 0.10s; }
        .ex-card:nth-child(3) { animation-delay: 0.15s; }
        .ex-card:nth-child(4) { animation-delay: 0.20s; }
      `}</style>

      <div className="ex-root">
        <Navbar />

        <div className="ex-hero">
          <div className="ex-hero-tag">Explore CodeMaster</div>
          <h1 className="ex-hero-h1">
            Everything you need to<br />
            <em>ace your next interview</em>
          </h1>
          <p className="ex-hero-sub">
            From DSA visualizations to curated FAANG problem sets — pick a path and start building real skills today.
          </p>

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

        <div className="ex-main">
          <div className="ex-divider" />

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

          <div className="ex-section-label">
            <span className="ex-section-label-text">
              {filtered.length} {filter === "All" ? "collections" : filter.toLowerCase()} available
            </span>
            <div className="ex-section-label-line" />
          </div>

          <div className="ex-grid">
            {filtered.map((card, i) => (
              <div
                key={card.id}
                className={`ex-card${i === 0 && filter === "All" ? " featured" : ""}`}
                style={{
                  "--accent": card.accent,
                  "--accent-bg": card.accentBg,
                  "--accent-border": card.accentBorder,
                  "--glow": card.accentGlow,
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
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
                        Explore now <span className="ex-card-cta-arrow">→</span>
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