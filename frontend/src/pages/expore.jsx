import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/navbar";

const exploreCards = [
  {
    id: "roadmap",
    tag: "Path",
    title: "Structured Roadmap",
    desc: "A guided, topic-by-topic path from fundamentals to advanced patterns — always know exactly what to learn next.",
    items: ["Beginner to Advanced", "Topic-wise Tracks", "Progress Tracking"],
    route: "/explore/roadmap",
    span: 7,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="4" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="15" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.6 17.6L10.6 8.7M13.5 8.3L18.5 13.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 3.4" />
      </svg>
    ),
  },
  {
    id: "dsa-visualizer",
    tag: "Interactive",
    title: "Visualize DSA Algorithms",
    desc: "Watch sorting, searching, and graph algorithms animate step-by-step — see the logic, not just the code.",
    items: ["Sorting", "Graph Traversal", "Trees", "DP"],
    route: "/explore/dsa-visualizer",
    span: 5,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 20V13M10.5 20V7M17 20V15.5M4 10.5V4M10.5 4v0M17 12V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "complexity",
    tag: "Interactive",
    title: "Visualize Time Complexity",
    desc: "See how algorithms scale with interactive Big-O growth curves — compare space and runtime side by side.",
    items: ["Big-O", "Growth Curves", "Comparisons"],
    route: "/explore/complexity",
    span: 4,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 20H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 20C7 20 8 6 14 6C18 6 18 12 20 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "cheatsheet",
    tag: "Curated",
    title: "Cheat Sheets",
    desc: "Quick-reference sheets for syntax, patterns, and formulas — everything before an interview, on one page.",
    items: ["Patterns", "Syntax", "Formulas"],
    route: "/explore/cheatsheet",
    span: 4,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3.5" width="14" height="17" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.2 8.5H15.8M8.2 12H15.8M8.2 15.5H12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "talk-admin",
    tag: "Daily",
    title: "Talk to an Admin",
    desc: "Stuck on a problem? Start a live chat with an available mentor and get real-time help with your doubts.",
    items: ["Live Chat", "1-on-1 Support"],
    route: "/explore/talkadmin",
    span: 4,
    live: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 6.8C4 5.25 5.25 4 6.8 4h10.4C18.75 4 20 5.25 20 6.8v6.4c0 1.55-1.25 2.8-2.8 2.8H10l-4 3.4v-3.4H6.8C5.25 16 4 14.75 4 13.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Explore() {
  const [filter, setFilter] = useState("All");
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const filters = ["All", "Path", "Interactive", "Curated", "Daily"];
  const filtered =
    filter === "All" ? exploreCards : exploreCards.filter((c) => c.tag === filter);
  const isBento = filter === "All";

  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; }

        .bx-root {
          min-height: 100vh;
          background-color: #0a0806;
          background-image:
            linear-gradient(rgba(246,241,231,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(246,241,231,0.035) 1px, transparent 1px);
          background-size: 36px 36px;
          background-position: -1px -1px;
          color: #f6f1e7;
          font-family: 'Manrope', -apple-system, sans-serif;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #110e0a; }
        ::-webkit-scrollbar-thumb { background: #2a2419; border-radius: 3px; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        /* ── HERO ── */
        .bx-hero { max-width: 1120px; margin: 0 auto; padding: 84px 28px 46px; }

        .bx-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #e8632c;
          margin-bottom: 20px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .bx-h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 600;
          font-size: clamp(36px, 5vw, 58px);
          letter-spacing: -1.2px;
          line-height: 1.08;
          color: #f8f4ea;
          margin: 0 0 20px;
          max-width: 700px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.65s ease 0.06s, transform 0.65s ease 0.06s;
        }
        .bx-h1 span {
          background: linear-gradient(100deg, #ff8a3d, #e8632c 60%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .bx-sub {
          font-size: 16.5px; line-height: 1.7; color: #a89f8e;
          max-width: 520px; margin: 0;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.65s ease 0.12s, transform 0.65s ease 0.12s;
        }

        .bx-root.loaded .bx-eyebrow,
        .bx-root.loaded .bx-h1,
        .bx-root.loaded .bx-sub { opacity: 1; transform: translateY(0); }

        /* ── FILTERS ── */
        .bx-main { max-width: 1120px; margin: 0 auto; padding: 0 28px 110px; }

        .bx-filters {
          display: inline-flex; gap: 4px; padding: 4px;
          background: #17140f; border: 1px solid #2a2419; border-radius: 12px;
          margin-bottom: 40px;
        }
        .bx-filter-btn {
          background: none; border: none; cursor: pointer;
          padding: 8px 16px; border-radius: 9px;
          font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 600;
          color: #a89f8e; transition: color 0.2s ease, background 0.2s ease;
        }
        .bx-filter-btn:hover { color: #f6f1e7; }
        .bx-filter-btn.active { color: #110e0a; background: #e8632c; }

        /* ── GRID ── */
        .bx-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 18px;
        }
        .bx-grid.bx-grid-auto { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

        /* ── CARD ── */
        .bx-card {
          position: relative;
          grid-column: span 12;
          background: #17140f;
          border: 1px solid #2a2419;
          border-radius: 18px;
          padding: 30px 28px 26px;
          cursor: pointer;
          display: flex; flex-direction: column;
          transition: border-color 0.25s ease, transform 0.3s cubic-bezier(.22,1,.36,1), background 0.25s ease;
          opacity: 0; transform: translateY(16px);
          animation: bx-in 0.55s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes bx-in { to { opacity: 1; transform: translateY(0); } }

        .bx-card:hover {
          border-color: #4a3520;
          background: #1c1811;
          transform: translateY(-4px);
        }
        .bx-card:focus-visible { outline: 2px solid #e8632c; outline-offset: 2px; }

        .bx-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }

        .bx-card-icon {
          width: 46px; height: 46px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(232,99,44,0.1); border: 1px solid rgba(232,99,44,0.22);
          color: #e8862c;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1);
        }
        .bx-card:hover .bx-card-icon { transform: scale(1.06) rotate(-4deg); }

        .bx-card-live {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
          letter-spacing: 1px; color: #e8632c;
        }
        .bx-card-live::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%; background: #e8632c;
          animation: bx-pulse 2.4s ease-in-out infinite;
        }
        @keyframes bx-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .bx-card-tag {
          font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase; color: #77705f;
          margin-bottom: 10px;
        }

        .bx-card-title {
          font-family: 'Bricolage Grotesque', sans-serif; font-weight: 600;
          font-size: 21px; letter-spacing: -0.3px; color: #f6f1e7;
          margin: 0 0 10px; line-height: 1.25;
        }
        .bx-card[data-span="7"] .bx-card-title { font-size: 26px; }

        .bx-card-desc {
          font-size: 14px; line-height: 1.65; color: #948e7d;
          margin: 0 0 20px; flex: 1;
        }

        .bx-card-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
        .bx-card-tags span {
          font-family: 'Space Mono', monospace; font-size: 10.5px; color: #948e7d;
          background: #110e0a; border: 1px solid #2a2419; border-radius: 6px;
          padding: 4px 10px;
        }

        .bx-card-cta {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 600; color: #e8862c;
          margin-top: auto; width: fit-content;
        }
        .bx-card-cta svg { transition: transform 0.2s ease; }
        .bx-card:hover .bx-card-cta svg { transform: translate(2px, -2px); }

        @media (min-width: 860px) {
          .bx-card[data-span="7"] { grid-column: span 7; }
          .bx-card[data-span="5"] { grid-column: span 5; }
          .bx-card[data-span="4"] { grid-column: span 4; }
        }

        @media (max-width: 640px) {
          .bx-hero { padding: 60px 20px 36px; }
          .bx-main { padding: 0 20px 80px; }
        }
      `}</style>

      <div className={`bx-root${loaded ? " loaded" : ""}`}>
        <Navbar />

        <div className="bx-hero">
          <div className="bx-eyebrow">Explore</div>
          <h1 className="bx-h1">
            Everything you need to <span>ace your next interview</span>
          </h1>
          <p className="bx-sub">
            A guided path through fundamentals, live visualizers, and
            reference material — pick where to start.
          </p>
        </div>

        <div className="bx-main">
          <div className="bx-filters">
            {filters.map((f) => (
              <button
                key={f}
                className={`bx-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className={`bx-grid${isBento ? "" : " bx-grid-auto"}`}>
            {filtered.map((card, i) => (
              <div
                key={card.id}
                className="bx-card"
                data-span={isBento ? card.span : undefined}
                role="button"
                tabIndex={0}
                style={{ animationDelay: `${0.2 + i * 0.07}s` }}
                onClick={() => navigate(card.route)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(card.route)}
              >
                <div className="bx-card-top">
                  <div className="bx-card-icon">{card.icon}</div>
                  {card.live && <span className="bx-card-live">Live</span>}
                </div>
                <div className="bx-card-tag">{card.tag}</div>
                <h3 className="bx-card-title">{card.title}</h3>
                <p className="bx-card-desc">{card.desc}</p>
                <div className="bx-card-tags">
                  {card.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <span className="bx-card-cta">
                  Explore
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}