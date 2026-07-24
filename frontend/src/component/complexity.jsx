import { useState, useMemo } from "react";
import { NavLink } from "react-router";

// ─── CodeMaster Color Palette (matches DSAVisualizer) ─────────────────────────
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
};

// ─── Reusable UI (matches DSAVisualizer conventions) ──────────────────────────
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

// ─── Complexity classes, in strict growth order ───────────────────────────────
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

const CLASS_ORDER = [
  { key: "const", label: "O(1)",       name: "Constant",     color: CM.green,  fn: () => 1 },
  { key: "log",   label: "O(log n)",   name: "Logarithmic",  color: CM.teal,   fn: n => Math.max(0, Math.log2(n)) },
  { key: "sqrt",  label: "O(√n)",      name: "Square Root",  color: CM.sky,    fn: n => Math.sqrt(n) },
  { key: "lin",   label: "O(n)",       name: "Linear",       color: CM.blue,   fn: n => n },
  { key: "nlogn", label: "O(n log n)", name: "Linearithmic", color: CM.purple, fn: n => n * Math.max(1, Math.log2(n)) },
  { key: "quad",  label: "O(n²)",      name: "Quadratic",    color: CM.accent, fn: n => n * n },
  { key: "exp",   label: "O(2ⁿ)",      name: "Exponential",  color: CM.red,    fn: n => Math.pow(2, n) },
  { key: "fact",  label: "O(n!)",      name: "Factorial",    color: CM.pink,   fn: n => factorial(n) },
];
const CLASS_BY_KEY = Object.fromEntries(CLASS_ORDER.map(c => [c.key, c]));

const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
function formatNum(v) {
  if (!isFinite(v)) return "∞";
  if (v < 1000) return (Math.round(v * 100) / 100).toString();
  let u = 0, val = v;
  while (val >= 1000 && u < UNITS.length - 1) { val /= 1000; u++; }
  if (u === UNITS.length - 1 && val >= 1000) return v.toExponential(2);
  return (val < 10 ? val.toFixed(2) : val < 100 ? val.toFixed(1) : Math.round(val)) + UNITS[u];
}

