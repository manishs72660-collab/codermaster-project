import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import { Search, Loader2, Layers } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── tiny helpers ─── */
const DIFF = {
  easy: { label: 'Easy', text: 'text-emerald-400' },
  medium: { label: 'Medium', text: 'text-amber-400' },
  hard: { label: 'Hard', text: 'text-rose-400' },
};
const diffMeta = (d) => DIFF[String(d || '').toLowerCase()] || { label: d || '—', text: 'text-white/35' };

const DIFF_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

/* ══════════════════════════════════════════
   DESIGN PROBLEMS — list page
   Mirrors Homepage's dashboard/table pattern.
══════════════════════════════════════════ */
function DesignProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axiosClient
      .get('/designprolem')
      .then(({ data }) => {
        if (cancelled) return;
        setProblems(Array.isArray(data) ? data : data.problems || []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Could not load problems.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProblems = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    return problems.filter((p) => {
      if (!p) return false;
      const diffOk = difficulty === 'all' || p.difficulty?.toLowerCase() === difficulty;
      const srchOk = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return diffOk && srchOk;
    });
  }, [problems, difficulty, searchQuery]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Work Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }

        .subtle-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes row-in { from { opacity: 0; } to { opacity: 1; } }
        .row-in { animation: row-in 0.2s ease forwards; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar></Navbar>

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display font-semibold text-[2.5rem] sm:text-5xl leading-[1.08] text-white mb-3">
                Draft a design. See where it breaks.
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                Each problem gives you requirements and a blank board. Place components, wire them
                together, and get evaluated on the trade-offs you made.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* ── search + filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02]"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search design problems…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white/85 focus:outline-none placeholder:text-white/25"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white/25 hover:text-white/60 transition-colors text-xs"
                >
                  Clear
                </button>
              )}
              <span className="text-[11px] font-data text-white/30 px-2 py-0.5 rounded-full bg-white/[0.04]">
                {filteredProblems.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-white/30">Difficulty</span>
                <div className="flex items-center gap-1">
                  {DIFF_OPTIONS.map((opt) => {
                    const active = difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDifficulty(opt.value)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors',
                          active
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── column headers ── */}
          <div className="hidden md:grid grid-cols-[2.5rem_1fr_7rem_1fr] gap-4 px-4 mb-1.5">
            <span className="text-[11px] text-white/25">#</span>
            <span className="text-[11px] text-white/25">Title</span>
            <span className="text-[11px] text-white/25">Level</span>
            <span className="text-[11px] text-white/25">Concepts</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-5 h-5 text-orange-500 spin-slow mb-3" />
              <p className="text-sm text-white/35">Loading problems…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <p className="text-sm text-rose-400/80">Couldn't load problems — {error}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.05]">
              <AnimatePresence mode="popLayout">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((problem, index) => (
                    <ProblemRow key={problem._id || problem.slug} problem={problem} index={index} />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                  >
                    <h3 className="font-display text-lg font-semibold text-white/65 mb-1">
                      No problems found
                    </h3>
                    <p className="text-xs text-white/30">Try adjusting your filters or search term.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   PROBLEM ROW
══════════════════════════════════════════ */
function ProblemRow({ problem, index }) {
  const meta = diffMeta(problem.difficulty);
  const concepts = problem.concepts?.length ? problem.concepts.slice(0, 3).join(', ') : '—';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: (index % 20) * 0.01, duration: 0.18 }}
      className="row-in"
    >
      <NavLink
        to={`/design-problems/${problem.slug}`}
        className="group grid grid-cols-[2.5rem_1fr] md:grid-cols-[2.5rem_1fr_7rem_1fr] items-center gap-4 px-4 py-5 hover:bg-white/[0.03] transition-colors duration-150"
      >
        <span className="text-[13px] text-white/25">{index + 1}</span>

        <div className="min-w-0">
          <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate block">
            {problem.title}
          </span>
          <span className="md:hidden text-[12px] text-white/30 flex items-center gap-2 mt-1">
            <Layers className="w-3 h-3" />
            {concepts}
          </span>
        </div>

        <span className={cn('hidden md:inline-flex text-[13px] font-medium', meta.text)}>
          {meta.label}
        </span>

        <span className="hidden md:block text-[12px] text-white/30 truncate">{concepts}</span>
      </NavLink>
    </motion.div>
  );
}

export default DesignProblemsPage;