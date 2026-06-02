import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  LogOut,
  User as UserIcon,
  Code2,
  Trophy,
  LayoutGrid,
  ListFilter,
  Circle,
  Zap,
  Target,
  TrendingUp,
  Star,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { fetchUserState } from '../userslice';
import { cn } from '../utils/cn';

/* ─── tiny helpers ─── */
const getDifficultyStyle = (difficulty) => {
  const d = String(difficulty || '').toLowerCase();
  if (d === 'easy')   return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/8';
  if (d === 'medium') return 'text-amber-400   border-amber-500/25   bg-amber-500/8';
  if (d === 'hard')   return 'text-rose-400    border-rose-500/25    bg-rose-500/8';
  return 'text-white/40 border-white/10 bg-white/5';
};

/* ══════════════════════════════════════════
   HOMEPAGE
══════════════════════════════════════════ */
function Homepage() {
  const dispatch  = useDispatch();
  const { user }  = useSelector((s) => s.auth);
  const { stats } = useSelector((s) => s.userState);

  //const [problems, setProblems]             = useState([]);
  const { problems, loading, error } = useSelector(
  (state) => state.problem
);
  console.log(problems);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [filters, setFilters]               = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const [streak]                            = useState(0);
  const [scrolled, setScrolled]             = useState(false);

  /* scroll shadow for nav */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // useEffect(() => {
  //   axiosClient.get('/problem/').then(({ data }) => setProblems(Array.isArray(data) ? data : [])).catch(() => setProblems([]));
  // }, [user]);

  useEffect(() => {
    axiosClient.get('/code/solveduniqueproblem').then(({ data }) => setSolvedProblems(Array.isArray(data) ? data : [])).catch(() => setSolvedProblems([]));
  }, []);

  const handleLogout = () => { dispatch(logoutUser()); setSolvedProblems([]); };

  const solvedProblemIds = useMemo(
    () => new Set(solvedProblems.map((sp) => sp.problemId?._id || sp.problemId || sp._id)),
    [solvedProblems]
  );

  const filteredProblems = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    return problems.filter((p) => {
      if (!p) return false;
      const diffOk   = filters.difficulty === 'all' || p.difficulty?.toLowerCase() === filters.difficulty;
      const tagOk    = filters.tag === 'all' || p.tags?.toLowerCase().includes(filters.tag);
      const isSolved = solvedProblems.some((sp) => String(sp?.problemId?._id || sp?.problemId || sp?._id) === String(p._id));
      const statOk   = filters.status === 'all' || (filters.status === 'solved' && isSolved) || (filters.status === 'unsolved' && !isSolved);
      const srchOk   = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return diffOk && tagOk && statOk && srchOk;
    });
  }, [problems, solvedProblems, filters, searchQuery]);

  const solvedCount   = solvedProblems.length;
  const totalCount    = problems.length;
  const solvedPercent = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <>
      {/* ── Google Font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }

        /* hero grid bg */
        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* noise overlay */
        .noise::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          opacity: 0.55;
        }

        /* glow pulse */
        @keyframes glow-pulse {
          0%,100% { opacity: 0.35; }
          50%      { opacity: 0.55; }
        }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

        /* stat ring animation */
        @keyframes ring-fill {
          from { stroke-dashoffset: 220; }
          to   { stroke-dashoffset: var(--target); }
        }
        .ring-animate { animation: ring-fill 1.4s cubic-bezier(.4,0,.2,1) forwards; }

        /* progress bar */
        @keyframes bar-grow {
          from { width: 0%; }
        }
        .bar-grow { animation: bar-grow 1.2s cubic-bezier(.4,0,.2,1) forwards; }

        /* shimmer on card hover */
        .card-shimmer::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.04) 50%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .card-shimmer:hover::before { opacity: 1; }

        /* tag pill */
        .tag-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 6px;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: 1px solid;
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">

        {/* ── ambient blobs ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%]  w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-blue-500/[0.05]   blur-[130px] rounded-full" />
          <div className="absolute top-[35%] right-[20%]   w-[280px] h-[280px] bg-emerald-500/[0.03] blur-[100px] rounded-full" />
        </div>

        {/* ════════════════════════════════
            NAV
        ════════════════════════════════ */}
        <nav className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "border-b border-transparent bg-transparent"
        )}>
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

            {/* logo */}
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    <Code2 className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
                  </div>
                  {/* tiny glow dot */}
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#050505]" />
                </div>
                <span className="font-display text-[17px] font-800 tracking-tight text-white italic">
                  CodeMaster
                </span>
              </NavLink>

              <div className="hidden md:flex items-center gap-1">
                {[
                  { to: '/explore', label: 'Explorer' },
                  { to: '/contest', label: 'Contests' },
                  { to: '/discuss', label: 'Community' },
                ].map(({ to, label }) => (
                  <NavLink
                    key={to} to={to}
                    className="px-3.5 py-1.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* right */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.18em]">
                      {user?.role === 'admin' ? 'Grandmaster' : 'Master'}
                    </span>
                    <span className="text-sm font-semibold text-white leading-tight">
                      {user?.firstName || 'User'}
                    </span>
                  </div>

                  {/* profile dropdown */}
                  <div className="relative group">
                    <NavLink to="/profile">
                      <button className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 hover:border-orange-500/30 transition-all">
                        <UserIcon className="w-4 h-4 text-white/70" />
                      </button>
                    </NavLink>
                    <div className="absolute right-0 top-full w-2 h-2" />
                    <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-[#0e0e0e] border border-white/[0.08] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.7)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Logged in as</p>
                        <p className="text-sm font-semibold text-white">{user?.firstName || 'User'}</p>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5">
                          {user?.role === 'admin' ? 'Administrator' : 'User'}
                        </p>
                      </div>
                      <div className="p-2">
                        {user?.role === 'admin' && (
                          <NavLink to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                            <Code2 className="w-3.5 h-3.5" /> Admin Panel
                          </NavLink>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left">
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button className="bg-orange-500 text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  Connect
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* ════════════════════════════════
            HERO HEADER
        ════════════════════════════════ */}
        <div className="relative hero-grid border-b border-white/[0.04] overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 py-14 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.15em]">Live Arena</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.07] rounded-full">
                  <span className="text-[10px] font-semibold text-white/40">{totalCount} Challenges</span>
                </div>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-800 text-white tracking-tight leading-[1.1] mb-3">
                Sharpen your<br />
                <span className="text-orange-500">coding edge.</span>
              </h1>
              <p className="text-white/40 text-base max-w-md leading-relaxed">
                Battle through curated challenges. Track progress. Climb the ranks.
              </p>
            </motion.div>
          </div>

          {/* decorative corner lines */}
          <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-white/[0.04] rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-white/[0.04] rounded-bl-xl pointer-events-none" />
        </div>

        {/* ════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-5 py-10 relative z-10">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Global Rank"
              value={`#${stats?.rank ?? '—'}`}
              sub="Top coders"
              accent="orange"
              delay={0}
            />
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Problems Solved"
              value={`${solvedCount} / ${totalCount}`}
              sub={`${solvedPercent}% complete`}
              accent="blue"
              progress={solvedPercent}
              delay={0.08}
            />
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Daily Streak"
              value={`${streak} days`}
              sub="Keep it going"
              accent="amber"
              delay={0.16}
            />
          </div>

          {/* ── FILTER BAR ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between mb-8"
          >
            {/* search */}
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 group-focus-within:text-orange-400 transition-colors" />
              <input
                type="text"
                placeholder="Search challenges…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all placeholder:text-white/20 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors text-xs">✕</button>
              )}
            </div>

            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
              <DropdownFilter
                icon={<Filter className="w-3.5 h-3.5" />}
                value={filters.status}
                onChange={(v) => setFilters({ ...filters, status: v })}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: '✓ Solved', value: 'solved' },
                  { label: '○ Unsolved', value: 'unsolved' },
                ]}
              />
              <DropdownFilter
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                value={filters.difficulty}
                onChange={(v) => setFilters({ ...filters, difficulty: v })}
                options={[
                  { label: 'All Levels', value: 'all' },
                  { label: '● Easy',     value: 'easy' },
                  { label: '◆ Medium',   value: 'medium' },
                  { label: '▲ Hard',     value: 'hard' },
                ]}
              />
              <DropdownFilter
                icon={<Star className="w-3.5 h-3.5" />}
                value={filters.tag}
                onChange={(v) => setFilters({ ...filters, tag: v })}
                options={[
                  { label: 'All Tags', value: 'all' },
                  { label: 'Array',    value: 'array' },
                  { label: 'Graph',    value: 'graph' },
                  { label: 'DP',       value: 'dp' },
                ]}
              />

              {/* result count pill */}
              <div className="px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                <span className="text-xs font-bold text-white/30">
                  {filteredProblems.length}
                  <span className="font-normal"> results</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── COLUMN HEADERS ── */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 mb-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Challenge</span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em] w-20 text-center">Difficulty</span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em] w-20 text-center">Status</span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em] w-10 text-center">→</span>
          </div>

          {/* ── PROBLEM LIST ── */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredProblems.length > 0 ? (
                filteredProblems.map((problem, index) => (
                  <ProblemCard
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
                  className="flex flex-col items-center justify-center py-28 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                    <Search className="w-7 h-7 text-white/15" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/30 mb-1">No results found</h3>
                  <p className="text-sm text-white/20">Try adjusting your filters or search query.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, accent, progress, delay }) {
  const accentMap = {
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/15', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.08)]', ring: '#f97316', track: 'rgba(249,115,22,0.12)' },
    blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/15',   glow: 'shadow-[0_0_30px_rgba(59,130,246,0.08)]',  ring: '#3b82f6', track: 'rgba(59,130,246,0.12)' },
    amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/15',  glow: 'shadow-[0_0_30px_rgba(245,158,11,0.08)]', ring: '#f59e0b', track: 'rgba(245,158,11,0.12)' },
  };
  const a = accentMap[accent];

  const circumference = 220;
  const dashOffset    = progress != null ? circumference - (circumference * progress) / 100 : circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 border bg-white/[0.02] transition-all duration-300 group hover:bg-white/[0.04]',
        a.border, a.glow
      )}
    >
      {/* top-right icon area */}
      <div className={cn('absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center', a.bg, a.text)}>
        {icon}
      </div>

      {/* progress ring (only for "solved") */}
      {progress != null && (
        <div className="absolute right-3 bottom-3 opacity-40 group-hover:opacity-70 transition-opacity">
          <svg width="56" height="56" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke={a.track} strokeWidth="6" />
            <circle
              cx="40" cy="40" r="35" fill="none"
              stroke={a.ring} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ '--target': dashOffset, strokeDashoffset: dashOffset }}
              className="ring-animate"
              transform="rotate(-90 40 40)"
            />
          </svg>
        </div>
      )}

      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h3 className={cn("font-display text-2xl font-800 tracking-tight mb-1", a.text)}>{value}</h3>
      <p className="text-[11px] text-white/25 font-medium">{sub}</p>

      {/* bottom progress bar (only for "solved") */}
      {progress != null && (
        <div className="mt-4 h-[2px] rounded-full overflow-hidden" style={{ background: a.track }}>
          <div className="h-full rounded-full bar-grow" style={{ width: `${progress}%`, background: a.ring }} />
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   DROPDOWN FILTER
══════════════════════════════════════════ */
function DropdownFilter({ icon, value, onChange, options }) {
  const active = value !== 'all';
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer",
      active
        ? "bg-orange-500/10 border-orange-500/25 text-orange-400"
        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/15 hover:text-white/60"
    )}>
      <div className="flex-shrink-0">{icon}</div>
      <select
        className="bg-transparent text-xs font-semibold focus:outline-none appearance-none cursor-pointer pr-5 text-inherit"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight className="w-3 h-3 absolute right-3 rotate-90 pointer-events-none opacity-50" />
    </div>
  );
}

