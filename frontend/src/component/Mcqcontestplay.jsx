import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListChecks, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Trophy, AlertTriangle, Loader2, Send, Circle, CheckCircle, Code2,
} from 'lucide-react';
import Navbar from '../component/navbar';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── countdown ─── */
function useCountdown(target) {
  const calc = () => {
    if (!target) return null;
    const diff = new Date(target) - new Date();
    if (diff <= 0) return null;
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

export default function McqContestPlay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | not-started | ended-locked | quiz | submitting | result | error
  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
  const [current, setCurrent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const [violation, setViolation] = useState(null); // { level, message } — transient banner
  const [disqualified, setDisqualified] = useState(false);

  const [result, setResult] = useState(null);       // my-submission payload
  const [leaderboard, setLeaderboard] = useState([]);

  const hiddenAtRef = useRef(null);

  /* ── initial load: contest detail, then questions or results ── */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: c } = await axiosClient.get(`/mcq-contest/${id}`);
        if (cancelled) return;
        setContest(c);
        setDisqualified(!!c.isDisqualified);

        if (c.computedStatus === 'upcoming') {
          setPhase('not-started');
          return;
        }

        // Register automatically for public contests the user landed on
        // directly (private contests are already registered via join-code).
        if (!c.isRegistered && c.isPublic !== false) {
          try {
            await axiosClient.post(`/mcq-contest/${id}/register`);
          } catch {
            // already registered / race — ignore, questions call below will
            // surface any real problem
          }
        }

        if (c.hasSubmitted) {
          await loadResults();
          return;
        }

        if (c.computedStatus === 'ended') {
          // never submitted and it's over — nothing to attempt, just show results/leaderboard shell
          await loadResults(true);
          return;
        }

        const { data: qData } = await axiosClient.get(`/mcq-contest/${id}/questions`);
        if (cancelled) return;
        setQuestions(qData.questions || []);
        setPhase('quiz');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err?.response?.data?.message || 'Could not load this contest');
        setPhase('error');
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadResults = async (missedAttempt = false) => {
    try {
      const [subRes, lbRes] = await Promise.all([
        axiosClient.get(`/mcq-contest/${id}/my-submission`).catch(() => ({ data: null })),
        axiosClient.get(`/mcq-contest/${id}/leaderboard`).catch(() => ({ data: [] })),
      ]);
      setResult(subRes.data);
      setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
      setPhase(subRes.data ? 'result' : (missedAttempt ? 'ended-locked' : 'result'));
    } catch {
      setPhase('ended-locked');
    }
  };

  /* ── anti-cheat: tab-hide detection while quiz is active ── */
  const reportViolation = useCallback(async () => {
    try {
      const { data } = await axiosClient.post(`/mcq-contest/${id}/violation`);
      if (data.tracked) {
        setViolation({ level: data.level, message: data.message });
        if (data.disqualified) setDisqualified(true);
      }
    } catch {
      // non-critical, ignore
    }
  }, [id]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current) {
        hiddenAtRef.current = null;
        reportViolation();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [phase, reportViolation]);

  useEffect(() => {
    if (!violation) return;
    const t = setTimeout(() => setViolation(null), 6000);
    return () => clearTimeout(t);
  }, [violation]);

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers((a) => ({ ...a, [questionId]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = async () => {
    setPhase('submitting');
    try {
      await axiosClient.post(`/mcq-contest/${id}/submit`, {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })),
      });
      await loadResults();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Submission failed');
      setPhase('quiz');
    }
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <Shell>
      {phase === 'loading' && <CenterState icon={<Loader2 className="w-6 h-6 animate-spin" />} title="Loading contest…" />}

      {phase === 'error' && (
        <CenterState icon={<AlertTriangle className="w-6 h-6 text-rose-400" />} title="Couldn't load this contest" sub={errorMsg}>
          <button onClick={() => navigate('/contest')} className="btn-ghost mt-4">Back to contests</button>
        </CenterState>
      )}

      {phase === 'not-started' && contest && (
        <CenterState icon={<Clock className="w-6 h-6 text-amber-400" />} title="Not started yet" sub={`This quiz opens at ${new Date(contest.startTime).toLocaleString()}`}>
          <button onClick={() => navigate('/contest')} className="btn-ghost mt-4">Back to contests</button>
        </CenterState>
      )}

      {phase === 'ended-locked' && contest && (
        <CenterState icon={<Clock className="w-6 h-6 text-white/30" />} title="Contest has ended" sub="You didn't submit an attempt for this one.">
          <button onClick={() => navigate('/contest')} className="btn-ghost mt-4">Back to contests</button>
        </CenterState>
      )}

      {phase === 'quiz' && contest && (
        <QuizView
          contest={contest}
          questions={questions}
          answers={answers}
          current={current}
          setCurrent={setCurrent}
          selectAnswer={selectAnswer}
          answeredCount={answeredCount}
          onSubmit={handleSubmit}
          disqualified={disqualified}
          violation={violation}
          errorMsg={errorMsg}
        />
      )}

      {phase === 'submitting' && (
        <CenterState icon={<Loader2 className="w-6 h-6 animate-spin text-cyan-400" />} title="Submitting your answers…" />
      )}

      {phase === 'result' && contest && result && (
        <ResultView contest={contest} result={result} leaderboard={leaderboard} />
      )}
    </Shell>
  );
}

