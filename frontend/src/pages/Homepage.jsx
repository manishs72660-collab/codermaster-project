import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import {
  Search,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { fetchProblems } from '../problemslice';
import { fetchUserProfile } from '../profileSlice';
import { cn } from '../utils/cn';

const PAGE_LIMIT = 20;

/* ─── tiny helpers ─── */
const DIFF = {
  easy:   { label: 'Easy',   text: 'text-emerald-400' },
  medium: { label: 'Medium', text: 'text-amber-400' },
  hard:   { label: 'Hard',   text: 'text-rose-400' },
};
const diffMeta = (d) => DIFF[String(d || '').toLowerCase()] || { label: d || '—', text: 'text-white/35' };

const TAG_OPTIONS = [
  { label: 'All',    value: 'all' },
  { label: 'Array',  value: 'array' },
  { label: 'String', value: 'string' },
  { label: 'Math',   value: 'math' },
];

const STATUS_OPTIONS = [
  { label: 'All',      value: 'all' },
  { label: 'Solved',   value: 'solved' },
  { label: 'Unsolved', value: 'unsolved' },
];

const DIFF_OPTIONS = [
  { label: 'All',    value: 'all' },
  { label: 'Easy',   value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard',   value: 'hard' },
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
   HOMEPAGE — clean dark dashboard
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

        {/* ── college banner ── */}
        <CollegeBanner college={college} />

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display font-semibold text-[2.5rem] sm:text-5xl leading-[1.08] text-white mb-3">
                Practice. Track. Improve.
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                Work through a curated set of coding problems and watch your rank climb.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* ── stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard  label="Global rank" value={`#${stats?.rank ?? '—'}`} delay={0} />
            <StatCard  label="Problems solved" value={`${solvedCount} / ${totalCount}`} percent={solvedPercent} delay={0.05} />
          </div>

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
                placeholder="Search problems…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white/85 focus:outline-none placeholder:text-white/25"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/25 hover:text-white/60 transition-colors text-xs">
                  Clear
                </button>
              )}
              <span className="text-[11px] font-data text-white/30 px-2 py-0.5 rounded-full bg-white/[0.04]">
                {filteredProblems.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
              <FilterGroup label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
              <FilterGroup label="Difficulty" value={filters.difficulty} options={DIFF_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, difficulty: v }))} />
              <FilterGroup label="Tag" value={filters.tag} options={TAG_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, tag: v }))} />
            </div>
          </motion.div>

          {/* ── column headers ── */}
          <div className="hidden md:grid grid-cols-[2.5rem_1fr_7rem_5.5rem_6rem] gap-4 px-4 mb-1.5">
            <span className="text-[11px] text-white/25">#</span>
            <span className="text-[11px] text-white/25">Title</span>
            <span className="text-[11px] text-white/25">Tag</span>
            <span className="text-[11px] text-white/25">Level</span>
            <span className="text-[11px] text-white/25">Status</span>
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
            <>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.05]">
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
                      <h3 className="font-display text-lg font-semibold text-white/65 mb-1">No problems found</h3>
                      <p className="text-xs text-white/30">Try adjusting your filters or search term.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {hasMore && <div ref={sentinelRef} className="h-4" />}

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-4 h-4 text-orange-500 spin-slow" />
                </div>
              )}

              {!hasMore && problems.length > 0 && (
                <p className="text-center text-white/25 text-xs py-8">You've reached the end of the list.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   COLLEGE BANNER — centered, bold focal strip
══════════════════════════════════════════ */
function CollegeBanner({ college }) {
  if (!college?.name) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="border-b border-white/[0.06] bg-white/[0.02]"
    >
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col items-center text-center gap-2">
        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
          <GraduationCap className="w-4.5 h-4.5 text-orange-400" strokeWidth={2} />
        </div>
        <span className="text-[11px] font-medium text-white/35 uppercase tracking-[0.15em]">
          Representing
        </span>
        <h2 className="font-display font-semibold text-white text-2xl sm:text-3xl leading-tight break-words max-w-2xl">
          {college.name}
        </h2>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
function StatCard({ label, value, delay, percent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4"
    >
      <div className="mb-2.5">
        <span className="text-[12px] font-medium text-white/40">{label}</span>
      </div>
      <div className="font-display text-2xl font-semibold text-white mb-2">{value}</div>
      {percent != null && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[11px] font-data text-white/35">{percent}%</span>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   FILTER GROUP
══════════════════════════════════════════ */
function FilterGroup({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12px] text-white/30">{label}</span>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
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
  );
}

/* ══════════════════════════════════════════
   PROBLEM ROW — simple, no icons, roomier spacing
══════════════════════════════════════════ */
function ProblemRow({ problem, isSolved, index }) {
  const meta = diffMeta(problem.difficulty);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: (index % PAGE_LIMIT) * 0.01, duration: 0.18 }}
      className="row-in"
    >
      <NavLink
        to={`/problem/${problem._id}`}
        className="group grid grid-cols-[2.5rem_1fr] md:grid-cols-[2.5rem_1fr_7rem_5.5rem_6rem] items-center gap-4 px-4 py-5 hover:bg-white/[0.03] transition-colors duration-150"
      >
        <span className="text-[13px] text-white/25">
          {index + 1}
        </span>

        <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
          {problem.title}
        </span>

        <span className="hidden md:block text-[12px] text-white/30 truncate">
          {problem.tags ? (Array.isArray(problem.tags) ? problem.tags.join(', ') : problem.tags) : ''}
        </span>

        <span className={cn('hidden md:inline-flex text-[13px] font-medium', meta.text)}>
          {meta.label}
        </span>

        <span className={cn(
          'hidden md:inline-flex text-[12px] font-medium',
          isSolved ? 'text-orange-400/85' : 'text-white/35'
        )}>
          {isSolved ? 'Solved' : 'Unsolved'}
        </span>
      </NavLink>
    </motion.div>
  );
}

export default Homepage;