import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  Swords,
  CalendarDays,
  Lock,
  Zap,
  Code2,
  LogOut,
  User as UserIcon,
  Timer,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { cn } from '../utils/cn';

/* ─── helpers ─── */
const getStatusStyle = (status) => {
  if (status === 'ongoing')  return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Live' };
  if (status === 'upcoming') return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   label: 'Upcoming' };
  return                            { text: 'text-white/30',     bg: 'bg-white/[0.03]',   border: 'border-white/10',       dot: 'bg-white/20',    label: 'Ended' };
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const getDuration = (start, end) => {
  const ms = new Date(end) - new Date(start);
  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ─── countdown hook ─── */
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function Contest() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);

  const [contests, setContests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('all'); // all | ongoing | upcoming | ended
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    axiosClient.get('/contest/all')
      .then(({ data }) => setContests(Array.isArray(data) ? data : []))
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => dispatch(logoutUser());

  const filtered = contests.filter((c) => tab === 'all' || c.computedStatus === tab);

  const ongoing  = contests.filter((c) => c.computedStatus === 'ongoing').length;
  const upcoming = contests.filter((c) => c.computedStatus === 'upcoming').length;
  const ended    = contests.filter((c) => c.computedStatus === 'ended').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .font-mono    { font-family: 'JetBrains Mono', monospace; }

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
        @keyframes glow-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

        .card-shimmer::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.04) 50%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .card-shimmer:hover::before { opacity: 1; }

        @keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        .live-dot { animation: live-pulse 1.5s ease-in-out infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">

        {/* ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-purple-500/[0.04] blur-[130px] rounded-full" />
        </div>

        {/* ── NAV (exact same as Homepage) ── */}
       <Navbar></Navbar>

        {/* ── HERO ── */}
        <div className="relative hero-grid border-b border-white/[0.04] overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 py-14 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 live-dot" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.15em]">Arena</span>
                </div>
                {ongoing > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em]">{ongoing} Live Now</span>
                  </div>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-800 text-white tracking-tight leading-[1.1] mb-3">
                Compete. Solve.<br />
                <span className="text-orange-500">Dominate.</span>
              </h1>
              <p className="text-white/40 text-base max-w-md leading-relaxed">
                Join timed contests, climb the leaderboard, and prove your skills against the best.
              </p>
            </motion.div>
          </div>
          <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-white/[0.04] rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-white/[0.04] rounded-bl-xl pointer-events-none" />
        </div>

        {/* ── MAIN ── */}
        <div className="max-w-7xl mx-auto px-5 py-10 relative z-10">

          {/* ── TOP 3 CARDS (Contest + Duel) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">

            {/* Card 1 — Join Contest (primary CTA) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              className="md:col-span-2 relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] via-white/[0.02] to-transparent p-6 group cursor-pointer hover:border-orange-500/40 transition-all duration-300"
              onClick={() => document.getElementById('contest-list')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {/* bg glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.06] blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 live-dot" />
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.12em]">{ongoing} Live</span>
                  </div>
                </div>

                <h2 className="font-display text-2xl font-700 text-white mb-2">Join a Contest</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-sm">
                  Timed coding battles with live leaderboards. Solve the most problems fastest to reach the top.
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-700 text-orange-400">{ongoing}</span>
                    <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Live Now</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-700 text-amber-400">{upcoming}</span>
                    <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Upcoming</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-700 text-white/30">{ended}</span>
                    <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Ended</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold group-hover:gap-3 transition-all">
                  <span>Browse Contests</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>

            {/* Card 2 — Duel Challenge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.06] via-white/[0.02] to-transparent p-6 group cursor-pointer hover:border-purple-500/35 transition-all duration-300"
              onClick={() => navigate('/duel')}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/[0.05] blur-[60px] rounded-full pointer-events-none" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.12em]">1v1</span>
                  </div>
                </div>

                <h2 className="font-display text-2xl font-700 text-white mb-2">Duel Challenge</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">
                  Challenge a friend or get matched with a random opponent. First to solve wins.
                </p>

                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold group-hover:gap-3 transition-all">
                  <span>Start a Duel</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── TAB BAR ── */}
          <div id="contest-list">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                {[
                  { key: 'all',      label: 'All',      count: contests.length },
                  { key: 'ongoing',  label: 'Live',     count: ongoing  },
                  { key: 'upcoming', label: 'Upcoming', count: upcoming },
                  { key: 'ended',    label: 'Ended',    count: ended    },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      tab === key
                        ? "bg-orange-500 text-black shadow-[0_0_16px_rgba(249,115,22,0.3)]"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {label}
                    <span className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                      tab === key ? "bg-black/20 text-black/70" : "bg-white/[0.06] text-white/30"
                    )}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── CONTEST LIST ── */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-28 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                  <Trophy className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="font-display text-lg font-700 text-white/30 mb-1">No contests here</h3>
                <p className="text-sm text-white/20">Check back soon or look at a different tab.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((contest, index) => (
                    <ContestCard key={contest._id} contest={contest} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   CONTEST CARD
══════════════════════════════════════════ */
function ContestCard({ contest, index }) {
  const navigate  = useNavigate();
  const status    = getStatusStyle(contest.computedStatus);
  const isOngoing = contest.computedStatus === 'ongoing';
  const isUpcoming = contest.computedStatus === 'upcoming';

  // countdown for upcoming contests
  const countdown = useCountdown(isUpcoming ? contest.startTime : null);

  const handleClick = () => navigate(`/contest/${contest._id}`);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      layout
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        onClick={handleClick}
        className={cn(
          "card-shimmer group relative flex items-center justify-between px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl hover:bg-white/[0.035] transition-all duration-250 overflow-hidden cursor-pointer",
          isOngoing && "border-emerald-500/15 hover:border-emerald-500/25",
          isUpcoming && "hover:border-orange-500/20"
        )}
      >
        {/* live accent line */}
        {isOngoing && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[3px_0_18px_rgba(52,211,153,0.35)]" />
        )}

        {/* hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-500/[0.025] to-transparent pointer-events-none" />

        {/* LEFT */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* icon */}
          <div className={cn(
            "hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 border transition-all",
            isOngoing  ? "bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40" :
            isUpcoming ? "bg-orange-500/10  border-orange-500/20  group-hover:border-orange-500/40"  :
                         "bg-white/[0.03]   border-white/[0.07]"
          )}>
            {isOngoing  ? <Zap       className="w-4 h-4 text-emerald-400" /> :
             isUpcoming ? <Timer     className="w-4 h-4 text-orange-400"  /> :
                          <Lock      className="w-4 h-4 text-white/20"    />}
          </div>

          <div className="min-w-0">
            {/* title */}
            <h4 className="text-[14px] font-semibold text-white/80 group-hover:text-white transition-colors truncate mb-1.5">
              {contest.title}
            </h4>

            {/* meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* status badge */}
              <span className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border",
                status.bg, status.border, status.text
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot, isOngoing && "live-dot")} />
                {status.label}
              </span>

              {/* duration */}
              <span className="flex items-center gap-1 text-[11px] text-white/25">
                <Clock className="w-3 h-3" />
                {getDuration(contest.startTime, contest.endTime)}
              </span>

              {/* participants */}
              <span className="flex items-center gap-1 text-[11px] text-white/25">
                <Users className="w-3 h-3" />
                {contest.totalParticipants ?? 0} joined
              </span>

              {/* problems count */}
              <span className="flex items-center gap-1 text-[11px] text-white/25">
                <Code2 className="w-3 h-3" />
                {contest.totalProblems ?? 0} problems
              </span>

              {/* date */}
              <span className="hidden md:flex items-center gap-1 text-[11px] text-white/20">
                <CalendarDays className="w-3 h-3" />
                {isOngoing  ? `Ends ${formatDate(contest.endTime)}`   :
                 isUpcoming ? `Starts ${formatDate(contest.startTime)}` :
                              formatDate(contest.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">

          {/* countdown for upcoming */}
          {isUpcoming && countdown && (
            <div className="hidden md:flex items-center gap-1 font-mono text-xs">
              {[
                { val: String(countdown.h).padStart(2,'0'), label: 'h' },
                { val: String(countdown.m).padStart(2,'0'), label: 'm' },
                { val: String(countdown.s).padStart(2,'0'), label: 's' },
              ].map(({ val, label }, i) => (
                <span key={label} className="flex items-center">
                  {i > 0 && <span className="text-white/20 mx-0.5">:</span>}
                  <span className="flex flex-col items-center">
                    <span className="text-amber-400 font-black text-sm leading-none">{val}</span>
                    <span className="text-[8px] text-white/20 uppercase">{label}</span>
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* registered badge */}
          {contest.isRegistered && (
            <span className="hidden sm:block text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
              Registered
            </span>
          )}

          {/* arrow */}
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] transition-all duration-300">
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}