/* ══════════════════════════════════════════
   CODE BLOCK — shown under a question's text
   when the question has a `code` snippet attached.
══════════════════════════════════════════ */
function QuestionCodeBlock({ code }) {
  if (!code || !code.content) return null;
  return (
    <div className="mb-5 bg-black/40 border border-sky-500/20 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.06]">
        <Code2 className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wide">{code.language || 'code'}</span>
      </div>
      <pre className="px-4 py-3 overflow-x-auto">
        <code className="font-mono text-[12.5px] leading-relaxed text-white/90 whitespace-pre">
          {code.content}
        </code>
      </pre>
    </div>
  );
}

/* ══════════════════════════════════════════
   QUIZ VIEW
══════════════════════════════════════════ */
function QuizView({ contest, questions, answers, current, setCurrent, selectAnswer, answeredCount, onSubmit, disqualified, violation, errorMsg }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const countdown = useCountdown(contest.endTime);
  const q = questions[current];

  if (disqualified) {
    return (
      <CenterState icon={<AlertTriangle className="w-6 h-6 text-rose-400" />} title="You've been disqualified" sub="Repeated tab switching flagged this attempt. You can no longer submit." />
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">

      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-700 text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-cyan-400" /> {contest.title}
          </h1>
          <p className="text-white/30 text-xs mt-1">{answeredCount}/{questions.length} answered</p>
        </div>
        {countdown && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 font-mono text-xs text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* violation banner */}
      <AnimatePresence>
        {violation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 border",
              violation.level === 'disqualified' ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            )}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {violation.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* question pill nav */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((qq, i) => (
          <button
            key={qq._id}
            onClick={() => setCurrent(i)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-all",
              i === current
                ? "bg-cyan-400 border-cyan-400 text-black"
                : answers[qq._id] !== undefined
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/[0.02] border-white/[0.08] text-white/30 hover:border-white/20"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* question card */}
      {q && (
        <motion.div
          key={q._id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 mb-6"
        >
          <p className="text-[10px] font-black text-white/25 uppercase tracking-widest mb-3">Question {current + 1} of {questions.length}</p>
          <h2 className="text-white text-base font-semibold mb-4 leading-relaxed">{q.questionText}</h2>

          <QuestionCodeBlock code={q.code} />

          <div className="space-y-2.5">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                  answers[q._id] === oi
                    ? "bg-cyan-500/[0.08] border-cyan-500/40"
                    : "bg-white/[0.015] border-white/[0.07] hover:border-white/[0.15]"
                )}
              >
                <input
                  type="radio"
                  name={`q-${q._id}`}
                  checked={answers[q._id] === oi}
                  onChange={() => selectAnswer(q._id, oi)}
                  className="accent-cyan-400 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-white/80">{opt.text}</span>
              </label>
            ))}
          </div>
        </motion.div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* nav buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm font-semibold text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="flex items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)]"
          >
            <Send className="w-4 h-4" /> Submit
          </button>
        )}
      </div>

      {/* confirm modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0e0e0e] border border-white/[0.08] rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-700 text-white mb-2">Submit final answers?</h3>
              <p className="text-white/40 text-sm mb-5">
                You've answered {answeredCount} of {questions.length} questions. This can only be submitted once — you won't be able to change answers after.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 border border-white/[0.1] hover:text-white transition-all">
                  Keep answering
                </button>
                <button
                  onClick={() => { setConfirmOpen(false); onSubmit(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   RESULT VIEW — score, full answer key, leaderboard
══════════════════════════════════════════ */
function ResultView({ contest, result, leaderboard }) {
  const navigate = useNavigate();
  const pct = result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pb-24">

      {/* score header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/[0.08] via-white/[0.02] to-transparent border border-cyan-500/20 rounded-2xl p-8 mb-8 text-center"
      >
        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.15em] mb-2">{contest.title}</p>
        <div className="font-display text-5xl font-800 text-white mb-1">{result.score}<span className="text-white/25 text-2xl">/{result.totalMarks}</span></div>
        <p className="text-white/40 text-sm">{result.correctCount} of {result.totalQuestions} correct · {pct}%</p>
      </motion.div>

      {/* leaderboard */}
      <Section title="Leaderboard">
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
          {leaderboard.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No submissions yet.</p>
          ) : (
            leaderboard.map((r) => (
              <div
                key={r.user?._id || Math.random()}
                className={cn(
                  "flex items-center justify-between px-5 py-3 border-b border-white/[0.04] last:border-b-0",
                  r.disqualified && "opacity-40"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                    r.rank === 1 ? "bg-amber-500/15 text-amber-400" :
                    r.rank === 2 ? "bg-white/10 text-white/60" :
                    r.rank === 3 ? "bg-orange-800/20 text-orange-400" :
                    "bg-white/[0.03] text-white/30"
                  )}>
                    {r.rank ?? '—'}
                  </span>
                  <span className="text-sm text-white/80">{r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : 'Unknown'}</span>
                  {r.disqualified && <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider">DQ</span>}
                </div>
                <span className="text-sm font-bold text-white/70">{r.score}<span className="text-white/25">/{r.totalMarks}</span></span>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* answer key */}
      <Section title="Answer Key">
        <div className="space-y-3">
          {result.answers.map((a, i) => (
            <div
              key={i}
              className={cn(
                "border rounded-2xl p-5",
                a.isCorrect ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-rose-500/[0.04] border-rose-500/20"
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                {a.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-white/85 font-medium leading-relaxed">{i + 1}. {a.questionText}</p>
              </div>

              {a.code && (
                <div className="pl-7 mb-3">
                  <QuestionCodeBlock code={a.code} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                {a.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                      oi === a.correctOption ? "bg-emerald-500/10 text-emerald-300" :
                      oi === a.selectedOption ? "bg-rose-500/10 text-rose-300" :
                      "text-white/30"
                    )}
                  >
                    {oi === a.correctOption ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> :
                     oi === a.selectedOption ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> :
                     <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-30" />}
                    {opt.text}
                  </div>
                ))}
              </div>
              {a.selectedOption === null && (
                <p className="text-[11px] text-white/25 pl-7 mt-2">You left this unanswered.</p>
              )}
              {a.explanation && (
                <p className="text-[11px] text-white/35 pl-7 mt-3 leading-relaxed">{a.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <button onClick={() => navigate('/contest')} className="btn-ghost mt-4">Back to contests</button>
    </div>
  );
}

/* ── shared layout bits ── */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 10px 18px; transition: all 0.15s;
        }
        .btn-ghost:hover { color: white; border-color: rgba(255,255,255,0.25); }
      `}</style>
      <Navbar />
      <div className="px-5 py-10">{children}</div>
    </div>
  );
}

function CenterState({ icon, title, sub, children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-28">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-display text-lg font-700 text-white/70 mb-1">{title}</h3>
      {sub && <p className="text-sm text-white/30 max-w-sm">{sub}</p>}
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em] mb-4">{title}</h3>
      {children}
    </div>
  );
}