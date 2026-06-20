import { useState, useRef, useEffect, useCallback } from "react";

// ─── COMPLEXITY DEFINITIONS ───────────────────────────────────────────────────
const COMPLEXITIES = [
  {
    label: "O(1)",
    fn: () => 1,
    color: "#00e676",
    glow: "#00e67644",
    desc: "Constant – doesn't grow with input",
    rating: 5,
    ratingLabel: "Excellent",
  },
  {
    label: "O(log n)",
    fn: (n) => Math.log2(n + 1),
    color: "#69f0ae",
    glow: "#69f0ae44",
    desc: "Logarithmic – halves the problem each step",
    rating: 4,
    ratingLabel: "Great",
  },
  {
    label: "O(√n)",
    fn: (n) => Math.sqrt(n),
    color: "#b2ff59",
    glow: "#b2ff5944",
    desc: "Square root – common in sieve algorithms",
    rating: 4,
    ratingLabel: "Good",
  },
  {
    label: "O(n)",
    fn: (n) => n,
    color: "#ff9800",
    glow: "#ff980044",
    desc: "Linear – one pass through the input",
    rating: 3,
    ratingLabel: "Fair",
  },
  {
    label: "O(n log n)",
    fn: (n) => n * Math.log2(n + 1),
    color: "#ff6d00",
    glow: "#ff6d0044",
    desc: "Linearithmic – optimal comparison-based sorting",
    rating: 2,
    ratingLabel: "Acceptable",
  },
  {
    label: "O(n²)",
    fn: (n) => n * n,
    color: "#ff3d00",
    glow: "#ff3d0044",
    desc: "Quadratic – nested loops over input",
    rating: 1,
    ratingLabel: "Poor",
  },
  {
    label: "O(n³)",
    fn: (n) => n * n * n,
    color: "#b71c1c",
    glow: "#b71c1c44",
    desc: "Cubic – triple nested loops",
    rating: 0,
    ratingLabel: "Bad",
  },
  {
    label: "O(2ⁿ)",
    fn: (n) => Math.min(Math.pow(2, n), 1e12),
    color: "#880000",
    glow: "#88000044",
    desc: "Exponential – doubles with each element",
    rating: 0,
    ratingLabel: "Terrible",
  },
];

