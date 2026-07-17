import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";

/* ────────────────────────────────────────────────────────────────
   COMPLEXITY CLASSES
   One source of truth: how each class grows (fn), its color
   (green = fast → dark red = slow), and a one-line explanation.
   Time and space both reuse this same list — a class is a class,
   whether it's counting operations or bytes.
──────────────────────────────────────────────────────────────── */

const CLASSES = [
  { label: "O(1)",       fn: () => 1,                        color: "#00e676", desc: "Constant. Doesn't grow with input — same cost for 10 items or 10 million." },
  { label: "O(log n)",   fn: (n) => Math.log2(n + 1),        color: "#69f0ae", desc: "Logarithmic. Cuts the problem in half each step." },
  { label: "O(√n)",      fn: (n) => Math.sqrt(n),             color: "#b2ff59", desc: "Square root. Slower than log n, still far below linear." },
  { label: "O(n)",       fn: (n) => n,                        color: "#ff9800", desc: "Linear. Cost grows in direct proportion to input size." },
  { label: "O(n log n)", fn: (n) => n * Math.log2(n + 1),    color: "#ff6d00", desc: "Linearithmic. One log n pass, repeated n times — typical of good sorts." },
  { label: "O(n²)",      fn: (n) => n * n,                    color: "#ff3d00", desc: "Quadratic. A loop inside a loop — every pair gets compared." },
  { label: "O(n³)",      fn: (n) => n * n * n,                color: "#b71c1c", desc: "Cubic. Three nested loops — gets slow fast." },
  { label: "O(2ⁿ)",      fn: (n) => Math.min(2 ** n, 1e9),    color: "#880000", desc: "Exponential. Every extra item doubles the work." },
];

const colorOf = (label) => CLASSES.find((c) => c.label === label)?.color ?? "#888";

/* ────────────────────────────────────────────────────────────────
   ALGORITHMS
   Each one points at a time class and a space class from CLASSES.
──────────────────────────────────────────────────────────────── */

const ALGORITHMS = [
  { name: "Array access",      time: "O(1)",       space: "O(1)", code: "arr[i]",                                   note: "Jump straight to the index — no searching needed." },
  { name: "Hash map lookup",   time: "O(1)",       space: "O(n)", code: "map.get(key)",                             note: "Average case. The map itself costs O(n) space to store n entries." },
  { name: "Binary search",     time: "O(log n)",   space: "O(1)", code: "while (lo <= hi) {\n  mid = (lo+hi) >> 1\n}", note: "Halves the search range each step; needs no extra memory." },
  { name: "Linear search",     time: "O(n)",       space: "O(1)", code: "for (x of arr)\n  if (x === target) ...",   note: "Checks every element in the worst case." },
  { name: "Merge sort",        time: "O(n log n)", space: "O(n)", code: "split → sort halves → merge",               note: "Fast and predictable, but needs a full extra array to merge into." },
  { name: "Quick sort",        time: "O(n log n)", space: "O(log n)", code: "partition around pivot,\nrecurse both sides", note: "In-place partitioning — only the recursion stack costs space." },
  { name: "Bubble sort",       time: "O(n²)",      space: "O(1)", code: "for i in arr:\n  for j in arr:\n    compare & swap", note: "Simple, in-place, but compares every pair." },
  { name: "Insertion sort",    time: "O(n²)",      space: "O(1)", code: "for i in arr:\n  shift into place",         note: "Builds the sorted section one element at a time." },
  { name: "Matrix multiply",   time: "O(n³)",      space: "O(n²)", code: "for i, j, k:\n  C[i][j] += A[i][k]*B[k][j]", note: "Three nested loops over an n×n matrix." },
  { name: "Fibonacci (naive)", time: "O(2ⁿ)",      space: "O(n)", code: "fib(n) = fib(n-1) + fib(n-2)",              note: "Recomputes the same subproblems endlessly — the call stack is the space cost." },
];

/* ────────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────────── */

function formatOps(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toLocaleString();
}

function buildChartData(maxN) {
  const rows = [];
  for (let n = 1; n <= maxN; n++) {
    const row = { n };
    CLASSES.forEach((c) => { row[c.label] = c.fn(n); });
    rows.push(row);
  }
  return rows;
}

const MAX_N = 30;
const CHART_DATA = buildChartData(MAX_N);

/* ────────────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────────────── */

export default function ComplexityVisualizer() {
  const [selected, setSelected] = useState(ALGORITHMS[0]);
  const [n, setN] = useState(12);

  // A slow, looping "n" used only to animate the type-explainer cards.
  const [demoN, setDemoN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setDemoN((prev) => (prev >= MAX_N ? 1 : prev + 1));
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Time &amp; Space Complexity Visualizer</h1>
        <p style={styles.subtitle}>How algorithms scale — in operations and in memory.</p>
      </header>

      {/* ── 1. What each class means, animated ─────────────────── */}
      <Section title="The complexity classes">
        <div style={styles.typeGrid}>
          {CLASSES.map((c) => (
            <TypeCard key={c.label} cls={c} n={demoN} />
          ))}
        </div>
      </Section>

      {/* ── 2. Algorithm picker ─────────────────────────────────── */}
      <Section title="Pick an algorithm">
        <div style={styles.algoRow}>
          {ALGORITHMS.map((a) => (
            <button
              key={a.name}
              onClick={() => setSelected(a)}
              style={{
                ...styles.algoChip,
                ...(selected.name === a.name ? styles.algoChipActive : {}),
              }}
            >
              <span style={styles.algoChipName}>{a.name}</span>
              <span style={styles.algoChipBadges}>
                <Badge label={`T: ${a.time}`} color={colorOf(a.time)} />
                <Badge label={`S: ${a.space}`} color={colorOf(a.space)} />
              </span>
            </button>
          ))}
        </div>

        <div style={styles.detailCard}>
          <div style={styles.detailHead}>
            <span style={styles.detailName}>{selected.name}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Badge label={`Time ${selected.time}`} color={colorOf(selected.time)} />
              <Badge label={`Space ${selected.space}`} color={colorOf(selected.space)} />
            </div>
          </div>
          <p style={styles.detailNote}>{selected.note}</p>
          <pre style={styles.code}>{selected.code}</pre>
        </div>
      </Section>

      {/* ── 3. Time complexity chart ────────────────────────────── */}
      <Section title="Time complexity — operations vs. n">
        <GrowthChart n={n} setN={setN} highlight={selected.time} />
      </Section>

      {/* ── 4. Space complexity chart ───────────────────────────── */}
      <Section title="Space complexity — memory vs. n">
        <GrowthChart n={n} setN={setN} highlight={selected.space} />
      </Section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SUBCOMPONENTS
──────────────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ ...styles.badge, color, borderColor: color }}>{label}</span>
  );
}

