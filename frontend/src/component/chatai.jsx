import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from "lucide-react";

// ── Streaming text renderer ───────────────────────────────────────────────────
function StreamText({ text, isStreaming }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!isStreaming) { setDisplayed(text); return; }
    idx.current = 0;
    setDisplayed("");
    timer.current = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(timer.current);
    }, 12);
    return () => clearInterval(timer.current);
  }, [text, isStreaming]);

  const render = (raw) => {
    const parts = [];
    let rest = raw;
    let key = 0;
    rest = rest.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
      parts.push({ code: code.trim(), key: key++ });
      return `\x00${parts.length - 1}\x00`;
    });
    return rest.split(/\x00(\d+)\x00/).map((seg, i) => {
      const ri = parseInt(seg, 10);
      if (!isNaN(ri) && parts[ri]) {
        const p = parts[ri];
        return (
          <div key={p.key} style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:6, marginTop:8, marginBottom:8, overflow:"hidden" }}>
            <div style={{ padding:"4px 12px", background:"#161b22", borderBottom:"1px solid #21262d", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#495366", letterSpacing:1, textTransform:"uppercase" }}>code</span>
              <button onClick={() => navigator.clipboard?.writeText(p.code)} style={{ background:"none", border:"none", color:"#495366", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9 }}>⎘ copy</button>
            </div>
            <pre style={{ margin:0, padding:"10px 14px", fontFamily:"'JetBrains Mono',monospace", fontSize:12, lineHeight:1.7, color:"#c9d1d9", overflowX:"auto" }}><code>{p.code}</code></pre>
          </div>
        );
      }
      return (
        <span key={i}>
          {seg.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((s, j) => {
            if (s.startsWith("**") && s.endsWith("**"))
              return <strong key={j} style={{ color:"#e6edf3", fontWeight:700 }}>{s.slice(2,-2)}</strong>;
            if (s.startsWith("`") && s.endsWith("`"))
              return <code key={j} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#ffa116", background:"#1e1608", borderRadius:4, padding:"1px 5px" }}>{s.slice(1,-1)}</code>;
            return s;
          })}
        </span>
      );
    });
  };

  return <div style={{ lineHeight:1.75, whiteSpace:"pre-wrap" }}>{render(displayed)}</div>;
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", padding:"2px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#ffa116", animation:`ai-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  "Explain the approach",
  "Give me a hint",
  "Time complexity?",
  "Show optimal solution",
  "Debug my code",
  "Step by step walkthrough",
];

