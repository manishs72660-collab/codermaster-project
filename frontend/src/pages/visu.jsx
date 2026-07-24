import { useState, useRef, useEffect, useCallback } from "react";
import { NavLink } from "react-router";

// ─── Utilities ────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── CodeMaster Color Palette ─────────────────────────────────────────────────
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
  accentBdr: "#3a2e0f",
  green:     "#00b86b",
  greenDim:  "#0f2a1a",
  greenBdr:  "#1a3a2a",
  red:       "#ff4444",
  redDim:    "#1a0808",
  redBdr:    "#3a1a1a",
  blue:      "#4493f8",
  blueDim:   "#0a1220",
  blueBdr:   "#1c2a3a",
  purple:    "#c084fc",
  purpleDim: "#120d1e",
  purpleBdr: "#2a1a3a",
  teal:      "#2dd4bf",
};

const ALG_COLORS = {
  default:   CM.border2,
  active:    CM.accent,
  comparing: CM.blue,
  sorted:    CM.green,
  pivot:     CM.red,
  found:     CM.purple,
  visited:   CM.teal,
  path:      CM.accent,
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function CMButton({ onClick, disabled, children, variant = "default", style = {} }) {
  const variants = {
    default:  { background: CM.surface2, color: CM.text,   border: `1px solid ${CM.border2}` },
    accent:   { background: CM.accent,   color: "#0d1117", border: "none" },
    green:    { background: CM.greenDim, color: CM.green,  border: `1px solid ${CM.greenBdr}` },
    red:      { background: CM.redDim,   color: CM.red,    border: `1px solid ${CM.redBdr}` },
    blue:     { background: CM.blueDim,  color: CM.blue,   border: `1px solid ${CM.blueBdr}` },
    purple:   { background: CM.purpleDim,color: CM.purple, border: `1px solid ${CM.purpleBdr}` },
  };
  const v = variants[variant] || variants.default;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v, borderRadius: 7, padding: "6px 14px",
      fontSize: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'JetBrains Mono', monospace",
      opacity: disabled ? 0.45 : 1, transition: "all 0.15s",
      letterSpacing: 0.3, ...style,
    }}>{children}</button>
  );
}

function CMSelect({ value, onChange, options, disabled }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{
      background: CM.surface2, color: CM.text, border: `1px solid ${CM.border2}`,
      borderRadius: 7, padding: "6px 12px", fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", outline: "none",
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CMInput({ value, onChange, placeholder, width = 80 }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        background: CM.surface2, color: CM.text, border: `1px solid ${CM.border2}`,
        borderRadius: 7, padding: "6px 10px", fontSize: 12, width,
        fontFamily: "'JetBrains Mono', monospace", outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = CM.accent}
      onBlur={e => e.target.style.borderColor = CM.border2}
    />
  );
}

function Badge({ label, color, bg, bdr }) {
  return (
    <span style={{
      background: bg || color + "18", color,
      border: `1px solid ${bdr || color + "40"}`,
      borderRadius: 20, padding: "2px 10px",
      fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: 0.3,
    }}>{label}</span>
  );
}

function SectionLabel({ children, color = CM.accent }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
    }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
        color: CM.dim,
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: CM.border }} />
    </div>
  );
}

// ─── Bar (sorting/searching) ──────────────────────────────────────────────────
function Bar({ value, max, color, width = 26 }) {
  const h = Math.max(6, Math.round((value / max) * 200));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 9, color: CM.dim, fontFamily: "'JetBrains Mono',monospace" }}>{value}</span>
      <div style={{
        width, height: h,
        background: color || ALG_COLORS.default,
        borderRadius: "3px 3px 0 0",
        transition: "background 0.2s, height 0.15s",
        boxShadow: color && color !== ALG_COLORS.default ? `0 0 8px ${color}55` : "none",
      }} />
    </div>
  );
}

