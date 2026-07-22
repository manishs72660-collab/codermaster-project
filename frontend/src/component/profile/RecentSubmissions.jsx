import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, ListTree, GitBranch } from 'lucide-react';

const statusMeta = {
  accepted: { color: 'text-emerald-400', icon: CheckCircle2, label: 'accepted' },
  wrong: { color: 'text-rose-400', icon: XCircle, label: 'wrong answer' },
  error: { color: 'text-amber-400', icon: AlertTriangle, label: 'runtime error' },
  pending: { color: 'text-white/35', icon: Clock, label: 'pending' },
};

const RecentSubmissions = ({ submissions }) => (
  <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <div className="ml-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/50">
        <ListTree className="h-3 w-3 text-orange-400" />
        submissions.log
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-white/15">
        <GitBranch className="h-3 w-3" />
        <span className="font-mono text-[10px]">main</span>
      </div>
    </div>

    {/* column headers, terminal-style */}
    <div className="hidden grid-cols-[1fr_130px_90px_100px] gap-3 border-b border-white/[0.05] px-5 py-2 font-mono text-[10px] uppercase tracking-wide text-white/20 sm:grid">
      <span>problem</span>
      <span>status</span>
      <span>lang</span>
      <span className="text-right">date</span>
    </div>

    <div className="divide-y divide-white/[0.05]">
      {submissions?.map((s, i) => {
        const meta = statusMeta[s.status] || statusMeta.pending;
        const StatusIcon = meta.icon;
        return (
          <motion.div
            key={s._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className="grid grid-cols-2 gap-y-1 px-5 py-3 font-mono text-xs transition-colors hover:bg-white/[0.025] sm:grid-cols-[1fr_130px_90px_100px] sm:items-center sm:gap-3"
          >
            <span className="col-span-2 truncate text-white/75 sm:col-span-1">{s.problemTitle}</span>
            <span className={`flex items-center gap-1.5 ${meta.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="text-white/30">{s.language}</span>
            <span className="text-white/25 sm:text-right">{new Date(s.createdAt).toLocaleDateString()}</span>
          </motion.div>
        );
      })}

      {!submissions?.length && (
        <p className="px-5 py-6 text-center font-mono text-xs text-white/25">// no submissions yet</p>
      )}
    </div>
  </div>
);

export default RecentSubmissions;