import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from '../component/subbsion';
import CodeBoard from '../component/whiteboard';
import ChatAi from '../component/chatai';
import ShareOnLinkedIn from '../component/Sharelinkdin';

// ── Count-up hook: animates a numeric value from 0 to `target` whenever `trigger` changes ──
const useCountUp = (target, trigger, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const numTarget = parseFloat(target);
    if (target === undefined || target === null || Number.isNaN(numTarget)) {
      setValue(0);
      return;
    }
    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(numTarget * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    setValue(0);
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, trigger, duration]);
  return value;
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
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

  // ── NEW FEATURE STATE ──
  const [fontSize, setFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | ''
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [editorTheme, setEditorTheme] = useState('vs-dark'); // 'vs-dark' | 'hc-black'
  const startTimeRef = useRef(Date.now());
  const [timerRunning, setTimerRunning] = useState(true);

  // ── SUBMISSION RESULT ANIMATION STATE ──
  // Bumped on every submit so the result hero replays its entrance animation each time.
  const [submitCount, setSubmitCount] = useState(0);
  const animatedRuntime = useCountUp(submitResult?.runtime, submitCount);
  const animatedMemory = useCountUp(submitResult?.memory, submitCount);

  // ── POST SOLUTION STATE ──
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postExplanation, setPostExplanation] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [hasPosted, setHasPosted] = useState(false);

  // ── COMMUNITY SOLUTIONS STATE ──
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsFetched, setPostsFetched] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loadingSinglePost, setLoadingSinglePost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // ── TIMER ── stops once the user submits their solution
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // ── KEYBOARD SHORTCUT: Ctrl+Enter = Run ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, selectedLanguage]);

  // ── COPY CODE ──
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── FONT SIZE ──
  const changeFontSize = (delta) => {
    setFontSize(prev => {
      const next = Math.min(20, Math.max(10, prev + delta));
      if (editorRef.current) {
        editorRef.current.updateOptions({ fontSize: next });
      }
      return next;
    });
  };

  // ── THEME TOGGLE ──
  const toggleTheme = () => {
    setEditorTheme(prev => prev === 'vs-dark' ? 'hc-black' : 'vs-dark');
  };

  // ── FULLSCREEN TOGGLE ──
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => { if (editorRef.current) editorRef.current.layout(); }, 50);
  };

  // ── RESIZE DRAG ──
  const startResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = editorHeight;
    const onMouseMove = (event) => {
      const newHeight = startHeight + (event.clientY - startY);
      const clamped = Math.max(150, Math.min(window.innerHeight * 0.8, newHeight));
      setEditorHeight(clamped);
      if (editorRef.current) {
        editorRef.current.layout({ width: editorRef.current.getLayoutInfo().width, height: clamped });
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

  // ── FETCH PROBLEM ──
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/${problemId}`);
        const initialCode = response.data.startCode.find(
          (sc) => sc.language.toLowerCase() === selectedLanguage.toLowerCase() ||
                  (sc.language.toLowerCase() === 'c++' && selectedLanguage === 'cpp')
        )?.initialCode || '';
        setProblem(response.data);
        const savedKey = `code_${problemId}_${selectedLanguage}`;
        const savedCode = localStorage.getItem(savedKey);
        setCode(savedCode !== null ? savedCode : initialCode);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // ── LANGUAGE SWITCH ──
  useEffect(() => {
    if (problem) {
      const savedKey = `code_${problemId}_${selectedLanguage}`;
      const savedCode = localStorage.getItem(savedKey);
      if (savedCode !== null) {
        setCode(savedCode);
      } else {
        const initialCode = problem.startCode.find(
          (sc) => sc.language.toLowerCase() === selectedLanguage.toLowerCase() ||
                  (sc.language.toLowerCase() === 'c++' && selectedLanguage === 'cpp')
        )?.initialCode || '';
        setCode(initialCode);
      }
    }
  }, [selectedLanguage, problem]);

  // ── EDITOR CHANGE (auto-save with indicator) ──
  const handleEditorChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    setSaveStatus('saving');
    const savedKey = `code_${problemId}_${selectedLanguage}`;
    localStorage.setItem(savedKey, newCode);
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus(''), 2200);
  };

  const handleEditorDidMount = (editor) => { editorRef.current = editor; };

  useEffect(() => {
    const timer = setTimeout(() => { if (editorRef.current) editorRef.current.layout(); }, 0);
    return () => clearTimeout(timer);
  }, [editorHeight]);

  const handleLanguageChange = (language) => setSelectedLanguage(language);

  // ── RUN ──
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

  // ── SUBMIT ──
  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    setHasPosted(false);
    // Stop the stopwatch the moment the user submits their solution.
    setTimerRunning(false);
    try {
      const response = await axiosClient.post(`/code/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(response.data);
      setSubmitCount(c => c + 1);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  // ── RESET ──
  const handleResetCode = () => {
    if (!problem) return;
    const initialCode = problem.startCode.find(
      (sc) => sc.language.toLowerCase() === selectedLanguage.toLowerCase() ||
              (sc.language.toLowerCase() === 'c++' && selectedLanguage === 'cpp')
    )?.initialCode || '';
    setCode(initialCode);
    const savedKey = `code_${problemId}_${selectedLanguage}`;
    localStorage.removeItem(savedKey);
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  // ── POST SOLUTION ──
  const openPostModal = () => {
    setPostError('');
    setPostTitle(problem?.title ? `My approach to ${problem.title}` : '');
    setPostExplanation('');
    setShowPostModal(true);
  };

  const handlePostSolution = async () => {
    if (!postTitle.trim()) {
      setPostError('Please add a title for your post.');
      return;
    }
    const submissionId = submitResult?.submissionId || submitResult?._id || submitResult?.id;
    if (!submissionId) {
      setPostError('Missing submission id from the server response — make sure /code/submit returns "submissionId".');
      return;
    }
    setPosting(true);
    setPostError('');
    try {
      await axiosClient.post('/solution/post', {
        submissionId,
        title: postTitle.trim(),
        explanation: postExplanation.trim(),
      });
      setHasPosted(true);
      setShowPostModal(false);
      // refresh community list if it's already been loaded
      if (postsFetched) fetchCommunityPosts();
    } catch (err) {
      setPostError(err?.response?.data?.message || 'Failed to post your solution. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  // ── COMMUNITY SOLUTIONS ──
  const fetchCommunityPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axiosClient.post(`/solution/posts/${problemId}`, {});
      setCommunityPosts(res.data.posts || []);
      setPostsFetched(true);
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setPostsFetched(true);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeLeftTab === 'community' && problemId && !postsFetched) {
      fetchCommunityPosts();
    }
  }, [activeLeftTab, problemId]);

  const openPost = async (postId) => {
    setLoadingSinglePost(true);
    setSelectedPost(null);
    try {
      const res = await axiosClient.post(`/solution/post/${postId}`, {});
      setSelectedPost(res.data.post);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoadingSinglePost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    setDeletingPost(true);
    try {
      await axiosClient.post(`/solution/post/delete/${postId}`, {});
      setSelectedPost(null);
      fetchCommunityPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeletingPost(false);
    }
  };

  // ── DIFFICULTY COLORS ──
  const diffMap = {
    easy:   { color: '#2dba6e', bg: 'rgba(45,186,110,0.1)',   border: 'rgba(45,186,110,0.22)' },
    medium: { color: '#ffa116', bg: 'rgba(255,161,22,0.1)',   border: 'rgba(255,161,22,0.22)' },
    hard:   { color: '#f04f4f', bg: 'rgba(240,79,79,0.1)',    border: 'rgba(240,79,79,0.22)' },
  };
  const diff = problem?.difficulty?.toLowerCase();
  const dc = diffMap[diff] || diffMap.medium;

  // Pass-rate percentage used to drive the verdict signal meter + segmented bar
  const submitPct = submitResult?.totalTestCases
    ? Math.round((submitResult.passedTestCases / submitResult.totalTestCases) * 100)
    : 0;
  const meterSegs = 20;
  const meterFilled = Math.round((submitPct / 100) * meterSegs);

  if (loading && !problem) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#08090c', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid #1c2030',
          borderTop: '2px solid #ffa116',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#2e3448', fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:     #08090c;
          --s1:     #0e1016;
          --s2:     #13151d;
          --s3:     #181c26;
          --b1:     #1c2030;
          --b2:     #242a3a;
          --tx:     #dde3f0;
          --mu:     #5c6580;
          --di:     #2e3448;
          --ac:     #ffa116;
          --as:     rgba(255,161,22,0.1);
          --gr:     #2dba6e;
          --rd:     #f04f4f;
          --bl:     #4b8ef0;
          --pu:     #8b5cf6;
          --r:      7px;
          --r2:     10px;
          font-family: 'Outfit', system-ui, sans-serif;
        }

        .cm-root {
          background: var(--bg);
          color: var(--tx);
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── TOPBAR ── */
        .cm-topbar {
          height: 48px;
          background: var(--s1);
          border-bottom: 1px solid var(--b1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          flex-shrink: 0;
          z-index: 200;
          position: relative;
        }

        .cm-logo { display: flex; align-items: center; gap: 8px; }
        .cm-logo-mark {
          width: 28px; height: 28px;
          background: var(--ac);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900; color: #000;
          flex-shrink: 0;
        }
        .cm-logo-name {
          font-size: 15px; font-weight: 800; letter-spacing: -0.4px; color: var(--tx);
        }

        .cm-top-center {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
        }
        .cm-prob-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--di);
        }
        .cm-prob-title {
          font-size: 13px; font-weight: 700; color: var(--tx);
          max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cm-diff-pill {
          font-size: 9px; font-weight: 800; padding: 2px 9px;
          border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;
          border: 1px solid; font-family: 'JetBrains Mono', monospace;
        }

        /* Timer badge */
        .cm-timer {
          display: flex; align-items: center; gap: 5px;
          background: var(--s3); border: 1px solid var(--b2);
          border-radius: 6px; padding: 3px 9px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--mu);
        }
        .cm-timer.stopped { color: var(--di); border-color: var(--b1); }
        .cm-timer-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--gr);
          animation: pulse 2s ease-in-out infinite;
        }
        .cm-timer-dot.stopped { background: var(--di); animation: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .cm-top-right { display: flex; align-items: center; gap: 6px; }
        .cm-sep { width: 1px; height: 18px; background: var(--b2); }

        /* AI Chat button */
        .cm-btn-ai {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(139,92,246,0.12); color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.22);
          border-radius: var(--r); cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 11px; font-weight: 700; padding: 6px 11px;
          transition: all 0.15s;
        }
        .cm-btn-ai:hover { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4); }

        /* Board button */
        .cm-btn-board {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--s3); color: var(--mu);
          border: 1px solid var(--b1); border-radius: var(--r); cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 11px; font-weight: 700; padding: 6px 11px;
          transition: all 0.15s;
        }
        .cm-btn-board:hover { color: var(--tx); border-color: var(--b2); }

        /* Icon-only Run button */
        .cm-run-icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: var(--s3); color: var(--mu);
          border: 1px solid var(--b2); border-radius: var(--r);
          cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .cm-run-icon-btn:hover:not(:disabled) { color: var(--ac); border-color: rgba(255,161,22,0.4); background: rgba(255,161,22,0.06); }
        .cm-run-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .cm-play-icon {
          width: 0; height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 9px solid currentColor;
          margin-left: 2px; flex-shrink: 0;
        }

        /* Submit button */
        .cm-btn-submit {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--ac); color: #000;
          border: none; border-radius: var(--r); cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 12px; font-weight: 800; padding: 0 16px; height: 34px;
          transition: all 0.15s;
        }
        .cm-btn-submit:hover:not(:disabled) { background: #ffb347; transform: translateY(-1px); }
        .cm-btn-submit:active:not(:disabled) { transform: translateY(0); }
        .cm-btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }
        .cm-upload-icon {
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid #000;
          flex-shrink: 0;
        }

        /* Spinner */
        .cm-spinner {
          width: 11px; height: 11px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%; animation: cm-spin 0.65s linear infinite; flex-shrink: 0;
        }
        .cm-spinner-light {
          width: 11px; height: 11px;
          border: 2px solid rgba(255,255,255,0.15);
          border-top-color: var(--mu);
          border-radius: 50%; animation: cm-spin 0.65s linear infinite; flex-shrink: 0;
        }
        @keyframes cm-spin { to { transform: rotate(360deg); } }

        /* ── BODY ── */
        .cm-body { flex: 1; display: flex; overflow: hidden; }

        /* ── LEFT PANEL ── */
        .cm-left {
          width: ${isFullscreen ? '0' : '43%'};
          min-width: ${isFullscreen ? '0' : '340px'};
          display: flex; flex-direction: column;
          border-right: 1px solid var(--b1);
          background: var(--s1);
          overflow: hidden;
          transition: width 0.25s ease, min-width 0.25s ease;
          flex-shrink: 0;
        }

        /* ── TABS ── */
        .cm-tabs {
          display: flex; align-items: flex-end;
          background: var(--s1); border-bottom: 1px solid var(--b1);
          padding: 0 4px; flex-shrink: 0; overflow-x: auto; gap: 2px;
        }
        .cm-tabs::-webkit-scrollbar { display: none; }
        .cm-tab {
          background: none; border: none; cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 11px; font-weight: 600; color: var(--di);
          padding: 9px 10px 8px; border-bottom: 2px solid transparent;
          white-space: nowrap; transition: color 0.14s; display: flex; align-items: center; gap: 4px;
        }
        .cm-tab:hover { color: var(--mu); }
        .cm-tab.active { color: var(--ac); border-bottom-color: var(--ac); }

        .cm-scroll { flex: 1; overflow-y: auto; padding: 22px 20px; }
        .cm-scroll::-webkit-scrollbar { width: 3px; }
        .cm-scroll::-webkit-scrollbar-thumb { background: var(--b2); border-radius: 2px; }

        .cm-prob-h1 { font-size: 19px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; line-height: 1.25; }
        .cm-badges { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 18px; }
        .cm-tag { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: var(--mu); background: var(--s2); border: 1px solid var(--b1); padding: 2px 8px; border-radius: 20px; }

        .cm-desc { font-size: 12px; line-height: 1.9; color: #7e92b0; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; font-weight: 400; }
        .cm-hr { height: 1px; background: var(--b1); margin: 18px 0; }

        .cm-ex-title { font-size: 9.5px; font-weight: 700; color: var(--di); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace; }
        .cm-example {
          background: var(--bg); border: 1px solid var(--b1);
          border-left: 2px solid var(--b2);
          border-radius: 0; padding: 12px 14px; margin-bottom: 8px;
          transition: border-left-color 0.15s;
        }
        .cm-example:hover { border-left-color: var(--ac); }
        .cm-ex-label { font-size: 9px; font-weight: 700; color: var(--di); letter-spacing: 0.8px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
        .cm-ex-row { font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.8; color: var(--mu); }
        .cm-ex-row span { color: var(--tx); }
        .cm-ex-expl { font-size: 10px; color: var(--di); margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--b1); font-family: 'JetBrains Mono', monospace; font-style: italic; }

        .cm-code-block { background: var(--bg); border: 1px solid var(--b1); border-radius: var(--r2); overflow: hidden; margin-bottom: 12px; }
        .cm-code-block-hdr { background: var(--s2); padding: 8px 14px; font-size: 11px; font-weight: 600; color: var(--mu); border-bottom: 1px solid var(--b1); display: flex; align-items: center; justify-content: space-between; }
        .cm-lang-badge { background: var(--as); color: var(--ac); border: 1px solid rgba(255,161,22,0.2); padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; }
        .cm-code-block pre { padding: 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.7; color: #c9d1d9; overflow-x: auto; }

        /* ── RIGHT PANEL ── */
        .cm-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--bg); }

        /* Language + tools bar */
        .cm-lang-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 14px; background: var(--s1); border-bottom: 1px solid var(--b1); flex-shrink: 0;
        }
        .cm-lang-pills { display: flex; gap: 3px; }
        .cm-lang-pill {
          background: none; border: 1px solid var(--b1); border-radius: 5px;
          cursor: pointer; padding: 3px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--di);
          transition: all 0.14s;
        }
        .cm-lang-pill:hover { border-color: var(--b2); color: var(--mu); }
        .cm-lang-pill.active { background: var(--as); color: var(--ac); border-color: rgba(255,161,22,0.3); }

        .cm-tool-row { display: flex; align-items: center; gap: 5px; }
        .cm-tbtn {
          display: inline-flex; align-items: center; gap: 3px;
          background: none; border: 1px solid var(--b1); border-radius: 5px;
          cursor: pointer; color: var(--di); font-size: 10px; font-weight: 700;
          padding: 3px 8px; font-family: 'JetBrains Mono', monospace; transition: all 0.12s;
        }
        .cm-tbtn:hover { color: var(--mu); border-color: var(--b2); }
        .cm-tbtn.active { color: var(--ac); border-color: rgba(255,161,22,0.3); background: var(--as); }

        /* Save status */
        .cm-save-status {
          font-size: 10px; font-family: 'JetBrains Mono', monospace;
          transition: opacity 0.3s; min-width: 42px; text-align: right;
        }
        .cm-save-saving { color: var(--mu); }
        .cm-save-saved { color: var(--gr); }

        /* Resize */
        .cm-resize { height: 5px; cursor: row-resize; background: var(--b1); flex-shrink: 0; position: relative; transition: background 0.14s; }
        .cm-resize:hover { background: rgba(255,161,22,0.08); }
        .cm-resize::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 22px; height: 2px; background: var(--b2); border-radius: 2px; transition: background 0.14s; }
        .cm-resize:hover::after { background: rgba(255,161,22,0.4); }

        /* Right tabs */
        .cm-right-tabs { display: flex; background: var(--s1); border-bottom: 1px solid var(--b1); padding: 0 4px; flex-shrink: 0; }

        /* Action bar (bottom of editor) */
        .cm-action-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px; background: var(--s1); border-top: 1px solid var(--b1); flex-shrink: 0;
        }
        .cm-action-left { display: flex; align-items: center; gap: 6px; }
        .cm-action-right { display: flex; align-items: center; gap: 6px; }

        .cm-console-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--s2); color: var(--mu); border: 1px solid var(--b1);
          border-radius: var(--r); cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif; font-size: 11px; font-weight: 700; padding: 6px 12px;
          transition: all 0.14s;
        }
        .cm-console-btn:hover { color: var(--tx); border-color: var(--b2); }

        .cm-kbd { font-size: 9px; background: var(--s2); border: 1px solid var(--b2); color: var(--di); padding: 1px 4px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; }

        .cm-reset-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; color: var(--di); border: 1px solid var(--b1);
          border-radius: 6px; cursor: pointer;
          font-family: 'Outfit', system-ui, sans-serif; font-size: 10px; font-weight: 700; padding: 5px 10px;
          transition: all 0.14s;
        }
        .cm-reset-btn:hover { color: var(--rd); border-color: rgba(240,79,79,0.3); background: rgba(240,79,79,0.06); }

        /* Panel */
        .cm-panel { flex: 1; overflow-y: auto; padding: 20px 18px; }
        .cm-panel::-webkit-scrollbar { width: 3px; }
        .cm-panel::-webkit-scrollbar-thumb { background: var(--b2); border-radius: 2px; }

        .cm-section-title { font-size: 9.5px; font-weight: 700; color: var(--di); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; }

        /* Status banner (test-run results) */
        .cm-status-banner { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: var(--r2); margin-bottom: 16px; border: 1px solid; }
        .cm-status-banner.ok  { background: rgba(45,186,110,0.07); border-color: rgba(45,186,110,0.2); }
        .cm-status-banner.err { background: rgba(240,79,79,0.07);  border-color: rgba(240,79,79,0.2); }
        .cm-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cm-status-text { font-size: 17px; font-weight: 800; letter-spacing: -0.3px; }
        .cm-status-banner.ok  .cm-status-text { color: var(--gr); }
        .cm-status-banner.err .cm-status-text { color: var(--rd); }

        /* Empty state */
        .cm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; text-align: center; padding: 40px; }
        .cm-empty-icon { width: 48px; height: 48px; background: var(--s2); border: 1px solid var(--b2); border-radius: var(--r2); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .cm-empty-title { font-size: 13px; font-weight: 600; color: var(--mu); }
        .cm-empty-sub { font-size: 11px; color: var(--di); font-family: 'JetBrains Mono', monospace; }

        /* Modal overlay */
        .cm-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(8,9,12,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          animation: cm-fadein 0.16s ease;
        }
        @keyframes cm-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cm-slideup { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: none; } }

        .cm-ai-modal {
          width: min(680px, 92vw); height: min(740px, 88vh);
          background: var(--s1); border: 1px solid var(--b2); border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.75);
          animation: cm-slideup 0.2s ease;
        }
        .cm-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; background: var(--s2); border-bottom: 1px solid var(--b1); flex-shrink: 0;
        }
        .cm-modal-title { display: flex; align-items: center; gap: 10px; }
        .cm-ai-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3);
          display: flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .cm-modal-label { font-size: 14px; font-weight: 800; letter-spacing: -0.3px; }
        .cm-modal-sub { font-size: 10px; color: var(--mu); font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
        .cm-modal-close {
          width: 28px; height: 28px; background: var(--s3); border: 1px solid var(--b2);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--mu); font-size: 12px; transition: all 0.14s;
        }
        .cm-modal-close:hover { background: rgba(240,79,79,0.1); border-color: var(--rd); color: var(--rd); }
        .cm-modal-body { flex: 1; overflow: hidden; }

        .cm-board-modal {
          width: min(1060px, 95vw); height: min(680px, 90vh);
          background: var(--s1); border: 1px solid var(--b2); border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.75);
          animation: cm-slideup 0.2s ease;
        }
        .cm-board-icon {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(75,142,240,0.1); border: 1px solid rgba(75,142,240,0.25);
          display: flex; align-items: center; justify-content: center; font-size: 13px;
        }

        /* ── POST SOLUTION ── */
        .cm-post-solution-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(45,186,110,0.12); color: var(--gr);
          border: 1px solid rgba(45,186,110,0.28); border-radius: var(--r);
          cursor: pointer; font-family: 'Outfit', system-ui, sans-serif;
          font-size: 12px; font-weight: 800; padding: 9px 16px;
          transition: all 0.15s; width: 100%; justify-content: center;
        }
        .cm-post-solution-btn:hover:not(:disabled) { background: rgba(45,186,110,0.2); border-color: rgba(45,186,110,0.5); transform: translateY(-1px); }
        .cm-post-solution-btn:disabled { opacity: 0.55; cursor: default; }

        .cm-post-modal {
          width: min(560px, 92vw); max-height: 88vh;
          background: var(--s1); border: 1px solid var(--b2); border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.75);
          animation: cm-slideup 0.2s ease;
        }
        .cm-post-body { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
        .cm-field-label { font-size: 10px; font-weight: 700; color: var(--mu); letter-spacing: 0.6px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; margin-bottom: 7px; display: block; }
        .cm-field-input {
          width: 100%; background: var(--bg); border: 1px solid var(--b1); border-radius: var(--r);
          color: var(--tx); font-family: 'Outfit', system-ui, sans-serif; font-size: 13px;
          padding: 10px 12px; outline: none; transition: border-color 0.14s;
        }
        .cm-field-input:focus { border-color: rgba(255,161,22,0.5); }
        .cm-field-textarea { resize: vertical; min-height: 110px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.7; }
        .cm-post-code-preview { background: var(--bg); border: 1px solid var(--b1); border-radius: var(--r); padding: 10px 12px; max-height: 160px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #7e92b0; }
        .cm-post-error { color: var(--rd); font-size: 11px; font-family: 'JetBrains Mono', monospace; background: rgba(240,79,79,0.08); border: 1px solid rgba(240,79,79,0.2); padding: 8px 12px; border-radius: 6px; }
        .cm-post-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; border-top: 1px solid var(--b1); background: var(--s2); flex-shrink: 0; }
        .cm-btn-ghost {
          background: none; border: 1px solid var(--b1); color: var(--mu);
          border-radius: var(--r); cursor: pointer; padding: 9px 16px;
          font-family: 'Outfit', system-ui, sans-serif; font-size: 12px; font-weight: 700; transition: all 0.14s;
        }
        .cm-btn-ghost:hover { color: var(--tx); border-color: var(--b2); }
        .cm-btn-confirm {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--ac); color: #000; border: none; border-radius: var(--r);
          cursor: pointer; padding: 9px 18px;
          font-family: 'Outfit', system-ui, sans-serif; font-size: 12px; font-weight: 800; transition: all 0.14s;
        }
        .cm-btn-confirm:hover:not(:disabled) { background: #ffb347; }
        .cm-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Already posted banner */
        .cm-already-posted { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: var(--r2); background: rgba(45,186,110,0.07); border: 1px solid rgba(45,186,110,0.2); color: var(--gr); font-size: 12px; font-weight: 700; }

        /* Community list */
        .cm-community-list { display: flex; flex-direction: column; gap: 8px; }
        .cm-community-card {
          background: var(--bg); border: 1px solid var(--b1); border-radius: var(--r2);
          padding: 13px 15px; cursor: pointer; transition: all 0.14s;
        }
        .cm-community-card:hover { border-color: rgba(255,161,22,0.35); background: rgba(255,161,22,0.03); }
        .cm-cc-title { font-size: 13px; font-weight: 700; color: var(--tx); margin-bottom: 8px; line-height: 1.4; }
        .cm-cc-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cm-cc-author { display: flex; align-items: center; gap: 6px; }
        .cm-cc-avatar {
          width: 18px; height: 18px; border-radius: 50%; background: var(--s3);
          border: 1px solid var(--b2); display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: var(--mu); overflow: hidden; flex-shrink: 0;
        }
        .cm-cc-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cm-cc-name { font-size: 11px; color: var(--mu); font-weight: 600; }
        .cm-cc-dot { color: var(--di); font-size: 10px; }
        .cm-cc-stat { font-size: 10px; color: var(--di); font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 3px; }

        /* Post detail modal */
        .cm-post-detail-modal {
          width: min(760px, 94vw); height: min(720px, 88vh);
          background: var(--s1); border: 1px solid var(--b2); border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.75);
          animation: cm-slideup 0.2s ease;
        }
        .cm-pd-body { flex: 1; overflow-y: auto; padding: 20px 22px; }
        .cm-pd-title { font-size: 19px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.4px; line-height: 1.3; }
        .cm-pd-meta-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .cm-pd-explanation { font-size: 13px; line-height: 1.85; color: #b8c2d9; white-space: pre-wrap; margin-bottom: 20px; }
        .cm-btn-danger {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(240,79,79,0.1); color: var(--rd); border: 1px solid rgba(240,79,79,0.28);
          border-radius: var(--r); cursor: pointer; padding: 6px 12px;
          font-family: 'Outfit', system-ui, sans-serif; font-size: 11px; font-weight: 700; transition: all 0.14s;
        }
        .cm-btn-danger:hover:not(:disabled) { background: rgba(240,79,79,0.18); }
        .cm-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes cm-anim { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .cm-anim { animation: cm-anim 0.2s ease both; }

        /* ══════════════════════════════════════════════
           RUN RESULTS — redesigned test-run banner + cards
           ══════════════════════════════════════════════ */
        @keyframes cm-sweep-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cm-bar-fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes cm-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }

        .cm-run-banner {
          position: relative;
          overflow: hidden;
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; border-radius: 14px; margin-bottom: 18px;
          border: 1px solid; animation: cm-sweep-in 0.35s ease both;
        }
        .cm-run-banner.pass {
          background: linear-gradient(135deg, rgba(45,186,110,0.16), rgba(45,186,110,0.03));
          border-color: rgba(45,186,110,0.35);
        }
        .cm-run-banner.fail {
          background: linear-gradient(135deg, rgba(240,79,79,0.16), rgba(240,79,79,0.03));
          border-color: rgba(240,79,79,0.35);
        }
        .cm-run-banner::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: translateX(-100%);
          animation: cm-shine 1.4s ease 0.2s;
        }
        @keyframes cm-shine { to { transform: translateX(100%); } }

        /* Eyebrow: small terminal-style label with a blinking cursor */
        .cm-eyebrow {
          display: flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 7px;
        }
        .cm-eyebrow.pass, .cm-eyebrow.ok { color: rgba(45,186,110,0.75); }
        .cm-eyebrow.fail, .cm-eyebrow.no { color: rgba(240,79,79,0.75); }
        .cm-eyebrow-cursor { width: 5px; height: 11px; background: currentColor; animation: cm-blink 1.1s steps(1) infinite; }
        @keyframes cm-blink { 50% { opacity: 0; } }

        /* Signal-bar meter — replaces the checkmark badge everywhere */
        .cm-signal { display: flex; align-items: flex-end; gap: 3px; flex-shrink: 0; }
        .cm-signal-bar {
          width: 5px; border-radius: 3px 3px 1px 1px; background: var(--b2);
          transform-origin: bottom; animation: cm-bar-grow 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes cm-bar-grow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        .cm-signal-bar:nth-child(1) { animation-delay: 0.02s; }
        .cm-signal-bar:nth-child(2) { animation-delay: 0.08s; }
        .cm-signal-bar:nth-child(3) { animation-delay: 0.14s; }
        .cm-signal-bar:nth-child(4) { animation-delay: 0.2s; }
        .cm-signal-bar:nth-child(5) { animation-delay: 0.26s; }
        .cm-signal-bar.lit.pass { background: linear-gradient(180deg, #7cf0ac, var(--gr)); box-shadow: 0 0 10px rgba(45,186,110,0.55); }
        .cm-signal-bar.lit.fail { background: linear-gradient(180deg, #ff9d9d, var(--rd)); box-shadow: 0 0 10px rgba(240,79,79,0.55); }
        .cm-signal-bar.dim { background: var(--b2); }

        .cm-run-banner-text { flex: 1; min-width: 0; }
        .cm-run-banner-title { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
        .cm-run-banner.pass .cm-run-banner-title { color: var(--gr); }
        .cm-run-banner.fail .cm-run-banner-title { color: var(--rd); }
        .cm-run-banner-sub { font-size: 11px; color: var(--mu); font-family: 'JetBrains Mono', monospace; margin-top: 3px; }

        .cm-metric-row { display: flex; gap: 10px; margin-bottom: 18px; }
        .cm-metric-card {
          flex: 1; position: relative; overflow: hidden;
          background: var(--s1); border: 1px solid var(--b1); border-radius: 12px;
          padding: 14px 16px; animation: cm-card-in 0.3s ease both;
        }
        .cm-metric-card:nth-child(1) { animation-delay: 0.05s; }
        .cm-metric-card:nth-child(2) { animation-delay: 0.12s; }
        .cm-metric-icon-row { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
        .cm-metric-chip {
          width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 11px;
        }
        .cm-metric-chip.time { background: rgba(255,161,22,0.15); color: var(--ac); }
        .cm-metric-chip.mem  { background: rgba(75,142,240,0.15); color: var(--bl); }
        .cm-metric-label { font-size: 9.5px; font-weight: 700; color: var(--di); letter-spacing: 1px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        .cm-metric-value { font-size: 24px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
        .cm-metric-value .unit { font-size: 11px; font-weight: 500; color: var(--mu); margin-left: 4px; letter-spacing: 0; }
        .cm-metric-bar-track { height: 4px; border-radius: 3px; background: var(--b1); margin-top: 12px; overflow: hidden; }
        .cm-metric-bar-fill { height: 100%; border-radius: 3px; transform-origin: left; animation: cm-bar-fill 0.7s cubic-bezier(0.4,0,0.2,1) 0.15s both; }
        .cm-metric-bar-fill.time { background: linear-gradient(90deg, var(--ac), #ffb347); }
        .cm-metric-bar-fill.mem  { background: linear-gradient(90deg, var(--bl), #7fb0ff); }

        .cm-tc-summary-strip {
          display: flex; align-items: center; gap: 8px;
          background: var(--s1); border: 1px solid var(--b1); border-radius: 10px;
          padding: 10px 14px; margin-bottom: 14px;
        }
        .cm-tc-summary-strip .count { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; }
        .cm-tc-summary-strip .count.pass { color: var(--gr); }
        .cm-tc-summary-strip .count.fail { color: var(--rd); }
        .cm-tc-summary-strip .lbl { font-size: 11px; color: var(--mu); }
        .cm-tc-dots { display: flex; gap: 4px; margin-left: auto; }
        .cm-tc-dot { width: 7px; height: 7px; border-radius: 2px; }
        .cm-tc-dot.p { background: var(--gr); }
        .cm-tc-dot.f { background: var(--rd); }

        /* ══════════════════════════════════════════════
           SUBMISSION RESULT — redesigned hero (no ring/tick)
           ══════════════════════════════════════════════ */
        @keyframes cm-hero-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cm-glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes cm-stat-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cm-fade-up-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }

        .cm-verdict-hero {
          position: relative; overflow: hidden;
          border-radius: 16px; border: 1px solid;
          padding: 22px 22px 20px; margin-bottom: 18px;
          animation: cm-hero-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .cm-verdict-hero.ok {
          background: linear-gradient(150deg, rgba(45,186,110,0.18) 0%, rgba(45,186,110,0.02) 55%, transparent 100%);
          border-color: rgba(45,186,110,0.3);
        }
        .cm-verdict-hero.no {
          background: linear-gradient(150deg, rgba(240,79,79,0.18) 0%, rgba(240,79,79,0.02) 55%, transparent 100%);
          border-color: rgba(240,79,79,0.3);
        }
        .cm-verdict-hero::after {
          content: ''; position: absolute; top: -60%; right: -10%; width: 220px; height: 220px;
          border-radius: 50%; filter: blur(50px); pointer-events: none;
          animation: cm-glow-pulse 3s ease-in-out infinite;
        }
        .cm-verdict-hero.ok::after  { background: rgba(45,186,110,0.35); }
        .cm-verdict-hero.no::after  { background: rgba(240,79,79,0.35); }

        .cm-verdict-top { display: flex; align-items: center; gap: 16px; position: relative; z-index: 1; }
        .cm-signal.lg .cm-signal-bar { width: 7px; border-radius: 4px 4px 1px 1px; }

        .cm-verdict-heading {
          font-size: 28px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.1;
          display: inline-block;
        }
        .cm-verdict-heading.ok {
          background: linear-gradient(90deg, #7cf0ac 0%, #2dba6e 55%, #17a35c 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .cm-verdict-heading.no {
          background: linear-gradient(90deg, #ffb0b0 0%, #f04f4f 55%, #c73f3f 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .cm-verdict-caption { font-size: 11.5px; color: var(--mu); font-family: 'JetBrains Mono', monospace; margin-top: 4px; }

        /* Segmented meter — replaces the smooth progress bar */
        .cm-meter { position: relative; z-index: 1; display: flex; gap: 3px; margin-top: 20px; }
        .cm-meter-seg { flex: 1; height: 9px; border-radius: 3px; background: var(--b1); overflow: hidden; }
        .cm-meter-seg .fill {
          display: block; width: 100%; height: 100%; border-radius: 3px;
          transform: scaleY(0); transform-origin: center;
          animation: cm-seg-pop 0.3s ease both;
        }
        @keyframes cm-seg-pop { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .cm-meter-seg.on.ok .fill { background: linear-gradient(180deg, #5eeba0, var(--gr)); box-shadow: 0 0 8px rgba(45,186,110,0.55); }
        .cm-meter-seg.on.no .fill { background: linear-gradient(180deg, #ff8080, var(--rd)); box-shadow: 0 0 8px rgba(240,79,79,0.55); }
        .cm-verdict-progress-label {
          position: relative; z-index: 1;
          display: flex; justify-content: space-between;
          font-size: 10px; color: var(--di); font-family: 'JetBrains Mono', monospace;
          margin-top: 7px;
        }

        .cm-result-stats { display: flex; gap: 10px; margin-bottom: 16px; }
        .cm-result-stat-card {
          flex: 1; background: var(--s1); border: 1px solid var(--b1); border-radius: 12px;
          padding: 14px 16px; animation: cm-stat-in 0.35s ease both;
        }
        .cm-result-stat-card:nth-child(1) { animation-delay: 0.28s; }
        .cm-result-stat-card:nth-child(2) { animation-delay: 0.34s; }
        .cm-result-stat-top { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
        .cm-result-stat-label { font-size: 9.5px; font-weight: 700; color: var(--di); letter-spacing: 1px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        .cm-result-stat-value { font-size: 25px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
        .cm-result-stat-value .unit { font-size: 11px; font-weight: 500; color: var(--mu); margin-left: 4px; }

        .cm-pass-sum {
          background: var(--s1); border: 1px solid var(--b1); border-radius: var(--r);
          padding: 10px 14px; margin-bottom: 14px; font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: var(--mu); display: flex; align-items: center; gap: 6px;
        }
        .cm-pass-num { font-size: 15px; font-weight: 800; }
      `}</style>

      <div className="cm-root">

        {/* ── TOPBAR ── */}
        <div className="cm-topbar">
          <div className="cm-logo">
            <div className="cm-logo-mark">⌨</div>
            <span className="cm-logo-name">CodeMaster</span>
          </div>

          {problem && (
            <div className="cm-top-center">
              {problem.id && <span className="cm-prob-id">#{problem.id}</span>}
              {problem.id && <span style={{ color: 'var(--di)', fontSize: 13 }}>·</span>}
              <span className="cm-prob-title">{problem.title}</span>
              {problem.difficulty && (
                <span className="cm-diff-pill" style={{ color: dc.color, background: dc.bg, borderColor: dc.border }}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              )}
              {/* Live timer — stops once the solution has been submitted */}
              <div className={`cm-timer${timerRunning ? '' : ' stopped'}`} title={timerRunning ? 'Timer running' : 'Timer stopped at submission'}>
                <div className={`cm-timer-dot${timerRunning ? '' : ' stopped'}`} />
                {formatTime(elapsedTime)}
              </div>
            </div>
          )}

          <div className="cm-top-right">
            <button className="cm-btn-ai" onClick={() => setShowAiModal(true)}>
              ✦ AI Chat
            </button>
            <button className="cm-btn-board" onClick={() => setShowBoardModal(true)}>
              ◫ Board
            </button>
            <div className="cm-sep" />
            {/* Icon-only run in topbar */}
            <button
              className="cm-run-icon-btn"
              onClick={handleRun}
              disabled={loading}
              title="Run code (Ctrl+Enter)"
            >
              {loading ? <span className="cm-spinner-light" /> : <div className="cm-play-icon" />}
            </button>
            <button className="cm-btn-submit" onClick={handleSubmitCode} disabled={loading}>
              {loading
                ? <span className="cm-spinner" />
                : <div className="cm-upload-icon" />
              }
              Submit
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="cm-body">

          {/* ── LEFT PANEL ── */}
          <div className="cm-left" style={{ width: isFullscreen ? 0 : '43%', minWidth: isFullscreen ? 0 : 340 }}>
            <div className="cm-tabs">
              {[
                { id: 'description', icon: '≡', label: 'Description' },
                { id: 'editorial',   icon: '✎', label: 'Editorial' },
                { id: 'solutions',   icon: '◈', label: 'Solutions' },
                { id: 'community',   icon: '☰', label: 'Community' },
                { id: 'submissions', icon: '⊕', label: 'Submissions' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`cm-tab${activeLeftTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveLeftTab(tab.id)}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeLeftTab === 'description' && problem && (
              <div className="cm-scroll cm-anim">
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

            {activeLeftTab === 'editorial' && problem && (
              <div className="cm-scroll cm-anim">
                <div className="cm-section-title">Editorial</div>
                {problem?.secureUrl ? (
                  <video width="100%" height="400" controls poster={problem?.thumbnailUrl} style={{ borderRadius: 8, marginTop: 8 }}>
                    <source src={problem.secureUrl} type="video/mp4" />
                  </video>
                ) : (
                  <div className="cm-desc">Editorial content for this problem will appear here.</div>
                )}
              </div>
            )}

            {activeLeftTab === 'solutions' && problem && (
              <div className="cm-scroll cm-anim">
                <div className="cm-section-title">Reference Solutions</div>
                {problem.referenceSolution?.length > 0 ? (
                  problem.referenceSolution.map((sol, i) => (
                    <div key={i} className="cm-code-block">
                      <div className="cm-code-block-hdr">
                        <span style={{ fontSize: 12 }}>{problem.title}</span>
                        <span className="cm-lang-badge">{sol.language}</span>
                      </div>
                      <pre><code>{sol.solutionCode || sol.completeCode}</code></pre>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--mu)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}>
                    Solutions unlock after solving the problem.
                  </div>
                )}
              </div>
            )}

            {/* ── COMMUNITY SOLUTIONS TAB ── */}
            {activeLeftTab === 'community' && (
              <div className="cm-scroll cm-anim">
                <div className="cm-section-title">Community Solutions</div>

                {submitResult?.accepted && (
                  <div style={{ marginBottom: 16 }}>
                    {hasPosted ? (
                      <div className="cm-already-posted">✓ You posted your solution for this problem</div>
                    ) : (
                      <button className="cm-post-solution-btn" onClick={openPostModal}>
                        ✎ Post Your Solution
                      </button>
                    )}
                  </div>
                )}

                {loadingPosts ? (
                  <div className="cm-empty" style={{ padding: '30px 0' }}>
                    <span className="cm-spinner-light" style={{ width: 22, height: 22, borderWidth: 3 }} />
                    <div className="cm-empty-sub" style={{ marginTop: 8 }}>Loading community solutions…</div>
                  </div>
                ) : communityPosts.length > 0 ? (
                  <div className="cm-community-list">
                    {communityPosts.map((post) => (
                      <div key={post._id} className="cm-community-card" onClick={() => openPost(post._id)}>
                        <div className="cm-cc-title">{post.title}</div>
                        <div className="cm-cc-meta">
                          <div className="cm-cc-author">
                            <div className="cm-cc-avatar">
                              {post.userId?.profileImage
                                ? <img src={post.userId.profileImage} alt="" />
                                : (post.userId?.name?.[0]?.toUpperCase() || '?')}
                            </div>
                            <span className="cm-cc-name">{post.userId?.name || 'Anonymous'}</span>
                          </div>
                          <span className="cm-cc-dot">·</span>
                          <span className="cm-lang-badge" style={{ fontSize: 8, padding: '1px 6px' }}>{post.language}</span>
                          <span className="cm-cc-dot">·</span>
                          <span className="cm-cc-stat">👁 {post.views || 0}</span>
                          <span className="cm-cc-dot">·</span>
                          <span className="cm-cc-stat">{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cm-empty" style={{ padding: '30px 0' }}>
                    <div className="cm-empty-icon">☰</div>
                    <div className="cm-empty-title">No solutions posted yet</div>
                    <div className="cm-empty-sub">Be the first to share your approach</div>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === 'submissions' && problem && (
              <div className="cm-scroll cm-anim">
                <div className="cm-section-title">My Submissions</div>
                <SubmissionHistory problemId={problemId} />
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="cm-right">
            <div className="cm-right-tabs">
              {[
                { id: 'code',     icon: '{ }', label: 'Code' },
                { id: 'testcase', icon: '▶',   label: 'Test Results' },
                { id: 'result',   icon: '↑',   label: 'Submission' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`cm-tab${activeRightTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveRightTab(tab.id)}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── CODE TAB ── */}
            {activeRightTab === 'code' && (
              <>
                {/* Language bar + editor tools in one row */}
                <div className="cm-lang-bar">
                  <div className="cm-lang-pills">
                    {['javascript', 'cpp'].map(lang => (
                      <button
                        key={lang}
                        className={`cm-lang-pill${selectedLanguage === lang ? ' active' : ''}`}
                        onClick={() => handleLanguageChange(lang)}
                      >
                        {lang === 'cpp' ? 'C++' : 'JavaScript'}
                      </button>
                    ))}
                  </div>
                  <div className="cm-tool-row">
                    {/* Copy button with feedback */}
                    <button className={`cm-tbtn${copied ? ' active' : ''}`} onClick={handleCopyCode}>
                      {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    {/* Font size controls */}
                    <button className="cm-tbtn" onClick={() => changeFontSize(-1)} title="Decrease font size">A−</button>
                    <span style={{ fontSize: 10, color: 'var(--di)', fontFamily: 'monospace' }}>{fontSize}</span>
                    <button className="cm-tbtn" onClick={() => changeFontSize(1)} title="Increase font size">A+</button>
                    <div className="cm-sep" />
                    {/* Theme toggle */}
                    <button
                      className={`cm-tbtn${editorTheme === 'hc-black' ? ' active' : ''}`}
                      onClick={toggleTheme}
                      title="Toggle editor theme"
                    >
                      {editorTheme === 'hc-black' ? '◑ HC' : '◑ Dark'}
                    </button>
                    {/* Fullscreen */}
                    <button
                      className={`cm-tbtn${isFullscreen ? ' active' : ''}`}
                      onClick={toggleFullscreen}
                      title="Toggle fullscreen editor"
                    >
                      {isFullscreen ? '⊠ Exit' : '⛶ Full'}
                    </button>
                    {/* Save status */}
                    <span className={`cm-save-status ${saveStatus === 'saving' ? 'cm-save-saving' : saveStatus === 'saved' ? 'cm-save-saved' : ''}`}>
                      {saveStatus === 'saving' ? '● saving' : saveStatus === 'saved' ? '✓ saved' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ height: `${editorHeight}px`, flexShrink: 0, overflow: 'hidden' }}>
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme={editorTheme}
                    options={{
                      fontSize: fontSize,
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
                      cursorBlinking: 'smooth',
                      smoothScrolling: true,
                    }}
                  />
                </div>

                <div className="cm-resize" onMouseDown={startResize} />

                {/* Action bar */}
                <div className="cm-action-bar">
                  <div className="cm-action-left">
                    <button className="cm-console-btn" onClick={() => setActiveRightTab('testcase')}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>&gt;_</span>
                      Console
                    </button>
                    <span className="cm-kbd">Ctrl+Enter</span>
                    <span style={{ fontSize: 9, color: 'var(--di)', fontFamily: 'monospace' }}>to run</span>
                  </div>
                  <div className="cm-action-right">
                    <button className="cm-reset-btn" onClick={handleResetCode}>↺ Reset</button>
                    <div className="cm-sep" />
                    {/* Icon-only run in action bar */}
                    <button
                      className="cm-run-icon-btn"
                      onClick={handleRun}
                      disabled={loading}
                      title="Run (Ctrl+Enter)"
                    >
                      {loading ? <span className="cm-spinner-light" /> : <div className="cm-play-icon" />}
                    </button>
                    <button className="cm-btn-submit" onClick={handleSubmitCode} disabled={loading} style={{ height: 32, fontSize: 11, padding: '0 14px' }}>
                      {loading ? <span className="cm-spinner" /> : <div className="cm-upload-icon" />}
                      Submit
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── TESTCASE TAB — redesigned ── */}
            {activeRightTab === 'testcase' && (
              <div className="cm-panel cm-anim">
                <div className="cm-section-title">Test Results</div>
                {runResult ? (
                  <>
                    {/* Sweep-in banner — signal-bar meter instead of a checkmark */}
                    <div className={`cm-run-banner ${runResult.success ? 'pass' : 'fail'}`}>
                      <div className="cm-signal">
                        {[10, 15, 20, 25].map((h, i) => (
                          <div
                            key={i}
                            className={`cm-signal-bar ${runResult.success || i === 0 ? `lit ${runResult.success ? 'pass' : 'fail'}` : 'dim'}`}
                            style={{ height: h }}
                          />
                        ))}
                      </div>
                      <div className="cm-run-banner-text">
                        <div className={`cm-eyebrow ${runResult.success ? 'pass' : 'fail'}`}>
                          {runResult.success ? 'exec :: pass' : 'exec :: fail'}
                          <span className="cm-eyebrow-cursor" />
                        </div>
                        <div className="cm-run-banner-title">
                          {runResult.success ? 'All test cases passed' : (runResult.error || 'Some test cases failed')}
                        </div>
                        <div className="cm-run-banner-sub">
                          {runResult.testCases?.length
                            ? `${runResult.testCases.length} case${runResult.testCases.length === 1 ? '' : 's'} evaluated`
                            : 'Ran against the visible test cases'}
                        </div>
                      </div>
                    </div>

                    {runResult.success && (
                      <div className="cm-metric-row">
                        <div className="cm-metric-card">
                          <div className="cm-metric-icon-row">
                            <div className="cm-metric-chip time">⏱</div>
                            <span className="cm-metric-label">Runtime</span>
                          </div>
                          <div className="cm-metric-value" style={{ color: 'var(--ac)' }}>
                            {runResult.runtime}<span className="unit">sec</span>
                          </div>
                          <div className="cm-metric-bar-track"><div className="cm-metric-bar-fill time" /></div>
                        </div>
                        <div className="cm-metric-card">
                          <div className="cm-metric-icon-row">
                            <div className="cm-metric-chip mem">▤</div>
                            <span className="cm-metric-label">Memory</span>
                          </div>
                          <div className="cm-metric-value" style={{ color: 'var(--bl)' }}>
                            {runResult.memory}<span className="unit">KB</span>
                          </div>
                          <div className="cm-metric-bar-track"><div className="cm-metric-bar-fill mem" /></div>
                        </div>
                      </div>
                    )}

                    {runResult.testCases?.length > 0 && (
                      <div className="cm-tc-summary-strip">
                        <span className="count pass">
                          {runResult.success ? runResult.testCases.length : runResult.testCases.filter(tc => tc.status_id === 3).length}
                        </span>
                        <span className="lbl">passed</span>
                        <span style={{ color: 'var(--di)' }}>·</span>
                        <span className="count fail">
                          {runResult.success ? 0 : runResult.testCases.filter(tc => tc.status_id !== 3).length}
                        </span>
                        <span className="lbl">failed</span>
                        <div className="cm-tc-dots">
                          {runResult.testCases.map((tc, i) => {
                            const passed = runResult.success ? true : tc.status_id === 3;
                            return <div key={i} className={`cm-tc-dot ${passed ? 'p' : 'f'}`} title={`Case ${i + 1}: ${passed ? 'Passed' : 'Failed'}`} />;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="cm-tc-list">
                      {runResult.testCases?.map((tc, i) => {
                        const passed = runResult.success ? true : tc.status_id === 3;
                        return (
                          <div key={i} className={`cm-tc-card ${passed ? 'pass' : 'fail'}`}>
                            <div className="cm-tc-head">
                              <span className="cm-tc-num">Case {i + 1}</span>
                              <span className={`cm-tc-verdict ${passed ? 'p' : 'f'}`}>
                                {passed ? '✓ Passed' : '✗ Failed'}
                              </span>
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
                    <div className="cm-empty-sub">Press Run or Ctrl+Enter to test</div>
                  </div>
                )}
              </div>
            )}

            {/* ── RESULT TAB — redesigned ── */}
            {activeRightTab === 'result' && (
              <div className="cm-panel cm-anim">
                <div className="cm-section-title">Submission Result</div>
                {submitResult ? (
                  <>
                    {/* Verdict hero: glow card with a signal-bar meter and gradient headline — no tick, no ring */}
                    <div key={`verdict-${submitCount}`} className={`cm-verdict-hero ${submitResult.accepted ? 'ok' : 'no'}`}>
                      <div className="cm-verdict-top">
                        <div className={`cm-signal lg ${submitResult.accepted ? 'pass' : 'fail'}`}>
                          {[16, 26, 36, 46, 58].map((h, i) => {
                            const litCount = submitResult.accepted ? 5 : Math.max(1, Math.round((submitPct / 100) * 5));
                            const isLit = i < litCount;
                            return (
                              <div
                                key={i}
                                className={`cm-signal-bar ${isLit ? `lit ${submitResult.accepted ? 'pass' : 'fail'}` : 'dim'}`}
                                style={{ height: h }}
                              />
                            );
                          })}
                        </div>
                        <div>
                          <div className={`cm-eyebrow ${submitResult.accepted ? 'ok' : 'no'}`}>
                            submission verdict
                            <span className="cm-eyebrow-cursor" />
                          </div>
                          <div className={`cm-verdict-heading ${submitResult.accepted ? 'ok' : 'no'}`}>
                            {submitResult.accepted ? 'Accepted' : (submitResult.error || 'Wrong Answer')}
                          </div>
                          <div className="cm-verdict-caption">
                            {submitResult.accepted
                              ? `All ${submitResult.totalTestCases} test cases passed`
                              : `${submitResult.passedTestCases} / ${submitResult.totalTestCases} test cases passed`}
                          </div>
                        </div>
                      </div>

                      <div className="cm-meter">
                        {Array.from({ length: meterSegs }).map((_, i) => (
                          <div key={i} className={`cm-meter-seg ${i < meterFilled ? `on ${submitResult.accepted ? 'ok' : 'no'}` : ''}`}>
                            {i < meterFilled && (
                              <span className="fill" style={{ animationDelay: `${0.2 + i * 0.02}s` }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="cm-verdict-progress-label">
                        <span>{submitResult.passedTestCases} / {submitResult.totalTestCases} passed</span>
                        <span>{submitPct}%</span>
                      </div>
                    </div>

                    {submitResult.accepted && (
                      <div className="cm-result-stats">
                        <div className="cm-result-stat-card">
                          <div className="cm-result-stat-top">
                            <div className="cm-metric-chip time">⏱</div>
                            <span className="cm-result-stat-label">Runtime</span>
                          </div>
                          <div className="cm-result-stat-value" style={{ color: 'var(--ac)' }}>
                            {Number.isFinite(animatedRuntime) ? animatedRuntime.toFixed(2) : submitResult.runtime}
                            <span className="unit">sec</span>
                          </div>
                        </div>
                        <div className="cm-result-stat-card">
                          <div className="cm-result-stat-top">
                            <div className="cm-metric-chip mem">▤</div>
                            <span className="cm-result-stat-label">Memory</span>
                          </div>
                          <div className="cm-result-stat-value" style={{ color: 'var(--bl)' }}>
                            {Number.isFinite(animatedMemory) ? Math.round(animatedMemory) : submitResult.memory}
                            <span className="unit">KB</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── POST SOLUTION CTA ── */}
                    {submitResult.accepted && (
                      hasPosted ? (
                        <div className="cm-already-posted" style={{ marginBottom: 14 }}>
                          ✓ Your solution has been posted to the community
                        </div>
                      ) : (
                        <button className="cm-post-solution-btn" style={{ marginBottom: 14 }} onClick={openPostModal}>
                          ✎ Post Your Solution
                        </button>
                      )
                    )}

                    {submitResult.accepted && (
                      <ShareOnLinkedIn
                        problem={problem}
                        runtime={submitResult.runtime}
                        memory={submitResult.memory}
                        language={selectedLanguage}
                      />
                    )}
                  </>
                ) : (
                  <div className="cm-empty">
                    <div className="cm-empty-icon">↑</div>
                    <div className="cm-empty-title">No submission yet</div>
                    <div className="cm-empty-sub">Click Submit to evaluate your solution</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── AI CHAT MODAL ── */}
        {showAiModal && (
          <div className="cm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
            <div className="cm-ai-modal">
              <div className="cm-modal-hdr">
                <div className="cm-modal-title">
                  <div className="cm-ai-icon">✦</div>
                  <div>
                    <div className="cm-modal-label">CodeMaster AI</div>
                    <div className="cm-modal-sub">Ask anything about this problem</div>
                  </div>
                </div>
                <div className="cm-modal-close" onClick={() => setShowAiModal(false)}>✕</div>
              </div>
              <div className="cm-modal-body">
                {problem && <ChatAi problem={problem} />}
              </div>
            </div>
          </div>
        )}

        {/* ── WHITEBOARD MODAL ── */}
        {showBoardModal && (
          <div className="cm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBoardModal(false); }}>
            <div className="cm-board-modal">
              <div className="cm-modal-hdr">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="cm-board-icon">◫</div>
                  <span className="cm-modal-label">Whiteboard</span>
                </div>
                <div className="cm-modal-close" onClick={() => setShowBoardModal(false)}>✕</div>
              </div>
              <div className="cm-modal-body">
                <CodeBoard />
              </div>
            </div>
          </div>
        )}

        {/* ── POST SOLUTION MODAL ── */}
        {showPostModal && (
          <div className="cm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPostModal(false); }}>
            <div className="cm-post-modal">
              <div className="cm-modal-hdr">
                <div className="cm-modal-title">
                  <div className="cm-ai-icon" style={{ background: 'rgba(45,186,110,0.15)', borderColor: 'rgba(45,186,110,0.3)' }}>✎</div>
                  <div>
                    <div className="cm-modal-label">Post Your Solution</div>
                    <div className="cm-modal-sub">Share your accepted approach with the community</div>
                  </div>
                </div>
                <div className="cm-modal-close" onClick={() => setShowPostModal(false)}>✕</div>
              </div>

              <div className="cm-post-body">
                {postError && <div className="cm-post-error">{postError}</div>}

                <div>
                  <label className="cm-field-label">Title</label>
                  <input
                    className="cm-field-input"
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Clean O(n) two-pointer solution"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="cm-field-label">Explanation (optional)</label>
                  <textarea
                    className="cm-field-input cm-field-textarea"
                    value={postExplanation}
                    onChange={(e) => setPostExplanation(e.target.value)}
                    placeholder="Walk others through your approach, time & space complexity, edge cases…"
                  />
                </div>

                <div>
                  <label className="cm-field-label">
                    Code <span className="cm-lang-badge" style={{ marginLeft: 6 }}>{selectedLanguage}</span>
                  </label>
                  <div className="cm-post-code-preview">
                    <pre style={{ margin: 0 }}>{code}</pre>
                  </div>
                </div>
              </div>

              <div className="cm-post-footer">
                <button className="cm-btn-ghost" onClick={() => setShowPostModal(false)} disabled={posting}>Cancel</button>
                <button className="cm-btn-confirm" onClick={handlePostSolution} disabled={posting}>
                  {posting ? <span className="cm-spinner" /> : '✎'}
                  {posting ? 'Posting…' : 'Post Solution'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── POST DETAIL MODAL ── */}
        {(selectedPost || loadingSinglePost) && (
          <div className="cm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedPost(null); }}>
            <div className="cm-post-detail-modal">
              <div className="cm-modal-hdr">
                <div className="cm-modal-title">
                  <div className="cm-cc-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                    {selectedPost?.userId?.profileImage
                      ? <img src={selectedPost.userId.profileImage} alt="" />
                      : (selectedPost?.userId?.name?.[0]?.toUpperCase() || '?')}
                  </div>
                  <div>
                    <div className="cm-modal-label">{selectedPost?.userId?.firstName || 'Anonymous'}</div>
                    <div className="cm-modal-sub">{formatDate(selectedPost?.createdAt)}</div>
                  </div>
                </div>
                <div className="cm-modal-close" onClick={() => setSelectedPost(null)}>✕</div>
              </div>

              <div className="cm-pd-body">
                {loadingSinglePost ? (
                  <div className="cm-empty" style={{ height: 240 }}>
                    <span className="cm-spinner-light" style={{ width: 22, height: 22, borderWidth: 3 }} />
                  </div>
                ) : selectedPost && (
                  <>
                    <div className="cm-pd-title">{selectedPost.title}</div>
                    <div className="cm-pd-meta-row">
                      <span className="cm-lang-badge">{selectedPost.language}</span>
                      <span className="cm-cc-stat">👁 {selectedPost.views || 0} views</span>
                      {selectedPost.userId?._id === problem?.userId && null}
                      <button
                        className="cm-btn-danger"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => handleDeletePost(selectedPost._id)}
                        disabled={deletingPost}
                      >
                        {deletingPost ? <span className="cm-spinner-light" /> : '🗑'} Delete
                      </button>
                    </div>
                    {selectedPost.explanation && (
                      <div className="cm-pd-explanation">{selectedPost.explanation}</div>
                    )}
                    <div className="cm-code-block">
                      <div className="cm-code-block-hdr">
                        <span style={{ fontSize: 12 }}>Solution</span>
                        <span className="cm-lang-badge">{selectedPost.language}</span>
                      </div>
                      <pre><code>{selectedPost.code}</code></pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ProblemPage;