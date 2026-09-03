import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  Swords,
  CalendarDays,
  Lock,
  Code2,
  KeyRound,
  X,
  ListChecks,
  Loader2,
} from 'lucide-react';
import Navbar from '../component/navbar';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── helpers ─── */
const STATUS = {
  ongoing:  { text: 'text-emerald-400', label: 'Live' },
  upcoming: { text: 'text-amber-400',   label: 'Upcoming' },
  ended:    { text: 'text-white/30',    label: 'Ended' },
};
const statusMeta = (s) => STATUS[s] || STATUS.ended;

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
  const navigate = useNavigate();

  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all'); // all | ongoing | upcoming | ended

  // ── join-by-code modal state ──
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode]           = useState('');
  const [joining, setJoining]             = useState(false);
  const [joinError, setJoinError]         = useState('');
  const [joinTarget, setJoinTarget]       = useState(null);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/contest/all').catch(() => ({ data: [] })),
      axiosClient.get('/mcq-contest/all').catch(() => ({ data: [] })),
    ])
      .then(([codeRes, mcqRes]) => {
        const code = (Array.isArray(codeRes.data) ? codeRes.data : []).map((c) => ({ ...c, type: 'code' }));
        const mcq  = (Array.isArray(mcqRes.data)  ? mcqRes.data  : []).map((c) => ({ ...c, type: 'mcq' }));
        setContests([...code, ...mcq]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');

    const attempts =
      joinTarget?.type === 'mcq' ? ['/mcq-contest/join'] :
      joinTarget?.type === 'code' ? ['/contest/join'] :
      ['/contest/join', '/mcq-contest/join'];

    let lastError = 'Invalid or expired code';
    for (const endpoint of attempts) {
      try {
        const { data } = await axiosClient.post(endpoint, { code: joinCode.trim() });
        setShowJoinModal(false);
        setJoinCode('');
        setJoinTarget(null);
        navigate(endpoint.startsWith('/mcq') ? `/mcq-contest/${data.contestId}` : `/contest/${data.contestId}`);
        setJoining(false);
        return;
      } catch (err) {
        lastError = err?.response?.data?.message || lastError;
      }
    }
    setJoinError(lastError);
    setJoining(false);
  };

  const openJoinModal = (contest) => {
    setJoinTarget(contest || null);
    setJoinError('');
    setJoinCode('');
    setShowJoinModal(true);
  };

  const filtered = contests.filter((c) => tab === 'all' || c.computedStatus === tab);

  const ongoing  = contests.filter((c) => c.computedStatus === 'ongoing').length;
  const upcoming = contests.filter((c) => c.computedStatus === 'upcoming').length;
  const ended    = contests.filter((c) => c.computedStatus === 'ended').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }

        .subtle-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .live-dot { animation: live-pulse 1.6s ease-in-out infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar />

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5"
            >
              <div>
                {ongoing > 0 && (
                  <span className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                    <span className="text-[11px] font-medium text-emerald-400">{ongoing} live now</span>
                  </span>
                )}
                <h1 className="font-display font-extrabold text-[2.5rem] sm:text-5xl leading-[1.08] text-white mb-3">
                  Compete. Solve.
                </h1>
                <p className="text-white/45 text-[15px] max-w-md">
                  Join timed contests, climb the leaderboard, and prove your skills against the best.
                </p>
              </div>

              <button
                onClick={() => openJoinModal(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white/50 border border-white/[0.08] hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-colors self-start flex-shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Join with code
              </button>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* ── top cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

            {/* Join a contest */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              onClick={() => document.getElementById('contest-list')?.scrollIntoView({ behavior: 'smooth' })}
              className="sm:col-span-2 text-left rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.14] transition-colors px-6 py-5"
            >
              <div className="flex items-center gap-2 mb-2.5 text-orange-400/80">
                <Trophy className="w-4 h-4" />
                <span className="text-[12px] font-medium text-white/40">Contests</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-4">Join a Contest</h2>

              <div className="flex items-center gap-5 mb-4">
                <div className="flex flex-col">
                  <span className="font-display text-xl font-bold text-emerald-400">{ongoing}</span>
                  <span className="text-[11px] text-white/30">Live</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xl font-bold text-amber-400">{upcoming}</span>
                  <span className="text-[11px] text-white/30">Upcoming</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xl font-bold text-white/40">{ended}</span>
                  <span className="text-[11px] text-white/30">Ended</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-orange-400/90">
                Browse contests
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </motion.button>

            {/* Duel */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              onClick={() => navigate('/duel')}
              className="text-left rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.14] transition-colors px-6 py-5 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2.5 text-orange-400/80">
                <Swords className="w-4 h-4" />
                <span className="text-[12px] font-medium text-white/40">1v1</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Duel Challenge</h2>
              <p className="text-[13px] text-white/35 leading-relaxed mb-4 flex-1">
                Challenge a friend or get matched with a random opponent. First to solve wins.
              </p>
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-orange-400/90">
                Start a duel
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </motion.button>
          </div>

          {/* ── tabs ── */}
          <div id="contest-list" className="mb-6 flex items-center gap-1 flex-wrap">
            {[
              { key: 'all',      label: 'All',      count: contests.length },
              { key: 'ongoing',  label: 'Live',     count: ongoing  },
              { key: 'upcoming', label: 'Upcoming', count: upcoming },
              { key: 'ended',    label: 'Ended',    count: ended    },
            ].map(({ key, label, count }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  )}
                >
                  {label}
                  <span className="text-[11px] font-data text-white/30">{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── contest list ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-5 h-5 text-orange-500 spin-slow mb-3" />
              <p className="text-sm text-white/35">Loading contests…</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 text-white/20" />
              </div>
              <h3 className="font-display text-base font-semibold text-white/65 mb-1">No contests here</h3>
              <p className="text-xs text-white/30">Check back soon or look at a different tab.</p>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.05]">
              <AnimatePresence mode="popLayout">
                {filtered.map((contest, index) => (
                  <ContestRow
                    key={`${contest.type}-${contest._id}`}
                    contest={contest}
                    index={index}
                    onRequestJoin={openJoinModal}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── JOIN WITH CODE MODAL ── */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0B0B0C] border border-white/[0.08] rounded-xl p-6 relative"
            >
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 mb-2.5 text-orange-400/80">
                <KeyRound className="w-4 h-4" />
                <span className="text-[12px] font-medium text-white/40">Private contest</span>
              </div>

              <h3 className="font-display text-lg font-bold text-white mb-1">
                {joinTarget ? joinTarget.title : 'Join with code'}
              </h3>
              <p className="text-white/40 text-[13px] mb-5">
                {joinTarget
                  ? 'This contest is private — enter its invite code to unlock it.'
                  : 'Enter the invite code shared by the contest organizer.'}
              </p>

              <form onSubmit={handleJoinByCode}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  placeholder="e.g. K4F9XQ"
                  autoFocus
                  maxLength={6}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white font-data text-center text-base tracking-[0.3em] uppercase placeholder:text-white/15 placeholder:tracking-normal focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-colors mb-3"
                />

                {joinError && (
                  <p className="text-rose-400 text-xs mb-3 text-center">{joinError}</p>
                )}

                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {joining
                    ? <Loader2 className="w-4 h-4 spin-slow" />
                    : <KeyRound className="w-4 h-4" />}
                  {joining ? 'Joining…' : 'Join Contest'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════
   CONTEST ROW
══════════════════════════════════════════ */
function ContestRow({ contest, index, onRequestJoin }) {
  const navigate    = useNavigate();
  const status      = statusMeta(contest.computedStatus);
  const isOngoing   = contest.computedStatus === 'ongoing';
  const isUpcoming  = contest.computedStatus === 'upcoming';
  const isMcq       = contest.type === 'mcq';
  const isPrivate   = contest.isPublic === false;
  const isLocked    = isPrivate && !contest.isRegistered;

  const countdown = useCountdown(isUpcoming ? contest.startTime : null);

  const handleClick = () => {
    if (isLocked) {
      onRequestJoin?.(contest);
    } else {
      navigate(isMcq ? `/mcq-contest/${contest._id}` : `/contest/${contest._id}`);
    }
  };

  const itemCount = isMcq ? contest.totalQuestions : contest.totalProblems;
  const itemLabel = isMcq ? 'questions' : 'problems';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: (index % 20) * 0.02, duration: 0.18 }}
    >
      <button
        onClick={handleClick}
        className="w-full group flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors duration-150 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('text-[13px] font-medium', status.text)}>
              {isOngoing && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot mr-1.5 align-middle" />}
              {status.label}
            </span>
            {isMcq && <span className="text-[11px] text-white/25 font-data">MCQ</span>}
            {isPrivate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/25">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>

          <h4 className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate mb-1.5">
            {contest.title}
          </h4>

          <div className="flex items-center gap-4 flex-wrap text-[11px] text-white/30">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDuration(contest.startTime, contest.endTime)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {contest.totalParticipants ?? 0} joined
            </span>
            <span className="flex items-center gap-1">
              {isMcq ? <ListChecks className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
              {itemCount ?? 0} {itemLabel}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {isOngoing  ? `Ends ${formatDate(contest.endTime)}`     :
               isUpcoming ? `Starts ${formatDate(contest.startTime)}` :
                            formatDate(contest.endTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isUpcoming && countdown && (
            <div className="hidden md:flex items-center gap-1 font-data text-[11px] text-amber-400">
              {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
            </div>
          )}

          {contest.isRegistered && (
            <span className="hidden sm:block text-[11px] font-medium text-emerald-400">
              Registered
            </span>
          )}

          {isLocked
            ? <Lock className="w-4 h-4 text-white/20 group-hover:text-orange-400 transition-colors" />
            : <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />}
        </div>
      </button>
    </motion.div>
  );
}