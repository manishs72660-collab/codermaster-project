import { useState, useRef, useEffect } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: "general",       name: "general",        icon: "#", desc: "Casual talk & intros",           unread: 0  },
  { id: "problem-help",  name: "problem-help",   icon: "?", desc: "Stuck? Ask the community",       unread: 3  },
  { id: "solutions",     name: "solutions",      icon: "✓", desc: "Share your accepted solutions",  unread: 7  },
  { id: "interview-prep",name: "interview-prep", icon: "◈", desc: "FAANG prep & mock Q&A",          unread: 0  },
  { id: "code-review",   name: "code-review",    icon: "⌥", desc: "Paste code, get feedback",       unread: 1  },
  { id: "contest",       name: "contest-live",   icon: "⚡", desc: "Live during contests",           unread: 0, live: true },
  { id: "off-topic",     name: "off-topic",      icon: "~", desc: "Memes & life",                   unread: 0  },
];

const STUDY_GROUPS = [
  { id: "sg1", name: "DSA Grind Squad",     members: 5, goal: "50 mediums by June", color: "#ffa116" },
  { id: "sg2", name: "FAANG Prep 2024",     members: 3, goal: "100 problems",       color: "#4493f8" },
  { id: "sg3", name: "Graph Theory Gang",   members: 4, goal: "Master graphs",      color: "#00b86b" },
];

const ONLINE_MEMBERS = [
  { id: 1,  name: "arjun_dev",    role: "Grandmaster", solved: 312, color: "#ffa116", status: "online",  coding: true  },
  { id: 2,  name: "priya_codes",  role: "Master",      solved: 201, color: "#4493f8", status: "online",  coding: false },
  { id: 3,  name: "rohan_r",      role: "Master",      solved: 178, color: "#00b86b", status: "online",  coding: true  },
  { id: 4,  name: "sneha_dsa",    role: "Expert",      solved: 89,  color: "#c084fc", status: "idle",    coding: false },
  { id: 5,  name: "vikram_cp",    role: "Expert",      solved: 134, color: "#ff4444", status: "online",  coding: false },
  { id: 6,  name: "nisha_g",      role: "Specialist",  solved: 45,  color: "#ffa116", status: "offline", coding: false },
];

