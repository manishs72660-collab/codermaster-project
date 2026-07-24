import { useState, useEffect, useRef } from "react";
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
    route: "/explore/talkadmin",
  },
];

// Faint node/edge map drawn behind the hero — a graph quietly traversing itself,
// a nod to what the platform actually teaches.
const graphNodes = [
  { x: 60, y: 40 }, { x: 200, y: 20 }, { x: 340, y: 70 },
  { x: 120, y: 130 }, { x: 280, y: 150 }, { x: 420, y: 110 },
  { x: 40, y: 210 }, { x: 380, y: 220 },
];
const graphEdges = [
  [0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [4, 5], [3, 6], [4, 7],
];

function GraphField() {
  return (
    <svg className="ex-graph" viewBox="0 0 460 250" preserveAspectRatio="none" aria-hidden="true">
      {graphEdges.map(([a, b], i) => {
        const n1 = graphNodes[a], n2 = graphNodes[b];
        return (
          <line
            key={i}
            x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
            className="ex-graph-edge"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        );
      })}
      {graphNodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="3.2" className="ex-graph-node" style={{ animationDelay: `${i * 0.22}s` }} />
      ))}
      <circle r="3.5" className="ex-graph-pulse">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path="M60,40 L200,20 L340,70 L280,150 L120,130 L40,210"
        />
      </circle>
    </svg>
  );
}

