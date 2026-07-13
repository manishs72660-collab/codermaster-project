import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { cn } from "../utils/cn";
import TagPill from "./Tagpill";

function DoubtCard({ doubt, index = 0 }) {
  const isResolved = doubt.status === "resolved";
  const answerCount = doubt.answerCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      layout
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={`/doubts/${doubt._id}`}
        className="card-shimmer group relative flex items-start gap-4 px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl hover:bg-white/[0.035] hover:border-white/[0.12] transition-all duration-250 overflow-hidden"
      >
        {/* resolved accent line */}
        {isResolved && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[3px_0_18px_rgba(52,211,153,0.3)]" />
        )}

        {/* hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/[0.025] to-transparent pointer-events-none" />

        {/* left: content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-white/80 group-hover:text-white transition-colors leading-snug mb-1.5">
            {doubt.title}
          </h3>

          <p className="text-[12px] text-white/30 leading-relaxed line-clamp-2 mb-3">
            {doubt.description}
          </p>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {doubt.tags?.slice(0, 3).map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>

            <span
              className={cn(
                "tag-pill",
                isResolved
                  ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8"
                  : "text-amber-400 border-amber-500/25 bg-amber-500/8"
              )}
            >
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={3} /> resolved
                </>
              ) : (
                "○ open"
              )}
            </span>
          </div>
        </div>

        {/* right: answer count */}
        <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-shrink-0 group-hover:border-orange-500/20 transition-colors">
          <MessageSquare className="w-3.5 h-3.5 text-white/25 group-hover:text-orange-400/60 transition-colors mb-1" />
          <span className="text-xs font-black text-white/50 group-hover:text-orange-400 transition-colors">
            {answerCount}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default DoubtCard;