// ─── ALGORITHMS DATABASE ──────────────────────────────────────────────────────
const ALGORITHMS = [
  {
    name: "Array Access",
    time: "O(1)",
    space: "O(1)",
    category: "Array",
    description: "Direct index access returns the element immediately.",
    code: `function access(arr, i) {\n  return arr[i]; // one step\n}`,
    steps: ["Go directly to index i", "Return the value"],
  },
  {
    name: "Binary Search",
    time: "O(log n)",
    space: "O(1)",
    category: "Search",
    description: "Repeatedly halves the search space on a sorted array.",
    code: `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    let mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    arr[mid] < target ? lo = mid+1 : hi = mid-1;\n  }\n  return -1;\n}`,
    steps: ["Set lo=0, hi=n-1", "Compute mid", "If match → done", "Discard half", "Repeat"],
  },
  {
    name: "Linear Search",
    time: "O(n)",
    space: "O(1)",
    category: "Search",
    description: "Scans every element until the target is found.",
    code: `function linearSearch(arr, target) {\n  for (let i = 0; i < arr.length; i++)\n    if (arr[i] === target) return i;\n  return -1;\n}`,
    steps: ["Start at index 0", "Compare each element", "Return if match", "Move to next"],
  },
  {
    name: "Bubble Sort",
    time: "O(n²)",
    space: "O(1)",
    category: "Sort",
    description: "Repeatedly swaps adjacent elements if out of order.",
    code: `function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++)\n    for (let j = 0; j < arr.length-i-1; j++)\n      if (arr[j] > arr[j+1])\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n  return arr;\n}`,
    steps: ["Outer loop n times", "Inner loop n-i times", "Compare adjacent", "Swap if needed"],
  },
  {
    name: "Merge Sort",
    time: "O(n log n)",
    space: "O(n)",
    category: "Sort",
    description: "Divide-and-conquer: split, sort halves, merge.",
    code: `function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = arr.length >> 1;\n  const L = mergeSort(arr.slice(0, mid));\n  const R = mergeSort(arr.slice(mid));\n  return merge(L, R);\n}`,
    steps: ["Split array in half", "Recursively sort each", "Merge sorted halves", "log n levels × n work"],
  },
  {
    name: "Quick Sort",
    time: "O(n log n)",
    space: "O(log n)",
    category: "Sort",
    description: "Partition around pivot; avg O(n log n), worst O(n²).",
    code: `function quickSort(arr, lo=0, hi=arr.length-1) {\n  if (lo < hi) {\n    const p = partition(arr, lo, hi);\n    quickSort(arr, lo, p-1);\n    quickSort(arr, p+1, hi);\n  }\n}`,
    steps: ["Choose pivot", "Partition array", "Recurse left", "Recurse right"],
  },
  {
    name: "Insertion Sort",
    time: "O(n²)",
    space: "O(1)",
    category: "Sort",
    description: "Insert each element into its sorted position.",
    code: `function insertionSort(arr) {\n  for (let i = 1; i < arr.length; i++) {\n    let key = arr[i], j = i-1;\n    while (j >= 0 && arr[j] > key)\n      arr[j+1] = arr[j--];\n    arr[j+1] = key;\n  }\n}`,
    steps: ["Pick element at i", "Compare left neighbors", "Shift right if larger", "Insert in position"],
  },
  {
    name: "Hash Table Lookup",
    time: "O(1)",
    space: "O(n)",
    category: "Hash",
    description: "Average O(1) via hash function; worst O(n) with collisions.",
    code: `const map = new Map();\nmap.set(key, value);  // O(1) avg\nmap.get(key);         // O(1) avg`,
    steps: ["Hash the key", "Go to bucket", "Return value"],
  },
  {
    name: "DFS / BFS",
    time: "O(V+E)",
    space: "O(V)",
    category: "Graph",
    description: "Visit every vertex and traverse every edge once.",
    code: `function dfs(graph, node, visited = new Set()) {\n  visited.add(node);\n  for (const neighbor of graph[node])\n    if (!visited.has(neighbor))\n      dfs(graph, neighbor, visited);\n}`,
    steps: ["Mark node visited", "Explore neighbors", "Recurse/enqueue", "Until all visited"],
  },
  {
    name: "Fibonacci (naive)",
    time: "O(2ⁿ)",
    space: "O(n)",
    category: "Recursion",
    description: "Exponential calls because subproblems are recomputed.",
    code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2); // duplicates!\n}`,
    steps: ["fib(n) calls fib(n-1) and fib(n-2)", "Each branches again", "Tree has 2ⁿ nodes"],
  },
  {
    name: "Fibonacci (DP)",
    time: "O(n)",
    space: "O(n)",
    category: "DP",
    description: "Memoize results — each subproblem solved once.",
    code: `function fib(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  return memo[n] = fib(n-1,memo)+fib(n-2,memo);\n}`,
    steps: ["Check memo", "Return if cached", "Compute and store", "Linear chain of calls"],
  },
  {
    name: "Matrix Multiply",
    time: "O(n³)",
    space: "O(n²)",
    category: "Math",
    description: "Naïve triple loop; Strassen achieves ~O(n^2.81).",
    code: `function matMul(A, B, n) {\n  const C = Array.from({length:n}, ()=>Array(n).fill(0));\n  for (let i=0;i<n;i++)\n    for (let j=0;j<n;j++)\n      for (let k=0;k<n;k++)\n        C[i][j] += A[i][k]*B[k][j];\n  return C;\n}`,
    steps: ["3 nested loops", "n² output cells", "Each cell costs n work", "Total: n³"],
  },
];

// ─── SORT ANIMATION ENGINE ────────────────────────────────────────────────────
function generateSortSteps(algoName, arr) {
  const steps = [];
  const a = [...arr];

  if (algoName === "Bubble Sort") {
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        steps.push({ arr: [...a], comparing: [j, j + 1], swapped: false, sorted: Array.from({ length: i }, (_, k) => a.length - 1 - k) });
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          steps.push({ arr: [...a], comparing: [j, j + 1], swapped: true, sorted: Array.from({ length: i }, (_, k) => a.length - 1 - k) });
        }
      }
    }
    steps.push({ arr: [...a], comparing: [], swapped: false, sorted: a.map((_, i) => i) });
  } else if (algoName === "Insertion Sort") {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      steps.push({ arr: [...a], comparing: [i], swapped: false, sorted: Array.from({ length: i }, (_, k) => k) });
      while (j > 0 && a[j - 1] > a[j]) {
        steps.push({ arr: [...a], comparing: [j - 1, j], swapped: false, sorted: [] });
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        steps.push({ arr: [...a], comparing: [j - 1, j], swapped: true, sorted: [] });
        j--;
      }
    }
    steps.push({ arr: [...a], comparing: [], swapped: false, sorted: a.map((_, i) => i) });
  } else if (algoName === "Merge Sort") {
    const mergeSteps = [];
    function mergeSort(arr, l, r) {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      mergeSort(arr, l, m);
      mergeSort(arr, m + 1, r);
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < left.length && j < right.length) {
        mergeSteps.push({ arr: [...arr], comparing: [l + i, m + 1 + j], swapped: false, sorted: [] });
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
        mergeSteps.push({ arr: [...arr], comparing: [], swapped: true, sorted: [] });
      }
      while (i < left.length) arr[k++] = left[i++];
      while (j < right.length) arr[k++] = right[j++];
    }
    mergeSort(a, 0, a.length - 1);
    steps.push(...mergeSteps);
    steps.push({ arr: [...a], comparing: [], swapped: false, sorted: a.map((_, i) => i) });
  } else {
    // Quick Sort
    function partition(arr, lo, hi) {
      const pivot = arr[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        steps.push({ arr: [...arr], comparing: [j, hi], swapped: false, sorted: [] });
        if (arr[j] <= pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          if (i !== j) steps.push({ arr: [...arr], comparing: [i, j], swapped: true, sorted: [] });
        }
      }
      [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
      steps.push({ arr: [...arr], comparing: [], swapped: true, sorted: [i + 1] });
      return i + 1;
    }
    function quickSort(arr, lo, hi) {
      if (lo < hi) {
        const p = partition(arr, lo, hi);
        quickSort(arr, lo, p - 1);
        quickSort(arr, p + 1, hi);
      }
    }
    quickSort(a, 0, a.length - 1);
    steps.push({ arr: [...a], comparing: [], swapped: false, sorted: a.map((_, i) => i) });
  }
  return steps;
}