export default function Explore() {
  const [filter, setFilter] = useState("All");
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const cardRefs = useRef([]);

  const filters = ["All", "Interactive", "Curated", "Daily"];
  const filtered =
    filter === "All"
      ? exploreCards
      : exploreCards.filter((c) => c.tag.toLowerCase() === filter.toLowerCase());

  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleMove = (e, id) => {
    const el = cardRefs.current[id];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  };

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
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ff8a00; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

        /* ── HERO ── */
        .ex-hero { position: relative; padding: 64px 24px 40px; max-width: 1000px; margin: 0 auto; }

        .ex-graph {
          position: absolute; top: -10px; right: -40px;
          width: 480px; height: 260px; opacity: 0.55;
          pointer-events: none;
        }
        .ex-graph-edge {
          stroke: #ff8a00; stroke-width: 1; opacity: 0;
          stroke-dasharray: 6 4;
          animation: ex-edge-in 0.9s ease forwards;
        }
        @keyframes ex-edge-in { from { opacity: 0; } to { opacity: 0.28; } }
        .ex-graph-node {
          fill: #ffb84d; opacity: 0;
          animation: ex-node-in 0.6s ease forwards;
        }
        @keyframes ex-node-in { from { opacity: 0; r: 1; } to { opacity: 0.85; r: 3.2; } }
        .ex-graph-pulse { fill: #ff6b00; filter: drop-shadow(0 0 5px #ff6b00); }

        .ex-hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #ff8a00;
          background: rgba(255,138,0,0.08); border: 1px solid rgba(255,138,0,0.25);
          border-radius: 20px; padding: 5px 12px 5px 10px; margin-bottom: 22px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
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
          margin-bottom: 16px; max-width: 620px;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.6s ease 0.08s, transform 0.6s ease 0.08s;
        }
        .ex-hero-h1 em {
          font-style: normal;
          background: linear-gradient(90deg, #ffb84d, #ff6b00);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-size: 200% 100%;
          animation: ex-gradient-shift 6s ease infinite;
        }
        @keyframes ex-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        .ex-hero-sub {
          font-size: 15px; color: #9a9a9a; line-height: 1.75;
          max-width: 480px; margin-bottom: 0;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.6s ease 0.16s, transform 0.6s ease 0.16s;
        }

        .ex-root.loaded .ex-hero-tag,
        .ex-root.loaded .ex-hero-h1,
        .ex-root.loaded .ex-hero-sub { opacity: 1; transform: translateY(0); }

        .ex-divider { height: 1px; background: linear-gradient(90deg, #232323, transparent); margin: 40px 0 32px; }

        .ex-main { position: relative; max-width: 1000px; margin: 0 auto; padding: 0 24px 90px; }

        /* ── FILTERS ── */
        .ex-filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
        .ex-filter-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: #666; letter-spacing: 1px; text-transform: uppercase; margin-right: 6px;
        }
        .ex-filter-btn {
          position: relative;
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
          transition: border-color 0.25s, transform 0.3s cubic-bezier(.22,1,.36,1), background 0.25s, box-shadow 0.3s;
          opacity: 0; transform: translateY(18px);
          animation: ex-card-in 0.55s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes ex-card-in { to { opacity: 1; transform: translateY(0); } }

        .ex-card::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: radial-gradient(240px circle at var(--mx,50%) var(--my,50%), var(--glow), transparent 65%);
          opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
        }
        .ex-card:hover::before { opacity: 1; }
        .ex-card:hover {
          border-color: var(--accent-border);
          background: var(--accent-bg);
          transform: translateY(-5px);
          box-shadow: 0 18px 40px -18px rgba(0,0,0,0.55);
        }
        .ex-card:active { transform: translateY(-2px); }

        .ex-card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; position: relative; z-index: 1; }
        .ex-card-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-bg); border: 1px solid var(--accent-border);
          font-size: 21px; color: var(--accent); flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), background 0.15s;
        }
        .ex-card:hover .ex-card-icon-wrap { transform: scale(1.1) rotate(-6deg); background: var(--accent-border); }

        .ex-card-tag {
          position: relative; z-index: 1;
          font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase; color: var(--accent);
          margin-bottom: 7px; opacity: 0.85;
        }
        .ex-card-title { position: relative; z-index: 1; font-size: 16px; font-weight: 700; color: #f7f7f7; letter-spacing: -0.3px; margin-bottom: 9px; line-height: 1.3; }
        .ex-card-desc { position: relative; z-index: 1; font-size: 12.5px; color: #999; line-height: 1.7; margin-bottom: 18px; flex: 1; }

        .ex-card-items { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
        .ex-card-item {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #888;
          background: #0a0a0a; border: 1px solid #232323; border-radius: 6px; padding: 3px 9px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ex-card:hover .ex-card-item { color: var(--accent); border-color: var(--accent-border); }

        .ex-card-cta {
          position: relative; z-index: 1;
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
          color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-border);
          border-radius: 8px; padding: 8px 15px; width: fit-content;
          transition: gap 0.15s, background 0.15s;
        }
        .ex-card:hover .ex-card-cta { gap: 11px; background: var(--accent-border); }
        .ex-card-cta-arrow { display: inline-block; transition: transform 0.15s; }
        .ex-card:hover .ex-card-cta-arrow { transform: translateX(3px); }

        /* ── FEATURED ── */
        .ex-card.featured {
          grid-column: 1 / -1; flex-direction: row; gap: 34px; padding: 30px 30px; align-items: center;
        }
        .ex-card.featured .ex-card-left { flex: 1; position: relative; z-index: 1; }
        .ex-card.featured .ex-card-icon-wrap { width: 68px; height: 68px; border-radius: 16px; font-size: 32px; flex-shrink: 0; }
        .ex-card.featured .ex-card-title { font-size: 19px; }
        .ex-card.featured .ex-card-desc { font-size: 13.5px; }

        .ex-section-label { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .ex-section-label-text {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase; color: #666; white-space: nowrap;
        }
        .ex-section-label-line { flex: 1; height: 1px; background: #232323; }

        @media (max-width: 640px) {
          .ex-graph { display: none; }
          .ex-card.featured { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className={`ex-root${loaded ? " loaded" : ""}`}>
        <Navbar />

        <div className="ex-hero">
          <GraphField />
          <div className="ex-hero-tag">Explore CodeMaster</div>
          <h1 className="ex-hero-h1">
            Everything you need to<br />
            <em>ace your next interview</em>
          </h1>
          <p className="ex-hero-sub">
            From DSA visualizations to curated FAANG problem sets — pick a path and start building real skills today.
          </p>
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
                ref={(el) => (cardRefs.current[card.id] = el)}
                className={`ex-card${i === 0 && filter === "All" ? " featured" : ""}`}
                style={{
                  "--accent": card.accent,
                  "--accent-bg": card.accentBg,
                  "--accent-border": card.accentBorder,
                  "--glow": card.accentGlow,
                  animationDelay: `${0.25 + i * 0.08}s`,
                }}
                onMouseMove={(e) => handleMove(e, card.id)}
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