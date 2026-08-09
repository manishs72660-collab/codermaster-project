import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListChecks, Plus, Trash2, Lock, Globe, CheckCircle2,
  ChevronLeft, AlertCircle, GripVertical, MessageCircle,
  Sparkles, Brain, GraduationCap, PartyPopper, Code2, X,
} from 'lucide-react';
import Navbar from '../component/navbar';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

const MAX_QUESTIONS = 20;

// ─── category / tag options, same visual language as Community.jsx's TAG_META ───
const TAG_META = {
  general:     { label: 'General',     icon: Sparkles,       color: 'text-white/50',    bg: 'bg-white/[0.04]',    border: 'border-white/10' },
  aptitude:    { label: 'Aptitude',    icon: Brain,          color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  technical:   { label: 'Technical',   icon: Code2,          color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  'exam-prep': { label: 'Exam Prep',   icon: GraduationCap,  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  'fun-quiz':  { label: 'Fun Quiz',    icon: PartyPopper,    color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
};

// ─── languages available for the "code" attachment on a question ───
const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'cpp',        label: 'C++' },
  { value: 'c',          label: 'C' },
  { value: 'java',       label: 'Java' },
  { value: 'go',         label: 'Go' },
  { value: 'sql',        label: 'SQL' },
];

const blankQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctOption: 0,
  marks: 1,
  code: null, // { language, content } — added on demand via "Add code"
});

