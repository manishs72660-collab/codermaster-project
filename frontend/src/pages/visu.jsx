import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "../component/navbar";
import { cn } from "../utils/cn";

// ─── Utilities ────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Dynamic state colors (used for bars / nodes / svg — inline, since they
// change every animation frame and can't be static Tailwind classes) ─────────
const ALG = {
  default:   "rgba(255,255,255,0.08)",
  active:    "#fb923c", // orange-400
  comparing: "#38bdf8", // sky-400
  sorted:    "#34d399", // emerald-400
  pivot:     "#fb7185", // rose-400
  found:     "#a78bfa", // violet-400
  visited:   "#2dd4bf", // teal-400
  path:      "#fb923c",
};

// Static Tailwind tone classes — kept literal so the JIT compiler picks them up.
const TONE = {
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  sky:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  emerald:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rose:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  teal:   "bg-teal-500/10 text-teal-400 border-teal-500/20",
  dim:    "bg-white/[0.05] text-white/40 border-white/10",
};

const SPEED_LEVELS = [
  { label: "0.5×", delay: 900 },
  { label: "1×",   delay: 500 },
  { label: "2×",   delay: 260 },
  { label: "4×",   delay: 130 },
  { label: "8×",   delay: 55  },
];

// ─── Reusable UI (Tailwind, matches Homepage's card / filter / button system) ─

