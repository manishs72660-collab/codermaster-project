import { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext, useReducer } from "react";
import { NavLink } from "react-router";

// ─── CodeMaster Color Palette (matches DSAVisualizer / ComplexityVisualizer) ──
const CM = {
  bg:        "#0d1117",
  surface:   "#161b22",
  surface2:  "#1c2130",
  border:    "#21262d",
  border2:   "#30363d",
  text:      "#e6edf3",
  muted:     "#8b949e",
  dim:       "#495366",
  accent:    "#ffa116",
  accentDim: "#1e1608",
  green:     "#00b86b",
  red:       "#ff4444",
  blue:      "#4493f8",
  purple:    "#c084fc",
  teal:      "#2dd4bf",
  pink:      "#ff5fa6",
  sky:       "#38bdf8",
  orange:    "#f97316",
  cyan:      "#22d3ee",
  lime:      "#a3e635",
  amber:     "#fbbf24",
  violet:    "#a78bfa",
};

// ══════════════════════════════════════════════════════════════════════════
// REUSABLE UI
// ══════════════════════════════════════════════════════════════════════════
function SectionLabel({ children, color = CM.accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
        letterSpacing: 1.5, textTransform: "uppercase", color: CM.dim,
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: CM.border }} />
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3, whiteSpace: "nowrap",
      display: "inline-block",
    }}>{label}</span>
  );
}

function CMInput({ value, onChange, placeholder, width = 160 }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        background: CM.surface2, color: CM.text, border: `1px solid ${CM.border2}`,
        borderRadius: 7, padding: "7px 12px", fontSize: 12, width,
        fontFamily: "'JetBrains Mono', monospace", outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = CM.accent}
      onBlur={e => e.target.style.borderColor = CM.border2}
    />
  );
}

function Chip({ active, onClick, children, color = CM.accent }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.2, transition: "all 0.15s",
      background: active ? color : CM.surface2,
      color: active ? "#0d1117" : CM.muted,
      border: `1px solid ${active ? color : CM.border2}`,
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ── tiny syntax highlighter (keyword / string / comment / number) ─────────
const KEYWORDS = new Set([
  "const","let","var","function","return","if","else","for","while","class","import","export",
  "from","default","new","this","extends","typeof","instanceof","async","await","try","catch",
  "finally","throw","switch","case","break","continue","do","yield","of","in","null","undefined",
  "true","false","void","delete","static","get","set","super","implements","interface","enum",
  "def","self","print","lambda","and","or","not","is","None","True","False","elif","pass","with",
  "as","raise","global","nonlocal","assert","public","private","protected","void","int","float",
  "double","char","struct","typedef","include","using","namespace","template","typename",
  "package","final","abstract","virtual","override","const_cast","sizeof","string","bool",
  "unsigned","long","short","auto","std","cout","cin","endl","printf","scanf","malloc","free",
  "NULL","System","String","main","record","yield*","match","case_","throws","synchronized",
  "generic","operator","friend","mutable","noexcept","constexpr","nullptr","module","export*",
]);
function highlight(code) {
  const lines = code.split("\n");
  return lines.map((line, li) => {
    const tokens = [];
    const re = /(\/\/.*$|#(?!include|define).*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|[A-Za-z_$][A-Za-z0-9_$]*|#include|#define)/g;
    let last = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > last) tokens.push({ t: line.slice(last, m.index), type: "plain" });
      const tok = m[0];
      let type = "plain";
      if (tok.startsWith("//") || (tok.startsWith("#") && tok !== "#include" && tok !== "#define")) type = "comment";
      else if (tok === "#include" || tok === "#define") type = "keyword";
      else if (/^["'`]/.test(tok)) type = "string";
      else if (/^\d/.test(tok)) type = "number";
      else if (KEYWORDS.has(tok)) type = "keyword";
      tokens.push({ t: tok, type });
      last = m.index + tok.length;
    }
    if (last < line.length) tokens.push({ t: line.slice(last), type: "plain" });
    return { key: li, tokens };
  });
}
const TOK_COLOR = { comment: CM.dim, string: CM.green, number: CM.sky, keyword: CM.purple, plain: CM.text };

function CodeBlock({ code, color = CM.accent }) {
  const [copied, setCopied] = useState(false);
  const rows = useMemo(() => highlight(code.trim()), [code]);
  return (
    <div style={{ position: "relative", background: CM.bg, border: `1px solid ${CM.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", borderBottom: `1px solid ${CM.border}`, background: CM.surface2,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.red }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.accent }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.green }} />
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(code.trim()); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          style={{
            background: "transparent", border: `1px solid ${CM.border2}`, borderRadius: 5, cursor: "pointer",
            color: copied ? color : CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5,
            padding: "2px 8px", fontWeight: 700, letterSpacing: 0.5,
          }}>{copied ? "COPIED" : "COPY"}</button>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", overflowX: "auto", fontSize: 12, lineHeight: 1.65 }}>
        {rows.map(row => (
          <div key={row.key} style={{ fontFamily: "'JetBrains Mono',monospace", whiteSpace: "pre" }}>
            {row.tokens.length === 0 ? "\u00A0" : row.tokens.map((tk, i) => (
              <span key={i} style={{ color: TOK_COLOR[tk.type], fontWeight: tk.type === "keyword" ? 600 : 400 }}>{tk.t}</span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

function DemoFrame({ label, color, children }) {
  return (
    <div style={{ background: CM.bg, border: `1px dashed ${CM.border2}`, borderRadius: 8, padding: 16 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color, letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
        ▸ {label}
      </div>
      {children}
    </div>
  );
}

// live rendered-HTML preview — shown inside a little "browser window" frame
function HtmlPreview({ code }) {
  return (
    <div style={{ border: `1px solid ${CM.border2}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
        background: CM.surface2, borderBottom: `1px solid ${CM.border2}`,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.red }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.accent }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: CM.green }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: CM.dim, letterSpacing: 0.5, marginLeft: 6 }}>
          RENDERED OUTPUT
        </span>
      </div>
      <div
        style={{ background: "#ffffff", color: "#1a1a1a", padding: 16, fontFamily: "system-ui,sans-serif", fontSize: 14, lineHeight: 1.5, overflow: "auto" }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
    </div>
  );
}

// static "what would print" box for compiled / non-browser languages
function OutputBox({ text, color = CM.green }) {
  return (
    <div style={{ background: CM.bg, border: `1px solid ${CM.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "6px 12px", borderBottom: `1px solid ${CM.border}`, background: CM.surface2, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: CM.dim, letterSpacing: 1, fontWeight: 700 }}>
        ▸ OUTPUT
      </div>
      <pre style={{ margin: 0, padding: "10px 14px", fontSize: 12, lineHeight: 1.6, color, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "pre-wrap" }}>{text}</pre>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LIVE DEMOS
// ══════════════════════════════════════════════════════════════════════════

function ColorDemo() {
  const [hue, setHue] = useState(28);
  const [sat, setSat] = useState(95);
  const [light, setLight] = useState(55);
  const bg = `hsl(${hue}, ${sat}%, ${light}%)`;
  return (
    <DemoFrame label="LIVE: background-color / color" color={CM.accent}>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          width: 110, height: 90, borderRadius: 10, background: bg, display: "flex",
          alignItems: "center", justifyContent: "center", color: light > 60 ? "#0d1117" : "#fff",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, transition: "background 0.15s",
          boxShadow: `0 6px 20px ${bg}55`,
        }}>{bg}</div>
        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
          {[["Hue", hue, setHue, 0, 360], ["Saturation", sat, setSat, 0, 100], ["Lightness", light, setLight, 0, 100]].map(([lbl, v, set, mn, mx]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, marginBottom: 2 }}>{lbl}: {v}</div>
              <input type="range" min={mn} max={mx} value={v} onChange={e => set(+e.target.value)} style={{ width: "100%" }} />
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}

function ShadowDemo() {
  const [blur, setBlur] = useState(20);
  const [spread, setSpread] = useState(0);
  const [y, setY] = useState(8);
  return (
    <DemoFrame label="LIVE: box-shadow" color={CM.accent}>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          width: 100, height: 80, borderRadius: 10, background: CM.surface2, margin: 12,
          boxShadow: `0 ${y}px ${blur}px ${spread}px ${CM.accent}88`, transition: "box-shadow 0.1s",
        }} />
        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
          {[["Blur", blur, setBlur, 0, 60], ["Spread", spread, setSpread, -10, 20], ["Y offset", y, setY, -20, 30]].map(([lbl, v, set, mn, mx]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, marginBottom: 2 }}>{lbl}: {v}px</div>
              <input type="range" min={mn} max={mx} value={v} onChange={e => set(+e.target.value)} style={{ width: "100%" }} />
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}

function FlexDemo() {
  const [justify, setJustify] = useState("center");
  const [align, setAlign] = useState("center");
  const opts = ["flex-start", "center", "flex-end", "space-between", "space-around"];
  const aopts = ["flex-start", "center", "flex-end", "stretch"];
  return (
    <DemoFrame label="LIVE: display: flex" color={CM.accent}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {opts.map(o => <Chip key={o} active={justify === o} onClick={() => setJustify(o)} color={CM.accent}>{o}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {aopts.map(o => <Chip key={o} active={align === o} onClick={() => setAlign(o)} color={CM.blue}>{o}</Chip>)}
      </div>
      <div style={{
        display: "flex", justifyContent: justify, alignItems: align, gap: 8, height: 110,
        background: CM.surface2, borderRadius: 8, padding: 10, transition: "all 0.2s",
      }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            width: 40, height: align === "stretch" ? "auto" : 30 + n * 12, background: CM.accent,
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: "#0d1117",
          }}>{n}</div>
        ))}
      </div>
    </DemoFrame>
  );
}

function GridDemo() {
  const [cols, setCols] = useState(3);
  return (
    <DemoFrame label="LIVE: display: grid" color={CM.accent}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, marginBottom: 8 }}>grid-template-columns: repeat({cols}, 1fr)</div>
      <input type="range" min={1} max={6} value={cols} onChange={e => setCols(+e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{
            height: 34, background: CM.surface2, border: `1px solid ${CM.border2}`, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.teal,
          }}>{i + 1}</div>
        ))}
      </div>
    </DemoFrame>
  );
}

function TransitionDemo() {
  const [on, setOn] = useState(false);
  return (
    <DemoFrame label="LIVE: transition + transform (click box)" color={CM.accent}>
      <div onClick={() => setOn(v => !v)} style={{
        width: 70, height: 70, borderRadius: 12, background: on ? CM.pink : CM.accent, cursor: "pointer",
        transform: on ? "rotate(180deg) scale(1.3)" : "rotate(0deg) scale(1)",
        transition: "transform 0.4s cubic-bezier(.34,1.56,.64,1), background 0.4s",
      }} />
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, marginTop: 8 }}>state: {on ? "true" : "false"}</div>
    </DemoFrame>
  );
}

function KeyframesDemo() {
  const [running, setRunning] = useState(true);
  return (
    <DemoFrame label="LIVE: @keyframes animation" color={CM.accent}>
      <style>{`
        @keyframes cm-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: CM.teal,
          animation: running ? "cm-bounce 0.9s ease-in-out infinite" : "none",
        }} />
        <button onClick={() => setRunning(r => !r)} style={btnStyle(running ? CM.red : CM.green)}>{running ? "Pause" : "Play"}</button>
      </div>
    </DemoFrame>
  );
}

