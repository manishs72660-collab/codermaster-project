import { motion } from 'motion/react';
import { Lock, Layers, GitBranch, CheckCircle2, Hourglass } from 'lucide-react';
import { getBatchesForUser } from '../Batches';
import { cn } from '../../utils/cn';

const BatchesShowcase = ({ heatmap, stats }) => {
  const batches = getBatchesForUser({ heatmap, stats });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="ml-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/50">
          <Layers className="h-3 w-3 text-orange-400" />
          batches.json
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-white/15">
          <GitBranch className="h-3 w-3" />
          <span className="font-mono text-[10px]">main</span>
        </div>
      </div>

      {/* pure image tiles — name/status are in the native title tooltip, not rendered as text */}
      <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        {batches.map((batch, i) => {
          const tooltip = batch.isPlaceholder
            ? `${batch.name} — coming soon`
            : `${batch.name} — ${batch.isUnlocked ? 'unlocked' : batch.requirement.label}`;

          return (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              title={tooltip}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-xl border transition-colors',
                batch.isUnlocked
                  ? 'border-white/[0.08] hover:border-orange-500/40'
                  : batch.isNext
                    ? 'border-orange-500/30'
                    : 'border-white/[0.05]'
              )}
            >
              {batch.image ? (
                <img
                  src={batch.image}
                  alt={batch.name}
                  className={cn(
                    'h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110',
                    !batch.isUnlocked && 'opacity-30 grayscale blur-[3px]'
                  )}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
                  <Hourglass className="h-5 w-5 text-white/15" />
                </div>
              )}

              {batch.isUnlocked ? (
                <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/30 bg-[#0a0a0a] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              ) : (
                !batch.isPlaceholder && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Lock className="h-5 w-5 text-white/50" />
                  </span>
                )
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BatchesShowcase;