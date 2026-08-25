import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import mylogo from "../assets/my logo.png"

/* language metadata — color-coded per language so the pill + editor identity stays consistent */
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', short: 'JS',   monaco: 'javascript', color: '#f0d64b' },
  { id: 'python',     label: 'Python',     short: 'PY',   monaco: 'python',     color: '#4b8ef0' },
  { id: 'java',       label: 'Java',       short: 'JAVA', monaco: 'java',       color: '#f0954b' },
  { id: 'cpp',        label: 'C++',        short: 'C++',  monaco: 'cpp',        color: '#8b5cf6' },
];

const REDIRECT_DELAY_MS = 1500;

/* ─── Anti-cheat violation modal ───────────────────────────────────────────
   level: 'warning' | 'strict_warning' | 'disqualified' */
const ViolationModal = ({ data, onClose }) => {
  if (!data) return null;
  const isDQ = data.level === 'disqualified';
  const isStrict = data.level === 'strict_warning';
  const color = isDQ ? '#f04f4f' : isStrict ? '#ffa116' : '#4b8ef0';
  const bg = isDQ ? 'rgba(240,79,79,0.08)' : isStrict ? 'rgba(255,161,22,0.08)' : 'rgba(75,142,240,0.08)';
  const border = isDQ ? 'rgba(240,79,79,0.28)' : isStrict ? 'rgba(255,161,22,0.28)' : 'rgba(75,142,240,0.28)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(4,5,8,0.82)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        maxWidth: 380, width: '100%', borderRadius: 14, border: `1px solid ${border}`,
        background: bg, padding: 28, textAlign: 'center', fontFamily: "'Outfit',system-ui,sans-serif",
      }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
          background: `${color}1a`, border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color,
        }}>
          {isDQ ? '⛔' : '⚠'}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color, marginBottom: 8, letterSpacing: -0.3 }}>
          {isDQ ? 'Disqualified' : isStrict ? 'Strict Warning' : 'Warning'}
        </div>
        <div style={{ fontSize: 12.5, color: '#8a93ac', lineHeight: 1.6, marginBottom: 22, fontFamily: "'JetBrains Mono',monospace" }}>
          {data.message}
        </div>
        <button
          onClick={onClose}
          style={{
            background: color, color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Outfit',system-ui,sans-serif", fontSize: 12.5, fontWeight: 800, padding: '9px 22px',
          }}
        >
          {isDQ ? 'I understand' : 'Got it'}
        </button>
      </div>
    </div>
  );
};

