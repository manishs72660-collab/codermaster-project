import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Eye, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import Navbar from "../component/navbar";
import TagPill from "../component/Tagpill";
import AnswerCard from "../component/Answercard";
import AnswerForm from "../component/Answerform";
import { cn } from "../utils/cn";

function DoubtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth?.user);

  const [doubt, setDoubt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoubt = useCallback(async () => {
    const { data } = await axiosClient.get(`/doubt/${id}`);
    setDoubt(data.doubt);
    setAnswers(data.answers);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDoubt();
  }, [fetchDoubt]);

  const shell = (children) => (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .noise::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          opacity: 0.55;
        }
        @keyframes glow-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.55; } }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }
        .tag-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 6px;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: 1px solid;
        }
      `}</style>
      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-blue-500/[0.05] blur-[130px] rounded-full" />
        </div>
        <Navbar />
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );

  if (loading) {
    return shell(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/25 font-medium">Loading doubt…</p>
      </div>
    );
  }

  if (!doubt) {
    return shell(
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-lg font-700 text-white/40">Doubt not found</p>
      </div>
    );
  }

  const isDoubtAuthor = currentUser?._id === doubt.author?._id;
  const isAdmin = currentUser?.role === "admin";
  const canDelete = isDoubtAuthor || isAdmin;
  const isResolved = doubt.status === "resolved";

  const handleDeleteDoubt = async () => {
    const confirmed = window.confirm(
      "Delete this doubt? This also deletes all its answers. This can't be undone."
    );
    if (!confirmed) return;

    await axiosClient.delete(`/doubt/${doubt._id}`);
    navigate("/doubts");
  };

  return shell(
    <div className="max-w-3xl mx-auto px-5 py-10">
      <button
        onClick={() => navigate("/doubts")}
        className="flex items-center gap-1.5 text-xs font-bold text-white/30 hover:text-orange-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Board
      </button>

      {/* doubt header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "tag-pill",
                isResolved
                  ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8"
                  : "text-amber-400 border-amber-500/25 bg-amber-500/8"
              )}
            >
              {isResolved && <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={3} />}
              {doubt.status}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/25 font-medium">
              <Eye size={13} /> {doubt.views}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={handleDeleteDoubt}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all"
            >
              <Trash2 size={13} />
              {isAdmin && !isDoubtAuthor ? "delete (admin)" : "delete"}
            </button>
          )}
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-800 text-white tracking-tight leading-snug mb-2">
          {doubt.title}
        </h1>
        <p className="text-sm text-white/30 font-medium">
          Asked by {doubt.author?.name || doubt.author?.username || "Anonymous"}
        </p>
      </motion.div>

      {/* description */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8"
      >
        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
          {doubt.description}
        </p>
        {doubt.codeSnippet && (
          <pre className="mt-4 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs font-mono text-white/50 overflow-x-auto">
            <code>{doubt.codeSnippet}</code>
          </pre>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {doubt.tags?.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      </motion.div>

      {/* answers */}
      <h2 className="font-display text-sm font-800 text-white/40 uppercase tracking-[0.15em] mb-4">
        {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
      </h2>

      <div className="flex flex-col gap-3 mb-8">
        {answers.length === 0 ? (
          <p className="text-sm text-white/25 py-10 text-center border border-dashed border-white/[0.08] rounded-2xl">
            No answers yet — be the first to help.
          </p>
        ) : (
          answers.map((answer) => (
            <AnswerCard
              key={answer._id}
              answer={answer}
              isDoubtAuthor={isDoubtAuthor}
              currentUser={currentUser}
              onChanged={fetchDoubt}
            />
          ))
        )}
      </div>

      <AnswerForm doubtId={doubt._id} onPosted={fetchDoubt} />
    </div>
  );
}

export default DoubtDetail;