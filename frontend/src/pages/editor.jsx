import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from '../component/subbsion';
import CodeBoard from '../component/whiteboard';
import ChatAi from '../component/chatai';
const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();
const [editorHeight, setEditorHeight] = useState(400);

// 2. Replace your current startResize function with this
const startResize = (e) => {
  e.preventDefault();

  const startY = e.clientY;
  const startHeight = editorHeight;

  const onMouseMove = (event) => {
    const newHeight = startHeight + (event.clientY - startY);

    // Limit height between 150px and 80% of screen height
    const clampedHeight = Math.max(
      150,
      Math.min(window.innerHeight * 0.8, newHeight)
    );

    setEditorHeight(clampedHeight);

    // Force Monaco to resize immediately while dragging
    if (editorRef.current) {
      editorRef.current.layout({
        width: editorRef.current.getLayoutInfo().width,
        height: clampedHeight,
      });
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
  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        
        const response = await axiosClient.get(`/problem/${problemId}`);
       // console.log(response);
        const initialCode = response.data.startCode.find((sc) => {
        
        if (sc.language == "C++" && selectedLanguage == 'cpp')
        return true;
        else if (sc.language == "Java" && selectedLanguage == 'java')
        return true;
        else if (sc.language == "Javascript" && selectedLanguage == 'javascript')
        return true;

        return false;
        })?.initialCode || 'Hello';

        console.log(initialCode);
        setProblem(response.data);
        // console.log(response.data.startCode);
        

        console.log(initialCode);
        setCode(initialCode);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === selectedLanguage)?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  // Replace your current handleEditorDidMount with this version
const handleEditorDidMount = (editor) => {
  editorRef.current = editor;
};

// Replace the useEffect you added with this safer version
useEffect(() => {
  // Monaco may not be fully ready during the same render cycle.
  // Running layout() immediately can sometimes cause UI freezes.
  const timer = setTimeout(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, 0);

  return () => clearTimeout(timer);
}, [editorHeight]);
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };
  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/code/runcode/${problemId}`, {
        code,
        language: selectedLanguage
      });
      console.log(response)
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/code/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });

       setSubmitResult(response.data);
       setLoading(false);
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Syne:wght@600;700;800&display=swap');
 
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
        .lc-root {
          --bg: #0e1117;
          --surface: #161b22;
          --surface2: #1c2130;
          --border: #21262d;
          --border2: #30363d;
          --text: #e6edf3;
          --text-muted: #7d8590;
          --text-dim: #484f58;
          --accent: #ffa116;
          --accent-dim: #cc7a00;
          --green: #3fb950;
          --green-bg: #0f2419;
          --red: #f85149;
          --red-bg: #2d1117;
          --yellow: #d29922;
          --yellow-bg: #272115;
          --blue: #388bfd;
          --radius: 8px;
          font-family: 'Syne', system-ui, sans-serif;
          background: var(--bg);
          color: var(--text);
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
 
        /* ── TOPBAR ── */
        .lc-topbar {
          height: 44px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          flex-shrink: 0;
          z-index: 10;
        }
        .lc-logo {
          display: flex; align-items: center; gap: 8px;
        }
        .lc-logo-icon {
          width: 26px; height: 26px;
          background: linear-gradient(135deg, #ffa116 0%, #ff6b35 100%);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #0e1117;
        }
        .lc-logo-text { font-weight: 800; font-size: 15px; letter-spacing: -0.3px; }
 
        .lc-topbar-center {
          display: flex; align-items: center; gap: 6px;
        }
        .lc-prob-num { color: var(--text-muted); font-size: 12px; font-family: 'JetBrains Mono', monospace; }
        .lc-prob-title { font-size: 13px; font-weight: 700; }
 
        .lc-topbar-actions { display: flex; align-items: center; gap: 8px; }
        .lc-btn {
          border: none; cursor: pointer; font-family: 'Syne', system-ui, sans-serif;
          font-size: 12px; font-weight: 700; padding: 5px 14px;
          border-radius: 6px; transition: all 0.15s; letter-spacing: 0.2px;
          display: flex; align-items: center; gap: 5px;
        }
        .lc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .lc-btn-ghost {
          background: transparent; color: var(--text-muted); border: 1px solid var(--border2);
        }
        .lc-btn-ghost:hover:not(:disabled) { background: var(--surface2); color: var(--text); border-color: var(--text-dim); }
        .lc-btn-run {
          background: var(--surface2); color: var(--text);
          border: 1px solid var(--border2);
        }
        .lc-btn-run:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .lc-btn-submit {
          background: var(--accent); color: #0e1117;
          border: 1px solid transparent;
        }
        .lc-btn-submit:hover:not(:disabled) { background: #ffb347; transform: translateY(-1px); }
        .lc-btn-submit:active:not(:disabled) { transform: translateY(0); }
 
        .lc-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(14,17,23,0.3);
          border-top-color: #0e1117;
          border-radius: 50%;
          animation: lc-spin 0.7s linear infinite;
        }
        @keyframes lc-spin { to { transform: rotate(360deg); } }
 
        /* ── MAIN LAYOUT ── */
        .lc-body { flex: 1; display: flex; overflow: hidden; }
 
        /* ── LEFT PANEL ── */
        .lc-left {
          width: 45%;
          min-width: 340px;
          display: flex; flex-direction: column;
          border-right: 1px solid var(--border);
          overflow: hidden;
        }
 
        /* ── TABS ── */
        .lc-tabs {
          display: flex; align-items: flex-end;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 4px;
          flex-shrink: 0;
          overflow-x: auto;
        }
        .lc-tabs::-webkit-scrollbar { display: none; }
        .lc-tab {
          background: none; border: none; cursor: pointer;
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text-muted);
          padding: 10px 14px;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }
        .lc-tab:hover { color: var(--text); }
        .lc-tab.active { color: var(--text); border-bottom-color: var(--accent); }
 
        /* ── SCROLLABLE CONTENT ── */
        .lc-scroll { flex: 1; overflow-y: auto; padding: 24px 20px; }
        .lc-scroll::-webkit-scrollbar { width: 4px; }
        .lc-scroll::-webkit-scrollbar-track { background: transparent; }
        .lc-scroll::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
 
        /* ── PROBLEM HEADER ── */
        .lc-prob-header { margin-bottom: 20px; }
        .lc-prob-h1 {
          font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
          margin-bottom: 10px; line-height: 1.2;
        }
        .lc-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .lc-badge {
          padding: 2px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
          font-family: 'JetBrains Mono', monospace;
        }
        .lc-badge-easy { background: #0f2419; color: #3fb950; border: 1px solid #1a3a26; }
        .lc-badge-medium { background: #272115; color: #d29922; border: 1px solid #3a2f0f; }
        .lc-badge-hard { background: #2d1117; color: #f85149; border: 1px solid #3d1c1c; }
        .lc-badge-tag { background: var(--surface2); color: var(--text-muted); border: 1px solid var(--border); }
 
        /* ── DESCRIPTION TEXT ── */
        .lc-desc {
          font-size: 13.5px; line-height: 1.85;
          color: #c9d1d9; white-space: pre-wrap;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 400;
        }
 
        /* ── EXAMPLES ── */
        .lc-examples { margin-top: 24px; }
        .lc-examples-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: var(--text); }
        .lc-example {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--border2);
          border-radius: var(--radius);
          padding: 14px 16px;
          margin-bottom: 12px;
          transition: border-left-color 0.2s;
        }
        .lc-example:hover { border-left-color: var(--accent); }
        .lc-example-title { font-size: 12px; font-weight: 700; margin-bottom: 10px; color: var(--text-muted); }
        .lc-example-row {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.7;
          color: var(--text-muted);
        }
        .lc-example-row span { color: var(--text); }
        .lc-example-expl { font-size: 11.5px; color: var(--text-muted); margin-top: 6px; font-style: italic; font-family: 'JetBrains Mono', monospace; }
 
        /* ── CODE BLOCK (solutions tab) ── */
        .lc-code-block {
          background: #0d1117;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          margin-bottom: 16px;
        }
        .lc-code-block-header {
          background: var(--surface);
          padding: 8px 14px;
          font-size: 11px; font-weight: 700;
          color: var(--text-muted); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .lc-code-block pre {
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.7;
          color: #c9d1d9; overflow-x: auto;
        }
        .lc-code-block pre::-webkit-scrollbar { height: 4px; }
        .lc-code-block pre::-webkit-scrollbar-thumb { background: var(--border2); }
 
        /* ── RIGHT PANEL ── */
        .lc-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
 
        /* ── LANG SELECTOR ── */
        .lc-lang-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-lang-pills { display: flex; gap: 4px; }
        .lc-lang-pill {
          background: none; border: 1px solid var(--border);
          border-radius: 6px; cursor: pointer; padding: 4px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          color: var(--text-muted); transition: all 0.15s;
        }
        .lc-lang-pill:hover { border-color: var(--border2); color: var(--text); }
        .lc-lang-pill.active { background: var(--accent); color: #0e1117; border-color: var(--accent); }
 
        /* ── EDITOR AREA ── */
        .lc-editor-wrap { flex: 1; overflow: hidden; }
 
        /* ── ACTION BAR ── */
        .lc-action-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
 
        /* ── TEST / RESULT PANELS ── */
        .lc-panel { flex: 1; overflow-y: auto; padding: 20px; }
        .lc-panel::-webkit-scrollbar { width: 4px; }
        .lc-panel::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
 
        .lc-empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%;
          color: var(--text-dim); gap: 10px; text-align: center;
        }
        .lc-empty-icon { font-size: 32px; opacity: 0.4; }
        .lc-empty-text { font-size: 12px; font-family: 'JetBrains Mono', monospace; }
 
        /* ── RESULT HEADER ── */
        .lc-result-status {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .lc-status-dot {
          width: 9px; height: 9px; border-radius: 50%;
          flex-shrink: 0;
        }
        .lc-status-label { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
        .lc-status-accepted { color: var(--green); }
        .lc-status-failed { color: var(--red); }
 
        /* ── STATS ROW ── */
        .lc-stats { display: flex; gap: 12px; margin-bottom: 20px; }
        .lc-stat-card {
          flex: 1; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius);
          padding: 14px 16px;
        }
        .lc-stat-label { font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
        .lc-stat-value { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
        .lc-stat-sub { font-size: 10px; color: var(--accent); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
 
        /* ── PASS SUMMARY ── */
        .lc-pass-summary {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 16px;
          margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-muted);
        }
        .lc-pass-summary strong { color: var(--text); }
 
        /* ── TEST CASE CARDS ── */
        .lc-tc-list { display: flex; flex-direction: column; gap: 8px; }
        .lc-tc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          transition: border-left-color 0.2s;
        }
        .lc-tc-card.passed { border-left-color: var(--green); }
        .lc-tc-card.failed { border-left-color: var(--red); }
        .lc-tc-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .lc-tc-num { color: var(--text-muted); font-size: 11px; }
        .lc-tc-verdict { font-size: 11px; font-weight: 700; }
        .lc-tc-verdict.pass { color: var(--green); }
        .lc-tc-verdict.fail { color: var(--red); }
        .lc-tc-row { color: var(--text-muted); margin-bottom: 3px; line-height: 1.5; }
        .lc-tc-row span { color: var(--text); }
 
        /* ── SECTION TITLE ── */
        .lc-section-title { font-size: 13px; font-weight: 700; margin-bottom: 14px; color: var(--text); }
 
        @keyframes lc-fadeup {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lc-anim { animation: lc-fadeup 0.2s ease both; }
      `}</style>
 
      <div className="lc-root">
 
        {/* ── TOP BAR ── */}
        <div className="lc-topbar">
          <div className="lc-logo">
            <div className="lc-logo-icon">⌨</div>
              <span className="text-xl font-bold tracking-tight text-white italic">
          CodeMaster
        </span>
          </div>
 
          {problem && (
            <div className="lc-topbar-center">
              <span className="lc-prob-num">#{problem.id ?? ''}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>·</span>
              <span className="lc-prob-title">{problem.title}</span>
              {problem.difficulty && (
                <span className={`lc-badge lc-badge-${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              )}
            </div>
          )}
 
          <div className="lc-topbar-actions">
            <button
              className="lc-btn lc-btn-run"
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? <span className="lc-spinner" /> : '▶'}
              Run
            </button>
            <button
              className="lc-btn lc-btn-submit"
              onClick={handleSubmitCode}
              disabled={loading}
            >
              {loading ? <span className="lc-spinner" style={{ borderTopColor: '#0e1117' }} /> : '↑'}
              Submit
            </button>
          </div>
        </div>
 
        {/* ── BODY ── */}
        <div className="lc-body">
 
          {/* ── LEFT PANEL ── */}
          <div className="lc-left">
            <div className="lc-tabs">
              {['description', 'editorial', 'solutions', 'submissions','whiteboard','Chat Ai'].map(tab => (
                <button
                  key={tab}
                  className={`lc-tab${activeLeftTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveLeftTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
 
            <div className="lc-scroll">
              {problem && (
                <div className="lc-anim">
 
                  {/* DESCRIPTION */}
                  {activeLeftTab === 'description' && (
                    <>
                      <div className="lc-prob-header">
                        <h1 className="lc-prob-h1">{problem.title}</h1>
                        <div className="lc-badges">
                          <span className={`lc-badge lc-badge-${problem.difficulty?.toLowerCase()}`}>
                            {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                          </span>
                          {problem.tags && (
                            <span className="lc-badge lc-badge-tag">{problem.tags}</span>
                          )}
                        </div>
                      </div>
 
                      <div className="lc-desc">{problem.description}</div>
 
                      {problem.visibleTestCases?.length > 0 && (
                        <div className="lc-examples">
                          <div className="lc-examples-title">Examples</div>
                          {problem.visibleTestCases.map((example, index) => (
                            <div key={index} className="lc-example">
                              <div className="lc-example-title">Example {index + 1}</div>
                              <div className="lc-example-row">
                                Input: <span>{example.input}</span>
                              </div>
                              <div className="lc-example-row">
                                Output: <span>{example.output}</span>
                              </div>
                              {example.explanation && (
                                <div className="lc-example-expl">// {example.explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
 
                  {/* EDITORIAL */}
                  {activeLeftTab === 'editorial' && (
                    <>
                      <div className="lc-section-title">Editorial</div>
                      <div className="lc-desc">Editorial is here for the problem</div>
                    </>
                  )}
 
                  {/* SOLUTIONS */}
                  {activeLeftTab === 'solutions' && (
                    <>
                      <div className="lc-section-title">Reference Solutions</div>
                      {problem.referenceSolution?.length > 0 ? (
                        problem.referenceSolution.map((solution, index) => (
                          <div key={index} className="lc-code-block">
                            <div className="lc-code-block-header">
                              <span>{problem.title}</span>
                              <span style={{ color: 'var(--accent)' }}>{solution.language}</span>
                            </div>
                            <pre><code>{solution.completeCode}</code></pre>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                          Solutions will be available after you solve the problem.
                        </div>
                      )}
                    </>
                  )}
 
                  {/* SUBMISSIONS */}
                  {activeLeftTab === 'submissions' && (
                    <>
                     <div>
                  <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                  <div className="text-gray-500">
                    <SubmissionHistory problemId={problemId}></SubmissionHistory>
                  </div>
                </div>

                    </>
                  )}

                  {activeLeftTab === 'whiteboard' && (
                    <>
                      <CodeBoard></CodeBoard>
                    </>
                  )}
                  {activeLeftTab === 'Chat Ai' && (
                   <div style={{ height: "80vh" }}>
  <ChatAi problem={problem}/>
</div>
                  )}
                </div>
              )}
            </div>
          </div>
 
          {/* ── RIGHT PANEL ── */}
          <div className="lc-right">
            <div className="lc-tabs">
              {['code', 'testcase', 'result'].map(tab => (
                <button
                  key={tab}
                  className={`lc-tab${activeRightTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveRightTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
 
            {/* CODE TAB */}
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
                        {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : ''}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Tab = 2 spaces
                  </span>
                </div>
 
                <div
  style={{
    height: `${editorHeight}px`,
    flexShrink: 0,
    overflow: 'hidden',
  }}
>
  <Editor
    height="100%"
    language={getLanguageForMonaco(selectedLanguage)}
    value={code}
    onChange={handleEditorChange}
    onMount={handleEditorDidMount}
    theme="vs-dark"
    options={{
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      mouseWheelZoom: true,
    }}
  />
</div>

// 4. Keep your resize handle like this
<div
  onMouseDown={startResize}
  style={{
    height: 6,
    cursor: 'row-resize',
    background: 'var(--border)',
    flexShrink: 0,
  }}
/>
                <div className="lc-action-bar">
                  <button
                    className="lc-btn lc-btn-ghost"
                    onClick={() => setActiveRightTab('testcase')}
                  >
                    ⌨ Console
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="lc-btn lc-btn-run"
                      onClick={handleRun}
                      disabled={loading}
                    >
                      {loading ? <span className="lc-spinner" /> : '▶'}
                      Run
                    </button>
                    <button
                      className="lc-btn lc-btn-submit"
                      onClick={handleSubmitCode}
                      disabled={loading}
                    >
                      {loading ? <span className="lc-spinner" style={{ borderTopColor: '#0e1117' }} /> : '↑'}
                      Submit
                    </button>
                  </div>
                </div>
              </>
            )}
 
            {/* TESTCASE TAB */}
            {activeRightTab === 'testcase' && (
              <div className="lc-panel lc-anim">
                <div className="lc-section-title">Test Results</div>
                {runResult ? (
                  <>
                    <div className="lc-result-status">
                      <div
                        className="lc-status-dot"
                        style={{
                          background: runResult.success ? 'var(--green)' : 'var(--red)',
                          boxShadow: `0 0 8px ${runResult.success ? 'var(--green)' : 'var(--red)'}`,
                        }}
                      />
                      <span
                        className={`lc-status-label ${runResult.success ? 'lc-status-accepted' : 'lc-status-failed'}`}
                      >
                        {runResult.success ? 'All Tests Passed' : 'Some Tests Failed'}
                      </span>
                    </div>
 
                    {runResult.success && (
                      <div className="lc-stats">
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Runtime</div>
                          <div className="lc-stat-value" style={{ color: 'var(--green)' }}>{runResult.runtime}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}> sec</span></div>
                        </div>
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Memory</div>
                          <div className="lc-stat-value" style={{ color: 'var(--blue)' }}>{runResult.memory}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}> KB</span></div>
                        </div>
                      </div>
                    )}
 
                    <div className="lc-tc-list">
                      {runResult.testCases?.map((tc, i) => {
                        const passed = runResult.success ? true : tc.status_id === 3;
                        return (
                          <div key={i} className={`lc-tc-card ${passed ? 'passed' : 'failed'}`}>
                            <div className="lc-tc-header">
                              <span className="lc-tc-num">Case {i + 1}</span>
                              <span className={`lc-tc-verdict ${passed ? 'pass' : 'fail'}`}>
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
                  <div className="lc-empty-state">
                    <div className="lc-empty-icon">▶</div>
                    <div className="lc-empty-text">Click "Run" to test with example cases</div>
                  </div>
                )}
              </div>
            )}
 
            {/* RESULT TAB */}
            {activeRightTab === 'result' && (
              <div className="lc-panel lc-anim">
                <div className="lc-section-title">Submission Result</div>
                {submitResult ? (
                  <>
                    <div className="lc-result-status">
                      <div
                        className="lc-status-dot"
                        style={{
                          background: submitResult.accepted ? 'var(--green)' : 'var(--red)',
                          boxShadow: `0 0 10px ${submitResult.accepted ? 'var(--green)' : 'var(--red)'}`,
                        }}
                      />
                      <span className={`lc-status-label ${submitResult.accepted ? 'lc-status-accepted' : 'lc-status-failed'}`}>
                        {submitResult.accepted ? 'Accepted' : (submitResult.error || 'Wrong Answer')}
                      </span>
                    </div>
 
                    {submitResult.accepted && (
                      <div className="lc-stats">
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Runtime</div>
                          <div className="lc-stat-value" style={{ color: 'var(--green)' }}>
                            {submitResult.runtime}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}> sec</span>
                          </div>
                        </div>
                        <div className="lc-stat-card">
                          <div className="lc-stat-label">Memory</div>
                          <div className="lc-stat-value" style={{ color: 'var(--blue)' }}>
                            {submitResult.memory}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}> KB</span>
                          </div>
                        </div>
                      </div>
                    )}
 
                    <div className="lc-pass-summary">
                      Test Cases Passed:{' '}
                      <strong style={{ color: submitResult.accepted ? 'var(--green)' : 'var(--red)' }}>
                        {submitResult.passedTestCases}
                      </strong>
                      {' / '}
                      <strong>{submitResult.totalTestCases}</strong>
                    </div>
                  </>
                ) : (
                  <div className="lc-empty-state">
                    <div className="lc-empty-icon">↑</div>
                    <div className="lc-empty-text">Click "Submit" to evaluate your solution</div>
                  </div>
                )}
              </div>
            )}
 
          </div>
        </div>
      </div>
    </>
  );
};

export default ProblemPage;