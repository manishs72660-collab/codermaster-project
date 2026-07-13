import { ChevronUp, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "../utils/cn";
import axiosClient from "../utils/axiosClient";

function AnswerCard({ answer, isDoubtAuthor, currentUser, onChanged }) {
  console.log(answer);
  const isAnswerAuthor = currentUser?._id === answer.author?._id;
  const isAdmin = currentUser?.role === "admin";
  const canDelete = isAnswerAuthor || isAdmin;

  const handleUpvote = async () => {
    await axiosClient.patch(`/answer/${answer._id}/upvote`);
    onChanged();
  };

  const handleAccept = async () => {
    await axiosClient.patch(`/answer/${answer._id}/accept`);
    onChanged();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this answer? This can't be undone.");
    if (!confirmed) return;
    await axiosClient.delete(`/answer/${answer._id}`);
    onChanged();
  };

  return (
    <div
      className={cn(
        "relative flex gap-4 p-4 rounded-2xl border overflow-hidden transition-colors",
        answer.isAccepted
          ? "border-emerald-500/25 bg-emerald-500/[0.04]"
          : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]"
      )}
    >
      {answer.isAccepted && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[3px_0_18px_rgba(52,211,153,0.3)]" />
      )}

      {/* upvote column */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={handleUpvote}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 hover:border-orange-500/30 hover:text-orange-400 hover:bg-orange-500/[0.06] transition-all"
          aria-label="Upvote answer"
        >
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>
        <span className="text-xs text-white/30 font-black">
          {answer.upvotes?.length ?? 0}
        </span>
      </div>

      {/* content column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70 font-semibold">
              {"Anonymous"}
            </span>
            {answer.isAccepted && (
              <span className="tag-pill text-emerald-400 border-emerald-500/25 bg-emerald-500/8">
                <CheckCircle2 size={11} strokeWidth={2.5} /> accepted
              </span>
            )}
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
              aria-label="Delete answer"
              className="text-white/20 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-sm text-white/45 leading-relaxed whitespace-pre-wrap">
          {answer.content}
        </p>

        {answer.codeSnippet && (
          <pre className="mt-3 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs font-mono text-white/50 overflow-x-auto">
            <code>{answer.codeSnippet}</code>
          </pre>
        )}

        {isDoubtAuthor && !answer.isAccepted && (
          <button
            onClick={handleAccept}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all"
          >
            Mark as accepted
          </button>
        )}
      </div>
    </div>
  );
}

export default AnswerCard;