function generateSearchSteps(algoName, arr, target) {
  const steps = [];
  if (algoName === "Linear Search") {
    for (let i = 0; i < arr.length; i++) {
      steps.push({ arr: [...arr], current: i, found: arr[i] === target ? i : -1, lo: -1, hi: -1, mid: -1 });
      if (arr[i] === target) break;
    }
  } else if (algoName === "Binary Search") {
    const sorted = [...arr].sort((a, b) => a - b);
    let lo = 0, hi = sorted.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      steps.push({ arr: sorted, current: -1, found: sorted[mid] === target ? mid : -1, lo, hi, mid });
      if (sorted[mid] === target) break;
      else if (sorted[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return steps;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ComplexityVisualizer() {
  const [activeTab, setActiveTab] = useState("chart");
  const [selectedAlgo, setSelectedAlgo] = useState(ALGORITHMS[0]);
  const [activeLines, setActiveLines] = useState(["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"]);
  const [inputN, setInputN] = useState(16);
  const [animProgress, setAnimProgress] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sortArr, setSortArr] = useState(() => Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 10));
  const [sortSteps, setSortSteps] = useState([]);
  const [sortStep, setSortStep] = useState(0);
  const [isSortRunning, setIsSortRunning] = useState(false);
  const [sortSpeed, setSortSpeed] = useState(120);
  const [searchTarget, setSearchTarget] = useState(42);
  const [searchSteps, setSearchSteps] = useState([]);
  const [searchStep, setSearchStep] = useState(0);
  const [isSearchRunning, setIsSearchRunning] = useState(false);
  const [algoCategory, setAlgoCategory] = useState("All");
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const sortTimerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const N_POINTS = 40;

  // ── Chart animation ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimating) { setAnimProgress(1); return; }
    let start = null;
    const duration = 1200;
    function frame(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimProgress(p);
      if (p < 1) animRef.current = requestAnimationFrame(frame);
      else setIsAnimating(false);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimating, activeLines]);

  // ── Draw chart ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const PAD = { top: 28, right: 24, bottom: 44, left: 54 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, W, H);

    const active = COMPLEXITIES.filter((c) => activeLines.includes(c.label));
    let maxY = 1;
    active.forEach(({ fn }) => {
      for (let i = 1; i <= N_POINTS; i++) maxY = Math.max(maxY, fn(i));
    });

    // Grid
    ctx.strokeStyle = "#161616";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PAD.top + (cH / 5) * i;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke();
      const val = maxY - (maxY / 5) * i;
      ctx.fillStyle = "#333";
      ctx.font = `10px monospace`;
      ctx.textAlign = "right";
      ctx.fillText(val >= 1e6 ? (val / 1e6).toFixed(0) + "M" : val >= 1e3 ? (val / 1e3).toFixed(0) + "K" : Math.round(val), PAD.left - 6, y + 3);
    }
    for (let i = 0; i <= 5; i++) {
      const x = PAD.left + (cW / 5) * i;
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + cH); ctx.stroke();
      ctx.fillStyle = "#333"; ctx.textAlign = "center";
      ctx.fillText(Math.round((N_POINTS / 5) * i), x, PAD.top + cH + 16);
    }

    // Axes
    ctx.strokeStyle = "#2a2a2a"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, PAD.top + cH);
    ctx.lineTo(PAD.left + cW, PAD.top + cH); ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#3a3a3a"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("n (input size)", PAD.left + cW / 2, H - 6);
    ctx.save(); ctx.translate(14, PAD.top + cH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("operations", 0, 0); ctx.restore();

    // Draw n cursor line
    const nx = PAD.left + ((inputN - 1) / (N_POINTS - 1)) * cW;
    ctx.strokeStyle = "#ffffff18"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(nx, PAD.top); ctx.lineTo(nx, PAD.top + cH); ctx.stroke();
    ctx.setLineDash([]);

    // Draw curves
    const drawCount = Math.round(N_POINTS * animProgress);
    active.forEach(({ fn, color, glow, label }) => {
      if (drawCount < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      for (let i = 1; i <= drawCount; i++) {
        const x = PAD.left + ((i - 1) / (N_POINTS - 1)) * cW;
        const y = PAD.top + cH - (Math.min(fn(i), maxY) / maxY) * cH;
        i === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // End dot
      if (drawCount >= N_POINTS) {
        const lx = PAD.left + cW;
        const ly = PAD.top + cH - (Math.min(fn(N_POINTS), maxY) / maxY) * cH;
        ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
    });

    // n value dots on curves
    if (animProgress === 1) {
      active.forEach(({ fn, color }) => {
        const x = PAD.left + ((inputN - 1) / (N_POINTS - 1)) * cW;
        const y = PAD.top + cH - (Math.min(fn(inputN), maxY) / maxY) * cH;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
      });
    }
  }, [activeLines, animProgress, inputN]);

  // ── Sort animation ───────────────────────────────────────────────
  const runSort = useCallback(() => {
    const canSort = ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"].includes(selectedAlgo.name);
    if (!canSort) return;
    const arr = Array.from({ length: 20 }, () => Math.floor(Math.random() * 90) + 10);
    setSortArr(arr);
    const steps = generateSortSteps(selectedAlgo.name, arr);
    setSortSteps(steps);
    setSortStep(0);
    setIsSortRunning(true);
  }, [selectedAlgo]);

  useEffect(() => {
    if (!isSortRunning || sortSteps.length === 0) return;
    if (sortStep >= sortSteps.length) { setIsSortRunning(false); return; }
    sortTimerRef.current = setTimeout(() => {
      setSortArr(sortSteps[sortStep].arr);
      setSortStep((s) => s + 1);
    }, sortSpeed);
    return () => clearTimeout(sortTimerRef.current);
  }, [isSortRunning, sortStep, sortSteps, sortSpeed]);

  // ── Search animation ─────────────────────────────────────────────
  const runSearch = useCallback(() => {
    const canSearch = ["Linear Search", "Binary Search"].includes(selectedAlgo.name);
    if (!canSearch) return;
    const arr = Array.from({ length: 18 }, (_, i) => i * 5 + 5);
    const target = arr[Math.floor(Math.random() * arr.length)];
    setSearchTarget(target);
    const steps = generateSearchSteps(selectedAlgo.name, arr, target);
    setSearchSteps(steps);
    setSearchStep(0);
    setIsSearchRunning(true);
  }, [selectedAlgo]);

  useEffect(() => {
    if (!isSearchRunning || searchSteps.length === 0) return;
    if (searchStep >= searchSteps.length) { setIsSearchRunning(false); return; }
    searchTimerRef.current = setTimeout(() => {
      setSearchStep((s) => s + 1);
    }, 600);
    return () => clearTimeout(searchTimerRef.current);
  }, [isSearchRunning, searchStep, searchSteps]);

  const currentSortStep = sortSteps[sortStep - 1];
  const currentSearchStep = searchSteps[searchStep - 1];

  const getColor = (label) => COMPLEXITIES.find((c) => c.label === label)?.color || "#ff9800";

  const computeOps = (fn, n) => {
    const v = fn(n);
    if (v >= 1e12) return ">1T";
    if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return Math.round(v).toLocaleString();
  };

  const categories = ["All", ...new Set(ALGORITHMS.map((a) => a.category))];
  const filteredAlgos = algoCategory === "All" ? ALGORITHMS : ALGORITHMS.filter((a) => a.category === algoCategory);

  const canRunSort = ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"].includes(selectedAlgo.name);
  const canRunSearch = ["Linear Search", "Binary Search"].includes(selectedAlgo.name);

  return (
    <div style={S.root}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.sideHeader}>
          <div style={S.logoMark}>Σ</div>
          <div>
            <div style={S.sideTitle}>BigO</div>
            <div style={S.sideSubtitle}>Visualizer</div>
          </div>
        </div>

        <div style={S.sideSection}>
          <div style={S.sideLabel}>Filter</div>
          <div style={S.catWrap}>
            {categories.map((c) => (
              <button key={c} onClick={() => setAlgoCategory(c)}
                style={{ ...S.catBtn, ...(algoCategory === c ? S.catBtnActive : {}) }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={S.sideSection}>
          <div style={S.sideLabel}>Algorithms</div>
          <div style={S.algoList}>
            {filteredAlgos.map((a) => (
              <button key={a.name} onClick={() => { setSelectedAlgo(a); setSortStep(0); setIsSortRunning(false); setSearchStep(0); setIsSearchRunning(false); }}
                style={{ ...S.algoBtn, ...(selectedAlgo.name === a.name ? S.algoBtnActive : {}) }}>
                <div style={S.algoBtnName}>{a.name}</div>
                <div style={S.algoBtnBadges}>
                  <span style={{ ...S.badge, color: getColor(a.time), borderColor: getColor(a.time) + "40" }}>T:{a.time}</span>
                  <span style={{ ...S.badge, color: "#888", borderColor: "#333" }}>S:{a.space}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {/* Top nav */}
        <div style={S.topBar}>
          <div style={S.tabs}>
            {["chart", "animate", "analyze", "reference"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={S.selectedInfo}>
            <span style={{ color: "#555" }}>Selected:</span>{" "}
            <span style={{ color: "#ff9800", fontWeight: 700 }}>{selectedAlgo.name}</span>
          </div>
        </div>

        {/* ── CHART TAB ── */}
        {activeTab === "chart" && (
          <div style={S.content}>
            <div style={S.row}>
              <div style={{ ...S.card, flex: 3 }}>
                <div style={S.cardHead}>
                  <span style={S.cardTitle}>Growth Curves</span>
                  <button onClick={() => setIsAnimating(true)} style={S.actionBtn}>▶ Animate</button>
                </div>
                <canvas ref={canvasRef} style={S.canvas} />
                <div style={S.legend}>
                  {COMPLEXITIES.map(({ label, color }) => (
                    <button key={label} onClick={() => {
                      setActiveLines((p) => p.includes(label) ? p.filter((l) => l !== label) : [...p, label]);
                      setIsAnimating(true);
                    }} style={{ ...S.legendBtn, borderColor: activeLines.includes(label) ? color + "80" : "#1e1e1e", opacity: activeLines.includes(label) ? 1 : 0.3 }}>
                      <span style={{ ...S.dot, background: color }} />{label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...S.card, flex: 1, minWidth: 200 }}>
                <div style={S.cardTitle}>At n = {inputN}</div>
                <input type="range" min={1} max={40} value={inputN}
                  onChange={(e) => setInputN(+e.target.value)} style={S.slider} />
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {COMPLEXITIES.filter((c) => activeLines.includes(c.label)).map(({ label, color, fn }) => (
                    <div key={label} style={S.opsRow}>
                      <span style={{ color, fontWeight: 700, fontSize: 11, width: 74 }}>{label}</span>
                      <span style={S.opsVal}>{computeOps(fn, inputN)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complexity cards */}
            <div style={S.complexityGrid}>
              {COMPLEXITIES.map(({ label, color, desc, rating, ratingLabel }) => (
                <div key={label} onClick={() => {
                  setActiveLines((p) => p.includes(label) ? p.filter((l) => l !== label) : [...p, label]);
                  setIsAnimating(true);
                }} style={{ ...S.cCard, borderColor: activeLines.includes(label) ? color + "50" : "#1a1a1a", cursor: "pointer" }}>
                  <div style={{ color, fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>{label}</div>
                  <div style={{ ...S.ratingDots, marginTop: 4 }}>
                    {"●".repeat(rating)}<span style={{ color: "#333" }}>{"●".repeat(5 - rating)}</span>
                  </div>
                  <div style={{ color: "#555", fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
                  <div style={{ color, fontSize: 10, marginTop: 6, fontWeight: 600 }}>{ratingLabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANIMATE TAB ── */}
        {activeTab === "animate" && (
          <div style={S.content}>
            <div style={S.card}>
              <div style={S.cardHead}>
                <div>
                  <div style={S.cardTitle}>{selectedAlgo.name} — Live Visualization</div>
                  <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>{selectedAlgo.description}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {canRunSort && (
                    <>
                      <span style={{ color: "#444", fontSize: 11 }}>Speed</span>
                      <input type="range" min={30} max={400} value={400 - sortSpeed + 30}
                        onChange={(e) => setSortSpeed(400 - +e.target.value + 30)} style={{ ...S.slider, width: 80 }} />
                      <button onClick={runSort} disabled={isSortRunning} style={{ ...S.actionBtn, opacity: isSortRunning ? 0.5 : 1 }}>
                        {isSortRunning ? "Sorting…" : "▶ Run Sort"}
                      </button>
                    </>
                  )}
                  {canRunSearch && (
                    <button onClick={runSearch} disabled={isSearchRunning} style={{ ...S.actionBtn, opacity: isSearchRunning ? 0.5 : 1 }}>
                      {isSearchRunning ? "Searching…" : "▶ Run Search"}
                    </button>
                  )}
                  {!canRunSort && !canRunSearch && (
                    <span style={{ color: "#444", fontSize: 12 }}>Select a Sort or Search algorithm to animate</span>
                  )}
                </div>
              </div>

              {/* Sort bars */}
              {canRunSort && (
                <div>
                  <div style={S.barsWrap}>
                    {sortArr.map((v, i) => {
                      const isComparing = currentSortStep?.comparing?.includes(i);
                      const isSorted = currentSortStep?.sorted?.includes(i) || sortStep >= sortSteps.length;
                      const isSwapped = isComparing && currentSortStep?.swapped;
                      const color = isSorted ? "#00e676" : isSwapped ? "#ff3d00" : isComparing ? "#ff9800" : "#2a2a2a";
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                          <div style={{ fontSize: 9, color: isComparing ? "#ff9800" : "#333" }}>{v}</div>
                          <div style={{
                            width: "100%", background: color, borderRadius: 3,
                            height: `${(v / 99) * 160}px`,
                            transition: `height 0.1s, background 0.15s`,
                            boxShadow: isComparing ? `0 0 8px ${color}` : "none",
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  {sortStep > 0 && (
                    <div style={S.stepInfo}>
                      Step {sortStep} / {sortSteps.length} —{" "}
                      {currentSortStep?.swapped ? <span style={{ color: "#ff3d00" }}>Swapped</span> : <span style={{ color: "#ff9800" }}>Comparing</span>}
                      {currentSortStep?.comparing?.length > 0 && <span style={{ color: "#555" }}> indices [{currentSortStep.comparing.join(", ")}]</span>}
                    </div>
                  )}
                  {sortStep === 0 && <div style={{ color: "#333", fontSize: 12, textAlign: "center", marginTop: 40 }}>Press "Run Sort" to start the animation</div>}
                </div>
              )}

              {/* Search visualization */}
              {canRunSearch && (
                <div>
                  {searchStep > 0 && currentSearchStep ? (
                    <div>
                      <div style={{ color: "#555", fontSize: 11, marginBottom: 12 }}>
                        Searching for <span style={{ color: "#ff9800", fontWeight: 700 }}>{searchTarget}</span>
                        {selectedAlgo.name === "Binary Search" && currentSearchStep.lo >= 0 && (
                          <span style={{ color: "#444" }}> — range [{currentSearchStep.lo}, {currentSearchStep.hi}]</span>
                        )}
                      </div>
                      <div style={S.searchRow}>
                        {currentSearchStep.arr.map((v, i) => {
                          const isMid = i === currentSearchStep.mid;
                          const isCurrent = i === currentSearchStep.current;
                          const isFound = i === currentSearchStep.found;
                          const isInRange = selectedAlgo.name === "Binary Search" && i >= currentSearchStep.lo && i <= currentSearchStep.hi;
                          const bg = isFound ? "#00e67620" : isMid || isCurrent ? "#ff980020" : isInRange ? "#ff980008" : "#111";
                          const border = isFound ? "#00e676" : isMid || isCurrent ? "#ff9800" : isInRange ? "#ff980030" : "#1e1e1e";
                          return (
                            <div key={i} style={{ ...S.searchCell, background: bg, borderColor: border, boxShadow: (isMid || isCurrent || isFound) ? `0 0 10px ${border}60` : "none" }}>
                              <div style={{ fontSize: 9, color: "#444", marginBottom: 2 }}>{i}</div>
                              <div style={{ fontWeight: 700, color: isFound ? "#00e676" : isMid || isCurrent ? "#ff9800" : "#666" }}>{v}</div>
                              {isMid && <div style={{ fontSize: 8, color: "#ff9800", marginTop: 2 }}>mid</div>}
                              {isFound && <div style={{ fontSize: 8, color: "#00e676", marginTop: 2 }}>✓</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={S.stepInfo}>
                        Step {searchStep} / {searchSteps.length}
                        {currentSearchStep.found >= 0 && <span style={{ color: "#00e676", marginLeft: 8 }}>Found at index {currentSearchStep.found}!</span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#333", fontSize: 12, textAlign: "center", marginTop: 40 }}>Press "Run Search" to start the animation</div>
                  )}
                </div>
              )}

              {!canRunSort && !canRunSearch && (
                <div style={{ color: "#2a2a2a", fontSize: 14, textAlign: "center", marginTop: 60, lineHeight: 2 }}>
                  Animation available for:<br />
                  <span style={{ color: "#444" }}>Bubble Sort · Insertion Sort · Merge Sort · Quick Sort · Linear Search · Binary Search</span>
                </div>
              )}
            </div>

            {/* Steps breakdown */}
            <div style={S.card}>
              <div style={S.cardTitle}>How it works — {selectedAlgo.name}</div>
              <div style={S.stepsRow}>
                {selectedAlgo.steps.map((step, i) => (
                  <div key={i} style={S.stepBox}>
                    <div style={S.stepNum}>{i + 1}</div>
                    <div style={S.stepText}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYZE TAB ── */}
        {activeTab === "analyze" && (
          <div style={S.content}>
            <div style={S.card}>
              <div style={S.cardTitle}>Algorithm Comparison Table</div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {["Algorithm", "Category", "Time", "Space", "Best", "Avg", "Worst", "Rating"].map((h) => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALGORITHMS.map((a, i) => {
                      const c = COMPLEXITIES.find((x) => x.label === a.time) || COMPLEXITIES[3];
                      return (
                        <tr key={i} onClick={() => setSelectedAlgo(a)}
                          style={{ ...S.tr, background: selectedAlgo.name === a.name ? "#1a1200" : i % 2 === 0 ? "#0d0d0d" : "#0a0a0a", cursor: "pointer" }}>
                          <td style={{ ...S.td, color: selectedAlgo.name === a.name ? "#ff9800" : "#ccc", fontWeight: selectedAlgo.name === a.name ? 700 : 400 }}>{a.name}</td>
                          <td style={{ ...S.td, color: "#444" }}>{a.category}</td>
                          <td style={S.td}><span style={{ ...S.pill, color: getColor(a.time), borderColor: getColor(a.time) + "40" }}>{a.time}</span></td>
                          <td style={S.td}><span style={{ ...S.pill, color: "#888", borderColor: "#333" }}>{a.space}</span></td>
                          <td style={S.td}><span style={{ ...S.pill, color: getColor(a.time), borderColor: getColor(a.time) + "30" }}>{a.time}</span></td>
                          <td style={S.td}><span style={{ ...S.pill, color: getColor(a.time), borderColor: getColor(a.time) + "30" }}>{a.time}</span></td>
                          <td style={S.td}><span style={{ ...S.pill, color: "#ff3d00", borderColor: "#ff3d0030" }}>{a.time === "O(n log n)" ? "O(n²)" : a.time}</span></td>
                          <td style={S.td}>
                            <span style={{ color: getColor(a.time) }}>
                              {"●".repeat(c.rating)}<span style={{ color: "#2a2a2a" }}>{"●".repeat(5 - c.rating)}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected detail */}
            <div style={S.row}>
              <div style={{ ...S.card, flex: 1 }}>
                <div style={S.cardTitle}>{selectedAlgo.name}</div>
                <div style={{ color: "#555", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{selectedAlgo.description}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={S.detailBadge}><span style={{ color: "#555" }}>Time</span> <span style={{ color: getColor(selectedAlgo.time) }}>{selectedAlgo.time}</span></div>
                  <div style={S.detailBadge}><span style={{ color: "#555" }}>Space</span> <span style={{ color: "#ff9800" }}>{selectedAlgo.space}</span></div>
                </div>
                <div style={S.codeBlock}>
                  <pre style={{ margin: 0, color: "#888", fontSize: 11, lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {selectedAlgo.code}
                  </pre>
                </div>
              </div>

              <div style={{ ...S.card, flex: 1 }}>
                <div style={S.cardTitle}>Ops at n = {inputN}</div>
                <input type="range" min={1} max={40} value={inputN}
                  onChange={(e) => setInputN(+e.target.value)} style={S.slider} />
                <div style={{ marginTop: 16 }}>
                  {COMPLEXITIES.map(({ label, color, fn, ratingLabel }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ color, fontWeight: 700, fontSize: 11, width: 80, fontFamily: "monospace" }}>{label}</span>
                      <div style={{ flex: 1, height: 4, background: "#111", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min((fn(inputN) / fn(40)) * 100, 100)}%`, background: color, borderRadius: 2, transition: "width 0.3s", boxShadow: `0 0 6px ${color}80` }} />
                      </div>
                      <span style={{ color: "#555", fontSize: 11, width: 50, textAlign: "right" }}>{computeOps(fn, inputN)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REFERENCE TAB ── */}
        {activeTab === "reference" && (
          <div style={S.content}>
            <div style={S.row}>
              <div style={{ ...S.card, flex: 1 }}>
                <div style={S.cardTitle}>Complexity Hierarchy</div>
                {COMPLEXITIES.map(({ label, color, desc, rating, ratingLabel }) => (
                  <div key={label} style={S.hierRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color, fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>{label}</span>
                      <span style={{ color, fontSize: 11 }}>{ratingLabel}</span>
                    </div>
                    <div style={{ height: 4, background: "#111", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${(rating / 5) * 100}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 2, boxShadow: `0 0 6px ${color}60` }} />
                    </div>
                    <div style={{ color: "#444", fontSize: 10 }}>{desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={S.card}>
                  <div style={S.cardTitle}>Quick Reference</div>
                  {[
                    { c: "O(1)", ex: "Array index, hash lookup, stack push/pop" },
                    { c: "O(log n)", ex: "Binary search, balanced BST ops" },
                    { c: "O(√n)", ex: "Sieve of Eratosthenes, some number theory" },
                    { c: "O(n)", ex: "Linear scan, single loop, prefix sum" },
                    { c: "O(n log n)", ex: "Merge sort, heap sort, FFT" },
                    { c: "O(n²)", ex: "Bubble/Insertion sort, nested loops" },
                    { c: "O(n³)", ex: "Floyd-Warshall, naive matrix multiply" },
                    { c: "O(2ⁿ)", ex: "Fibonacci naive, power set, TSP brute" },
                  ].map(({ c, ex }) => (
                    <div key={c} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #111" }}>
                      <span style={{ color: getColor(c), fontWeight: 700, fontFamily: "monospace", fontSize: 12, width: 80, flexShrink: 0 }}>{c}</span>
                      <span style={{ color: "#444", fontSize: 11 }}>{ex}</span>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}>Space vs Time Trade-offs</div>
                  {[
                    { name: "Memoization", time: "O(n)", space: "O(n)", note: "Cache results to avoid recomputation" },
                    { name: "Lookup Table", time: "O(1)", space: "O(n)", note: "Pre-compute answers for instant access" },
                    { name: "In-place Sort", time: "O(n²)", space: "O(1)", note: "Save memory at cost of more ops" },
                    { name: "Aux Sort", time: "O(n log n)", space: "O(n)", note: "Use memory to achieve optimal time" },
                  ].map((r) => (
                    <div key={r.name} style={{ padding: "8px 0", borderBottom: "1px solid #111" }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                        <span style={{ color: "#ccc", fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                        <span style={{ ...S.pill, color: getColor(r.time), borderColor: getColor(r.time) + "40" }}>T:{r.time}</span>
                        <span style={{ ...S.pill, color: "#888", borderColor: "#333" }}>S:{r.space}</span>
                      </div>
                      <div style={{ color: "#444", fontSize: 10 }}>{r.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  root: { display: "flex", height: "100vh", background: "#080808", color: "#ccc", fontFamily: "'Courier New', Courier, monospace", overflow: "hidden" },
  sidebar: { width: 240, background: "#0a0a0a", borderRight: "1px solid #141414", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
  sideHeader: { padding: "18px 16px", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 12 },
  logoMark: { width: 36, height: 36, background: "#ff980015", border: "1px solid #ff980040", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff9800", fontSize: 18, fontWeight: 900 },
  sideTitle: { color: "#ff9800", fontWeight: 900, fontSize: 16, lineHeight: 1 },
  sideSubtitle: { color: "#444", fontSize: 10, marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" },
  sideSection: { padding: "12px 12px 4px" },
  sideLabel: { fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 },
  catWrap: { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  catBtn: { background: "none", border: "1px solid #1a1a1a", color: "#444", fontFamily: "monospace", fontSize: 10, padding: "3px 8px", borderRadius: 4, cursor: "pointer" },
  catBtnActive: { background: "#ff980015", borderColor: "#ff980050", color: "#ff9800" },
  algoList: { display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", maxHeight: "calc(100vh - 260px)", paddingRight: 2 },
  algoBtn: { background: "none", border: "1px solid transparent", borderRadius: 6, padding: "8px 10px", cursor: "pointer", textAlign: "left", transition: "all 0.12s" },
  algoBtnActive: { background: "#ff980010", borderColor: "#ff980040" },
  algoBtnName: { color: "#ccc", fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: "monospace" },
  algoBtnBadges: { display: "flex", gap: 4 },
  badge: { fontSize: 9, border: "1px solid", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #141414", flexShrink: 0 },
  tabs: { display: "flex", gap: 2, background: "#0d0d0d", padding: 3, borderRadius: 8, border: "1px solid #181818" },
  tab: { background: "none", border: "none", color: "#444", fontFamily: "monospace", fontSize: 12, padding: "6px 16px", borderRadius: 6, cursor: "pointer" },
  tabActive: { background: "#ff980018", color: "#ff9800", border: "1px solid #ff980035" },
  selectedInfo: { fontSize: 12, color: "#555" },
  content: { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  card: { background: "#0d0d0d", border: "1px solid #181818", borderRadius: 10, padding: 16 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardTitle: { color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 },
  actionBtn: { background: "#ff980015", border: "1px solid #ff980050", color: "#ff9800", fontFamily: "monospace", fontSize: 11, padding: "5px 12px", borderRadius: 6, cursor: "pointer" },
  canvas: { width: "100%", height: 240, borderRadius: 6, display: "block" },
  legend: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 },
  legendBtn: { display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid", borderRadius: 5, padding: "4px 10px", cursor: "pointer", color: "#888", fontFamily: "monospace", fontSize: 11, transition: "all 0.12s" },
  dot: { width: 7, height: 7, borderRadius: "50%" },
  slider: { width: "100%", accentColor: "#ff9800", cursor: "pointer" },
  opsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #111" },
  opsVal: { color: "#666", fontSize: 12, fontFamily: "monospace" },
  complexityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 },
  cCard: { background: "#0d0d0d", border: "1px solid", borderRadius: 8, padding: 12, transition: "border-color 0.2s" },
  ratingDots: { fontSize: 10, color: "#ff9800" },
  barsWrap: { display: "flex", gap: 3, alignItems: "flex-end", height: 180, marginTop: 12, background: "#080808", borderRadius: 6, padding: "12px 8px 4px" },
  stepInfo: { fontSize: 11, color: "#555", marginTop: 10, textAlign: "center" },
  searchRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  searchCell: { border: "1px solid", borderRadius: 6, padding: "6px 8px", textAlign: "center", minWidth: 36, fontSize: 12, fontFamily: "monospace", transition: "all 0.2s" },
  stepsRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 },
  stepBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "10px 12px", flex: 1, minWidth: 100 },
  stepNum: { color: "#ff9800", fontWeight: 900, fontSize: 16, fontFamily: "monospace" },
  stepText: { color: "#555", fontSize: 11, marginTop: 4, lineHeight: 1.4 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", color: "#333", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 10px", borderBottom: "1px solid #1a1a1a" },
  tr: { transition: "background 0.1s" },
  td: { padding: "9px 10px", borderBottom: "1px solid #111", color: "#888", verticalAlign: "middle" },
  pill: { border: "1px solid", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontFamily: "monospace", fontWeight: 700 },
  detailBadge: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "6px 12px", fontSize: 12, display: "flex", gap: 6 },
  codeBlock: { background: "#080808", border: "1px solid #1a1a1a", borderRadius: 6, padding: "14px 16px", overflowX: "auto" },
  hierRow: { marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #111" },
};