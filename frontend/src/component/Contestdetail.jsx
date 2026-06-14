import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import {
  Trophy, Clock, Users, ChevronRight, Code2,
  LogOut, User as UserIcon, CalendarDays, Zap,
  Lock, Timer, CheckCircle2, Crown, Medal
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── helpers ─── */
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const getDuration = (start, end) => {
  const ms = new Date(end) - new Date(start);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getDiffStyle = (d) => {
  const diff = String(d || '').toLowerCase();
  if (diff === 'easy')   return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (diff === 'medium') return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' };
  if (diff === 'hard')   return { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' };
  return { text: 'text-white/30', bg: 'bg-white/5', border: 'border-white/10' };
};

/* ─── countdown hook ─── */
function useCountdown(targetDate) {
  const calc = () => {
    if (!targetDate) return null;
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
    if (!targetDate) {
      setTime(null);
      return;
    }
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ContestDetail() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [contest, setContest]       = useState(null);
  const [problems, setProblems]     = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [registering, setRegistering] = useState(false);
  const [tab, setTab]               = useState('problems'); // problems | leaderboard | submissions
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* fetch contest detail */
  useEffect(() => {
    axiosClient.get(`/contest/${contestId}`)
      .then(({ data }) => {
        setContest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contestId]);

  /* fetch problems once contest starts and user is registered */
  useEffect(() => {
    if (!contest) return;
    const now = new Date();
    if (now >= new Date(contest.startTime) && contest.isRegistered) {
      axiosClient.get(`/contest/${contestId}/problems`)
        .then(({ data }) => setProblems(data.problems || []))
        .catch(() => {});
    }
  }, [contest, contestId]);

  /* fetch leaderboard if contest ended */
  useEffect(() => {
    if (!contest) return;
    const now = new Date();
    if (now > new Date(contest.endTime) && contest.isRegistered) {
      axiosClient.get(`/contest/${contestId}/leaderboard`)
        .then(({ data }) => setLeaderboard(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [contest, contestId]);

  /* fetch my submissions */
  useEffect(() => {
    if (!contest?.isRegistered) return;
    axiosClient.get(`/contest/${contestId}/my-submissions`)
      .then(({ data }) => setMySubmissions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [contest, contestId]);

  /* ─── derive status flags safely, even before contest loads ─── */
  const now = new Date();
  const isUpcoming = contest ? now < new Date(contest.startTime) : false;
  const isOngoing  = contest ? (now >= new Date(contest.startTime) && now <= new Date(contest.endTime)) : false;
  const isEnded    = contest ? now > new Date(contest.endTime) : false;

  /* ─── countdown hook must be called unconditionally, every render ─── */
  const countdownTarget = isUpcoming ? contest?.startTime : isOngoing ? contest?.endTime : null;
  const countdown = useCountdown(countdownTarget);

  /* ─── early returns AFTER all hooks ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-white/20 text-xs font-mono uppercase tracking-widest">Loading…</span>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/30 text-sm">Contest not found.</p>
          <button onClick={() => navigate('/contest')} className="mt-4 text-orange-400 text-sm underline">← Back to Contests</button>
        </div>
      </div>
    );
  }

  /* solved problem ids from my submissions */
  const solvedIds = new Set(
    mySubmissions.filter((s) => s.status === 'accepted').map((s) => s.problemId?._id || s.problemId)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .noise::after {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          opacity: 0.55;
        }
        @keyframes glow-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }
        @keyframes live-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        .live-dot { animation: live-dot 1.5s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">

        {/* ambient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.05] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-10%] right-[-8%] w-[400px] h-[400px] bg-purple-500/[0.03] blur-[120px] rounded-full" />
        </div>

        {/* ── NAV ── */}
        <nav className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl" : "border-b border-transparent"
        )}>
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <Code2 className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
                </div>
                <span className="font-display text-[17px] font-800 tracking-tight text-white italic">CodeMaster</span>
              </NavLink>
              <span className="text-white/20 text-sm">/</span>
              <NavLink to="/contest" className="text-white/40 hover:text-white text-sm transition-colors">Contests</NavLink>
              <span className="text-white/20 text-sm">/</span>
              <span className="text-white/60 text-sm truncate max-w-[200px]">{contest.title}</span>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.18em]">Master</span>
                  <span className="text-sm font-semibold text-white leading-tight">{user?.firstName}</span>
                </div>
                <NavLink to="/profile">
                  <button className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-all">
                    <UserIcon className="w-4 h-4 text-white/70" />
                  </button>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-5 py-8 relative z-10">

          {/* ── CONTEST HEADER CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-6 mb-6",
              isOngoing  ? "border-emerald-500/20 bg-emerald-500/[0.03]" :
              isUpcoming ? "border-orange-500/20  bg-orange-500/[0.03]"  :
                           "border-white/[0.07]   bg-white/[0.02]"
            )}
          >
            {/* bg glow */}
            <div className={cn(
              "absolute top-0 right-0 w-80 h-80 blur-[100px] rounded-full pointer-events-none",
              isOngoing ? "bg-emerald-500/[0.06]" : isUpcoming ? "bg-orange-500/[0.06]" : "bg-white/[0.02]"
            )} />

            <div className="relative z-10">
              {/* top row */}
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* status badge */}
                  {isOngoing && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" /> Live
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <Timer className="w-3 h-3" /> Upcoming
                    </span>
                  )}
                  {isEnded && (
                    <span className="text-[10px] font-black text-white/30 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                      Ended
                    </span>
                  )}
                  {contest.isRegistered && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Registered
                    </span>
                  )}
                </div>

                {/* register / countdown */}
                <div className="flex items-center gap-3">
                  {/* countdown */}
                  {(isUpcoming || isOngoing) && countdown && (
                    <div className="flex items-center gap-1">
                      {[
                        { val: String(countdown.h).padStart(2, '0'), label: isUpcoming ? 'Starts in' : 'Ends in', show: true, first: true },
                        { val: String(countdown.h).padStart(2, '0'), label: 'h' },
                        { val: String(countdown.m).padStart(2, '0'), label: 'm' },
                        { val: String(countdown.s).padStart(2, '0'), label: 's' },
                      ].slice(1).map(({ val, label }, i) => (
                        <span key={label} className="flex items-center">
                          {i > 0 && <span className="text-white/20 mx-1 font-mono">:</span>}
                          <span className="flex flex-col items-center min-w-[36px] bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-1">
                            <span className={cn("font-display text-lg font-700 leading-none", isOngoing ? "text-emerald-400" : "text-amber-400")}>{val}</span>
                            <span className="text-[8px] text-white/20 uppercase font-mono">{label}</span>
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* register button */}
                  {!contest.isRegistered && !isEnded && (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50"
                    >
                      {registering ? (
                        <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : <Trophy className="w-4 h-4" />}
                      {registering ? 'Joining…' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>

              {/* title */}
              <h1 className="font-display text-3xl md:text-4xl font-700 text-white tracking-tight mb-3">
                {contest.title}
              </h1>
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-2xl">{contest.description}</p>

              {/* meta grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <CalendarDays className="w-4 h-4" />, label: 'Start', value: formatDate(contest.startTime), color: 'text-white/60' },
                  { icon: <CalendarDays className="w-4 h-4" />, label: 'End',   value: formatDate(contest.endTime),   color: 'text-white/60' },
                  { icon: <Clock        className="w-4 h-4" />, label: 'Duration', value: getDuration(contest.startTime, contest.endTime), color: 'text-orange-400' },
                  { icon: <Users        className="w-4 h-4" />, label: 'Participants', value: contest.totalParticipants ?? 0, color: 'text-blue-400' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-white/25 mb-1.5">
                      {icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                    </div>
                    <span className={cn("text-sm font-semibold", color)}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── TABS ── */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl mb-6 w-fit">
            {[
              { key: 'problems',     label: 'Problems',     count: problems.length },
              ...(isEnded && contest.isRegistered ? [{ key: 'leaderboard', label: 'Leaderboard', count: leaderboard.length }] : []),
              ...(contest.isRegistered ? [{ key: 'submissions', label: 'My Submissions', count: mySubmissions.length }] : []),
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
                <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-md", tab === key ? "bg-black/20 text-black/70" : "bg-white/[0.06] text-white/30")}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ══ PROBLEMS TAB ══ */}
          {tab === 'problems' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* not registered */}
              {!contest.isRegistered && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                    <Lock className="w-7 h-7 text-white/15" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/30 mb-2">Register to see problems</h3>
                  <p className="text-sm text-white/20 mb-6">Problems are revealed only to registered participants.</p>
                  {!isEnded && (
                    <button onClick={handleRegister} disabled={registering}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                      {registering ? 'Joining…' : 'Register Now'}
                    </button>
                  )}
                </div>
              )}

              {/* registered but not started */}
              {contest.isRegistered && isUpcoming && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                    <Timer className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/60 mb-2">Contest hasn't started yet</h3>
                  <p className="text-sm text-white/30">Problems will be revealed when the contest begins.</p>
                </div>
              )}

              {/* problems list */}
              {contest.isRegistered && (isOngoing || isEnded) && (
                <div className="space-y-3">
                  {problems.length === 0 ? (
                    <div className="text-center py-16 text-white/20 text-sm">No problems found.</div>
                  ) : problems.map((problem, index) => {
                    const isSolved = solvedIds.has(problem._id);
                    const diff = getDiffStyle(problem.difficulty);
                    return (
                      <motion.div
                        key={problem._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          onClick={() => isOngoing
                            ? navigate(`/contest/${contestId}/problem/${problem._id}`)
                            : null
                          }
                          className={cn(
                            "group relative flex items-center justify-between px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl transition-all duration-250 overflow-hidden",
                            isOngoing ? "cursor-pointer hover:bg-white/[0.035] hover:border-white/[0.12]" : "cursor-default opacity-70"
                          )}
                        >
                          {isSolved && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-400 to-orange-600 shadow-[3px_0_18px_rgba(249,115,22,0.35)]" />
                          )}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-orange-500/[0.02] to-transparent pointer-events-none" />

                          <div className="flex items-center gap-4 min-w-0">
                            {/* index */}
                            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-black text-white/25">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[14px] font-semibold text-white/80 group-hover:text-white transition-colors truncate mb-1.5 flex items-center gap-2">
                                {problem.title}
                                {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" strokeWidth={2.5} />}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border", diff.bg, diff.border, diff.text)}>
                                  {problem.difficulty}
                                </span>
                                {problem.tags && (
                                  <span className="text-[10px] text-white/25">#{problem.tags}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            {isSolved ? (
                              <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                Solved
                              </span>
                            ) : isOngoing ? (
                              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:shadow-[0_0_18px_rgba(249,115,22,0.4)] transition-all duration-300">
                                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-black transition-all" />
                              </div>
                            ) : (
                              <Lock className="w-4 h-4 text-white/15" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ LEADERBOARD TAB ══ */}
          {tab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-16 text-white/20 text-sm">No rankings yet.</div>
                ) : leaderboard.map((entry, index) => (
                  <div key={entry.user?._id || index}
                    className="flex items-center gap-4 px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl">
                    {/* rank */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-700 text-lg",
                      index === 0 ? "bg-amber-500/15 border border-amber-500/30 text-amber-400" :
                      index === 1 ? "bg-white/[0.06] border border-white/15 text-white/50" :
                      index === 2 ? "bg-orange-500/10 border border-orange-500/20 text-orange-500/70" :
                                   "bg-white/[0.03] border border-white/[0.06] text-white/25"
                    )}>
                      {index === 0 ? <Crown className="w-5 h-5" /> :
                       index === 1 ? <Medal className="w-4 h-4" /> :
                       index === 2 ? <Medal className="w-4 h-4" /> :
                       entry.rank}
                    </div>

                    {/* user */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </p>
                      <p className="text-[11px] text-white/25 font-mono">
                        Last solved: {entry.lastSolvedAt ? new Date(entry.lastSolvedAt).toLocaleTimeString() : '—'}
                      </p>
                    </div>

                    {/* solved count */}
                    <div className="flex flex-col items-end">
                      <span className="font-display text-xl font-700 text-orange-400">{entry.totalSolved}</span>
                      <span className="text-[10px] text-white/25 uppercase font-mono tracking-widest">solved</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ MY SUBMISSIONS TAB ══ */}
          {tab === 'submissions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-2">
                {mySubmissions.length === 0 ? (
                  <div className="text-center py-16 text-white/20 text-sm">No submissions yet.</div>
                ) : mySubmissions.map((sub, i) => (
                  <div key={sub._id || i}
                    className="flex items-center gap-4 px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      sub.status === 'accepted' ? "bg-emerald-400" :
                      sub.status === 'wrong'    ? "bg-rose-400" : "bg-amber-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {sub.problemId?.title || 'Problem'}
                      </p>
                      <p className="text-[11px] text-white/25 font-mono">
                        {sub.language} · {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/30 font-mono">
                        {sub.testCasesPassed}/{sub.testCasesTotal} tests
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                        sub.status === 'accepted' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        sub.status === 'wrong'    ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                                                    "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      )}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}