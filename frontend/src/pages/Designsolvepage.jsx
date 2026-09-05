import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  NodeResizer,
  Position,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  MonitorSmartphone,
  Globe2,
  Shuffle,
  DoorOpen,
  Server,
  Cog,
  ListOrdered,
  Zap,
  Database,
  Box,
  SearchCode,
  ChevronDown,
  ClipboardList,
  Layers,
  Compass,
  Gauge,
  ShieldCheck,
  Radio,
  Activity,
  Copy,
  X,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';
import mylogo from '../assets/mylogo.png';

/* ─── component palette data ───
   NOTE: only serializable fields (type/label/category/blurb) live here.
   Node instances never store the icon component itself — see the
   `componentType` field on dropped nodes and `iconFor()` below. Storing a
   live component reference on a node used to break restored designs (see
   SystemNode comment) because it can't survive a JSON round-trip through
   the backend. */
const COMPONENT_LIBRARY = [
  { type: 'client', label: 'Client', icon: MonitorSmartphone, category: 'edge', blurb: 'Browser or mobile app initiating requests' },
  { type: 'dns', label: 'DNS', icon: Compass, category: 'edge', blurb: 'Resolves domain names to IP addresses' },
  { type: 'cdn', label: 'CDN', icon: Globe2, category: 'edge', blurb: 'Serves static assets close to users' },

  { type: 'loadBalancer', label: 'Load Balancer', icon: Shuffle, category: 'network', blurb: 'Spreads traffic across instances' },
  { type: 'apiGateway', label: 'API Gateway', icon: DoorOpen, category: 'network', blurb: 'Single entry point for requests' },
  { type: 'rateLimiter', label: 'Rate Limiter', icon: Gauge, category: 'network', blurb: 'Throttles requests to protect backends from overload or abuse' },
  { type: 'authService', label: 'Auth Service', icon: ShieldCheck, category: 'network', blurb: 'Authenticates and authorizes requests (e.g. OAuth, JWT)' },

  { type: 'service', label: 'Service', icon: Server, category: 'compute', blurb: 'Handles application logic' },
  { type: 'worker', label: 'Worker', icon: Cog, category: 'compute', blurb: 'Processes background jobs' },
  { type: 'queue', label: 'Message Queue', icon: ListOrdered, category: 'compute', blurb: 'Buffers work between services' },
  { type: 'pubsub', label: 'Pub/Sub', icon: Radio, category: 'compute', blurb: 'Fans out events to many subscribers asynchronously' },
  { type: 'monitoring', label: 'Monitoring', icon: Activity, category: 'compute', blurb: 'Collects metrics, logs, and traces for observability' },

  { type: 'cache', label: 'Cache', icon: Zap, category: 'storage', blurb: 'Speeds up repeated reads' },
  { type: 'database', label: 'Database', icon: Database, category: 'storage', blurb: 'Durable primary storage' },
  { type: 'readReplica', label: 'Read Replica', icon: Copy, category: 'storage', blurb: 'Read-only copy of the database for scaling reads' },
  { type: 'objectStorage', label: 'Object Storage', icon: Box, category: 'storage', blurb: 'Stores files and blobs' },
  { type: 'searchIndex', label: 'Search Index', icon: SearchCode, category: 'storage', blurb: 'Enables fast text lookup' },
];

