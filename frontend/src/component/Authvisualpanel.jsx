import { useEffect, useState } from 'react';
import { Code2, Swords, Radio } from 'lucide-react';
import { motion } from 'motion/react';

/* Shared styles for both auth pages. Rendered once here (mounted on both
   Login and Signup) - a <style> tag applies globally regardless of
   where in the tree it sits. */
function AuthStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
      .font-display { font-family: 'Syne', sans-serif; }
      .font-body    { font-family: 'DM Sans', sans-serif; }
      .font-code    { font-family: 'JetBrains Mono', ui-monospace, monospace; }

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

      @keyframes caret-blink {
        0%,49%  { opacity: 1; }
        50%,100% { opacity: 0; }
      }
      .caret-blink { animation: caret-blink 1s step-end infinite; }

      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
    `}</style>
  );
}

const COPY = {
  login: {
    pill: 'Session',
    headline: (
      <>Pick up your <span className="text-orange-500">streak</span>{'\n'}right where it left off.</>
    ),
    sub: 'Your submissions, rating, and duel history are exactly as you left them.',
    log: [
      { text: '$ codemaster session --resume', done: false },
      { text: 'verifying credentials', done: true },
      { text: 'restoring workspace', done: true },
      { text: 'syncing submission history', done: true },
      { text: 'session restored ✓', done: false, accent: true },
    ],
  },
  signup: {
    pill: 'New profile',
    headline: (
      <>Spin up a <span className="text-orange-500">profile</span>{'\n'}and start shipping solutions.</>
    ),
    sub: 'One account gets you problems, live duels, and contests in the same workspace.',
    log: [
      { text: '$ codemaster init --profile', done: false },
      { text: 'provisioning workspace', done: true },
      { text: 'linking judge runtime', done: true },
      { text: 'loading problem catalog', done: true },
      { text: 'profile ready ✓', done: false, accent: true },
    ],
  },
};

function BuildLog({ lines }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (!lines?.length) return;
    const timers = lines.map((_, i) =>
      setTimeout(() => setVisible((v) => Math.max(v, i + 1)), 260 * i + 200)
    );
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <Radio className="h-3 w-3 text-orange-400/70" />
        <span className="font-code text-[10px] uppercase tracking-[0.15em] text-white/30">arena — build log</span>
      </div>
      <div className="space-y-1.5 px-4 py-4 font-code text-[12.5px] leading-relaxed">
        {lines.map((line, i) => {
          const shown = i < visible;
          const isLast = i === lines.length - 1;
          return (
            <div
              key={line.text}
              className="flex items-center gap-2 transition-opacity duration-300"
              style={{ opacity: shown ? 1 : 0 }}
            >
              <span className={line.accent ? 'text-orange-400' : 'text-white/25'}>
                {line.accent ? '›' : line.done ? '✓' : '$'}
              </span>
              <span className={line.accent ? 'text-orange-300' : line.done ? 'text-white/45' : 'text-white/70'}>
                {line.text}
              </span>
              {isLast && shown && <span className="caret-blink text-orange-400">▍</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuthVisualPanel({ variant = 'login' }) {
  const copy = COPY[variant] ?? COPY.login;

  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] px-14 py-12 lg:flex">
      <AuthStyles />

      {/* logo + eyebrow */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Code2 className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-lg font-800 tracking-tight text-white">
            Code<span className="text-orange-500">Master</span>
          </span>
        </div>

        <div className="mt-8 flex w-fit items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1">
          <Swords className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400">{copy.pill}</span>
        </div>

        <h1 className="font-display mt-5 whitespace-pre-line text-4xl font-800 leading-[1.15] tracking-tight text-white">
          {copy.headline}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">{copy.sub}</p>
      </motion.div>

      {/* signature element: animated terminal build log, real copy, no invented metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="relative z-10"
      >
        <BuildLog lines={copy.log} />
      </motion.div>

      <p className="relative z-10 font-code text-[11px] text-white/20">© {new Date().getFullYear()} CodeMaster</p>
    </div>
  );
}

export { AuthStyles };
export default AuthVisualPanel;