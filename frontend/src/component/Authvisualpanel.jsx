import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import Logo from './Logo';

/* Shared styles for both auth pages. Rendered once here (mounted on both
   Login and Signup) - a <style> tag applies globally regardless of
   where in the tree it sits. */
function AuthStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; font-optical-sizing: auto; }
      .font-body    { font-family: 'DM Sans', sans-serif; }
      .font-script  { font-family: 'Fraunces', ui-serif, Georgia, serif; font-style: italic; }

      .hero-grid {
        background-image:
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 48px 48px;
      }

      .noise::after {
        content: '';
        position: fixed; inset: 0; pointer-events: none; z-index: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        opacity: 0.55;
      }

      @keyframes glow-pulse {
        0%,100% { opacity: 0.35; }
        50%      { opacity: 0.55; }
      }
      .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
    `}</style>
  );
}

const COPY = {
  login: {
    headline: (
      <>Pick up your <span className="font-script italic text-orange-400">rank</span>{'\n'}right where you left it.</>
    ),
    sub: 'Your submissions, streak, and duel history are exactly how you left them.',
    caption: 'Every solve nudges you a little closer to Master.',
  },
  signup: {
    headline: (
      <>Begin the climb to <span className="font-script italic text-orange-400">Master</span>.</>
    ),
    sub: 'One account gets you problems, live duels, and contests — all in one workspace.',
    caption: 'Novice to Master — the whole climb, tracked.',
  },
};

const TIERS = [
  { label: 'Novice', x: 30, y: 136 },
  { label: 'Apprentice', x: 166, y: 104 },
  { label: 'Expert', x: 302, y: 70 },
  { label: 'Master', x: 438, y: 34 },
];

/* Signature element: a quiet rating ladder rather than an invented metric —
   it dramatizes the one thing every CodeMaster session is actually for:
   moving up a tier. The top node (Master) is always the lit one, echoing
   the wordmark in the logo above it. */
function RatingLadder({ caption }) {
  const pathD = `M ${TIERS.map((t) => `${t.x} ${t.y}`).join(' L ')}`;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 pb-6 pt-7 backdrop-blur-sm">
      <svg viewBox="0 0 470 170" className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="ladderLine" x1="0" y1="170" x2="470" y2="0">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
          </linearGradient>
          <filter id="ladderGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={pathD} fill="none" stroke="url(#ladderLine)" strokeWidth="1.5" strokeDasharray="1.5 7" strokeLinecap="round" />

        {TIERS.map((t, i) => {
          const isLast = i === TIERS.length - 1;
          return (
            <g key={t.label}>
              <circle
                cx={t.x}
                cy={t.y}
                r={isLast ? 5.5 : 3.5}
                fill={isLast ? '#f97316' : '#0a0a0a'}
                stroke={isLast ? '#f97316' : 'rgba(255,255,255,0.32)'}
                strokeWidth="1.4"
                filter={isLast ? 'url(#ladderGlow)' : undefined}
                className={isLast ? 'glow-pulse' : ''}
              />
              <text
                x={t.x}
                y={isLast ? t.y - 16 : t.y + 20}
                textAnchor="middle"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: isLast ? 12 : 10.5,
                  fontWeight: isLast ? 700 : 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fill: isLast ? '#fdba74' : 'rgba(255,255,255,0.32)',
                }}
              >
                {t.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-start gap-2 border-t border-white/[0.06] pt-4">
        <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400/70" />
        <p className="font-body text-[13px] leading-relaxed text-white/40">{caption}</p>
      </div>
    </div>
  );
}

function AuthVisualPanel({ variant = 'login' }) {
  const copy = COPY[variant] ?? COPY.login;

  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] px-14 py-12 lg:flex">
      <AuthStyles />

      {/* logo + headline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
        <Logo size="xl" tagline="Competitive coding, elevated" />

        <h1 className="font-display mt-11 whitespace-pre-line text-[2.5rem] font-600 leading-[1.16] tracking-tight text-white">
          {copy.headline}
        </h1>
        <p className="font-body mt-4 max-w-sm text-[15px] leading-relaxed text-white/40">{copy.sub}</p>
      </motion.div>

      {/* signature element: rating ladder, real product concept, no invented metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        className="relative z-10"
      >
        <RatingLadder caption={copy.caption} />
      </motion.div>

      <p className="font-body relative z-10 text-[11px] tracking-wide text-white/20">
        © {new Date().getFullYear()} CodeMaster — practice deliberately.
      </p>
    </div>
  );
}

export { AuthStyles };
export default AuthVisualPanel;