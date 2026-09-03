import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Loader2,
  Code2,
  Terminal,
  GripVertical,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  Palette,
} from 'lucide-react';
import Navbar from '../component/navbar';
import axiosClient from '../utils/axiosClient'; // adjust path to wherever your axiosClient lives
import { cn } from '../utils/cn';

const LANGUAGES = [
  { label: 'C++', value: 'cpp', monaco: 'cpp' },
  { label: 'Java', value: 'java', monaco: 'java' },
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
  { label: 'Python', value: 'python', monaco: 'python' },
];

const STARTER = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
  javascript: `const readline = require('readline').createInterface({ input: process.stdin });
let lines = [];
readline.on('line', l => lines.push(l));
readline.on('close', () => {
  const [a, b] = lines[0].split(' ').map(Number);
  console.log(a + b);
});`,
  python: `a, b = map(int, input().split())
print(a + b)`,
};

// ── status meta ──
// `internal_error` covers Judge0-side failures (status_id >= 13) that
// aren't the user's fault — distinct from a plain "request_failed"
// (network/axios failure) or "runtime_error" (their code blew up).
const STATUS_META = {
  success: { label: 'Ran successfully', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  compile_error: { label: 'Compile error', dot: 'bg-amber-400', text: 'text-amber-400' },
  runtime_error: { label: 'Runtime error', dot: 'bg-rose-400', text: 'text-rose-400' },
  timeout: { label: 'Time limit exceeded', dot: 'bg-amber-400', text: 'text-amber-400' },
  request_failed: { label: 'Request failed', dot: 'bg-rose-400', text: 'text-rose-400' },
  internal_error: { label: 'Judge server error', dot: 'bg-rose-400', text: 'text-rose-400' },
};

// ── best-effort error-location parsing ──
// Different toolchains format errors differently; this pulls out a
// {line, column, message} so we can underline the offending line in
// the editor and let the user jump straight to it. If nothing matches,
// we just skip highlighting — the raw output is still shown as before.
function parseErrorLocation(language, result) {
  const text = result?.compileOutput || result?.stderr || '';
  if (!text) return null;

  let match;

  switch (language) {
    case 'cpp':
    case 'java': {
      match = text.match(/:(\d+):(\d+):\s*(?:fatal error|error):\s*(.+)/);
      if (match) return { line: Number(match[1]), column: Number(match[2]), message: match[3].trim() };

      match = text.match(/:(\d+):\s*error:\s*(.+)/);
      if (match) return { line: Number(match[1]), column: 1, message: match[2].trim() };
      break;
    }
    case 'python': {
      const lineMatches = [...text.matchAll(/File ".*?", line (\d+)/g)];
      const last = lineMatches[lineMatches.length - 1];
      if (last) {
        const lines = text.trim().split('\n');
        const message = lines[lines.length - 1]?.trim() || 'Error';
        return { line: Number(last[1]), column: 1, message };
      }
      break;
    }
    case 'javascript': {
      // Node stack frame: "at ... (/box/script.js:6:3)" or "at /box/script.js:6:3"
      match = text.match(/(?:\(|at )\S*?:(\d+):(\d+)\)?/);
      // Bare syntax-error line: "/box/script.js:3" or "script.js:3" (relative, no leading slash)
      const bareLine = text.match(/^\S+\.js:(\d+)$/m);
      const messageLine = text.split('\n').find((l) => /Error:/.test(l)) || text.split('\n')[0];

      if (match) return { line: Number(match[1]), column: Number(match[2] || 1), message: messageLine };
      if (bareLine) return { line: Number(bareLine[1]), column: 1, message: messageLine };
      break;
    }
    default:
      break;
  }
  return null;
}
// ── Editor themes ─────────────────────────────────────────────
// A mix of Monaco's built-ins and two custom themes tuned to match
// this app's near-black / orange accent palette.
const EDITOR_THEMES = [
  { value: 'obsidian', label: 'Obsidian', swatch: '#0B0B0C', kind: 'custom' },
  { value: 'vs-dark', label: 'Midnight', swatch: '#1e1e1e', kind: 'builtin' },
  { value: 'hc-black', label: 'Contrast Black', swatch: '#000000', kind: 'builtin' },
  { value: 'solaris', label: 'Solaris', swatch: '#FBF4E6', kind: 'custom' },
  { value: 'light', label: 'Daylight', swatch: '#ffffff', kind: 'builtin' },
  { value: 'hc-light', label: 'Contrast Light', swatch: '#ffffff', kind: 'builtin' },
];

const THEME_STORAGE_KEY = 'compiler:editor-theme';
const WIDTH_STORAGE_KEY = 'compiler:editor-width';
const LANGUAGE_STORAGE_KEY = 'compiler:last-language';
const CODE_STORAGE_PREFIX = 'compiler:code:';
const CODE_SAVE_DEBOUNCE_MS = 400;
const DEFAULT_WIDTH = 60; // % of the split taken by the editor pane
const MIN_WIDTH = 25;
const MAX_WIDTH = 80;
const ERROR_MARKER_OWNER = 'compiler-errors';

// ── code persistence helpers ──
// Code is cached per-language in localStorage so switching routes,
// refreshing, or swapping languages doesn't wipe what the user typed.
const getCodeStorageKey = (lang) => `${CODE_STORAGE_PREFIX}${lang}`;

function loadSavedCode(lang) {
  if (typeof window === 'undefined') return STARTER[lang] ?? '';
  try {
    const saved = localStorage.getItem(getCodeStorageKey(lang));
    // Use `!== null` (not truthy check) so an intentionally-emptied
    // editor doesn't silently snap back to the starter template.
    return saved !== null ? saved : STARTER[lang] ?? '';
  } catch {
    return STARTER[lang] ?? '';
  }
}

function loadInitialLanguage() {
  if (typeof window === 'undefined') return 'cpp';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.some((l) => l.value === saved) ? saved : 'cpp';
  } catch {
    return 'cpp';
  }
}