const ContestProblemEditor = () => {
  const { contestId, problemId } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem]               = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode]                     = useState('');
  const [loading, setLoading]               = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [submitResult, setSubmitResult]     = useState(null); // { submitted: true } | { disqualified: true }
  const [runResult, setRunResult]           = useState(null);
  const [activeLeftTab, setActiveLeftTab]   = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [editorHeight, setEditorHeight]     = useState(420);
  const [fontSize, setFontSize]             = useState(13);
  const [copied, setCopied]                 = useState(false);
  const [saveStatus, setSaveStatus]         = useState('');
  const [elapsedTime, setElapsedTime]       = useState(0);
  const [editorTheme, setEditorTheme]       = useState('vs-dark');
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const editorRef                           = useRef(null);
  const startTimeRef                        = useRef(Date.now());
  const redirectTimerRef                    = useRef(null);

  // ── Anti-cheat state ──
  const [isRegistered, setIsRegistered]     = useState(false);
  const [contestActive, setContestActive]   = useState(false); // now within [startTime, endTime]
  const [disqualified, setDisqualified]     = useState(false);
  const [violationModal, setViolationModal] = useState(null); // { level, message, violationCount } | null

  /* ── timer ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── cleanup any pending redirect on unmount ── */
  useEffect(() => () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  /* ── keyboard shortcuts: Ctrl+Enter = Run, Esc = exit fullscreen ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
      if (e.key === 'Escape' && isFullscreen) { setIsFullscreen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, selectedLanguage, isFullscreen]);

  /* ── helper: match a startCode entry to a language id ── */
  const matchStartCode = (startCode, lang) => {
    return startCode?.find((sc) => {
      const l = sc.language.toLowerCase();
      if (l === lang) return true;
      if (lang === 'cpp' && (l === 'c++' || l === 'cpp')) return true;
      if (lang === 'javascript' && (l === 'js' || l === 'javascript')) return true;
      if (lang === 'python' && (l === 'py' || l === 'python' || l === 'python3')) return true;
      if (lang === 'java' && l === 'java') return true;
      return false;
    })?.initialCode || '';
  };

  /* ── fetch problem ── */
  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/contest/${contestId}/problem/${problemId}`)
      .then(({ data }) => {
        setProblem(data);
        const initial = matchStartCode(data.startCode, selectedLanguage);
        const saved = localStorage.getItem(`contest_${contestId}_${problemId}_${selectedLanguage}`);
        setCode(saved !== null ? saved : initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [problemId, contestId]);

  /* ── fetch contest state: registration, active window, and — importantly —
     whether THIS user is already disqualified. This runs once on mount so a
     disqualified user who reloads or deep-links into a problem sees the
     locked state immediately, without needing to trigger a fresh violation
     in this tab first. ── */
  useEffect(() => {
    axiosClient.get(`/contest/${contestId}`)
      .then(({ data }) => {
        setIsRegistered(!!data.isRegistered);
        setContestActive(data.computedStatus === 'ongoing');
        if (data.isDisqualified) setDisqualified(true);
      })
      .catch(() => {});
  }, [contestId]);

  /* ── language switch ── */
  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(`contest_${contestId}_${problemId}_${selectedLanguage}`);
    if (saved !== null) { setCode(saved); return; }
    setCode(matchStartCode(problem.startCode, selectedLanguage));
  }, [selectedLanguage, problem]);

  /* ── editor change (auto-save) ── */
  const handleEditorChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    setSaveStatus('saving');
    localStorage.setItem(`contest_${contestId}_${problemId}_${selectedLanguage}`, newCode);
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus(''), 2200);
  };

  const handleEditorDidMount = (editor) => { editorRef.current = editor; };

  /* ── resize drag ── */
  const startResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = editorHeight;
    const onMove = (ev) => {
      const next = Math.max(150, Math.min(window.innerHeight * 0.8, startH + (ev.clientY - startY)));
      setEditorHeight(next);
      editorRef.current?.layout({ width: editorRef.current.getLayoutInfo().width, height: next });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ── Anti-cheat: detect tab switch / minimize while the contest is live.
     Mirrors the same hidden->visible tracking as the contest detail page.
     This is the page people actually spend time on, so it matters most here.
     The server owns the strike count and disqualification decision — this
     effect only reports the event and reflects back whatever it says. ── */
  useEffect(() => {
    if (!isRegistered || !contestActive || disqualified) return;

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
        // Network hiccup reporting the violation — the next hide/show cycle
        // will try again, so don't interrupt the person's coding flow.
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
  }, [contestId, isRegistered, contestActive, disqualified]);

  /* ── run (uses normal run endpoint — no contest restriction on run) ── */
  /*    Run keeps the FULL detailed breakdown: overall pass/fail banner + */
  /*    per-test-case input / expected / actual output. Running is left    */
  /*    available even after disqualification — it's harmless practice,    */
  /*    only submissions actually count and are blocked.                   */
  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const { data } = await axiosClient.post(`/code/runcode/${problemId}`, { code, language: selectedLanguage });
      setRunResult(data);
      setActiveRightTab('testcase');
    } catch {
      setRunResult({ success: false, error: 'Internal server error' });
      setActiveRightTab('testcase');
    } finally {
      setLoading(false);
    }
  };

  /* ── submit (hits contest endpoint) ──                                  */
  /*    Submit is intentionally simplified: whatever the server returns,   */
  /*    we only ever surface a plain "submitted successfully" confirmation */
  /*    — no pass/fail/wrong-answer detail — then auto-redirect back to    */
  /*    the contest problem list after a short delay.                     */
  /*    EXCEPTION: a disqualified user gets a distinct locked-out screen   */
  /*    instead of the success screen — that's the one failure mode we    */
  /*    can't swallow silently, since submit is guaranteed rejected.       */
  const handleSubmitCode = async () => {
    if (disqualified) {
      setActiveRightTab('result');
      setSubmitResult({ disqualified: true });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);
    setActiveRightTab('result');
    try {
      await axiosClient.post(`/contest/${contestId}/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult({ submitted: true });
      redirectTimerRef.current = setTimeout(() => {
        navigate(`/contest/${contestId}`);
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      if (err?.response?.status === 403 && err?.response?.data?.disqualified) {
        // Server-side truth wins even if our local state was stale.
        setDisqualified(true);
        setSubmitResult({ disqualified: true });
      } else {
        /* everything else intentionally swallowed — submit view never
           shows pass/fail/wrong-answer detail */
        setSubmitResult({ submitted: true });
        redirectTimerRef.current = setTimeout(() => {
          navigate(`/contest/${contestId}`);
        }, REDIRECT_DELAY_MS);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── reset ── */
  const handleReset = () => {
    if (!problem) return;
    setCode(matchStartCode(problem.startCode, selectedLanguage));
    localStorage.removeItem(`contest_${contestId}_${problemId}_${selectedLanguage}`);
  };

  /* ── copy ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── font size ── */
  const changeFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(20, Math.max(10, prev + delta));
      editorRef.current?.updateOptions({ fontSize: next });
      return next;
    });
  };

  const toggleTheme = () => {
    setEditorTheme((prev) => (prev === 'vs-dark' ? 'light' : 'vs-dark'));
  };

  const getMonacoLang = (lang) => LANGUAGES.find((l) => l.id === lang)?.monaco || 'javascript';

  /* ── difficulty colors ── */
  const diffMap = {
    easy:   { color: '#2dba6e', bg: 'rgba(45,186,110,0.1)',  border: 'rgba(45,186,110,0.22)' },
    medium: { color: '#ffa116', bg: 'rgba(255,161,22,0.1)',  border: 'rgba(255,161,22,0.22)' },
    hard:   { color: '#f04f4f', bg: 'rgba(240,79,79,0.1)',   border: 'rgba(240,79,79,0.22)'  },
  };
  const dc = diffMap[problem?.difficulty?.toLowerCase()] || diffMap.medium;

  if (loading && !problem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#08090c', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '2px solid #1c2030', borderTop: '2px solid #ffa116', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#2e3448', fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Loading…</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#08090c; --s1:#0e1016; --s2:#13151d; --s3:#181c26;
          --b1:#1c2030; --b2:#242a3a;
          --tx:#dde3f0; --mu:#5c6580; --di:#2e3448;
          --ac:#ffa116; --as:rgba(255,161,22,0.1);
          --gr:#2dba6e; --rd:#f04f4f; --bl:#4b8ef0; --pu:#8b5cf6;
          --r:7px; --r2:10px;
          font-family:'Outfit',system-ui,sans-serif;
        }
        .cm-root { background:var(--bg); color:var(--tx); height:100vh; display:flex; flex-direction:column; overflow:hidden; }
        .cm-root.is-fullscreen { position:fixed; inset:0; z-index:1000; }

        /* TOPBAR */
    .cm-topbar { height:48px; background:var(--s1); border-bottom:1px solid var(--b1); display:flex; align-items:center; justify-content:space-between; padding:0 26px; flex-shrink:0; z-index:200; position:relative; }
.cm-logo-img { width:34px; height:34px; object-fit:contain; flex-shrink:0; }
        .cm-back-btn { display:inline-flex; align-items:center; gap:5px; background:var(--s3); color:var(--mu); border:1px solid var(--b1); border-radius:var(--r); cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:11px; font-weight:700; padding:6px 11px; transition:all 0.15s; text-decoration:none; }
        .cm-back-btn:hover { color:var(--tx); border-color:var(--b2); }
        .cm-contest-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(139,92,246,0.1); color:#a78bfa; border:1px solid rgba(139,92,246,0.2); border-radius:20px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; padding:3px 10px; letter-spacing:0.5px; }
        .cm-dq-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(240,79,79,0.1); color:#f87171; border:1px solid rgba(240,79,79,0.25); border-radius:20px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; padding:3px 10px; letter-spacing:0.5px; }
        .cm-top-center { position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; }
        .cm-prob-title { font-size:13px; font-weight:700; color:var(--tx); max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cm-diff-pill { font-size:9px; font-weight:800; padding:2px 9px; border-radius:20px; text-transform:uppercase; letter-spacing:0.6px; border:1px solid; font-family:'JetBrains Mono',monospace; }
        .cm-timer { display:flex; align-items:center; gap:5px; background:var(--s3); border:1px solid var(--b2); border-radius:6px; padding:3px 9px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--mu); }
        .cm-timer-dot { width:5px; height:5px; border-radius:50%; background:#a78bfa; animation:pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .cm-top-right { display:flex; align-items:center; gap:6px; }
        .cm-sep { width:1px; height:18px; background:var(--b2); }
        .cm-run-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; background:var(--s3); color:var(--mu); border:1px solid var(--b2); border-radius:var(--r); cursor:pointer; transition:all 0.15s; flex-shrink:0; }
        .cm-run-icon-btn:hover:not(:disabled) { color:var(--ac); border-color:rgba(255,161,22,0.4); background:rgba(255,161,22,0.06); }
        .cm-run-icon-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .cm-play-icon { width:0; height:0; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:9px solid currentColor; margin-left:2px; flex-shrink:0; }
        .cm-btn-submit { display:inline-flex; align-items:center; gap:6px; background:var(--ac); color:#000; border:none; border-radius:var(--r); cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:12px; font-weight:800; padding:0 16px; height:34px; transition:all 0.15s; }
        .cm-btn-submit:hover:not(:disabled) { background:#ffb347; transform:translateY(-1px); box-shadow:0 6px 16px rgba(255,161,22,0.25); }
        .cm-btn-submit:disabled { opacity:0.35; cursor:not-allowed; }
        .cm-btn-submit.dq { background:var(--s3); color:var(--rd); border:1px solid rgba(240,79,79,0.3); }
        .cm-btn-submit.dq:hover:not(:disabled) { background:var(--s3); transform:none; box-shadow:none; }
        .cm-upload-icon { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-bottom:8px solid #000; flex-shrink:0; }
        .cm-btn-submit.dq .cm-upload-icon { border-bottom-color: var(--rd); }
        .cm-spinner { width:11px; height:11px; border:2px solid rgba(0,0,0,0.2); border-top-color:#000; border-radius:50%; animation:cm-spin 0.65s linear infinite; flex-shrink:0; }
        .cm-spinner-light { width:11px; height:11px; border:2px solid rgba(255,255,255,0.15); border-top-color:var(--mu); border-radius:50%; animation:cm-spin 0.65s linear infinite; flex-shrink:0; }
        @keyframes cm-spin { to{transform:rotate(360deg);} }

        /* BODY */
        .cm-body { flex:1; display:flex; overflow:hidden; }

        /* LEFT */
        .cm-left { width:43%; min-width:340px; display:flex; flex-direction:column; border-right:1px solid var(--b1); background:var(--s1); overflow:hidden; flex-shrink:0; transition:width 0.2s ease, opacity 0.2s ease; }
        .cm-left.is-hidden { width:0; min-width:0; opacity:0; pointer-events:none; border-right:none; }
        .cm-tabs { display:flex; align-items:flex-end; background:var(--s1); border-bottom:1px solid var(--b1); padding:0 4px; flex-shrink:0; overflow-x:auto; gap:2px; }
        .cm-tabs::-webkit-scrollbar { display:none; }
        .cm-tab { background:none; border:none; cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:11px; font-weight:600; color:var(--di); padding:9px 10px 8px; border-bottom:2px solid transparent; white-space:nowrap; transition:color 0.14s; }
        .cm-tab:hover { color:var(--mu); }
        .cm-tab.active { color:var(--ac); border-bottom-color:var(--ac); }
        .cm-scroll { flex:1; overflow-y:auto; padding:22px 20px; }
        .cm-scroll::-webkit-scrollbar { width:3px; }
        .cm-scroll::-webkit-scrollbar-thumb { background:var(--b2); border-radius:2px; }
        .cm-prob-h1 { font-size:19px; font-weight:800; letter-spacing:-0.5px; margin-bottom:10px; line-height:1.25; }
        .cm-badges { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:18px; }
        .cm-tag { font-size:9px; font-family:'JetBrains Mono',monospace; color:var(--mu); background:var(--s2); border:1px solid var(--b1); padding:2px 8px; border-radius:20px; }
        .cm-desc { font-size:12px; line-height:1.9; color:#7e92b0; white-space:pre-wrap; font-family:'JetBrains Mono',monospace; }
        .cm-hr { height:1px; background:var(--b1); margin:18px 0; }
        .cm-ex-title { font-size:9.5px; font-weight:700; color:var(--di); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:12px; font-family:'JetBrains Mono',monospace; }
        .cm-example { background:var(--bg); border:1px solid var(--b1); border-left:2px solid var(--b2); padding:12px 14px; margin-bottom:8px; transition:border-left-color 0.15s; }
        .cm-example:hover { border-left-color:var(--ac); }
        .cm-ex-label { font-size:9px; font-weight:700; color:var(--di); letter-spacing:0.8px; text-transform:uppercase; font-family:'JetBrains Mono',monospace; margin-bottom:8px; }
        .cm-ex-row { font-family:'JetBrains Mono',monospace; font-size:11px; line-height:1.8; color:var(--mu); }
        .cm-ex-row span { color:var(--tx); }
        .cm-ex-expl { font-size:10px; color:var(--di); margin-top:6px; padding-top:6px; border-top:1px solid var(--b1); font-family:'JetBrains Mono',monospace; font-style:italic; }

        /* DISQUALIFIED STRIP */
        .cm-dq-strip { display:flex; align-items:center; gap:8px; background:rgba(240,79,79,0.06); border-bottom:1px solid rgba(240,79,79,0.2); padding:8px 16px; flex-shrink:0; }
        .cm-dq-strip-text { font-size:11px; color:#f8a8a8; font-family:'JetBrains Mono',monospace; }

        /* RIGHT */
        .cm-right { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; background:var(--bg); }
        .cm-lang-bar { display:flex; align-items:center; justify-content:space-between; padding:7px 14px; background:var(--s1); border-bottom:1px solid var(--b1); flex-shrink:0; flex-wrap:wrap; gap:8px; }
        .cm-lang-pills { display:flex; gap:3px; }
        .cm-lang-pill { display:inline-flex; align-items:center; gap:6px; background:none; border:1px solid var(--b1); border-radius:5px; cursor:pointer; padding:3px 11px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; color:var(--di); transition:all 0.14s; }
        .cm-lang-pill:hover { border-color:var(--b2); color:var(--mu); }
        .cm-lang-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; opacity:0.55; transition:opacity 0.14s; }
        .cm-lang-pill.active .cm-lang-dot { opacity:1; box-shadow:0 0 6px currentColor; }
        .cm-tool-row { display:flex; align-items:center; gap:5px; }
        .cm-tbtn { display:inline-flex; align-items:center; gap:3px; background:none; border:1px solid var(--b1); border-radius:5px; cursor:pointer; color:var(--di); font-size:10px; font-weight:700; padding:3px 8px; font-family:'JetBrains Mono',monospace; transition:all 0.12s; }
        .cm-tbtn:hover { color:var(--mu); border-color:var(--b2); }
        .cm-tbtn.active { color:var(--ac); border-color:rgba(255,161,22,0.3); background:var(--as); }
        .cm-save-status { font-size:10px; font-family:'JetBrains Mono',monospace; transition:opacity 0.3s; min-width:42px; text-align:right; }
        .cm-save-saving { color:var(--mu); }
        .cm-save-saved  { color:var(--gr); }
        .cm-resize { height:5px; cursor:row-resize; background:var(--b1); flex-shrink:0; position:relative; transition:background 0.14s; }
        .cm-resize:hover { background:rgba(255,161,22,0.08); }
        .cm-resize::after { content:''; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:22px; height:2px; background:var(--b2); border-radius:2px; }
        .cm-right-tabs { display:flex; background:var(--s1); border-bottom:1px solid var(--b1); padding:0 4px; flex-shrink:0; }
        .cm-action-bar { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; background:var(--s1); border-top:1px solid var(--b1); flex-shrink:0; }
        .cm-action-left { display:flex; align-items:center; gap:6px; }
        .cm-action-right { display:flex; align-items:center; gap:6px; }
        .cm-console-btn { display:inline-flex; align-items:center; gap:5px; background:var(--s2); color:var(--mu); border:1px solid var(--b1); border-radius:var(--r); cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:11px; font-weight:700; padding:6px 12px; transition:all 0.14s; }
        .cm-console-btn:hover { color:var(--tx); border-color:var(--b2); }
        .cm-kbd { font-size:9px; background:var(--s2); border:1px solid var(--b2); color:var(--di); padding:1px 4px; border-radius:3px; font-family:'JetBrains Mono',monospace; }
        .cm-reset-btn { display:inline-flex; align-items:center; gap:4px; background:none; color:var(--di); border:1px solid var(--b1); border-radius:6px; cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:10px; font-weight:700; padding:5px 10px; transition:all 0.14s; }
        .cm-reset-btn:hover { color:var(--rd); border-color:rgba(240,79,79,0.3); background:rgba(240,79,79,0.06); }
        .cm-panel { flex:1; overflow-y:auto; padding:20px 18px; }
        .cm-panel::-webkit-scrollbar { width:3px; }
        .cm-panel::-webkit-scrollbar-thumb { background:var(--b2); border-radius:2px; }
        .cm-section-title { font-size:9.5px; font-weight:700; color:var(--di); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:16px; font-family:'JetBrains Mono',monospace; }
        .cm-status-banner { display:flex; align-items:center; gap:10px; padding:13px 16px; border-radius:var(--r2); margin-bottom:16px; border:1px solid; }
        .cm-status-banner.ok  { background:rgba(45,186,110,0.07); border-color:rgba(45,186,110,0.2); }
        .cm-status-banner.err { background:rgba(240,79,79,0.07);  border-color:rgba(240,79,79,0.2);  }
        .cm-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .cm-status-text { font-size:17px; font-weight:800; letter-spacing:-0.3px; }
        .cm-status-banner.ok  .cm-status-text { color:var(--gr); }
        .cm-status-banner.err .cm-status-text { color:var(--rd); }
        .cm-tc-list { display:flex; flex-direction:column; gap:7px; }
        .cm-tc-card { background:var(--s1); border:1px solid var(--b1); border-left:2px solid var(--b2); border-radius:var(--r); padding:11px 13px; font-family:'JetBrains Mono',monospace; font-size:11px; transition:border-left-color 0.14s; }
        .cm-tc-card.pass { border-left-color:var(--gr); }
        .cm-tc-card.fail { border-left-color:var(--rd); }
        .cm-tc-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cm-tc-num { color:var(--di); font-size:9px; letter-spacing:0.5px; text-transform:uppercase; }
        .cm-tc-verdict { font-size:10px; font-weight:700; }
        .cm-tc-verdict.p { color:var(--gr); }
        .cm-tc-verdict.f { color:var(--rd); }
        .cm-tc-row { color:var(--mu); margin-bottom:3px; line-height:1.6; font-size:11px; }
        .cm-tc-row span { color:var(--tx); }
        .cm-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:12px; text-align:center; padding:40px; }
        .cm-empty-icon { width:48px; height:48px; background:var(--s2); border:1px solid var(--b2); border-radius:var(--r2); display:flex; align-items:center; justify-content:center; font-size:20px; }
        .cm-empty-title { font-size:13px; font-weight:600; color:var(--mu); }
        .cm-empty-sub { font-size:11px; color:var(--di); font-family:'JetBrains Mono',monospace; }

        /* SUBMIT SUCCESS — shown on a normal (non-disqualified) submit */
        .cm-submit-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:18px; text-align:center; padding:40px; }
        .cm-submit-icon-ring {
          width:64px; height:64px; border-radius:50%;
          background:rgba(45,186,110,0.1); border:1px solid rgba(45,186,110,0.28);
          display:flex; align-items:center; justify-content:center; font-size:28px;
          box-shadow:0 0 0 8px rgba(45,186,110,0.05);
        }
        .cm-submit-icon-ring.dq {
          background:rgba(240,79,79,0.1); border-color:rgba(240,79,79,0.28);
          box-shadow:0 0 0 8px rgba(240,79,79,0.05);
        }
        .cm-submit-title { font-size:17px; font-weight:800; color:var(--gr); letter-spacing:-0.3px; }
        .cm-submit-title.dq { color:var(--rd); }
        .cm-submit-sub { font-size:11.5px; color:var(--mu); font-family:'JetBrains Mono',monospace; }
        .cm-submit-redirect { display:flex; align-items:center; gap:8px; font-size:10.5px; color:var(--di); font-family:'JetBrains Mono',monospace; letter-spacing:0.3px; }
        .cm-submit-dot { width:5px; height:5px; border-radius:50%; background:var(--gr); animation:pulse 1s ease-in-out infinite; }
        .cm-submit-back-btn { display:inline-flex; align-items:center; gap:6px; background:var(--s3); color:var(--tx); border:1px solid var(--b2); border-radius:var(--r); cursor:pointer; font-family:'Outfit',system-ui,sans-serif; font-size:12px; font-weight:700; padding:8px 16px; margin-top:4px; }
        .cm-submit-back-btn:hover { border-color:rgba(240,79,79,0.35); color:var(--rd); }
        .cm-submitting { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:16px; }
        .cm-submitting-text { font-size:12px; color:var(--mu); font-family:'JetBrains Mono',monospace; letter-spacing:0.3px; }
        .cm-spinner-big { width:30px; height:30px; border:2.5px solid var(--b2); border-top-color:var(--ac); border-radius:50%; animation:cm-spin 0.7s linear infinite; }
      `}</style>

      <div className={`cm-root${isFullscreen ? ' is-fullscreen' : ''}`}>

        {/* ── TOPBAR ── */}
        <div className="cm-topbar">
          <div className="cm-logo">
  <img src={mylogo} alt="CodeMaster logo" className="cm-logo-img" />
</div>

          {problem && (
            <div className="cm-top-center">
              <span className="cm-contest-badge">◈ Contest</span>
              <span style={{ color: 'var(--di)' }}>·</span>
              <span className="cm-prob-title">{problem.title}</span>
              {problem.difficulty && (
                <span className="cm-diff-pill" style={{ color: dc.color, background: dc.bg, borderColor: dc.border }}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              )}
              {disqualified && <span className="cm-dq-badge">⛔ Disqualified</span>}
              <div className="cm-timer">
                <div className="cm-timer-dot" />
                {formatTime(elapsedTime)}
              </div>
            </div>
          )}

          <div className="cm-top-right">
            <button className="cm-back-btn" onClick={() => navigate(`/contest/${contestId}`)}>
              ← Back
            </button>
            <div className="cm-sep" />
            <button className="cm-run-icon-btn" onClick={handleRun} disabled={loading} title="Run (Ctrl+Enter)">
              {loading ? <span className="cm-spinner-light" /> : <div className="cm-play-icon" />}
            </button>
            <button
              className={`cm-btn-submit${disqualified ? ' dq' : ''}`}
              onClick={handleSubmitCode}
              disabled={submitting}
              title={disqualified ? 'You are disqualified and can no longer submit' : undefined}
            >
              {submitting ? <span className="cm-spinner" /> : <div className="cm-upload-icon" />}
              {disqualified ? 'Disqualified' : 'Submit'}
            </button>
          </div>
        </div>

        {/* ── DISQUALIFIED STRIP ── */}
        {disqualified && (
          <div className="cm-dq-strip">
            <span style={{ fontSize: 13 }}>⛔</span>
            <span className="cm-dq-strip-text">
              You've been disqualified from this contest for repeatedly leaving the tab. You can still run code, but submissions are locked.
            </span>
          </div>
        )}

        {/* ── BODY ── */}
        <div className="cm-body">

          {/* ── LEFT PANEL ── */}
          <div className={`cm-left${isFullscreen ? ' is-hidden' : ''}`}>
            <div className="cm-tabs">
              {[
                { id: 'description', label: 'Description' },
                { id: 'submissions', label: 'My Submissions' },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`cm-tab${activeLeftTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveLeftTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeLeftTab === 'description' && problem && (
              <div className="cm-scroll">
                <h1 className="cm-prob-h1">{problem.title}</h1>
                <div className="cm-badges">
                  <span className="cm-diff-pill" style={{ color: dc.color, background: dc.bg, borderColor: dc.border, padding: '3px 10px', fontSize: 9 }}>
                    {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                  </span>
                  {problem.tags && <span className="cm-tag">{problem.tags}</span>}
                </div>
                <div className="cm-desc">{problem.description}</div>
                {problem.visibleTestCases?.length > 0 && (
                  <>
                    <div className="cm-hr" />
                    <div className="cm-ex-title">Examples</div>
                    {problem.visibleTestCases.map((ex, i) => (
                      <div key={i} className="cm-example">
                        <div className="cm-ex-label">Example {i + 1}</div>
                        <div className="cm-ex-row">Input: <span>{ex.input}</span></div>
                        <div className="cm-ex-row">Output: <span>{ex.output}</span></div>
                        {ex.explanation && <div className="cm-ex-expl">// {ex.explanation}</div>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeLeftTab === 'submissions' && (
              <div className="cm-scroll">
                <div className="cm-section-title">My Contest Submissions</div>
                <div style={{ color: 'var(--mu)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                  Submit your solution and results will appear here.
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="cm-right">
            <div className="cm-right-tabs">
              {[
                { id: 'code',     label: '{ } Code' },
                { id: 'testcase', label: '▶ Test Results' },
                { id: 'result',   label: '↑ Submission' },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`cm-tab${activeRightTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveRightTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── CODE TAB ── */}
            {activeRightTab === 'code' && (
              <>
                <div className="cm-lang-bar">
                  <div className="cm-lang-pills">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        className={`cm-lang-pill${selectedLanguage === lang.id ? ' active' : ''}`}
                        style={selectedLanguage === lang.id ? { color: lang.color, borderColor: `${lang.color}55`, background: `${lang.color}14` } : undefined}
                        onClick={() => setSelectedLanguage(lang.id)}
                      >
                        <span className="cm-lang-dot" style={{ background: lang.color, color: lang.color }} />
                        {lang.label}
                      </button>
                    ))}
                  </div>
                  <div className="cm-tool-row">
                    <button className={`cm-tbtn${copied ? ' active' : ''}`} onClick={handleCopy}>
                      {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    <button className="cm-tbtn" onClick={() => changeFontSize(-1)}>A−</button>
                    <span style={{ fontSize: 10, color: 'var(--di)', fontFamily: 'monospace' }}>{fontSize}</span>
                    <button className="cm-tbtn" onClick={() => changeFontSize(1)}>A+</button>
                    <button className="cm-tbtn" onClick={toggleTheme} title="Toggle editor theme">
                      {editorTheme === 'vs-dark' ? '◐ Dark' : '◑ Light'}
                    </button>
                    <button className={`cm-tbtn${isFullscreen ? ' active' : ''}`} onClick={() => setIsFullscreen((v) => !v)} title="Toggle fullscreen (Esc to exit)">
                      {isFullscreen ? '⤡ Exit' : '⤢ Full'}
                    </button>
                    <span className={`cm-save-status ${saveStatus === 'saving' ? 'cm-save-saving' : saveStatus === 'saved' ? 'cm-save-saved' : ''}`}>
                      {saveStatus === 'saving' ? '● saving' : saveStatus === 'saved' ? '✓ saved' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ height: isFullscreen ? 'calc(100vh - 160px)' : `${editorHeight}px`, flexShrink: 0, overflow: 'hidden' }}>
                  <Editor
                    height="100%"
                    language={getMonacoLang(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme={editorTheme}
                    options={{
                      fontSize,
                      minimap: { enabled: isFullscreen },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontLigatures: true,
                      padding: { top: 14, bottom: 14 },
                      cursorBlinking: 'smooth',
                      smoothScrolling: true,
                    }}
                  />
                </div>

                {!isFullscreen && <div className="cm-resize" onMouseDown={startResize} />}

                <div className="cm-action-bar">
                  <div className="cm-action-left">
                    <button className="cm-console-btn" onClick={() => setActiveRightTab('testcase')}>
                      &gt;_ Console
                    </button>
                    <span className="cm-kbd">Ctrl+Enter</span>
                    <span style={{ fontSize: 9, color: 'var(--di)', fontFamily: 'monospace' }}>to run</span>
                  </div>
                  <div className="cm-action-right">
                    <button className="cm-reset-btn" onClick={handleReset}>↺ Reset</button>
                    <div className="cm-sep" />
                    <button className="cm-run-icon-btn" onClick={handleRun} disabled={loading} title="Run">
                      {loading ? <span className="cm-spinner-light" /> : <div className="cm-play-icon" />}
                    </button>
                    <button
                      className={`cm-btn-submit${disqualified ? ' dq' : ''}`}
                      onClick={handleSubmitCode}
                      disabled={submitting}
                      style={{ height: 32, fontSize: 11, padding: '0 14px' }}
                      title={disqualified ? 'You are disqualified and can no longer submit' : undefined}
                    >
                      {submitting ? <span className="cm-spinner" /> : <div className="cm-upload-icon" />}
                      {disqualified ? 'Disqualified' : 'Submit'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── TESTCASE TAB (Run) — full detail kept ── */}
            {activeRightTab === 'testcase' && (
              <div className="cm-panel">
                <div className="cm-section-title">Test Results</div>
                {runResult ? (
                  <>
                    <div className={`cm-status-banner ${runResult.success ? 'ok' : 'err'}`}>
                      <div className="cm-status-dot" style={{ background: runResult.success ? 'var(--gr)' : 'var(--rd)', boxShadow: `0 0 8px ${runResult.success ? 'rgba(45,186,110,0.5)' : 'rgba(240,79,79,0.5)'}` }} />
                      <span className="cm-status-text">{runResult.success ? '✓ All Tests Passed' : '✗ Some Tests Failed'}</span>
                    </div>
                    <div className="cm-tc-list">
                      {runResult.testCases?.map((tc, i) => {
                        const passed = tc.status_id === 3;
                        return (
                          <div key={i} className={`cm-tc-card ${passed ? 'pass' : 'fail'}`}>
                            <div className="cm-tc-head">
                              <span className="cm-tc-num">Case {i + 1}</span>
                              <span className={`cm-tc-verdict ${passed ? 'p' : 'f'}`}>{passed ? '✓ Passed' : '✗ Failed'}</span>
                            </div>
                            <div className="cm-tc-row">Input: <span>{tc.stdin}</span></div>
                            <div className="cm-tc-row">Expected: <span>{tc.expected_output}</span></div>
                            <div className="cm-tc-row">Output: <span>{tc.stdout}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="cm-empty">
                    <div className="cm-empty-icon">▶</div>
                    <div className="cm-empty-title">No results yet</div>
                    <div className="cm-empty-sub">Press Run or Ctrl+Enter</div>
                  </div>
                )}
              </div>
            )}

            {/* ── RESULT TAB (Submit) ── */}
            {activeRightTab === 'result' && (
              <div className="cm-panel" style={{ height: '100%' }}>
                {submitting ? (
                  <div className="cm-submitting">
                    <div className="cm-spinner-big" />
                    <div className="cm-submitting-text">Submitting your code…</div>
                  </div>
                ) : submitResult?.disqualified ? (
                  <div className="cm-submit-wrap">
                    <div className="cm-submit-icon-ring dq">⛔</div>
                    <div>
                      <div className="cm-submit-title dq">Submission Blocked</div>
                      <div className="cm-submit-sub" style={{ marginTop: 6 }}>
                        You've been disqualified from this contest and can no longer submit.
                      </div>
                    </div>
                    <button className="cm-submit-back-btn" onClick={() => navigate(`/contest/${contestId}`)}>
                      ← Back to contest
                    </button>
                  </div>
                ) : submitResult?.submitted ? (
                  <div className="cm-submit-wrap">
                    <div className="cm-submit-icon-ring">✓</div>
                    <div>
                      <div className="cm-submit-title">Code Submitted Successfully!</div>
                      <div className="cm-submit-sub" style={{ marginTop: 6 }}>Your solution has been recorded for this contest.</div>
                    </div>
                    <div className="cm-submit-redirect">
                      <span className="cm-submit-dot" />
                      Redirecting to contest…
                    </div>
                  </div>
                ) : (
                  <div className="cm-empty">
                    <div className="cm-empty-icon">↑</div>
                    <div className="cm-empty-title">No submission yet</div>
                    <div className="cm-empty-sub">Click Submit to evaluate</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ViolationModal data={violationModal} onClose={() => setViolationModal(null)} />
    </>
  );
};

export default ContestProblemEditor;