import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import Navbar from "../component/navbar";

function AskDoubt() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { data } = await axiosClient.post("/doubt/create", {
        title,
        description,
        codeSnippet,
        tags,
      });

      navigate(`/doubts/${data._id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all";

  return (
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
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-blue-500/[0.05] blur-[130px] rounded-full" />
        </div>

        <Navbar />

        <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
          <button
            onClick={() => navigate("/doubts")}
            className="flex items-center gap-1.5 text-xs font-bold text-white/30 hover:text-orange-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Board
          </button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-3xl font-800 text-white tracking-tight mb-2">
              Ask a <span className="text-orange-500">doubt.</span>
            </h1>
            <p className="text-sm text-white/35 mb-8">
              Be specific — a clear title gets faster answers.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6"
          >
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Why does my sliding window solution TLE on large inputs?"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="What have you tried? Where exactly are you stuck?"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2">
                Code (optional)
              </label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={6}
                placeholder="// paste the relevant code"
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2">
                Tags
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dp, sliding-window, arrays (comma separated)"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="self-start text-sm font-bold px-6 py-3 rounded-xl bg-orange-500 text-black hover:bg-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {submitting ? "Posting…" : "Post doubt"}
            </button>
          </motion.form>
        </div>
      </div>
    </>
  );
}

export default AskDoubt;