// ─── Code View ────────────────────────────────────────────────────────────────
function CodeView({ lines, highlight, title }) {
  return (
    <div style={{ background: CM.bg, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
      {title && (
        <div style={{
          background: CM.surface, borderBottom: `1px solid ${CM.border}`,
          padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase" }}>
            Pseudocode
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.accent }}>{title}</span>
        </div>
      )}
      <div style={{ padding: "12px 4px", maxHeight: 190, overflowY: "auto" }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, alignItems: "center",
            padding: "2px 12px", borderRadius: 4,
            background: highlight === i ? CM.blueDim : "transparent",
            borderLeft: highlight === i ? `2px solid ${CM.blue}` : "2px solid transparent",
            transition: "background 0.2s",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
            <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 1.7, margin: 0, color: highlight === i ? CM.blue : CM.muted, whiteSpace: "pre" }}>{line}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Complexity Table ─────────────────────────────────────────────────────────
function ComplexityCard({ rows, title }) {
  return (
    <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "9px 14px", borderBottom: `1px solid ${CM.border}`, background: CM.bg }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase" }}>{title || "Complexity"}</span>
      </div>
      {rows.map(([op, c, color]) => (
        <div key={op} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 14px", borderBottom: `1px solid ${CM.border}`,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.muted }}>{op}</span>
          <Badge label={c} color={color || CM.blue} />
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ items }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {items.map(([label, color]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: CM.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}88` }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── SORTING ALGORITHMS ───────────────────────────────────────────────────────
const SORT_ALGOS = {
  "Bubble Sort": {
    code: ["for i in range(n):","  for j in range(n-i-1):","    if arr[j] > arr[j+1]:","      swap(arr[j], arr[j+1])"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n)", stable: true },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],n=a.length,cols=Array(n).fill(ALG_COLORS.default);
      for(let i=0;i<n;i++){
        for(let j=0;j<n-i-1;j++){
          cols[j]=ALG_COLORS.comparing;cols[j+1]=ALG_COLORS.comparing;
          setColors([...cols]);await sleep(speed);
          if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];setArr([...a]);}
          cols[j]=ALG_COLORS.default;cols[j+1]=ALG_COLORS.default;
        }
        cols[n-i-1]=ALG_COLORS.sorted;
      }
      setColors([...cols]);
    }
  },
  "Selection Sort": {
    code: ["for i in range(n):","  min_idx = i","  for j in range(i+1, n):","    if arr[j] < arr[min_idx]: min_idx=j","  swap(arr[i], arr[min_idx])"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n²)", stable: false },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],n=a.length,cols=Array(n).fill(ALG_COLORS.default);
      for(let i=0;i<n-1;i++){
        let mi=i;cols[mi]=ALG_COLORS.active;setColors([...cols]);
        for(let j=i+1;j<n;j++){
          cols[j]=ALG_COLORS.comparing;setColors([...cols]);await sleep(speed);
          if(a[j]<a[mi]){cols[mi]=ALG_COLORS.default;mi=j;cols[j]=ALG_COLORS.active;}
          else cols[j]=ALG_COLORS.default;
        }
        [a[i],a[mi]]=[a[mi],a[i]];setArr([...a]);
        cols[mi]=ALG_COLORS.default;cols[i]=ALG_COLORS.sorted;setColors([...cols]);await sleep(speed);
      }
      cols[n-1]=ALG_COLORS.sorted;setColors([...cols]);
    }
  },
  "Insertion Sort": {
    code: ["for i in range(1, n):","  key = arr[i]; j = i-1","  while j>=0 and arr[j]>key:","    arr[j+1]=arr[j]; j-=1","  arr[j+1] = key"],
    complexity: { time: "O(n²)", space: "O(1)", best: "O(n)", stable: true },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],n=a.length,cols=Array(n).fill(ALG_COLORS.default);
      for(let i=1;i<n;i++){
        let key=a[i],j=i-1;cols[i]=ALG_COLORS.active;
        while(j>=0&&a[j]>key){
          cols[j]=ALG_COLORS.comparing;setColors([...cols]);setArr([...a]);await sleep(speed);
          a[j+1]=a[j];cols[j+1]=ALG_COLORS.default;j--;
        }
        a[j+1]=key;setArr([...a]);cols[i]=ALG_COLORS.default;
        for(let k=0;k<=j+1;k++)cols[k]=ALG_COLORS.sorted;
        setColors([...cols]);await sleep(speed);
      }
      cols.fill(ALG_COLORS.sorted);setColors([...cols]);
    }
  },
  "Quick Sort": {
    code: ["def quicksort(arr, lo, hi):","  if lo < hi:","    pivot = arr[hi]; i = lo-1","    for j in range(lo, hi):","      if arr[j]<=pivot: i++; swap(i,j)","    swap(i+1, hi)","    quicksort(lo, i); quicksort(i+2, hi)"],
    complexity: { time: "O(n log n)", space: "O(log n)", best: "O(n log n)", stable: false },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],cols=Array(a.length).fill(ALG_COLORS.default);
      async function qs(lo,hi){
        if(lo>=hi){if(lo===hi)cols[lo]=ALG_COLORS.sorted;setColors([...cols]);return;}
        let pivot=a[hi];cols[hi]=ALG_COLORS.pivot;setColors([...cols]);
        let i=lo-1;
        for(let j=lo;j<hi;j++){
          cols[j]=ALG_COLORS.comparing;setColors([...cols]);await sleep(speed);
          if(a[j]<=pivot){i++;[a[i],a[j]]=[a[j],a[i]];setArr([...a]);}
          cols[j]=ALG_COLORS.default;
        }
        [a[i+1],a[hi]]=[a[hi],a[i+1]];setArr([...a]);
        cols[i+1]=ALG_COLORS.sorted;cols[hi]=ALG_COLORS.default;setColors([...cols]);await sleep(speed);
        await qs(lo,i);await qs(i+2,hi);
      }
      await qs(0,a.length-1);cols.fill(ALG_COLORS.sorted);setColors([...cols]);
    }
  },
  "Merge Sort": {
    code: ["def mergesort(arr, l, r):","  if l < r:","    m = (l+r)//2","    mergesort(arr, l, m)","    mergesort(arr, m+1, r)","    merge(arr, l, m, r)"],
    complexity: { time: "O(n log n)", space: "O(n)", best: "O(n log n)", stable: true },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],cols=Array(a.length).fill(ALG_COLORS.default);
      async function merge(l,m,r){
        let left=a.slice(l,m+1),right=a.slice(m+1,r+1),i=0,j=0,k=l;
        while(i<left.length&&j<right.length){
          cols[k]=ALG_COLORS.comparing;setColors([...cols]);await sleep(speed);
          a[k++]=left[i]<=right[j]?left[i++]:right[j++];
          setArr([...a]);cols[k-1]=ALG_COLORS.active;
        }
        while(i<left.length){a[k++]=left[i++];setArr([...a]);await sleep(speed/2);}
        while(j<right.length){a[k++]=right[j++];setArr([...a]);await sleep(speed/2);}
        for(let x=l;x<=r;x++)cols[x]=ALG_COLORS.sorted;setColors([...cols]);
      }
      async function ms(l,r){
        if(l>=r)return;const m=Math.floor((l+r)/2);
        await ms(l,m);await ms(m+1,r);await merge(l,m,r);
      }
      await ms(0,a.length-1);cols.fill(ALG_COLORS.sorted);setColors([...cols]);
    }
  },
  "Heap Sort": {
    code: ["def heapify(arr, n, i):","  largest = i; l=2*i+1; r=2*i+2","  if l<n and arr[l]>arr[largest]: largest=l","  if r<n and arr[r]>arr[largest]: largest=r","  if largest!=i: swap(i,largest); heapify(n,largest)","for i in range(n//2-1,-1,-1): heapify(n,i)","for i in range(n-1,0,-1): swap(0,i); heapify(i,0)"],
    complexity: { time: "O(n log n)", space: "O(1)", best: "O(n log n)", stable: false },
    async run(arr, setColors, setArr, speed) {
      const a=[...arr],n=a.length,cols=Array(n).fill(ALG_COLORS.default);
      async function heapify(sz,i){
        let largest=i,l=2*i+1,r=2*i+2;
        if(l<sz&&a[l]>a[largest])largest=l;
        if(r<sz&&a[r]>a[largest])largest=r;
        if(largest!==i){
          cols[i]=ALG_COLORS.comparing;cols[largest]=ALG_COLORS.active;
          setColors([...cols]);await sleep(speed);
          [a[i],a[largest]]=[a[largest],a[i]];setArr([...a]);
          cols[i]=ALG_COLORS.default;cols[largest]=ALG_COLORS.default;
          await heapify(sz,largest);
        }
      }
      for(let i=Math.floor(n/2)-1;i>=0;i--)await heapify(n,i);
      for(let i=n-1;i>0;i--){
        [a[0],a[i]]=[a[i],a[0]];setArr([...a]);
        cols[i]=ALG_COLORS.sorted;cols[0]=ALG_COLORS.pivot;
        setColors([...cols]);await sleep(speed);
        cols[0]=ALG_COLORS.default;
        await heapify(i,0);
      }
      cols[0]=ALG_COLORS.sorted;setColors([...cols]);
    }
  },
};

// ─── SEARCH ALGORITHMS ────────────────────────────────────────────────────────
const SEARCH_ALGOS = {
  "Linear Search": {
    code: ["for i in range(n):","  if arr[i] == target: return i","return -1"],
    complexity: { time: "O(n)", space: "O(1)" },
    async run(arr, target, setColors, speed) {
      const cols=Array(arr.length).fill(ALG_COLORS.default);
      for(let i=0;i<arr.length;i++){
        cols[i]=ALG_COLORS.comparing;setColors([...cols]);await sleep(speed);
        if(arr[i]===target){cols[i]=ALG_COLORS.found;setColors([...cols]);return i;}
        cols[i]=ALG_COLORS.visited;
      }
      setColors([...cols]);return -1;
    }
  },
  "Binary Search": {
    code: ["lo, hi = 0, n-1","while lo <= hi:","  mid = (lo+hi)//2","  if arr[mid]==target: return mid","  elif arr[mid]<target: lo=mid+1","  else: hi=mid-1","return -1"],
    complexity: { time: "O(log n)", space: "O(1)" },
    note: "Auto-sorts for visualization",
    async run(arr, target, setColors, speed) {
      const sorted=[...arr].sort((a,b)=>a-b);
      const cols=Array(sorted.length).fill(ALG_COLORS.default);
      let lo=0,hi=sorted.length-1;
      while(lo<=hi){
        const mid=Math.floor((lo+hi)/2);
        cols.fill(ALG_COLORS.default);cols[mid]=ALG_COLORS.active;
        for(let i=lo;i<=hi;i++)if(i!==mid)cols[i]=ALG_COLORS.comparing;
        setColors([...cols]);await sleep(speed);
        if(sorted[mid]===target){cols[mid]=ALG_COLORS.found;setColors([...cols]);return mid;}
        else if(sorted[mid]<target)lo=mid+1;
        else hi=mid-1;
      }
      setColors([...cols]);return -1;
    }
  },
  "Jump Search": {
    code: ["step = √n; prev = 0","while arr[min(step,n)-1] < target:","  prev=step; step+=√n","  if prev>=n: return -1","while arr[prev] < target:","  prev++; if prev==min(step,n): return -1","if arr[prev]==target: return prev","return -1"],
    complexity: { time: "O(√n)", space: "O(1)" },
    note: "Requires sorted array",
    async run(arr, target, setColors, speed) {
      const sorted=[...arr].sort((a,b)=>a-b);
      const cols=Array(sorted.length).fill(ALG_COLORS.default);
      const n=sorted.length,step=Math.floor(Math.sqrt(n));
      let prev=0;
      while(sorted[Math.min(step,n)-1]<target){
        for(let i=prev;i<Math.min(step,n);i++){cols[i]=ALG_COLORS.visited;}
        setColors([...cols]);await sleep(speed);
        prev=step;
        if(prev>=n){setColors([...cols]);return -1;}
      }
      while(sorted[prev]<target){
        cols[prev]=ALG_COLORS.comparing;setColors([...cols]);await sleep(speed);
        prev++;
        if(prev===Math.min(step,n)){setColors([...cols]);return -1;}
      }
      if(sorted[prev]===target){cols[prev]=ALG_COLORS.found;setColors([...cols]);return prev;}
      setColors([...cols]);return -1;
    }
  },
};

// ─── LL NODE ─────────────────────────────────────────────────────────────────
function LLNodeBox({ val, active, isHead, isTail, hasNext }) {
  return (
    <div style={{ display: "flex", alignItems: "center", position: "relative", marginTop: 24 }}>
      {isHead && <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: CM.green, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>HEAD</div>}
      {isTail && <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: CM.blue, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>TAIL</div>}
      <div style={{
        width: 54, height: 46, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        border: `1.5px solid ${active ? CM.accent : CM.border2}`,
        background: active ? CM.accentDim : CM.surface2,
        color: active ? CM.accent : CM.text,
        fontWeight: 700, fontSize: 16, fontFamily: "'JetBrains Mono',monospace",
        boxShadow: active ? `0 0 12px ${CM.accent}44` : "none",
        transition: "all 0.2s",
      }}>{val}</div>
      {hasNext && (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 24, height: 2, background: CM.border2 }} />
          <div style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `8px solid ${CM.border2}` }} />
        </div>
      )}
    </div>
  );
}

// ─── STACK VIEW ───────────────────────────────────────────────────────────────
function StackView({ items, highlight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 4, minHeight: 160 }}>
      <div style={{ fontSize: 9, color: CM.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textAlign: "center", padding: "4px 0" }}>← TOP</div>
      {items.map((v, i) => (
        <div key={i} style={{
          padding: "8px 24px", borderRadius: 6, textAlign: "center",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600,
          background: highlight === i ? CM.accentDim : CM.surface2,
          border: `1.5px solid ${highlight === i ? CM.accent : CM.border}`,
          color: highlight === i ? CM.accent : CM.text,
          boxShadow: highlight === i ? `0 0 10px ${CM.accent}44` : "none",
          transition: "all 0.2s",
        }}>{v}</div>
      ))}
      {items.length === 0 && <div style={{ color: CM.dim, textAlign: "center", padding: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>empty</div>}
    </div>
  );
}

// ─── QUEUE VIEW ───────────────────────────────────────────────────────────────
function QueueView({ items, highlight }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", minHeight: 60 }}>
      <div style={{ fontSize: 9, color: CM.green, fontFamily: "'JetBrains Mono',monospace", marginRight: 4, letterSpacing: 1 }}>FRONT→</div>
      {items.map((v, i) => (
        <div key={i} style={{
          padding: "8px 18px", borderRadius: 6,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600,
          background: highlight === i ? CM.accentDim : CM.surface2,
          border: `1.5px solid ${highlight === i ? CM.accent : CM.border}`,
          color: highlight === i ? CM.accent : CM.text,
          boxShadow: highlight === i ? `0 0 10px ${CM.accent}44` : "none",
          transition: "all 0.2s",
        }}>{v}</div>
      ))}
      {items.length === 0 && <div style={{ color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>empty</div>}
      <div style={{ fontSize: 9, color: CM.red, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>←REAR</div>
    </div>
  );
}

// ─── BST ─────────────────────────────────────────────────────────────────────
function TreeNodeSVG({ node, highlight, x, y }) {
  if (!node) return null;
  const hit = highlight === node.val;
  return (
    <g>
      {node.left && (<><line x1={x} y1={y+18} x2={x-node.offset} y2={y+58} stroke={CM.border2} strokeWidth={1.5}/><TreeNodeSVG node={node.left} highlight={highlight} x={x-node.offset} y={y+62}/></>)}
      {node.right && (<><line x1={x} y1={y+18} x2={x+node.offset} y2={y+58} stroke={CM.border2} strokeWidth={1.5}/><TreeNodeSVG node={node.right} highlight={highlight} x={x+node.offset} y={y+62}/></>)}
      <circle cx={x} cy={y} r={20} fill={hit ? CM.accentDim : CM.surface2} stroke={hit ? CM.accent : CM.border2} strokeWidth={2}/>
      {hit && <circle cx={x} cy={y} r={20} fill="none" stroke={CM.accent} strokeWidth={1} opacity={0.4}/>}
      <text x={x} y={y+5} textAnchor="middle" fill={hit ? CM.accent : CM.text} fontSize={13} fontFamily="'JetBrains Mono',monospace" fontWeight={700}>{node.val}</text>
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

// ─── GRAPH ────────────────────────────────────────────────────────────────────
const GNODES = [
  { id:0,x:200,y:60 }, { id:1,x:90,y:160 }, { id:2,x:310,y:160 },
  { id:3,x:40,y:270 }, { id:4,x:155,y:270 }, { id:5,x:265,y:270 }, { id:6,x:370,y:270 },
];
const GEDGES = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];

function GraphSVG({ visited, current, path }) {
  return (
    <svg width="100%" viewBox="0 0 430 320" style={{ display: "block" }}>
      {GEDGES.map(([a,b],i) => {
        const inPath = path.includes(a) && path.includes(b);
        return <line key={i} x1={GNODES[a].x} y1={GNODES[a].y} x2={GNODES[b].x} y2={GNODES[b].y}
          stroke={inPath ? CM.accent : CM.border2} strokeWidth={inPath ? 2.5 : 1.5}/>;
      })}
      {GNODES.map(n => {
        const isCur = current === n.id;
        const isVis = visited.includes(n.id);
        const fill = isCur ? CM.accentDim : isVis ? CM.greenDim : CM.surface2;
        const stroke = isCur ? CM.accent : isVis ? CM.green : CM.border2;
        return (
          <g key={n.id}>
            {isCur && <circle cx={n.x} cy={n.y} r={26} fill="none" stroke={CM.accent} strokeWidth={1} opacity={0.4}/>}
            <circle cx={n.x} cy={n.y} r={22} fill={fill} stroke={stroke} strokeWidth={2}/>
            <text x={n.x} y={n.y+5} textAnchor="middle" fill={isCur ? CM.accent : isVis ? CM.green : CM.text} fontSize={13} fontFamily="'JetBrains Mono',monospace" fontWeight={700}>{n.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TABS = ["Sort", "Search", "Linked List", "Stack & Queue", "Binary Tree", "Graph"];
const TAB_COLORS = [CM.accent, CM.purple, CM.green, CM.red, CM.teal, CM.blue];

export default function DSAVisualizer() {
  const [tab, setTab] = useState("Sort");
  const [sortAlgo, setSortAlgo] = useState("Bubble Sort");
  const [searchAlgo, setSearchAlgo] = useState("Linear Search");
  const [arr, setArr] = useState([38,27,43,13,55,19,32,47,8,60,24,71]);
  const [colors, setColors] = useState(Array(12).fill(ALG_COLORS.default));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [status, setStatus] = useState("");
  const [searchTarget, setSearchTarget] = useState(27);
  // LL
  const [llNodes, setLLNodes] = useState([10,20,30,40,50]);
  const [llInput, setLLInput] = useState("");
  const [llHighlight, setLLHighlight] = useState(-1);
  const [llLog, setLlLog] = useState([]);
  // Stack / Queue
  const [stack, setStack] = useState([3,7,2,9]);
  const [stackInput, setStackInput] = useState("");
  const [stackHighlight, setStackHighlight] = useState(-1);
  const [queue, setQueue] = useState([4,1,8,5]);
  const [queueInput, setQueueInput] = useState("");
  const [queueHighlight, setQueueHighlight] = useState(-1);
  // BST
  const [bstVals, setBstVals] = useState([50,30,70,20,40,60,80]);
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
    setArr(a); setColors(Array(a.length).fill(ALG_COLORS.default)); setStatus("");
  };

  const runSort = async () => {
    setRunning(true); setStatus("Sorting…");
    setColors(Array(arr.length).fill(ALG_COLORS.default));
    await SORT_ALGOS[sortAlgo].run([...arr], setColors, setArr, speed);
    setStatus("Sorted ✓"); setRunning(false);
  };

  const runSearch = async () => {
    setRunning(true); setStatus("Searching…");
    setColors(Array(arr.length).fill(ALG_COLORS.default));
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
      GEDGES.filter(([a,b]) => a===n||b===n).forEach(([a,b]) => {
        const nb = a===n?b:a; if (!visited.includes(nb)) q.push(nb);
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
      const nbs = GEDGES.filter(([a,b])=>a===n||b===n).map(([a,b])=>a===n?b:a);
      for (const nb of nbs) await dfs(nb);
    }
    await dfs(0); setGraphCurrent(null); setGraphPath(visited); setRunning(false);
  };

  const bstRoot = buildBST(bstVals);
  const tabColor = TAB_COLORS[TABS.indexOf(tab)] || CM.accent;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${CM.surface};}
        ::-webkit-scrollbar-thumb{background:${CM.border2};border-radius:3px;}
        input[type=range]{accent-color:${CM.accent};}
        select option{background:${CM.surface2};}
      `}</style>

      <div style={{ background: CM.bg, minHeight: "100vh", color: CM.text, fontFamily: "'Segoe UI',-apple-system,sans-serif" }}>

        {/* ── TOPBAR ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, height: 48, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ffa116,#ff6b00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>⌨</div>
          <NavLink to={"/"}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>CodeMaster</span>
          </NavLink>
          <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.muted }}>
            <NavLink to={"/explore"}> 
            Explore / <span style={{ color: CM.accent }}>DSA Visualizer</span>
            </NavLink>
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Badge label="Interactive" color={CM.green} />
            <Badge label="6 Topics" color={CM.accent} />
          </div>
        </div>

        {/* ── TOPIC TABS ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: "flex", overflowX: "auto", padding: "0 4px" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(t); setStatus(""); setColors(Array(arr.length).fill(ALG_COLORS.default)); }}
              style={{
                padding: "10px 18px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: "transparent", whiteSpace: "nowrap",
                color: tab === t ? TAB_COLORS[i] : CM.muted,
                borderBottom: tab === t ? `2px solid ${TAB_COLORS[i]}` : "2px solid transparent",
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.3,
                transition: "all 0.15s",
              }}>{t}</button>
          ))}
        </div>

        <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 20px 60px" }}>

          {/* ══ SORT ════════════════════════════════════════════════════════ */}
          {tab === "Sort" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.accent}>Sorting Algorithms</SectionLabel>

              {/* Controls */}
              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <CMSelect value={sortAlgo} onChange={setSortAlgo} options={Object.keys(SORT_ALGOS)} disabled={running} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>SPEED</span>
                  <input type="range" min={40} max={700} step={40} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: 80 }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.accent, width: 40 }}>{speed}ms</span>
                </div>
                <CMButton onClick={genArr} disabled={running}>⟳ Shuffle</CMButton>
                <CMButton onClick={runSort} disabled={running} variant="accent">▶ Visualize</CMButton>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge label={`⏱ ${SORT_ALGOS[sortAlgo].complexity.time}`} color={CM.blue} />
                  <Badge label={`📦 ${SORT_ALGOS[sortAlgo].complexity.space}`} color={CM.green} />
                  <Badge label={`Best ${SORT_ALGOS[sortAlgo].complexity.best}`} color={CM.teal} />
                  <Badge label={SORT_ALGOS[sortAlgo].complexity.stable ? "Stable" : "Unstable"} color={SORT_ALGOS[sortAlgo].complexity.stable ? CM.green : CM.red} />
                </div>
              </div>

              {/* Bars */}
              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "20px 16px", display: "flex", alignItems: "flex-end", gap: 3, minHeight: 250, flexWrap: "wrap" }}>
                {arr.map((v, i) => <Bar key={i} value={v} max={Math.max(...arr)} color={colors[i]} width={Math.min(32, Math.floor(840 / arr.length - 4))} />)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <CodeView lines={SORT_ALGOS[sortAlgo].code} highlight={-1} title={sortAlgo} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {status && (
                    <div style={{
                      background: status.includes("✓") ? CM.greenDim : CM.accentDim,
                      border: `1px solid ${status.includes("✓") ? CM.greenBdr : CM.accentBdr}`,
                      borderRadius: 8, padding: "10px 14px",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700,
                      color: status.includes("✓") ? CM.green : CM.accent,
                    }}>{status}</div>
                  )}
                  <Legend items={[["Comparing", ALG_COLORS.comparing], ["Active", ALG_COLORS.active], ["Sorted", ALG_COLORS.sorted], ["Pivot", ALG_COLORS.pivot]]} />
                </div>
              </div>
            </div>
          )}

          {/* ══ SEARCH ══════════════════════════════════════════════════════ */}
          {tab === "Search" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.purple}>Searching Algorithms</SectionLabel>

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <CMSelect value={searchAlgo} onChange={setSearchAlgo} options={Object.keys(SEARCH_ALGOS)} disabled={running} />
                <CMInput value={searchTarget} onChange={v => setSearchTarget(+v)} placeholder="Target" width={80} />
                <CMButton onClick={genArr} disabled={running}>⟳ Shuffle</CMButton>
                <CMButton onClick={runSearch} disabled={running} variant="purple">🔍 Search</CMButton>
                <Badge label={`⏱ ${SEARCH_ALGOS[searchAlgo].complexity.time}`} color={CM.purple} />
              </div>

              {SEARCH_ALGOS[searchAlgo].note && (
                <div style={{ background: CM.accentDim, border: `1px solid ${CM.accentBdr}`, borderRadius: 7, padding: "8px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.accent }}>
                  ⚠ {SEARCH_ALGOS[searchAlgo].note}
                </div>
              )}

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "20px 16px", display: "flex", alignItems: "flex-end", gap: 3, minHeight: 250, flexWrap: "wrap" }}>
                {arr.map((v, i) => <Bar key={i} value={v} max={Math.max(...arr)} color={colors[i]} />)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <CodeView lines={SEARCH_ALGOS[searchAlgo].code} title={searchAlgo} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {status && (
                    <div style={{
                      background: status.includes("✓") ? CM.greenDim : CM.redDim,
                      border: `1px solid ${status.includes("✓") ? CM.greenBdr : CM.redBdr}`,
                      borderRadius: 8, padding: "10px 14px",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700,
                      color: status.includes("✓") ? CM.green : CM.red,
                    }}>{status}</div>
                  )}
                  <Legend items={[["Target Found", ALG_COLORS.found], ["Comparing", ALG_COLORS.comparing], ["Visited", ALG_COLORS.visited], ["Active", ALG_COLORS.active]]} />
                </div>
              </div>
            </div>
          )}

          {/* ══ LINKED LIST ════════════════════════════════════════════════ */}
          {tab === "Linked List" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.green}>Linked List</SectionLabel>

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <CMInput value={llInput} onChange={setLLInput} placeholder="Value" width={80} />
                <CMButton variant="green" onClick={async () => {
                  const v = parseInt(llInput); if (isNaN(v)) return;
                  setLLNodes(n => [...n, v]); setLLInput("");
                  setLlLog(l => [`Appended ${v} at tail`, ...l.slice(0,4)]);
                  setLLHighlight(llNodes.length); await sleep(600); setLLHighlight(-1);
                }}>+ Append</CMButton>
                <CMButton variant="blue" onClick={async () => {
                  const v = parseInt(llInput); if (isNaN(v)) return;
                  setLLNodes(n => [v, ...n]); setLLInput("");
                  setLlLog(l => [`Prepended ${v} at head`, ...l.slice(0,4)]);
                  setLLHighlight(0); await sleep(600); setLLHighlight(-1);
                }}>↑ Prepend</CMButton>
                <CMButton variant="red" onClick={async () => {
                  if (!llNodes.length) return;
                  setLlLog(l => [`Deleted head (${llNodes[0]})`, ...l.slice(0,4)]);
                  setLLHighlight(0); await sleep(500);
                  setLLNodes(n => n.slice(1)); setLLHighlight(-1);
                }}>✕ Head</CMButton>
                <CMButton variant="red" onClick={async () => {
                  if (!llNodes.length) return;
                  setLlLog(l => [`Deleted tail (${llNodes[llNodes.length-1]})`, ...l.slice(0,4)]);
                  setLLHighlight(llNodes.length - 1); await sleep(500);
                  setLLNodes(n => n.slice(0, -1)); setLLHighlight(-1);
                }}>✕ Tail</CMButton>
                <CMButton onClick={() => { setLLNodes([10,20,30,40,50]); setLlLog([]); }}>Reset</CMButton>
              </div>

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "32px 24px 20px", overflowX: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: 0 }}>
                  {llNodes.length === 0
                    ? <div style={{ color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>[ empty list ]</div>
                    : llNodes.map((v, i) => (
                      <LLNodeBox key={i} val={v} active={llHighlight === i} isHead={i === 0} isTail={i === llNodes.length - 1} hasNext={i < llNodes.length - 1} />
                    ))}
                  {llNodes.length > 0 && <span style={{ color: CM.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, marginLeft: 8 }}>null</span>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <ComplexityCard title="Linked List Operations" rows={[
                  ["Access (index)", "O(n)", CM.blue],
                  ["Search", "O(n)", CM.blue],
                  ["Insert at head", "O(1)", CM.green],
                  ["Insert at tail", "O(1)", CM.green],
                  ["Delete head", "O(1)", CM.green],
                  ["Delete at position", "O(n)", CM.red],
                ]} />
                <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", borderBottom: `1px solid ${CM.border}`, background: CM.bg }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase" }}>Operation Log</span>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {llLog.length === 0
                      ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.dim }}>No operations yet…</span>
                      : llLog.map((l, i) => (
                        <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: i === 0 ? CM.accent : CM.muted, padding: "4px 8px", background: i === 0 ? CM.accentDim : "transparent", borderRadius: 5 }}>
                          {i === 0 ? "▶ " : "  "}{l}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ STACK & QUEUE ═══════════════════════════════════════════════ */}
          {tab === "Stack & Queue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.red}>Stack & Queue</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Stack */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge label="STACK" color={CM.accent} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>LIFO — Last In First Out</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <CMInput value={stackInput} onChange={setStackInput} placeholder="Value" width={70} />
                    <CMButton variant="green" onClick={async () => {
                      if (!stackInput) return;
                      const v = isNaN(+stackInput) ? stackInput : +stackInput;
                      setStack(s => [...s, v]); setStackInput("");
                      setStackHighlight(stack.length); await sleep(600); setStackHighlight(-1);
                    }}>Push</CMButton>
                    <CMButton variant="red" onClick={async () => {
                      if (!stack.length) return;
                      setStackHighlight(stack.length - 1); await sleep(500);
                      setStack(s => s.slice(0, -1)); setStackHighlight(-1);
                    }}>Pop</CMButton>
                    <CMButton onClick={() => setStack([3,7,2,9])}>Reset</CMButton>
                  </div>
                  <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 16 }}>
                    <StackView items={stack} highlight={stackHighlight} />
                  </div>
                  <ComplexityCard rows={[["Push","O(1)",CM.green],["Pop","O(1)",CM.green],["Peek","O(1)",CM.green],["Search","O(n)",CM.blue]]} />
                </div>

                {/* Queue */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge label="QUEUE" color={CM.teal} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>FIFO — First In First Out</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <CMInput value={queueInput} onChange={setQueueInput} placeholder="Value" width={70} />
                    <CMButton variant="green" onClick={async () => {
                      if (!queueInput) return;
                      const v = isNaN(+queueInput) ? queueInput : +queueInput;
                      setQueue(q => [...q, v]); setQueueInput("");
                      setQueueHighlight(queue.length); await sleep(600); setQueueHighlight(-1);
                    }}>Enqueue</CMButton>
                    <CMButton variant="red" onClick={async () => {
                      if (!queue.length) return;
                      setQueueHighlight(0); await sleep(500);
                      setQueue(q => q.slice(1)); setQueueHighlight(-1);
                    }}>Dequeue</CMButton>
                    <CMButton onClick={() => setQueue([4,1,8,5])}>Reset</CMButton>
                  </div>
                  <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 16 }}>
                    <QueueView items={queue} highlight={queueHighlight} />
                  </div>
                  <ComplexityCard rows={[["Enqueue","O(1)",CM.green],["Dequeue","O(1)",CM.green],["Peek","O(1)",CM.green],["Search","O(n)",CM.blue]]} />
                </div>
              </div>
            </div>
          )}

          {/* ══ BINARY TREE ═════════════════════════════════════════════════ */}
          {tab === "Binary Tree" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.teal}>Binary Search Tree</SectionLabel>

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <CMInput value={bstSearch} onChange={setBstSearch} placeholder="Search…" width={90} />
                <CMButton variant="purple" onClick={async () => {
                  const target = parseInt(bstSearch); if (isNaN(target)) return;
                  setBstLog([]);
                  async function search(node) {
                    if (!node) { setBstHighlight(null); setBstLog(l=>[...l,`✗ ${target} not found`]); return; }
                    setBstHighlight(node.val); setBstLog(l=>[...l,`Visiting ${node.val}`]); await sleep(speed);
                    if (node.val === target) { setBstLog(l=>[...l,`✓ Found ${target}!`]); return; }
                    if (target < node.val) { setBstLog(l=>[...l,`${target} < ${node.val} → go left`]); await search(node.left); }
                    else { setBstLog(l=>[...l,`${target} > ${node.val} → go right`]); await search(node.right); }
                  }
                  await search(bstRoot);
                }}>🔍 Search</CMButton>
                <CMInput value={bstInput} onChange={setBstInput} placeholder="Insert…" width={80} />
                <CMButton variant="green" onClick={() => {
                  const v = parseInt(bstInput); if (isNaN(v) || bstVals.includes(v)) return;
                  setBstVals(vs => [...vs, v]); setBstInput(""); setBstLog(l => [`Inserted ${v}`, ...l.slice(0,4)]);
                }}>+ Insert</CMButton>
                <CMButton onClick={() => { setBstHighlight(null); setBstLog([]); }}>Clear</CMButton>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
                <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 12 }}>
                  <svg width="100%" viewBox="0 0 420 300" style={{ display: "block" }}>
                    <TreeNodeSVG node={bstRoot} highlight={bstHighlight} x={210} y={28} />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <ComplexityCard title="BST Operations (balanced)" rows={[
                    ["Search", "O(log n)", CM.blue],
                    ["Insert", "O(log n)", CM.green],
                    ["Delete", "O(log n)", CM.red],
                    ["Inorder", "O(n)", CM.teal],
                  ]} />
                  <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "9px 14px", borderBottom: `1px solid ${CM.border}`, background: CM.bg }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase" }}>Search Trace</span>
                    </div>
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                      {bstLog.length === 0
                        ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.dim }}>Run a search to see trace…</span>
                        : bstLog.map((l, i) => (
                          <div key={i} style={{
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                            color: l.startsWith("✓") ? CM.green : l.startsWith("✗") ? CM.red : CM.muted,
                            padding: "3px 6px", borderRadius: 4,
                            background: l.startsWith("✓") ? CM.greenDim : l.startsWith("✗") ? CM.redDim : "transparent",
                          }}>{l}</div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ GRAPH ═══════════════════════════════════════════════════════ */}
          {tab === "Graph" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SectionLabel color={CM.blue}>Graph Traversal</SectionLabel>

              <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", background: CM.bg, borderRadius: 8, overflow: "hidden", border: `1px solid ${CM.border}` }}>
                  {["BFS", "DFS"].map(m => (
                    <button key={m} onClick={() => setGraphMode(m)} disabled={running} style={{
                      padding: "6px 18px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                      background: graphMode === m ? CM.accent : "transparent",
                      color: graphMode === m ? "#0d1117" : CM.muted,
                      fontFamily: "'JetBrains Mono',monospace", transition: "all 0.15s",
                    }}>{m}</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim }}>SPEED</span>
                  <input type="range" min={100} max={1000} step={100} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: 80 }} />
                </div>
                <CMButton onClick={() => { setGraphVisited([]); setGraphCurrent(null); setGraphPath([]); }} disabled={running}>↺ Reset</CMButton>
                <CMButton variant="accent" onClick={graphMode === "BFS" ? runBFS : runDFS} disabled={running}>▶ Run {graphMode}</CMButton>
                <Badge label="Time O(V+E)" color={CM.blue} />
                <Badge label="Space O(V)" color={CM.green} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
                <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: 12 }}>
                  <GraphSVG visited={graphVisited} current={graphCurrent} path={graphPath} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "9px 14px", borderBottom: `1px solid ${CM.border}`, background: CM.bg }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase" }}>Traversal Order</span>
                    </div>
                    <div style={{ padding: "14px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {graphVisited.length === 0
                          ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.dim }}>Run traversal…</span>
                          : graphVisited.map((n, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                background: n === graphCurrent ? CM.accentDim : CM.greenDim,
                                border: `1.5px solid ${n === graphCurrent ? CM.accent : CM.greenBdr}`,
                                color: n === graphCurrent ? CM.accent : CM.green,
                                fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700,
                              }}>{n}</div>
                              {i < graphVisited.length - 1 && <span style={{ color: CM.dim, fontSize: 12 }}>→</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <ComplexityCard title={`${graphMode} Complexity`} rows={[
                    ["Time", "O(V + E)", CM.blue],
                    ["Space", "O(V)", CM.green],
                    ["Shortest Path", graphMode === "BFS" ? "Yes ✓" : "No ✗", graphMode === "BFS" ? CM.green : CM.red],
                  ]} />
                  <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 8, padding: "12px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CM.muted, lineHeight: 1.7 }}>
                    {graphMode === "BFS"
                      ? "BFS uses a queue — explores level by level. Guarantees shortest path in unweighted graphs."
                      : "DFS uses a stack / recursion — goes as deep as possible before backtracking."}
                  </div>
                  <Legend items={[["Current", CM.accent], ["Visited", CM.green]]} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}