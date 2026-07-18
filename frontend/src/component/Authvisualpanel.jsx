import { Code2, Trophy, Users, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

/* Shared styles pulled from Homepage so both auth pages and the
   dashboard feel like one product. Rendered once here (mounted on both
   Login and Signup) - a <style> tag applies globally regardless of
   where in the tree it sits. */
function AuthStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
      .font-display { font-family: 'Syne', sans-serif; }
      .font-body    { font-family: 'DM Sans', sans-serif; }

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

      .tag-pill {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 6px;
        font-size: 9px; font-weight: 800;
        letter-spacing: 0.08em; text-transform: uppercase;
        border: 1px solid;
      }

      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
    `}</style>
  );
}

function AuthVisualPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] px-14 py-12 lg:flex">
      <AuthStyles />

      {/* logo */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Code2 className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-lg font-800 tracking-tight text-white">
            CodeMaster<span className="text-orange-500">Dark</span>
          </span>
        </div>

        <div className="mt-8 flex items-center gap-1.5 w-fit px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.15em]">Live Arena</span>
        </div>

        <h1 className="font-display mt-5 text-4xl font-800 leading-[1.1] tracking-tight text-white">
          Join the arena.<br />
          Sharpen your <span className="text-orange-500">edge.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
          Hand-picked problems, live duels, and contests that actually feel competitive.
        </p>
      </motion.div>

      {/* aggregate stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="relative z-10 grid grid-cols-3 gap-3"
      >
        {[
          { icon: <Code2 className="h-4 w-4" />, value: '1,400+', label: 'Problems' },
          { icon: <Users className="h-4 w-4" />, value: '12k+', label: 'Coders' },
          { icon: <Trophy className="h-4 w-4" />, value: 'Weekly', label: 'Contests' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="text-orange-400/80">{s.icon}</div>
            <p className="font-display mt-2 text-base font-800 text-white">{s.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/25">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* difficulty pills - same visual language as the problem list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="relative z-10 flex items-center gap-2"
      >
        <span className="tag-pill text-emerald-400 border-emerald-500/25 bg-emerald-500/8">
          <Sparkles className="h-2.5 w-2.5" /> 620 Easy
        </span>
        <span className="tag-pill text-amber-400 border-amber-500/25 bg-amber-500/8">540 Medium</span>
        <span className="tag-pill text-rose-400 border-rose-500/25 bg-rose-500/8">240 Hard</span>
      </motion.div>

      <p className="relative z-10 text-[11px] text-white/20">© {new Date().getFullYear()} CodeMasterDark</p>
    </div>
  );
}

export { AuthStyles };
export default AuthVisualPanel;