function defineCustomThemes(monaco) {
  monaco.editor.defineTheme('obsidian', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C5A55', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FB923C' },
      { token: 'number', foreground: 'F0B37E' },
      { token: 'string', foreground: 'A8D8B9' },
      { token: 'identifier', foreground: 'EAE8E3' },
    ],
    colors: {
      'editor.background': '#0B0B0C',
      'editor.foreground': '#EAE8E3',
      'editor.lineHighlightBackground': '#FFFFFF08',
      'editor.selectionBackground': '#FB923C33',
      'editorCursor.foreground': '#FB923C',
      'editorLineNumber.foreground': '#4A4844',
      'editorLineNumber.activeForeground': '#EAE8E3',
      'editorGutter.background': '#0B0B0C',
      'editorIndentGuide.background': '#FFFFFF0F',
    },
  });

  monaco.editor.defineTheme('solaris', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'A69A85', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C2540A' },
      { token: 'number', foreground: 'B45309' },
      { token: 'string', foreground: '4B7A5A' },
      { token: 'identifier', foreground: '2B2620' },
    ],
    colors: {
      'editor.background': '#FBF4E6',
      'editor.foreground': '#2B2620',
      'editor.lineHighlightBackground': '#00000006',
      'editor.selectionBackground': '#C2540A22',
      'editorCursor.foreground': '#C2540A',
      'editorLineNumber.foreground': '#C9BCA3',
      'editorLineNumber.activeForeground': '#2B2620',
      'editorGutter.background': '#FBF4E6',
      'editorIndentGuide.background': '#00000009',
    },
  });
}