function SpeedControl({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-data text-white/30">Speed</span>
      <div className="flex rounded-md border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        {SPEED_LEVELS.map((s, i) => (
          <button
            key={s.label}
            disabled={disabled}
            onClick={() => onChange(i)}
            className={cn(
              "px-2.5 py-1.5 text-[12px] font-data font-medium transition-colors",
              value === i ? "bg-orange-500/15 text-orange-400" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Btn({ onClick, disabled, children, variant = "default", className }) {
  const variants = {
    default: "bg-white/[0.04] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/90",
    accent:  "bg-orange-500 text-[#0B0B0C] hover:bg-orange-400 font-semibold",
    green:   "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15",
    red:     "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15",
    blue:    "bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/15",
    purple:  "bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap",
        variants[variant],
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function Sel({ value, onChange, options, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-[12.5px] text-white/80 outline-none cursor-pointer focus:border-orange-500/40 transition-colors"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#141416]">
          {o}
        </option>
      ))}
    </select>
  );
}

function Inp({ value, onChange, placeholder, width = 90, onEnter }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
      style={{ width }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-[12.5px] text-white/85 outline-none placeholder:text-white/25 focus:border-orange-500/40 transition-colors"
    />
  );
}

function Badge({ label, tone = "sky" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-data font-medium", TONE[tone])}>
      {label}
    </span>
  );
}

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
  return (
    <div className={cn("rounded-xl border border-white/[0.08] bg-white/[0.02]", className)}>
      {children}
    </div>
  );
}

function CardHead({ children, right }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
      <span className="text-[10.5px] font-data uppercase tracking-wide text-white/30">{children}</span>
      {right && <span className="ml-auto text-[11.5px] font-data text-orange-400/80">{right}</span>}
    </div>
  );
}

function AboutCard({ title, description, useCase, badges }) {
  return (
    <Card>
      <CardHead right={title}>About</CardHead>
      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-[13px] leading-relaxed text-white/50 max-w-[70ch]">{description}</p>
        {useCase && (
          <p className="text-[12.5px] leading-relaxed text-white/35">
            <span className="text-teal-400 font-medium">Use it when — </span>
            {useCase}
          </p>
        )}
        {badges?.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {badges.map(([label, tone]) => (
              <Badge key={label} label={label} tone={tone} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Bar({ value, max, color, width = 26 }) {
  const h = Math.max(6, Math.round((value / max) * 200));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-data text-white/25">{value}</span>
      <div
        style={{
          width, height: h, background: color || ALG.default,
          boxShadow: color && color !== ALG.default ? `0 0 10px ${color}55` : "none",
        }}
        className="rounded-t-[3px] transition-[height,background] duration-150"
      />
    </div>
  );
}

function CodeView({ lines, highlight, title }) {
  return (
    <Card className="overflow-hidden">
      <CardHead right={title}>Pseudocode</CardHead>
      <div className="py-2.5 px-1 max-h-[230px] overflow-y-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 items-center px-3 py-0.5 rounded transition-colors",
              highlight === i && "bg-orange-500/[0.08] border-l-2 border-orange-400"
            )}
          >
            <span className="font-data text-[10px] text-white/20 w-4 text-right shrink-0">{i + 1}</span>
            <pre className={cn("font-data text-[12px] leading-[1.7] whitespace-pre", highlight === i ? "text-orange-300" : "text-white/45")}>
              {line}
            </pre>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComplexityCard({ rows, title }) {
  return (
    <Card className="overflow-hidden">
      <CardHead>{title || "Complexity"}</CardHead>
      {rows.map(([op, c, tone]) => (
        <div key={op} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] last:border-0">
          <span className="font-data text-[12px] text-white/45">{op}</span>
          <Badge label={c} tone={tone || "sky"} />
        </div>
      ))}
    </Card>
  );
}

function Legend({ items }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {items.map(([label, color]) => (
        <div key={label} className="flex items-center gap-2 text-[11px] font-data text-white/40">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
          {label}
        </div>
      ))}
    </div>
  );
}

function StatusBanner({ status }) {
  if (!status) return null;
  const ok = status.includes("✓");
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-2.5 text-[13px] font-data font-medium",
        ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400"
      )}
    >
      {status}
    </div>
  );
}

// ─── SORTING ALGORITHMS (logic unchanged) ─────────────────────────────────────
const SORT_ALGOS = {
  "Bubble Sort": {
    code: ["for i in range(n):", "  for j in range(n-i-1):", "    if arr[j] > arr[j+1]:", "      swap(arr[j], arr[j+1])"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n)", stable: true, inPlace: true, adaptive: true },
    description: "Repeatedly steps through the array, comparing each pair of adjacent elements and swapping them if they're in the wrong order. The largest unsorted value 'bubbles' to the end on every pass.",
    useCase: "Teaching the concept of sorting, or sorting tiny/nearly-sorted lists where simplicity matters more than speed.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, cols = Array(n).fill(ALG.default);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          cols[j] = ALG.comparing; cols[j + 1] = ALG.comparing;
          setColors([...cols]); await sleep(speed);
          if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; setArr([...a]); }
          cols[j] = ALG.default; cols[j + 1] = ALG.default;
        }
        cols[n - i - 1] = ALG.sorted;
      }
      setColors([...cols]);
    },
  },
  "Selection Sort": {
    code: ["for i in range(n):", "  min_idx = i", "  for j in range(i+1, n):", "    if arr[j] < arr[min_idx]: min_idx=j", "  swap(arr[i], arr[min_idx])"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n²)", stable: false, inPlace: true, adaptive: false },
    description: "Scans the unsorted portion of the array to find the minimum value, then swaps it into place at the front. Repeats until the whole array is sorted, always doing the same number of comparisons.",
    useCase: "When memory writes are expensive — it performs at most n swaps total, far fewer than bubble or insertion sort.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, cols = Array(n).fill(ALG.default);
      for (let i = 0; i < n - 1; i++) {
        let mi = i; cols[mi] = ALG.active; setColors([...cols]);
        for (let j = i + 1; j < n; j++) {
          cols[j] = ALG.comparing; setColors([...cols]); await sleep(speed);
          if (a[j] < a[mi]) { cols[mi] = ALG.default; mi = j; cols[j] = ALG.active; }
          else cols[j] = ALG.default;
        }
        [a[i], a[mi]] = [a[mi], a[i]]; setArr([...a]);
        cols[mi] = ALG.default; cols[i] = ALG.sorted; setColors([...cols]); await sleep(speed);
      }
      cols[n - 1] = ALG.sorted; setColors([...cols]);
    },
  },
  "Insertion Sort": {
    code: ["for i in range(1, n):", "  key = arr[i]; j = i-1", "  while j>=0 and arr[j]>key:", "    arr[j+1]=arr[j]; j-=1", "  arr[j+1] = key"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n)", stable: true, inPlace: true, adaptive: true },
    description: "Builds the sorted array one element at a time, taking each new value and sliding it left past every element bigger than it — the same way you'd sort playing cards in your hand.",
    useCase: "Small arrays, or data that's already almost sorted — it approaches O(n) speed the closer the input is to sorted.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, cols = Array(n).fill(ALG.default);
      for (let i = 1; i < n; i++) {
        let key = a[i], j = i - 1; cols[i] = ALG.active;
        while (j >= 0 && a[j] > key) {
          cols[j] = ALG.comparing; setColors([...cols]); setArr([...a]); await sleep(speed);
          a[j + 1] = a[j]; cols[j + 1] = ALG.default; j--;
        }
        a[j + 1] = key; setArr([...a]); cols[i] = ALG.default;
        for (let k = 0; k <= j + 1; k++) cols[k] = ALG.sorted;
        setColors([...cols]); await sleep(speed);
      }
      cols.fill(ALG.sorted); setColors([...cols]);
    },
  },
  "Shell Sort": {
    code: ["gap = n // 2", "while gap > 0:", "  for i in range(gap, n):", "    temp = arr[i]; j = i", "    while j>=gap and arr[j-gap]>temp:", "      arr[j]=arr[j-gap]; j-=gap", "    arr[j] = temp", "  gap //= 2"],
    complexity: { time: "O(n log² n)", space: "O(1)", best: "O(n log n)", stable: false, inPlace: true, adaptive: true },
    description: "An extension of insertion sort that first compares elements far apart (a large 'gap'), then shrinks the gap each pass. Moving distant out-of-place elements early makes later passes much cheaper.",
    useCase: "A drop-in upgrade over insertion sort for medium-sized arrays when you want better speed but still want something simple and in-place.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, cols = Array(n).fill(ALG.default);
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        for (let i = gap; i < n; i++) {
          let temp = a[i], j = i;
          cols[i] = ALG.active; setColors([...cols]); await sleep(speed / 2);
          while (j >= gap && a[j - gap] > temp) {
            cols[j] = ALG.comparing; cols[j - gap] = ALG.comparing;
            setColors([...cols]); await sleep(speed);
            a[j] = a[j - gap]; setArr([...a]);
            cols[j] = ALG.default; cols[j - gap] = ALG.default;
            j -= gap;
          }
          a[j] = temp; setArr([...a]); cols[i] = ALG.default;
        }
        gap = Math.floor(gap / 2);
      }
      cols.fill(ALG.sorted); setColors([...cols]);
    },
  },
  "Quick Sort": {
    code: ["def quicksort(arr, lo, hi):", "  if lo < hi:", "    pivot = arr[hi]; i = lo-1", "    for j in range(lo, hi):", "      if arr[j]<=pivot: i++; swap(i,j)", "    swap(i+1, hi)", "    quicksort(lo, i); quicksort(i+2, hi)"],
    complexity: { time: "O(n log n)", space: "O(log n)", best: "O(n log n)", stable: false, inPlace: true, adaptive: false },
    description: "Picks a pivot value (here, the last element), partitions the array so smaller values end up left of it and larger values right of it, then recursively sorts each side.",
    useCase: "General-purpose sorting where average-case speed matters most — it's the default sort in many languages' standard libraries.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], cols = Array(a.length).fill(ALG.default);
      async function qs(lo, hi) {
        if (lo >= hi) { if (lo === hi) cols[lo] = ALG.sorted; setColors([...cols]); return; }
        let pivot = a[hi]; cols[hi] = ALG.pivot; setColors([...cols]);
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          cols[j] = ALG.comparing; setColors([...cols]); await sleep(speed);
          if (a[j] <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; setArr([...a]); }
          cols[j] = ALG.default;
        }
        [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; setArr([...a]);
        cols[i + 1] = ALG.sorted; cols[hi] = ALG.default; setColors([...cols]); await sleep(speed);
        await qs(lo, i); await qs(i + 2, hi);
      }
      await qs(0, a.length - 1); cols.fill(ALG.sorted); setColors([...cols]);
    },
  },
  "Merge Sort": {
    code: ["def mergesort(arr, l, r):", "  if l < r:", "    m = (l+r)//2", "    mergesort(arr, l, m)", "    mergesort(arr, m+1, r)", "    merge(arr, l, m, r)"],
    complexity: { time: "O(n log n)", space: "O(n)", best: "O(n log n)", stable: true, inPlace: false, adaptive: false },
    description: "Splits the array in half recursively until each piece has one element, then merges pieces back together in sorted order. The merge step always compares the fronts of two already-sorted halves.",
    useCase: "When you need guaranteed O(n log n) performance and stability, e.g. sorting linked lists or external/disk-based data.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], cols = Array(a.length).fill(ALG.default);
      async function merge(l, m, r) {
        let left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1), i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
          cols[k] = ALG.comparing; setColors([...cols]); await sleep(speed);
          a[k++] = left[i] <= right[j] ? left[i++] : right[j++];
          setArr([...a]); cols[k - 1] = ALG.active;
        }
        while (i < left.length) { a[k++] = left[i++]; setArr([...a]); await sleep(speed / 2); }
        while (j < right.length) { a[k++] = right[j++]; setArr([...a]); await sleep(speed / 2); }
        for (let x = l; x <= r; x++) cols[x] = ALG.sorted; setColors([...cols]);
      }
      async function ms(l, r) {
        if (l >= r) return; const m = Math.floor((l + r) / 2);
        await ms(l, m); await ms(m + 1, r); await merge(l, m, r);
      }
      await ms(0, a.length - 1); cols.fill(ALG.sorted); setColors([...cols]);
    },
  },
  "Heap Sort": {
    code: ["def heapify(arr, n, i):", "  largest = i; l=2*i+1; r=2*i+2", "  if l<n and arr[l]>arr[largest]: largest=l", "  if r<n and arr[r]>arr[largest]: largest=r", "  if largest!=i: swap(i,largest); heapify(n,largest)", "for i in range(n//2-1,-1,-1): heapify(n,i)", "for i in range(n-1,0,-1): swap(0,i); heapify(i,0)"],
    complexity: { time: "O(n log n)", space: "O(1)", best: "O(n log n)", stable: false, inPlace: true, adaptive: false },
    description: "Builds a max-heap from the array so the largest value sits at the root, repeatedly swaps that root to the end of the array, shrinks the heap, and re-heapifies.",
    useCase: "Guaranteed O(n log n) with O(1) extra space — good when memory is tight and stability isn't required.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, cols = Array(n).fill(ALG.default);
      async function heapify(sz, i) {
        let largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < sz && a[l] > a[largest]) largest = l;
        if (r < sz && a[r] > a[largest]) largest = r;
        if (largest !== i) {
          cols[i] = ALG.comparing; cols[largest] = ALG.active;
          setColors([...cols]); await sleep(speed);
          [a[i], a[largest]] = [a[largest], a[i]]; setArr([...a]);
          cols[i] = ALG.default; cols[largest] = ALG.default;
          await heapify(sz, largest);
        }
      }
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
        [a[0], a[i]] = [a[i], a[0]]; setArr([...a]);
        cols[i] = ALG.sorted; cols[0] = ALG.pivot;
        setColors([...cols]); await sleep(speed);
        cols[0] = ALG.default;
        await heapify(i, 0);
      }
      cols[0] = ALG.sorted; setColors([...cols]);
    },
  },
  "Counting Sort": {
    code: ["max_val = max(arr)", "count = [0] * (max_val + 1)", "for x in arr: count[x] += 1", "idx = 0", "for v in range(max_val + 1):", "  while count[v] > 0:", "    arr[idx] = v; idx += 1", "    count[v] -= 1"],
    complexity: { time: "O(n + k)", space: "O(k)", best: "O(n + k)", stable: true, inPlace: false, adaptive: false },
    description: "Skips comparisons entirely: counts how many times each value appears, then rebuilds the array by writing each value that many times in order. 'k' is the range of possible values.",
    useCase: "Sorting integers over a small, known range (e.g. exam scores 0–100) — it can beat O(n log n) sorts when k is small relative to n.",
    async run(arr, setColors, setArr, speed) {
      const a = [...arr], n = a.length, maxV = Math.max(...a);
      const count = new Array(maxV + 1).fill(0);
      const cols = Array(n).fill(ALG.default);
      for (let i = 0; i < n; i++) {
        cols[i] = ALG.comparing; setColors([...cols]); await sleep(speed / 2);
        count[a[i]]++; cols[i] = ALG.default;
      }
      let idx = 0;
      for (let v = 0; v <= maxV; v++) {
        while (count[v] > 0) {
          a[idx] = v; setArr([...a]); cols[idx] = ALG.sorted;
          setColors([...cols]); await sleep(speed);
          idx++; count[v]--;
        }
      }
      setColors(Array(n).fill(ALG.sorted));
    },
  },
};