function CssVarDemo() {
  const [primary, setPrimary] = useState(CM.accent);
  const swatches = [CM.accent, CM.teal, CM.pink, CM.blue, CM.purple];
  return (
    <DemoFrame label="LIVE: CSS custom properties (--variables)" color={CM.accent}>
      <div style={{ "--primary": primary, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 90, height: 60, borderRadius: 8, background: "var(--primary)" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {swatches.map(c => (
            <div key={c} onClick={() => setPrimary(c)} style={{
              width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
              border: primary === c ? `2px solid ${CM.text}` : "2px solid transparent",
            }} />
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}

function TypographyDemo() {
  const [size, setSize] = useState(16);
  const [weight, setWeight] = useState(400);
  const [spacing, setSpacing] = useState(0);
  return (
    <DemoFrame label="LIVE: font-size / font-weight / letter-spacing" color={CM.accent}>
      <p style={{ fontSize: size, fontWeight: weight, letterSpacing: spacing, marginBottom: 12, color: CM.text }}>
        The quick brown fox jumps.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>size: {size}px</div>
          <input type="range" min={10} max={40} value={size} onChange={e => setSize(+e.target.value)} />
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>weight: {weight}</div>
          <input type="range" min={100} max={900} step={100} value={weight} onChange={e => setWeight(+e.target.value)} />
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>spacing: {spacing}px</div>
          <input type="range" min={-2} max={10} value={spacing} onChange={e => setSpacing(+e.target.value)} />
        </div>
      </div>
    </DemoFrame>
  );
}

function UseStateDemo() {
  const [count, setCount] = useState(0);
  return (
    <DemoFrame label="LIVE: useState — component-local memory" color={CM.purple}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setCount(c => c - 1)} style={btnStyle(CM.red)}>−</button>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, width: 40, textAlign: "center" }}>{count}</span>
        <button onClick={() => setCount(c => c + 1)} style={btnStyle(CM.green)}>+</button>
      </div>
    </DemoFrame>
  );
}

function UseEffectDemo() {
  const [time, setTime] = useState(new Date());
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id); // cleanup — problem useEffect solves: sync + teardown
  }, [running]);
  return (
    <DemoFrame label="LIVE: useEffect — sync with an outside system (a timer)" color={CM.purple}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: CM.teal }}>
          {time.toLocaleTimeString()}
        </span>
        <button onClick={() => setRunning(r => !r)} style={btnStyle(running ? CM.red : CM.green)}>
          {running ? "Stop" : "Start"}
        </button>
      </div>
    </DemoFrame>
  );
}

function UseMemoDemo() {
  const [n, setN] = useState(28);
  const [tick, setTick] = useState(0);
  const [calls, setCalls] = useState(0);
  const fib = useMemo(() => {
    setCalls(c => c + 1);
    const f = x => x < 2 ? x : f(x - 1) + f(x - 2);
    return f(n);
  }, [n]);
  return (
    <DemoFrame label="LIVE: useMemo — skip recomputation until a dependency changes" color={CM.purple}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.dim }}>n = {n} → fib(n) = <span style={{ color: CM.teal }}>{fib}</span> · recomputed {calls}× total</div>
        <input type="range" min={10} max={32} value={n} onChange={e => setN(+e.target.value)} style={{ width: "100%" }} />
        <button onClick={() => setTick(t => t + 1)} style={{ ...btnStyle(CM.blue), alignSelf: "flex-start" }}>
          Re-render component ({tick}) — fib does NOT recompute
        </button>
      </div>
    </DemoFrame>
  );
}

function UseRefDemo() {
  const inputRef = useRef(null);
  const renders = useRef(0);
  renders.current += 1;
  return (
    <DemoFrame label="LIVE: useRef — mutable value that persists without re-rendering" color={CM.purple}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={inputRef} placeholder="click the button →" style={{
          background: CM.surface2, border: `1px solid ${CM.border2}`, borderRadius: 6, padding: "7px 10px",
          color: CM.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
        }} />
        <button onClick={() => inputRef.current.focus()} style={btnStyle(CM.blue)}>Focus input</button>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>renders.current = {renders.current} (updating this never re-renders)</span>
      </div>
    </DemoFrame>
  );
}

const ThemeCtx = createContext(null);
function UseContextDemo() {
  const [theme, setTheme] = useState("accent");
  return (
    <ThemeCtx.Provider value={{ color: CM[theme], set: setTheme }}>
      <DemoFrame label="LIVE: useContext — avoid prop-drilling through every level" color={CM.purple}>
        <ContextConsumerChild />
      </DemoFrame>
    </ThemeCtx.Provider>
  );
}
function ContextConsumerChild() {
  const { color, set } = useContext(ThemeCtx);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: color }} />
      {["accent", "teal", "pink", "blue"].map(k => (
        <Chip key={k} active={CM[k] === color} onClick={() => set(k)} color={CM[k]}>{k}</Chip>
      ))}
    </div>
  );
}

function reducerFn(state, action) {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "dec": return { count: state.count - 1 };
    case "reset": return { count: 0 };
    default: return state;
  }
}
function UseReducerDemo() {
  const [state, dispatch] = useReducer(reducerFn, { count: 0 });
  return (
    <DemoFrame label="LIVE: useReducer — centralize complex state-transition logic" color={CM.purple}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => dispatch({ type: "dec" })} style={btnStyle(CM.red)}>−</button>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, width: 36, textAlign: "center" }}>{state.count}</span>
        <button onClick={() => dispatch({ type: "inc" })} style={btnStyle(CM.green)}>+</button>
        <button onClick={() => dispatch({ type: "reset" })} style={btnStyle(CM.dim)}>reset</button>
      </div>
    </DemoFrame>
  );
}

function UseLayoutEffectDemo() {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [n, setN] = useState(120);
  useEffect(() => {
    if (boxRef.current) setWidth(boxRef.current.offsetWidth);
  }, [n]);
  return (
    <DemoFrame label="LIVE: useLayoutEffect — measure the DOM before the browser paints" color={CM.purple}>
      <div ref={boxRef} style={{ width: n, height: 34, background: CM.surface2, borderRadius: 6, marginBottom: 8, transition: "width 0.2s" }} />
      <input type="range" min={60} max={300} value={n} onChange={e => setN(+e.target.value)} style={{ width: "100%" }} />
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, marginTop: 6 }}>measured width: {width}px</div>
    </DemoFrame>
  );
}

function CustomHookDemo() {
  function useToggle(initial = false) {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn(v => !v), []);
    return [on, toggle];
  }
  const [on, toggle] = useToggle();
  return (
    <DemoFrame label="LIVE: custom hook (useToggle) — reusing stateful logic across components" color={CM.purple}>
      <button onClick={toggle} style={btnStyle(on ? CM.green : CM.dim)}>{on ? "ON" : "OFF"}</button>
    </DemoFrame>
  );
}

function ControlledFormDemo() {
  const [name, setName] = useState("");
  return (
    <DemoFrame label="LIVE: controlled input — React state is the single source of truth" color={CM.purple}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="type your name…" style={{
        background: CM.surface2, border: `1px solid ${CM.border2}`, borderRadius: 6, padding: "7px 10px",
        color: CM.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, marginRight: 10,
      }} />
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: CM.teal }}>Hello, {name || "…"}!</span>
    </DemoFrame>
  );
}

function JsArrayDemo() {
  const nums = [4, 8, 15, 16, 23, 42];
  const [op, setOp] = useState("map");
  const result = op === "map" ? nums.map(n => n * 2)
    : op === "filter" ? nums.filter(n => n > 10)
    : op === "sort" ? [...nums].sort((a, b) => b - a)
    : op === "find" ? [nums.find(n => n > 10)]
    : [nums.reduce((a, b) => a + b, 0)];
  return (
    <DemoFrame label="LIVE: array.map / filter / reduce / find / sort" color={CM.accent}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {["map", "filter", "reduce", "find", "sort"].map(o => <Chip key={o} active={op === o} onClick={() => setOp(o)}>{o}</Chip>)}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
        <span style={{ color: CM.dim }}>input:</span> <span style={{ color: CM.text }}>[{nums.join(", ")}]</span><br />
        <span style={{ color: CM.dim }}>output:</span> <span style={{ color: CM.green }}>[{result.join(", ")}]</span>
      </div>
    </DemoFrame>
  );
}

function OptionalChainingDemo() {
  const users = { ada: { profile: { city: "London" } }, bob: {} };
  const [key, setKey] = useState("ada");
  const city = users[key]?.profile?.city ?? "unknown";
  return (
    <DemoFrame label="LIVE: optional chaining ?. and nullish coalescing ??" color={CM.accent}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["ada", "bob"].map(k => <Chip key={k} active={key === k} onClick={() => setKey(k)}>{k}</Chip>)}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
        <span style={{ color: CM.dim }}>users.{key}?.profile?.city ?? "unknown"</span> → <span style={{ color: CM.green }}>{city}</span>
      </div>
    </DemoFrame>
  );
}

