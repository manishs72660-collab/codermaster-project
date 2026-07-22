import { motion } from 'motion/react';
import { CheckCircle2, Trophy, Flame, Target } from 'lucide-react';

const cards = [
  {
    key: 'total',
    label: 'total solved',
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
    get: (s) => s.total,
  },
  {
    key: 'rank',
    label: 'global rank',
    icon: Trophy,
    accent: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/10',
    get: (s) => `#${s.rank}`,
  },
  {
    key: 'streak',
    label: 'current streak',
    icon: Flame,
    accent: 'text-orange-400',
    glow: 'group-hover:shadow-orange-500/10',
    get: (s) => `${s.currentStreak}d`,
  },
  {
    key: 'acceptance',
    label: 'acceptance',
    icon: Target,
    accent: 'text-sky-400',
    glow: 'group-hover:shadow-sky-500/10',
    get: (s) => `${s.acceptanceRate}%`,
  },
];

const StatsCards = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
    {cards.map(({ key, label, icon: Icon, accent, glow, get }, i) => (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: i * 0.05 }}
        className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-shadow hover:border-white/[0.1] hover:shadow-lg ${glow}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">{label}</span>
          <Icon className={`h-3.5 w-3.5 ${accent} opacity-70`} />
        </div>
        <p className="font-display mt-2 text-2xl font-800 tracking-tight text-white">{get(stats)}</p>
      </motion.div>
    ))}
  </div>
);

export default StatsCards;