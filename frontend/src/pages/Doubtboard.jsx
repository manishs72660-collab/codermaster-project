import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, MessageCircleQuestion, SlidersHorizontal, ChevronRight } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import Navbar from "../component/navbar";
import DoubtCard from "../component/Doubtcard";

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "unanswered", label: "Unanswered" },
  { value: "views", label: "Most viewed" },
];

function DoubtBoard() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/doubt", {
        params: { search: search || undefined, sort },
      });
      setDoubts(data.doubts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchDoubts, 300); // debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  const unansweredCount = doubts.filter((d) => !d.answerCount).length;

  return (
    <>
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

        .card-shimmer::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.04) 50%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .card-shimmer:hover::before { opacity: 1; }

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

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">
        {/* ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-blue-500/[0.05] blur-[130px] rounded-full" />
        </div>

        <Navbar />

        {/* ── HERO HEADER ── */}
        <div className="relative hero-grid border-b border-white/[0.04] overflow-hidden">
          <div className="max-w-3xl mx-auto px-5 py-14 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <MessageCircleQuestion className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.15em]">Community</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.07] rounded-full">
                  <span className="text-[10px] font-semibold text-white/40">{doubts.length} Doubts</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.07] rounded-full">
                    <span className="text-[10px] font-semibold text-white/40">{unansweredCount} unanswered</span>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-800 text-white tracking-tight leading-[1.1] mb-3">
                    Doubt<span className="text-orange-500">Board.</span>
                  </h1>
                  <p className="text-white/40 text-base max-w-md leading-relaxed">
                    Stuck on something? Ask. Know something? Answer.
                  </p>
                </div>

                <Link
                  to="/doubts/ask"
                  className="group flex items-center gap-2 px-5 py-3 bg-orange-500 text-black font-bold text-sm rounded-xl hover:bg-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all duration-300 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Ask a doubt
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-white/[0.04] rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-white/[0.04] rounded-bl-xl pointer-events-none" />
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="max-w-3xl mx-auto px-5 py-10 relative z-10">
          {/* search + sort */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 group-focus-within:text-orange-400 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doubts…"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all placeholder:text-white/20 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white/60 focus:outline-none appearance-none cursor-pointer pr-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-white/25 font-medium">Loading doubts…</p>
            </div>
          ) : doubts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 text-center border border-dashed border-white/[0.08] rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                <MessageCircleQuestion className="w-7 h-7 text-white/15" />
              </div>
              <h3 className="font-display text-lg font-700 text-white/40 mb-1">No doubts here yet</h3>
              <p className="text-sm text-white/20">Be the first to ask something.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {doubts.map((doubt, index) => (
                  <DoubtCard key={doubt._id} doubt={doubt} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DoubtBoard;