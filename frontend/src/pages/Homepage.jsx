import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import {
  ChevronRight,
  Search,
  CheckCircle2,
  Circle,
  Trophy,
  Target,
  Loader2,
  TerminalSquare,
  GraduationCap,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { fetchProblems } from '../problemslice';
import { fetchUserProfile } from '../profileSlice';
import { cn } from '../utils/cn';

const PAGE_LIMIT = 20;

/* ─── tiny helpers ─── */
const DIFF = {
  easy:   { label: 'easy',   dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20' },
  medium: { label: 'medium', dot: 'bg-amber-400',    text: 'text-amber-400',  bg: 'bg-amber-500/8',    border: 'border-amber-500/20' },
  hard:   { label: 'hard',   dot: 'bg-rose-400',     text: 'text-rose-400',   bg: 'bg-rose-500/8',     border: 'border-rose-500/20' },
};
const diffMeta = (d) => DIFF[String(d || '').toLowerCase()] || { label: d || '—', dot: 'bg-white/20', text: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' };

const TAG_OPTIONS = [
  { label: 'all',    value: 'all' },
  { label: 'array',  value: 'array' },
  { label: 'string', value: 'string' },
  { label: 'math',   value: 'math' },
];

const STATUS_OPTIONS = [
  { label: 'all',      value: 'all' },
  { label: 'solved',   value: 'solved' },
  { label: 'unsolved', value: 'unsolved' },
];

const DIFF_OPTIONS = [
  { label: 'all',    value: 'all' },
  { label: 'easy',   value: 'easy' },
  { label: 'medium', value: 'medium' },
  { label: 'hard',   value: 'hard' },
];

/* tags can come back as a string ("array, two-pointers") or an array
   (["array","two-pointers"]) depending on the problem — handle both so
   the filter never silently no-ops. */
const tagMatches = (tags, filterTag) => {
  if (filterTag === 'all') return true;
  if (!tags) return false;
  if (Array.isArray(tags)) {
    return tags.some((t) => String(t).toLowerCase().includes(filterTag));
  }
  return String(tags).toLowerCase().includes(filterTag);
};

/* ══════════════════════════════════════════
   HOMEPAGE — terminal / IDE style
══════════════════════════════════════════ */
function Homepage() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { stats } = useSelector((s) => s.userState);
  const { data: profileData } = useSelector((s) => s.profile);
  const {
    problems,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    totalProblems,
    error,
    initialized,
  } = useSelector((state) => state.problem);

  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchProblems({ page: 1, limit: PAGE_LIMIT }));
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (!isAuthenticated) return;
    axiosClient.get('/code/solveduniqueproblem')
      .then(({ data }) => setSolvedProblems(Array.isArray(data) ? data : []))
      .catch(() => setSolvedProblems([]));
  }, [isAuthenticated]);

  // Pull profile data (includes college info) once, for the logged-in user.
  // Adjust `user._id` below if your auth slice stores the id under a
  // different key (e.g. user.id).
  useEffect(() => {
    if (!isAuthenticated || !user?._id || profileData) return;
    dispatch(fetchUserProfile(user._id));
  }, [dispatch, isAuthenticated, user, profileData]);

  const college = profileData?.college || null;

  const solvedProblemIds = useMemo(
    () => new Set(solvedProblems.map((sp) => sp.problemId?._id || sp.problemId || sp._id)),
    [solvedProblems]
  );

  const filteredProblems = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    return problems.filter((p) => {
      if (!p) return false;
      const diffOk = filters.difficulty === 'all' || p.difficulty?.toLowerCase() === filters.difficulty;
      const tagOk = tagMatches(p.tags, filters.tag);
      const isSolved = solvedProblems.some((sp) => String(sp?.problemId?._id || sp?.problemId || sp?._id) === String(p._id));
      const statOk = filters.status === 'all' || (filters.status === 'solved' && isSolved) || (filters.status === 'unsolved' && !isSolved);
      const srchOk = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return diffOk && tagOk && statOk && srchOk;
    });
  }, [problems, solvedProblems, filters, searchQuery]);

  const solvedCount = solvedProblems.length;
  const totalCount = totalProblems || problems.length;
  const solvedPercent = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  /* ── infinite scroll sentinel ── */
  const observerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const stateRef = useRef({ hasMore, currentPage, loading, loadingMore });

  useEffect(() => {
    stateRef.current = { hasMore, currentPage, loading, loadingMore };
    if (!loading && !loadingMore) isFetchingRef.current = false;
  }, [hasMore, currentPage, loading, loadingMore]);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const { hasMore: currentHasMore, currentPage: page, loading: isLoading, loadingMore: isLoadingMore } = stateRef.current;
        if (entries[0].isIntersecting && currentHasMore && !isLoading && !isLoadingMore && !isFetchingRef.current) {
          isFetchingRef.current = true;
          dispatch(fetchProblems({ page: page + 1, limit: PAGE_LIMIT })).finally(() => {
            isFetchingRef.current = false;
          });
        }
      },
      { rootMargin: '300px' }
    );
    if (node) observerRef.current.observe(node);
  }, [dispatch]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const barBlocks = 24;
  const filledBlocks = Math.round((solvedPercent / 100) * barBlocks);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .font-mono-display { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }

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
        @keyframes glow-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.55; } }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

        @keyframes caret-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .caret { animation: caret-blink 1s step-end infinite; }

        @keyframes row-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .row-in { animation: row-in 0.35s ease forwards; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        @keyframes badge-in { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        .badge-in { animation: badge-in 0.4s ease forwards; }

        @keyframes shimmer-sweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
        .shimmer-sweep { animation: shimmer-sweep 3.2s ease-in-out infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">

        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-blue-500/[0.05] blur-[130px] rounded-full" />
        </div>

        <Navbar></Navbar>

        {/* ── college spotlight billboard (only if user belongs to a college) ── */}
        <CollegeSpotlight college={college} />

        {/* ── terminal chrome hero ── */}
        <div className="relative hero-grid border-b border-white/[0.04] overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 py-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]"
            >
              {/* window bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="ml-3 flex items-center gap-1.5 text-[11px] font-mono-display text-white/30">
                  <TerminalSquare className="w-3 h-3" />
                  ~/arena/problems
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-[9px] font-mono-display font-bold text-orange-400 uppercase tracking-[0.15em]">live</span>
                  </span>
                </span>
              </div>

              {/* faux code */}
              <div className="px-6 py-8 font-mono-display text-sm leading-relaxed">
                <p className="text-white/25"><span className="text-orange-500/70">01</span>&nbsp;&nbsp;<span className="text-blue-400/70">class</span> <span className="text-emerald-400/80">Arena</span> <span className="text-blue-400/70">extends</span> <span className="text-white/60">You</span> {'{'}</p>
                <p className="text-white/40 pl-6"><span className="text-orange-500/40">02</span>&nbsp;&nbsp;<span className="text-white/50">// {totalCount} challenges waiting for a solve</span></p>
                <p className="pl-6"><span className="text-orange-500/40">03</span>&nbsp;&nbsp;<span className="text-white/80 text-2xl md:text-3xl font-bold">sharpen()<span className="text-orange-500 caret">|</span></span></p>
                <p className="text-white/25"><span className="text-orange-500/70">04</span>&nbsp;&nbsp;{'}'}</p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 py-10 relative z-10">

          {/* ── stats: rank + solved only ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <StatReadout
              icon={<Trophy className="w-4 h-4" />}
              label="global_rank"
              value={`#${stats?.rank ?? '—'}`}
              delay={0}
            />
            <StatReadout
              icon={<Target className="w-4 h-4" />}
              label="problems_solved"
              value={`${solvedCount}/${totalCount}`}
              barBlocks={barBlocks}
              filledBlocks={filledBlocks}
              percent={solvedPercent}
              delay={0.06}
            />
          </div>

          {/* ── command bar: search + filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.015] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <span className="font-mono-display text-orange-500/70 text-sm select-none">$</span>
              <span className="font-mono-display text-white/30 text-sm select-none">find --title</span>
              <input
                type="text"
                placeholder="type to search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent font-mono-display text-sm text-white/80 focus:outline-none placeholder:text-white/15"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white/60 transition-colors text-xs font-mono-display">
                  clear
                </button>
              )}
              <span className="text-[10px] font-mono-display text-white/25 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                {filteredProblems.length} results
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
              <FlagGroup label="--status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
              <FlagGroup label="--difficulty" value={filters.difficulty} options={DIFF_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, difficulty: v }))} />
              <FlagGroup label="--tag" value={filters.tag} options={TAG_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, tag: v }))} />
            </div>
          </motion.div>

          {/* ── column headers ── */}
          <div className="hidden md:grid grid-cols-[2rem_1fr_6rem_5rem_6rem_2rem] gap-4 px-4 mb-2">
            <span className="text-[10px] font-mono-display text-white/20">#</span>
            <span className="text-[10px] font-mono-display text-white/20">title</span>
            <span className="text-[10px] font-mono-display text-white/20">tag</span>
            <span className="text-[10px] font-mono-display text-white/20">level</span>
            <span className="text-[10px] font-mono-display text-white/20">status</span>
            <span></span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-6 h-6 text-orange-500 spin-slow mb-3" />
              <p className="text-sm font-mono-display text-white/25">loading_problems()…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <p className="text-sm font-mono-display text-rose-400/70">// error: {error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.01] overflow-hidden divide-y divide-white/[0.05]">
                <AnimatePresence mode="popLayout">
                  {filteredProblems.length > 0 ? (
                    filteredProblems.map((problem, index) => (
                      <ProblemRow
                        key={problem._id}
                        problem={problem}
                        isSolved={solvedProblemIds.has(problem._id)}
                        index={index}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-24 text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-white/15" />
                      </div>
                      <h3 className="font-mono-display text-sm font-bold text-white/30 mb-1">no_results_found()</h3>
                      <p className="text-xs font-mono-display text-white/20">// adjust filters or search query</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {hasMore && <div ref={sentinelRef} className="h-4" />}

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-orange-500 spin-slow" />
                </div>
              )}

              {!hasMore && problems.length > 0 && (
                <p className="text-center text-white/20 text-xs font-mono-display py-8">// end_of_file — you've reached the bottom</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   COLLEGE SPOTLIGHT — bold billboard banner,
   rendered only when the user belongs to a college.
   Uses the same dark-grid / noise language as the
   hero, but scaled up and lit like an ad placement.
══════════════════════════════════════════ */
function CollegeSpotlight({ college }) {
  if (!college?.name) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative hero-grid border-b border-white/[0.06] overflow-hidden"
    >
      {/* ambient glow, centered behind the name */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="glow-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[280px] bg-blue-500/[0.12] blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[160px] bg-orange-500/[0.05] blur-[100px] rounded-full" />
      </div>

      {/* corner frame ticks, like a billboard mount */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-blue-400/25" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-blue-400/25" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-blue-400/25" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-blue-400/25" />

      <div className="max-w-6xl mx-auto px-5 py-9 md:py-11 relative z-10 flex flex-col items-center text-center gap-3">
        <span className="badge-in inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/25 bg-blue-500/[0.08]">
          <GraduationCap className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
          <span className="text-[10px] font-mono-display font-bold text-blue-400 uppercase tracking-[0.25em]">
            representing
          </span>
        </span>

        <div className="relative">
          <h2 className="font-mono-display font-extrabold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 text-3xl sm:text-4xl md:text-5xl leading-[1.1] px-2 drop-shadow-[0_0_30px_rgba(96,165,250,0.15)]">
            {college.name}
          </h2>
          {/* shimmer sweep across the name for that "advertisement" polish */}
          <span
            aria-hidden
            className="shimmer-sweep pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
          />
        </div>

        <span className="w-20 h-[2px] bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />

        <p className="text-[11px] font-mono-display text-white/25 tracking-wide">
          // every solve here counts toward the campus leaderboard
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   STAT READOUT (terminal-style, no rings)
══════════════════════════════════════════ */
function StatReadout({ icon, label, value, delay, barBlocks, filledBlocks, percent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.015] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-3 text-orange-400/70">
        {icon}
        <span className="text-[10px] font-mono-display uppercase tracking-[0.15em] text-white/30">{label}</span>
      </div>
      <div className="font-mono-display text-2xl font-bold text-white/90 mb-1">{value}</div>
      {barBlocks != null && (
        <div className="flex items-center gap-2">
          <span className="font-mono-display text-[11px] text-white/20 select-none">
            [{Array.from({ length: barBlocks }).map((_, i) => (i < filledBlocks ? '█' : '░')).join('')}]
          </span>
          <span className="font-mono-display text-[11px] text-orange-400/70">{percent}%</span>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   FLAG GROUP (filter pills styled as CLI flags)
══════════════════════════════════════════ */
function FlagGroup({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-mono-display text-white/20">{label}</span>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-mono-display font-semibold transition-all border',
                active
                  ? 'bg-orange-500/12 border-orange-500/30 text-orange-400'
                  : 'bg-white/[0.02] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/15'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROBLEM ROW (code-editor line style)
══════════════════════════════════════════ */
function ProblemRow({ problem, isSolved, index }) {
  const meta = diffMeta(problem.difficulty);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: (index % PAGE_LIMIT) * 0.015, duration: 0.25 }}
      className="row-in"
    >
      <NavLink
        to={`/problem/${problem._id}`}
        className="group relative grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_6rem_5rem_6rem_2rem] items-center gap-4 px-4 py-3.5 hover:bg-white/[0.025] transition-colors duration-150"
      >
        {isSolved && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-orange-500/70" />
        )}

        <span className="font-mono-display text-[11px] text-white/20 group-hover:text-orange-400/50 transition-colors">
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors truncate">
          {problem.title}
        </span>

        <span className="hidden md:block font-mono-display text-[11px] text-white/25 truncate">
          {problem.tags ? `// ${Array.isArray(problem.tags) ? problem.tags.join(', ') : problem.tags}` : ''}
        </span>

        <span className={cn('hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono-display font-semibold', meta.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>

        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono-display font-medium">
          {isSolved ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-orange-400" strokeWidth={2.5} />
              <span className="text-orange-400/80">solved</span>
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 text-white/20" strokeWidth={2.5} />
              <span className="text-white/25">open</span>
            </>
          )}
        </span>

        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all justify-self-end" />
      </NavLink>
    </motion.div>
  );
}

export default Homepage;