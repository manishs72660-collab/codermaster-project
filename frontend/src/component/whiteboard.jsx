import { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────  Tokens  ───────────────────────────── */
const INK = {
  bg:        "#07080d",
  panel:     "rgba(17,19,31,0.82)",
  panelSolid:"#12141f",
  border:    "rgba(139,124,247,0.14)",
  borderHi:  "rgba(139,124,247,0.35)",
  text:      "#e7e8f2",
  textDim:   "#5c6180",
  textFaint: "#3a3e57",
  violet:    "#8b7cf6",
  cyan:      "#22d3ee",
  green:     "#34d399",
  red:       "#f87171",
  amber:     "#fbbf24",
};

const PALETTE = ["#c4b5fd", "#f9a8d4", "#5eead4", "#fde68a", "#93c5fd", "#fca5a5", "#e2e8f0", "#64748b"];
const STROKE_SIZES = [{ id: 2, h: 1.4 }, { id: 4, h: 2.6 }, { id: 7, h: 5 }];
const TOOLS = [
  { id: "select",  label: "Select",  key: "S" },
  { id: "pen",     label: "Pen",     key: "P" },
  { id: "line",    label: "Line",    key: "L" },
  { id: "rect",    label: "Rect",    key: "R" },
  { id: "ellipse", label: "Ellipse", key: "E" },
  { id: "diamond", label: "Diamond", key: "D" },
  { id: "arrow",   label: "Arrow",   key: "A" },
  { id: "text",    label: "Text",    key: "T" },
  { id: "eraser",  label: "Eraser",  key: "X" },
];

const CANVAS_W = 2200;
const CANVAS_H = 1300;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const STORAGE_KEY = "codeboard:v1";

/* ─────────────────────────────  Icons  ───────────────────────────── */
const I = {
  Select:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/></svg>,
  Pen:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z"/></svg>,
  Line:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>,
  Rect:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>,
  Ellipse: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="7"/></svg>,
  Diamond: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 12 12 22 2 12"/></svg>,
  Arrow:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>,
  Text:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Eraser:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l11-11 6 6Z"/><path d="m6 17 1.5-1.5"/></svg>,
  Undo:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>,
  Redo:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0010 20H13"/></svg>,
  Trash:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  X:       () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Download:() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>,
  Share:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>,
  Grid:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Minus:   () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Plus:    () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Cloud:   () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
};

const TOOL_ICONS = {
  select: <I.Select/>, pen: <I.Pen/>, line: <I.Line/>, rect: <I.Rect/>,
  ellipse: <I.Ellipse/>, diamond: <I.Diamond/>, arrow: <I.Arrow/>,
  text: <I.Text/>, eraser: <I.Eraser/>,
};

function normaliseRect(x1, y1, x2, y2) {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/* ─────────────────────────────  Component  ───────────────────────────── */
export default function CodeBoard({ height = 640 }) {
  const baseRef    = useRef(null);
  const overlayRef = useRef(null);
  const areaRef    = useRef(null);   // scroll viewport
  const wrapRef    = useRef(null);   // transformed (zoomed) canvas wrapper — text inputs live here
  const textElRef  = useRef(null);

  const drawingRef  = useRef(false);
  const startRef    = useRef({ x: 0, y: 0 });
  const baseSnapRef = useRef(null);

  const histRef = useRef([]);
  const redoRef = useRef([]);
  const dirtyRef = useRef(false);

  const selPhaseRef    = useRef("none");
  const selRectRef     = useRef(null);
  const selPixelsRef   = useRef(null);
  const selBaseSnapRef = useRef(null);
  const selOffsetRef   = useRef({ x: 0, y: 0 });
  const moveStartRef   = useRef({ x: 0, y: 0 });

  const [tool, setToolState]   = useState("pen");
  const [color, setColor]      = useState(PALETTE[0]);
  const [strokeW, setStrokeW]  = useState(2);
  const [mousePos, setMousePos]= useState({ x: 0, y: 0 });
  const [histLen, setHistLen]  = useState(0);
  const [undoable, setUndoable]= useState(false);
  const [redoable, setRedoable]= useState(false);
  const [hasSelect, setHasSelect] = useState(false);
  const [selLabel, setSelLabel]   = useState("");
  const [zoom, setZoom]        = useState(1);
  const [showGrid, setShowGrid]= useState(true);
  const [title, setTitle]      = useState("untitled.pseudo");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [loaded, setLoaded] = useState(false);

  const toolRef   = useRef(tool);
  const colorRef  = useRef(color);
  const strokeRef = useRef(strokeW);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { strokeRef.current = strokeW; }, [strokeW]);

  /* ── Fixed-size canvases (mount once) ──────────────────────────────── */
  useEffect(() => {
    const bc = baseRef.current, oc = overlayRef.current;
    if (!bc || !oc) return;
    bc.width = oc.width = CANVAS_W;
    bc.height = oc.height = CANVAS_H;
  }, []);

  /* ── Load from persistent storage ──────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          if (data.title) setTitle(data.title);
          if (data.img) {
            const img = new Image();
            img.onload = () => {
              const bc = baseRef.current;
              if (!bc) return;
              const ctx = bc.getContext("2d");
              ctx.clearRect(0, 0, bc.width, bc.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = data.img;
          }
        }
      } catch (err) {
        // no saved board yet — that's fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  /* ── Autosave (debounced, only when dirty) ─────────────────────────── */
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      const bc = baseRef.current;
      if (!bc) return;
      dirtyRef.current = false;
      setSaveState("saving");
      try {
        const img = bc.toDataURL("image/png");
        await window.storage.set(STORAGE_KEY, JSON.stringify({ img, title }), false);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (err) {
        setSaveState("idle");
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [loaded, title]);

  const markDirty = useCallback(() => { dirtyRef.current = true; }, []);

  /* ── History ────────────────────────────────────────────────────────── */
  const saveSnap = useCallback(() => {
    const c = baseRef.current;
    return c ? c.getContext("2d").getImageData(0, 0, c.width, c.height) : null;
  }, []);

  const updUI = useCallback(() => {
    setHistLen(histRef.current.length);
    setUndoable(histRef.current.length > 0);
    setRedoable(redoRef.current.length > 0);
  }, []);

  const pushHist = useCallback(() => {
    const snap = saveSnap();
    if (snap) histRef.current.push(snap);
    redoRef.current = [];
    updUI();
  }, [saveSnap, updUI]);

  /* ── Selection helpers ──────────────────────────────────────────────── */
  const drawSelBox = useCallback((rect, offset = { x: 0, y: 0 }) => {
    const oc = overlayRef.current;
    if (!oc) return;
    const octx = oc.getContext("2d");
    octx.clearRect(0, 0, oc.width, oc.height);
    if (!rect || rect.w < 2 || rect.h < 2) return;
    const x = rect.x + offset.x, y = rect.y + offset.y;
    octx.save();
    octx.strokeStyle = INK.violet;
    octx.lineWidth = 1.5;
    octx.setLineDash([6, 3]);
    octx.strokeRect(x, y, rect.w, rect.h);
    octx.setLineDash([]);
    [[x, y], [x + rect.w, y], [x, y + rect.h], [x + rect.w, y + rect.h]].forEach(([hx, hy]) => {
      octx.fillStyle = "#0d0f18";
      octx.fillRect(hx - 3, hy - 3, 6, 6);
      octx.strokeStyle = "#c4b5fd";
      octx.lineWidth = 1.5;
      octx.strokeRect(hx - 3, hy - 3, 6, 6);
    });
    octx.restore();
  }, []);

  const paintFloating = useCallback((offset = { x: 0, y: 0 }) => {
    const oc = overlayRef.current;
    if (!oc || !selPixelsRef.current || !selRectRef.current) return;
    const octx = oc.getContext("2d");
    octx.clearRect(0, 0, oc.width, oc.height);
    octx.putImageData(selPixelsRef.current, selRectRef.current.x + offset.x, selRectRef.current.y + offset.y);
    drawSelBox(selRectRef.current, offset);
  }, [drawSelBox]);

  const liftSelection = useCallback(() => {
    const rect = selRectRef.current;
    if (!rect || rect.w < 2 || rect.h < 2) return;
    const bc = baseRef.current;
    const bctx = bc.getContext("2d");
    selBaseSnapRef.current = saveSnap();
    selPixelsRef.current = bctx.getImageData(rect.x, rect.y, rect.w, rect.h);
    bctx.clearRect(rect.x, rect.y, rect.w, rect.h);
    selPhaseRef.current = "active";
    selOffsetRef.current = { x: 0, y: 0 };
    setHasSelect(true);
    setSelLabel(`${Math.round(rect.w)} × ${Math.round(rect.h)} px`);
    paintFloating({ x: 0, y: 0 });
    drawSelBox(rect, { x: 0, y: 0 });
  }, [saveSnap, paintFloating, drawSelBox]);

  const stampSelection = useCallback(() => {
    if (!selPixelsRef.current || !selRectRef.current) return;
    pushHist();
    const rect = selRectRef.current;
    const off = selOffsetRef.current;
    baseRef.current.getContext("2d").putImageData(selPixelsRef.current, rect.x + off.x, rect.y + off.y);
    overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    selPixelsRef.current = null;
    selBaseSnapRef.current = null;
    selRectRef.current = null;
    selOffsetRef.current = { x: 0, y: 0 };
    selPhaseRef.current = "none";
    setHasSelect(false);
    setSelLabel("");
    markDirty();
  }, [pushHist, markDirty]);

  const deselect = useCallback(() => {
    const phase = selPhaseRef.current;
    if (phase === "active" || phase === "moving") {
      if (selBaseSnapRef.current) baseRef.current.getContext("2d").putImageData(selBaseSnapRef.current, 0, 0);
      overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    } else if (phase === "drawing") {
      overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
    selRectRef.current = null;
    selPixelsRef.current = null;
    selBaseSnapRef.current = null;
    selOffsetRef.current = { x: 0, y: 0 };
    selPhaseRef.current = "none";
    setHasSelect(false);
    setSelLabel("");
  }, []);

  const hitTest = useCallback((px, py) => {
    const rect = selRectRef.current;
    const off = selOffsetRef.current;
    if (!rect) return false;
    return px >= rect.x + off.x && px <= rect.x + off.x + rect.w &&
           py >= rect.y + off.y && py <= rect.y + off.y + rect.h;
  }, []);

  /* ── Text ───────────────────────────────────────────────────────────── */
  const commitText = useCallback(() => {
    const el = textElRef.current;
    if (!el) return;
    textElRef.current = null;
    const val = el.value.trim();
    if (val) {
      pushHist();
      const bctx = baseRef.current.getContext("2d");
      const fs = strokeRef.current * 4 + 12;
      bctx.font = `${fs}px 'JetBrains Mono', 'Fira Code', monospace`;
      bctx.fillStyle = colorRef.current;
      bctx.textBaseline = "top";
      val.split("\n").forEach((line, i) => {
        bctx.fillText(line, parseFloat(el.style.left) + 4, parseFloat(el.style.top) + 4 + i * (fs + 4));
      });
      markDirty();
    }
    el.remove();
  }, [pushHist, markDirty]);

  const startText = useCallback((x, y) => {
    commitText();
    const el = document.createElement("textarea");
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;background:rgba(139,124,246,0.06);border:none;outline:1.5px dashed ${INK.violet};color:${INK.text};font-family:'JetBrains Mono','Fira Code',monospace;font-size:${strokeRef.current * 4 + 12}px;line-height:1.4;padding:2px 4px;resize:none;overflow:hidden;min-width:90px;min-height:26px;z-index:10;border-radius:4px;`;
    el.rows = 1;
    el.oninput = () => { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; el.style.width = "auto"; el.style.width = Math.max(90, el.scrollWidth + 8) + "px"; };
    el.onkeydown = (e) => {
      if (e.key === "Escape") { textElRef.current = null; el.remove(); }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); }
    };
    (wrapRef.current || areaRef.current).appendChild(el);
    textElRef.current = el;
    setTimeout(() => el.focus(), 10);
  }, [commitText]);

  /* ── History actions ───────────────────────────────────────────────── */
  const undo = useCallback(() => {
    commitText(); deselect();
    if (!histRef.current.length) return;
    redoRef.current.push(saveSnap());
    baseRef.current.getContext("2d").putImageData(histRef.current.pop(), 0, 0);
    updUI(); markDirty();
  }, [commitText, deselect, saveSnap, updUI, markDirty]);

  const redo = useCallback(() => {
    commitText(); deselect();
    if (!redoRef.current.length) return;
    histRef.current.push(saveSnap());
    baseRef.current.getContext("2d").putImageData(redoRef.current.pop(), 0, 0);
    updUI(); markDirty();
  }, [commitText, deselect, saveSnap, updUI, markDirty]);

  const clearAll = useCallback(async () => {
    commitText(); deselect(); pushHist();
    const bc = baseRef.current;
    bc.getContext("2d").clearRect(0, 0, bc.width, bc.height);
    overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    try { await window.storage.delete(STORAGE_KEY, false); } catch (err) { /* nothing to delete */ }
  }, [commitText, deselect, pushHist]);

  const exportPNG = useCallback(() => {
    const bc = baseRef.current;
    if (!bc) return;
    const link = document.createElement("a");
    link.download = `${(title || "codeboard").replace(/\s+/g, "-")}.png`;
    link.href = bc.toDataURL("image/png");
    link.click();
  }, [title]);

  const shareBoard = useCallback(async () => {
    const canvas = baseRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${(title || "codeboard").replace(/\s+/g, "-")}.png`, { type: "image/png" });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: title || "CodeBoard", text: "Check out my pseudocode board", files: [file] });
        } else {
          exportPNG();
        }
      } catch (err) { /* user cancelled share */ }
    });
  }, [title, exportPNG]);

  /* ── Zoom ───────────────────────────────────────────────────────────── */
  const zoomBy = useCallback((delta) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
  }, []);
  const zoomReset = useCallback(() => setZoom(1), []);

  const onWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
  }, [zoomBy]);

  /* ── Tool switch ────────────────────────────────────────────────────── */
  const setTool = useCallback((t) => {
    commitText();
    if (t !== "select") deselect();
    setToolState(t);
    const cur = t === "eraser" ? "cell" : t === "text" ? "text" : t === "select" ? "default" : "crosshair";
    if (overlayRef.current) overlayRef.current.style.cursor = cur;
  }, [commitText, deselect]);

  /* ── Keyboard ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const inText = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT";
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomBy(ZOOM_STEP); }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") { e.preventDefault(); zoomBy(-ZOOM_STEP); }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); zoomReset(); }
      if (e.key === "Escape" && !inText) { e.preventDefault(); deselect(); }
      if (!inText) {
        const m = { s: "select", p: "pen", l: "line", r: "rect", e: "ellipse", d: "diamond", a: "arrow", t: "text", x: "eraser" };
        if (m[e.key.toLowerCase()]) setTool(m[e.key.toLowerCase()]);
        if (e.key === "Enter" && (selPhaseRef.current === "active" || selPhaseRef.current === "moving")) {
          e.preventDefault(); stampSelection();
        }
        if ((e.key === "Delete" || e.key === "Backspace") && selPhaseRef.current === "active") {
          e.preventDefault();
          overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          selPixelsRef.current = null; selBaseSnapRef.current = null;
          selRectRef.current = null; selOffsetRef.current = { x: 0, y: 0 };
          selPhaseRef.current = "none"; setHasSelect(false); setSelLabel("");
          markDirty();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deselect, setTool, stampSelection, zoomBy, zoomReset, markDirty]);

  /* ── Pointer events ─────────────────────────────────────────────────── */
  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) / zoom, y: (src.clientY - rect.top) / zoom };
  };

  const onMouseDown = useCallback((e) => {
    const pos = getPos(e);
    const t = toolRef.current;
    if (t === "text") { startText(pos.x, pos.y); return; }
    commitText();

    if (t === "select") {
      const phase = selPhaseRef.current;
      if ((phase === "active" || phase === "moving") && hitTest(pos.x, pos.y)) {
        selPhaseRef.current = "moving";
        moveStartRef.current = pos;
        overlayRef.current.style.cursor = "grabbing";
      } else {
        if (phase === "active" || phase === "moving") stampSelection();
        selPhaseRef.current = "drawing";
        startRef.current = pos;
        selRectRef.current = { x: pos.x, y: pos.y, w: 0, h: 0 };
        overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      return;
    }

    drawingRef.current = true;
    startRef.current = pos;
    baseSnapRef.current = saveSnap();
    if (t === "pen" || t === "eraser") {
      pushHist();
      baseRef.current.getContext("2d").beginPath();
      baseRef.current.getContext("2d").moveTo(pos.x, pos.y);
    }
  }, [commitText, startText, hitTest, stampSelection, saveSnap, pushHist]);

  const onMouseMove = useCallback((e) => {
    const pos = getPos(e);
    setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });

    const t = toolRef.current;
    const phase = selPhaseRef.current;
    const oc = overlayRef.current;
    const octx = oc.getContext("2d");

    if (t === "select") {
      if (phase === "drawing") {
        selRectRef.current = normaliseRect(startRef.current.x, startRef.current.y, pos.x, pos.y);
        const r = selRectRef.current;
        octx.clearRect(0, 0, oc.width, oc.height);
        octx.save();
        octx.strokeStyle = INK.violet; octx.lineWidth = 1.5; octx.setLineDash([6, 3]);
        octx.strokeRect(r.x, r.y, r.w, r.h);
        octx.fillStyle = "rgba(139,124,246,0.08)";
        octx.fillRect(r.x, r.y, r.w, r.h);
        octx.setLineDash([]); octx.restore();
        setSelLabel(`${Math.round(r.w)} × ${Math.round(r.h)} px`);
      } else if (phase === "moving") {
        const dx = pos.x - moveStartRef.current.x;
        const dy = pos.y - moveStartRef.current.y;
        selOffsetRef.current = { x: dx, y: dy };
        paintFloating({ x: dx, y: dy });
        setSelLabel(`Δ${Math.round(dx)}, Δ${Math.round(dy)}`);
      } else {
        oc.style.cursor = (phase === "active" && hitTest(pos.x, pos.y)) ? "move" : "default";
      }
      return;
    }

    if (!drawingRef.current) return;
    const bc = baseRef.current;
    const bctx = bc.getContext("2d");
    const c = colorRef.current, sw = strokeRef.current;
    const { x: sx, y: sy } = startRef.current;
    const x = pos.x, y = pos.y;
    bctx.lineCap = "round"; bctx.lineJoin = "round";

    if (t === "pen") {
      bctx.globalCompositeOperation = "source-over";
      bctx.strokeStyle = c; bctx.lineWidth = sw;
      bctx.lineTo(x, y); bctx.stroke();
    } else if (t === "eraser") {
      bctx.globalCompositeOperation = "destination-out";
      bctx.lineWidth = sw * 6; bctx.lineTo(x, y); bctx.stroke();
      bctx.globalCompositeOperation = "source-over";
    } else {
      if (baseSnapRef.current) bctx.putImageData(baseSnapRef.current, 0, 0);
      bctx.globalCompositeOperation = "source-over";
      bctx.strokeStyle = c; bctx.lineWidth = sw;
      bctx.beginPath();
      if (t === "line") { bctx.moveTo(sx, sy); bctx.lineTo(x, y); bctx.stroke(); }
      else if (t === "rect") { bctx.strokeRect(sx, sy, x - sx, y - sy); }
      else if (t === "ellipse") {
        bctx.ellipse((sx + x) / 2, (sy + y) / 2, Math.abs(x - sx) / 2, Math.abs(y - sy) / 2, 0, 0, Math.PI * 2); bctx.stroke();
      } else if (t === "diamond") {
        const cx = (sx + x) / 2, cy = (sy + y) / 2;
        bctx.moveTo(cx, sy); bctx.lineTo(x, cy); bctx.lineTo(cx, y); bctx.lineTo(sx, cy); bctx.closePath(); bctx.stroke();
      } else if (t === "arrow") {
        const dx = x - sx, dy = y - sy, ang = Math.atan2(dy, dx), hw = 14, ha = 0.42;
        bctx.moveTo(sx, sy); bctx.lineTo(x, y); bctx.stroke();
        bctx.beginPath();
        bctx.moveTo(x, y);
        bctx.lineTo(x - hw * Math.cos(ang - ha), y - hw * Math.sin(ang - ha));
        bctx.lineTo(x - hw * Math.cos(ang + ha), y - hw * Math.sin(ang + ha));
        bctx.closePath(); bctx.fillStyle = c; bctx.fill();
      }
    }
  }, [hitTest, paintFloating, zoom]);

  const onMouseUp = useCallback(() => {
    const t = toolRef.current;
    const phase = selPhaseRef.current;

    if (t === "select") {
      if (phase === "drawing") {
        const r = selRectRef.current;
        if (r && r.w > 4 && r.h > 4) {
          liftSelection();
        } else {
          overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          selPhaseRef.current = "none";
          selRectRef.current = null;
          setSelLabel("");
        }
      } else if (phase === "moving") {
        const off = selOffsetRef.current;
        selRectRef.current = {
          x: selRectRef.current.x + off.x, y: selRectRef.current.y + off.y,
          w: selRectRef.current.w, h: selRectRef.current.h,
        };
        selOffsetRef.current = { x: 0, y: 0 };
        selPhaseRef.current = "active";
        overlayRef.current.style.cursor = "move";
        paintFloating({ x: 0, y: 0 });
        drawSelBox(selRectRef.current, { x: 0, y: 0 });
      }
      return;
    }

    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (t !== "pen" && t !== "eraser") pushHist();
    baseRef.current.getContext("2d").beginPath();
    markDirty();
  }, [liftSelection, paintFloating, drawSelBox, pushHist, markDirty]);

  const cursorStyle = tool === "eraser" ? "cell" : tool === "text" ? "text" : tool === "select" ? "default" : "crosshair";

  /* ─────────────────────────────  Render  ───────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height, background: INK.bg, borderRadius: 14, border: `1px solid ${INK.border}`, overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", color: INK.text, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .cb-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .cb-scroll::-webkit-scrollbar-track { background: transparent; }
        .cb-scroll::-webkit-scrollbar-thumb { background: #1e2136; border-radius: 6px; border: 2px solid #07080d; }
        .cb-scroll::-webkit-scrollbar-thumb:hover { background: #2a2e4a; }
        @keyframes cb-blink { 0%, 45% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .cb-caret { animation: cb-blink 1.1s steps(1) infinite; }
        .cb-swatch { transition: transform .12s ease, box-shadow .12s ease; }
        .cb-swatch:hover { transform: scale(1.18); }
        .cb-tool { transition: background .12s ease, color .12s ease; }
        .cb-tool:hover { background: rgba(139,124,246,0.10) !important; color: #c4b5fd !important; }
        .cb-btn { transition: background .12s ease, border-color .12s ease, opacity .12s ease, transform .08s ease; }
        .cb-btn:not(:disabled):hover { border-color: rgba(139,124,246,0.4) !important; }
        .cb-btn:not(:disabled):active { transform: translateY(1px); }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 14px", height: 50,
        background: "linear-gradient(180deg, rgba(23,25,40,0.95), rgba(17,19,31,0.9))",
        borderBottom: `1px solid ${INK.border}`, gap: 10, flexShrink: 0, backdropFilter: "blur(6px)",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #8b7cf6, #22d3ee)", flexShrink: 0,
          boxShadow: "0 0 14px rgba(139,124,246,0.45)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#07080d" strokeWidth="2.5"><path d="M8 6L2 12l6 6"/><path d="M16 6l6 6-6 6"/></svg>
        </div>

        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { setEditingTitle(false); markDirty(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
              background: "#181b2c", border: `1px solid ${INK.borderHi}`, borderRadius: 6,
              color: INK.text, padding: "4px 8px", outline: "none", width: 200,
            }}
          />
        ) : (
          <div onClick={() => setEditingTitle(true)} title="Rename board" style={{ cursor: "text", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 1, color: "#c4b5fd" }}>
            <span style={{ color: INK.textDim, marginRight: 5 }}>~/</span>{title}
            <span className="cb-caret" style={{ color: "#22d3ee", marginLeft: 2 }}>▍</span>
          </div>
        )}

        <span style={{
          fontSize: 10, color: saveState === "saving" ? INK.amber : saveState === "saved" ? INK.green : INK.textFaint,
          display: "flex", alignItems: "center", gap: 4, transition: "color .2s",
        }}>
          <I.Cloud/> {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : ""}
        </span>

        <div style={{ flex: 1 }} />

        {/* Zoom controls */}
        <div style={{ display: "flex", alignItems: "center", background: "#161927", border: `1px solid ${INK.border}`, borderRadius: 7, overflow: "hidden" }}>
          <button onClick={() => zoomBy(-ZOOM_STEP)} style={zoomBtnStyle()}><I.Minus/></button>
          <span onClick={zoomReset} title="Reset zoom" style={{ fontSize: 11, width: 44, textAlign: "center", color: INK.textDim, cursor: "pointer", userSelect: "none" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(ZOOM_STEP)} style={zoomBtnStyle()}><I.Plus/></button>
        </div>

        <button className="cb-btn" onClick={() => setShowGrid((g) => !g)} style={btnStyle(false, false, showGrid ? "#22d3ee" : undefined)} title="Toggle grid">
          <I.Grid/> Grid
        </button>
        <button className="cb-btn" disabled={!undoable} onClick={undo} style={btnStyle(false, !undoable)}><I.Undo/> Undo</button>
        <button className="cb-btn" disabled={!redoable} onClick={redo} style={btnStyle(false, !redoable)}><I.Redo/> Redo</button>
        {hasSelect && <button className="cb-btn" onClick={stampSelection} style={btnStyle(false, false, INK.green)}><I.Check/> Place</button>}
        {hasSelect && <button className="cb-btn" onClick={deselect} style={btnStyle(false, false)}><I.X/> Deselect</button>}
        <button className="cb-btn" onClick={exportPNG} style={btnStyle(false, false)}><I.Download/> Export</button>
        <button className="cb-btn" onClick={shareBoard} style={btnStyle(false, false, INK.green)}><I.Share/> Share</button>
        <button className="cb-btn" onClick={clearAll} style={btnStyle(true, false)}><I.Trash/> Clear</button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

        {/* Floating tool dock */}
        <div style={{
          position: "absolute", left: 12, top: 12, bottom: 12, zIndex: 6,
          background: INK.panel, backdropFilter: "blur(10px)", border: `1px solid ${INK.border}`,
          borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 6px", gap: 3, boxShadow: "0 8px 30px rgba(0,0,0,0.45)", overflowY: "auto",
        }}>
          {TOOLS.map((t, i) => (
            <div key={t.id}>
              <div
                className="cb-tool"
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.key})`}
                style={{
                  width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, cursor: "pointer",
                  color: tool === t.id ? "#c4b5fd" : INK.textDim,
                  background: tool === t.id ? "rgba(139,124,246,0.16)" : "transparent",
                  boxShadow: tool === t.id ? `inset 0 0 0 1px ${INK.borderHi}` : "none",
                }}
              >
                {TOOL_ICONS[t.id]}
              </div>
              {i === 0 && <div style={{ width: 22, height: 1, background: INK.border, margin: "4px auto" }} />}
              {i === 7 && <div style={{ width: 22, height: 1, background: INK.border, margin: "4px auto" }} />}
            </div>
          ))}
          <div style={{ width: 22, height: 1, background: INK.border, margin: "5px auto" }} />
          {PALETTE.map((c) => (
            <div key={c} className="cb-swatch" onClick={() => setColor(c)} style={{
              width: 17, height: 17, borderRadius: "50%", background: c, margin: "2px auto", cursor: "pointer",
              boxShadow: color === c ? `0 0 0 2px #07080d, 0 0 0 3.5px ${c}` : "none", flexShrink: 0,
            }} />
          ))}
          <div style={{ width: 22, height: 1, background: INK.border, margin: "5px auto" }} />
          {STROKE_SIZES.map((s) => (
            <div key={s.id} onClick={() => setStrokeW(s.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 5px",
              cursor: "pointer", borderRadius: 5, opacity: strokeW === s.id ? 1 : 0.3,
              background: strokeW === s.id ? "rgba(139,124,246,0.12)" : "transparent",
            }}>
              <svg width="20" height="12" viewBox="0 0 20 12"><line x1="2" y1="6" x2="18" y2="6" stroke="#a5adcf" strokeWidth={s.h} strokeLinecap="round" /></svg>
            </div>
          ))}
        </div>

        {selLabel && (
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            background: "#161927", border: `1px solid ${INK.borderHi}`, borderRadius: 7,
            padding: "5px 14px", fontSize: 11, color: "#c4b5fd", pointerEvents: "none", zIndex: 7,
            whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace",
          }}>
            {selLabel}
          </div>
        )}

        {/* Scrollable canvas viewport */}
        <div ref={areaRef} className="cb-scroll" onWheel={onWheel} style={{ flex: 1, position: "relative", overflow: "auto", background: INK.bg }}>
          <div style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom, position: "relative" }}>
            <div
              ref={wrapRef}
              style={{
                width: CANVAS_W, height: CANVAS_H, position: "absolute", top: 0, left: 0,
                transform: `scale(${zoom})`, transformOrigin: "0 0",
                backgroundImage: showGrid ? "radial-gradient(circle, rgba(139,124,246,0.14) 1px, transparent 1px)" : "none",
                backgroundSize: "26px 26px",
              }}
            >
              <canvas ref={baseRef} style={{ position: "absolute", top: 0, left: 0, touchAction: "none" }} />
              <canvas
                ref={overlayRef}
                style={{ position: "absolute", top: 0, left: 0, touchAction: "none", zIndex: 2, cursor: cursorStyle }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={(e) => { e.preventDefault(); onMouseDown(e); }}
                onTouchMove={(e) => { e.preventDefault(); onMouseMove(e); }}
                onTouchEnd={(e) => { e.preventDefault(); onMouseUp(); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────── */}
      <div style={{
        height: 28, background: "#0b0d16", borderTop: `1px solid ${INK.border}`,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 18, flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span style={{ fontSize: 10.5, color: "#22d3ee" }}>$ tool:{tool}</span>
        <span style={{ fontSize: 10.5, color: INK.textDim }}>x:{mousePos.x} y:{mousePos.y}</span>
        <span style={{ fontSize: 10.5, color: INK.textDim }}>zoom:{Math.round(zoom * 100)}%</span>
        <span style={{ fontSize: 10.5, color: INK.textDim }}>history:{histLen}</span>
        <span style={{ fontSize: 9.5, color: INK.textFaint, marginLeft: "auto" }}>
          S select · P pen · T text · Ctrl+Z undo · Ctrl+scroll zoom · Enter place · Esc deselect
        </span>
      </div>
    </div>
  );
}

function btnStyle(danger, disabled, accentColor) {
  return {
    display: "flex", alignItems: "center", gap: 4,
    padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: 500,
    border: `1px solid ${INK.border}`, background: "#161927",
    color: danger ? INK.red : accentColor || INK.textDim,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.32 : 1,
    whiteSpace: "nowrap",
  };
}

function zoomBtnStyle() {
  return {
    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", background: "transparent", color: INK.textDim, cursor: "pointer",
  };
}