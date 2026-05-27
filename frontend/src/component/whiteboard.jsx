import { useState, useRef, useEffect, useCallback } from "react";

const COLORS = ["#a78bfa","#f472b6","#34d399","#fbbf24","#60a5fa","#f87171","#94a3b8","#e2e8f0"];
const STROKE_SIZES = [{ id: 2, h: 1.5 }, { id: 4, h: 3 }, { id: 7, h: 5.5 }];
const TOOLS = [
  { id: "select",  label: "Select",  key: "s" },
  { id: "pen",     label: "Pen",     key: "p" },
  { id: "line",    label: "Line",    key: "l" },
  { id: "rect",    label: "Rect",    key: "r" },
  { id: "ellipse", label: "Ellipse", key: "e" },
  { id: "diamond", label: "Diamond", key: "d" },
  { id: "arrow",   label: "Arrow",   key: "a" },
  { id: "text",    label: "Text",    key: "t" },
  { id: "eraser",  label: "Eraser",  key: "x" },
];

// Icons
const SelectIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/></svg>;
const PenIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z"/></svg>;
const LineIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>;
const RectIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>;
const EllipseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="7"/></svg>;
const DiamondIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 12 12 22 2 12"/></svg>;
const ArrowIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>;
const TextIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
const EraserIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l11-11 6 6Z"/><path d="m6 17 1.5-1.5"/></svg>;
const UndoIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>;
const RedoIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0010 20H13"/></svg>;
const TrashIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const XIcon       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const LogoIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>;

const TOOL_ICONS = {
  select: <SelectIcon/>, pen: <PenIcon/>, line: <LineIcon/>, rect: <RectIcon/>,
  ellipse: <EllipseIcon/>, diamond: <DiamondIcon/>, arrow: <ArrowIcon/>,
  text: <TextIcon/>, eraser: <EraserIcon/>,
};

// ── Helper: normalise drag rect ───────────────────────────────────────────────
function normaliseRect(x1, y1, x2, y2) {
  return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
}