export default function McqContestCreate() {
  const navigate = useNavigate();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime]     = useState('');
  const [endTime, setEndTime]         = useState('');
  const [isPublic, setIsPublic]       = useState(true);
  const [tag, setTag]                 = useState('general');
  const [questions, setQuestions]     = useState([blankQuestion()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [created, setCreated]       = useState(null); // holds { contest } after success

  const updateQuestion = (i, patch) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    );
  };

  const toggleCode = (i) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, code: q.code ? null : { language: 'javascript', content: '' } } : q
      )
    );
  };

  const updateCode = (i, patch) => {
    setQuestions((qs) =>
      qs.map((q, idx) => (idx === i ? { ...q, code: { ...q.code, ...patch } } : q))
    );
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((qs) => [...qs, blankQuestion()]);
  };

  const removeQuestion = (i) => {
    setQuestions((qs) => (qs.length === 1 ? qs : qs.filter((_, idx) => idx !== i)));
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    if (!startTime || !endTime) return 'Start and end time are required';
    if (new Date(startTime) >= new Date(endTime)) return 'Start time must be before end time';
    if (questions.length === 0) return 'Add at least one question';
    if (questions.length > MAX_QUESTIONS) return `A contest can have at most ${MAX_QUESTIONS} questions`;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1}: text is required`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1}: all 4 options must be filled in`;
      if (q.code && !q.code.content.trim()) return `Question ${i + 1}: code block is empty — add code or remove it`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axiosClient.post('/mcq-contest/create', {
        title,
        description,
        startTime,
        endTime,
        isPublic,
        tags: [tag],
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((o) => ({ text: o.trim() })),
          correctOption: q.correctOption,
          marks: q.marks || 1,
          ...(q.code && q.code.content.trim()
            ? { code: { language: q.code.language, content: q.code.content } }
            : {}),
        })),
      });
      setCreated(data.contest);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong while creating the contest');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    const whatsappText = encodeURIComponent(
      created.isPublic === false && created.joinCode
        ? `Join my MCQ contest "${created.title}" — use invite code ${created.joinCode} to enter!`
        : `Check out my MCQ contest "${created.title}"!`
    );
    const whatsappHref = `https://wa.me/?text=${whatsappText}`;

    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-700 text-white mb-2">MCQ contest created</h2>
          <p className="text-white/40 text-sm mb-6">
            "{created.title}" is live in your contest list with {created.questions?.length ?? questions.length} question(s).
          </p>

          {created.isPublic === false && created.joinCode && (
            <div className="mb-8 inline-flex flex-col items-center gap-3 bg-purple-500/[0.06] border border-purple-500/20 rounded-2xl px-6 py-4">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.15em]">Invite Code — save this now</span>
              <span className="font-mono text-2xl tracking-[0.3em] text-white">{created.joinCode}</span>
              <span className="text-[11px] text-white/30">This won't be shown again after you leave this page.</span>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
              </a>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/admin/mcq-contest/manage')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 border border-white/[0.1] hover:text-white hover:border-white/20 transition-all"
            >
              Manage Contests
            </button>
            <button
              onClick={() => navigate(`/mcq-contest/${created._id}`)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all"
            >
              View Contest
            </button>
          </div>
        </motion.div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-24">

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-700 text-white">Create MCQ Contest</h1>
            <p className="text-white/40 text-xs mt-0.5">Up to {MAX_QUESTIONS} questions, 4 options each, one correct answer.</p>
          </div>
        </div>

        {/* ── Contest details ── */}
        <Section title="Contest details">
          <Field label="Title">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Aptitude Quiz #4"
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this contest about?"
              rows={3}
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start time">
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
            </Field>
            <Field label="End time">
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </Field>
          </div>

          {/* ── category / tag picker, same chip style as Community post creation ── */}
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = tag === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTag(key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all",
                      active ? cn(meta.bg, meta.border, meta.color) : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/70"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Visibility">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={cn(
                  "flex-1 flex items-center gap-2 justify-center px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                  isPublic ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300" : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/70"
                )}
              >
                <Globe className="w-4 h-4" /> Public
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={cn(
                  "flex-1 flex items-center gap-2 justify-center px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                  !isPublic ? "bg-purple-500/10 border-purple-500/40 text-purple-300" : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/70"
                )}
              >
                <Lock className="w-4 h-4" /> Private (join code)
              </button>
            </div>
          </Field>
        </Section>

        {/* ── Questions ── */}
        <Section
          title={`Questions (${questions.length}/${MAX_QUESTIONS})`}
          action={
            <button
              type="button"
              onClick={addQuestion}
              disabled={questions.length >= MAX_QUESTIONS}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          }
        >
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {questions.map((q, qi) => (
                <motion.div
                  key={qi}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-xs font-black text-white/30 uppercase tracking-widest">
                      <GripVertical className="w-3.5 h-3.5" /> Question {qi + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qi)}
                        className="text-white/20 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qi, { questionText: e.target.value })}
                    placeholder="Type the question…"
                    className="input mb-4"
                  />

                  {/* ── optional code block attached to the question ── */}
                  {q.code && (
                    <div className="mb-4 bg-black/40 border border-sky-500/20 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-sky-400" />
                          <select
                            value={q.code.language}
                            onChange={(e) => updateCode(qi, { language: e.target.value })}
                            className="bg-transparent text-xs font-bold text-sky-300 outline-none cursor-pointer"
                          >
                            {CODE_LANGUAGES.map((l) => (
                              <option key={l.value} value={l.value} className="bg-[#0a0a0a] text-white">
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCode(qi)}
                          className="text-white/20 hover:text-rose-400 transition-colors"
                          title="Remove code block"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={q.code.content}
                        onChange={(e) => updateCode(qi, { content: e.target.value })}
                        placeholder={`// paste your ${q.code.language} snippet here…`}
                        rows={7}
                        spellCheck={false}
                        className="w-full bg-transparent px-3 py-3 font-mono text-[12.5px] leading-relaxed text-white/90 outline-none resize-y placeholder:text-white/20"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer",
                          q.correctOption === oi
                            ? "bg-emerald-500/[0.08] border-emerald-500/40"
                            : "bg-white/[0.015] border-white/[0.07] hover:border-white/[0.15]"
                        )}
                      >
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctOption === oi}
                          onChange={() => updateQuestion(qi, { correctOption: oi })}
                          className="accent-emerald-400 w-4 h-4 flex-shrink-0"
                        />
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          className="bg-transparent flex-1 text-sm text-white outline-none placeholder:text-white/20"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-white/30 font-semibold">Marks</label>
                    <input
                      type="number" min={1} value={q.marks}
                      onChange={(e) => updateQuestion(qi, { marks: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-16 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-cyan-500/40"
                    />

                    {!q.code && (
                      <button
                        type="button"
                        onClick={() => toggleCode(qi)}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Add code
                      </button>
                    )}

                    <span className="text-[10px] text-white/20 ml-auto">Select the correct option's radio button.</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {error && (
          <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm py-3.5 rounded-xl transition-all shadow-[0_0_24px_rgba(34,211,238,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <ListChecks className="w-4 h-4" />}
          {submitting ? 'Creating…' : 'Create MCQ Contest'}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: white;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .input:focus { border-color: rgba(34,211,238,0.4); background: rgba(255,255,255,0.05); }
        .input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </Shell>
  );
}

/* ── layout helpers ── */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
      `}</style>
      <Navbar />
      <div className="px-5 py-10">{children}</div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">{title}</h3>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}