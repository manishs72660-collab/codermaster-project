import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "../component/navbar";
import { cn } from "../utils/cn";

// ─── Dynamic hex colors (used for chart strokes/dots — can't be static
// Tailwind classes since they're computed per data series) ───────────────────
const HEX = {
  emerald: "#34d399",
  teal:    "#2dd4bf",
  sky:     "#38bdf8",
  blue:    "#60a5fa",
  violet:  "#a78bfa",
  orange:  "#fb923c",
  rose:    "#fb7185",
  pink:    "#f472b6",
};

// Static Tailwind tone classes — kept literal so the JIT compiler picks them up.
const TONE = {
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  sky:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  emerald:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rose:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  teal:   "bg-teal-500/10 text-teal-400 border-teal-500/20",
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pink:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
  dim:    "bg-white/[0.05] text-white/40 border-white/10",
};

// ─── Reusable UI (matches DSAVisualizer's Tailwind card/badge system) ────────
function SectionLabel({ children, tone = "orange" }) {
  const dot = { orange: "bg-orange-400", violet: "bg-violet-400", emerald: "bg-emerald-400", rose: "bg-rose-400", teal: "bg-teal-400", sky: "bg-sky-400" }[tone];
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      <h2 className="font-display text-xl font-semibold text-white">{children}</h2>
    </div>
  );
}

function Card({ children, className }) {
  return <div className={cn("rounded-xl border border-white/[0.08] bg-white/[0.02]", className)}>{children}</div>;
}

function CardHead({ children, right }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
      <span className="text-[10.5px] font-data uppercase tracking-wide text-white/30">{children}</span>
      {right && <span className="ml-auto text-[11.5px] font-data text-orange-400/80">{right}</span>}
    </div>
  );
}

function Badge({ label, tone = "sky" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-data font-medium", TONE[tone])}>
      {label}
    </span>
  );
}

function Inp({ value, onChange, placeholder, width = 160 }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-[12.5px] text-white/85 outline-none placeholder:text-white/25 focus:border-orange-500/40 transition-colors"
    />
  );
}

// ─── Complexity classes, in strict growth order ───────────────────────────────
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

