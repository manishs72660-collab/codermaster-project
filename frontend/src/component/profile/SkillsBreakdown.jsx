import { motion } from 'motion/react';
import { Braces, GitBranch } from 'lucide-react';

const SkillsBreakdown = ({ skills }) => {
  if (!skills?.length) return null;
  const max = Math.max(...skills.map((s) => s.count));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="ml-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/50">
          <Braces className="h-3 w-3 text-orange-400" />
          skills.json
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-white/15">
          <GitBranch className="h-3 w-3" />
          <span className="font-mono text-[10px]">main</span>
        </div>
      </div>

      <div className="space-y-3.5 p-5">
        {skills.slice(0, 8).map((s, i) => (
          <motion.div
            key={s.tag}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
              <span className="text-white/60">
                <span className="text-sky-400/60">"</span>
                {s.tag}
                <span className="text-sky-400/60">"</span>
              </span>
              <span className="text-orange-400/80">{s.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(s.count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04 + 0.1, ease: 'easeOut' }}
                className="h-1.5 rounded-full bg-gradient-to-r from-orange-500/70 to-orange-400"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SkillsBreakdown;