/* ══════════════════════════════════════════
   PROBLEM CARD
══════════════════════════════════════════ */
function ProblemCard({ problem, isSolved, index }) {
  const diff = String(problem.difficulty || '').toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      layout
      transition={{ delay: index * 0.018, duration: 0.3 }}
    >
      <NavLink
        to={`/problem/${problem._id}`}
        className="card-shimmer group relative flex items-center justify-between px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl hover:bg-white/[0.035] hover:border-white/[0.12] transition-all duration-250 overflow-hidden"
      >
        {/* solved accent line */}
        {isSolved && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-400 to-orange-600 shadow-[3px_0_18px_rgba(249,115,22,0.35)]" />
        )}

        {/* hover glow bg */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/[0.025] to-transparent pointer-events-none" />

        {/* ── LEFT: number + info ── */}
        <div className="flex items-center gap-4 min-w-0">
          {/* index number */}
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center flex-shrink-0 group-hover:border-orange-500/20 transition-colors">
            <span className="text-[11px] font-black text-white/25 group-hover:text-orange-400/60 transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="min-w-0">
            {/* title */}
            <h4 className="text-[14px] font-semibold text-white/80 group-hover:text-white transition-colors truncate mb-1.5 flex items-center gap-2">
              {problem.title}
              {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" strokeWidth={2.5} />}
            </h4>

            {/* pills row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("tag-pill", getDifficultyStyle(problem.difficulty))}>
                {problem.difficulty}
              </span>
              {problem.tags && (
                <span className="text-[10px] text-white/25 font-medium tracking-tight">
                  #{problem.tags}
                </span>
              )}
              <span className={cn(
                "tag-pill",
                isSolved
                  ? "text-orange-400 border-orange-500/20 bg-orange-500/8"
                  : "text-white/30 border-white/10 bg-white/[0.03]"
              )}>
                {isSolved ? '✓ Solved' : '○ Unsolved'}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          {/* difficulty dot bar */}
          <div className="hidden md:flex items-end gap-[3px] h-5">
            {['easy', 'medium', 'hard'].map((d, i) => {
              const heights = ['h-2', 'h-3.5', 'h-5'];
              const colors = {
                easy:   ['bg-emerald-400', 'bg-emerald-400/20', 'bg-emerald-400/20'],
                medium: ['bg-emerald-400', 'bg-amber-400', 'bg-amber-400/20'],
                hard:   ['bg-emerald-400', 'bg-amber-400', 'bg-rose-400'],
              };
              return (
                <div
                  key={d}
                  className={cn('w-[3px] rounded-full transition-all duration-300', heights[i], colors[diff]?.[i] || 'bg-white/10')}
                />
              );
            })}
          </div>

          {/* arrow button */}
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] transition-all duration-300">
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </NavLink>
    </motion.div>
  );
}

export default Homepage;