// ─── Algorithm dataset (time: best/avg/worst, plus space) ────────────────────
const ALGORITHMS = [
  { name: "Bubble Sort", category: "Sorting", best: "lin", avg: "quad", worst: "quad", space: "const",
    desc: "Repeatedly steps through the list, swapping adjacent elements that are out of order." },
  { name: "Selection Sort", category: "Sorting", best: "quad", avg: "quad", worst: "quad", space: "const",
    desc: "Repeatedly selects the minimum remaining element and moves it into place." },
  { name: "Insertion Sort", category: "Sorting", best: "lin", avg: "quad", worst: "quad", space: "const",
    desc: "Builds the sorted array one element at a time by inserting into its correct position." },
  { name: "Merge Sort", category: "Sorting", best: "nlogn", avg: "nlogn", worst: "nlogn", space: "lin",
    desc: "Divides the array in half, sorts each half, then merges the results." },
  { name: "Quick Sort", category: "Sorting", best: "nlogn", avg: "nlogn", worst: "quad", space: "log",
    desc: "Partitions around a pivot; degrades to quadratic time on already-sorted or adversarial input." },
  { name: "Heap Sort", category: "Sorting", best: "nlogn", avg: "nlogn", worst: "nlogn", space: "const",
    desc: "Builds a max-heap, then repeatedly extracts the largest element." },
  { name: "Counting Sort", category: "Sorting", best: "lin", avg: "lin", worst: "lin", space: "lin",
    desc: "Counts occurrences of each value; fast, but needs a bounded integer key range." },
  { name: "Radix Sort", category: "Sorting", best: "lin", avg: "lin", worst: "lin", space: "lin",
    desc: "Sorts integers digit by digit using a stable sub-sort at each pass." },
  { name: "Linear Search", category: "Searching", best: "const", avg: "lin", worst: "lin", space: "const",
    desc: "Checks each element in order until the target is found." },
  { name: "Binary Search", category: "Searching", best: "const", avg: "log", worst: "log", space: "const",
    desc: "Halves the search range each step; requires a sorted array." },
  { name: "Jump Search", category: "Searching", best: "const", avg: "sqrt", worst: "sqrt", space: "const",
    desc: "Skips ahead in fixed-size blocks, then scans linearly within a block." },
  { name: "BST Search / Insert", category: "Trees & Graphs", best: "const", avg: "log", worst: "lin", space: "const",
    desc: "Worst case degrades to linear on an unbalanced tree (e.g. sorted insertions)." },
  { name: "AVL / Red-Black Tree Ops", category: "Trees & Graphs", best: "const", avg: "log", worst: "log", space: "lin",
    desc: "Self-balancing trees guarantee logarithmic height at all times." },
  { name: "BFS Traversal", category: "Trees & Graphs", best: "lin", avg: "lin", worst: "lin", space: "lin",
    desc: "Explores level by level using a queue; O(V+E), shown here as linear in graph size." },
  { name: "DFS Traversal", category: "Trees & Graphs", best: "lin", avg: "lin", worst: "lin", space: "lin",
    desc: "Explores as deep as possible before backtracking, using a stack or recursion." },
  { name: "Dijkstra's Algorithm", category: "Trees & Graphs", best: "nlogn", avg: "nlogn", worst: "nlogn", space: "lin",
    desc: "Shortest path with a binary heap: O((V+E) log V), shown here as linearithmic." },
  { name: "Fibonacci (naive recursion)", category: "Recursive / DP", best: "exp", avg: "exp", worst: "exp", space: "lin",
    desc: "Recomputes overlapping subproblems; call-stack depth grows linearly with n." },
  { name: "Fibonacci (memoized)", category: "Recursive / DP", best: "lin", avg: "lin", worst: "lin", space: "lin",
    desc: "Caching each result once turns exponential blowup into a single linear pass." },
  { name: "Subset Generation", category: "Recursive / DP", best: "exp", avg: "exp", worst: "exp", space: "lin",
    desc: "Every element is either included or excluded, giving 2ⁿ possible subsets." },
  { name: "Permutations", category: "Recursive / DP", best: "fact", avg: "fact", worst: "fact", space: "lin",
    desc: "There are n! orderings of n distinct elements to enumerate." },
  { name: "Traveling Salesman (brute force)", category: "Recursive / DP", best: "fact", avg: "fact", worst: "fact", space: "lin",
    desc: "Checks every possible route ordering to guarantee the optimal tour." },
  { name: "Hash Table Lookup", category: "Hashing", best: "const", avg: "const", worst: "lin", space: "lin",
    desc: "Average O(1) via direct addressing; worst case hits when many keys collide." },
];
const CATEGORIES = ["All", "Sorting", "Searching", "Trees & Graphs", "Recursive / DP", "Hashing"];
const CATEGORY_COLORS = { "Sorting": CM.accent, "Searching": CM.purple, "Trees & Graphs": CM.teal, "Recursive / DP": CM.red, "Hashing": CM.blue };

