import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router";

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const NOW = Date.now();
const DAY = 86400000;
const HR  = 3600000;
const MIN = 60000;

const UPCOMING = [
  {
    id: "w503", type: "Weekly", num: 503,
    date: "Sun, May 25, 08:00 IST",
    startTs: NOW + 5 * DAY + 19 * HR + 30 * MIN,
    problems: 4, duration: "1.5 hours",
    gradient: "linear-gradient(135deg, #ff8c00 0%, #ffa116 40%, #ffcc44 100%)",
    glowColor: "#ffa116",
    icon: "🟠",
    registered: false,
  },
  {
    id: "bw183", type: "Biweekly", num: 183,
    date: "Sat, May 23, 20:00 IST",
    startTs: NOW + 5 * DAY + 7 * HR + 30 * MIN,
    problems: 4, duration: "1.5 hours",
    gradient: "linear-gradient(135deg, #3b1fa8 0%, #6366f1 50%, #818cf8 100%)",
    glowColor: "#6366f1",
    icon: "🟣",
    registered: false,
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Neal Wu",    country: "US", rating: 3702, attended: 201, avatar: null, init: "N", color: "#ffd700" },
  { rank: 2, name: "Miruu",      country: "JP", rating: 3686, attended: 189, avatar: null, init: "M", color: "#c084fc" },
  { rank: 3, name: "Yawn_Sean",  country: "CN", rating: 3644, attended: 174, avatar: null, init: "Y", color: "#cd7f32" },
  { rank: 4, name: "小羊肖恩",   country: "CN", rating: 3611, attended: 107, avatar: null, init: "X", color: "#4493f8" },
  { rank: 5, name: "何逊",       country: "CN", rating: 3599, attended: 146, avatar: null, init: "H", color: "#4493f8" },
  { rank: 6, name: "Joshua Chen",country: "AU", rating: 3589, attended: 100, avatar: null, init: "J", color: "#4493f8" },
  { rank: 7, name: "Rohin Garg", country: "IN", rating: 3506, attended: 88,  avatar: null, init: "R", color: "#4493f8" },
  { rank: 8, name: "Aryan Shah",  country: "IN", rating: 3499, attended: 95,  avatar: null, init: "A", color: "#4493f8" },
  { rank: 9, name: "tourist",    country: "BY", rating: 3491, attended: 212, avatar: null, init: "T", color: "#4493f8" },
  { rank:10, name: "Um_nik",     country: "UA", rating: 3480, attended: 178, avatar: null, init: "U", color: "#4493f8" },
];

const PAST_CONTESTS = [
  { id:"w502", type:"Weekly",   num:502, date:"Sun, May 17, 08:00 IST", solved:"0/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:28400 },
  { id:"w501", type:"Weekly",   num:501, date:"Sun, May 10, 08:00 IST", solved:"2/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:27900 },
  { id:"bw182",type:"Biweekly", num:182, date:"Sat, May 9, 20:00 IST",  solved:"1/4", gradient:"linear-gradient(135deg,#3b1fa8,#6366f1,#818cf8)",  participants:19200 },
  { id:"w500", type:"Weekly",   num:500, date:"Sun, May 3, 08:00 IST",  solved:"3/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:31000 },
  { id:"w499", type:"Weekly",   num:499, date:"Sun, Apr 26, 08:00 IST", solved:"0/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:26700 },
  { id:"bw181",type:"Biweekly", num:181, date:"Sat, Apr 25, 20:00 IST", solved:"2/4", gradient:"linear-gradient(135deg,#3b1fa8,#6366f1,#818cf8)",  participants:18800 },
  { id:"w498", type:"Weekly",   num:498, date:"Sun, Apr 19, 08:00 IST", solved:"4/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:29100 },
  { id:"w497", type:"Weekly",   num:497, date:"Sun, Apr 12, 08:00 IST", solved:"1/4", gradient:"linear-gradient(135deg,#ff8c00,#ffa116,#ffcc44)", participants:25600 },
];

const MY_STATS = {
  contestRating: 1842, globalRank: 14203, attended: 23,
  topPercent: 12.4, bestRank: 234, streak: 4,
};

// ── COUNTDOWN ─────────────────────────────────────────────────────────────────
function useCountdown(targetTs) {
  const [left, setLeft] = useState(targetTs - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(targetTs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTs]);
  const d  = Math.max(0, Math.floor(left / DAY));
  const h  = Math.max(0, Math.floor((left % DAY) / HR));
  const m  = Math.max(0, Math.floor((left % HR) / MIN));
  const s  = Math.max(0, Math.floor((left % MIN) / 1000));
  return { d, h, m, s, over: left <= 0 };
}

function CountdownChip({ targetTs, compact }) {
  const { d, h, m, s, over } = useCountdown(targetTs);
  const fmt = n => String(n).padStart(2, "0");
  if (over) return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:"#00b86b", background:"#0d2218", border:"1px solid #1a3a2a", borderRadius:6, padding:"3px 10px" }}>
      Live Now
    </span>
  );
  if (compact) return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.85)", background:"rgba(0,0,0,0.35)", borderRadius:6, padding:"3px 10px", display:"flex", alignItems:"center", gap:5 }}>
      ⧗ {d}d {fmt(h)}:{fmt(m)}:{fmt(s)}
    </span>
  );
  return (
    <div style={{ display:"flex", gap:8 }}>
      {[["Days",d],["Hours",h],["Mins",m],["Secs",s]].map(([lbl,val])=>(
        <div key={lbl} style={{ textAlign:"center" }}>
          <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:8, padding:"10px 14px", minWidth:52, fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:800, color:"#ffa116", lineHeight:1 }}>{fmt(val)}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#495366", letterSpacing:1, textTransform:"uppercase", marginTop:4 }}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ── 3D CUBE SVG ───────────────────────────────────────────────────────────────
function CubeArt({ color1, color2, size=120, count=1 }) {
  const offset = count === 2 ? [-28, 28] : [0];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ filter:`drop-shadow(0 8px 24px ${color1}88)` }}>
      {offset.map((ox, i) => {
        const cx=60+ox, cy=60+ox*0.3;
        const s=46-Math.abs(ox)*0.2;
        return (
          <g key={i} transform={`translate(${cx},${cy})`}>
            {/* top face */}
            <polygon points={`0,${-s*0.55} ${s*0.9},0 0,${s*0.55} ${-s*0.9},0`}
              fill={color2} opacity={0.9}/>
            {/* right face */}
            <polygon points={`0,${s*0.55} ${s*0.9},0 ${s*0.9},${s*0.7} 0,${s*1.25}`}
              fill={color1} opacity={0.85}/>
            {/* left face */}
            <polygon points={`0,${s*0.55} ${-s*0.9},0 ${-s*0.9},${s*0.7} 0,${s*1.25}`}
              fill={color1} opacity={0.65}/>
            {/* glass edge highlights */}
            <line x1="0" y1={-s*0.55} x2={s*0.9} y2="0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            <line x1="0" y1={-s*0.55} x2={-s*0.9} y2="0" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <line x1="0" y1={-s*0.55} x2="0" y2={s*1.25} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          </g>
        );
      })}
    </svg>
  );
}

// ── CONTEST CARD ──────────────────────────────────────────────────────────────
function ContestCard({ contest, onRegister }) {
  const [hov, setHov] = useState(false);
  const isWeekly = contest.type === "Weekly";
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: contest.gradient,
        borderRadius: 16, overflow:"hidden", position:"relative",
        cursor:"pointer",
        transform: hov ? "translateY(-4px) scale(1.01)" : "none",
        transition: "transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s",
        boxShadow: hov ? `0 20px 50px -8px ${contest.glowColor}66` : `0 8px 24px -4px ${contest.glowColor}33`,
        minHeight: 220,
      }}>

      {/* Background shimmer */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)", pointerEvents:"none" }} />

      {/* Countdown pill */}
      <div style={{ position:"absolute", top:14, right:14, zIndex:2 }}>
        <CountdownChip targetTs={contest.startTs} compact />
      </div>

      {/* Art */}
      <div style={{ position:"absolute", right:-10, top:"50%", transform:"translateY(-50%)", opacity:0.9 }}>
        {isWeekly
          ? <CubeArt color1="#e67e00" color2="#ffcc44" size={130} count={1}/>
          : <CubeArt color1="#4338ca" color2="#818cf8" size={130} count={2}/>
        }
      </div>

      {/* Content */}
      <div style={{ position:"relative", zIndex:1, padding:"22px 24px", minHeight:220, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.7)", marginBottom:6 }}>
            {contest.type} Contest
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:-0.5, marginBottom:4 }}>
            {contest.type} Contest {contest.num}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.7)" }}>
            {contest.date}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.8)" }}>
              📋 {contest.problems} problems
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.8)" }}>
              ⏱ {contest.duration}
            </span>
          </div>
          <button onClick={e=>{e.stopPropagation();onRegister(contest.id);}}
            style={{
              background: contest.registered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.9)",
              color: contest.registered ? "#fff" : "#0d1117",
              border:"none", borderRadius:8, padding:"7px 18px",
              fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
              cursor:"pointer", transition:"all 0.15s",
              backdropFilter:"blur(4px)",
            }}>
            {contest.registered ? "✓ Registered" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LEADERBOARD ROW ───────────────────────────────────────────────────────────
function PodiumUser({ user, pos }) {
  const sizes  = { 1: 72, 2: 62, 3: 62 };
  const yOff   = { 1: 0, 2: 18, 3: 18 };
  const medals = { 1:"🥇", 2:"🥈", 3:"🥉" };
  const sz = sizes[pos];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginTop: yOff[pos] }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", fontSize:16 }}>{medals[pos]}</span>
        <div style={{
          width:sz, height:sz, borderRadius:"50%",
          background: `linear-gradient(135deg, ${pos===1?"#ffd700, #ff8c00":pos===2?"#c084fc,#6366f1":"#cd7f32,#a05a2c"})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:sz/2.8, fontWeight:800, color:"#fff",
          boxShadow:`0 0 ${pos===1?24:16}px ${pos===1?"#ffd70088":pos===2?"#c084fc88":"#cd7f3288"}`,
          border:`2px solid ${pos===1?"#ffd700":pos===2?"#c084fc":"#cd7f32"}`,
        }}>
          {user.init}
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:12, fontWeight:700, color: pos===1?"#ffd700":pos===2?"#c084fc":"#cd7f32" }}>
          {user.name.length > 10 ? user.name.slice(0,10)+"…" : user.name}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:800, color:"#e6edf3", letterSpacing:-0.5 }}>
          {user.rating}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ContestPage() {
  const [contests, setContests] = useState(UPCOMING);
  const [lbMode, setLbMode]     = useState("Global");
  const [pastTab, setPastTab]   = useState("Past");
  const [registered, setRegistered] = useState({});

  const handleRegister = (id) => {
    setRegistered(r => ({ ...r, [id]: !r[id] }));
    setContests(prev => prev.map(c => c.id === id ? { ...c, registered: !c.registered } : c));
  };

  const solvedColor = (s) => {
    const [a] = s.split("/");
    return +a === 0 ? "#495366" : +a === 4 ? "#00b86b" : "#ffa116";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

        .ct-root {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
        }

        /* TOPBAR */
        .ct-topbar {
          height: 48px; background: #161b22;
          border-bottom: 1px solid #21262d;
          display: flex; align-items: center;
          padding: 0 20px; gap: 8px;
          position: sticky; top: 0; z-index: 30;
        }
        .ct-logo {
          width: 28px; height: 28px; border-radius: 6px;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #0d1117;
        }
        .ct-logo-t { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .ct-sep { width: 1px; height: 20px; background: #21262d; margin: 0 4px; }
        .ct-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .ct-crumb span { color: #ffa116; }

        /* HERO */
        .ct-hero {
          text-align: center;
          padding: 52px 24px 0;
          position: relative;
        }
        .ct-trophy {
          font-size: 64px; margin-bottom: 16px;
          filter: drop-shadow(0 0 32px #ffa11688);
          animation: ct-float 3s ease-in-out infinite;
        }
        @keyframes ct-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .ct-hero-h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 400; letter-spacing: -0.02em;
          color: #f1f5f9; margin-bottom: 10px;
        }
        .ct-hero-h1 em { font-style: italic; color: #ffa116; }
        .ct-hero-sub { font-size: 14px; color: #8b949e; margin-bottom: 36px; }

        /* MY STATS STRIP */
        .ct-mystats {
          display: flex; gap: 0; max-width: 680px;
          margin: 0 auto 40px;
          background: #161b22; border: 1px solid #21262d;
          border-radius: 12px; overflow: hidden;
        }
        .ct-mystat { flex: 1; padding: 14px 0; text-align: center; border-right: 1px solid #21262d; }
        .ct-mystat:last-child { border-right: none; }
        .ct-mystat-val { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
        .ct-mystat-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #495366; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px; }

        /* UPCOMING GRID */
        .ct-upcoming-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; max-width: 880px; margin: 0 auto;
        }

        /* MAIN CONTENT */
        .ct-main {
          max-width: 1080px; margin: 0 auto;
          padding: 0 24px 80px;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 24px; align-items: start;
        }

        /* SECTION LABEL */
        .ct-slabel {
          display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
        }
        .ct-slabel-bar { width: 3px; height: 14px; border-radius: 2px; }
        .ct-slabel-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #495366; }
        .ct-slabel-line { flex: 1; height: 1px; background: #21262d; }

        /* CARD */
        .ct-card {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 12px; overflow: hidden;
        }
        .ct-card-hdr {
          padding: 12px 18px; border-bottom: 1px solid #21262d;
          background: #0d1117; display: flex; align-items: center; gap: 8px;
        }
        .ct-card-hdr-dot { width: 5px; height: 5px; border-radius: 50%; }
        .ct-card-hdr-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #495366; }

        /* PODIUM */
        .ct-podium {
          display: flex; justify-content: center; align-items: flex-end;
          gap: 24px; padding: 32px 24px 20px;
        }

        /* LB ROWS */
        .ct-lb-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 18px; border-bottom: 1px solid #21262d;
          transition: background 0.12s; cursor: pointer;
        }
        .ct-lb-row:last-child { border-bottom: none; }
        .ct-lb-row:hover { background: #1c2130; }
        .ct-lb-rank { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #495366; width: 24px; text-align: center; flex-shrink: 0; }
        .ct-lb-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
        }
        .ct-lb-name { flex: 1; font-size: 13px; font-weight: 600; }
        .ct-lb-country { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #495366; }
        .ct-lb-rating { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #ffa116; }
        .ct-lb-attended { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #495366; }

        /* MODE TOGGLE */
        .ct-mode-toggle { display: flex; gap: 0; background: #0d1117; border-radius: 8px; overflow: hidden; border: 1px solid #21262d; }
        .ct-mode-btn { padding: 6px 18px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: 'JetBrains Mono', monospace; background: transparent; color: #8b949e; transition: all 0.15s; letter-spacing: 0.5px; }
        .ct-mode-btn.active { background: #ffa116; color: #0d1117; }

        /* PAST TABS */
        .ct-past-tabs { display: flex; background: #0d1117; border-bottom: 1px solid #21262d; }
        .ct-past-tab { padding: 10px 20px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; background: transparent; color: #8b949e; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .ct-past-tab.active { color: #ffa116; border-bottom-color: #ffa116; }

        /* PAST ROW */
        .ct-past-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 18px; border-bottom: 1px solid #21262d;
          transition: background 0.12s; cursor: pointer;
        }
        .ct-past-row:last-child { border-bottom: none; }
        .ct-past-row:hover { background: #1c2130; }
        .ct-past-thumb {
          width: 60px; height: 44px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .ct-past-title { font-size: 13px; font-weight: 700; color: #e6edf3; margin-bottom: 2px; }
        .ct-past-date { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #8b949e; }
        .ct-past-solved { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 2px 10px; background: #0d1117; border: 1px solid #21262d; border-radius: 20px; }
        .ct-virtual-btn { padding: 4px 12px; background: #120d1e; border: 1px solid #2a1a3a; border-radius: 20px; color: #c084fc; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
        .ct-virtual-btn:hover { background: #c084fc; color: #0d1117; }
        .ct-participants { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #495366; }

        /* COUNTDOWN SECTION */
        .ct-countdown-section { padding: 28px 24px; text-align: center; }
        .ct-countdown-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #495366; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }

        /* ANIMATIONS */
        @keyframes ct-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ct-hero      { animation: ct-in 0.4s ease both 0.05s; }
        .ct-upcoming-grid { animation: ct-in 0.4s ease both 0.15s; }
        .ct-main      { animation: ct-in 0.4s ease both 0.2s; }
        .ct-mystats   { animation: ct-in 0.4s ease both 0.12s; }

        @media (max-width: 768px) {
          .ct-main { grid-template-columns: 1fr; }
          .ct-upcoming-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ct-root">

        {/* TOPBAR */}
        <div className="ct-topbar">
          <div className="ct-logo">⌨</div>
          <span className="ct-logo-t">CodeMaster</span>
          <div className="ct-sep" />
          <span className="ct-crumb">
            <NavLink to={"/"}>
            Home /
            </NavLink> <span>Contest</span></span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#ffa116", background:"#1e1608", border:"1px solid #3a2e0f", borderRadius:20, padding:"2px 10px" }}>
              Rating: {MY_STATS.contestRating}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"#c084fc", background:"#120d1e", border:"1px solid #2a1a3a", borderRadius:20, padding:"2px 10px" }}>
              Rank #{MY_STATS.globalRank.toLocaleString()}
            </span>
          </div>
        </div>

        {/* HERO */}
        <div className="ct-hero">
          <div className="ct-trophy">🏆</div>
          <h1 className="ct-hero-h1">CodeMaster <em>Contest</em></h1>
          <p className="ct-hero-sub">Compete every week. Climb the leaderboard. Prove your skills.</p>

          {/* My Stats */}
          <div className="ct-mystats">
            {[
              { val: MY_STATS.contestRating,            lbl: "Contest Rating", color: "#ffa116" },
              { val: `#${MY_STATS.globalRank.toLocaleString()}`, lbl: "Global Rank", color: "#c084fc" },
              { val: MY_STATS.attended,                 lbl: "Attended",       color: "#4493f8" },
              { val: `Top ${MY_STATS.topPercent}%`,     lbl: "Percentile",     color: "#00b86b" },
              { val: `#${MY_STATS.bestRank}`,           lbl: "Best Rank",      color: "#ffa116" },
              { val: `${MY_STATS.streak}🔥`,            lbl: "Streak",         color: "#ff4444" },
            ].map(s => (
              <div key={s.lbl} className="ct-mystat">
                <div className="ct-mystat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="ct-mystat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Upcoming Contests */}
          <div style={{ maxWidth: 880, margin: "0 auto 16px", padding: "0 24px" }}>
            <div className="ct-slabel" style={{ marginBottom:14 }}>
              <div className="ct-slabel-bar" style={{ background:"#ffa116" }} />
              <span className="ct-slabel-text">Upcoming Contests</span>
              <div className="ct-slabel-line" />
            </div>
          </div>
          <div className="ct-upcoming-grid" style={{ padding:"0 24px" }}>
            {contests.map(c => <ContestCard key={c.id} contest={c} onRegister={handleRegister} />)}
          </div>

          {/* Next contest countdown */}
          <div style={{ maxWidth:880, margin:"20px auto 0", padding:"0 24px" }}>
            <div className="ct-card" style={{ background:"linear-gradient(135deg,#161b22,#1c2130)" }}>
              <div className="ct-countdown-section">
                <div className="ct-countdown-label">⧗ Next Contest Starts In</div>
                <CountdownChip targetTs={contests[1].startTs} compact={false} />
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#8b949e", marginTop:14 }}>
                  {contests[1].type} Contest {contests[1].num} · {contests[1].date}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height:1, background:"#21262d", margin:"40px 0 32px" }} />

        {/* MAIN CONTENT */}
        <div className="ct-main">

          {/* LEFT — LEADERBOARD */}
          <div>
            <div className="ct-slabel">
              <div className="ct-slabel-bar" style={{ background:"#ffd700" }} />
              <span className="ct-slabel-text">Leaderboard</span>
              <div className="ct-slabel-line" />
              <div className="ct-mode-toggle">
                {["Global","LLM"].map(m=>(
                  <button key={m} className={`ct-mode-btn${lbMode===m?" active":""}`} onClick={()=>setLbMode(m)}>{m}</button>
                ))}
              </div>
            </div>

            <div className="ct-card">
              {/* Podium top 3 */}
              <div className="ct-podium">
                <PodiumUser user={LEADERBOARD[1]} pos={2} />
                <PodiumUser user={LEADERBOARD[0]} pos={1} />
                <PodiumUser user={LEADERBOARD[2]} pos={3} />
              </div>

              {/* Ranks 4-10 */}
              <div style={{ borderTop:"1px solid #21262d" }}>
                {LEADERBOARD.slice(3).map(u => (
                  <div key={u.rank} className="ct-lb-row">
                    <span className="ct-lb-rank">{u.rank}</span>
                    <div className="ct-lb-avatar" style={{ background: u.rank <= 3 ? "#1e1608" : "#1c2130", border:`1.5px solid ${u.rank<=3?"#3a2e0f":"#21262d"}`, color:"#e6edf3" }}>
                      {u.init}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span className="ct-lb-name">{u.name}</span>
                        <span className="ct-lb-country" style={{ fontSize:9 }}>{u.country}</span>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div className="ct-lb-rating">{u.rating}</div>
                      <div className="ct-lb-attended">{u.attended} contests</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View all */}
              <div style={{ padding:"12px 18px", borderTop:"1px solid #21262d", textAlign:"center" }}>
                <button style={{ background:"none", border:"1px solid #21262d", borderRadius:8, color:"#8b949e", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, padding:"7px 24px", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.target.style.borderColor="#ffa116";e.target.style.color="#ffa116";}}
                  onMouseLeave={e=>{e.target.style.borderColor="#21262d";e.target.style.color="#8b949e";}}>
                  View Full Leaderboard →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — PAST CONTESTS */}
          <div>
            <div className="ct-slabel">
              <div className="ct-slabel-bar" style={{ background:"#c084fc" }} />
              <span className="ct-slabel-text">Contest History</span>
              <div className="ct-slabel-line" />
            </div>

            <div className="ct-card">
              <div className="ct-past-tabs">
                {["Past Contests", "My Contests"].map(t => (
                  <button key={t} className={`ct-past-tab${pastTab===t?" active":""}`} onClick={()=>setPastTab(t)}>{t}</button>
                ))}
              </div>

              {/* Ratings mini chart */}
              {pastTab === "My Contests" && (
                <div style={{ padding:"16px 18px", borderBottom:"1px solid #21262d" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#495366", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Rating History</div>
                  <svg viewBox="0 0 380 60" width="100%" style={{ display:"block", overflow:"visible" }}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffa116" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#ffa116" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = [1650,1720,1690,1780,1760,1800,1842];
                      const min=1600,max=1900,w=380,h=60;
                      const xs = pts.map((_,i)=> (i/(pts.length-1))*(w-20)+10);
                      const ys = pts.map(p=> h - ((p-min)/(max-min))*(h-10)-5);
                      const d  = xs.map((x,i)=>`${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
                      const area= d + ` L${xs[xs.length-1]},${h} L${xs[0]},${h} Z`;
                      return (<>
                        <path d={area} fill="url(#rg)"/>
                        <path d={d} fill="none" stroke="#ffa116" strokeWidth="2" strokeLinecap="round"/>
                        {xs.map((x,i)=>(
                          <g key={i}>
                            <circle cx={x} cy={ys[i]} r={i===pts.length-1?5:3} fill={i===pts.length-1?"#ffa116":"#0d1117"} stroke="#ffa116" strokeWidth="1.5"/>
                            {i===pts.length-1&&<text x={x} y={ys[i]-10} textAnchor="middle" fill="#ffa116" fontSize="10" fontFamily="'JetBrains Mono',monospace" fontWeight="700">{pts[i]}</text>}
                          </g>
                        ))}
                      </>);
                    })()}
                  </svg>
                </div>
              )}

              {/* Past list */}
              <div>
                {PAST_CONTESTS.map((c, i) => (
                  <div key={c.id} className="ct-past-row">
                    {/* Thumbnail */}
                    <div className="ct-past-thumb" style={{ background: c.gradient }}>
                      <CubeArt
                        color1={c.type==="Weekly"?"#e67e00":"#4338ca"}
                        color2={c.type==="Weekly"?"#ffcc44":"#818cf8"}
                        size={50} count={c.type==="Weekly"?1:2}
                      />
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="ct-past-title">{c.type} Contest {c.num}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span className="ct-past-date">{c.date}</span>
                        <span className="ct-participants">· {(c.participants/1000).toFixed(1)}k participants</span>
                      </div>
                    </div>

                    <span className="ct-past-solved" style={{ color: solvedColor(c.solved), borderColor: solvedColor(c.solved)+"44", background: solvedColor(c.solved)+"11" }}>
                      {c.solved}
                    </span>

                    <button className="ct-virtual-btn">Virtual</button>
                  </div>
                ))}
              </div>

              {/* Load more */}
              <div style={{ padding:"12px 18px", borderTop:"1px solid #21262d", textAlign:"center" }}>
                <button style={{ background:"none", border:"1px solid #21262d", borderRadius:8, color:"#8b949e", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, padding:"7px 24px", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.target.style.borderColor="#c084fc";e.target.style.color="#c084fc";}}
                  onMouseLeave={e=>{e.target.style.borderColor="#21262d";e.target.style.color="#8b949e";}}>
                  Load More Contests ↓
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}