// ─── SEARCH ALGORITHMS (logic unchanged) ──────────────────────────────────────
const SEARCH_ALGOS = {
  "Linear Search": {
    code: ["for i in range(n):", "  if arr[i] == target: return i", "return -1"],
    complexity: { time: "O(n)", space: "O(1)" },
    description: "Checks every element one by one from the start until it finds the target or reaches the end. Makes no assumptions about ordering.",
    useCase: "Unsorted data, or a one-off lookup where sorting first wouldn't pay off.",
    async run(arr, target, setColors, speed) {
      const cols = Array(arr.length).fill(ALG.default);
      for (let i = 0; i < arr.length; i++) {
        cols[i] = ALG.comparing; setColors([...cols]); await sleep(speed);
        if (arr[i] === target) { cols[i] = ALG.found; setColors([...cols]); return i; }
        cols[i] = ALG.visited;
      }
      setColors([...cols]); return -1;
    },
  },
  "Binary Search": {
    code: ["lo, hi = 0, n-1", "while lo <= hi:", "  mid = (lo+hi)//2", "  if arr[mid]==target: return mid", "  elif arr[mid]<target: lo=mid+1", "  else: hi=mid-1", "return -1"],
    complexity: { time: "O(log n)", space: "O(1)" },
    note: "Auto-sorts for visualization",
    description: "Repeatedly checks the middle of the remaining range and discards the half that can't contain the target, halving the search space each step.",
    useCase: "Sorted arrays with random access (arrays, not linked lists) — the go-to for fast lookups.",
    async run(arr, target, setColors, speed) {
      const sorted = [...arr].sort((a, b) => a - b);
      const cols = Array(sorted.length).fill(ALG.default);
      let lo = 0, hi = sorted.length - 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        cols.fill(ALG.default); cols[mid] = ALG.active;
        for (let i = lo; i <= hi; i++) if (i !== mid) cols[i] = ALG.comparing;
        setColors([...cols]); await sleep(speed);
        if (sorted[mid] === target) { cols[mid] = ALG.found; setColors([...cols]); return mid; }
        else if (sorted[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      setColors([...cols]); return -1;
    },
  },
  "Jump Search": {
    code: ["step = √n; prev = 0", "while arr[min(step,n)-1] < target:", "  prev=step; step+=√n", "  if prev>=n: return -1", "while arr[prev] < target:", "  prev++; if prev==min(step,n): return -1", "if arr[prev]==target: return prev", "return -1"],
    complexity: { time: "O(√n)", space: "O(1)" },
    note: "Requires sorted array",
    description: "Jumps ahead in fixed-size blocks (√n at a time) to find the block that could contain the target, then does a linear scan inside that block.",
    useCase: "Sorted arrays where jumping backward is costly (e.g. slow storage) — fewer jumps than linear search, simpler than binary search.",
    async run(arr, target, setColors, speed) {
      const sorted = [...arr].sort((a, b) => a - b);
      const cols = Array(sorted.length).fill(ALG.default);
      const n = sorted.length, step = Math.floor(Math.sqrt(n));
      let prev = 0;
      while (sorted[Math.min(step, n) - 1] < target) {
        for (let i = prev; i < Math.min(step, n); i++) cols[i] = ALG.visited;
        setColors([...cols]); await sleep(speed);
        prev = step;
        if (prev >= n) { setColors([...cols]); return -1; }
      }
      while (sorted[prev] < target) {
        cols[prev] = ALG.comparing; setColors([...cols]); await sleep(speed);
        prev++;
        if (prev === Math.min(step, n)) { setColors([...cols]); return -1; }
      }
      if (sorted[prev] === target) { cols[prev] = ALG.found; setColors([...cols]); return prev; }
      setColors([...cols]); return -1;
    },
  },
  "Exponential Search": {
    code: ["if arr[0]==target: return 0", "i = 1", "while i<n and arr[i]<=target:", "  i *= 2", "lo, hi = i//2, min(i, n-1)", "return binary_search(arr, lo, hi, target)"],
    complexity: { time: "O(log n)", space: "O(1)" },
    note: "Requires sorted array",
    description: "Doubles an index (1, 2, 4, 8…) until it overshoots the target, locating a range the target must fall in, then runs binary search inside just that range.",
    useCase: "Sorted arrays where the target is likely near the start, or the array size is unknown/unbounded (e.g. searching a stream).",
    async run(arr, target, setColors, speed) {
      const sorted = [...arr].sort((a, b) => a - b);
      const n = sorted.length;
      const cols = Array(n).fill(ALG.default);
      if (sorted[0] === target) { cols[0] = ALG.found; setColors([...cols]); return 0; }
      let i = 1;
      while (i < n && sorted[i] <= target) {
        cols[i] = ALG.visited; setColors([...cols]); await sleep(speed);
        i *= 2;
      }
      let lo = Math.floor(i / 2), hi = Math.min(i, n - 1);
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        for (let k = 0; k < n; k++) cols[k] = (k >= lo && k <= hi) ? ALG.comparing : cols[k] === ALG.visited ? ALG.visited : ALG.default;
        cols[mid] = ALG.active;
        setColors([...cols]); await sleep(speed);
        if (sorted[mid] === target) { cols[mid] = ALG.found; setColors([...cols]); return mid; }
        else if (sorted[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      setColors([...cols]); return -1;
    },
  },
  "Interpolation Search": {
    code: ["lo, hi = 0, n-1", "while lo<=hi and target>=arr[lo] and target<=arr[hi]:", "  pos = lo + (target-arr[lo])*(hi-lo)//(arr[hi]-arr[lo])", "  if arr[pos]==target: return pos", "  elif arr[pos]<target: lo=pos+1", "  else: hi=pos-1", "return -1"],
    complexity: { time: "O(log log n)", space: "O(1)" },
    note: "Requires sorted, uniformly distributed array",
    description: "Estimates where the target is likely to sit using linear interpolation between the low and high bounds — like flipping straight to the right page of a dictionary instead of always opening to the middle.",
    useCase: "Large sorted arrays of uniformly distributed numeric data, where it can beat binary search's O(log n).",
    async run(arr, target, setColors, speed) {
      const sorted = [...arr].sort((a, b) => a - b);
      const n = sorted.length;
      const cols = Array(n).fill(ALG.default);
      let lo = 0, hi = n - 1;
      while (lo <= hi && target >= sorted[lo] && target <= sorted[hi]) {
        if (sorted[hi] === sorted[lo]) {
          cols[lo] = ALG.comparing; setColors([...cols]); await sleep(speed);
          if (sorted[lo] === target) { cols[lo] = ALG.found; setColors([...cols]); return lo; }
          break;
        }
        const pos = lo + Math.floor((target - sorted[lo]) * (hi - lo) / (sorted[hi] - sorted[lo]));
        for (let k = lo; k <= hi; k++) cols[k] = ALG.comparing;
        cols[pos] = ALG.active;
        setColors([...cols]); await sleep(speed);
        if (sorted[pos] === target) { cols[pos] = ALG.found; setColors([...cols]); return pos; }
        else if (sorted[pos] < target) lo = pos + 1;
        else hi = pos - 1;
      }
      setColors([...cols]); return -1;
    },
  },
};

// ─── LINKED LIST NODE ──────────────────────────────────────────────────────────
function LLNodeBox({ val, active, isHead, isTail, hasNext }) {
  return (
    <div className="flex items-center relative mt-6">
      {isHead && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-data text-emerald-400">head</div>}
      {isTail && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-data text-sky-400">tail</div>}
      <div
        className={cn(
          "w-[54px] h-[46px] rounded-lg flex items-center justify-center font-data font-semibold text-[15px] border transition-all",
          active ? "border-orange-400 bg-orange-500/10 text-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.3)]" : "border-white/[0.1] bg-white/[0.03] text-white/80"
        )}
      >
        {val}
      </div>
      {hasNext && (
        <div className="flex items-center">
          <div className="w-6 h-px bg-white/15" />
          <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-white/20" />
        </div>
      )}
    </div>
  );
}

// ─── STACK / QUEUE ─────────────────────────────────────────────────────────────
function StackView({ items, highlight }) {
  return (
    <div className="flex flex-col-reverse gap-1.5 min-h-[160px]">
      <div className="text-[9px] font-data text-orange-400/70 text-center py-1">— top —</div>
      {items.map((v, i) => (
        <div
          key={i}
          className={cn(
            "px-6 py-2 rounded-md text-center font-data text-[14px] font-medium border transition-all",
            highlight === i ? "border-orange-400 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.3)]" : "border-white/[0.08] bg-white/[0.03] text-white/80"
          )}
        >
          {v}
        </div>
      ))}
      {items.length === 0 && <div className="text-white/25 text-center py-5 font-data text-[12px]">empty</div>}
    </div>
  );
}

function QueueView({ items, highlight }) {
  return (
    <div className="flex gap-1.5 items-center flex-wrap min-h-[60px]">
      <div className="text-[9px] font-data text-emerald-400/80 mr-1">front →</div>
      {items.map((v, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-2 rounded-md font-data text-[14px] font-medium border transition-all",
            highlight === i ? "border-orange-400 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.3)]" : "border-white/[0.08] bg-white/[0.03] text-white/80"
          )}
        >
          {v}
        </div>
      ))}
      {items.length === 0 && <div className="text-white/25 font-data text-[12px]">empty</div>}
      <div className="text-[9px] font-data text-rose-400/80">← rear</div>
    </div>
  );
}

// ─── BINARY SEARCH TREE ─────────────────────────────────────────────────────────
function TreeNodeSVG({ node, highlight, x, y }) {
  if (!node) return null;
  const hit = highlight === node.val;
  return (
    <g>
      {node.left && (
        <>
          <line x1={x} y1={y + 18} x2={x - node.offset} y2={y + 58} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          <TreeNodeSVG node={node.left} highlight={highlight} x={x - node.offset} y={y + 62} />
        </>
      )}
      {node.right && (
        <>
          <line x1={x} y1={y + 18} x2={x + node.offset} y2={y + 58} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          <TreeNodeSVG node={node.right} highlight={highlight} x={x + node.offset} y={y + 62} />
        </>
      )}
      <circle cx={x} cy={y} r={20} fill={hit ? "rgba(251,146,60,0.12)" : "rgba(255,255,255,0.03)"} stroke={hit ? "#fb923c" : "rgba(255,255,255,0.15)"} strokeWidth={2} />
      {hit && <circle cx={x} cy={y} r={24} fill="none" stroke="#fb923c" strokeWidth={1} opacity={0.35} />}
      <text x={x} y={y + 5} textAnchor="middle" fill={hit ? "#fb923c" : "#EAE8E3"} fontSize={13} fontFamily="'IBM Plex Mono',monospace" fontWeight={600}>
        {node.val}
      </text>
    </g>
  );
}

function buildBST(values) {
  function insert(root, val, depth = 0) {
    if (!root) return { val, left: null, right: null, offset: Math.max(22, 62 - depth * 9) };
    if (val < root.val) root.left = insert(root.left, val, depth + 1);
    else root.right = insert(root.right, val, depth + 1);
    return root;
  }
  let root = null;
  for (const v of values) root = insert(root, v);
  return root;
}

// ─── GRAPH ──────────────────────────────────────────────────────────────────────
const GNODES = [
  { id: 0, x: 200, y: 60 }, { id: 1, x: 90, y: 160 }, { id: 2, x: 310, y: 160 },
  { id: 3, x: 40, y: 270 }, { id: 4, x: 155, y: 270 }, { id: 5, x: 265, y: 270 }, { id: 6, x: 370, y: 270 },
];
const GEDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];

function GraphSVG({ visited, current, path }) {
  return (
    <svg width="100%" viewBox="0 0 430 320" className="block">
      {GEDGES.map(([a, b], i) => {
        const inPath = path.includes(a) && path.includes(b);
        return (
          <line key={i} x1={GNODES[a].x} y1={GNODES[a].y} x2={GNODES[b].x} y2={GNODES[b].y}
            stroke={inPath ? "#fb923c" : "rgba(255,255,255,0.12)"} strokeWidth={inPath ? 2.5 : 1.5} />
        );
      })}
      {GNODES.map((n) => {
        const isCur = current === n.id;
        const isVis = visited.includes(n.id);
        const fill = isCur ? "rgba(251,146,60,0.12)" : isVis ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)";
        const stroke = isCur ? "#fb923c" : isVis ? "#34d399" : "rgba(255,255,255,0.15)";
        return (
          <g key={n.id}>
            {isCur && <circle cx={n.x} cy={n.y} r={26} fill="none" stroke="#fb923c" strokeWidth={1} opacity={0.35} />}
            <circle cx={n.x} cy={n.y} r={22} fill={fill} stroke={stroke} strokeWidth={2} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fill={isCur ? "#fb923c" : isVis ? "#34d399" : "#EAE8E3"} fontSize={13} fontFamily="'IBM Plex Mono',monospace" fontWeight={600}>
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
const TABS = [
  { name: "Sort", tone: "orange" },
  { name: "Search", tone: "violet" },
  { name: "Linked List", tone: "emerald" },
  { name: "Stack & Queue", tone: "rose" },
  { name: "Binary Tree", tone: "teal" },
  { name: "Graph", tone: "sky" },
];
const TAB_ACTIVE = {
  orange: "bg-orange-500/15 text-orange-400",
  violet: "bg-violet-500/15 text-violet-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  rose: "bg-rose-500/15 text-rose-400",
  teal: "bg-teal-500/15 text-teal-400",
  sky: "bg-sky-500/15 text-sky-400",
};

export default function DSAVisualizer() {
  const [tab, setTab] = useState("Sort");
  const [sortAlgo, setSortAlgo] = useState("Bubble Sort");
  const [searchAlgo, setSearchAlgo] = useState("Linear Search");
  const [arr, setArr] = useState([38, 27, 43, 13, 55, 19, 32, 47, 8, 60, 24, 71]);
  const [colors, setColors] = useState(Array(12).fill(ALG.default));
  const [running, setRunning] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2);
  const speed = SPEED_LEVELS[speedIdx].delay;
  const [status, setStatus] = useState("");
  const [searchTarget, setSearchTarget] = useState(27);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");
  // LL
  const [llNodes, setLLNodes] = useState([10, 20, 30, 40, 50]);
  const [llInput, setLLInput] = useState("");
  const [llHighlight, setLLHighlight] = useState(-1);
  const [llLog, setLlLog] = useState([]);
  // Stack / Queue
  const [stack, setStack] = useState([3, 7, 2, 9]);
  const [stackInput, setStackInput] = useState("");
  const [stackHighlight, setStackHighlight] = useState(-1);
  const [queue, setQueue] = useState([4, 1, 8, 5]);
  const [queueInput, setQueueInput] = useState("");
  const [queueHighlight, setQueueHighlight] = useState(-1);
  // BST
  const [bstVals, setBstVals] = useState([50, 30, 70, 20, 40, 60, 80]);
  const [bstHighlight, setBstHighlight] = useState(null);
  const [bstSearch, setBstSearch] = useState("");
  const [bstInput, setBstInput] = useState("");
  const [bstLog, setBstLog] = useState([]);
  // Graph
  const [graphVisited, setGraphVisited] = useState([]);
  const [graphCurrent, setGraphCurrent] = useState(null);
  const [graphPath, setGraphPath] = useState([]);
  const [graphMode, setGraphMode] = useState("BFS");

  const genArr = () => {
    const a = Array.from({ length: 14 }, () => Math.floor(Math.random() * 88) + 5);
    setArr(a); setColors(Array(a.length).fill(ALG.default)); setStatus(""); setCustomError("");
  };

  const applyCustomArr = () => {
    const parts = customInput.split(",").map((s) => s.trim()).filter((s) => s.length);
    const nums = parts.map(Number);
    if (nums.length < 2) { setCustomError("Enter at least 2 comma-separated numbers"); return; }
    if (nums.length > 20) { setCustomError("Max 20 numbers"); return; }
    if (nums.some((n) => isNaN(n) || n < 0 || n > 999)) { setCustomError("Use whole numbers between 0 and 999"); return; }
    setArr(nums); setColors(Array(nums.length).fill(ALG.default)); setStatus(""); setCustomError("");
  };

  const runSort = async () => {
    setRunning(true); setStatus("Sorting…");
    setColors(Array(arr.length).fill(ALG.default));
    await SORT_ALGOS[sortAlgo].run([...arr], setColors, setArr, speed);
    setStatus("Sorted ✓"); setRunning(false);
  };

  const runSearch = async () => {
    setRunning(true); setStatus("Searching…");
    setColors(Array(arr.length).fill(ALG.default));
    const idx = await SEARCH_ALGOS[searchAlgo].run(arr, searchTarget, setColors, speed);
    setStatus(idx >= 0 ? `✓ Found ${searchTarget} at index ${idx}` : `✗ ${searchTarget} not found`);
    setRunning(false);
  };

  const runBFS = async () => {
    setRunning(true); setGraphVisited([]); setGraphCurrent(null); setGraphPath([]);
    const visited = [], q = [0];
    while (q.length) {
      const n = q.shift(); if (visited.includes(n)) continue;
      visited.push(n); setGraphVisited([...visited]); setGraphCurrent(n);
      await sleep(speed);
      GEDGES.filter(([a, b]) => a === n || b === n).forEach(([a, b]) => {
        const nb = a === n ? b : a; if (!visited.includes(nb)) q.push(nb);
      });
    }
    setGraphCurrent(null); setGraphPath(visited); setRunning(false);
  };

  const runDFS = async () => {
    setRunning(true); setGraphVisited([]); setGraphCurrent(null); setGraphPath([]);
    const visited = [];
    async function dfs(n) {
      if (visited.includes(n)) return;
      visited.push(n); setGraphVisited([...visited]); setGraphCurrent(n); await sleep(speed);
      const nbs = GEDGES.filter(([a, b]) => a === n || b === n).map(([a, b]) => (a === n ? b : a));
      for (const nb of nbs) await dfs(nb);
    }
    await dfs(0); setGraphCurrent(null); setGraphPath(visited); setRunning(false);
  };

  const bstRoot = buildBST(bstVals);
  const activeSort = SORT_ALGOS[sortAlgo];
  const activeSearch = SEARCH_ALGOS[searchAlgo];
  const activeTab = TABS.find((t) => t.name === tab);

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
              <span className="text-orange-400">DSA Visualizer</span>
            </span>
          </div>
        </div>

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="font-display font-semibold text-[2.25rem] sm:text-4xl leading-[1.1] text-white mb-3">
                See how the algorithm thinks.
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                Step through sorting, searching, and core data structures one move at a time.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* ── tabs ── */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.name}
                onClick={() => { setTab(t.name); setStatus(""); setColors(Array(arr.length).fill(ALG.default)); }}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors",
                  tab === t.name ? TAB_ACTIVE[t.tone] : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
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

              {/* ══ SORT ══ */}
              {tab === "Sort" && (
                <>
               

                  <Card className="px-4 py-3.5 flex flex-wrap gap-2.5 items-center">
                    <Sel value={sortAlgo} onChange={setSortAlgo} options={Object.keys(SORT_ALGOS)} disabled={running} />
                    <SpeedControl value={speedIdx} onChange={setSpeedIdx} disabled={running} />
                    <Btn onClick={genArr} disabled={running}>Shuffle</Btn>
                    <Btn onClick={runSort} disabled={running} variant="accent">Visualize</Btn>
                    <div className="ml-auto flex gap-2 flex-wrap">
                      <Badge label={`time ${activeSort.complexity.time}`} tone="sky" />
                      <Badge label={`space ${activeSort.complexity.space}`} tone="emerald" />
                      <Badge label={`best ${activeSort.complexity.best}`} tone="teal" />
                      <Badge label={activeSort.complexity.stable ? "stable" : "unstable"} tone={activeSort.complexity.stable ? "emerald" : "rose"} />
                    </div>
                  </Card>

                  <Card className="px-4 py-3 flex flex-wrap gap-2.5 items-center">
                    <span className="text-[11px] font-data text-white/30">Custom array</span>
                    <Inp value={customInput} onChange={setCustomInput} onEnter={applyCustomArr} placeholder="e.g. 12, 4, 30, 8, 91" width={260} />
                    <Btn onClick={applyCustomArr} disabled={running} variant="blue">Set array</Btn>
                    {customError && <span className="font-data text-[11px] text-rose-400">{customError}</span>}
                  </Card>

                  <Card className="px-4 py-6 flex items-end gap-[3px] min-h-[260px] flex-wrap">
                    {arr.map((v, i) => (
                      <Bar key={i} value={v} max={Math.max(...arr)} color={colors[i]} width={Math.min(32, Math.floor(840 / arr.length - 4))} />
                    ))}
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeView lines={activeSort.code} highlight={-1} title={sortAlgo} />
                    <div className="flex flex-col gap-3">
                      <StatusBanner status={status} />
                      <Legend items={[["Comparing", ALG.comparing], ["Active", ALG.active], ["Sorted", ALG.sorted], ["Pivot", ALG.pivot]]} />
                    </div>
                  </div>

                  <AboutCard
                    title={sortAlgo}
                    description={activeSort.description}
                    useCase={activeSort.useCase}
                    badges={[
                      [activeSort.complexity.inPlace ? "In-place" : "Extra memory", activeSort.complexity.inPlace ? "emerald" : "rose"],
                      [activeSort.complexity.adaptive ? "Adaptive" : "Non-adaptive", activeSort.complexity.adaptive ? "emerald" : "dim"],
                      [activeSort.complexity.stable ? "Stable" : "Unstable", activeSort.complexity.stable ? "emerald" : "rose"],
                    ]}
                  />
                </>
              )}

              {/* ══ SEARCH ══ */}
              {tab === "Search" && (
                <>
                 

                  <Card className="px-4 py-3.5 flex flex-wrap gap-2.5 items-center">
                    <Sel value={searchAlgo} onChange={setSearchAlgo} options={Object.keys(SEARCH_ALGOS)} disabled={running} />
                    <Inp value={searchTarget} onChange={(v) => setSearchTarget(+v)} placeholder="Target" width={80} />
                    <SpeedControl value={speedIdx} onChange={setSpeedIdx} disabled={running} />
                    <Btn onClick={genArr} disabled={running}>Shuffle</Btn>
                    <Btn onClick={runSearch} disabled={running} variant="purple">Search</Btn>
                    <Badge label={`time ${activeSearch.complexity.time}`} tone="violet" />
                  </Card>

                  <Card className="px-4 py-3 flex flex-wrap gap-2.5 items-center">
                    <span className="text-[11px] font-data text-white/30">Custom array</span>
                    <Inp value={customInput} onChange={setCustomInput} onEnter={applyCustomArr} placeholder="e.g. 12, 4, 30, 8, 91" width={260} />
                    <Btn onClick={applyCustomArr} disabled={running} variant="blue">Set array</Btn>
                    {customError && <span className="font-data text-[11px] text-rose-400">{customError}</span>}
                  </Card>

                  {activeSearch.note && (
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2 font-data text-[11.5px] text-orange-400">
                      {activeSearch.note}
                    </div>
                  )}

                  <Card className="px-4 py-6 flex items-end gap-[3px] min-h-[260px] flex-wrap">
                    {arr.map((v, i) => (
                      <Bar key={i} value={v} max={Math.max(...arr)} color={colors[i]} />
                    ))}
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeView lines={activeSearch.code} title={searchAlgo} />
                    <div className="flex flex-col gap-3">
                      <StatusBanner status={status} />
                      <Legend items={[["Found", ALG.found], ["Comparing", ALG.comparing], ["Visited", ALG.visited], ["Active", ALG.active]]} />
                    </div>
                  </div>

                  <AboutCard
                    title={searchAlgo}
                    description={activeSearch.description}
                    useCase={activeSearch.useCase}
                    badges={[["Time " + activeSearch.complexity.time, "violet"], ["Space " + activeSearch.complexity.space, "sky"]]}
                  />
                </>
              )}

              {/* ══ LINKED LIST ══ */}
              {tab === "Linked List" && (
                <>
                  

                  <Card className="px-4 py-3.5 flex flex-wrap gap-2 items-center">
                    <Inp value={llInput} onChange={setLLInput} placeholder="Value" width={80} />
                    <Btn variant="green" onClick={async () => {
                      const v = parseInt(llInput); if (isNaN(v)) return;
                      setLLNodes((n) => [...n, v]); setLLInput("");
                      setLlLog((l) => [`Appended ${v} at tail`, ...l.slice(0, 4)]);
                      setLLHighlight(llNodes.length); await sleep(600); setLLHighlight(-1);
                    }}>+ Append</Btn>
                    <Btn variant="blue" onClick={async () => {
                      const v = parseInt(llInput); if (isNaN(v)) return;
                      setLLNodes((n) => [v, ...n]); setLLInput("");
                      setLlLog((l) => [`Prepended ${v} at head`, ...l.slice(0, 4)]);
                      setLLHighlight(0); await sleep(600); setLLHighlight(-1);
                    }}>↑ Prepend</Btn>
                    <Btn variant="red" onClick={async () => {
                      if (!llNodes.length) return;
                      setLlLog((l) => [`Deleted head (${llNodes[0]})`, ...l.slice(0, 4)]);
                      setLLHighlight(0); await sleep(500);
                      setLLNodes((n) => n.slice(1)); setLLHighlight(-1);
                    }}>✕ Head</Btn>
                    <Btn variant="red" onClick={async () => {
                      if (!llNodes.length) return;
                      setLlLog((l) => [`Deleted tail (${llNodes[llNodes.length - 1]})`, ...l.slice(0, 4)]);
                      setLLHighlight(llNodes.length - 1); await sleep(500);
                      setLLNodes((n) => n.slice(0, -1)); setLLHighlight(-1);
                    }}>✕ Tail</Btn>
                    <Btn onClick={() => { setLLNodes([10, 20, 30, 40, 50]); setLlLog([]); }}>Reset</Btn>
                  </Card>

                  <Card className="px-6 pt-10 pb-6 overflow-x-auto">
                    <div className="flex items-center flex-nowrap">
                      {llNodes.length === 0 ? (
                        <div className="text-white/25 font-data text-[13px]">[ empty list ]</div>
                      ) : (
                        llNodes.map((v, i) => (
                          <LLNodeBox key={i} val={v} active={llHighlight === i} isHead={i === 0} isTail={i === llNodes.length - 1} hasNext={i < llNodes.length - 1} />
                        ))
                      )}
                      {llNodes.length > 0 && <span className="text-white/25 font-data text-[12px] ml-2">null</span>}
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ComplexityCard title="Linked List Operations" rows={[
                      ["Access (index)", "O(n)", "sky"],
                      ["Search", "O(n)", "sky"],
                      ["Insert at head", "O(1)", "emerald"],
                      ["Insert at tail", "O(1)", "emerald"],
                      ["Delete head", "O(1)", "emerald"],
                      ["Delete at position", "O(n)", "rose"],
                    ]} />
                    <Card className="overflow-hidden">
                      <CardHead>Operation Log</CardHead>
                      <div className="px-4 py-3 flex flex-col gap-1.5">
                        {llLog.length === 0 ? (
                          <span className="font-data text-[11px] text-white/25">No operations yet…</span>
                        ) : (
                          llLog.map((l, i) => (
                            <div key={i} className={cn("font-data text-[11px] px-2 py-1 rounded", i === 0 ? "text-orange-400 bg-orange-500/[0.08]" : "text-white/40")}>
                              {i === 0 ? "▸ " : "  "}{l}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  <AboutCard
                    title="Singly Linked List"
                    description="A chain of nodes where each node stores a value and a pointer to the next node. Unlike arrays, elements don't need to sit in contiguous memory, so inserting or removing at the head is instant."
                    useCase="Frequent insertions/removals at the ends (e.g. undo history, queues, LRU caches) where you don't need random-access indexing."
                  />
                </>
              )}

              {/* ══ STACK & QUEUE ══ */}
              {tab === "Stack & Queue" && (
                <>
                 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge label="Stack" tone="orange" />
                        <span className="font-data text-[10.5px] text-white/30">LIFO — last in, first out</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Inp value={stackInput} onChange={setStackInput} placeholder="Value" width={70} />
                        <Btn variant="green" onClick={async () => {
                          if (!stackInput) return;
                          const v = isNaN(+stackInput) ? stackInput : +stackInput;
                          setStack((s) => [...s, v]); setStackInput("");
                          setStackHighlight(stack.length); await sleep(600); setStackHighlight(-1);
                        }}>Push</Btn>
                        <Btn variant="red" onClick={async () => {
                          if (!stack.length) return;
                          setStackHighlight(stack.length - 1); await sleep(500);
                          setStack((s) => s.slice(0, -1)); setStackHighlight(-1);
                        }}>Pop</Btn>
                        <Btn onClick={() => setStack([3, 7, 2, 9])}>Reset</Btn>
                      </div>
                      <Card className="p-4">
                        <StackView items={stack} highlight={stackHighlight} />
                      </Card>
                      <ComplexityCard rows={[["Push", "O(1)", "emerald"], ["Pop", "O(1)", "emerald"], ["Peek", "O(1)", "emerald"], ["Search", "O(n)", "sky"]]} />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge label="Queue" tone="teal" />
                        <span className="font-data text-[10.5px] text-white/30">FIFO — first in, first out</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Inp value={queueInput} onChange={setQueueInput} placeholder="Value" width={70} />
                        <Btn variant="green" onClick={async () => {
                          if (!queueInput) return;
                          const v = isNaN(+queueInput) ? queueInput : +queueInput;
                          setQueue((q) => [...q, v]); setQueueInput("");
                          setQueueHighlight(queue.length); await sleep(600); setQueueHighlight(-1);
                        }}>Enqueue</Btn>
                        <Btn variant="red" onClick={async () => {
                          if (!queue.length) return;
                          setQueueHighlight(0); await sleep(500);
                          setQueue((q) => q.slice(1)); setQueueHighlight(-1);
                        }}>Dequeue</Btn>
                        <Btn onClick={() => setQueue([4, 1, 8, 5])}>Reset</Btn>
                      </div>
                      <Card className="p-4">
                        <QueueView items={queue} highlight={queueHighlight} />
                      </Card>
                      <ComplexityCard rows={[["Enqueue", "O(1)", "emerald"], ["Dequeue", "O(1)", "emerald"], ["Peek", "O(1)", "emerald"], ["Search", "O(n)", "sky"]]} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AboutCard
                      title="Stack"
                      description="Elements are added and removed from the same end (the 'top'). The last item pushed is always the first one popped."
                      useCase="Undo/redo, function call stacks, expression parsing (matching brackets), and backtracking algorithms."
                    />
                    <AboutCard
                      title="Queue"
                      description="Elements are added at the rear and removed from the front, preserving arrival order."
                      useCase="Task scheduling, BFS traversal, print queues, and any first-come-first-served processing."
                    />
                  </div>
                </>
              )}

              {/* ══ BINARY TREE ══ */}
              {tab === "Binary Tree" && (
                <>
                  

                  <Card className="px-4 py-3.5 flex flex-wrap gap-2.5 items-center">
                    <Inp value={bstSearch} onChange={setBstSearch} placeholder="Search…" width={90} />
                    <Btn variant="purple" onClick={async () => {
                      const target = parseInt(bstSearch); if (isNaN(target)) return;
                      setBstLog([]);
                      async function search(node) {
                        if (!node) { setBstHighlight(null); setBstLog((l) => [...l, `✗ ${target} not found`]); return; }
                        setBstHighlight(node.val); setBstLog((l) => [...l, `Visiting ${node.val}`]); await sleep(speed);
                        if (node.val === target) { setBstLog((l) => [...l, `✓ Found ${target}!`]); return; }
                        if (target < node.val) { setBstLog((l) => [...l, `${target} < ${node.val} → go left`]); await search(node.left); }
                        else { setBstLog((l) => [...l, `${target} > ${node.val} → go right`]); await search(node.right); }
                      }
                      await search(bstRoot);
                    }}>Search</Btn>
                    <Inp value={bstInput} onChange={setBstInput} placeholder="Insert…" width={80} />
                    <Btn variant="green" onClick={() => {
                      const v = parseInt(bstInput); if (isNaN(v) || bstVals.includes(v)) return;
                      setBstVals((vs) => [...vs, v]); setBstInput(""); setBstLog((l) => [`Inserted ${v}`, ...l.slice(0, 4)]);
                    }}>+ Insert</Btn>
                    <SpeedControl value={speedIdx} onChange={setSpeedIdx} disabled={running} />
                    <Btn onClick={() => { setBstHighlight(null); setBstLog([]); }}>Clear</Btn>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
                    <Card className="p-3">
                      <svg width="100%" viewBox="0 0 420 300" className="block">
                        <TreeNodeSVG node={bstRoot} highlight={bstHighlight} x={210} y={28} />
                      </svg>
                    </Card>
                    <div className="flex flex-col gap-3">
                      <ComplexityCard title="BST Operations (balanced)" rows={[
                        ["Search", "O(log n)", "sky"],
                        ["Insert", "O(log n)", "emerald"],
                        ["Delete", "O(log n)", "rose"],
                        ["Inorder", "O(n)", "teal"],
                      ]} />
                      <Card className="overflow-hidden">
                        <CardHead>Search Trace</CardHead>
                        <div className="px-4 py-3 flex flex-col gap-1">
                          {bstLog.length === 0 ? (
                            <span className="font-data text-[11px] text-white/25">Run a search to see the trace…</span>
                          ) : (
                            bstLog.map((l, i) => (
                              <div key={i} className={cn(
                                "font-data text-[11px] px-2 py-1 rounded",
                                l.startsWith("✓") ? "text-emerald-400 bg-emerald-500/[0.08]" : l.startsWith("✗") ? "text-rose-400 bg-rose-500/[0.08]" : "text-white/40"
                              )}>
                                {l}
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  <AboutCard
                    title="Binary Search Tree"
                    description="Every node's left subtree holds only smaller values, and its right subtree only larger ones, so each comparison during a search eliminates half the remaining nodes — as long as the tree stays roughly balanced."
                    useCase="Ordered data that needs fast search, insert, and range queries. Unbalanced insert patterns (e.g. sorted input) degrade it to O(n), which is why balanced variants like AVL or Red-Black trees exist."
                  />
                </>
              )}

              {/* ══ GRAPH ══ */}
              {tab === "Graph" && (
                <>
             
                  <Card className="px-4 py-3.5 flex flex-wrap gap-2.5 items-center">
                    <div className="flex rounded-md border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                      {["BFS", "DFS"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setGraphMode(m)}
                          disabled={running}
                          className={cn(
                            "px-4 py-1.5 text-[12.5px] font-data font-medium transition-colors",
                            graphMode === m ? "bg-orange-500/15 text-orange-400" : "text-white/40 hover:text-white/70"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <SpeedControl value={speedIdx} onChange={setSpeedIdx} disabled={running} />
                    <Btn onClick={() => { setGraphVisited([]); setGraphCurrent(null); setGraphPath([]); }} disabled={running}>Reset</Btn>
                    <Btn variant="accent" onClick={graphMode === "BFS" ? runBFS : runDFS} disabled={running}>Run {graphMode}</Btn>
                    <Badge label="time O(V+E)" tone="sky" />
                    <Badge label="space O(V)" tone="emerald" />
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
                    <Card className="p-3">
                      <GraphSVG visited={graphVisited} current={graphCurrent} path={graphPath} />
                    </Card>
                    <div className="flex flex-col gap-3">
                      <Card className="overflow-hidden">
                        <CardHead>Traversal Order</CardHead>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {graphVisited.length === 0 ? (
                              <span className="font-data text-[11px] text-white/25">Run a traversal…</span>
                            ) : (
                              graphVisited.map((n, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <div className={cn(
                                    "w-[30px] h-[30px] rounded-md flex items-center justify-center font-data text-[13px] font-semibold border",
                                    n === graphCurrent ? "border-orange-400 bg-orange-500/10 text-orange-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                  )}>
                                    {n}
                                  </div>
                                  {i < graphVisited.length - 1 && <span className="text-white/20 text-[12px]">→</span>}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </Card>
                      <ComplexityCard title={`${graphMode} Complexity`} rows={[
                        ["Time", "O(V + E)", "sky"],
                        ["Space", "O(V)", "emerald"],
                        ["Shortest path", graphMode === "BFS" ? "Yes" : "No", graphMode === "BFS" ? "emerald" : "rose"],
                      ]} />
                      <Legend items={[["Current", "#fb923c"], ["Visited", "#34d399"]]} />
                    </div>
                  </div>

                  <AboutCard
                    title={graphMode === "BFS" ? "Breadth-First Search" : "Depth-First Search"}
                    description={graphMode === "BFS"
                      ? "Explores the graph level by level using a queue: visit a node, then queue up all its unvisited neighbors before moving deeper. This guarantees the shortest path in an unweighted graph."
                      : "Explores as far as possible down one branch before backtracking, using a stack (or recursion). It doesn't guarantee the shortest path, but uses less memory on wide graphs."}
                    useCase={graphMode === "BFS"
                      ? "Shortest-path problems, finding connected components, or web crawling level by level."
                      : "Cycle detection, topological sorting, maze/puzzle solving, and exploring all paths."}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}