// ─── Ladder: shows where a value sits among the 8 growth classes ─────────────
function Ladder({ rows }) {
  const n = CLASS_ORDER.length;
  const pct = i => (i / (n - 1)) * 100;
  return (
    <div style={{ background: CM.bg, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 18px 18px" }}>
      {/* class header */}
      <div style={{ display: "flex", marginLeft: 108, marginBottom: 10, position: "relative", height: 16 }}>
        {CLASS_ORDER.map((c, i) => (
          <span key={c.key} style={{
            position: "absolute", left: `${pct(i)}%`, transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: CM.dim,
            whiteSpace: "nowrap",
          }}>{c.label}</span>
        ))}
      </div>
      {/* rows */}
      {rows.map(r => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", height: 30 }}>
          <span style={{
            width: 100, flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
            fontWeight: 700, color: r.color,
          }}>{r.label}</span>
          <div style={{ position: "relative", flex: 1, height: 2, background: CM.border2, borderRadius: 1, marginRight: 8 }}>
            {CLASS_ORDER.map((c, i) => (
              <div key={c.key} style={{
                position: "absolute", left: `${pct(i)}%`, top: -3, width: 2, height: 8,
                background: CM.border2, transform: "translateX(-50%)",
              }} />
            ))}
            <div style={{
              position: "absolute", left: `${pct(CLASS_ORDER.findIndex(c => c.key === r.classKey))}%`,
              top: -6, width: 14, height: 14, borderRadius: "50%", transform: "translateX(-50%)",
              background: r.color, border: `2px solid ${CM.bg}`, boxShadow: `0 0 8px ${r.color}bb`,
            }} />
          </div>
          <span style={{ width: 78, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: r.color }}>
            {CLASS_BY_KEY[r.classKey].label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 1 — Growth Curves
// ══════════════════════════════════════════════════════════════════════════
function GrowthCurvesTab() {
  const [n, setN] = useState(24);
  const [active, setActive] = useState(() => new Set(CLASS_ORDER.map(c => c.key)));
  const [logScale, setLogScale] = useState(true);

  const toggle = key => setActive(prev => {
    const next = new Set(prev);
    if (next.has(key)) { if (next.size > 1) next.delete(key); } else next.add(key);
    return next;
  });

  const activeClasses = CLASS_ORDER.filter(c => active.has(c.key));
  const W = 700, H = 400, ML = 56, MR = 16, MT = 14, MB = 32;
  const PW = W - ML - MR, PH = H - MT - MB;

  const { paths, ticks } = useMemo(() => {
    const nums = Array.from({ length: n }, (_, i) => i + 1);
    let maxV = 1;
    const series = activeClasses.map(c => {
      const pts = nums.map(v => ({ n: v, val: c.fn(v) }));
      maxV = Math.max(maxV, pts[pts.length - 1].val);
      return { cls: c, pts };
    });
    const yOf = val => logScale
      ? MT + PH - (Math.log10(val + 1) / (Math.log10(maxV + 1) || 1)) * PH
      : MT + PH - (val / maxV) * PH;
    const xOf = v => ML + ((v - 1) / Math.max(1, n - 1)) * PW;
    const paths = series.map(s => ({
      cls: s.cls,
      d: s.pts.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.n).toFixed(1)},${yOf(p.val).toFixed(1)}`).join(" "),
      end: { x: xOf(s.pts[s.pts.length - 1].n), y: yOf(s.pts[s.pts.length - 1].val) },
    }));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => {
      const y = MT + PH - f * PH;
      const label = logScale
        ? formatNum(Math.max(0, Math.pow(10, f * (Math.log10(maxV + 1) || 1)) - 1))
        : formatNum(f * maxV);
      return { y, label };
    });
    return { paths, ticks };
  }, [n, activeClasses, logScale]);

  const xTicks = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const v = Math.max(1, Math.round(1 + (i / 4) * (n - 1)));
    return { v, x: ML + ((v - 1) / Math.max(1, n - 1)) * PW };
  }), [n]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      {/* sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, marginBottom: 8 }}>INPUT SIZE — n = {n}</div>
          <input type="range" min={2} max={60} value={n} onChange={e => setN(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ display: "flex", background: CM.bg, borderRadius: 8, overflow: "hidden", border: `1px solid ${CM.border}`, marginTop: 12 }}>
            {["Log", "Linear"].map(m => (
              <button key={m} onClick={() => setLogScale(m === "Log")} style={{
                flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                background: (logScale ? "Log" : "Linear") === m ? CM.accent : "transparent",
                color: (logScale ? "Log" : "Linear") === m ? "#0d1117" : CM.muted,
                fontFamily: "'JetBrains Mono',monospace",
              }}>{m} Scale</button>
            ))}
          </div>
        </div>

        <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "9px 14px", borderBottom: `1px solid ${CM.border}`, background: CM.bg, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1 }}>
            COMPLEXITY CLASSES
          </div>
          {CLASS_ORDER.map(c => {
            const on = active.has(c.key);
            return (
              <button key={c.key} onClick={() => toggle(c.key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                background: "transparent", border: "none", borderBottom: `1px solid ${CM.border}`,
                cursor: "pointer", opacity: on ? 1 : 0.4, transition: "opacity 0.15s",
              }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, flexShrink: 0, boxShadow: on ? `0 0 6px ${c.color}` : "none" }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: on ? c.color : CM.muted, textAlign: "left" }}>{c.label}</span>
                <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: CM.dim }}>{formatNum(c.fn(n))}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* chart */}
      <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "18px 16px 10px" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={ML} y1={t.y} x2={W - MR} y2={t.y} stroke={CM.border} strokeWidth={1} strokeDasharray={i === ticks.length - 1 ? "0" : "3,4"} />
              <text x={ML - 8} y={t.y + 3} textAnchor="end" fontSize={10} fill={CM.dim} fontFamily="'JetBrains Mono',monospace">{t.label}</text>
            </g>
          ))}
          <line x1={ML} y1={MT + PH} x2={W - MR} y2={MT + PH} stroke={CM.border2} strokeWidth={1.5} />
          {xTicks.map((t, i) => (
            <g key={i}>
              <line x1={t.x} y1={MT + PH} x2={t.x} y2={MT + PH + 5} stroke={CM.border2} strokeWidth={1} />
              <text x={t.x} y={MT + PH + 18} textAnchor="middle" fontSize={10} fill={CM.dim} fontFamily="'JetBrains Mono',monospace">{t.v}</text>
            </g>
          ))}
          <text x={ML + PW / 2} y={H - 2} textAnchor="middle" fontSize={10} fill={CM.dim} fontFamily="'JetBrains Mono',monospace" letterSpacing={1}>INPUT SIZE (n)</text>
          {paths.map(p => (
            <g key={p.cls.key}>
              <path d={p.d} fill="none" stroke={p.cls.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 3px ${p.cls.color}66)` }} />
              <circle cx={p.end.x} cy={p.end.y} r={4.5} fill={p.cls.color} stroke={CM.bg} strokeWidth={1.5} />
            </g>
          ))}
          {paths.length === 0 && (
            <text x={ML + PW / 2} y={MT + PH / 2} textAnchor="middle" fontSize={13} fill={CM.dim} fontFamily="'JetBrains Mono',monospace">
              Select at least one class from the sidebar
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 2 — Algorithm Explorer (time best/avg/worst + space, per algorithm)
// ══════════════════════════════════════════════════════════════════════════
function AlgorithmExplorerTab() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(ALGORITHMS[3]); // Merge Sort default

  const filtered = ALGORITHMS.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
  const grouped = CATEGORIES.slice(1).map(cat => ({ cat, items: filtered.filter(a => a.category === cat) })).filter(g => g.items.length);

  const rows = [
    { label: "Best Case", classKey: selected.best, color: CM.green },
    { label: "Average Case", classKey: selected.avg, color: CM.blue },
    { label: "Worst Case", classKey: selected.worst, color: CM.red },
    { label: "Space", classKey: selected.space, color: CM.purple },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      {/* list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CMInput value={query} onChange={setQuery} placeholder="Search algorithms…" width="100%" />
        <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, maxHeight: 560, overflowY: "auto" }}>
          {grouped.map(g => (
            <div key={g.cat}>
              <div style={{ padding: "8px 14px", background: CM.bg, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CATEGORY_COLORS[g.cat], letterSpacing: 1, fontWeight: 700 }}>{g.cat.toUpperCase()}</div>
              {g.items.map(a => (
                <button key={a.name} onClick={() => setSelected(a)} style={{
                  width: "100%", textAlign: "left", padding: "9px 14px", border: "none", cursor: "pointer",
                  background: selected.name === a.name ? CM.accentDim : "transparent",
                  borderLeft: `2px solid ${selected.name === a.name ? CM.accent : "transparent"}`,
                  borderBottom: `1px solid ${CM.border}`,
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                  color: selected.name === a.name ? CM.accent : CM.text,
                }}>{a.name}</button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 16, color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>No matches</div>}
        </div>
      </div>

      {/* detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{selected.name}</span>
            <Badge label={selected.category} color={CATEGORY_COLORS[selected.category]} />
          </div>
          <p style={{ fontSize: 12.5, color: CM.muted, lineHeight: 1.6, marginBottom: 14 }}>{selected.desc}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge label={`Best ${CLASS_BY_KEY[selected.best].label}`} color={CM.green} />
            <Badge label={`Avg ${CLASS_BY_KEY[selected.avg].label}`} color={CM.blue} />
            <Badge label={`Worst ${CLASS_BY_KEY[selected.worst].label}`} color={CM.red} />
            <Badge label={`Space ${CLASS_BY_KEY[selected.space].label}`} color={CM.purple} />
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, marginBottom: 8 }}>
            WHERE IT FALLS ON THE GROWTH SCALE
          </div>
          <Ladder rows={rows} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 3 — Reference Table
// ══════════════════════════════════════════════════════════════════════════
function ReferenceTableTab() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const rows = ALGORITHMS.filter(a =>
    (category === "All" || a.category === category) &&
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <CMInput value={query} onChange={setQuery} placeholder="Filter by name…" width={220} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)} color={c === "All" ? CM.accent : CATEGORY_COLORS[c]}>{c}</Chip>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.dim }}>{rows.length} algorithms</span>
      </div>

      <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 0.9fr 0.9fr",
          padding: "10px 16px", background: CM.bg, borderBottom: `1px solid ${CM.border}`,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1,
        }}>
          <span>ALGORITHM</span><span>CATEGORY</span><span>BEST</span><span>AVERAGE</span><span>WORST</span><span>SPACE</span>
        </div>
        {rows.map(a => (
          <div key={a.name} style={{
            display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 0.9fr 0.9fr",
            padding: "11px 16px", borderBottom: `1px solid ${CM.border}`, alignItems: "center",
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</span>
            <span><Badge label={a.category} color={CATEGORY_COLORS[a.category]} /></span>
            <span><Badge label={CLASS_BY_KEY[a.best].label} color={CM.green} /></span>
            <span><Badge label={CLASS_BY_KEY[a.avg].label} color={CM.blue} /></span>
            <span><Badge label={CLASS_BY_KEY[a.worst].label} color={CM.red} /></span>
            <span><Badge label={CLASS_BY_KEY[a.space].label} color={CM.purple} /></span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: 24, textAlign: "center", color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>No algorithms match your filters</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
const TABS = ["Growth Curves", "Algorithm Explorer", "Reference Table"];
const TAB_COLORS = [CM.accent, CM.purple, CM.teal];

export default function ComplexityVisualizer() {
  const [tab, setTab] = useState("Growth Curves");

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
            <NavLink to={"/explore"}>Explore</NavLink> / <span style={{ color: CM.accent }}>Complexity Visualizer</span>
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Badge label="Time + Space" color={CM.green} />
            <Badge label={`${ALGORITHMS.length} Algorithms`} color={CM.accent} />
          </div>
        </div>

        {/* ── TAB STRIP ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: "flex", overflowX: "auto", padding: "0 4px" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "12px 20px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: "transparent", whiteSpace: "nowrap",
              color: tab === t ? TAB_COLORS[i] : CM.muted,
              borderBottom: tab === t ? `2px solid ${TAB_COLORS[i]}` : "2px solid transparent",
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.3, transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 60px" }}>
          <SectionLabel color={TAB_COLORS[TABS.indexOf(tab)]}>
            {tab === "Growth Curves" && "How each complexity class grows"}
            {tab === "Algorithm Explorer" && "Time & space, per algorithm"}
            {tab === "Reference Table" && "Full complexity cheat sheet"}
          </SectionLabel>

          {tab === "Growth Curves" && <GrowthCurvesTab />}
          {tab === "Algorithm Explorer" && <AlgorithmExplorerTab />}
          {tab === "Reference Table" && <ReferenceTableTab />}
        </div>
      </div>
    </>
  );
}