export default function CodeBoard({ height = 560 }) {
  const baseRef    = useRef(null);   // persistent drawing canvas
  const overlayRef = useRef(null);   // selection / preview overlay canvas
  const areaRef    = useRef(null);   // container div
  const textElRef  = useRef(null);   // active textarea DOM node

  // drawing state (refs = no re-renders during draw)
  const drawingRef  = useRef(false);
  const startRef    = useRef({ x: 0, y: 0 });
  const baseSnapRef = useRef(null);   // snapshot before shape drag

  // history
  const histRef  = useRef([]);
  const redoRef  = useRef([]);

  // selection state
  const selPhaseRef    = useRef("none"); // "none"|"drawing"|"active"|"moving"
  const selRectRef     = useRef(null);   // {x,y,w,h} in base-canvas coords
  const selPixelsRef   = useRef(null);   // ImageData of lifted pixels
  const selBaseSnapRef = useRef(null);   // base snapshot when selection was lifted
  const selOffsetRef   = useRef({ x: 0, y: 0 });
  const moveStartRef   = useRef({ x: 0, y: 0 });

  // React state (UI only)
  const [tool,      setToolState] = useState("pen");
  const [color,     setColor]     = useState(COLORS[0]);
  const [strokeW,   setStrokeW]   = useState(2);
  const [mousePos,  setMousePos]  = useState({ x: 0, y: 0 });
  const [histLen,   setHistLen]   = useState(0);
  const [undoable,  setUndoable]  = useState(false);
  const [redoable,  setRedoable]  = useState(false);
  const [hasSelect, setHasSelect] = useState(false);
  const [selLabel,  setSelLabel]  = useState("");

  // mirror to refs for closure access
  const toolRef   = useRef(tool);
  const colorRef  = useRef(color);
  const strokeRef = useRef(strokeW);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { strokeRef.current = strokeW; }, [strokeW]);

  // ── Resize ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const area = areaRef.current;
      const bc   = baseRef.current;
      const oc   = overlayRef.current;
      if (!area || !bc || !oc) return;
      const { width, height: h } = area.getBoundingClientRect();
      bc.width = oc.width = width;
      bc.height = oc.height = h;
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (areaRef.current) obs.observe(areaRef.current);
    return () => obs.disconnect();
  }, []);

  // ── History ─────────────────────────────────────────────────────────────────
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

  // ── Selection helpers ───────────────────────────────────────────────────────
  const drawSelBox = useCallback((rect, offset = { x: 0, y: 0 }) => {
    const oc = overlayRef.current;
    if (!oc) return;
    const octx = oc.getContext("2d");
    octx.clearRect(0, 0, oc.width, oc.height);
    if (!rect || rect.w < 2 || rect.h < 2) return;
    const x = rect.x + offset.x, y = rect.y + offset.y;
    octx.save();
    octx.strokeStyle = "#7c6dfa";
    octx.lineWidth = 1.5;
    octx.setLineDash([6, 3]);
    octx.strokeRect(x, y, rect.w, rect.h);
    octx.setLineDash([]);
    [[x, y],[x+rect.w, y],[x, y+rect.h],[x+rect.w, y+rect.h]].forEach(([hx, hy]) => {
      octx.fillStyle = "#161b2e";
      octx.fillRect(hx - 3, hy - 3, 6, 6);
      octx.strokeStyle = "#a78bfa";
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
    const off  = selOffsetRef.current;
    baseRef.current.getContext("2d").putImageData(selPixelsRef.current, rect.x + off.x, rect.y + off.y);
    overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    selPixelsRef.current = null;
    selBaseSnapRef.current = null;
    selRectRef.current = null;
    selOffsetRef.current = { x: 0, y: 0 };
    selPhaseRef.current = "none";
    setHasSelect(false);
    setSelLabel("");
  }, [pushHist]);

  const deselect = useCallback(() => {
    const phase = selPhaseRef.current;
    if (phase === "active" || phase === "moving") {
      if (selBaseSnapRef.current)
        baseRef.current.getContext("2d").putImageData(selBaseSnapRef.current, 0, 0);
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
    const off  = selOffsetRef.current;
    if (!rect) return false;
    return px >= rect.x + off.x && px <= rect.x + off.x + rect.w &&
           py >= rect.y + off.y && py <= rect.y + off.y + rect.h;
  }, []);

  // ── Tool switch ─────────────────────────────────────────────────────────────
  const setTool = useCallback((t) => {
    commitText();
    if (t !== "select") deselect();
    setToolState(t);
    const cur = t === "eraser" ? "cell" : t === "text" ? "text" : t === "select" ? "default" : "crosshair";
    if (overlayRef.current) overlayRef.current.style.cursor = cur;
  }, [deselect]);

  // ── Text ────────────────────────────────────────────────────────────────────
  const commitText = useCallback(() => {
    const el = textElRef.current;
    if (!el) return;
    textElRef.current = null;
    const val = el.value.trim();
    if (val) {
      pushHist();
      const bc = baseRef.current;
      const bctx = bc.getContext("2d");
      const fs = strokeRef.current * 4 + 10;
      bctx.font = `${fs}px 'JetBrains Mono','Fira Code',monospace`;
      bctx.fillStyle = colorRef.current;
      bctx.textBaseline = "top";
      val.split("\n").forEach((line, i) => {
        bctx.fillText(line, parseFloat(el.style.left) + 4, parseFloat(el.style.top) + 4 + i * (fs + 4));
      });
    }
    el.remove();
  }, [pushHist]);

  const startText = useCallback((x, y) => {
    commitText();
    const el = document.createElement("textarea");
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;background:transparent;border:none;outline:1.5px dashed #7c6dfa;color:#e2e8f0;font-family:'JetBrains Mono','Fira Code',monospace;font-size:${strokeRef.current*4+10}px;line-height:1.4;padding:2px 4px;resize:none;overflow:hidden;min-width:80px;min-height:24px;z-index:10;border-radius:3px;`;
    el.rows = 1;
    el.oninput = () => { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; el.style.width = "auto"; el.style.width = Math.max(80, el.scrollWidth + 8) + "px"; };
    el.onkeydown = (e) => {
      if (e.key === "Escape") { textElRef.current = null; el.remove(); }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); }
    };
    areaRef.current.appendChild(el);
    textElRef.current = el;
    setTimeout(() => el.focus(), 10);
  }, [commitText]);

  // ── History actions ─────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    commitText(); deselect();
    if (!histRef.current.length) return;
    redoRef.current.push(saveSnap());
    baseRef.current.getContext("2d").putImageData(histRef.current.pop(), 0, 0);
    updUI();
  }, [commitText, deselect, saveSnap, updUI]);

  const redo = useCallback(() => {
    commitText(); deselect();
    if (!redoRef.current.length) return;
    histRef.current.push(saveSnap());
    baseRef.current.getContext("2d").putImageData(redoRef.current.pop(), 0, 0);
    updUI();
  }, [commitText, deselect, saveSnap, updUI]);

  const clearAll = useCallback(() => {
    commitText(); deselect();
    pushHist();
    const bc = baseRef.current;
    bc.getContext("2d").clearRect(0, 0, bc.width, bc.height);
    overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
  }, [commitText, deselect, pushHist]);