function DomDemo() {
  const [items, setItems] = useState(["Buy milk", "Walk dog"]);
  const ref = useRef(null);
  const add = () => {
    if (ref.current.value.trim()) { setItems(i => [...i, ref.current.value]); ref.current.value = ""; }
  };
  return (
    <DemoFrame label="LIVE: querySelector-style DOM update, React-style" color={CM.accent}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input ref={ref} placeholder="new item…" style={{ background: CM.surface2, border: `1px solid ${CM.border2}`, borderRadius: 6, padding: "6px 10px", color: CM.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
        <button onClick={add} style={btnStyle(CM.green)}>Add</button>
      </div>
      <ul style={{ paddingLeft: 18, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: CM.text }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </DemoFrame>
  );
}

function btnStyle(color) {
  return {
    background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 7,
    minWidth: 34, height: 34, fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 12px",
  };
}

// ══════════════════════════════════════════════════════════════════════════
// CHEAT SHEET DATA
// ══════════════════════════════════════════════════════════════════════════
const LANGS = [
  {
    key: "html", label: "HTML", color: CM.red,
    sections: [
      { cat: "Document Skeleton", items: [
        { title: "Boilerplate", desc: "Every HTML document needs this shell: charset, viewport for responsive scaling, and a title. This part alone isn't visible, so no live preview.",
          code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
</head>
<body>
  <h1>Hello world</h1>
</body>
</html>` },
        { title: "Useful <head> tags", desc: "These live in <head> and control metadata, favicons, and social-share previews — none of them render visibly on the page.",
          code: `<meta name="description" content="A page about cats">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="styles.css">
<meta property="og:title" content="My Page">
<script src="app.js" defer></script>` },
        { title: "Comments", desc: "Comments are stripped by the browser and never shown to the user — handy for leaving notes in markup.",
          code: `<!-- This is a comment, it won't render -->
<p>Only this text shows up.</p>`, preview: true },
      ]},
      { cat: "Text & Lists", items: [
        { title: "Headings & paragraphs", desc: "h1–h6 form a document outline (h1 = most important); browsers auto-style each heading level differently by default.",
          code: `<h1>Main Title</h1>
<h2>Subtitle</h2>
<p>A paragraph of body text goes here.</p>`, preview: true },
        { title: "Text formatting", desc: "<strong>/<em> carry semantic meaning (important / emphasized) which screen readers announce, unlike purely visual <b>/<i>.",
          code: `<p><strong>Bold &amp; important</strong> and
<em>emphasized</em> and <mark>highlighted</mark> and
<code>inline code</code>.</p>`, preview: true },
        { title: "Lists", desc: "<ul> = unordered (bullets), <ol> = ordered (numbers), <li> = each item. Lists can nest inside one another.",
          code: `<ul>
  <li>Milk</li>
  <li>Eggs</li>
</ul>
<ol>
  <li>Preheat oven</li>
  <li>Mix ingredients</li>
</ol>`, preview: true },
        { title: "Blockquote & code block", desc: "<blockquote> is for quoted content, <pre><code> preserves whitespace/line breaks for source code.",
          code: `<blockquote>Talk is cheap. Show me the code.</blockquote>
<pre><code>function hi() {
  return "hi";
}</code></pre>`, preview: true },
      ]},
      { cat: "Links, Images & Media", items: [
        { title: "Links", desc: "target=\"_blank\" opens in a new tab; always pair it with rel=\"noopener\" for security (stops the new page from accessing window.opener).",
          code: `<a href="https://example.com" target="_blank" rel="noopener">
  Visit example.com
</a>`, preview: true },
        { title: "Images", desc: "alt is read by screen readers and shown if the image fails to load — never skip it. width/height prevent layout shift while loading.",
          code: `<img src="https://placehold.co/200x120/ffa116/0d1117?text=cat.jpg"
     alt="A sleeping cat" width="200" height="120">`, preview: true },
        { title: "Figure & caption", desc: "Groups an image (or other media) with a caption as one semantic unit — better for accessibility than a bare <img> + <p>.",
          code: `<figure>
  <img src="https://placehold.co/180x100/2dd4bf/0d1117?text=chart" alt="Sales chart">
  <figcaption>Fig 1. Quarterly sales</figcaption>
</figure>`, preview: true },
        { title: "Audio & video", desc: "controls shows the native play/pause UI; multiple <source> tags let the browser pick a format it supports.",
          code: `<video controls width="240" poster="https://placehold.co/240x120">
  <source src="movie.mp4" type="video/mp4">
</video>` },
      ]},
      { cat: "Forms & Input", items: [
        { title: "Form + input types", desc: "The type attribute controls validation and the keyboard/UI shown, without any JS — try clicking each field below.",
          code: `<form>
  <input type="text" placeholder="Name" required>
  <input type="email" placeholder="Email">
  <input type="password" placeholder="Password">
  <input type="number" min="0" max="10">
  <input type="date">
  <input type="range" min="0" max="100">
  <button type="submit">Send</button>
</form>`, preview: true },
        { title: "Labels, fieldset & legend", desc: "A <label> linked via `for`/`id` makes clicking the text focus the input — critical for accessibility and usability.",
          code: `<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" checked> Free</label>
  <label><input type="radio" name="plan"> Pro</label>
</fieldset>`, preview: true },
        { title: "Select & textarea", desc: "<select> makes a dropdown from <option> children; <textarea> is a multi-line text input.",
          code: `<select>
  <option value="dev">Developer</option>
  <option value="designer">Designer</option>
</select>
<textarea rows="3" placeholder="Your bio…"></textarea>`, preview: true },
        { title: "Validation attributes", desc: "required, minlength, pattern, min/max trigger the browser's own validation UI — no JavaScript needed for basic checks.",
          code: `<input type="text" required minlength="3" maxlength="10"
       placeholder="3-10 chars">
<input type="tel" pattern="[0-9]{10}" placeholder="10-digit phone">`, preview: true },
      ]},
      { cat: "Tables", items: [
        { title: "Table structure", desc: "thead/tbody group rows semantically so tables are styleable and accessible; <th> cells are announced as headers by screen readers.",
          code: `<table border="1" cellpadding="6">
  <thead>
    <tr><th>Name</th><th>Score</th></tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td>98</td></tr>
    <tr><td>Grace</td><td>95</td></tr>
  </tbody>
</table>`, preview: true },
        { title: "colspan & rowspan", desc: "Merge table cells horizontally (colspan) or vertically (rowspan) for headers that span multiple columns/rows.",
          code: `<table border="1" cellpadding="6">
  <tr><th colspan="2">Full Name</th></tr>
  <tr><td>Ada</td><td>Lovelace</td></tr>
</table>`, preview: true },
      ]},
      { cat: "Interactive & Semantic Elements", items: [
        { title: "details / summary", desc: "A native, no-JS accordion/disclosure widget — click the summary line to expand.",
          code: `<details>
  <summary>Click to expand</summary>
  <p>Hidden content revealed here.</p>
</details>`, preview: true },
        { title: "Semantic layout tags", desc: "Semantic tags describe meaning, not just appearance — better for accessibility and SEO than an all-<div> page.",
          code: `<header style="background:#eee;padding:8px">Header</header>
<nav style="padding:8px">Nav links</nav>
<main style="padding:8px">
  <article>Article content</article>
</main>
<footer style="background:#eee;padding:8px">Footer</footer>`, preview: true },
        { title: "Global attributes: id, class, data-*", desc: "id is a unique hook for CSS/JS; class can repeat; data-* attributes store custom data read via JS (element.dataset).",
          code: `<button id="save-btn" class="btn primary" data-user-id="42">
  Save
</button>`, preview: true },
      ]},
    ],
  },
  {
    key: "css", label: "CSS", color: CM.accent,
    sections: [
      { cat: "Selectors", items: [
        { title: "Basic & combinator selectors", desc: "Element, class (.), id (#) select by type. Combinators narrow by relationship: descendant (space), direct child (>), adjacent sibling (+).",
          code: `p { color: gray; }        /* element   */
.card { padding: 12px; }  /* class     */
#hero { height: 300px; }  /* id        */
.card p { margin: 0; }    /* descendant */
.card > h2 { margin: 0; } /* direct child */
h2 + p { margin-top: 4px; } /* adjacent sibling */` },
        { title: "Pseudo-classes & pseudo-elements", desc: "Pseudo-classes target a state (:hover, :focus, :nth-child); pseudo-elements target a sub-part (::before, ::first-letter).",
          code: `.btn:hover { opacity: 0.85; }
input:focus { outline: 2px solid #ffa116; }
li:nth-child(odd) { background: #1c2130; }
.quote::before { content: "“"; color: #ffa116; }` },
      ]},
      { cat: "Color", items: [
        { title: "Color & background", desc: "Colors can be named, hex, rgb(), or hsl(). hsl() is the easiest to tweak by hand since hue/saturation/lightness are separate numbers.",
          code: `.box {
  color: #e6edf3;
  background-color: hsl(28, 95%, 55%);
  background: linear-gradient(135deg, #ffa116, #ff5fa6);
  opacity: 0.9;
}`, demo: "color" },
        { title: "CSS custom properties (variables)", desc: "Define a value once with --name, reuse it anywhere with var(--name) — change the variable and everything using it updates instantly.",
          code: `:root { --primary: #ffa116; }
.card { background: var(--primary); }
.card:hover { background: var(--primary-hover, #ff8c00); }`, demo: "cssvar" },
      ]},
      { cat: "Typography", items: [
        { title: "Font properties", desc: "font-size/weight/letter-spacing/line-height together define a type scale — try the sliders below.",
          code: `p {
  font-family: "Segoe UI", sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.4px;
  line-height: 1.6;
}`, demo: "typography" },
        { title: "text-align, decoration & transform", desc: "Quick text utilities: alignment, underline/strikethrough, and automatic case conversion.",
          code: `.label {
  text-align: center;
  text-decoration: underline;
  text-transform: uppercase;
}` },
      ]},
      { cat: "Box Model & Effects", items: [
        { title: "box-shadow", desc: "Syntax: offset-x offset-y blur spread color. Negative spread shrinks the shadow inward from the box edge.",
          code: `.card {
  box-shadow: 0 8px 20px 0 rgba(255,161,22,0.5);
}`, demo: "shadow" },
        { title: "transition & transform", desc: "transition animates a property change smoothly; transform moves/rotates/scales an element without affecting layout flow (fast — GPU accelerated).",
          code: `.box {
  transition: transform 0.4s ease, background 0.4s;
}
.box:hover {
  transform: rotate(180deg) scale(1.3);
}`, demo: "transition" },
        { title: "@keyframes animation", desc: "Defines multi-step animations by percentage; apply with the animation shorthand (duration, easing, iteration-count).",
          code: `@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-22px); }
}
.ball { animation: bounce 0.9s ease-in-out infinite; }`, demo: "keyframes" },
        { title: "Box sizing & spacing", desc: "border-box makes width/height include padding+border, avoiding the classic 'my box is bigger than I set it' bug.",
          code: `* { box-sizing: border-box; }
.box {
  width: 200px;
  padding: 16px;
  margin: 8px auto;
  border: 1px solid #30363d;
  border-radius: 10px;
}` },
      ]},
      { cat: "Layout", items: [
        { title: "Flexbox", desc: "One-dimensional layout. justify-content aligns along the main axis, align-items along the cross axis.",
          code: `.row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}`, demo: "flex" },
        { title: "Grid", desc: "Two-dimensional layout. fr units split remaining space proportionally — repeat(3, 1fr) makes 3 equal columns.",
          code: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}`, demo: "grid" },
        { title: "Grid template areas", desc: "Name regions of the grid and place children by name — often more readable than counting row/column numbers for page layouts.",
          code: `.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main";
  grid-template-columns: 200px 1fr;
}
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }` },
        { title: "Position", desc: "relative shifts an element from its normal spot without removing it from flow; absolute removes it from flow, positioned against the nearest relative ancestor.",
          code: `.parent { position: relative; }
.badge {
  position: absolute;
  top: 8px; right: 8px;
  z-index: 10;
}` },
      ]},
      { cat: "Units & Responsive", items: [
        { title: "Common units", desc: "px is fixed; rem scales with the root font-size (great for accessibility/zoom); vh/vw are percentages of the viewport.",
          code: `.title { font-size: 2rem; }     /* relative to <html> font-size */
.hero  { height: 100vh; }       /* full viewport height */
.card  { width: 90%; max-width: 480px; }` },
        { title: "Media queries", desc: "Apply different styles based on viewport width — the backbone of responsive design.",
          code: `.grid { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
}` },
      ]},
    ],
  },
  {
    key: "js", label: "JavaScript", color: CM.sky,
    sections: [
      { cat: "Variables & Functions", items: [
        { title: "let / const / arrow functions", desc: "const = can't reassign, let = block-scoped mutable. Arrow functions don't rebind `this`, which fixes a classic JS gotcha inside callbacks.",
          code: `const PI = 3.14159;
let count = 0;

const add = (a, b) => a + b;
const square = n => n * n;`, output: "add(2,3) → 5\nsquare(4) → 16" },
        { title: "Destructuring & spread/rest", desc: "Pulls values out of arrays/objects in one line; spread (...) copies/expands, rest collects leftovers.",
          code: `const { name, age } = { name: "Ada", age: 30 };
const [first, ...rest] = [1, 2, 3];
const merged = { ...{ a: 1 }, ...{ b: 2 } };`, output: "name → \"Ada\"\nfirst → 1, rest → [2, 3]\nmerged → { a: 1, b: 2 }" },
        { title: "Template literals", desc: "Backticks allow embedded expressions with ${} and multi-line strings — no more string concatenation.",
          code: `const name = "Ada";
console.log(\`Hello, \${name}! 2+2=\${2+2}\`);`, output: "Hello, Ada! 2+2=4" },
        { title: "Optional chaining & nullish coalescing", desc: "?. short-circuits to undefined instead of throwing when a nested property is missing; ?? falls back only for null/undefined (unlike ||, which also replaces 0/\"\").",
          code: `const city = user?.profile?.city ?? "unknown";`, demo: "optchain" },
      ]},
      { cat: "Array & Object Methods", items: [
        { title: "map / filter / reduce / find / sort", desc: "The core array transforms. map = same length new values, filter = subset, reduce = fold to one value, find = first match, sort = reorder (mutates!).",
          code: `const nums = [4, 8, 15, 16, 23, 42];
nums.map(n => n * 2);
nums.filter(n => n > 10);
nums.reduce((sum, n) => sum + n, 0);
nums.find(n => n > 10);
[...nums].sort((a, b) => b - a);`, demo: "jsarray" },
        { title: "some / every / includes", desc: "some = at least one passes, every = all pass, includes = simple membership check — all return a boolean.",
          code: `const nums = [2, 4, 6];
nums.every(n => n % 2 === 0); // true
nums.some(n => n > 5);        // true
nums.includes(4);             // true` },
        { title: "Object & Array helpers", desc: "Object.keys/values/entries turn an object into an array you can iterate; Array.from converts array-likes/iterables into real arrays.",
          code: `const user = { name: "Ada", age: 30 };
Object.keys(user);    // ["name", "age"]
Object.entries(user); // [["name","Ada"], ["age",30]]
Array.from({ length: 3 }, (_, i) => i * 2); // [0, 2, 4]` },
        { title: "JSON.stringify / parse", desc: "Converts a JS object to a JSON string (for storage/network) and back — the standard way to serialize data.",
          code: `const json = JSON.stringify({ a: 1, b: [2, 3] });
const obj = JSON.parse(json);`, output: 'json → \'{"a":1,"b":[2,3]}\'' },
      ]},
      { cat: "Async", items: [
        { title: "Promises & async/await", desc: "async/await is sugar over Promises — write asynchronous code that reads top-to-bottom instead of nested .then() chains.",
          code: `async function getUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error("failed");
  return res.json();
}` },
        { title: "setTimeout / setInterval", desc: "setTimeout runs a callback once after a delay; setInterval repeats it — always clearInterval/clearTimeout to avoid leaks.",
          code: `const id = setInterval(() => console.log("tick"), 1000);
setTimeout(() => clearInterval(id), 5000);` },
      ]},
      { cat: "Closures, Classes & Errors", items: [
        { title: "Closures", desc: "A function 'remembers' the variables from the scope it was created in — the classic way to build private state without a class.",
          code: `function makeCounter() {
  let count = 0;
  return () => ++count;
}
const counter = makeCounter();
counter(); counter();`, output: "1\n2" },
        { title: "Classes", desc: "Syntactic sugar over JS's prototype-based inheritance — familiar OOP syntax for constructors, methods, and inheritance.",
          code: `class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound\`; }
}
class Dog extends Animal {
  speak() { return \`\${this.name} barks\`; }
}
new Dog("Rex").speak();`, output: "Rex barks" },
        { title: "try / catch / finally", desc: "Catches runtime errors so one failure doesn't crash the whole script; finally always runs, useful for cleanup.",
          code: `try {
  JSON.parse("not json");
} catch (err) {
  console.log("Invalid JSON:", err.message);
} finally {
  console.log("Done");
}` },
        { title: "Modules: import / export", desc: "ES modules split code into reusable files. `export default` for one main export per file, named exports for multiple utilities.",
          code: `// math.js
export const add = (a, b) => a + b;
export default function multiply(a, b) { return a * b; }

// main.js
import multiply, { add } from "./math.js";` },
      ]},
      { cat: "DOM", items: [
        { title: "Selecting & updating elements", desc: "querySelector finds the first match using CSS-selector syntax; addEventListener attaches a handler without overwriting existing ones.",
          code: `const btn = document.querySelector("#save-btn");
btn.addEventListener("click", () => {
  document.querySelector("h1").textContent = "Saved!";
});`, demo: "dom" },
      ]},
    ],
  },
  {
    key: "react", label: "React", color: CM.purple,
    sections: [
      { cat: "Hooks — State", items: [
        { title: "useState", desc: "Problem it solves: plain variables don't survive re-renders and don't trigger UI updates. useState gives a component memory that, when changed, re-renders the UI.",
          code: `const [count, setCount] = useState(0);

<button onClick={() => setCount(c => c + 1)}>
  {count}
</button>`, demo: "useState" },
        { title: "useReducer", desc: "Problem it solves: when state updates depend on complex logic or many action types, scattered setState calls get messy. useReducer centralizes transitions in one function.",
          code: `function reducer(state, action) {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    default: return state;
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: "inc" });`, demo: "useReducer" },
      ]},
      { cat: "Hooks — Effects & Refs", items: [
        { title: "useEffect", desc: "Problem it solves: syncing a component with something outside React (timers, subscriptions, fetches, the DOM). Runs after render; the returned function cleans up before the next run/unmount.",
          code: `useEffect(() => {
  const id = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(id); // cleanup
}, []); // deps: run once on mount`, demo: "useEffect" },
        { title: "useLayoutEffect", desc: "Problem it solves: useEffect runs after the browser paints, so measuring/adjusting the DOM in it can cause a visible flicker. useLayoutEffect runs synchronously before paint.",
          code: `const ref = useRef(null);
useLayoutEffect(() => {
  setWidth(ref.current.offsetWidth);
}, [dependency]);`, demo: "uselayouteffect" },
        { title: "useRef", desc: "Problem it solves: sometimes you need a mutable value or a DOM handle that persists across renders WITHOUT causing a re-render when it changes (unlike state).",
          code: `const inputRef = useRef(null);
<input ref={inputRef} />
inputRef.current.focus();`, demo: "useRef" },
      ]},
      { cat: "Hooks — Performance & Sharing", items: [
        { title: "useMemo", desc: "Problem it solves: expensive calculations re-running on every render even when their inputs haven't changed. Caches the result until a dependency changes.",
          code: `const result = useMemo(() => expensiveCalc(n), [n]);`, demo: "useMemo" },
        { title: "useCallback", desc: "Problem it solves: functions are recreated every render, which breaks memoized children (React.memo) that compare props by reference. useCallback keeps the same function identity between renders.",
          code: `const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);` },
        { title: "useContext", desc: "Problem it solves: passing a prop down through many layers just so a deeply nested child can use it ('prop drilling'). Context lets any descendant read a value directly.",
          code: `const ThemeCtx = createContext();

<ThemeCtx.Provider value={{ color: "orange" }}>
  <Child />
</ThemeCtx.Provider>

// inside Child:
const { color } = useContext(ThemeCtx);`, demo: "useContext" },
        { title: "Custom hooks", desc: "Problem it solves: two components need the same stateful logic (e.g. a toggle, a fetch, a form field) — extracting a `useXxx` function lets them share it without duplicating code.",
          code: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(v => !v), []);
  return [on, toggle];
}
const [isOpen, toggleOpen] = useToggle();`, demo: "customhook" },
      ]},
      { cat: "Core Concepts", items: [
        { title: "Props & one-way data flow", desc: "Data flows down from parent to child via props; children notify parents via callback props (functions passed down).",
          code: `function Greeting({ name, onClose }) {
  return <div onClick={onClose}>Hi {name}</div>;
}
<Greeting name="Ada" onClose={() => setOpen(false)} />` },
        { title: "Conditional & list rendering", desc: "Use && / ternaries for conditionals, and .map() with a stable key prop so React can track list items efficiently.",
          code: `{loading && <Spinner />}
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}` },
        { title: "Controlled inputs", desc: "React state — not the DOM — is the source of truth for the input's value. This is what makes validation, formatting, and syncing UI trivial.",
          code: `const [name, setName] = useState("");
<input value={name} onChange={e => setName(e.target.value)} />`, demo: "controlledform" },
        { title: "Fragments", desc: "<>...</> groups multiple elements without adding an extra wrapper <div> to the actual DOM — keeps markup and CSS layout clean.",
          code: `function Row() {
  return (
    <>
      <td>Ada</td>
      <td>98</td>
    </>
  );
}` },
        { title: "Lifting state up", desc: "Problem it solves: two sibling components need to share/sync state. Move the state to their closest common parent and pass it down as props.",
          code: `function Parent() {
  const [value, setValue] = useState("");
  return (
    <>
      <Input value={value} onChange={setValue} />
      <Preview value={value} />
    </>
  );
}` },
      ]},
    ],
  },
  {
    key: "python", label: "Python", color: CM.green,
    sections: [
      { cat: "Core Syntax", items: [
        { title: "f-strings & variables", desc: "f-strings embed expressions directly in a string — the modern, readable way to format text.",
          code: `name = "Ada"
age = 30
print(f"{name} is {age} years old")`, output: "Ada is 30 years old" },
        { title: "List comprehension", desc: "Builds a new list in one readable line instead of a manual for-loop + append.",
          code: `squares = [n * n for n in range(10)]
evens = [n for n in range(20) if n % 2 == 0]
print(squares[:5])`, output: "[0, 1, 4, 9, 16]" },
        { title: "Dicts & sets", desc: "Dict = key/value store; set = unique, unordered collection with fast membership tests.",
          code: `user = {"name": "Ada", "age": 30}
user["email"] = "ada@example.com"
seen = {1, 2, 3}
print(3 in seen)`, output: "True" },
        { title: "Conditionals & loops", desc: "Python uses indentation instead of braces to define blocks; `elif` chains conditions, `for...in` iterates any iterable.",
          code: `for n in range(5):
    if n % 2 == 0:
        print(f"{n} is even")
    else:
        print(f"{n} is odd")`, output: "0 is even\n1 is odd\n2 is even\n3 is odd\n4 is even" },
      ]},
      { cat: "Functions & Classes", items: [
        { title: "Functions, default & *args/**kwargs", desc: "*args collects extra positional args into a tuple, **kwargs collects extra keyword args into a dict.",
          code: `def greet(name, greeting="Hi", *args, **kwargs):
    return f"{greeting}, {name}!"

print(greet("Ada"))
print(greet("Ada", greeting="Hey"))`, output: "Hi, Ada!\nHey, Ada!" },
        { title: "Classes & dataclasses", desc: "@dataclass auto-generates __init__, __repr__, and __eq__ from type-annotated fields — cuts boilerplate for simple data holders.",
          code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

p = Point(1, 2)
print(p)`, output: "Point(x=1, y=2)" },
        { title: "Decorators", desc: "A decorator wraps a function to add behavior (logging, timing, caching) without modifying the function's own code.",
          code: `def log_calls(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@log_calls
def add(a, b):
    return a + b

add(2, 3)`, output: "calling add" },
        { title: "Generators & yield", desc: "A generator produces values lazily, one at a time, instead of building the whole list in memory — ideal for large or infinite sequences.",
          code: `def countdown(n):
    while n > 0:
        yield n
        n -= 1

for i in countdown(3):
    print(i)`, output: "3\n2\n1" },
      ]},
      { cat: "Iteration & Data", items: [
        { title: "Slicing & lambda", desc: "Slicing [start:stop:step] extracts sub-sequences; lambda makes small throwaway functions, often passed to sorted/map/filter.",
          code: `nums = [0, 1, 2, 3, 4, 5]
print(nums[1:4])
print(nums[::-1])
print(sorted(nums, key=lambda n: -n))`, output: "[1, 2, 3]\n[5, 4, 3, 2, 1, 0]\n[5, 4, 3, 2, 1, 0]" },
        { title: "enumerate & zip", desc: "enumerate gives (index, value) pairs while looping; zip pairs up multiple iterables element-by-element.",
          code: `names = ["Ada", "Grace"]
for i, name in enumerate(names):
    print(i, name)

for n, age in zip(names, [30, 85]):
    print(n, age)`, output: "0 Ada\n1 Grace\nAda 30\nGrace 85" },
        { title: "Exception handling", desc: "try/except catches specific error types; else runs if no exception occurred, finally always runs — great for cleanup like closing files.",
          code: `try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Error: {e}")
finally:
    print("Done")`, output: "Error: division by zero\nDone" },
      ]},
      { cat: "Files & Modules", items: [
        { title: "Context managers (with)", desc: "`with` guarantees a resource (like a file) is properly closed even if an error occurs inside the block — no manual close() needed.",
          code: `with open("notes.txt", "w") as f:
    f.write("Hello!")
# file is automatically closed here` },
        { title: "Type hints", desc: "Optional annotations that document expected types; tools like mypy can check them, but Python itself doesn't enforce them at runtime.",
          code: `def add(a: int, b: int) -> int:
    return a + b

names: list[str] = ["Ada", "Grace"]` },
      ]},
    ],
  },
  {
    key: "c", label: "C", color: CM.blue,
    sections: [
      { cat: "Basics", items: [
        { title: "Hello world & compile", desc: "C compiles to a binary ahead of time; you must declare the type of every variable.",
          code: `#include <stdio.h>

int main() {
    printf("Hello, world!\\n");
    return 0;
}
// compile: gcc main.c -o main`, output: "Hello, world!" },
        { title: "Variables & conditionals", desc: "Every variable needs an explicit type; if/else and comparison/logical operators work like most C-family languages.",
          code: `int age = 20;
if (age >= 18) {
    printf("Adult\\n");
} else {
    printf("Minor\\n");
}`, output: "Adult" },
        { title: "Pointers", desc: "A pointer stores a memory address. & gets an address, * dereferences it — the foundation of manual memory control in C.",
          code: `int x = 10;
int *p = &x;   // p holds x's address
*p = 20;       // writes through the pointer
printf("%d", x);`, output: "20" },
      ]},
      { cat: "Memory & Structs", items: [
        { title: "Structs", desc: "Groups related fields into one custom type — C has no classes, so structs + functions are how you model objects.",
          code: `struct Point { int x, y; };

struct Point p = {1, 2};
printf("%d,%d", p.x, p.y);`, output: "1,2" },
        { title: "Dynamic memory: malloc/free", desc: "malloc reserves heap memory at runtime; you MUST free it yourself — C has no garbage collector, so forgetting causes a memory leak.",
          code: `int *arr = malloc(5 * sizeof(int));
for (int i = 0; i < 5; i++) arr[i] = i * i;
printf("%d", arr[4]);
free(arr);`, output: "16" },
        { title: "Function pointers", desc: "A pointer that stores the address of a function, letting you pass behavior around like a value — the C precursor to callbacks/lambdas.",
          code: `int square(int n) { return n * n; }

int (*fn)(int) = square;
printf("%d", fn(5));`, output: "25" },
      ]},
      { cat: "Arrays, Strings & Loops", items: [
        { title: "Arrays & for loop", desc: "Arrays are fixed-size, contiguous blocks of memory; the array name decays to a pointer to its first element.",
          code: `int nums[5] = {1, 2, 3, 4, 5};
for (int i = 0; i < 5; i++) {
    printf("%d ", nums[i]);
}`, output: "1 2 3 4 5 " },
        { title: "Strings as char arrays", desc: "C has no built-in string type — a string is a char array ending in a null terminator '\\0'. <string.h> provides helpers like strlen/strcpy.",
          code: `#include <string.h>
char name[20] = "Ada";
strcat(name, " Lovelace");
printf("%s (%lu chars)", name, strlen(name));`, output: "Ada Lovelace (13 chars)" },
        { title: "Preprocessor macros", desc: "#define text-substitutes before compilation — used for constants and simple inline-like macros; no type checking, so use with care.",
          code: `#define SQUARE(x) ((x) * (x))
#define MAX_USERS 100

printf("%d", SQUARE(5));`, output: "25" },
      ]},
    ],
  },
  {
    key: "cpp", label: "C++", color: CM.teal,
    sections: [
      { cat: "Basics", items: [
        { title: "Hello world & I/O", desc: "cout/cin handle console I/O via the <</>> stream operators instead of printf/scanf format strings.",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`, output: "Hello, world!" },
        { title: "References vs pointers", desc: "A reference is an alias for an existing variable — safer than a pointer since it can't be null and doesn't need dereferencing syntax.",
          code: `void addOne(int &x) { x += 1; }

int n = 5;
addOne(n);
cout << n;`, output: "6" },
      ]},
      { cat: "OOP", items: [
        { title: "Classes", desc: "Bundles data + behavior; constructors initialize, and access specifiers (public/private) control encapsulation.",
          code: `class Point {
public:
    Point(double x, double y) : x_(x), y_(y) {}
    double x() const { return x_; }
private:
    double x_, y_;
};` },
        { title: "Inheritance & polymorphism", desc: "`virtual` methods let a base-class pointer call the derived class's override at runtime — the core of runtime polymorphism in C++.",
          code: `class Shape {
public:
    virtual double area() const { return 0; }
};
class Circle : public Shape {
public:
    Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
private:
    double r_;
};` },
        { title: "Operator overloading", desc: "Redefine what an operator like + means for your own type, so custom objects can be combined with familiar, readable syntax.",
          code: `struct Vec2 {
    double x, y;
    Vec2 operator+(const Vec2& o) const {
        return { x + o.x, y + o.y };
    }
};
Vec2 a{1,2}, b{3,4};
Vec2 c = a + b; // {4, 6}` },
      ]},
      { cat: "Templates & Memory", items: [
        { title: "Templates", desc: "Write one function/class that works with any type — the compiler generates a specialized version per type used, giving generics with zero runtime cost.",
          code: `template <typename T>
T maxOf(T a, T b) {
    return a > b ? a : b;
}
cout << maxOf(3, 7) << " " << maxOf(2.5, 1.1);`, output: "7 2.5" },
        { title: "Smart pointers", desc: "unique_ptr automatically frees its memory when it goes out of scope — eliminates most manual new/delete bugs and memory leaks.",
          code: `#include <memory>
std::unique_ptr<int> p = std::make_unique<int>(42);
cout << *p;
// memory freed automatically at end of scope`, output: "42" },
        { title: "Lambda expressions", desc: "Anonymous inline functions, often used with STL algorithms; [ ] captures outside variables by value or reference.",
          code: `int threshold = 10;
auto isBig = [threshold](int n) { return n > threshold; };
cout << isBig(15);`, output: "1" },
      ]},
      { cat: "STL", items: [
        { title: "vector & algorithms", desc: "std::vector is a dynamic, resizable array — the default choice over raw C arrays; <algorithm> adds sort, find, etc.",
          code: `#include <vector>
#include <algorithm>

vector<int> v = {5, 3, 1, 4};
sort(v.begin(), v.end());
v.push_back(9);
for (int n : v) cout << n << " ";`, output: "1 3 4 5 9 " },
        { title: "map & set", desc: "std::map is an ordered key/value store (like a sorted dictionary); std::set stores unique, automatically sorted elements.",
          code: `#include <map>
map<string, int> ages;
ages["Ada"] = 30;
ages["Grace"] = 85;
cout << ages["Ada"];`, output: "30" },
      ]},
    ],
  },
  {
    key: "java", label: "Java", color: CM.pink,
    sections: [
      { cat: "Basics", items: [
        { title: "Hello world", desc: "Every Java file needs a public class matching the filename, and execution starts at main.",
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`, output: "Hello, world!" },
        { title: "Variables & conditionals", desc: "Java is statically typed — every variable declares its type; primitives (int, double, boolean) vs objects (String, Integer) behave differently.",
          code: `int age = 20;
if (age >= 18) {
    System.out.println("Adult");
} else {
    System.out.println("Minor");
}`, output: "Adult" },
      ]},
      { cat: "OOP", items: [
        { title: "Classes & interfaces", desc: "A class implements an interface to guarantee it provides certain methods — enables polymorphism: code can depend on the interface, not a concrete class.",
          code: `interface Shape {
    double area();
}
class Circle implements Shape {
    double r;
    Circle(double r) { this.r = r; }
    public double area() { return Math.PI * r * r; }
}` },
        { title: "Static vs instance members", desc: "static belongs to the class itself (shared, one copy); instance members belong to each object separately.",
          code: `class Counter {
    static int total = 0;   // shared across all instances
    int id;
    Counter() { id = ++total; }
}
new Counter(); new Counter();
System.out.println(Counter.total);`, output: "2" },
        { title: "Enums", desc: "A fixed set of named constants — safer and more readable than using raw ints or strings to represent a limited set of options.",
          code: `enum Level { LOW, MEDIUM, HIGH }

Level l = Level.MEDIUM;
System.out.println(l);`, output: "MEDIUM" },
        { title: "Exceptions & try-with-resources", desc: "try-with-resources auto-closes any resource implementing AutoCloseable (like file streams) even if an exception is thrown.",
          code: `try (var reader = new java.io.FileReader("data.txt")) {
    // use reader
} catch (java.io.IOException e) {
    System.out.println("Error: " + e.getMessage());
}` },
      ]},
      { cat: "Collections, Generics & Streams", items: [
        { title: "Generics", desc: "Write a class/method that works with any type while keeping compile-time type safety — Box<String> and Box<Integer> share one implementation.",
          code: `class Box<T> {
    private T value;
    void set(T value) { this.value = value; }
    T get() { return value; }
}
Box<String> b = new Box<>();
b.set("hello");` },
        { title: "ArrayList & HashMap", desc: "ArrayList is Java's resizable array; HashMap is the standard key/value store — both live in java.util.",
          code: `List<String> names = new ArrayList<>();
names.add("Ada");

Map<String, Integer> ages = new HashMap<>();
ages.put("Ada", 30);
System.out.println(ages.get("Ada"));`, output: "30" },
        { title: "Streams", desc: "Streams chain map/filter/reduce-style operations over a collection in a declarative, functional style.",
          code: `List<Integer> nums = List.of(1, 2, 3, 4, 5);
int sumOfSquaresOfEvens = nums.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .reduce(0, Integer::sum);
System.out.println(sumOfSquaresOfEvens);`, output: "20" },
        { title: "Optional", desc: "Wraps a value that might be absent, forcing you to explicitly handle the missing case instead of risking a NullPointerException.",
          code: `Optional<String> name = Optional.ofNullable(getName());
System.out.println(name.orElse("Unknown"));` },
      ]},
    ],
  },
  {
    key: "git", label: "Git & GitHub", color: CM.orange,
    sections: [
      { cat: "Setup & Config", items: [
        { title: "Initial configuration", desc: "Global config applies to every repo on the machine; --local (the default inside a repo) overrides it for just that project. Git needs a name/email so every commit can be attributed to you.",
          code: `git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"
git config --list                 # view all settings`, output: "user.name=Ada Lovelace\nuser.email=ada@example.com\ninit.defaultbranch=main" },
        { title: "git init & git clone", desc: "init creates a brand-new empty repo in the current folder; clone copies an existing remote repo (all history + branches) to your machine and wires up 'origin' automatically.",
          code: `git init                                  # start a new repo here
git clone https://github.com/user/repo.git
git clone git@github.com:user/repo.git    # via SSH
git clone --depth 1 <url>                 # shallow clone, latest commit only` },
        { title: ".gitignore", desc: "Lists file/folder patterns Git should never track (build output, secrets, dependencies) — untracked files listed here are hidden from `git status`.",
          code: `node_modules/
.env
*.log
dist/
.DS_Store
__pycache__/` },
      ]},
      { cat: "Basic Workflow", items: [
        { title: "status, add & commit", desc: "The core loop: status shows what changed, add stages the changes you want in the next commit (the 'staging area'), commit permanently snapshots the staged changes with a message.",
          code: `git status                # see modified/untracked files
git add file.js            # stage one file
git add .                  # stage everything in this folder
git add -p                 # interactively stage hunks
git commit -m "Add login form"
git commit -am "fix typo"  # stage tracked files + commit in one step`, output: "[main 4a2f9c1] Add login form\n 1 file changed, 12 insertions(+)" },
        { title: "git diff", desc: "Shows line-by-line changes. Plain `diff` = unstaged changes vs last commit; `diff --staged` = staged changes vs last commit; `diff branchA branchB` compares any two refs.",
          code: `git diff                   # working dir vs last commit (unstaged)
git diff --staged          # staged vs last commit
git diff main feature      # compare two branches
git diff HEAD~2 HEAD       # compare commits` },
        { title: "Renaming, removing & moving files", desc: "Use Git's own mv/rm instead of the OS commands so the rename/deletion is staged automatically instead of showing up as a separate delete + untracked add.",
          code: `git mv old-name.js new-name.js
git rm unused-file.js       # delete + stage the deletion
git rm --cached secrets.env # untrack but keep the local file` },
      ]},
      { cat: "Branching & Merging", items: [
        { title: "Creating & switching branches", desc: "A branch is a lightweight, movable pointer to a commit. `switch`/`checkout -b` create + move to a new branch in one step; work stays isolated until you merge.",
          code: `git branch                     # list local branches
git branch feature/login       # create a branch
git switch feature/login       # move to it (modern)
git checkout -b feature/login  # create + switch (classic)
git branch -d feature/login    # delete a merged branch
git branch -D feature/login    # force-delete (even if unmerged)` },
        { title: "git merge", desc: "Combines another branch's history into your current one. A fast-forward merge just moves the pointer; a 3-way merge creates a new merge commit when both branches have diverged.",
          code: `git switch main
git merge feature/login          # merge feature into main
git merge --no-ff feature/login  # always create a merge commit
git merge --abort                # bail out of a bad merge` },
        { title: "git rebase", desc: "Replays your branch's commits on top of another branch, producing a linear history instead of a merge commit. Never rebase commits that are already pushed and shared with others.",
          code: `git switch feature/login
git rebase main                  # replay feature commits onto main
git rebase -i HEAD~3              # interactively squash/reword/reorder
git rebase --continue             # after resolving a conflict
git rebase --abort                # cancel the rebase entirely` },
        { title: "Resolving merge conflicts", desc: "Git marks the exact lines both branches touched; you edit the file to keep the right content, remove the markers, then stage and continue.",
          code: `<<<<<<< HEAD
const greeting = "Hello";
=======
const greeting = "Hi there";
>>>>>>> feature/login

# after editing to resolve:
git add file.js
git commit          # or: git merge --continue / rebase --continue` },
      ]},
      { cat: "Remote & Collaboration", items: [
        { title: "Remotes: push, pull & fetch", desc: "fetch downloads new commits but doesn't touch your working files; pull = fetch + merge in one step; push uploads your local commits to the remote.",
          code: `git remote add origin git@github.com:user/repo.git
git remote -v                      # list remotes
git fetch origin                   # download only, no merge
git pull origin main                # fetch + merge
git push origin feature/login       # upload a branch
git push -u origin feature/login    # push + set upstream tracking` },
        { title: "Tracking branches", desc: "Once a local branch tracks a remote one (-u/--set-upstream), plain `git push`/`git pull` know where to send/receive without specifying the remote and branch every time.",
          code: `git push -u origin main       # set upstream once
git push                       # now works with no args
git branch -vv                 # show tracking info per branch
git push origin --delete old-feature   # delete a remote branch` },
      ]},
      { cat: "History & Inspection", items: [
        { title: "git log", desc: "Walks commit history. --oneline compresses each commit to one line; --graph draws branch topology; --stat shows which files changed and by how much.",
          code: `git log --oneline --graph --all
git log -p -- file.js       # full diffs for a file's history
git log --author="Ada"      # filter by author
git log --since="2 weeks ago"`, output: "* 4a2f9c1 (HEAD -> main) Add login form\n* 9d1e7ab Fix header spacing\n* 3c8b210 Initial commit" },
        { title: "git show & git blame", desc: "show displays one commit's full diff and metadata; blame annotates every line of a file with the commit and author that last changed it — great for tracking down when/why a bug was introduced.",
          code: `git show 4a2f9c1              # inspect one commit
git blame file.js              # who changed each line
git blame -L 10,20 file.js     # only lines 10-20` },
      ]},
      { cat: "Undoing Changes", items: [
        { title: "git reset (soft / mixed / hard)", desc: "Moves the branch pointer to an earlier commit. --soft keeps changes staged, --mixed (default) unstages them but keeps the files, --hard discards everything — use with real caution.",
          code: `git reset --soft HEAD~1   # undo last commit, keep changes staged
git reset HEAD~1           # undo last commit, keep changes unstaged
git reset --hard HEAD~1    # undo last commit AND discard changes
git reset file.js          # unstage one file` },
        { title: "git revert", desc: "Creates a brand-new commit that undoes a previous one, without rewriting history — the safe way to undo something that's already been pushed/shared.",
          code: `git revert 4a2f9c1          # revert a specific commit
git revert HEAD              # revert the most recent commit
git revert --no-commit HEAD~2..HEAD  # revert a range, stage only` },
        { title: "Discarding & stashing", desc: "checkout/restore throws away uncommitted edits to a file; stash temporarily shelves all your uncommitted work so you can switch branches with a clean working directory.",
          code: `git restore file.js          # discard unstaged edits (modern)
git checkout -- file.js      # discard unstaged edits (classic)
git stash                    # shelve all changes
git stash list                # see stashed sets
git stash pop                 # reapply + remove the latest stash
git stash apply stash@{1}     # reapply a specific stash, keep it` },
      ]},
      { cat: "Advanced", items: [
        { title: "git cherry-pick", desc: "Applies one specific commit from another branch onto your current branch — useful for pulling in a single fix without merging the whole branch.",
          code: `git cherry-pick 9d1e7ab
git cherry-pick 9d1e7ab --no-commit   # apply changes without committing` },
        { title: "Tags", desc: "A tag is a permanent pointer to one commit, typically used to mark release versions. Annotated tags (-a) store metadata (author, date, message); lightweight tags are just a name.",
          code: `git tag v1.0.0                       # lightweight tag
git tag -a v1.0.0 -m "First release"  # annotated tag
git push origin v1.0.0                # push a single tag
git push origin --tags                # push all tags` },
        { title: "git bisect", desc: "Binary-searches your commit history to find exactly which commit introduced a bug — you mark commits 'good' or 'bad' and Git narrows it down in O(log n) steps.",
          code: `git bisect start
git bisect bad                # current commit is broken
git bisect good v1.0.0         # this old commit was fine
# Git checks out a midpoint — test it, then:
git bisect good   # or: git bisect bad
git bisect reset               # finish and return to HEAD` },
      ]},
      { cat: "GitHub Workflow", items: [
        { title: "Fork & pull request flow", desc: "The standard open-source contribution flow: fork the repo to your account, branch, commit, push to your fork, then open a PR asking the original repo to merge your branch.",
          code: `# 1. Fork on github.com, then:
git clone git@github.com:you/repo.git
git remote add upstream git@github.com:original/repo.git
git switch -c fix/typo
# ...make changes...
git push origin fix/typo
# 2. Open a Pull Request on GitHub from you:fix/typo -> original:main` },
        { title: "Keeping a fork in sync", desc: "Your fork doesn't auto-update when the original repo gets new commits — pull from 'upstream' regularly and push the result to your own fork.",
          code: `git fetch upstream
git switch main
git merge upstream/main
git push origin main` },
        { title: "GitHub CLI (gh)", desc: "gh lets you manage issues, pull requests, and repos entirely from the terminal — no browser tab required.",
          code: `gh auth login
gh repo clone user/repo
gh pr create --title "Add login form" --body "Closes #12"
gh pr list
gh pr checkout 42
gh pr merge 42 --squash
gh issue create --title "Bug: header overlaps on mobile"` },
        { title: "SSH keys for GitHub", desc: "SSH keys let you push/pull without typing a password every time. Generate a keypair once, then add the public half to your GitHub account.",
          code: `ssh-keygen -t ed25519 -C "ada@example.com"
cat ~/.ssh/id_ed25519.pub    # copy this into GitHub → Settings → SSH Keys
ssh -T git@github.com         # test the connection` },
        { title: "GitHub Actions basics", desc: "A workflow file in .github/workflows runs automated jobs (tests, builds, deploys) on events like push or pull_request — GitHub's built-in CI/CD.",
          code: `# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - run: npm test` },
      ]},
    ],
  },
  {
    key: "linux", label: "Linux", color: CM.cyan,
    sections: [
      { cat: "Navigation & Files", items: [
        { title: "Moving around: pwd, cd, ls", desc: "pwd prints where you are; cd changes directory (`cd -` jumps back to the previous one); ls lists contents — -l for details, -a to include hidden dotfiles.",
          code: `pwd                  # print working directory
cd /var/www          # absolute path
cd ../logs           # relative path
cd ~                 # home directory
cd -                 # previous directory
ls -la                # long format, show hidden files
ls -lh                # human-readable sizes (K/M/G)`, output: "/home/ada/projects" },
        { title: "Creating & removing", desc: "mkdir -p creates nested directories in one shot without erroring if they already exist; rm -r removes a directory and everything inside it, -f skips confirmation.",
          code: `mkdir new-folder
mkdir -p a/b/c              # create nested dirs at once
touch notes.txt              # create an empty file / update timestamp
rm file.txt
rm -r old-folder/            # remove directory recursively
rm -rf build/                # force, no confirmation — use carefully` },
        { title: "Copying & moving", desc: "cp duplicates files/folders (-r for directories); mv both renames and relocates, since a rename is just a move to a new path in the same filesystem.",
          code: `cp file.txt backup.txt
cp -r src/ dist/           # copy a whole directory tree
mv old-name.txt new-name.txt
mv file.txt ../archive/     # move into another directory` },
        { title: "find", desc: "Searches a directory tree by name, type, size, or modification time, and can execute a command on every match.",
          code: `find . -name "*.log"                  # by filename pattern
find . -type d -name "node_modules"    # only directories
find . -mtime -1                        # modified in the last day
find . -size +100M                      # larger than 100MB
find . -name "*.tmp" -delete            # find and delete
find . -name "*.js" -exec wc -l {} \\;   # run a command per match` },
      ]},
      { cat: "Viewing & Editing Files", items: [
        { title: "cat, less, head & tail", desc: "cat dumps a whole file; less pages through it interactively (q to quit); head/tail show just the start/end — tail -f keeps streaming new lines as they're written (great for logs).",
          code: `cat file.txt              # print whole file
less bigfile.log           # page through interactively
head -n 20 file.txt        # first 20 lines
tail -n 20 file.txt        # last 20 lines
tail -f /var/log/syslog     # follow live log output` },
        { title: "grep — search inside files", desc: "grep prints lines matching a pattern. -r searches recursively, -i ignores case, -n shows line numbers, -v inverts (show non-matching lines).",
          code: `grep "error" app.log
grep -rn "TODO" ./src        # recursive + line numbers
grep -i "warning" app.log     # case-insensitive
grep -v "debug" app.log       # exclude matching lines
grep -c "error" app.log       # count matches`, output: "12:2024-01-15 error: connection refused\n47:2024-01-15 error: timeout" },
        { title: "nano & vim basics", desc: "nano is beginner-friendly (shortcuts shown at the bottom); vim has modal editing — press i to insert text, Esc to leave insert mode, :wq to save & quit, :q! to quit without saving.",
          code: `nano config.txt          # Ctrl+O save, Ctrl+X exit
vim config.txt
# i       -> insert mode
# Esc     -> normal mode
# :wq     -> save and quit
# :q!     -> quit without saving
# dd      -> delete a line (normal mode)
# /term   -> search for "term"` },
      ]},
      { cat: "Permissions & Ownership", items: [
        { title: "chmod — change permissions", desc: "Permissions are read(4)/write(2)/execute(1) for owner/group/others. `chmod 755 file` = owner: rwx, group/others: r-x. `+x` just adds execute without touching the rest.",
          code: `chmod 755 script.sh       # rwxr-xr-x
chmod +x deploy.sh         # make executable
chmod -R 644 ./public       # recursively set files to rw-r--r--
ls -l script.sh`, output: "-rwxr-xr-x  1 ada  staff  312 Jan 15 09:00 script.sh" },
        { title: "chown & sudo", desc: "chown changes which user/group owns a file; sudo runs a single command with root/administrator privileges — use it deliberately, never as a habit.",
          code: `sudo chown ada:staff file.txt      # change owner:group
sudo chown -R ada:staff ./project   # recursively
sudo apt update && sudo apt upgrade # run as root
whoami                               # current user
sudo -i                              # open a root shell` },
      ]},
      { cat: "Processes", items: [
        { title: "ps & top/htop", desc: "ps snapshots running processes; `ps aux` shows everyone's processes with CPU/memory usage. top/htop show a live, auto-refreshing view — press q to quit.",
          code: `ps aux                  # all processes, full detail
ps aux | grep node       # find a specific process
top                       # live view (q to quit)
htop                      # nicer, colorized live view`, output: "USER   PID  %CPU  %MEM  COMMAND\nada    4821  0.3   1.2   node server.js" },
        { title: "kill & job control", desc: "kill sends a signal to a process by PID (default: terminate gracefully; -9 forces it). Ctrl+Z suspends a foreground job; bg/fg resume it in the background/foreground; & starts a job backgrounded from the start.",
          code: `kill 4821                # graceful terminate (SIGTERM)
kill -9 4821              # force kill (SIGKILL)
killall node               # kill by process name
long-task.sh &              # run in background
jobs                        # list background jobs
fg %1                       # bring job 1 to foreground
nohup long-task.sh &         # keep running after terminal closes` },
      ]},
      { cat: "Networking", items: [
        { title: "ping, curl & wget", desc: "ping checks basic reachability/latency to a host; curl fetches a URL and prints/transfers the response (great for testing APIs); wget downloads a file straight to disk.",
          code: `ping -c 4 google.com                 # 4 pings then stop
curl https://api.example.com/users    # GET request, print response
curl -X POST -d '{"name":"Ada"}' \\
     -H "Content-Type: application/json" \\
     https://api.example.com/users
curl -O https://example.com/file.zip  # save with original filename
wget https://example.com/file.zip     # download to disk` },
        { title: "ssh & scp", desc: "ssh opens a secure remote shell on another machine; scp copies files to/from a remote machine over the same SSH connection.",
          code: `ssh ada@192.168.1.10                  # connect to remote host
ssh -i ~/.ssh/id_ed25519 ada@server    # connect with a specific key
scp file.txt ada@server:/home/ada/      # upload a file
scp ada@server:/var/log/app.log ./       # download a file
scp -r ./dist ada@server:/var/www/       # upload a directory` },
        { title: "Inspecting connections", desc: "ss (modern) / netstat (classic) list open network connections and listening ports — useful for finding what's bound to a port before you start a server.",
          code: `ss -tulpn                 # listening TCP/UDP ports + process
netstat -tulpn             # older equivalent
lsof -i :3000               # what's using port 3000` },
      ]},
      { cat: "System Info & Packages", items: [
        { title: "Disk & memory usage", desc: "df reports free space per mounted filesystem; du reports how much space a specific folder's contents use — du -sh summarizes one directory instead of listing every file.",
          code: `df -h                       # disk free, human-readable
du -sh ./node_modules        # size of one directory
du -sh * | sort -rh           # sizes of everything here, biggest first
free -h                       # RAM usage, human-readable`, output: "Filesystem  Size  Used  Avail  Use%\n/dev/sda1    50G   32G    18G   64%" },
        { title: "System info", desc: "uname reports kernel/OS info; uptime shows how long the machine has been running plus load average.",
          code: `uname -a          # full system info
uptime             # how long since boot + load average
lscpu              # CPU details
hostname            # machine name` },
        { title: "Package managers", desc: "apt (Debian/Ubuntu) and dnf/yum (Fedora/RHEL) install, update, and remove software from repositories — always update the package index before installing.",
          code: `# Debian / Ubuntu
sudo apt update
sudo apt install git nginx
sudo apt remove nginx

# Fedora / RHEL
sudo dnf install git nginx
sudo dnf remove nginx` },
      ]},
      { cat: "Text Processing", items: [
        { title: "sed — stream editor", desc: "sed transforms text line-by-line without opening an editor — most commonly used for find-and-replace across a file or a pipeline.",
          code: `sed 's/foo/bar/' file.txt        # replace first match per line
sed 's/foo/bar/g' file.txt        # replace all matches per line
sed -i 's/foo/bar/g' file.txt      # edit the file in place
sed -n '5,10p' file.txt             # print only lines 5-10` },
        { title: "awk — column-based processing", desc: "awk splits each line into fields ($1, $2…) by whitespace (or a custom separator) — ideal for extracting/summing columns from structured text like logs or CSVs.",
          code: `awk '{ print $1 }' access.log        # print first column
awk -F, '{ print $2 }' data.csv       # comma-separated
awk '{ sum += $3 } END { print sum }' sales.txt  # sum a column` },
        { title: "sort, uniq & wc", desc: "sort orders lines (-n numeric, -r reverse); uniq collapses adjacent duplicate lines (usually paired with sort first); wc counts lines/words/bytes.",
          code: `sort names.txt
sort -n scores.txt              # numeric sort
sort file.txt | uniq             # unique lines
sort file.txt | uniq -c | sort -rn  # count + rank duplicates
wc -l file.txt                    # line count
wc -w file.txt                    # word count` },
        { title: "Pipes & redirection", desc: "| feeds one command's output into the next as input, chaining small tools into a pipeline; > overwrites a file with output, >> appends to it, 2> redirects errors separately from stdout.",
          code: `cat access.log | grep "500" | wc -l    # chained pipeline
echo "hello" > out.txt                  # overwrite file
echo "world" >> out.txt                 # append to file
command 2> errors.log                    # redirect stderr only
command > out.log 2>&1                   # redirect both to one file` },
      ]},
    ],
  },
  {
    key: "shell", label: "Shell", color: CM.lime,
    sections: [
      { cat: "Variables & Basics", items: [
        { title: "Variables & echo", desc: "No spaces around `=` when assigning. $name (or ${name}) expands a variable; double quotes allow expansion, single quotes treat everything literally.",
          code: `name="Ada"
echo "Hello, $name"
echo 'Hello, $name'      # prints literally, no expansion
echo "Today is $(date +%A)"   # command substitution
readonly PI=3.14159       # constant, can't be reassigned`, output: "Hello, Ada\nHello, $name\nToday is Monday" },
        { title: "Environment variables & export", desc: "A plain variable only exists in the current shell; export makes it available to any child process the shell spawns (like scripts or programs it runs).",
          code: `export API_KEY="abc123"
echo $PATH                  # colon-separated list of binary dirs
env                          # list all environment variables
unset API_KEY                # remove a variable` },
        { title: "Command substitution & arithmetic", desc: "$(command) captures a command's output as a string; $((expr)) evaluates integer arithmetic — both are far more readable than the older backtick syntax.",
          code: `files=$(ls | wc -l)
echo "There are $files files"
total=$((5 + 3 * 2))
echo $total`, output: "There are 12 files\n11" },
      ]},
      { cat: "Conditionals & Loops", items: [
        { title: "if / elif / else", desc: "Square brackets `[ ]` (or `[[ ]]` for the more forgiving Bash extension) run a test; -eq/-lt compare numbers, = compares strings, -f/-d check if a file/directory exists.",
          code: `if [ "$name" = "Ada" ]; then
  echo "Hello Ada"
elif [ -z "$name" ]; then
  echo "No name given"
else
  echo "Hello stranger"
fi

if [ -f "config.json" ]; then
  echo "Config exists"
fi` },
        { title: "for loop", desc: "Iterates over a list of words, the output of a command, or a numeric range — one of the most common patterns in shell scripts.",
          code: `for f in *.txt; do
  echo "Processing $f"
done

for i in {1..5}; do
  echo "Count: $i"
done

for user in $(cat users.txt); do
  echo "User: $user"
done` },
        { title: "while loop", desc: "Repeats as long as its condition stays true — commonly used to read a file line-by-line or poll for a condition.",
          code: `count=0
while [ $count -lt 5 ]; do
  echo "Count: $count"
  count=$((count + 1))
done

while read -r line; do
  echo "Line: $line"
done < file.txt` },
        { title: "case statement", desc: "Matches a value against a list of patterns — a cleaner alternative to a long if/elif chain when checking one variable against several possibilities.",
          code: `read -p "Enter environment: " env
case $env in
  dev)
    echo "Starting dev server" ;;
  prod)
    echo "Deploying to production" ;;
  *)
    echo "Unknown environment" ;;
esac` },
      ]},
      { cat: "Functions & Scripting", items: [
        { title: "Functions", desc: "Groups reusable logic under a name. Arguments are accessed as $1, $2… inside the function, just like script arguments; `return` sets an exit code, not a value to print.",
          code: `greet() {
  local name=$1
  echo "Hello, $name!"
}
greet "Ada"

is_even() {
  [ $(($1 % 2)) -eq 0 ]
}
if is_even 4; then echo "even"; fi`, output: "Hello, Ada!\neven" },
        { title: "Script arguments", desc: "$0 is the script's own name, $1.. are the positional arguments passed to it, $# is the argument count, and $@ expands to all of them.",
          code: `#!/bin/bash
echo "Script: $0"
echo "First arg: $1"
echo "All args: $@"
echo "Arg count: $#"
# run as: ./deploy.sh staging --force` },
        { title: "Exit codes & set -e", desc: "Every command returns an exit code (0 = success, nonzero = failure) in $?. `set -e` makes the whole script stop immediately the moment any command fails — a common safety net.",
          code: `#!/bin/bash
set -e   # exit immediately on any error

mkdir build
cd build
echo $?          # 0 if the previous command succeeded

command_that_might_fail || echo "fallback ran"` },
      ]},
      { cat: "I/O, Strings & Arrays", items: [
        { title: "Redirection & pipes", desc: "Chain and route command input/output: `>` overwrite, `>>` append, `<` read from a file, `|` pipe one command's stdout into the next command's stdin.",
          code: `echo "log entry" >> app.log
sort < names.txt > sorted.txt
grep "error" app.log | wc -l
command 2>/dev/null            # discard error output` },
        { title: "read — user input", desc: "Reads a line of input into a variable, optionally showing a prompt (-p) or hiding typed characters (-s, useful for passwords).",
          code: `read -p "Enter your name: " name
echo "Hi, $name"

read -s -p "Password: " pass
echo` },
        { title: "String operations", desc: "Bash has built-in parameter expansion for length, substring extraction, and find/replace, without needing external tools like sed for simple cases.",
          code: `str="Hello World"
echo \${#str}            # length -> 11
echo \${str:0:5}          # substring -> Hello
echo \${str/World/Bash}   # replace -> Hello Bash
echo \${str^^}             # uppercase -> HELLO WORLD` },
        { title: "Arrays", desc: "Bash arrays hold a list of values; index with [i], get every element with [@], and get the count with #.",
          code: `fruits=("apple" "banana" "cherry")
echo \${fruits[0]}          # apple
echo \${fruits[@]}          # all elements
echo \${#fruits[@]}          # count -> 3
fruits+=("date")            # append` },
      ]},
    ],
  },
  {
    key: "http-status", label: "HTTP Status", color: CM.amber,
    sections: [
      { cat: "1xx — Informational", items: [
        { title: "100 Continue & 101 Switching Protocols", desc: "1xx codes are provisional — the request was received and processing continues; the client should keep waiting for the final response and doesn't need to take any action yet.",
          code: `HTTP/1.1 100 Continue
# Server: "I got your headers, go ahead and send the body."

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
# Server agrees to switch (e.g. HTTP -> WebSocket)` },
      ]},
      { cat: "2xx — Success", items: [
        { title: "200 OK & 201 Created", desc: "200 is the general-purpose success response for GET/PUT/PATCH. 201 specifically means a new resource was created (typically from POST) — the Location header usually points to it.",
          code: `HTTP/1.1 200 OK
Content-Type: application/json

{"id": 1, "name": "Ada"}

HTTP/1.1 201 Created
Location: /users/42

{"id": 42, "name": "Grace"}` },
        { title: "202 Accepted & 204 No Content", desc: "202 means the request was accepted for processing but isn't finished yet (async jobs/queues). 204 means success with intentionally no response body — common for DELETE or a successful PUT with nothing to return.",
          code: `HTTP/1.1 202 Accepted
{"jobId": "abc123", "status": "queued"}

HTTP/1.1 204 No Content
# (empty body) — e.g. DELETE /users/42 succeeded` },
        { title: "206 Partial Content", desc: "Returned when the server honors a Range request header — used for resumable downloads and video/audio streaming where only part of a file is requested.",
          code: `GET /video.mp4
Range: bytes=1000-1999

HTTP/1.1 206 Partial Content
Content-Range: bytes 1000-1999/50000
Content-Length: 1000` },
      ]},
      { cat: "3xx — Redirection", items: [
        { title: "301 Moved Permanently & 302 Found", desc: "301 tells clients (and search engines) the resource has a new permanent URL — update your bookmarks/links. 302 is a temporary redirect; the original URL should still be used for future requests.",
          code: `HTTP/1.1 301 Moved Permanently
Location: https://example.com/new-path

HTTP/1.1 302 Found
Location: https://example.com/temporary-path` },
        { title: "304 Not Modified", desc: "Sent when the client's cached copy (validated via If-None-Match/If-Modified-Since) is still current — the server tells it to reuse the cache instead of resending the body, saving bandwidth.",
          code: `GET /style.css
If-None-Match: "abc123"

HTTP/1.1 304 Not Modified
# (no body — browser uses its cached style.css)` },
        { title: "307 & 308 (strict redirects)", desc: "Like 302/301 but explicitly forbid the client from changing the request method or body on redirect — 307 = temporary, 308 = permanent, both method-preserving.",
          code: `HTTP/1.1 307 Temporary Redirect
Location: https://example.com/new-endpoint
# A POST redirected here will still be sent as POST` },
      ]},
      { cat: "4xx — Client Errors", items: [
        { title: "400 Bad Request & 401 Unauthorized", desc: "400 means the request itself is malformed (bad JSON, missing required field) — a client-side fix is needed. 401 means authentication is missing or invalid; the client should log in / send valid credentials.",
          code: `HTTP/1.1 400 Bad Request
{"error": "Field 'email' is required"}

HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
{"error": "Invalid or expired token"}` },
        { title: "403 Forbidden & 404 Not Found", desc: "403 means the client IS identified but explicitly not allowed to access this resource (permissions issue). 404 means the resource simply doesn't exist at this URL.",
          code: `HTTP/1.1 403 Forbidden
{"error": "You do not have access to this project"}

HTTP/1.1 404 Not Found
{"error": "User 999 does not exist"}` },
        { title: "405, 409 & 422", desc: "405 = this HTTP method isn't allowed on this URL (check the Allow header). 409 = the request conflicts with the resource's current state (e.g. duplicate unique field). 422 = well-formed request but semantically invalid data.",
          code: `HTTP/1.1 405 Method Not Allowed
Allow: GET, POST

HTTP/1.1 409 Conflict
{"error": "Username already taken"}

HTTP/1.1 422 Unprocessable Entity
{"error": "email must be a valid address"}` },
        { title: "429 Too Many Requests", desc: "Rate-limiting response — the client has sent too many requests in a given window. Retry-After tells the client how long to wait before trying again.",
          code: `HTTP/1.1 429 Too Many Requests
Retry-After: 60
{"error": "Rate limit exceeded, try again in 60s"}` },
      ]},
      { cat: "5xx — Server Errors", items: [
        { title: "500 Internal Server Error", desc: "A generic catch-all meaning something broke on the server while handling an otherwise valid request — the fault is server-side, not the client's.",
          code: `HTTP/1.1 500 Internal Server Error
{"error": "Something went wrong. Please try again later."}` },
        { title: "502, 503 & 504", desc: "502 = a server acting as a gateway/proxy got an invalid response from an upstream server. 503 = the server is temporarily overloaded or down for maintenance. 504 = a gateway timed out waiting for the upstream server.",
          code: `HTTP/1.1 502 Bad Gateway
# reverse proxy got garbage from the app server

HTTP/1.1 503 Service Unavailable
Retry-After: 120
# server is down for maintenance / overloaded

HTTP/1.1 504 Gateway Timeout
# upstream server took too long to respond` },
      ]},
    ],
  },
  {
    key: "http-methods", label: "HTTP Methods", color: CM.violet,
    sections: [
      { cat: "Core CRUD Methods", items: [
        { title: "GET", desc: "Retrieves a resource. Safe (never modifies server state) and idempotent (calling it many times has the same effect as calling it once) — so browsers freely cache and prefetch GET requests.",
          code: `GET /api/users/42 HTTP/1.1
Host: example.com
Accept: application/json

# fetch equivalent:
fetch("/api/users/42")
  .then(res => res.json())`, output: "200 OK\n{ \"id\": 42, \"name\": \"Grace\" }" },
        { title: "POST", desc: "Creates a new resource or triggers a server-side action. NOT idempotent — sending the same POST twice typically creates two resources, which is why forms warn about double-submitting.",
          code: `POST /api/users HTTP/1.1
Content-Type: application/json

{"name": "Ada", "email": "ada@example.com"}

# fetch equivalent:
fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Ada" })
})`, output: "201 Created\nLocation: /api/users/43" },
        { title: "PUT", desc: "Replaces a resource entirely with the request body. Idempotent — sending the same PUT multiple times leaves the resource in the same final state, unlike POST.",
          code: `PUT /api/users/42 HTTP/1.1
Content-Type: application/json

{"id": 42, "name": "Grace Hopper", "email": "grace@example.com"}
# entire resource is replaced — omitted fields are lost` },
        { title: "PATCH", desc: "Partially updates a resource — only the fields included in the body are changed, everything else is left as-is. Not guaranteed idempotent in general, but usually is in practice.",
          code: `PATCH /api/users/42 HTTP/1.1
Content-Type: application/json

{"email": "new-email@example.com"}
# only the email field changes; name is untouched` },
        { title: "DELETE", desc: "Removes a resource. Idempotent — deleting an already-deleted resource still results in it being gone, typically returning 204 No Content or 404 if it's already been removed.",
          code: `DELETE /api/users/42 HTTP/1.1

# fetch equivalent:
fetch("/api/users/42", { method: "DELETE" })`, output: "204 No Content" },
      ]},
      { cat: "Other Methods", items: [
        { title: "HEAD", desc: "Identical to GET but returns only the headers, no body — used to check if a resource exists, its size, or its last-modified date without downloading it.",
          code: `HEAD /large-file.zip HTTP/1.1

HTTP/1.1 200 OK
Content-Length: 104857600
Last-Modified: Mon, 15 Jan 2024 09:00:00 GMT
# (no body sent)` },
        { title: "OPTIONS", desc: "Asks the server which methods and headers are allowed on a URL — browsers send this automatically as a CORS 'preflight' request before certain cross-origin calls.",
          code: `OPTIONS /api/users HTTP/1.1
Origin: https://myapp.com
Access-Control-Request-Method: POST

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE` },
        { title: "TRACE & CONNECT", desc: "TRACE echoes back the exact request it received, for diagnostics (often disabled — it can enable XST attacks). CONNECT establishes a tunnel to a server, typically used by proxies to relay HTTPS traffic.",
          code: `TRACE /api/users HTTP/1.1
# server echoes the request back unchanged (rarely enabled)

CONNECT example.com:443 HTTP/1.1
# proxy opens a raw TCP tunnel for TLS traffic` },
      ]},
      { cat: "Key Concepts", items: [
        { title: "Safe vs idempotent", desc: "Safe = never changes server state (GET, HEAD, OPTIONS). Idempotent = repeating it N times has the same effect as doing it once (GET, PUT, DELETE — but NOT POST or PATCH in general).",
          code: `Method    Safe   Idempotent
GET        yes     yes
HEAD       yes     yes
OPTIONS    yes     yes
PUT        no      yes
DELETE     no      yes
POST       no      no
PATCH      no      no (usually treated as idempotent in practice)` },
        { title: "Common request headers", desc: "Headers carry metadata about the request — what format the client wants back, what format the body is in, and how the client is authenticating.",
          code: `Content-Type: application/json      # format of the request body
Accept: application/json             # format the client wants back
Authorization: Bearer <token>        # auth credentials
Cache-Control: no-cache               # caching behavior` },
      ]},
    ],
  },
];

const DEMO_MAP = {
  color: ColorDemo, shadow: ShadowDemo, flex: FlexDemo, grid: GridDemo, transition: TransitionDemo,
  keyframes: KeyframesDemo, cssvar: CssVarDemo, typography: TypographyDemo,
  jsarray: JsArrayDemo, optchain: OptionalChainingDemo, dom: DomDemo,
  useState: UseStateDemo, useEffect: UseEffectDemo, useMemo: UseMemoDemo,
  useRef: UseRefDemo, useContext: UseContextDemo, useReducer: UseReducerDemo,
  uselayouteffect: UseLayoutEffectDemo, customhook: CustomHookDemo, controlledform: ControlledFormDemo,
};

// ══════════════════════════════════════════════════════════════════════════
// CARD + TAB
// ══════════════════════════════════════════════════════════════════════════
function EntryCard({ item, color }) {
  const Demo = item.demo ? DEMO_MAP[item.demo] : null;
  return (
    <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: CM.text, marginBottom: 6 }}>{item.title}</div>
        <p style={{ fontSize: 12.5, color: CM.muted, lineHeight: 1.6 }}>{item.desc}</p>
      </div>
      <CodeBlock code={item.code} color={color} />
      {item.preview && <HtmlPreview code={item.code} />}
      {item.output && <OutputBox text={item.output} color={color === CM.accent ? CM.green : color} />}
      {Demo && <Demo />}
    </div>
  );
}

function LangTab({ lang }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...lang.sections.map(s => s.cat)];

  const sections = lang.sections
    .filter(s => cat === "All" || s.cat === cat)
    .map(s => ({ ...s, items: s.items.filter(i => (i.title + i.desc).toLowerCase().includes(query.toLowerCase())) }))
    .filter(s => s.items.length);

  const totalItems = lang.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <CMInput value={query} onChange={setQuery} placeholder={`Search ${lang.label}… (${totalItems} entries)`} width={240} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)} color={lang.color}>{c}</Chip>)}
        </div>
      </div>

      {sections.map(s => (
        <div key={s.cat}>
          <SectionLabel color={lang.color}>{s.cat} · {s.items.length}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
            {s.items.map(item => <EntryCard key={item.title} item={item} color={lang.color} />)}
          </div>
        </div>
      ))}
      {sections.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
          No entries match your search
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function CheatSheet() {
  const [langKey, setLangKey] = useState("html");
  const lang = LANGS.find(l => l.key === langKey);
  const totalEntries = LANGS.reduce((n, l) => n + l.sections.reduce((m, s) => m + s.items.length, 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${CM.surface};}
        ::-webkit-scrollbar-thumb{background:${CM.border2};border-radius:3px;}
        input[type=range]{accent-color:${CM.accent};}
        body{font-family:'Segoe UI',-apple-system,sans-serif;}
        a{color:inherit;text-decoration:none;}
      `}</style>

      <div style={{ background: CM.bg, minHeight: "100vh", color: CM.text, fontFamily: "'Segoe UI',-apple-system,sans-serif" }}>

        {/* ── TOPBAR ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, height: 48, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ffa116,#ff6b00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>⌨</div>
          <NavLink to={"/"}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: CM.text }}>CodeMaster</span>
          </NavLink>
          <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.muted }}>
            <NavLink to={"/explore"}>Explore</NavLink> / <span style={{ color: lang.color }}>Cheat Sheet</span>
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Badge label="Live Demos" color={CM.green} />
            <Badge label={`${totalEntries} Entries`} color={CM.accent} />
          </div>
        </div>

        {/* ── LANGUAGE NAV STRIP ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: "flex", overflowX: "auto", padding: "0 4px" }}>
          {LANGS.map(l => (
            <button key={l.key} onClick={() => setLangKey(l.key)} style={{
              padding: "12px 20px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: "transparent", whiteSpace: "nowrap",
              color: langKey === l.key ? l.color : CM.muted,
              borderBottom: langKey === l.key ? `2px solid ${l.color}` : "2px solid transparent",
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.3, transition: "all 0.15s",
            }}>{l.label}</button>
          ))}
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: CM.text, marginBottom: 4 }}>{lang.label} Cheat Sheet</div>
            <div style={{ fontSize: 12.5, color: CM.muted }}>Core syntax, patterns, and interactive examples for {lang.label}.</div>
          </div>
          <LangTab lang={lang} />
        </div>
      </div>
    </>
  );
}