// One explainer card: label, description, and a bar that animates
// as `n` loops, so the relative growth rate is felt, not just read.
function TypeCard({ cls, n }) {
  const value = cls.fn(n);
  const maxValue = cls.fn(MAX_N);
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <div style={{ ...styles.typeCard, borderColor: cls.color + "40" }}>
      <div style={{ ...styles.typeLabel, color: cls.color }}>{cls.label}</div>
      <p style={styles.typeDesc}>{cls.desc}</p>
      <div style={styles.typeBarTrack}>
        <div style={{ ...styles.typeBarFill, width: `${pct}%`, background: cls.color }} />
      </div>
      <div style={styles.typeReadout}>
        <span>n = {n}</span>
        <span style={{ color: cls.color }}>{formatOps(value)} ops</span>
      </div>
    </div>
  );
}

// Shared line chart used for both time and space — same shape,
// different meaning depending on which complexity is highlighted.
function GrowthChart({ n, setN, highlight }) {
  return (
    <div style={styles.card}>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={CHART_DATA} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1e1e1e" vertical={false} />
            <XAxis dataKey="n" stroke="#555" tick={{ fontSize: 11 }} />
            <YAxis stroke="#555" tick={{ fontSize: 11 }} tickFormatter={formatOps} width={44} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#999" }}
              formatter={(value, name) => [formatOps(value), name]}
              labelFormatter={(label) => `n = ${label}`}
            />
            <ReferenceLine x={n} stroke="#555" strokeDasharray="4 4" />
            {CLASSES.map((c) => {
              const isHighlighted = c.label === highlight;
              return (
                <Line
                  key={c.label}
                  type="monotone"
                  dataKey={c.label}
                  stroke={c.color}
                  strokeWidth={isHighlighted ? 3 : 1.25}
                  strokeOpacity={highlight ? (isHighlighted ? 1 : 0.25) : 1}
                  dot={false}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <input
        type="range"
        min={1}
        max={MAX_N}
        value={n}
        onChange={(e) => setN(Number(e.target.value))}
        style={styles.slider}
      />

      <div style={styles.legend}>
        {CLASSES.map((c) => (
          <span key={c.label} style={{ ...styles.legendItem, opacity: highlight && c.label !== highlight ? 0.35 : 1 }}>
            <span style={{ ...styles.legendDot, background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   STYLES — dark background, orange accent, monospace throughout
──────────────────────────────────────────────────────────────── */

const mono = "'Courier New', Courier, monospace";
const ORANGE = "#ff9800";

const styles = {
  page: { minHeight: "100vh", background: "#080808", color: "#ccc", fontFamily: mono, padding: "28px 24px" },

  header: { marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: ORANGE, letterSpacing: "0.01em" },
  subtitle: { color: "#555", fontSize: 13, marginTop: 6 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, color: "#777", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 },

  // type cards
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 },
  typeCard: { background: "#0d0d0d", border: "1px solid", borderRadius: 10, padding: 14 },
  typeLabel: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  typeDesc: { color: "#666", fontSize: 11, lineHeight: 1.5, margin: "0 0 12px" },
  typeBarTrack: { height: 6, background: "#161616", borderRadius: 3, overflow: "hidden" },
  typeBarFill: { height: "100%", borderRadius: 3, transition: "width 0.2s linear" },
  typeReadout: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginTop: 6 },

  // algorithm chips
  algoRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  algoChip: {
    display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start",
    background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8,
    padding: "8px 12px", cursor: "pointer",
  },
  algoChipActive: { borderColor: ORANGE, background: "#ff980010" },
  algoChipName: { fontSize: 12, color: "#ddd" },
  algoChipBadges: { display: "flex", gap: 5 },

  badge: { fontSize: 10, fontWeight: 700, border: "1px solid", borderRadius: 4, padding: "1px 6px" },

  detailCard: { background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10, padding: 16 },
  detailHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 },
  detailName: { fontSize: 14, color: "#fff", fontWeight: 700 },
  detailNote: { color: "#777", fontSize: 12, lineHeight: 1.6, margin: "0 0 12px" },
  code: {
    background: "#080808", border: "1px solid #1a1a1a", borderRadius: 8,
    padding: "12px 14px", fontSize: 12, color: "#999", lineHeight: 1.6,
    whiteSpace: "pre-wrap", margin: 0, overflowX: "auto",
  },

  // charts
  card: { background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 12, padding: 18 },
  slider: { width: "100%", marginTop: 12, accentColor: ORANGE, cursor: "pointer" },
  legend: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#999" },
  legendDot: { width: 7, height: 7, borderRadius: "50%" },
};