const shareBoard = async () => {
  const canvas = baseRef.current;

  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const file = new File(
      [blob],
      "codeboard.png",
      { type: "image/png" }
    );

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "CodeBoard",
          text: "Check out my whiteboard",
          files: [file],
        });
      } else {
        alert("Sharing not supported on this browser");
      }
    } catch (err) {
      console.log(err);
    }
  });
};
  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const inText = document.activeElement?.tagName === "TEXTAREA";
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      if (e.key === "Escape") { e.preventDefault(); deselect(); }
      if (!inText) {
        const m = { s:"select",p:"pen",l:"line",r:"rect",e:"ellipse",d:"diamond",a:"arrow",t:"text",x:"eraser" };
        if (m[e.key.toLowerCase()]) setTool(m[e.key.toLowerCase()]);
        if (e.key === "Enter" && (selPhaseRef.current === "active" || selPhaseRef.current === "moving")) {
          e.preventDefault(); stampSelection();
        }
        if ((e.key === "Delete" || e.key === "Backspace") && selPhaseRef.current === "active") {
          e.preventDefault();
          overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          selPixelsRef.current = null; selBaseSnapRef.current = null;
          selRectRef.current = null; selOffsetRef.current = { x:0,y:0 };
          selPhaseRef.current = "none"; setHasSelect(false); setSelLabel("");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deselect, setTool, stampSelection]);

  // ── Pointer events ──────────────────────────────────────────────────────────
  const getPos = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
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
        octx.strokeStyle = "#7c6dfa"; octx.lineWidth = 1.5; octx.setLineDash([6, 3]);
        octx.strokeRect(r.x, r.y, r.w, r.h);
        octx.fillStyle = "rgba(124,109,250,0.08)";
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
      if (t === "line") { bctx.moveTo(sx,sy); bctx.lineTo(x,y); bctx.stroke(); }
      else if (t === "rect") { bctx.strokeRect(sx,sy,x-sx,y-sy); }
      else if (t === "ellipse") {
        bctx.ellipse((sx+x)/2,(sy+y)/2,Math.abs(x-sx)/2,Math.abs(y-sy)/2,0,0,Math.PI*2); bctx.stroke();
      } else if (t === "diamond") {
        const cx=(sx+x)/2,cy=(sy+y)/2;
        bctx.moveTo(cx,sy); bctx.lineTo(x,cy); bctx.lineTo(cx,y); bctx.lineTo(sx,cy); bctx.closePath(); bctx.stroke();
      } else if (t === "arrow") {
        const dx=x-sx,dy=y-sy,ang=Math.atan2(dy,dx),hw=14,ha=0.42;
        bctx.moveTo(sx,sy); bctx.lineTo(x,y); bctx.stroke();
        bctx.beginPath();
        bctx.moveTo(x,y);
        bctx.lineTo(x-hw*Math.cos(ang-ha),y-hw*Math.sin(ang-ha));
        bctx.lineTo(x-hw*Math.cos(ang+ha),y-hw*Math.sin(ang+ha));
        bctx.closePath(); bctx.fillStyle=c; bctx.fill();
      }
    }
  }, [hitTest, paintFloating]);

  const onMouseUp = useCallback(() => {
    const t = toolRef.current;
    const phase = selPhaseRef.current;

    if (t === "select") {
      if (phase === "drawing") {
        const r = selRectRef.current;
        if (r && r.w > 4 && r.h > 4) { liftSelection(); }
        else {
          overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          selPhaseRef.current = "none"; selRectRef.current = null; setSelLabel("");
        }
      } else if (phase === "moving") {
        // commit offset into rect coords
        const off = selOffsetRef.current;
        selRectRef.current = {
          x: selRectRef.current.x + off.x,
          y: selRectRef.current.y + off.y,
          w: selRectRef.current.w,
          h: selRectRef.current.h,
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
  }, [liftSelection, paintFloating, drawSelBox, pushHist]);

  // ── Cursor style ────────────────────────────────────────────────────────────
  const cursorStyle = tool === "eraser" ? "cell" : tool === "text" ? "text" : tool === "select" ? "default" : "crosshair";

  return (
    <div style={{ display:"flex", flexDirection:"column", height, background:"#0f1117", borderRadius:12, border:"1px solid #2a2d3e", overflow:"hidden", fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#e2e8f0" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", padding:"0 12px", height:44, background:"#161b2e", borderBottom:"1px solid #2a2d3e", gap:8, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#7c6dfa", display:"flex", alignItems:"center", gap:6, marginRight:8 }}>
          <LogoIcon/> CodeBoard
        </div>
        <div style={{ flex:1 }}/>
        <button disabled={!undoable} onClick={undo} style={btnStyle(false, !undoable)}><UndoIcon/> Undo</button>
        <button disabled={!redoable} onClick={redo} style={btnStyle(false, !redoable)}><RedoIcon/> Redo</button>
        {hasSelect && (
          <button onClick={stampSelection} style={btnStyle(false, false, "#34d399")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Place
          </button>
        )}
        {hasSelect && (
          <button onClick={deselect} style={btnStyle(false, false)}><XIcon/> Deselect</button>
        )}
        <button
  onClick={shareBoard}
  style={btnStyle(false, false, "#34d399")}
>
  Share
</button>
        <button onClick={clearAll} style={btnStyle(true, false)}><TrashIcon/> Clear</button>
      </div>
     
      {/* Body */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Sidebar */}
        <div style={{ width:52, background:"#161b2e", borderRight:"1px solid #2a2d3e", display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0", gap:3, flexShrink:0, overflowY:"auto" }}>
          {TOOLS.map((t, i) => (
            <div key={t.id}>
              <div
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.key.toUpperCase()})`}
                style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, cursor:"pointer", color: tool===t.id ? "#a78bfa" : "#4a5568", background: tool===t.id ? "#2d2260" : "transparent", transition:"all .15s" }}
              >
                {TOOL_ICONS[t.id]}
              </div>
              {i === 0 && <div style={{ width:24, height:1, background:"#2a2d3e", margin:"3px auto" }}/>}
              {i === 7 && <div style={{ width:24, height:1, background:"#2a2d3e", margin:"3px auto" }}/>}
            </div>
          ))}
          <div style={{ width:24, height:1, background:"#2a2d3e", margin:"3px auto" }}/>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{ width:18, height:18, borderRadius:"50%", background:c, margin:"2px auto", cursor:"pointer", border: color===c ? "2px solid white" : "2px solid transparent", transform: color===c ? "scale(1.15)" : "scale(1)", transition:"transform .15s", flexShrink:0 }}/>
          ))}
          <div style={{ width:24, height:1, background:"#2a2d3e", margin:"3px auto" }}/>
          {STROKE_SIZES.map(s => (
            <div key={s.id} onClick={() => setStrokeW(s.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"3px 4px", cursor:"pointer", borderRadius:4, opacity: strokeW===s.id ? 1 : 0.35, transition:"opacity .15s" }}>
              <svg width="22" height="12" viewBox="0 0 22 12"><line x1="2" y1="6" x2="20" y2="6" stroke="#94a3b8" strokeWidth={s.h} strokeLinecap="round"/></svg>
            </div>
          ))}
        </div>

        {/* Canvas area */}
        <div ref={areaRef} style={{ flex:1, position:"relative", overflow:"hidden", background:"#0d1117", backgroundImage:"radial-gradient(circle,#252836 1px,transparent 1px)", backgroundSize:"24px 24px" }}>
          {/* selection label */}
          {selLabel && (
            <div style={{ position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", background:"#1e2235", border:"1px solid #7c6dfa", borderRadius:6, padding:"4px 12px", fontSize:11, color:"#a78bfa", pointerEvents:"none", zIndex:5, whiteSpace:"nowrap" }}>
              {selLabel}
            </div>
          )}
          {/* base canvas — persistent drawing */}
          <canvas ref={baseRef} style={{ position:"absolute", top:0, left:0, touchAction:"none" }}/>
          {/* overlay canvas — selection marquee + floating pixels */}
          <canvas
            ref={overlayRef}
            style={{ position:"absolute", top:0, left:0, touchAction:"none", zIndex:2, cursor: cursorStyle }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={e => { e.preventDefault(); onMouseDown(e); }}
            onTouchMove={e => { e.preventDefault(); onMouseMove(e); }}
            onTouchEnd={e => { e.preventDefault(); onMouseUp(); }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height:26, background:"#0b0e17", borderTop:"1px solid #1e2235", display:"flex", alignItems:"center", padding:"0 14px", gap:16, flexShrink:0 }}>
        <span style={{ fontSize:10, color:"#a78bfa" }}>● {tool.charAt(0).toUpperCase()+tool.slice(1)}</span>
        <span style={{ fontSize:10, color:"#3d4258" }}>X: {mousePos.x}  Y: {mousePos.y}</span>
        <span style={{ fontSize:10, color:"#3d4258" }}>History: {histLen}</span>
        <span style={{ fontSize:9, color:"#3d4258", marginLeft:"auto" }}>S=select · drag to move · Enter=place · Del=delete · Esc=deselect</span>
      </div>
    </div>
  );
}

function btnStyle(danger, disabled, accentColor) {
  return {
    display:"flex", alignItems:"center", gap:4,
    padding:"5px 10px", borderRadius:6, fontSize:11,
    border:"1px solid #2a2d3e", background:"#1e2235",
    color: danger ? "#f87171" : accentColor || "#94a3b8",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    whiteSpace:"nowrap",
  };
}