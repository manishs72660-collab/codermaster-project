import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import {
  Trophy, Clock, Users, ChevronRight, Code2,
  CalendarDays, Zap,
  Lock, Timer, CheckCircle2, Crown, Medal, KeyRound, Copy, Check,
  AlertCircle, RefreshCw
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

// Normalizes whatever shape the leaderboard endpoint returns into a plain array.
// Your API currently returns a raw array, so the first branch is what fires —
// the others are just safety nets in case the backend response shape ever changes.
const normalizeLeaderboard = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.leaderboard)) return data.leaderboard;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return null; // null = "unexpected shape", different from [] = "legitimately empty"
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
    if (!targetDate) return;
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
}

/* ══════════════════════════════════════════
   ANTI-CHEAT VIOLATION MODAL
   Shown after a tab-switch / minimize is reported to the server.
   level: 'warning' | 'strict_warning' | 'disqualified'
══════════════════════════════════════════ */
function ViolationModal({ data, onClose }) {
  if (!data) return null;
  const isDQ = data.level === 'disqualified';
  const isStrict = data.level === 'strict_warning';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "max-w-sm w-full rounded-2xl border p-6 text-center",
          isDQ ? "bg-rose-500/[0.06] border-rose-500/30" :
          isStrict ? "bg-amber-500/[0.06] border-amber-500/30" :
                     "bg-orange-500/[0.06] border-orange-500/30"
        )}
      >
        <div className={cn(
          "w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center",
          isDQ ? "bg-rose-500/10 border border-rose-500/20" :
          isStrict ? "bg-amber-500/10 border border-amber-500/20" :
                     "bg-orange-500/10 border border-orange-500/20"
        )}>
          <AlertCircle className={cn(
            "w-7 h-7",
            isDQ ? "text-rose-400" : isStrict ? "text-amber-400" : "text-orange-400"
          )} />
        </div>
        <h3 className="font-display text-lg font-700 text-white mb-2">
          {isDQ ? 'Disqualified' : isStrict ? 'Strict Warning' : 'Warning'}
        </h3>
        <p className="text-sm text-white/50 mb-6 leading-relaxed">{data.message}</p>
        <button
          onClick={onClose}
          className={cn(
            "px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all",
            isDQ ? "bg-rose-500 hover:bg-rose-400" :
            isStrict ? "bg-amber-500 hover:bg-amber-400" :
                       "bg-orange-500 hover:bg-orange-400"
          )}
        >
          {isDQ ? 'I understand' : 'Got it'}
        </button>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ContestDetail() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // ── ALL STATE AT TOP ──
  const [contest, setContest]             = useState(null);
  const [problems, setProblems]           = useState([]);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [registering, setRegistering]     = useState(false);
  const [tab, setTab]                     = useState('problems');
  const [scrolled, setScrolled]           = useState(false);
  const [codeCopied, setCodeCopied]       = useState(false);

  // leaderboard-specific request state so failures are visible instead of silent
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError]     = useState(null);
  const [leaderboardRefetchKey, setLeaderboardRefetchKey] = useState(0);

  // ── Anti-cheat state ──
  const [violationModal, setViolationModal] = useState(null); // { level, message, violationCount } | null
  const [disqualified, setDisqualified]     = useState(false);

  // ── compute status from state (safe when contest is null) ──
  const now        = new Date();
  const isUpcoming = contest ? now < new Date(contest.startTime) : false;
  const isOngoing  = contest ? now >= new Date(contest.startTime) && now <= new Date(contest.endTime) : false;
  const isEnded    = contest ? now > new Date(contest.endTime) : false;

  // ── useCountdown ALWAYS called at top level, never conditionally ──
  const countdownTarget = contest
    ? isUpcoming ? contest.startTime
    : isOngoing  ? contest.endTime
    : null
    : null;
  const countdown = useCountdown(countdownTarget);

  // ── ALL useEffects ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    axiosClient.get(`/contest/${contestId}`)
      .then(({ data }) => { setContest(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [contestId]);

  useEffect(() => {
    if (!contest) return;
    if (now >= new Date(contest.startTime) && contest.isRegistered) {
      axiosClient.get(`/contest/${contestId}/problems`)
        .then(({ data }) => setProblems(data.problems || []))
        .catch(() => {});
    }
  }, [contest, contestId]);

  // ── LEADERBOARD FETCH ──
  // Open to everyone once the contest has ended — registration is no longer
  // required to view it. Every outcome is visible: loading / error /
  // empty-but-successful / populated are all distinct states.
  useEffect(() => {
    if (!contest) return;
    if (!(now > new Date(contest.endTime))) return;

    let cancelled = false;
    setLeaderboardLoading(true);
    setLeaderboardError(null);

    axiosClient.get(`/contest/${contestId}/leaderboard`)
      .then(({ data }) => {
        if (cancelled) return;
        const normalized = normalizeLeaderboard(data);
        if (normalized === null) {
          console.error('Leaderboard: unexpected response shape', data);
          setLeaderboardError('Received an unexpected response shape from the server.');
          setLeaderboard([]);
        } else {
          setLeaderboard(normalized);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Surface the real cause instead of swallowing it. Common culprits:
        // - 401/403: auth cookie/token not sent, or the server still gates
        //   this route behind registration and needs to be opened up
        // - CORS blocked (check the Network tab / console for a CORS error)
        // - wrong path/base URL
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.message;
        console.error('Leaderboard fetch failed:', status, serverMsg || err.message);
        setLeaderboardError(
          serverMsg ||
          (status ? `Request failed with status ${status}` : 'Network error — request may have been blocked (check console/Network tab).')
        );
      })
      .finally(() => {
        if (!cancelled) setLeaderboardLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest, contestId, leaderboardRefetchKey]);

  useEffect(() => {
    if (!contest?.isRegistered) return;
    axiosClient.get(`/contest/${contestId}/my-submissions`)
      .then(({ data }) => setMySubmissions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [contest, contestId]);

  // ── Sync disqualified flag from the server the moment contest data loads,
  // so a user who was disqualified in a previous tab/session sees it here
  // immediately, without needing to trigger a new violation first.
  useEffect(() => {
    if (contest?.isDisqualified) setDisqualified(true);
  }, [contest]);

  // ── Unregistered visitors landing on an ended contest have nothing to do
  // on the "Problems" tab — send them straight to the leaderboard instead.
  useEffect(() => {
    if (contest && isEnded && !contest.isRegistered) {
      setTab('leaderboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest, isEnded]);

  // ── Anti-cheat: detect tab switch / minimize while the contest is live.
  // Every time the tab goes hidden and then becomes visible again counts as
  // one violation. Reported to the server, which owns the actual strike
  // count and disqualification decision (never trust the client for that).
  useEffect(() => {
    if (!contest || !contest.isRegistered || disqualified) return;
    if (!(now >= new Date(contest.startTime) && now <= new Date(contest.endTime))) return;

    // `visibilitychange` reliably fires for tab switches, but minimizing
    // the window (or alt-tabbing to another app while the browser window
    // stays technically on-screen) doesn't flip document.hidden on every
    // browser/OS. window `blur`/`focus` catches OS-level focus loss instead,
    // which is what actually happens on minimize. We listen to both and use
    // `left` as a single guard so a leave-and-return that fires both events
    // (common on plain tab switches) only ever counts as one violation.
    let left = false;

    const markLeft = () => {
      left = true;
    };

    const markReturned = async () => {
      if (!left) return;
      left = false;

      try {
        const { data } = await axiosClient.post(`/contest/${contestId}/violation`);
        if (data.tracked) {
          setViolationModal({
            level: data.level,
            message: data.message,
            violationCount: data.violationCount,
          });
          if (data.disqualified) setDisqualified(true);
        }
      } catch (err) {
        // Network hiccup reporting the violation — don't block the user's
        // flow over this, the next hide/show cycle will try again.
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) markLeft();
      else markReturned();
    };
    const handleBlur = () => markLeft();
    const handleFocus = () => markReturned();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest, contestId, disqualified]);

  // ── EARLY RETURNS after all hooks ──
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

  const isPrivate = contest.isPublic === false;
  const isCreator = user && contest.createdBy &&
    (contest.createdBy._id || contest.createdBy) === user._id;

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await axiosClient.post(`/contest/${contestId}/register`);
      setContest((prev) => ({ ...prev, isRegistered: true, totalParticipants: (prev.totalParticipants || 0) + 1 }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCopyCode = () => {
    if (!contest.joinCode) return;
    navigator.clipboard.writeText(contest.joinCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

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
        {/* Simplified breadcrumb navbar: logo + CodeMaster / Contests / <title>,
            with small status pills on the right instead of a profile button. */}
        <nav className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl" : "border-b border-transparent"
        )}>
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <NavLink to="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <Code2 className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
                </div>
                <span className="font-display text-[17px] font-800 tracking-tight text-white italic">CodeMaster</span>
              </NavLink>
              <span className="text-white/20 text-sm flex-shrink-0">/</span>
              <NavLink to="/contest" className="text-white/40 hover:text-white text-sm transition-colors flex-shrink-0">Contests</NavLink>
              <span className="text-white/20 text-sm flex-shrink-0">/</span>
              <span className="text-orange-400 text-sm font-medium truncate">{contest.title}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                {contest.type === 'mcq' ? 'MCQ' : 'Coding'}
              </span>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                {(problems.length || contest.totalProblems || 0)} Problems
              </span>
              <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                {contest.totalParticipants ?? 0} Participants
              </span>
            </div>
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
            <div className={cn(
              "absolute top-0 right-0 w-80 h-80 blur-[100px] rounded-full pointer-events-none",
              isOngoing ? "bg-emerald-500/[0.06]" : isUpcoming ? "bg-orange-500/[0.06]" : "bg-white/[0.02]"
            )} />

            <div className="relative z-10">
              {/* top row */}
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
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
                  {isPrivate && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                  {contest.isRegistered && !disqualified && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Registered
                    </span>
                  )}
                  {disqualified && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      <AlertCircle className="w-3 h-3" /> Disqualified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* countdown */}
                  {(isUpcoming || isOngoing) && countdown && (
                    <div className="flex items-center gap-1">
                      {[
                        { val: String(countdown.h).padStart(2, '0'), label: 'h' },
                        { val: String(countdown.m).padStart(2, '0'), label: 'm' },
                        { val: String(countdown.s).padStart(2, '0'), label: 's' },
                      ].map(({ val, label }, i) => (
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

                  {/* Register button — only for PUBLIC contests. Private contests are joined via code on the Contests list page. */}
                  {!contest.isRegistered && !isEnded && !isPrivate && (
                    <button onClick={handleRegister} disabled={registering}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50">
                      {registering
                        ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        : <Trophy className="w-4 h-4" />}
                      {registering ? 'Joining…' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-700 text-white tracking-tight mb-3">{contest.title}</h1>
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-2xl">{contest.description}</p>

              {/* Disqualified banner — visible whenever this user has been disqualified */}
              {disqualified && (
                <div className="flex items-center gap-3 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-4 py-3 mb-6 max-w-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <p className="text-xs text-rose-300/80">
                    You've been disqualified from this contest for repeatedly leaving the tab. You can no longer submit, and you're marked as disqualified on the leaderboard.
                  </p>
                </div>
              )}

              {/* Join-code panel — visible only to the creator, so they can share it */}
              {isPrivate && isCreator && contest.joinCode && (
                <div className="flex items-center justify-between gap-4 bg-purple-500/[0.06] border border-purple-500/20 rounded-xl px-4 py-3 mb-6 max-w-md">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Invite code</p>
                      <p className="font-mono text-lg font-700 text-purple-300 tracking-[0.25em]">{contest.joinCode}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-all"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {codeCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              {/* Not registered + private + not creator → tell them how to join */}
              {isPrivate && !contest.isRegistered && !isCreator && (
                <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
                  <Lock className="w-3.5 h-3.5" />
                  This is a private contest — join it from the Contests page using your invite code.
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <CalendarDays className="w-4 h-4" />, label: 'Start',        value: formatDate(contest.startTime),                        color: 'text-white/60' },
                  { icon: <CalendarDays className="w-4 h-4" />, label: 'End',          value: formatDate(contest.endTime),                          color: 'text-white/60' },
                  { icon: <Clock        className="w-4 h-4" />, label: 'Duration',     value: getDuration(contest.startTime, contest.endTime),       color: 'text-orange-400' },
                  { icon: <Users        className="w-4 h-4" />, label: 'Participants', value: contest.totalParticipants ?? 0,                        color: 'text-blue-400' },
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
              { key: 'problems',     label: 'Problems',       count: problems.length },
              ...(isEnded ? [{ key: 'leaderboard',  label: 'Leaderboard',    count: leaderboard.length }] : []),
              ...(contest.isRegistered             ? [{ key: 'submissions', label: 'My Submissions', count: mySubmissions.length }] : []),
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  tab === key ? "bg-orange-500 text-black shadow-[0_0_16px_rgba(249,115,22,0.3)]" : "text-white/40 hover:text-white/70"
                )}>
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
              {!contest.isRegistered && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                    <Lock className="w-7 h-7 text-white/15" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/30 mb-2">
                    {isEnded ? 'This contest has ended' : 'Register to see problems'}
                  </h3>
                  <p className="text-sm text-white/20 mb-6">
                    {isEnded
                      ? 'Problems were only visible to participants, but the leaderboard is open to everyone.'
                      : isPrivate
                        ? 'Join this private contest with your invite code to unlock problems.'
                        : 'Problems are revealed only to registered participants.'}
                  </p>
                  {isEnded && (
                    <button onClick={() => setTab('leaderboard')}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                      <Trophy className="w-4 h-4" /> View Leaderboard
                    </button>
                  )}
                  {!isEnded && !isPrivate && (
                    <button onClick={handleRegister} disabled={registering}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                      {registering ? 'Joining…' : 'Register Now'}
                    </button>
                  )}
                  {!isEnded && isPrivate && (
                    <button onClick={() => navigate('/contest')}
                      className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                      Enter Invite Code
                    </button>
                  )}
                </div>
              )}

              {contest.isRegistered && isUpcoming && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                    <Timer className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/60 mb-2">Contest hasn't started yet</h3>
                  <p className="text-sm text-white/30">Problems will be revealed when the contest begins.</p>
                </div>
              )}

              {contest.isRegistered && (isOngoing || isEnded) && (
                <div className="space-y-3">
                  {problems.length === 0
                    ? <div className="text-center py-16 text-white/20 text-sm">No problems found.</div>
                    : problems.map((problem, index) => {
                        const isSolved = solvedIds.has(problem._id);
                        const diff = getDiffStyle(problem.difficulty);
                        // Disqualified users can still view problems, but shouldn't
                        // be nudged into the solve flow — the submit endpoint
                        // rejects them anyway, so treat these as non-clickable.
                        const canOpen = isOngoing && !disqualified;
                        return (
                          <motion.div key={problem._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                            <div
                              onClick={() => canOpen ? navigate(`/contest/${contestId}/problem/${problem._id}`) : null}
                              className={cn(
                                "group relative flex items-center justify-between px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl transition-all duration-250 overflow-hidden",
                                canOpen ? "cursor-pointer hover:bg-white/[0.035] hover:border-white/[0.12]" : "cursor-default opacity-70"
                              )}
                            >
                              {isSolved && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-400 to-orange-600 shadow-[3px_0_18px_rgba(249,115,22,0.35)]" />}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-orange-500/[0.02] to-transparent pointer-events-none" />

                              <div className="flex items-center gap-4 min-w-0">
                                <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] items-center justify-center flex-shrink-0">
                                  <span className="text-[11px] font-black text-white/25">{String(index + 1).padStart(2, '0')}</span>
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
                                    {problem.tags && <span className="text-[10px] text-white/25">#{problem.tags}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                {isSolved ? (
                                  <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">Solved</span>
                                ) : canOpen ? (
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
                      })
                  }
                </div>
              )}
            </motion.div>
          )}

          {/* ══ LEADERBOARD TAB ══ */}
          {tab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {leaderboardLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-8 h-8 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin mb-4" />
                  <span className="text-white/20 text-xs font-mono uppercase tracking-widest">Loading leaderboard…</span>
                </div>
              )}

              {!leaderboardLoading && leaderboardError && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
                    <AlertCircle className="w-7 h-7 text-rose-400" />
                  </div>
                  <h3 className="font-display text-lg font-700 text-white/60 mb-2">Couldn't load leaderboard</h3>
                  <p className="text-sm text-white/30 mb-6 max-w-sm">{leaderboardError}</p>
                  <button
                    onClick={() => setLeaderboardRefetchKey((k) => k + 1)}
                    className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/70 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}

              {!leaderboardLoading && !leaderboardError && (
                <div className="space-y-2">
                  {leaderboard.length === 0
                    ? <div className="text-center py-16 text-white/20 text-sm">No rankings yet.</div>
                    : leaderboard.map((entry, index) => (
                        <div
                          key={entry.user?._id || index}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 rounded-2xl border",
                            entry.disqualified
                              ? "bg-rose-500/[0.03] border-rose-500/20 opacity-60"
                              : "bg-white/[0.015] border-white/[0.06]"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-700 text-lg",
                            entry.disqualified ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" :
                            index === 0 ? "bg-amber-500/15 border border-amber-500/30 text-amber-400" :
                            index === 1 ? "bg-white/[0.06] border border-white/15 text-white/50" :
                            index === 2 ? "bg-orange-500/10 border border-orange-500/20 text-orange-500/70" :
                                          "bg-white/[0.03] border border-white/[0.06] text-white/25"
                          )}>
                            {entry.disqualified ? <AlertCircle className="w-4 h-4" /> :
                             index === 0 ? <Crown className="w-5 h-5" /> :
                             index === 1 ? <Medal className="w-4 h-4" /> :
                             index === 2 ? <Medal className="w-4 h-4" /> :
                             entry.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{entry.user?.firstName} {entry.user?.lastName}</p>
                            <p className={cn("text-[11px] font-mono", entry.disqualified ? "text-rose-400/70" : "text-white/25")}>
                              {entry.disqualified
                                ? 'Disqualified — left the tab too many times'
                                : `Last solved: ${entry.lastSolvedAt ? new Date(entry.lastSolvedAt).toLocaleTimeString() : '—'}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={cn("font-display text-xl font-700", entry.disqualified ? "text-rose-400/70" : "text-orange-400")}>
                              {entry.totalSolved}
                            </span>
                            <span className="text-[10px] text-white/25 uppercase font-mono tracking-widest">solved</span>
                          </div>
                        </div>
                      ))
                  }
                </div>
              )}
            </motion.div>
          )}

          {/* ══ MY SUBMISSIONS TAB ══ */}
          {tab === 'submissions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-2">
                {mySubmissions.length === 0
                  ? <div className="text-center py-16 text-white/20 text-sm">No submissions yet.</div>
                  : mySubmissions.map((sub, i) => (
                      <div key={sub._id || i} className="flex items-center gap-4 px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          sub.status === 'accepted' ? "bg-emerald-400" :
                          sub.status === 'wrong'    ? "bg-rose-400" : "bg-amber-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{sub.problemId?.title || 'Problem'}</p>
                          <p className="text-[11px] text-white/25 font-mono">{sub.language} · {new Date(sub.submittedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-white/30 font-mono">{sub.testCasesPassed}/{sub.testCasesTotal} tests</span>
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
                    ))
                }
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <ViolationModal data={violationModal} onClose={() => setViolationModal(null)} />
    </>
  );
}