const CLASS_ORDER = [
  { key: "const", label: "O(1)",       name: "Constant",     tone: "emerald", fn: () => 1 },
  { key: "log",   label: "O(log n)",   name: "Logarithmic",  tone: "teal",    fn: n => Math.max(0, Math.log2(n)) },
  { key: "sqrt",  label: "O(√n)",      name: "Square Root",  tone: "sky",     fn: n => Math.sqrt(n) },
  { key: "lin",   label: "O(n)",       name: "Linear",       tone: "blue",    fn: n => n },
  { key: "nlogn", label: "O(n log n)", name: "Linearithmic", tone: "violet",  fn: n => n * Math.max(1, Math.log2(n)) },
  { key: "quad",  label: "O(n²)",      name: "Quadratic",    tone: "orange",  fn: n => n * n },
  { key: "exp",   label: "O(2ⁿ)",      name: "Exponential",  tone: "rose",    fn: n => Math.pow(2, n) },
  { key: "fact",  label: "O(n!)",      name: "Factorial",    tone: "pink",    fn: n => factorial(n) },
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
const CATEGORY_TONE = { "Sorting": "orange", "Searching": "violet", "Trees & Graphs": "teal", "Recursive / DP": "rose", "Hashing": "sky" };

// ─── Ladder: shows where a value sits among the 8 growth classes ─────────────
function Ladder({ rows }) {
  const n = CLASS_ORDER.length;
  const pct = i => (i / (n - 1)) * 100;
  return (
    <Card className="px-5 pt-4 pb-5">
      <div className="relative h-4 mb-2.5" style={{ marginLeft: 108 }}>
        {CLASS_ORDER.map((c, i) => (
          <span key={c.key}
            className="absolute font-data text-[10px] font-semibold text-white/30 whitespace-nowrap"
            style={{ left: `${pct(i)}%`, transform: "translateX(-50%)" }}>
            {c.label}
          </span>
        ))}
      </div>
      {rows.map(r => (
        <div key={r.label} className="flex items-center h-[30px]">
          <span className="w-[100px] shrink-0 font-data text-[11px] font-semibold" style={{ color: HEX[r.tone] }}>
            {r.label}
          </span>
          <div className="relative flex-1 h-[2px] bg-white/10 rounded-full mr-2">
            {CLASS_ORDER.map((c, i) => (
              <div key={c.key} className="absolute w-[2px] h-2 bg-white/10" style={{ left: `${pct(i)}%`, top: -3, transform: "translateX(-50%)" }} />
            ))}
            <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#0B0B0C]" style={{
              left: `${pct(CLASS_ORDER.findIndex(c => c.key === r.classKey))}%`, top: -6, transform: "translateX(-50%)",
              background: HEX[r.tone], boxShadow: `0 0 8px ${HEX[r.tone]}bb`,
            }} />
          </div>
          <span className="w-[78px] text-right font-data text-[11px] font-semibold" style={{ color: HEX[r.tone] }}>
            {CLASS_BY_KEY[r.classKey].label}
          </span>
        </div>
      ))}
    </Card>
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
  const W = 700, H = 380, ML = 56, MR = 16, MT = 14, MB = 32;
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
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      {/* sidebar */}
      <div className="flex flex-col gap-3">
        <Card className="p-4">
          <div className="font-data text-[10px] text-white/30 tracking-wide mb-2">INPUT SIZE — n = {n}</div>
          <input type="range" min={2} max={60} value={n} onChange={e => setN(+e.target.value)} className="w-full accent-orange-500" />
          <div className="flex rounded-md border border-white/[0.08] bg-white/[0.03] overflow-hidden mt-3">
            {["Log", "Linear"].map(m => (
              <button key={m} onClick={() => setLogScale(m === "Log")}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-data font-medium transition-colors",
                  (logScale ? "Log" : "Linear") === m ? "bg-orange-500/15 text-orange-400" : "text-white/40 hover:text-white/70"
                )}>
                {m} Scale
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHead>Complexity Classes</CardHead>
          {CLASS_ORDER.map(c => {
            const on = active.has(c.key);
            return (
              <button key={c.key} onClick={() => toggle(c.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.05] last:border-0 transition-opacity",
                  on ? "opacity-100" : "opacity-40"
                )}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: HEX[c.tone], boxShadow: on ? `0 0 6px ${HEX[c.tone]}` : "none" }} />
                <span className="font-data text-[12px] font-semibold text-left" style={{ color: on ? HEX[c.tone] : "rgba(255,255,255,0.4)" }}>{c.label}</span>
                <span className="ml-auto font-data text-[10.5px] text-white/30">{formatNum(c.fn(n))}</span>
              </button>
            );
          })}
        </Card>
      </div>

      {/* chart */}
      <Card className="px-4 pt-4 pb-2.5">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={ML} y1={t.y} x2={W - MR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray={i === ticks.length - 1 ? "0" : "3,4"} />
              <text x={ML - 8} y={t.y + 3} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="'IBM Plex Mono',monospace">{t.label}</text>
            </g>
          ))}
          <line x1={ML} y1={MT + PH} x2={W - MR} y2={MT + PH} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          {xTicks.map((t, i) => (
            <g key={i}>
              <line x1={t.x} y1={MT + PH} x2={t.x} y2={MT + PH + 5} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
              <text x={t.x} y={MT + PH + 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="'IBM Plex Mono',monospace">{t.v}</text>
            </g>
          ))}
          <text x={ML + PW / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontFamily="'IBM Plex Mono',monospace" letterSpacing={1}>INPUT SIZE (n)</text>
          {paths.map(p => (
            <g key={p.cls.key}>
              <path d={p.d} fill="none" stroke={HEX[p.cls.tone]} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 3px ${HEX[p.cls.tone]}66)` }} />
              <circle cx={p.end.x} cy={p.end.y} r={4.5} fill={HEX[p.cls.tone]} stroke="#0B0B0C" strokeWidth={1.5} />
            </g>
          ))}
          {paths.length === 0 && (
            <text x={ML + PW / 2} y={MT + PH / 2} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.3)" fontFamily="'IBM Plex Mono',monospace">
              Select at least one class from the sidebar
            </text>
          )}
        </svg>
      </Card>
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
    { label: "Best Case", classKey: selected.best, tone: "emerald" },
    { label: "Average Case", classKey: selected.avg, tone: "sky" },
    { label: "Worst Case", classKey: selected.worst, tone: "rose" },
    { label: "Space", classKey: selected.space, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      {/* list */}
      <div className="flex flex-col gap-3">
        <Inp value={query} onChange={setQuery} placeholder="Search algorithms…" width="100%" />
        <Card className="max-h-[560px] overflow-y-auto">
          {grouped.map(g => (
            <div key={g.cat}>
              <div className="px-4 py-2 bg-white/[0.03] font-data text-[10px] font-semibold tracking-wide" style={{ color: HEX[CATEGORY_TONE[g.cat]] }}>
                {g.cat.toUpperCase()}
              </div>
              {g.items.map(a => (
                <button key={a.name} onClick={() => setSelected(a)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 border-b border-white/[0.05] last:border-0 font-data text-[12px] transition-colors",
                    selected.name === a.name ? "bg-orange-500/[0.08] border-l-2 border-l-orange-400 text-orange-400" : "text-white/70 hover:bg-white/[0.03]"
                  )}>
                  {a.name}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="px-4 py-4 text-white/25 font-data text-[12px]">No matches</div>}
        </Card>
      </div>

      {/* detail */}
      <div className="flex flex-col gap-3.5">
        <Card className="px-5 py-4">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="font-display text-lg font-semibold text-white">{selected.name}</span>
            <Badge label={selected.category} tone={CATEGORY_TONE[selected.category]} />
          </div>
          <p className="text-[12.5px] leading-relaxed text-white/50 mb-3.5 max-w-[70ch]">{selected.desc}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge label={`Best ${CLASS_BY_KEY[selected.best].label}`} tone="emerald" />
            <Badge label={`Avg ${CLASS_BY_KEY[selected.avg].label}`} tone="sky" />
            <Badge label={`Worst ${CLASS_BY_KEY[selected.worst].label}`} tone="rose" />
            <Badge label={`Space ${CLASS_BY_KEY[selected.space].label}`} tone="violet" />
          </div>
        </Card>

        <div>
          <div className="font-data text-[10px] text-white/30 tracking-wide mb-2">WHERE IT FALLS ON THE GROWTH SCALE</div>
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
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2.5 flex-wrap items-center">
        <Inp value={query} onChange={setQuery} placeholder="Filter by name…" width={220} />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => {
            const on = category === c;
            const tone = c === "All" ? "orange" : CATEGORY_TONE[c];
            return (
              <button key={c} onClick={() => setCategory(c)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[11.5px] font-data font-semibold border transition-colors",
                  on ? TONE[tone] : "text-white/40 border-white/[0.08] hover:text-white/70 hover:bg-white/[0.04]"
                )}>
                {c}
              </button>
            );
          })}
        </div>
        <span className="ml-auto font-data text-[11px] text-white/30">{rows.length} algorithms</span>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr] px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] font-data text-[10px] text-white/30 tracking-wide">
          <span>ALGORITHM</span><span>CATEGORY</span><span>BEST</span><span>AVERAGE</span><span>WORST</span><span>SPACE</span>
        </div>
        {rows.map(a => (
          <div key={a.name} className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr] px-4 py-2.5 border-b border-white/[0.05] last:border-0 items-center">
            <span className="text-[12.5px] font-medium text-white/85">{a.name}</span>
            <span><Badge label={a.category} tone={CATEGORY_TONE[a.category]} /></span>
            <span><Badge label={CLASS_BY_KEY[a.best].label} tone="emerald" /></span>
            <span><Badge label={CLASS_BY_KEY[a.avg].label} tone="sky" /></span>
            <span><Badge label={CLASS_BY_KEY[a.worst].label} tone="rose" /></span>
            <span><Badge label={CLASS_BY_KEY[a.space].label} tone="violet" /></span>
          </div>
        ))}
        {rows.length === 0 && <div className="px-6 py-6 text-center text-white/25 font-data text-[12px]">No algorithms match your filters</div>}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
const TABS = [
  { name: "Growth Curves", tone: "orange" },
  { name: "Algorithm Explorer", tone: "violet" },
  { name: "Reference Table", tone: "teal" },
];
const TAB_ACTIVE = {
  orange: "bg-orange-500/15 text-orange-400",
  violet: "bg-violet-500/15 text-violet-400",
  teal:   "bg-teal-500/15 text-teal-400",
};

export default function ComplexityVisualizer() {
  const [tab, setTab] = useState("Growth Curves");
  const activeTab = TABS.find(t => t.name === tab);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Work Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }
        .subtle-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar />

        {/* ── breadcrumb ── */}
        <div className="border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <span className="text-[12px] font-data text-white/30">
              <NavLink to="/explore" className="hover:text-white/60 transition-colors">Explore</NavLink>
              {" / "}
              <span className="text-orange-400">Complexity Visualizer</span>
            </span>
          </div>
        </div>

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="font-display font-semibold text-[2.25rem] sm:text-4xl leading-[1.1] text-white mb-3">
                See how the growth adds up.
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                Compare how time and space complexity scale, algorithm by algorithm.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* ── tabs ── */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {TABS.map(t => (
              <button key={t.name} onClick={() => setTab(t.name)}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors",
                  tab === t.name ? TAB_ACTIVE[t.tone] : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}>
                {t.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <SectionLabel tone={activeTab.tone}>
                {tab === "Growth Curves" && "How each complexity class grows"}
                {tab === "Algorithm Explorer" && "Time & space, per algorithm"}
                {tab === "Reference Table" && "Full complexity cheat sheet"}
              </SectionLabel>

              {tab === "Growth Curves" && <GrowthCurvesTab />}
              {tab === "Algorithm Explorer" && <AlgorithmExplorerTab />}
              {tab === "Reference Table" && <ReferenceTableTab />}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}