const MESSAGES_BY_CHANNEL = {
  "general": [
    { id: 1,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "10:02 AM", type: "text",     content: "Good morning everyone! Ready to grind today? 💪" },
    { id: 2,  author: "priya_codes", color: "#4493f8", role: "Master",      time: "10:05 AM", type: "text",     content: "Morning! Just got my daily challenge done. Easy today 😅" },
    { id: 3,  author: "rohan_r",     color: "#00b86b", role: "Master",      time: "10:08 AM", type: "text",     content: "Anyone doing the weekly contest this Saturday?" },
    { id: 4,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "10:11 AM", type: "text",     content: "I'm in! Let's make a team" },
    { id: 5,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "10:14 AM", type: "text",     content: "Count me in. Meet in #contest-live when it starts" },
  ],
  "problem-help": [
    { id: 1,  author: "sneha_dsa",   color: "#c084fc", role: "Expert",      time: "9:30 AM",  type: "text",     content: "Hey, I'm stuck on Longest Common Subsequence. I understand the DP approach conceptually but can't get the transitions right." },
    { id: 2,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "9:32 AM",  type: "text",     content: "Share your code and I'll take a look 👀" },
    { id: 3,  author: "sneha_dsa",   color: "#c084fc", role: "Expert",      time: "9:33 AM",  type: "code",     lang: "javascript", content: `function lcs(text1, text2) {\n  const m = text1.length, n = text2.length;\n  const dp = Array(m+1).fill(0).map(() => Array(n+1).fill(0));\n  \n  for (let i = 1; i <= m; i++) {\n    for (let j = 1; j <= n; j++) {\n      if (text1[i-1] === text2[j-1]) {\n        dp[i][j] = dp[i-1][j-1]; // bug here?\n      } else {\n        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);\n      }\n    }\n  }\n  return dp[m][n];\n}` },
    { id: 4,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "9:35 AM",  type: "text",     content: "Found it! Line 7 — when characters match you need dp[i-1][j-1] + 1, you're missing the +1. That's the whole trick — you're extending the previous LCS by 1." },
    { id: 5,  author: "sneha_dsa",   color: "#c084fc", role: "Expert",      time: "9:36 AM",  type: "text",     content: "OH. Oh wow I can't believe I missed that. Thank you!! Accepted ✓" },
    { id: 6,  author: "priya_codes", color: "#4493f8", role: "Master",      time: "9:38 AM",  type: "text",     content: "Classic off-by-one 😄 happens to everyone" },
  ],
  "solutions": [
    { id: 1,  author: "rohan_r",     color: "#00b86b", role: "Master",      time: "8:50 AM",  type: "solution", problem: "Two Sum", difficulty: "Easy", lang: "C++", runtime: "4ms", memory: "10.2MB", content: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int,int> mp;\n        for(int i = 0; i < nums.size(); i++) {\n            if(mp.count(target - nums[i]))\n                return {mp[target-nums[i]], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};` },
    { id: 2,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "9:15 AM",  type: "solution", problem: "Valid Parentheses", difficulty: "Easy", lang: "JavaScript", runtime: "52ms", memory: "41.8MB", content: `var isValid = function(s) {\n    const stack = [];\n    const map = {')':'(', '}':'{', ']':'['};\n    for (const c of s) {\n        if ('({['.includes(c)) stack.push(c);\n        else if (stack.pop() !== map[c]) return false;\n    }\n    return stack.length === 0;\n};` },
    { id: 3,  author: "priya_codes", color: "#4493f8", role: "Master",      time: "10:00 AM", type: "solution", problem: "Merge Intervals", difficulty: "Medium", lang: "Python", runtime: "88ms", memory: "18.3MB", content: `def merge(self, intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged` },
  ],
  "code-review": [
    { id: 1,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "11:00 AM", type: "text",     content: "Can someone review my BFS approach for word ladder? I feel like there might be a cleaner way." },
    { id: 2,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "11:01 AM", type: "code",     lang: "python", content: `from collections import deque\n\ndef ladderLength(beginWord, endWord, wordList):\n    wordSet = set(wordList)\n    queue = deque([(beginWord, 1)])\n    visited = {beginWord}\n    \n    while queue:\n        word, steps = queue.popleft()\n        for i in range(len(word)):\n            for c in 'abcdefghijklmnopqrstuvwxyz':\n                next_word = word[:i] + c + word[i+1:]\n                if next_word == endWord:\n                    return steps + 1\n                if next_word in wordSet and next_word not in visited:\n                    visited.add(next_word)\n                    queue.append((next_word, steps + 1))\n    return 0` },
    { id: 3,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "11:05 AM", type: "text",     content: "Logic is solid. One optimization: check `if next_word == endWord` should be inside the wordSet check to avoid scanning words not in dict. Also consider bidirectional BFS for large inputs — cuts search space significantly." },
  ],
  "interview-prep": [
    { id: 1,  author: "priya_codes", color: "#4493f8", role: "Master",      time: "Yesterday", type: "text",   content: "Google phone screen tomorrow 😰 Any last-minute tips?" },
    { id: 2,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "Yesterday", type: "text",   content: "1. Think out loud constantly. 2. Clarify constraints FIRST. 3. Start with brute force, then optimize. 4. Test with edge cases before you say done. You've got this 💪" },
    { id: 3,  author: "rohan_r",     color: "#00b86b", role: "Master",      time: "Yesterday", type: "text",   content: "Also — if you get stuck, verbalize your thought process. They're evaluating how you think, not just the final answer." },
    { id: 4,  author: "priya_codes", color: "#4493f8", role: "Master",      time: "2h ago",    type: "text",   content: "Update: Got through to the next round!! Thank you all 🎉" },
    { id: 5,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "2h ago",    type: "text",   content: "LETS GOOO 🔥🔥🔥" },
  ],
  "contest": [
    { id: 1,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "11:00 AM", type: "text",    content: "Contest starts in 5 minutes! Good luck everyone ⚡" },
    { id: 2,  author: "rohan_r",     color: "#00b86b", role: "Master",      time: "11:01 AM", type: "text",    content: "P1 down in 4 min, moving to P2" },
    { id: 3,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "11:08 AM", type: "text",    content: "P1 was sneaky, the edge case with empty array got me once" },
  ],
  "off-topic": [
    { id: 1,  author: "sneha_dsa",   color: "#c084fc", role: "Expert",      time: "Yesterday", type: "text",   content: "Unpopular opinion: Python is the best language for interviews because you spend 0% time on syntax and 100% on logic" },
    { id: 2,  author: "vikram_cp",   color: "#ff4444", role: "Expert",      time: "Yesterday", type: "text",   content: "Respectfully disagree — C++ has STL and it's insanely fast" },
    { id: 3,  author: "arjun_dev",   color: "#ffa116", role: "Grandmaster", time: "Yesterday", type: "text",   content: "Both valid. Use whatever you're fastest in. Speed of thought > speed of code." },
  ],
};

const REACTIONS = ["✓ AC", "🤔 Hint?", "🔥 Fire", "💡 Clever", "👀 Reviewing"];
const DAILY_CHALLENGE = { title: "Longest Palindromic Substring", difficulty: "Medium", tag: "DP", solvers: 142, timeLeft: "11h 24m" };

// ─── SYNTAX HIGHLIGHT (lightweight) ─────────────────────────────────────────
function CodeBlock({ code, lang, onRunInEditor }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const highlight = (line) => {
    const keywords = /\b(function|const|let|var|return|if|else|for|while|class|import|export|def|from|in|not|and|or|true|false|null|void|int|vector|auto|public|private|new|this|of)\b/g;
    const strings  = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
    const comments = /(\/\/.*|#.*)/g;
    const nums     = /\b(\d+\.?\d*)\b/g;
    return line
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(comments,  '<span style="color:#495366;font-style:italic">$1</span>')
      .replace(strings,   '<span style="color:#00b86b">$1</span>')
      .replace(keywords,  '<span style="color:#ffa116;font-weight:600">$1</span>')
      .replace(nums,      '<span style="color:#4493f8">$1</span>');
  };

  return (
    <div style={{ margin: "6px 0 2px", background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8, overflow: "hidden", maxWidth: 520 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", background: "#111", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f56","#ffbd2e","#27c93f"].map((c,i) => <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:c }} />)}
        </div>
        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"#333", letterSpacing:1 }}>{lang}</span>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={copy} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,color:copied?"#00b86b":"#444",padding:0 }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
          {onRunInEditor && (
            <button onClick={onRunInEditor} style={{ background:"#ffa116",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,color:"#0a0a0a",fontWeight:700,padding:"2px 8px",borderRadius:4 }}>
              ▶ Run
            </button>
          )}
        </div>
      </div>
      <div style={{ padding:"12px 14px", overflowX:"auto" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display:"flex", gap:12, lineHeight:"1.65" }}>
            <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"#2a2a2a",userSelect:"none",width:20,textAlign:"right",flexShrink:0 }}>{i+1}</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"#c9d1d9" }} dangerouslySetInnerHTML={{ __html: highlight(line) || "&nbsp;" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SOLUTION CARD ───────────────────────────────────────────────────────────
function SolutionCard({ msg, onTryProblem, onRunInEditor }) {
  const [open, setOpen] = useState(false);
  const diffColor = { Easy:"#00b86b", Medium:"#ffa116", Hard:"#ff4444" };
  return (
    <div style={{ margin:"6px 0 2px", background:"#0f1a12", border:"1px solid rgba(0,184,107,0.2)", borderLeft:"3px solid #00b86b", borderRadius:8, overflow:"hidden", maxWidth:520 }}>
      <div style={{ padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:12, color:"#00b86b", fontWeight:700 }}>✓ Accepted</span>
          <span style={{ fontFamily:"var(--mono)",fontSize:9,color:diffColor[msg.difficulty],background:`${diffColor[msg.difficulty]}18`,border:`1px solid ${diffColor[msg.difficulty]}33`,padding:"1px 7px",borderRadius:4,letterSpacing:0.5,textTransform:"uppercase" }}>{msg.difficulty}</span>
        </div>
        <div style={{ fontSize:13,fontWeight:700,color:"#e6edf3",marginBottom:4 }}>{msg.problem}</div>
        <div style={{ display:"flex",gap:14,fontFamily:"var(--mono)",fontSize:10,color:"#555" }}>
          <span>⌨ {msg.lang}</span>
          <span>⚡ {msg.runtime}</span>
          <span>◉ {msg.memory}</span>
        </div>
      </div>
      <div style={{ borderTop:"1px solid rgba(0,184,107,0.12)", padding:"8px 14px", display:"flex", gap:8 }}>
        <button onClick={() => setOpen(!open)} style={{ background:"none",border:"1px solid #1e1e1e",color:"#555",fontFamily:"var(--mono)",fontSize:10,padding:"4px 12px",cursor:"pointer",borderRadius:4,transition:"all 0.15s" }}
          onMouseEnter={e=>{ e.target.style.borderColor="#ffa116"; e.target.style.color="#ffa116"; }}
          onMouseLeave={e=>{ e.target.style.borderColor="#1e1e1e"; e.target.style.color="#555"; }}>
          {open ? "Hide Code" : "View Code"}
        </button>
        <button onClick={onTryProblem} style={{ background:"none",border:"1px solid rgba(0,184,107,0.3)",color:"#00b86b",fontFamily:"var(--mono)",fontSize:10,padding:"4px 12px",cursor:"pointer",borderRadius:4 }}>
          Try Problem →
        </button>
      </div>
      {open && <div style={{ borderTop:"1px solid rgba(0,184,107,0.12)" }}><CodeBlock code={msg.content} lang={msg.lang} onRunInEditor={onRunInEditor} /></div>}
    </div>
  );
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
function Message({ msg, showAvatar, onRunInEditor, onTryProblem }) {
  const [reactions, setReactions] = useState({});
  const [showReactPicker, setShowReactPicker] = useState(false);
  const initials = msg.author.slice(0,2).toUpperCase();

  const addReaction = (emoji) => {
    setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    setShowReactPicker(false);
  };

  return (
    <div
      style={{ display:"flex",gap:12,padding:"3px 20px",position:"relative" }}
      onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.015)"; e.currentTarget.querySelector?.(".msg-actions")?.style && (e.currentTarget.querySelector(".msg-actions").style.opacity="1"); }}
      onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.querySelector?.(".msg-actions")?.style && (e.currentTarget.querySelector(".msg-actions").style.opacity="0"); }}
    >
      {/* avatar column */}
      <div style={{ width:36,flexShrink:0,paddingTop:2 }}>
        {showAvatar ? (
          <div style={{ width:36,height:36,borderRadius:8,background:"#111",border:`2px solid ${msg.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:msg.color }}>
            {initials}
          </div>
        ) : (
          <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"#2a2a2a",display:"block",paddingTop:8,textAlign:"right" }}>{msg.time.split(" ")[0]}</span>
        )}
      </div>

      {/* content */}
      <div style={{ flex:1,minWidth:0 }}>
        {showAvatar && (
          <div style={{ display:"flex",alignItems:"baseline",gap:8,marginBottom:3 }}>
            <span style={{ fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:msg.color }}>{msg.author}</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"#333",background:"#111",border:"1px solid #1e1e1e",padding:"0px 6px",borderRadius:3 }}>{msg.role}</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"#333" }}>{msg.time}</span>
          </div>
        )}

        {msg.type === "text" && (
          <p style={{ fontSize:13.5,color:"#c9d1d9",lineHeight:1.55,margin:0 }}>{msg.content}</p>
        )}
        {msg.type === "code" && (
          <CodeBlock code={msg.content} lang={msg.lang} onRunInEditor={onRunInEditor} />
        )}
        {msg.type === "solution" && (
          <SolutionCard msg={msg} onTryProblem={onTryProblem} onRunInEditor={onRunInEditor} />
        )}

        {/* reactions */}
        {Object.keys(reactions).length > 0 && (
          <div style={{ display:"flex",gap:5,marginTop:5,flexWrap:"wrap" }}>
            {Object.entries(reactions).map(([emoji, count]) => (
              <button key={emoji} onClick={() => addReaction(emoji)} style={{ background:"rgba(255,161,22,0.08)",border:"1px solid rgba(255,161,22,0.2)",borderRadius:12,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:11,color:"#ffa116",cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                {emoji} <span style={{ fontSize:10 }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* hover actions */}
      <div className="msg-actions" style={{ position:"absolute",right:20,top:-14,opacity:0,transition:"opacity 0.12s",display:"flex",gap:3,background:"#111",border:"1px solid #1e1e1e",borderRadius:8,padding:"4px 6px",zIndex:10 }}>
        {["✓ AC","🔥","💡","👀"].map(emoji => (
          <button key={emoji} title={emoji} onClick={() => addReaction(emoji)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",borderRadius:4,color:"#555",transition:"color 0.1s" }}
            onMouseEnter={e=>e.target.style.color="#ffa116"} onMouseLeave={e=>e.target.style.color="#555"}>
            {emoji}
          </button>
        ))}
        <div style={{ width:1,background:"#1e1e1e",margin:"2px 2px" }} />
        <button style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,padding:"2px 4px",color:"#555",fontFamily:"var(--mono)" }}>↩</button>
      </div>
    </div>
  );
}

// ─── MAIN ARENA COMPONENT ────────────────────────────────────────────────────
export default function ArenaChat({ currentUser = { name:"You", username:"you", role:"Master" } }) {
  const [activeChannel, setActiveChannel]   = useState("general");
  const [activeView, setActiveView]         = useState("channels"); // channels | studygroups
  const [input, setInput]                   = useState("");
  const [messages, setMessages]             = useState(MESSAGES_BY_CHANNEL);
  const [showMemberPanel, setShowMemberPanel] = useState(true);
  const [typingUsers]                       = useState(["priya_codes"]);
  const [searchQuery, setSearchQuery]       = useState("");
  const feedRef                             = useRef(null);

  const channel     = CHANNELS.find(c => c.id === activeChannel);
  const channelMsgs = messages[activeChannel] || [];

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [activeChannel, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id:      Date.now(),
      author:  currentUser.username || "you",
      color:   "#ffa116",
      role:    currentUser.role,
      time:    new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      type:    "text",
      content: input.trim(),
    };
    setMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel]||[]), newMsg] }));
    setInput("");
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const filteredChannels = CHANNELS.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const diffColor = { Easy:"#00b86b", Medium:"#ffa116", Hard:"#ff4444" };
  const onlineCount = ONLINE_MEMBERS.filter(m => m.status !== "offline").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        :root {
          --mono:    'JetBrains Mono', monospace;
          --sans:    'DM Sans', sans-serif;
          --bg:      #0a0a0a;
          --s1:      #0e0e0e;
          --s2:      #111111;
          --s3:      #161616;
          --s4:      #1a1a1a;
          --line:    #1e1e1e;
          --line2:   #252525;
          --text:    #e6edf3;
          --muted:   #7d8590;
          --dim:     #3a3a3a;
          --orange:  #ffa116;
          --green:   #00b86b;
          --red:     #ff4444;
          --blue:    #4493f8;
          --purple:  #c084fc;
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        .arena-root { font-family:var(--sans); background:var(--bg); color:var(--text); height:100vh; display:flex; flex-direction:column; overflow:hidden; }

        /* scrollbars */
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:2px; }

        /* topbar */
        .arena-topbar { height:48px; background:var(--s1); border-bottom:1px solid var(--line); display:flex; align-items:center; padding:0 20px; gap:10px; flex-shrink:0; z-index:50; position:relative; }
        .arena-topbar::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,161,22,0.25),transparent); }
        .logo-sq { width:28px;height:28px;background:var(--orange);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#0a0a0a; }

        /* layout */
        .arena-body { flex:1; display:flex; overflow:hidden; }

        /* left sidebar */
        .arena-sidebar { width:220px; flex-shrink:0; background:var(--s1); border-right:1px solid var(--line); display:flex; flex-direction:column; overflow:hidden; }
        .sidebar-section-hdr { padding:16px 14px 6px; display:flex; align-items:center; justify-content:space-between; }
        .sidebar-section-lbl { font-family:var(--mono); font-size:9px; font-weight:700; color:var(--dim); letter-spacing:1.8px; text-transform:uppercase; }
        .sidebar-add-btn { width:18px;height:18px;background:var(--s3);border:1px solid var(--line2);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--dim);font-size:12px;transition:all 0.12s; }
        .sidebar-add-btn:hover { background:var(--s4);color:var(--orange);border-color:rgba(255,161,22,0.3); }

        .channel-item { display:flex;align-items:center;gap:8px;padding:5px 10px;margin:1px 6px;border-radius:6px;cursor:pointer;transition:background 0.1s;position:relative; }
        .channel-item:hover { background:var(--s3); }
        .channel-item.active { background:var(--s4); }
        .channel-icon { font-family:var(--mono);font-size:12px;color:var(--dim);width:16px;text-align:center;flex-shrink:0; }
        .channel-item.active .channel-icon { color:var(--orange); }
        .channel-name { font-family:var(--mono);font-size:12px;color:var(--muted);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .channel-item.active .channel-name { color:var(--text); }
        .channel-unread { font-family:var(--mono);font-size:9px;background:var(--orange);color:#0a0a0a;font-weight:800;padding:1px 5px;border-radius:8px;flex-shrink:0; }
        .live-dot { width:6px;height:6px;border-radius:50%;background:#ff4444;flex-shrink:0;box-shadow:0 0 6px rgba(255,68,68,0.8);animation:blink 1.4s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

        .sg-item { display:flex;align-items:center;gap:8px;padding:6px 10px;margin:1px 6px;border-radius:6px;cursor:pointer;transition:background 0.12s; }
        .sg-item:hover { background:var(--s3); }
        .sg-item.active { background:var(--s4); }
        .sg-dot { width:8px;height:8px;border-radius:2px;flex-shrink:0; }
        .sg-name { font-family:var(--mono);font-size:11px;color:var(--muted);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .sg-count { font-family:var(--mono);font-size:9px;color:var(--dim); }

        /* view toggle */
        .view-toggle { display:flex;margin:10px 10px 6px;background:var(--s3);border:1px solid var(--line);border-radius:6px;overflow:hidden; }
        .vt-btn { flex:1;background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:10px;font-weight:600;color:var(--dim);padding:6px 0;letter-spacing:0.5px;transition:all 0.12s; }
        .vt-btn.active { background:var(--s4);color:var(--orange); }

        /* search */
        .sidebar-search { margin:0 8px 8px;position:relative; }
        .sidebar-search input { width:100%;background:var(--s3);border:1px solid var(--line);border-radius:6px;padding:6px 10px 6px 28px;font-family:var(--mono);font-size:11px;color:var(--muted);outline:none;transition:border-color 0.15s; }
        .sidebar-search input:focus { border-color:rgba(255,161,22,0.35);color:var(--text); }
        .sidebar-search input::placeholder { color:var(--dim); }
        .sidebar-search-icon { position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--dim);font-size:11px;pointer-events:none; }

        /* main feed */
        .arena-feed-wrap { flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0; }
        .feed-header { height:44px;background:var(--s1);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 20px;gap:10px;flex-shrink:0; }
        .feed-channel-icon { font-family:var(--mono);font-size:16px;color:var(--orange); }
        .feed-channel-name { font-family:var(--mono);font-size:13px;font-weight:700;color:var(--text); }
        .feed-channel-desc { font-size:12px;color:var(--dim); }
        .feed-sep { width:1px;height:18px;background:var(--line2); }

        .feed-messages { flex:1;overflow-y:auto;padding:16px 0; }
        .day-divider { display:flex;align-items:center;gap:12px;padding:12px 20px;margin:8px 0; }
        .day-line { flex:1;height:1px;background:var(--line); }
        .day-label { font-family:var(--mono);font-size:9px;color:var(--dim);letter-spacing:1px;text-transform:uppercase; }

        /* typing */
        .typing-indicator { padding:6px 20px 10px;height:32px;display:flex;align-items:center;gap:8px; }
        .typing-dots { display:flex;gap:3px;align-items:center; }
        .typing-dot { width:5px;height:5px;border-radius:50%;background:var(--dim); }
        .typing-dot:nth-child(1) { animation:td 1.2s ease-in-out infinite 0s; }
        .typing-dot:nth-child(2) { animation:td 1.2s ease-in-out infinite 0.2s; }
        .typing-dot:nth-child(3) { animation:td 1.2s ease-in-out infinite 0.4s; }
        @keyframes td { 0%,80%,100%{transform:scale(1);opacity:0.4;} 40%{transform:scale(1.3);opacity:1;} }
        .typing-text { font-family:var(--mono);font-size:10px;color:var(--dim);font-style:italic; }

        /* input */
        .feed-input-wrap { padding:0 16px 16px;flex-shrink:0; }
        .feed-input-box { background:var(--s2);border:1px solid var(--line2);border-radius:10px;display:flex;align-items:flex-end;gap:0;overflow:hidden;transition:border-color 0.15s; }
        .feed-input-box:focus-within { border-color:rgba(255,161,22,0.3); }
        .feed-input-box textarea { flex:1;background:none;border:none;outline:none;padding:12px 14px;font-family:var(--sans);font-size:13.5px;color:var(--text);resize:none;max-height:120px;line-height:1.5; }
        .feed-input-box textarea::placeholder { color:var(--dim); }
        .input-actions { display:flex;align-items:center;gap:4px;padding:8px 10px; }
        .input-act-btn { width:30px;height:30px;background:none;border:none;cursor:pointer;color:var(--dim);font-size:14px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.12s; }
        .input-act-btn:hover { background:var(--s4);color:var(--muted); }
        .send-btn { width:34px;height:34px;background:var(--orange);border:none;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#0a0a0a;font-weight:800;transition:all 0.12s; }
        .send-btn:hover { background:#ffb347;transform:scale(1.05); }
        .send-btn:disabled { opacity:0.3;cursor:not-allowed;transform:none; }

        /* right panel */
        .arena-right { width:248px;flex-shrink:0;background:var(--s1);border-left:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden; }
        .right-section { border-bottom:1px solid var(--line); }
        .right-section-hdr { padding:12px 14px 10px;font-family:var(--mono);font-size:9px;font-weight:700;color:var(--dim);letter-spacing:1.8px;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between; }
        .right-scroll { overflow-y:auto;flex:1; }

        /* daily challenge card */
        .daily-card { margin:0 10px 12px;background:var(--s3);border:1px solid rgba(255,161,22,0.2);border-left:3px solid var(--orange);border-radius:8px;padding:12px; }
        .daily-label { font-family:var(--mono);font-size:8px;color:var(--orange);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px; }
        .daily-title { font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:6px;line-height:1.3; }
        .daily-meta { display:flex;gap:8px;margin-bottom:10px; }
        .daily-badge { font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid;text-transform:uppercase;letter-spacing:0.4px; }
        .daily-timer { font-family:var(--mono);font-size:10px;color:var(--dim); }
        .daily-btn { width:100%;background:rgba(255,161,22,0.1);border:1px solid rgba(255,161,22,0.25);color:var(--orange);font-family:var(--mono);font-size:10px;font-weight:700;padding:6px 0;border-radius:5px;cursor:pointer;letter-spacing:0.5px;transition:all 0.12s; }
        .daily-btn:hover { background:rgba(255,161,22,0.18); }

        /* member row */
        .member-row { display:flex;align-items:center;gap:8px;padding:6px 14px;transition:background 0.1s;cursor:pointer; }
        .member-row:hover { background:var(--s3); }
        .member-avatar { width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:700;flex-shrink:0;position:relative; }
        .member-status { position:absolute;bottom:-2px;right:-2px;width:8px;height:8px;border-radius:50%;border:2px solid var(--s1); }
        .member-name { font-family:var(--mono);font-size:11px;color:var(--muted);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .member-coding { font-family:var(--mono);font-size:8px;color:var(--green);letter-spacing:0.5px; }
        .member-solved { font-family:var(--mono);font-size:9px;color:var(--dim); }
        .member-section-lbl { padding:10px 14px 4px;font-family:var(--mono);font-size:8.5px;font-weight:700;color:var(--dim);letter-spacing:2px;text-transform:uppercase; }

        /* welcome banner */
        .welcome-banner { margin:16px 20px;background:linear-gradient(135deg,rgba(255,161,22,0.06),transparent);border:1px solid rgba(255,161,22,0.12);border-radius:10px;padding:16px; }
        .welcome-icon { font-size:24px;margin-bottom:8px; }
        .welcome-title { font-family:var(--mono);font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px; }
        .welcome-desc { font-size:12px;color:var(--muted);line-height:1.5; }
      `}</style>

      <div className="arena-root">

        {/* ── TOPBAR ── */}
        <div className="arena-topbar">
          <div className="logo-sq">⌨</div>
          <span style={{ fontFamily:"var(--sans)",fontWeight:700,fontSize:14,letterSpacing:-0.3 }}>CodeMaster</span>
          <div style={{ width:1,height:18,background:"var(--line2)",margin:"0 4px" }} />
          <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--orange)",fontWeight:600 }}>The Arena</span>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex",alignItems:"center",gap:6,fontFamily:"var(--mono)",fontSize:10,color:"var(--dim)" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 6px rgba(0,184,107,0.6)" }} />
            {onlineCount} online
          </div>
          <button onClick={() => setShowMemberPanel(p=>!p)} style={{ background:"none",border:"1px solid var(--line2)",borderRadius:6,color:"var(--dim)",fontFamily:"var(--mono)",fontSize:10,padding:"4px 10px",cursor:"pointer",transition:"all 0.12s",marginLeft:8 }}
            onMouseEnter={e=>{e.target.style.borderColor="var(--orange)";e.target.style.color="var(--orange)";}}
            onMouseLeave={e=>{e.target.style.borderColor="var(--line2)";e.target.style.color="var(--dim)";}}>
            {showMemberPanel ? "◧ Hide" : "◨ Show"} Panel
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="arena-body">

          {/* ── LEFT SIDEBAR ── */}
          <div className="arena-sidebar">

            {/* view toggle */}
            <div className="view-toggle">
              <button className={`vt-btn${activeView==="channels"?" active":""}`} onClick={()=>setActiveView("channels")}>Channels</button>
              <button className={`vt-btn${activeView==="studygroups"?" active":""}`} onClick={()=>setActiveView("studygroups")}>Study</button>
            </div>

            {/* search */}
            <div className="sidebar-search">
              <span className="sidebar-search-icon">⌕</span>
              <input placeholder="Search…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
            </div>

            <div style={{ flex:1,overflowY:"auto" }}>
              {activeView === "channels" ? (
                <>
                  <div className="sidebar-section-hdr">
                    <span className="sidebar-section-lbl">Text Channels</span>
                    <div className="sidebar-add-btn" title="Create channel">+</div>
                  </div>
                  {filteredChannels.map(ch => (
                    <div key={ch.id} className={`channel-item${activeChannel===ch.id?" active":""}`} onClick={()=>setActiveChannel(ch.id)}>
                      <span className="channel-icon">{ch.icon}</span>
                      <span className="channel-name">{ch.name}</span>
                      {ch.live && <div className="live-dot" />}
                      {ch.unread > 0 && !ch.live && <span className="channel-unread">{ch.unread}</span>}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="sidebar-section-hdr">
                    <span className="sidebar-section-lbl">Study Groups</span>
                    <div className="sidebar-add-btn" title="Create group">+</div>
                  </div>
                  {STUDY_GROUPS.map(sg => (
                    <div key={sg.id} className="sg-item">
                      <div className="sg-dot" style={{ background:sg.color }} />
                      <div style={{ flex:1,minWidth:0 }}>
                        <div className="sg-name">{sg.name}</div>
                        <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)" }}>{sg.goal}</div>
                      </div>
                      <span className="sg-count">{sg.members}👤</span>
                    </div>
                  ))}
                  <div style={{ padding:"14px 10px 8px" }}>
                    <button style={{ width:"100%",background:"rgba(255,161,22,0.08)",border:"1px solid rgba(255,161,22,0.2)",borderRadius:6,color:"var(--orange)",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,padding:"7px 0",cursor:"pointer",letterSpacing:0.5 }}>
                      + Create Study Group
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* user footer */}
            <div style={{ padding:"10px 12px",borderTop:"1px solid var(--line)",background:"var(--s2)",display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:30,height:30,borderRadius:7,background:"#111",border:"2px solid var(--orange)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:"var(--orange)",flexShrink:0 }}>
                {(currentUser.username||"Y").slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{currentUser.username||"you"}</div>
                <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--green)" }}>● Online</div>
              </div>
              <span style={{ fontSize:14,cursor:"pointer",color:"var(--dim)" }} title="Settings">⚙</span>
            </div>
          </div>

          {/* ── FEED ── */}
          <div className="arena-feed-wrap">
            <div className="feed-header">
              <span className="feed-channel-icon">{channel?.icon}</span>
              <span className="feed-channel-name">{channel?.name}</span>
              <div className="feed-sep" />
              <span className="feed-channel-desc">{channel?.desc}</span>
              <div style={{ flex:1 }} />
              {channel?.live && (
                <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.25)",borderRadius:6,padding:"3px 10px" }}>
                  <div className="live-dot" />
                  <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"#ff4444",fontWeight:700,letterSpacing:0.5 }}>LIVE</span>
                </div>
              )}
              <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--dim)",marginLeft:8 }}>{channelMsgs.length} messages</span>
            </div>

            {/* messages */}
            <div className="feed-messages" ref={feedRef}>
              {/* welcome banner for first load */}
              {activeChannel === "general" && (
                <div className="welcome-banner">
                  <div className="welcome-icon">⚔️</div>
                  <div className="welcome-title">Welcome to The Arena</div>
                  <div className="welcome-desc">This is the start of #{channel?.name}. Ask questions, share solutions, connect with fellow coders.</div>
                </div>
              )}

              <div className="day-divider">
                <div className="day-line" />
                <span className="day-label">Today</span>
                <div className="day-line" />
              </div>

              {channelMsgs.map((msg, i) => {
                const prevMsg = channelMsgs[i - 1];
                const showAvatar = !prevMsg || prevMsg.author !== msg.author;
                return (
                  <Message
                    key={msg.id}
                    msg={msg}
                    showAvatar={showAvatar}
                    onRunInEditor={() => alert(`Opening "${msg.problem || 'code'}" in Editor…`)}
                    onTryProblem={() => alert(`Navigate to problem: ${msg.problem}`)}
                  />
                );
              })}

              {/* typing indicator */}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                  <span className="typing-text">{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…</span>
                </div>
              )}
            </div>

            {/* input */}
            <div className="feed-input-wrap">
              <div className="feed-input-box">
                <textarea
                  rows={1}
                  placeholder={`Message #${channel?.name}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <div className="input-actions">
                  <button className="input-act-btn" title="Attach code">⌥</button>
                  <button className="input-act-btn" title="Emoji">◉</button>
                  <button className="send-btn" onClick={sendMessage} disabled={!input.trim()} title="Send (Enter)">↑</button>
                </div>
              </div>
              <div style={{ marginTop:6,fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",paddingLeft:4 }}>
                Enter to send · Shift+Enter for new line · /share to post a solution
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          {showMemberPanel && (
            <div className="arena-right">

              {/* Daily Challenge */}
              <div className="right-section">
                <div className="right-section-hdr">
                  Daily Challenge
                  <span style={{ color:"var(--orange)",fontSize:8 }}>NEW</span>
                </div>
                <div className="daily-card">
                  <div className="daily-label">⚡ Today's Problem</div>
                  <div className="daily-title">{DAILY_CHALLENGE.title}</div>
                  <div className="daily-meta">
                    <span className="daily-badge" style={{ color:diffColor[DAILY_CHALLENGE.difficulty],borderColor:`${diffColor[DAILY_CHALLENGE.difficulty]}33`,background:`${diffColor[DAILY_CHALLENGE.difficulty]}12` }}>
                      {DAILY_CHALLENGE.difficulty}
                    </span>
                    <span className="daily-badge" style={{ color:"var(--muted)",borderColor:"var(--line2)",background:"transparent" }}>
                      {DAILY_CHALLENGE.tag}
                    </span>
                  </div>
                  <div className="daily-timer" style={{ marginBottom:10 }}>
                    {DAILY_CHALLENGE.solvers} solved · {DAILY_CHALLENGE.timeLeft} left
                  </div>
                  <button className="daily-btn">Solve Now →</button>
                </div>
              </div>

              {/* Members */}
              <div className="right-scroll">
                <div className="right-section-hdr" style={{ padding:"14px 14px 6px" }}>
                  Members — {onlineCount} online
                </div>

                <div className="member-section-lbl">Online</div>
                {ONLINE_MEMBERS.filter(m=>m.status!=="offline").map(m => (
                  <div key={m.id} className="member-row">
                    <div className="member-avatar" style={{ background:`${m.color}18`,border:`1px solid ${m.color}33`,color:m.color }}>
                      {m.name.slice(0,2).toUpperCase()}
                      <div className="member-status" style={{ background:m.status==="idle"?"#ffbd2e":m.color }} />
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div className="member-name" style={{ color:m.status==="idle"?"var(--dim)":"var(--muted)" }}>{m.name}</div>
                      {m.coding
                        ? <div className="member-coding">⌨ coding…</div>
                        : <div className="member-solved">{m.solved} solved</div>
                      }
                    </div>
                    <span style={{ fontFamily:"var(--mono)",fontSize:8,color:"var(--dim)",background:"var(--s3)",border:"1px solid var(--line)",padding:"1px 5px",borderRadius:3 }}>{m.role.slice(0,4)}</span>
                  </div>
                ))}

                <div className="member-section-lbl" style={{ marginTop:6 }}>Offline</div>
                {ONLINE_MEMBERS.filter(m=>m.status==="offline").map(m => (
                  <div key={m.id} className="member-row" style={{ opacity:0.4 }}>
                    <div className="member-avatar" style={{ background:"var(--s3)",border:"1px solid var(--line)",color:"var(--dim)" }}>
                      {m.name.slice(0,2).toUpperCase()}
                      <div className="member-status" style={{ background:"#555" }} />
                    </div>
                    <div className="member-name">{m.name}</div>
                  </div>
                ))}

                {/* leaderboard strip */}
                <div style={{ margin:"14px 10px 10px",background:"var(--s3)",border:"1px solid var(--line)",borderRadius:8,overflow:"hidden" }}>
                  <div style={{ padding:"8px 12px",borderBottom:"1px solid var(--line)",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:"var(--dim)",letterSpacing:1.5,textTransform:"uppercase" }}>
                    Top This Week
                  </div>
                  {ONLINE_MEMBERS.sort((a,b)=>b.solved-a.solved).slice(0,3).map((m,i) => (
                    <div key={m.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:i<2?"1px solid var(--line)":"none" }}>
                      <span style={{ fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:["#ffa116","#adb5bd","#cd7f32"][i],width:14 }}>#{i+1}</span>
                      <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",flex:1 }}>{m.name}</span>
                      <span style={{ fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:m.color }}>{m.solved}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}