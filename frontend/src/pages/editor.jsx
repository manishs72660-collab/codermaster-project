import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from '../component/subbsion';
import CodeBoard from '../component/whiteboard';
import ChatAi from '../component/chatai';

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  console.log(problem);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const editorRef = useRef(null);
  let { problemId } = useParams();
  const [editorHeight, setEditorHeight] = useState(420);

  const startResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = editorHeight;
    const onMouseMove = (event) => {
      const newHeight = startHeight + (event.clientY - startY);
      const clampedHeight = Math.max(150, Math.min(window.innerHeight * 0.8, newHeight));
      setEditorHeight(clampedHeight);
      if (editorRef.current) {
        editorRef.current.layout({ width: editorRef.current.getLayoutInfo().width, height: clampedHeight });
      }
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { handleSubmit } = useForm();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/${problemId}`);
        const initialCode = response.data.startCode.find((sc) => {
          if (sc.language == "C++" && selectedLanguage == 'cpp') return true;
          else if (sc.language == "Java" && selectedLanguage == 'java') return true;
          else if (sc.language == "Javascript" && selectedLanguage == 'javascript') return true;
          return false;
        })?.initialCode || '';
        setProblem(response.data);
        setCode(initialCode);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === selectedLanguage)?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => setCode(value || '');
  const handleEditorDidMount = (editor) => { editorRef.current = editor; };

  useEffect(() => {
    const timer = setTimeout(() => { if (editorRef.current) editorRef.current.layout(); }, 0);
    return () => clearTimeout(timer);
  }, [editorHeight]);

  const handleLanguageChange = (language) => setSelectedLanguage(language);

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/code/runcode/${problemId}`, { code, language: selectedLanguage });
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      setRunResult({ success: false, error: 'Internal server error' });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/code/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  if (loading && !problem) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#0e1117', flexDirection: 'column', gap: 18
      }}>
        <div style={{
          width: 44, height: 44,
          border: '3px solid #1c2535',
          borderTop: '3px solid #ffa116',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{
          color: '#4a5568', fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: 3, textTransform: 'uppercase'
        }}>Loading…</span>
      </div>
    );
  }

  const diffMap = {
    easy:   { color: '#3fb950', bg: 'rgba(63,185,80,0.1)',   border: 'rgba(63,185,80,0.25)' },
    medium: { color: '#d29922', bg: 'rgba(210,153,34,0.1)',  border: 'rgba(210,153,34,0.25)' },
    hard:   { color: '#f85149', bg: 'rgba(248,81,73,0.1)',   border: 'rgba(248,81,73,0.25)' },
  };
  const diff = problem?.difficulty?.toLowerCase();
  const dc = diffMap[diff] || diffMap.medium;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #0e1117;
          --surface:   #161b22;
          --surface2:  #1c2130;
          --surface3:  #1f2937;
          --border:    #21262d;
          --border2:   #30363d;
          --text:      #e6edf3;
          --text-muted:#7d8590;
          --text-dim:  #484f58;
          --accent:    #ffa116;
          --accent-dim:#cc7a00;
          --accent-glow: rgba(255,161,22,0.18);
          --accent-soft: rgba(255,161,22,0.07);
          --green:     #3fb950;
          --green-bg:  rgba(63,185,80,0.09);
          --red:       #f85149;
          --red-bg:    rgba(248,81,73,0.09);
          --blue:      #388bfd;
          --blue-bg:   rgba(56,139,253,0.09);
          --yellow:    #d29922;
          --r:         8px;
          --r2:        12px;
          font-family: 'Outfit', system-ui, sans-serif;
        }

        /* ─── ROOT ─── */
        .lc-root {
          background: var(--bg);
          color: var(--text);
          height: 100vh;
          display: flex; flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Subtle scanline texture */
        .lc-root::after {
          content: '';
          position: fixed; inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          );
          pointer-events: none; z-index: 0;
        }

        /* ─── TOPBAR ─── */
        .lc-topbar {
          height: 52px;
          background: rgba(22,27,34,0.97);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px;
          flex-shrink: 0; z-index: 200; position: relative;
        }
        /* accent glow line under topbar */
        .lc-topbar::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, var(--accent-glow) 40%, var(--accent-glow) 60%, transparent 100%);
        }

        .lc-logo { display: flex; align-items: center; gap: 10px; }
        .lc-logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #ffa116 0%, #ff6b00 100%);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: #0e1117;
          box-shadow: 0 0 18px rgba(255,161,22,0.4);
          flex-shrink: 0;
        }
        .lc-logo-name {
          font-size: 17px; font-weight: 800; letter-spacing: -0.4px;
          background: linear-gradient(120deg, #e6edf3 20%, #ffa116 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* center: problem breadcrumb */
        .lc-topbar-center {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
        }
        .lc-prob-crumb {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--text-dim);
        }
        .lc-prob-name {
          font-size: 13px; font-weight: 600; color: var(--text);
          max-width: 280px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .lc-diff-pill {
          padding: 2px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.6px; text-transform: uppercase;
          border: 1px solid;
        }

        /* top-right actions */
        .lc-topbar-right { display: flex; align-items: center; gap: 8px; }

        /* ─── BUTTONS ─── */
        .lc-btn {
          display: inline-flex; align-items: center; gap: 6px;
          border: none; cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 12px; font-weight: 700; padding: 7px 18px;
          border-radius: var(--r); transition: all 0.16s;
          letter-spacing: 0.3px; position: relative; overflow: hidden;
          white-space: nowrap;
        }
        .lc-btn:disabled { opacity: 0.38; cursor: not-allowed; }

        .lc-btn-run {
          background: var(--surface2);
          color: var(--text-muted);
          border: 1px solid var(--border2);
        }
        .lc-btn-run:hover:not(:disabled) {
          background: var(--surface3);
          color: var(--text); border-color: var(--accent);
          box-shadow: 0 0 14px var(--accent-glow);
        }

        .lc-btn-submit {
          background: linear-gradient(135deg, #ffa116 0%, #e08a00 100%);
          color: #0e1117; border: 1px solid transparent;
          box-shadow: 0 4px 16px rgba(255,161,22,0.3);
        }
        .lc-btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ffb347 0%, #ffa116 100%);
          box-shadow: 0 6px 22px rgba(255,161,22,0.45);
          transform: translateY(-1px);
        }
        .lc-btn-submit:active:not(:disabled) { transform: translateY(0); }

        .lc-btn-ghost {
          background: transparent; color: var(--text-muted);
          border: 1px solid var(--border);
        }
        .lc-btn-ghost:hover:not(:disabled) {
          background: var(--surface2); color: var(--text);
          border-color: var(--border2);
        }

        /* AI & Board floating buttons */
        .lc-fab {
          display: inline-flex; align-items: center; gap: 7px;
          border: none; cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 11.5px; font-weight: 700; padding: 6px 14px;
          border-radius: var(--r); transition: all 0.16s;
          letter-spacing: 0.2px;
        }
        .lc-fab-ai {
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          color: #fff; border: 1px solid rgba(124,58,237,0.4);
          box-shadow: 0 4px 14px rgba(124,58,237,0.3);
        }
        .lc-fab-ai:hover { box-shadow: 0 6px 20px rgba(124,58,237,0.5); transform: translateY(-1px); }

        .lc-fab-board {
          background: var(--surface2);
          color: var(--text-muted); border: 1px solid var(--border2);
        }
        .lc-fab-board:hover {
          background: var(--surface3); color: var(--text);
          border-color: var(--blue); box-shadow: 0 0 12px var(--blue-bg);
        }

        .lc-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: currentColor;
          border-radius: 50%; animation: lc-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes lc-spin { to { transform: rotate(360deg); } }

        /* ─── BODY ─── */
        .lc-body { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 1; }

        /* ─── LEFT PANEL ─── */
        .lc-left {
          width: 44%; min-width: 360px;
          display: flex; flex-direction: column;
          border-right: 1px solid var(--border);
          background: var(--surface);
          overflow: hidden;
        }

        /* ─── TABS ─── */
        .lc-tabs {
          display: flex; align-items: flex-end;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 6px; flex-shrink: 0;
          overflow-x: auto; gap: 2px;
        }
        .lc-tabs::-webkit-scrollbar { display: none; }

        .lc-tab {
          background: none; border: none; cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text-dim);
          padding: 10px 12px 9px;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .lc-tab:hover { color: var(--text-muted); }
        .lc-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

        /* ─── SCROLL ─── */
        .lc-scroll { flex: 1; overflow-y: auto; padding: 26px 22px; }
        .lc-scroll::-webkit-scrollbar { width: 4px; }
        .lc-scroll::-webkit-scrollbar-track { background: transparent; }
        .lc-scroll::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        /* ─── PROBLEM TITLE ─── */
        .lc-prob-h1 {
          font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
          margin-bottom: 12px; line-height: 1.25; color: var(--text);
        }
        .lc-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
        .lc-badge-tag {
          background: var(--surface2); color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 2px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.3px;
        }

        /* ─── DESC ─── */
        .lc-desc {
          font-size: 13px; line-height: 1.9;
          color: #9ab0c8; white-space: pre-wrap;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 400;
        }

        .lc-hr { height: 1px; background: var(--border); margin: 22px 0; }

        /* ─── EXAMPLES ─── */
        .lc-ex-title {
          font-size: 10.5px; font-weight: 700; color: var(--text-dim);
          letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px;
        }
        .lc-example {
          background: #0d1117;
          border: 1px solid var(--border);
          border-left: 3px solid var(--border2);
          border-radius: var(--r2);
          padding: 14px 16px; margin-bottom: 10px;
          position: relative; transition: border-left-color 0.2s, border-color 0.2s;
        }
        .lc-example:hover { border-left-color: var(--accent); border-color: var(--border2); }
        .lc-ex-label {
          font-size: 10px; font-weight: 700; color: var(--text-dim);
          letter-spacing: 0.8px; text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace; margin-bottom: 10px;
        }
        .lc-ex-row {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.8; color: var(--text-muted);
        }
        .lc-ex-row span { color: var(--text); }
        .lc-ex-expl {
          font-size: 11px; color: var(--text-dim); margin-top: 8px;
          padding-top: 8px; border-top: 1px solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-style: italic;
        }

        /* ─── CODE BLOCK ─── */
        .lc-code-block {
          background: #0d1117; border: 1px solid var(--border);
          border-radius: var(--r2); overflow: hidden; margin-bottom: 12px;
        }
        .lc-code-block-hdr {
          background: var(--surface2); padding: 9px 14px;
          font-size: 11px; font-weight: 600; color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .lc-code-lang-badge {
          background: var(--accent-soft); color: var(--accent);
          border: 1px solid rgba(255,161,22,0.25);
          padding: 2px 8px; border-radius: 5px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
        }
        .lc-code-block pre {
          padding: 16px; font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.7; color: #c9d1d9; overflow-x: auto;
        }

        /* ─── RIGHT PANEL ─── */
        .lc-right {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; min-width: 0;
          background: var(--bg);
        }

        /* ─── LANG BAR ─── */
        .lc-lang-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-lang-pills { display: flex; gap: 4px; }
        .lc-lang-pill {
          background: none; border: 1px solid var(--border);
          border-radius: 6px; cursor: pointer; padding: 4px 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          color: var(--text-dim); transition: all 0.15s;
        }
        .lc-lang-pill:hover { border-color: var(--border2); color: var(--text-muted); }
        .lc-lang-pill.active {
          background: var(--accent-soft); color: var(--accent);
          border-color: rgba(255,161,22,0.35);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        /* ─── ACTION BAR ─── */
        .lc-action-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-action-left { display: flex; align-items: center; gap: 6px; }
        .lc-action-right { display: flex; align-items: center; gap: 8px; }

        /* ─── RESIZE HANDLE ─── */
        .lc-resize {
          height: 6px; cursor: row-resize;
          background: var(--border);
          flex-shrink: 0; position: relative;
          transition: background 0.15s;
        }
        .lc-resize:hover { background: rgba(255,161,22,0.15); }
        .lc-resize::after {
          content: '';
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 28px; height: 3px; border-radius: 2px;
          background: var(--border2); transition: background 0.15s;
        }
        .lc-resize:hover::after { background: var(--accent); }

        /* ─── PANEL (test/result) ─── */
        .lc-panel { flex: 1; overflow-y: auto; padding: 22px 20px; }
        .lc-panel::-webkit-scrollbar { width: 4px; }
        .lc-panel::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        .lc-section-title {
          font-size: 10.5px; font-weight: 700; color: var(--text-dim);
          letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px;
        }

        /* ─── EMPTY STATE ─── */
        .lc-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; gap: 14px; text-align: center; padding: 40px;
        }
        .lc-empty-icon {
          width: 56px; height: 56px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: var(--r2);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
        }
        .lc-empty-title { font-size: 14px; font-weight: 600; color: var(--text-muted); }
        .lc-empty-sub { font-size: 11.5px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }

        /* ─── STATUS BANNER ─── */
        .lc-status-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 15px 18px; border-radius: var(--r2);
          margin-bottom: 18px; border: 1px solid;
        }
        .lc-status-banner.ok  { background: var(--green-bg); border-color: rgba(63,185,80,0.22); }
        .lc-status-banner.err { background: var(--red-bg);   border-color: rgba(248,81,73,0.22); }
        .lc-status-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }
        .lc-status-text { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
        .lc-status-banner.ok  .lc-status-text { color: var(--green); }
        .lc-status-banner.err .lc-status-text { color: var(--red); }

        /* ─── STATS ─── */
        .lc-stats { display: flex; gap: 10px; margin-bottom: 18px; }
        .lc-stat-card {
          flex: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r2); padding: 14px 16px;
          transition: border-color 0.2s;
        }
        .lc-stat-card:hover { border-color: var(--border2); }
        .lc-stat-label {
          font-size: 10px; color: var(--text-dim);
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px;
        }
        .lc-stat-val { font-size: 24px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
        .lc-stat-unit { font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: 3px; }

        /* ─── PASS SUMMARY ─── */
        .lc-pass-sum {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r); padding: 11px 16px; margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: var(--text-muted); display: flex; align-items: center; gap: 6px;
        }
        .lc-pass-num { font-size: 16px; font-weight: 800; }

        /* ─── TC CARDS ─── */
        .lc-tc-list { display: flex; flex-direction: column; gap: 8px; }
        .lc-tc-card {
          background: var(--surface); border: 1px solid var(--border);
          border-left: 3px solid var(--border2);
          border-radius: var(--r); padding: 12px 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          transition: border-left-color 0.15s;
        }
        .lc-tc-card.pass { border-left-color: var(--green); }
        .lc-tc-card.fail { border-left-color: var(--red); }
        .lc-tc-head {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 10px;
        }
        .lc-tc-num { color: var(--text-dim); font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
        .lc-tc-verdict { font-size: 11px; font-weight: 700; }
        .lc-tc-verdict.p { color: var(--green); }
        .lc-tc-verdict.f { color: var(--red); }
        .lc-tc-row { color: var(--text-muted); margin-bottom: 4px; line-height: 1.6; font-size: 11.5px; }
        .lc-tc-row span { color: var(--text); }

        /* ─────────────────────────────
           MODAL OVERLAY (AI + Board)
        ───────────────────────────── */
        .lc-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(9,12,17,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: lc-fadein 0.18s ease;
        }
        @keyframes lc-fadein { from { opacity: 0; } to { opacity: 1; } }

        /* AI Modal — tall, centered */
        .lc-ai-modal {
          width: min(680px, 92vw);
          height: min(740px, 88vh);
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 18px;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15);
          animation: lc-slideup 0.22s ease;
        }
        @keyframes lc-slideup {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .lc-ai-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          background: var(--surface2);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-ai-modal-title {
          display: flex; align-items: center; gap: 10px;
        }
        .lc-ai-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 14px rgba(124,58,237,0.4);
        }
        .lc-ai-label { font-size: 15px; font-weight: 800; letter-spacing: -0.3px; }
        .lc-ai-sub { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
        .lc-modal-close {
          width: 30px; height: 30px; background: var(--surface3);
          border: 1px solid var(--border2); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-muted); font-size: 14px;
          transition: all 0.15s;
        }
        .lc-modal-close:hover { background: var(--red-bg); border-color: var(--red); color: var(--red); }
        .lc-ai-body { flex: 1; overflow: hidden; }

        /* Board Modal — wide */
        .lc-board-modal {
          width: min(1060px, 95vw);
          height: min(680px, 90vh);
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 18px;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,139,253,0.12);
          animation: lc-slideup 0.22s ease;
        }
        .lc-board-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: var(--surface2);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-board-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--blue-bg);
          border: 1px solid rgba(56,139,253,0.3);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .lc-board-label { font-size: 14px; font-weight: 800; letter-spacing: -0.3px; }
        .lc-board-body { flex: 1; overflow: hidden; }

        /* ─── ANIMATIONS ─── */
        @keyframes lc-anim {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lc-anim { animation: lc-anim 0.22s ease both; }
      `}</style>

      <div className="lc-root">

        {/* ─── TOPBAR ─── */}
        <div className="lc-topbar">

          {/* Logo */}
          <div className="lc-logo">
            <div className="lc-logo-mark">⌨</div>
            <span className="lc-logo-name">CodeMaster</span>
          </div>

          {/* Centered Problem Info */}
          {problem && (
            <div className="lc-topbar-center">
              {problem.id && <span className="lc-prob-crumb">#{problem.id}</span>}
              {problem.id && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>·</span>}
              <span className="lc-prob-name">{problem.title}</span>
              {problem.difficulty && (
                <span className="lc-diff-pill" style={{ color: dc.color, background: dc.bg, borderColor: dc.border }}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              )}
            </div>
          )}

          {/* Right Actions */}
          <div className="lc-topbar-right">
            {/* AI Chat floating trigger */}
            <button className="lc-fab lc-fab-ai" onClick={() => setShowAiModal(true)}>
              <span style={{ fontSize: 14 }}>✦</span> AI Chat
            </button>
            {/* Whiteboard trigger */}
            <button className="lc-fab lc-fab-board" onClick={() => setShowBoardModal(true)}>
              <span style={{ fontSize: 13 }}>◫</span> Board
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border2)', margin: '0 4px' }} />
            {/* Run */}
            <button className="lc-btn lc-btn-run" onClick={handleRun} disabled={loading}>
              {loading ? <span className="lc-spinner" /> : (
                <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><path d="M0 0l9 5.5L0 11z"/></svg>
              )}
              Run
            </button>
            {/* Submit */}
            <button className="lc-btn lc-btn-submit" onClick={handleSubmitCode} disabled={loading}>
              {loading ? <span className="lc-spinner" style={{ borderTopColor: '#0e1117' }} /> : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L10 7H0L5 0z"/></svg>
              )}
              Submit
            </button>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="lc-body">

          {/* ─── LEFT PANEL ─── */}
          <div className="lc-left">
            {/* Tabs — no AI/Board tabs here, they are floating */}
            <div className="lc-tabs">
              {[
                { id: 'description', icon: '≡', label: 'Description' },
                { id: 'editorial',   icon: '✎', label: 'Editorial' },
                { id: 'solutions',   icon: '◈', label: 'Solutions' },
                { id: 'submissions', icon: '⊕', label: 'Submissions' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`lc-tab${activeLeftTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveLeftTab(tab.id)}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DESCRIPTION */}
            {activeLeftTab === 'description' && problem && (
              <div className="lc-scroll lc-anim">
                <h1 className="lc-prob-h1">{problem.title}</h1>
                <div className="lc-badges">
                  <span className="lc-diff-pill" style={{ color: dc.color, background: dc.bg, borderColor: dc.border, padding: '3px 10px', fontSize: 10 }}>
                    {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                  </span>
                  {problem.tags && <span className="lc-badge-tag">{problem.tags}</span>}
                </div>
                <div className="lc-desc">{problem.description}</div>
                {problem.visibleTestCases?.length > 0 && (
                  <>
                    <div className="lc-hr" />
                    <div className="lc-ex-title">Examples</div>
                    {problem.visibleTestCases.map((ex, i) => (
                      <div key={i} className="lc-example">
                        <div className="lc-ex-label">Example {i + 1}</div>
                        <div className="lc-ex-row">Input: <span>{ex.input}</span></div>
                        <div className="lc-ex-row">Output: <span>{ex.output}</span></div>
                        {ex.explanation && <div className="lc-ex-expl">// {ex.explanation}</div>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* EDITORIAL */}
            {activeLeftTab === 'editorial' && problem && (
             <div className="lc-scroll lc-anim">
  <div className="lc-section-title">Editorial</div>

  {problem?.secureUrl ? (
    <video
      width="100%"
      height="400"
      controls
      poster={problem?.thumbnailUrl}
      className="rounded-lg mt-3"
    >
      <source src={problem.secureUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  ) : (
    <div className="lc-desc">
      Editorial content for this problem will appear here.
    </div>
  )}
</div>
            )}

            {/* SOLUTIONS */}
            {activeLeftTab === 'solutions' && problem && (
              <div className="lc-scroll lc-anim">
                <div className="lc-section-title">Reference Solutions</div>
                {problem.referenceSolution?.length > 0 ? (
                  problem.referenceSolution.map((sol, i) => (
                    <div key={i} className="lc-code-block">
                      <div className="lc-code-block-hdr">
                        <span style={{ fontSize: 12 }}>{problem.title}</span>
                        <span className="lc-code-lang-badge">{sol.language}</span>
                      </div>
                      <pre><code>{sol.completeCode}</code></pre>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}>
                    Solutions unlock after solving the problem.
                  </div>
                )}
              </div>
            )}

            {/* SUBMISSIONS */}
            {activeLeftTab === 'submissions' && problem && (
              <div className="lc-scroll lc-anim">
                <div className="lc-section-title">My Submissions</div>
                <SubmissionHistory problemId={problemId} />
              </div>
            )}
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="lc-right">
            <div className="lc-tabs" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {[
                { id: 'code',     icon: '{ }', label: 'Code' },
                { id: 'testcase', icon: '▶',   label: 'Test Results' },
                { id: 'result',   icon: '↑',   label: 'Submission' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`lc-tab${activeRightTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveRightTab(tab.id)}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── CODE TAB ── */}
            {activeRightTab === 'code' && (
              <>
                <div className="lc-lang-bar">
                  <div className="lc-lang-pills">
                    {['javascript', 'cpp'].map(lang => (
                      <button
                        key={lang}
                        className={`lc-lang-pill${selectedLanguage === lang ? ' active' : ''}`}
                        onClick={() => handleLanguageChange(lang)}
                      >
                        {lang === 'cpp' ? 'C++' : 'JavaScript'}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>
                    ⇥ 2 spaces
                  </span>
                </div>

                <div style={{ height: `${editorHeight}px`, flexShrink: 0, overflow: 'hidden' }}>
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      mouseWheelZoom: true,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontLigatures: true,
                      padding: { top: 14, bottom: 14 },
                      renderLineHighlight: 'line',
                    }}
                  />
                </div>

                <div className="lc-resize" onMouseDown={startResize} />

                <div className="lc-action-bar">
                  <div className="lc-action-left">
                    <button
                      className="lc-btn lc-btn-ghost"
                      style={{ fontSize: 11, padding: '5px 12px' }}
                      onClick={() => setActiveRightTab('testcase')}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>&gt;_</span>
                      Console
                    </button>
                  </div>
                  <div className="lc-action-right">
                    <button className="lc-btn lc-btn-run" onClick={handleRun} disabled={loading}>
                      {loading ? <span className="lc-spinner" /> : (
                        <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><path d="M0 0l9 5.5L0 11z"/></svg>
                      )}
                      Run
                    </button>
                    <button className="lc-btn lc-btn-submit" onClick={handleSubmitCode} disabled={loading}>
                      {loading ? <span className="lc-spinner" style={{ borderTopColor: '#0e1117' }} /> : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L10 7H0L5 0z"/></svg>
                      )}
                      Submit
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── TESTCASE TAB ── */}
            {activeRightTab === 'testcase' && (
              <div className="lc-panel lc-anim">
                <div className="lc-section-title">Test Results</div>
                {runResult ? (
                  <>
                    <div className={`lc-status-banner ${runResult.success ? 'ok' : 'err'}`}>
                      <div className="lc-status-dot" style={{
                        background: runResult.success ? 'var(--green)' : 'var(--red)',
                        boxShadow: `0 0 10px ${runResult.success ? 'rgba(63,185,80,0.55)' : 'rgba(248,81,73,0.55)'}`,
                      }} />
                      <span className="lc-status-text">
                        {runResult.success ? '✓ All Tests Passed' : '✗ Some Tests Failed'}
                      </span>
                    </div>
                    {runResult.success && (
                      <div className="lc-stats">
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Runtime</div>
                          <div className="lc-stat-val" style={{ color: 'var(--green)' }}>
                            {runResult.runtime}<span className="lc-stat-unit">sec</span>
                          </div>
                        </div>
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Memory</div>
                          <div className="lc-stat-val" style={{ color: 'var(--blue)' }}>
                            {runResult.memory}<span className="lc-stat-unit">KB</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="lc-tc-list">
                      {runResult.testCases?.map((tc, i) => {
                        const passed = runResult.success ? true : tc.status_id === 3;
                        return (
                          <div key={i} className={`lc-tc-card ${passed ? 'pass' : 'fail'}`}>
                            <div className="lc-tc-head">
                              <span className="lc-tc-num">Case {i + 1}</span>
                              <span className={`lc-tc-verdict ${passed ? 'p' : 'f'}`}>
                                {passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </div>
                            <div className="lc-tc-row">Input: <span>{tc.stdin}</span></div>
                            <div className="lc-tc-row">Expected: <span>{tc.expected_output}</span></div>
                            <div className="lc-tc-row">Output: <span>{tc.stdout}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="lc-empty">
                    <div className="lc-empty-icon">▶</div>
                    <div className="lc-empty-title">No results yet</div>
                    <div className="lc-empty-sub">Click "Run" to test with examples</div>
                  </div>
                )}
              </div>
            )}

            {/* ── RESULT TAB ── */}
            {activeRightTab === 'result' && (
              <div className="lc-panel lc-anim">
                <div className="lc-section-title">Submission Result</div>
                {submitResult ? (
                  <>
                    <div className={`lc-status-banner ${submitResult.accepted ? 'ok' : 'err'}`}>
                      <div className="lc-status-dot" style={{
                        background: submitResult.accepted ? 'var(--green)' : 'var(--red)',
                        boxShadow: `0 0 12px ${submitResult.accepted ? 'rgba(63,185,80,0.55)' : 'rgba(248,81,73,0.55)'}`,
                      }} />
                      <span className="lc-status-text">
                        {submitResult.accepted ? '✓ Accepted' : `✗ ${submitResult.error || 'Wrong Answer'}`}
                      </span>
                    </div>
                    {submitResult.accepted && (
                      <div className="lc-stats">
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Runtime</div>
                          <div className="lc-stat-val" style={{ color: 'var(--green)' }}>
                            {submitResult.runtime}<span className="lc-stat-unit">sec</span>
                          </div>
                        </div>
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Memory</div>
                          <div className="lc-stat-val" style={{ color: 'var(--blue)' }}>
                            {submitResult.memory}<span className="lc-stat-unit">KB</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="lc-pass-sum">
                      <span>Tests passed:</span>
                      <span className="lc-pass-num" style={{ color: submitResult.accepted ? 'var(--green)' : 'var(--red)' }}>
                        {submitResult.passedTestCases}
                      </span>
                      <span>/ {submitResult.totalTestCases}</span>
                    </div>
                  </>
                ) : (
                  <div className="lc-empty">
                    <div className="lc-empty-icon">↑</div>
                    <div className="lc-empty-title">No submission yet</div>
                    <div className="lc-empty-sub">Click "Submit" to evaluate your solution</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── AI CHAT MODAL (centered overlay) ─── */}
        {showAiModal && (
          <div className="lc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
            <div className="lc-ai-modal">
              <div className="lc-ai-modal-hdr">
                <div className="lc-ai-modal-title">
                  <div className="lc-ai-icon">✦</div>
                  <div>
                    <div className="lc-ai-label">CodeMaster AI</div>
                    <div className="lc-ai-sub">Ask anything about this problem</div>
                  </div>
                </div>
                <div className="lc-modal-close" onClick={() => setShowAiModal(false)}>✕</div>
              </div>
              <div className="lc-ai-body">
                {problem && <ChatAi problem={problem} />}
              </div>
            </div>
          </div>
        )}

        {/* ─── WHITEBOARD MODAL (wide overlay) ─── */}
        {showBoardModal && (
          <div className="lc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBoardModal(false); }}>
            <div className="lc-board-modal">
              <div className="lc-board-modal-hdr">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="lc-board-icon">◫</div>
                  <span className="lc-board-label">Whiteboard</span>
                </div>
                <div className="lc-modal-close" onClick={() => setShowBoardModal(false)}>✕</div>
              </div>
              <div className="lc-board-body">
                <CodeBoard />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ProblemPage;