// ── Main ──────────────────────────────────────────────────────────────────────
function ChatAi({ problem }) {
  const storageKey = `ai-chat-${problem?.title || "default"}`;
 const getInitialMessages = () => {
  const saved = sessionStorage.getItem(storageKey);

  if (saved) {
    return JSON.parse(saved);
  }

  return [{
    role: "model",
    parts: [{
      text: `Hello! I'm your **CodeMaster AI** assistant ⚡

I'm here to help you with **${problem?.title || "this problem"}**. Ask me for hints, explanations, complexity analysis, or debugging help!`
    }],
    streaming: false,
  }];
};

const [messages, setMessages] = useState(getInitialMessages);
  const [isThinking, setIsThinking]     = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [charCount, setCharCount]       = useState(0);
  const endRef = useRef(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const msgVal = watch("message", "");

  useEffect(() => { setCharCount(msgVal?.length || 0); }, [msgVal]);
useEffect(() => {
  endRef.current?.scrollIntoView({ behavior:"smooth" });
}, [messages, isThinking]);

useEffect(() => {
  const cleanMessages = messages.map(msg => ({
    ...msg,
    streaming: false,
  }));

  sessionStorage.setItem(storageKey, JSON.stringify(cleanMessages));
}, [messages, storageKey]);

const sendMessage = async (text) => {
  if (!text?.trim()) return;

  // create new user message
  const newUserMessage = {
    role: "user",
    parts: [{ text }],
    streaming: false,
  };

  // include latest message BEFORE API call
  const updatedMessages = [...messages, newUserMessage];

  // update UI
  setMessages(updatedMessages);

  reset();
  setIsThinking(true);

  try {
    const response = await axiosClient.post("/ai/solve", {
      messages: updatedMessages,
      title: problem?.title,
      description: problem?.description,
      testCases: problem?.visibleTestCases,
      startCode: problem?.startCode,
    });
    setIsThinking(false);
    setMessages(prev => [
      ...prev,
      {
        role: "model",
        parts: [{ text: response.data.message }],
        streaming: true,
      },
    ]);

  } catch (err) {
    console.log(err);

    setIsThinking(false);

    setMessages(prev => [
      ...prev,
      {
        role: "model",
        parts: [{ text: "⚠ Something went wrong. Please try again." }],
        streaming: false,
      },
    ]);
  }
};

  const onSubmit = (data) => sendMessage(data.message);
  // console.log(data);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .ai-root {
         display: flex;
  flex-direction: column;
  height: 80vh;
  background: #0d1117;
  color: #e6edf3;
  font-family: 'Segoe UI', -apple-system, sans-serif;
  font-size: 13px;
        }

        /* SCROLLBAR */
        .ai-messages::-webkit-scrollbar { width: 4px; }
        .ai-messages::-webkit-scrollbar-track { background: #0d1117; }
        .ai-messages::-webkit-scrollbar-thumb { background: #21262d; border-radius: 2px; }

        /* CONTEXT STRIP */
        .ai-context {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px; flex-shrink: 0;
          background: #161b22; border-bottom: 1px solid #21262d;
        }
        .ai-ctx-icon {
          width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
        }
        .ai-ctx-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; color: #ffa116; letter-spacing: 0.8px; text-transform: uppercase; }
        .ai-ctx-val   { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #8b949e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
        .ai-ctx-status {
          margin-left: auto; display: flex; align-items: center; gap: 4px;
          font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #00b86b; font-weight: 600;
        }
        .ai-ctx-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #00b86b;
          box-shadow: 0 0 5px #00b86b; animation: ai-pulse 2s ease-in-out infinite;
        }
        @keyframes ai-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }

        /* MESSAGES */
        .ai-messages {
          flex: 1; overflow-y: auto; padding: 14px 14px 8px;
          display: flex; flex-direction: column; gap: 12px; min-height: 0;
        }

        /* BUBBLES */
        .ai-row       { display: flex; align-items: flex-start; gap: 8px; }
        .ai-row.user  { flex-direction: row-reverse; }

        .ai-avatar {
          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; margin-top: 2px;
        }
        .ai-avatar.model { background: linear-gradient(135deg,#ffa116,#ff6b00); color: #0d1117; }
        .ai-avatar.user  { background: #1c2130; border: 1px solid #21262d; color: #8b949e; font-size: 10px; }

        .ai-col { display: flex; flex-direction: column; max-width: 87%; }
        .ai-col.user { align-items: flex-end; }

        .ai-bubble {
          padding: 9px 13px; border-radius: 10px;
          font-size: 13px; line-height: 1.7;
        }
        .ai-bubble.model {
          background: #161b22; border: 1px solid #21262d;
          border-top-left-radius: 3px; color: #c9d1d9;
        }
        .ai-bubble.user {
          background: #1e1608; border: 1px solid #3a2e0f;
          border-top-right-radius: 3px; color: #e6edf3; font-weight: 500;
        }
        .ai-time {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          color: #30363d; margin-top: 3px;
        }

        /* THINKING */
        .ai-think-bub {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; border-top-left-radius: 3px;
          padding: 9px 14px;
        }
        .ai-think-lbl {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          color: #ffa116; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;
        }
        @keyframes ai-dot {
          0%,80%,100% { transform:scale(0.7); opacity:.4; }
          40%          { transform:scale(1);   opacity:1; }
        }

        /* SUGGESTIONS */
        .ai-chips { padding: 6px 14px 4px; display: flex; gap: 5px; flex-wrap: wrap; flex-shrink: 0; }
        .ai-chip {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          padding: 3px 10px; border-radius: 6px;
          background: #161b22; border: 1px solid #21262d; color: #8b949e;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .ai-chip:hover { border-color: #ffa116; color: #ffa116; background: #1e1608; }

        /* ── INPUT BOX ── */
        .ai-input-area {
          padding: 10px 12px 12px;
          background: #161b22; border-top: 1px solid #21262d; flex-shrink: 0;
        }

        /* Card — column layout: textarea on top, footer strip on bottom */
        .ai-box {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 10px 12px 8px 14px;
          display: flex; flex-direction: column; gap: 0;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ai-box.focused {
          border-color: #ffa116;
          box-shadow: 0 0 0 3px rgba(255,161,22,0.08);
        }
        .ai-box.has-error { border-color: #ff4444; }

        /* Textarea — no border, fills top */
        .ai-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
          font-size: 13px; line-height: 1.6; resize: none;
          min-height: 24px; max-height: 110px;
          caret-color: #ffa116;
          padding: 0;
        }
        .ai-textarea::placeholder { color: #30363d; }

        /* Thin separator inside the card */
        .ai-box-sep {
          height: 1px; background: #21262d; margin: 8px 0 7px;
        }

        /* Footer row: hint | char-count + send-btn */
        .ai-box-footer {
          display: flex; align-items: center; justify-content: space-between;
        }
        .ai-box-hint {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #30363d;
        }
        .ai-box-right { display: flex; align-items: center; gap: 8px; }
        .ai-char {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #30363d;
        }

        /* Send button — bottom-right inside card */
        .ai-send {
          width: 28px; height: 28px; border-radius: 7px; border: none;
          background: #ffa116; color: #0d1117; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .ai-send:hover:not(:disabled) { background: #ffb347; transform: translateY(-1px); }
        .ai-send:active:not(:disabled) { transform: translateY(0); }
        .ai-send:disabled {
          background: #1c2130; color: #30363d;
          cursor: not-allowed; border: 1px solid #21262d;
        }

        /* ANIMATIONS */
        @keyframes ai-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ai-row       { animation: ai-in 0.18s ease both; }
        .ai-think-row { animation: ai-in 0.18s ease both; }
      `}</style>

      <div className="ai-root">

        {/* CONTEXT STRIP (replaces heavy header) */}
        <div className="ai-context">
          <div className="ai-ctx-icon">⚡</div>
          <span className="ai-ctx-label">AI</span>
          {problem?.title && <>
            <span style={{ color:"#21262d", fontSize:12 }}>·</span>
            <span className="ai-ctx-val">{problem.title}</span>
          </>}
          {problem?.difficulty && (
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
              borderRadius:4, padding:"1px 7px",
              color:  problem.difficulty==="Easy"?"#00b86b":problem.difficulty==="Medium"?"#ffa116":"#ff4444",
              background: problem.difficulty==="Easy"?"#0d2218":problem.difficulty==="Medium"?"#1e1608":"#1a0808",
              border: `1px solid ${problem.difficulty==="Easy"?"#1a3a2a":problem.difficulty==="Medium"?"#3a2e0f":"#3a1a1a"}`,
            }}>{problem.difficulty}</span>
          )}
          <div className="ai-ctx-status">
            <div className="ai-ctx-dot" /> ONLINE
          </div>
        </div>

        {/* MESSAGES */}
        <div className="ai-messages">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const time = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
            return (
              <div key={i} className={`ai-row${isUser ? " user" : ""}`}>
                <div className={`ai-avatar ${isUser ? "user" : "model"}`}>
                  {isUser ? "U" : "⚡"}
                </div>
                <div className={`ai-col${isUser ? " user" : ""}`}>
                  <div className={`ai-bubble ${isUser ? "user" : "model"}`}>
                    {isUser
                      ? msg.parts[0].text
                      : <StreamText text={msg.parts[0].text} isStreaming={!!msg.streaming} />
                    }
                  </div>
                  <div className="ai-time">{time}</div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="ai-think-row ai-row">
              <div className="ai-avatar model">⚡</div>
              <div className="ai-think-bub">
                <div className="ai-think-lbl">Thinking…</div>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* SUGGESTION CHIPS */}
        {messages.length <= 1 && !isThinking && (
          <div className="ai-chips">
            {SUGGESTIONS.map(s => (
              <button key={s} className="ai-chip" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}

        {/* INPUT */}
        <div className="ai-input-area">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={[
              "ai-box",
              inputFocused ? "focused" : "",
              errors.message ? "has-error" : "",
            ].join(" ").trim()}>

              {/* Textarea — top of card */}
              <textarea
                rows={1}
                placeholder="Ask for hints, explanations, debugging help…"
                className="ai-textarea"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(onSubmit)();
                  }
                }}
                {...register("message", { required: true, minLength: 2 })}
              />

              {/* Separator */}
              <div className="ai-box-sep" />

              {/* Footer: hint ←→ char + send */}
              <div className="ai-box-footer">
                <span className="ai-box-hint">↵ send · shift+↵ newline</span>
                <div className="ai-box-right">
                  <span className="ai-char" style={{ color: charCount > 400 ? "#ff4444" : "#30363d" }}>
                    {charCount}/500
                  </span>
                  <button
                    type="submit"
                    className="ai-send"
                    disabled={isThinking || !!errors.message || charCount < 2}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>

      </div>
    </>
  );
}

export default ChatAi;