const CATEGORY_ORDER = ['edge', 'network', 'compute', 'storage'];
const CATEGORY_META = {
  edge: { label: 'Edge', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'hover:border-emerald-400/40 hover:bg-emerald-400/[0.06]' },
  network: { label: 'Network', text: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30', ring: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06]' },
  compute: { label: 'Compute', text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', ring: 'hover:border-orange-400/40 hover:bg-orange-400/[0.06]' },
  storage: { label: 'Storage', text: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/30', ring: 'hover:border-fuchsia-400/40 hover:bg-fuchsia-400/[0.06]' },
};

const DIFF = {
  easy: { label: 'Easy', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
  medium: { label: 'Medium', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/25' },
  hard: { label: 'Hard', text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/25' },
};
const diffMeta = (d) => DIFF[String(d || '').toLowerCase()] || { label: d || '—', text: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' };

const SEVERITY_META = {
  critical: { label: 'Critical', text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
  high: { label: 'High', text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  medium: { label: 'Medium', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  low: { label: 'Low', text: 'text-white/50', bg: 'bg-white/5', border: 'border-white/15' },
};
const severityMeta = (s) => SEVERITY_META[String(s || '').toLowerCase()] || SEVERITY_META.low;

// Single source of truth for "componentType string -> icon component".
// Always resolve icons through this function at render time rather than
// storing a component reference inside node.data (see SystemNode).
const iconFor = (type) => COMPONENT_LIBRARY.find((c) => c.type === type)?.icon || Server;

const DRAG_MIME = 'application/x-system-component';
let idCounter = 0;
const nextId = () => `node_${Date.now()}_${idCounter++}`;

// Normalizes whatever shape the AI evaluator returns an item in (a plain
// string, {title, reason}, {title, text}, {text}, ...) into one renderable
// shape, instead of silently rendering nothing when the shape didn't match.
function describeEvalItem(it) {
  if (it == null) return '';
  if (typeof it === 'string') return it;
  const title = it.title || it.name || '';
  const body = it.reason || it.text || it.description || it.detail || '';
  if (title && body) return { title, body };
  if (title || body) return title || body;
  const scraps = Object.values(it).filter((v) => typeof v === 'string' && v.trim());
  return scraps.join(' — ') || 'No details provided.';
}

/* ══════════════════════════════════════════
   CUSTOM REACT FLOW NODE
══════════════════════════════════════════ */
function SystemNode({ id, data, selected }) {
  const meta = CATEGORY_META[data.category] || CATEGORY_META.network;
  const { deleteElements } = useReactFlow();

  // `data` isn't always fresh from this session — it can come straight back
  // from the backend as a previously-submitted design (loaded via
  // GET /design/result/:id and dropped into initialNodes/initialEdges).
  // React components (like a Lucide icon) aren't serializable: if one were
  // ever stored directly on node.data, a JSON round-trip through the API
  // strips its internal function/symbol properties and leaves a plain,
  // *truthy* object behind (e.g. `{}`). Truthy means `data.icon || Server`
  // would never fall back to the default, and rendering that mangled
  // object as an element type crashes with React error #130 ("Element
  // type is invalid ... but got: object").
  //
  // The fix is to never store the component itself: nodes only carry the
  // serializable `componentType` string, and the icon is always looked up
  // fresh here, at render time, from the COMPONENT_LIBRARY table above.
  const Icon = iconFor(data.componentType);

  // Deletes only this node (and any edges attached to it) — an explicit
  // per-component alternative to selecting + pressing Backspace, which is
  // awkward on touch devices and easy to miss on desktop too.
  const handleDelete = (event) => {
    event.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className={cn(
        'group relative flex h-full w-full items-center gap-2 rounded-lg border bg-[#0e0e0e] pr-3 pl-1.5 py-1.5 shadow-lg shadow-black/40 transition-colors',
        selected ? 'border-orange-400/60 ring-1 ring-orange-400/30' : 'border-white/10'
      )}
    >
      {/* Drag the corner/edge handles to resize this node. Only shown for
          the selected node so the board doesn't get visually noisy. */}
      <NodeResizer
        isVisible={selected}
        minWidth={132}
        minHeight={44}
        color="#fb923c"
        handleClassName="!w-2 !h-2 !rounded-sm !border-[#0e0e0e]"
        lineClassName="!border-orange-400/40"
      />

      {/* Per-node delete — visible on hover, or always once selected, so
          it's reachable on touch devices without a keyboard. */}
      <button
        type="button"
        onClick={handleDelete}
        onPointerDown={(event) => event.stopPropagation()}
        title="Delete this component"
        aria-label="Delete this component"
        className={cn(
          'absolute -top-2 -right-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-black/40 transition-opacity',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <X className="w-2.5 h-2.5" strokeWidth={3} />
      </button>

      <Handle type="target" position={Position.Top} className="!bg-orange-400 !border-[#0e0e0e] !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-orange-400 !border-[#0e0e0e] !w-2 !h-2" />
      <span className={cn('rounded-md w-7 h-7 flex items-center justify-center border shrink-0', meta.text, meta.bg, meta.border)}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
      </span>
      <span className="text-[12px] font-semibold text-white/85 whitespace-nowrap truncate">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400 !border-[#0e0e0e] !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-orange-400 !border-[#0e0e0e] !w-2 !h-2" />
    </div>
  );
}
const nodeTypes = { systemNode: SystemNode };

/* ══════════════════════════════════════════
   PAGE — loads the problem, then hands off to the workbench
══════════════════════════════════════════ */
function DesignSolvePage() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [initialNodes, setInitialNodes] = useState([]);
  const [initialEdges, setInitialEdges] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadState('loading');
      try {
        const { data: problemRes } = await axiosClient.get(`/designprolem/${slug}`);
        if (cancelled) return;
        const p = problemRes.problem;
        setProblem(p);

        // No "latest submission for this problem" endpoint exists, only
        // GET /result/:submissionId — so the last id is kept in localStorage
        // to resume a prior attempt.
        const lastSubmissionId = localStorage.getItem(`design_submission_${p._id}`);
        if (lastSubmissionId) {
          try {
            const { data: subRes } = await axiosClient.get(`/design/result/${lastSubmissionId}`);
            const submission = subRes.submission;
            if (!cancelled && submission?.design) {
              // Nodes restored here are exactly what was POSTed on submit,
              // round-tripped through JSON. Only serializable fields
              // (id/type/position/data.label/data.category/data.componentType)
              // are ever relied on — see the SystemNode comment above.
              setInitialNodes(submission.design.nodes || []);
              setInitialEdges(submission.design.edges || []);
              if (submission.aiEvaluation?.score != null) {
                setEvaluation(submission.aiEvaluation);
                setSubmissionId(lastSubmissionId);
              }
            }
          } catch {
            localStorage.removeItem(`design_submission_${p._id}`);
          }
        }
        setLoadState('ready');
      } catch {
        if (!cancelled) setLoadState('error');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
        <span className="font-data text-[11px] tracking-[3px] uppercase text-white/30">Loading…</span>
      </div>
    );
  }

  if (loadState === 'error' || !problem) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-sm text-rose-400/80">Couldn't load this problem.</p>
        <NavLink to="/design-problems" className="text-xs text-white/40 hover:text-white/70 underline underline-offset-4">
          Back to problems
        </NavLink>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <SolveWorkbench
        problem={problem}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        evaluation={evaluation}
        setEvaluation={setEvaluation}
        submissionId={submissionId}
        setSubmissionId={setSubmissionId}
      />
    </ReactFlowProvider>
  );
}

/* ══════════════════════════════════════════
   WORKBENCH — topbar, palette, canvas, evaluation
══════════════════════════════════════════ */
function SolveWorkbench({ problem, initialNodes, initialEdges, evaluation, setEvaluation, submissionId, setSubmissionId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);
  const wrapperRef = useRef(null);
  const resultRef = useRef(null);

  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | error
  const [submitError, setSubmitError] = useState('');
  const [mobileTab, setMobileTab] = useState('board'); // brief | board | review

  const dc = diffMeta(problem.difficulty);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#ff5b1f', strokeWidth: 1.6 } }, eds)),
    [setEdges]
  );

  const onDragStart = (event, component) => {
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const dropComponent = useCallback(
    (component, clientPos) => {
      if (!rfInstance || !wrapperRef.current) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const point = clientPos
        ? { x: clientPos.x - bounds.left, y: clientPos.y - bounds.top }
        : { x: bounds.width / 2 + (Math.random() * 60 - 30), y: bounds.height / 2 + (Math.random() * 60 - 30) };
      const position = rfInstance.project(point);
      setNodes((nds) =>
        nds.concat({
          id: nextId(),
          type: 'systemNode',
          position,
          // Explicit width/height give the node a real box to resize from
          // (via NodeResizer) instead of only ever auto-sizing to its
          // label. Both are plain numbers, so they serialize fine and
          // round-trip through the backend like everything else in style.
          style: { width: 168, height: 56 },
          // Only serializable fields go on data. `componentType` is the
          // library key (e.g. "rateLimiter") — SystemNode looks the icon
          // up fresh from it via iconFor(), rather than storing the icon
          // component itself, which can't survive being saved and
          // reloaded through the backend (see SystemNode comment).
          data: {
            label: component.label,
            category: component.category,
            componentType: component.type,
          },
        })
      );
    },
    [rfInstance, setNodes]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;
      dropComponent(JSON.parse(raw), { x: event.clientX, y: event.clientY });
    },
    [dropComponent]
  );

  const clearBoard = () => {
    setNodes([]);
    setEdges([]);
  };

  const handleSubmit = async () => {
    if (nodes.length === 0) {
      setSubmitError('Add at least one component to the board before submitting.');
      setSubmitState('error');
      return;
    }
    setSubmitError('');
    setSubmitState('submitting');
    try {
      const { data } = await axiosClient.post(`/design/${problem._id}/submit`, { nodes, edges });
      if (data.submissionId) {
        localStorage.setItem(`design_submission_${problem._id}`, data.submissionId);
        setSubmissionId(data.submissionId);
      }
      setEvaluation(data.evaluation || null);
      setSubmitState('idle');
      setMobileTab('review');
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      const failedSubmissionId = err?.response?.data?.submissionId;
      if (failedSubmissionId) {
        localStorage.setItem(`design_submission_${problem._id}`, failedSubmissionId);
        setSubmissionId(failedSubmissionId);
      }
      setSubmitError(err?.response?.data?.message || 'Something went wrong while submitting. Please try again.');
      setSubmitState('error');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Sora:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Sora', system-ui, sans-serif; }
        .font-data { font-family: 'JetBrains Mono', monospace; }

        .rf-dark .react-flow__attribution { display: none; }
        .rf-dark .react-flow__controls { border-radius: 8px; overflow: hidden; box-shadow: none; }
        .rf-dark .react-flow__controls-button { background: #0e0e0e; border-bottom: 1px solid #1c1c1c; color: #85888f; }
        .rf-dark .react-flow__controls-button:hover { background: #131313; color: #f2f2f2; }
        .rf-dark .react-flow__controls-button svg { fill: currentColor; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body flex flex-col overflow-hidden">
        {/* ── topbar ── */}
        <div className="h-14 flex-none flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-white/[0.08] bg-black/40 backdrop-blur">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <NavLink to="/design-problems" className="text-white/40 hover:text-white/80 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </NavLink>
            <span className="font-display text-[12.5px] sm:text-[13px] font-bold text-white/90 truncate max-w-[120px] sm:max-w-[280px]">
              {problem.title}
            </span>
            <span className={cn('hidden xs:inline-flex font-data text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0', dc.text, dc.bg, dc.border)}>
              {dc.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={clearBoard}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-rose-400 border border-white/10 hover:border-rose-400/30 rounded-lg px-3 h-9 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitState === 'submitting'}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-black font-display font-extrabold text-[12px] rounded-lg px-3.5 sm:px-4 h-9 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {submitState === 'submitting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{submitState === 'submitting' ? 'Evaluating…' : 'Submit design'}</span>
            </button>
          </div>
        </div>

        {/* ── mobile tabs ── */}
        <div className="md:hidden flex-none flex border-b border-white/[0.08] bg-black/20">
          {[
            { id: 'brief', label: 'Brief', icon: ClipboardList },
            { id: 'board', label: 'Board', icon: Layers },
            { id: 'review', label: 'Review', icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-10 text-[11.5px] font-semibold border-b-2 transition-colors',
                mobileTab === t.id ? 'text-orange-400 border-orange-400' : 'text-white/35 border-transparent'
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {submitState === 'error' && submitError && (
          <div className="flex-none text-[11px] font-data text-rose-300 bg-rose-500/10 border-b border-rose-500/20 px-4 py-2">
            {submitError}
          </div>
        )}

        {/* ── body ── */}
        <div className="flex-1 flex min-h-0">
          {/* ── problem + evaluation panel ── */}
          <aside
            className={cn(
              'w-full md:w-[360px] lg:w-[400px] flex-none border-r border-white/[0.08] bg-[#0a0a0a] overflow-y-auto p-5',
              mobileTab === 'board' ? 'hidden md:block' : 'block'
            )}
          >
            <div className={cn(mobileTab === 'review' ? 'hidden md:block' : 'block')}>
              <p className="font-data text-[13px] leading-relaxed text-[#7e92b0] whitespace-pre-wrap mb-6">{problem.description}</p>

              {problem.functionalRequirements?.length > 0 && (
                <Section title="Functional requirements">
                  <ReqList items={problem.functionalRequirements} />
                </Section>
              )}
              {problem.nonFunctionalRequirements?.length > 0 && (
                <Section title="Non-functional requirements">
                  <ReqList items={problem.nonFunctionalRequirements} />
                </Section>
              )}
              {problem.concepts?.length > 0 && (
                <Section title="Concepts">
                  <div className="flex flex-wrap gap-1.5">
                    {problem.concepts.map((c) => (
                      <span key={c} className="font-data text-[10px] text-white/50 bg-white/[0.04] border border-white/10 rounded-full px-2.5 py-1">
                        {c}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div ref={resultRef} className={cn(mobileTab === 'brief' ? 'hidden md:block' : 'block', mobileTab === 'review' && 'mt-0', 'md:mt-6')}>
              {evaluation ? (
                <EvaluationPanel evaluation={evaluation} />
              ) : (
                mobileTab === 'review' && (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <Sparkles className="w-5 h-5 text-white/15 mb-3" />
                    <p className="text-[12.5px] text-white/30">Submit your design to see the review here.</p>
                  </div>
                )
              )}
            </div>
          </aside>

          {/* ── board ── */}
          <section className={cn('flex-1 flex min-h-0 min-w-0', mobileTab === 'board' ? 'flex' : 'hidden md:flex')}>
            <ComponentPalette onDragStart={onDragStart} onTap={(c) => dropComponent(c)} />

            <div className="flex-1 min-w-0 rf-dark relative" ref={wrapperRef}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setRfInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                deleteKeyCode={['Backspace', 'Delete']}
                fitView
                className="!bg-[#0B0B0C]"
              >
                <Background color="#232323" gap={22} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>

              {/* Faint centered watermark. pointer-events-none + very low
                  opacity so it never blocks dragging/clicking nodes or
                  panning the canvas underneath it. */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none">
                <img
                  src={mylogo}
                  alt=""
                  draggable={false}
                  className="max-w-[42%] max-h-[42%] object-contain opacity-[0.05]"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   COMPONENT PALETTE
══════════════════════════════════════════ */
function ComponentPalette({ onDragStart, onTap }) {
  return (
    <div className="w-[180px] flex-none bg-black/60 border-r border-white/[0.08] overflow-y-auto p-3">
      <p className="font-display text-[11px] font-bold text-white/70 mb-0.5">Components</p>
      <p className="text-[10px] text-white/30 mb-4">Drag onto the board</p>

      <div className="flex flex-col gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = COMPONENT_LIBRARY.filter((c) => c.category === cat);
          return (
            <div key={cat}>
              <p className={cn('font-data text-[9px] font-semibold uppercase tracking-wider mb-1.5', meta.text)}>{meta.label}</p>
              <div className="flex flex-col gap-1.5">
                {items.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, c)}
                      onClick={() => onTap?.(c)}
                      title={c.blurb}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-2 cursor-grab active:cursor-grabbing transition-colors select-none',
                        meta.ring
                      )}
                    >
                      <span className={cn('shrink-0 w-7 h-7 rounded-md flex items-center justify-center border', meta.text, meta.bg, meta.border)}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                      </span>
                      <span className="text-[11.5px] font-medium text-white/75 group-hover:text-white/95 leading-tight transition-colors">
                        {c.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-white/30 border-b border-white/[0.08] pb-2 mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function ReqList({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((r, i) => (
        <li key={i} className="text-[12.5px] text-white/70 leading-relaxed flex gap-2">
          <span className="text-orange-500/70 mt-0.5">›</span>
          {r}
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════
   EVALUATION PANEL — score, strengths, issues, suggestions, verdict
══════════════════════════════════════════ */
function ScoreRing({ score }) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (s / 100) * circumference;
  const color = s >= 80 ? '#34d399' : s >= 60 ? '#fb923c' : '#fb7185';
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#ffffff14" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-[15px] text-white">{s}</span>
      </div>
    </div>
  );
}

function EvalItemRow({ item, icon }) {
  const d = describeEvalItem(item);
  return (
    <li className="flex gap-2 text-[12px] text-white/65 leading-relaxed">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        {typeof d === 'string' ? d : (
          <>
            <span className="font-semibold text-white/80">{d.title}. </span>
            {d.body}
          </>
        )}
      </span>
    </li>
  );
}

function EvalList({ label, icon, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1.5">{label}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => <EvalItemRow key={i} item={it} icon={icon} />)}
      </ul>
    </div>
  );
}

function IssueCard({ issue, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = severityMeta(issue.severity);
  const title = issue.title || describeEvalItem(issue);
  const titleText = typeof title === 'string' ? title : title.title;

  return (
    <div className={cn('rounded-lg border overflow-hidden bg-white/[0.02]', meta.border)}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
        <XCircle className={cn('w-3 h-3 shrink-0', meta.text)} />
        <span className="flex-1 text-[12px] font-medium text-white/75 leading-tight">{titleText}</span>
        <span className={cn('font-data text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0', meta.text, meta.bg, meta.border)}>
          {meta.label}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-white/30 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 flex flex-col gap-1.5 text-[11.5px] text-white/60 leading-relaxed">
          {issue.reason && <p><span className="text-white/40">Why: </span>{issue.reason}</p>}
          {issue.impact && <p><span className="text-white/40">Impact: </span>{issue.impact}</p>}
          {issue.fix && <p><span className="text-white/40">Fix: </span>{issue.fix}</p>}
          {!issue.reason && !issue.impact && !issue.fix && typeof title !== 'string' && <p>{title.body}</p>}
        </div>
      )}
    </div>
  );
}

function EvaluationPanel({ evaluation }) {
  const accepted = (evaluation.score ?? 0) >= 60;

  return (
    <div className={cn('rounded-xl border p-4', accepted ? 'bg-emerald-400/[0.05] border-emerald-400/20' : 'bg-orange-400/[0.05] border-orange-400/20')}>
      <div className="flex items-center gap-3">
        <ScoreRing score={evaluation.score} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {accepted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
            <span className="font-display font-bold text-[12.5px] text-white/90">{accepted ? 'Solid foundation' : 'Needs more work'}</span>
          </div>
          <span className="text-[11px] text-white/40">out of 100</span>
        </div>
      </div>

      {evaluation.summary && <p className="text-[12.5px] text-white/65 leading-relaxed mt-3">{evaluation.summary}</p>}

      <EvalList label="Strengths" icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />} items={evaluation.strengths} />

      {evaluation.issues?.length > 0 && (
        <div className="mt-3">
          <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1.5">
            Issues <span className="text-white/20">({evaluation.issues.length})</span>
          </p>
          <div className="flex flex-col gap-1.5">
            {evaluation.issues.map((issue, i) => {
              const sev = String(issue.severity || '').toLowerCase();
              return <IssueCard key={i} issue={issue} defaultOpen={sev === 'critical' || sev === 'high'} />;
            })}
          </div>
        </div>
      )}

      <EvalList label="Suggestions" icon={<Lightbulb className="w-3 h-3 text-orange-400" />} items={evaluation.suggestions} />

      {evaluation.finalVerdict && (
        <div className="mt-3 pt-3 border-t border-white/[0.08]">
          <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">Verdict</p>
          <p className="text-[12.5px] text-white/70 leading-relaxed italic">{evaluation.finalVerdict}</p>
        </div>
      )}
    </div>
  );
}

export default DesignSolvePage;