export default function Compiler() {
  const [language, setLanguage] = useState(loadInitialLanguage);
  const [code, setCode] = useState(() => loadSavedCode(loadInitialLanguage()));
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [mobileTab, setMobileTab] = useState('code'); // 'code' | 'output'
  const [copied, setCopied] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'obsidian';
    return localStorage.getItem(THEME_STORAGE_KEY) || 'obsidian';
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  // ── resizable split ──
  const [editorWidth, setEditorWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = Number(localStorage.getItem(WIDTH_STORAGE_KEY));
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH;
  });
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const themeMenuRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [errorLocation, setErrorLocation] = useState(null);

  const handleEditorMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;
  };

  const jumpToError = () => {
    if (!errorLocation || !editorRef.current) return;
    editorRef.current.revealLineInCenter(errorLocation.line);
    editorRef.current.setPosition({ lineNumber: errorLocation.line, column: errorLocation.column || 1 });
    editorRef.current.focus();
  };

  // ── push/clear the Monaco marker whenever the parsed error changes ──
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    if (errorLocation) {
      const line = Math.min(Math.max(errorLocation.line, 1), model.getLineCount());
      const maxCol = model.getLineMaxColumn(line);
      const startCol = Math.min(errorLocation.column || 1, maxCol);
      monaco.editor.setModelMarkers(model, ERROR_MARKER_OWNER, [
        {
          startLineNumber: line,
          startColumn: startCol,
          endLineNumber: line,
          endColumn: maxCol,
          message: errorLocation.message,
          severity: monaco.MarkerSeverity.Error,
        },
      ]);
    } else {
      monaco.editor.setModelMarkers(model, ERROR_MARKER_OWNER, []);
    }
  }, [errorLocation]);

  // ── persist code to localStorage (debounced, per-language) ──
  // Keeps the editor's contents alive across route changes, tab
  // closes, and refreshes without hammering localStorage on every
  // keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(getCodeStorageKey(language), code);
      } catch {
        /* localStorage unavailable (e.g. private mode / quota) — ignore */
      }
    }, CODE_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [code, language]);

  const handleLanguageChange = (value) => {
    setLanguage(value);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setCode(loadSavedCode(value));
    setResult(null);
    setErrorLocation(null);
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setErrorLocation(null);
    setMobileTab('output');
    try {
      const { data } = await axiosClient.post('/compiler/run', {
        code,
        language,
        input: '',
      });
      setResult(data);
      setErrorLocation(parseErrorLocation(language, data));
    } catch (err) {
      // Surface the backend's real message when it sent one (400/502/500 with
      // { message }), instead of a generic axios/network string.
      const message =
        err.response?.data?.message || err.message || 'Something went wrong while running your code.';
      setResult({
        outcome: 'request_failed',
        stderr: message,
        stdout: '',
        compileOutput: '',
      });
      setErrorLocation(null);
    } finally {
      setRunning(false);
    }
  };

  const handleCopyOutput = async () => {
    const text = [result?.stdout, result?.compileOutput, result?.stderr].filter(Boolean).join('\n');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleThemeSelect = (value) => {
    setTheme(value);
    setThemeMenuOpen(false);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  };

  // ── reset current language's code back to the starter template ──
  const handleResetCode = () => {
    const starter = STARTER[language] ?? '';
    setCode(starter);
    try {
      localStorage.setItem(getCodeStorageKey(language), starter);
    } catch {
      /* ignore */
    }
  };

  // ── drag-to-resize handlers (desktop only — mobile stacks panes instead) ──
  const clampWidth = (px) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return editorWidth;
    const pct = ((px - rect.left) / rect.width) * 100;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, pct));
  };

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setEditorWidth(clampWidth(clientX));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setEditorWidth((w) => {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(w));
      return w;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const resetWidth = () => {
    setEditorWidth(DEFAULT_WIDTH);
    localStorage.setItem(WIDTH_STORAGE_KEY, String(DEFAULT_WIDTH));
  };

  // close the theme menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const status = result ? STATUS_META[result.outcome] : null;
  const activeTheme = EDITOR_THEMES.find((t) => t.value === theme) ?? EDITOR_THEMES[0];
  const outputText = [result?.stdout, result?.compileOutput, result?.stderr].filter(Boolean).join('');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        @keyframes fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fade-in 0.15s ease-out; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }

        .resizer { position: relative; flex: 0 0 auto; width: 6px; cursor: col-resize; touch-action: none; }
        .resizer::before {
          content: '';
          position: absolute;
          inset: 0 -3px;
        }
        .resizer:hover .resizer-grip, .resizer.dragging .resizer-grip { opacity: 1; background: #fb923c22; }
        .resizer-grip {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 18px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s ease, background 0.15s ease;
          color: #ffffff55;
        }
      `}</style>

      {/*
        h-screen + h-[100dvh]: on mobile browsers h-screen (100vh) doesn't
        account for the address bar shrinking/growing, which is what was
        cutting off / squashing the editor. Browsers that support dvh use
        the second rule; older ones fail to parse it and silently fall
        back to h-screen.
      */}
      <div className="h-screen h-[100dvh] flex flex-col bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased overflow-hidden">
        <Navbar />

        {/* ── toolbar ── */}
        <div className="flex items-center justify-between gap-2 gap-y-2 flex-wrap px-3 sm:px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="hidden lg:inline text-[13px] font-medium text-white/40 mr-1">Playground</span>

            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] text-white text-[13px] font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500/40 transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value} className="bg-[#0B0B0C]">
                  {l.label}
                </option>
              ))}
            </select>

            {/* theme picker */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setThemeMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] text-white text-[13px] font-medium rounded-lg pl-2.5 pr-2 py-1.5 hover:border-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                  style={{ background: activeTheme.swatch }}
                />
                <span className="hidden sm:inline">{activeTheme.label}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-white/40 transition-transform', themeMenuOpen && 'rotate-180')} />
              </button>

              {themeMenuOpen && (
                <div className="fade-in absolute left-0 top-[calc(100%+6px)] z-20 w-52 max-w-[85vw] rounded-xl border border-white/[0.08] bg-[#141416] shadow-2xl shadow-black/50 p-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-white/30 uppercase tracking-wide">
                    <Palette className="w-3 h-3" /> Editor theme
                  </div>
                  {EDITOR_THEMES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleThemeSelect(t.value)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors',
                        t.value === theme ? 'bg-orange-500/15 text-orange-400' : 'text-white/70 hover:bg-white/[0.05]'
                      )}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                        style={{ background: t.swatch }}
                      />
                      {t.label}
                      {t.value === theme && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* reset code — clears the saved draft for this language */}
            <button
              onClick={handleResetCode}
              title="Reset code to starter template"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-[13px] px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            {running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 spin-slow" />
                Running
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                Run
              </>
            )}
          </button>
        </div>

        {/* ── mobile tab switcher (Code / Output) ── */}
        <div className="flex md:hidden items-center gap-1 px-3 sm:px-4 py-2 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => setMobileTab('code')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
              mobileTab === 'code' ? 'bg-orange-500/15 text-orange-400' : 'text-white/40 hover:text-white/70'
            )}
          >
            <Code2 className="w-3.5 h-3.5" /> Code
          </button>
          <button
            onClick={() => setMobileTab('output')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
              mobileTab === 'output' ? 'bg-orange-500/15 text-orange-400' : 'text-white/40 hover:text-white/70'
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            Output
            {status && <span className={cn('w-1.5 h-1.5 rounded-full ml-0.5', status.dot)} />}
          </button>
        </div>

        {/* ── main split (user-resizable on desktop, stacked tabs on mobile) ── */}
        <div
          ref={containerRef}
          className="flex flex-1 min-h-0 flex-col md:flex-row"
          style={{ '--editor-width': `${editorWidth}%` }}
        >

          {/* editor */}
          <div
            className={cn(
              // flex-1 (mobile only) is the key fix: in the mobile column
              // layout this pane previously had no explicit height, so
              // Monaco's height="100%" collapsed to 0. On desktop we turn
              // it back off (md:flex-none) and go back to the explicit
              // width var — flex-1 sets flex-basis:0%, which on desktop
              // was overriding --editor-width and forcing a stuck 50/50
              // split, which is what broke resizing/scrolling there.
              'min-h-0 flex-1 md:flex-none flex flex-col md:w-[var(--editor-width)]',
              mobileTab === 'code' ? 'flex' : 'hidden md:flex'
            )}
          >
            <Editor
              height="100%"
              width="100%"
              theme={theme}
              language={LANGUAGES.find((l) => l.value === language)?.monaco}
              value={code}
              beforeMount={defineCustomThemes}
              onMount={handleEditorMount}
              onChange={(value) => setCode(value ?? '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                padding: { top: 14 },
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              }}
            />
          </div>

          {/* drag handle — desktop only, since mobile uses tabs instead of a split */}
          <div
            className={cn('hidden md:flex resizer', isDragging && 'dragging')}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            onDoubleClick={resetWidth}
            title="Drag to resize · double-click to reset"
          >
            <div className="w-px h-full bg-white/[0.06] mx-auto" />
            <div className="resizer-grip">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>

          {/* output */}
          <div
            className={cn(
              'min-h-0 flex-1 flex flex-col bg-[#0B0B0C]',
              mobileTab === 'output' ? 'flex' : 'hidden md:flex'
            )}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap px-3 sm:px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wide">Output</span>
                {status && (
                  <span className={cn('flex items-center gap-1.5 text-[12px] font-data', status.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                    {status.label}
                    {result.time ? ` · ${result.time}s` : ''}
                    {result.memory ? ` · ${result.memory} KB` : ''}
                  </span>
                )}
                {errorLocation && (
                  <button
                    onClick={() => {
                      setMobileTab('code');
                      jumpToError();
                    }}
                    className="text-[12px] font-data text-orange-400 hover:text-orange-300 underline underline-offset-2"
                  >
                    Jump to line {errorLocation.line}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={resetWidth}
                  title="Reset panel sizes"
                  className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  title="Copy output"
                  className="flex items-center justify-center w-7 h-7 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto px-3 sm:px-4 py-3 text-[13px] font-data whitespace-pre-wrap break-words">
              {!result && !running && (
                <span className="text-white/25">Run your code to see output here.</span>
              )}
              {running && (
                <span className="flex items-center gap-2 text-white/35">
                  <Loader2 className="w-3.5 h-3.5 spin-slow" /> Executing…
                </span>
              )}

              {result?.stdout && <div className="text-white/80">{result.stdout}</div>}

              {result?.compileOutput && (
                <div className="text-amber-400/90 mt-3">{result.compileOutput}</div>
              )}

              {result?.stderr && (
                <div className="text-rose-400/90 mt-3">{result.stderr}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}