import { useState, useMemo } from "react";
import { NavLink } from "react-router";

// ─── CodeMaster Color Palette (shared with DSA Visualizer) ───────────────────
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
  tealDim:   "#0a1f1c",
  tealBdr:   "#123a34",
};

const MONO = "'JetBrains Mono', monospace";

// ─── Resource type styling ─────────────────────────────────────────────────
const RTYPE = {
  youtube:    { label: "Video",      short: "YT",   color: CM.red,    dim: CM.redDim,    bdr: CM.redBdr },
  docs:       { label: "Docs",       short: "DOC",  color: CM.blue,   dim: CM.blueDim,   bdr: CM.blueBdr },
  article:    { label: "Article",    short: "ART",  color: CM.teal,   dim: CM.tealDim,   bdr: CM.tealBdr },
  cheatsheet: { label: "Cheatsheet", short: "PDF",  color: CM.purple, dim: CM.purpleDim, bdr: CM.purpleBdr },
  practice:   { label: "Practice",   short: "DO",   color: CM.green,  dim: CM.greenDim,  bdr: CM.greenBdr },
  course:     { label: "Course",     short: "EDU",  color: CM.accent, dim: CM.accentDim, bdr: CM.accentBdr },
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function Badge({ label, color, bg, bdr }) {
  return (
    <span style={{
      background: bg || color + "18", color,
      border: `1px solid ${bdr || color + "40"}`,
      borderRadius: 20, padding: "2px 10px",
      fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: 0.3,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function SectionLabel({ children, color = CM.accent, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: CM.dim }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: CM.border }} />
      {right}
    </div>
  );
}

function ResourceLink({ r }) {
  const t = RTYPE[r.type] || RTYPE.article;
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
      padding: "9px 10px", borderRadius: 7, background: CM.bg,
      border: `1px solid ${CM.border2}`, transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = t.dim; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = CM.border2; e.currentTarget.style.background = CM.bg; }}
    >
      <span style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 800, color: t.color,
        background: t.dim, border: `1px solid ${t.bdr}`, borderRadius: 5,
        padding: "3px 6px", flexShrink: 0, letterSpacing: 0.5, minWidth: 30, textAlign: "center",
      }}>{t.short}</span>
      <span style={{ fontSize: 12.5, color: CM.text, flex: 1, fontFamily: "'Segoe UI',sans-serif" }}>{r.label}</span>
      <span style={{ color: CM.dim, fontSize: 12 }}>↗</span>
    </a>
  );
}

// ─── Topic detail panel (slide-over, opens on node click) ─────────────────────
function TopicPanel({ topic, stageTitle, roadmapColor, done, onToggleDone, onClose }) {
  if (!topic) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end",
      background: "rgba(3,5,8,0.6)", backdropFilter: "blur(2px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(420px, 92vw)", height: "100%", background: CM.surface,
        borderLeft: `1px solid ${CM.border2}`, overflowY: "auto",
        animation: "slideIn 0.2s ease-out",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${CM.border}`,
          display: "flex", alignItems: "flex-start", gap: 10, background: CM.bg, position: "sticky", top: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: roadmapColor, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{stageTitle}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{topic.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: CM.surface2, border: `1px solid ${CM.border2}`, color: CM.muted,
            borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 14, flexShrink: 0,
          }}>✕</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {topic.optional && <Badge label="OPTIONAL" color={CM.dim} bg={CM.surface2} bdr={CM.border2} />}
          <p style={{ fontSize: 13, lineHeight: 1.7, color: CM.muted, margin: 0 }}>{topic.desc}</p>

          <button onClick={onToggleDone} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontFamily: MONO,
            fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
            background: done ? CM.greenDim : CM.surface2,
            color: done ? CM.green : CM.text,
            border: `1px solid ${done ? CM.greenBdr : CM.border2}`,
          }}>
            {done ? "✓ Marked as Learned" : "○ Mark as Learned"}
          </button>

          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: CM.dim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Resources ({topic.resources.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {topic.resources.map((r, i) => <ResourceLink key={i} r={r} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NODE-GRAPH LAYOUT ENGINE — computes pixel positions + connector edges
// for a roadmap.sh-style flowchart from the stage/topic data.
// ══════════════════════════════════════════════════════════════════════════
const NODE_W = 174, NODE_H = 58;
const STAGE_W = 220, STAGE_H = 50;
const COL_GAP = 20, ROW_GAP = 24;
const TOP_GAP = 46, BOTTOM_GAP = 56;
const MAX_COLS = 4;

function layoutRoadmap(stages) {
  let maxRowWidth = STAGE_W;
  stages.forEach(s => {
    for (let i = 0; i < s.topics.length; i += MAX_COLS) {
      const cols = Math.min(MAX_COLS, s.topics.length - i);
      const w = cols * NODE_W + (cols - 1) * COL_GAP;
      if (w > maxRowWidth) maxRowWidth = w;
    }
  });
  const totalWidth = maxRowWidth + 60;
  const cx = totalWidth / 2;

  const stageNodes = [];
  const topicNodes = [];
  const edges = [];
  let cursorY = 34;
  let prevBottomY = null;

  stages.forEach((stage, si) => {
    const stageY = cursorY + STAGE_H / 2;
    if (prevBottomY != null) {
      edges.push({ x1: cx, y1: prevBottomY, x2: cx, y2: stageY - STAGE_H / 2, dashed: false, key: `s${si}-in` });
    }
    stageNodes.push({ id: `stage-${si}`, x: cx, y: stageY, title: stage.title, note: stage.note, index: si });

    const rows = [];
    for (let i = 0; i < stage.topics.length; i += MAX_COLS) rows.push(stage.topics.slice(i, i + MAX_COLS));

    let rowTopAnchorY = stageY + STAGE_H / 2;
    let rowTopAnchorX = cx;

    rows.forEach((row, ri) => {
      const cols = row.length;
      const rowWidth = cols * NODE_W + (cols - 1) * COL_GAP;
      const startX = cx - rowWidth / 2 + NODE_W / 2;
      const rowY = rowTopAnchorY + TOP_GAP + NODE_H / 2;
      const busY = rowTopAnchorY + TOP_GAP / 2;

      edges.push({ x1: rowTopAnchorX, y1: rowTopAnchorY, x2: rowTopAnchorX, y2: busY, key: `bus-v-${si}-${ri}` });
      if (cols > 1) {
        const firstX = startX, lastX = startX + (cols - 1) * (NODE_W + COL_GAP);
        edges.push({ x1: firstX, y1: busY, x2: lastX, y2: busY, key: `bus-h-${si}-${ri}` });
      }

      row.forEach((topic, ci) => {
        const x = startX + ci * (NODE_W + COL_GAP);
        edges.push({ x1: x, y1: busY, x2: x, y2: rowY - NODE_H / 2, dashed: !!topic.optional, key: `stub-${topic.id}` });
        topicNodes.push({ id: topic.id, x, y: rowY, topic, stageIndex: si });
      });

      rowTopAnchorY = rowY + NODE_H / 2;
      rowTopAnchorX = cx;
    });

    prevBottomY = rowTopAnchorY + BOTTOM_GAP / 2;
    cursorY = rowTopAnchorY + BOTTOM_GAP;
  });

  return { width: totalWidth, height: cursorY, stageNodes, topicNodes, edges };
}

// ─── Node visuals ───────────────────────────────────────────────────────────
function StageNodeBox({ node, color }) {
  return (
    <div style={{
      position: "absolute", left: node.x, top: node.y, transform: "translate(-50%,-50%)",
      width: STAGE_W, height: STAGE_H, borderRadius: 10, zIndex: 2,
      background: `linear-gradient(180deg, ${color}22, ${color}0a)`,
      border: `1.5px solid ${color}`, boxShadow: `0 0 16px ${color}33`,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 12px",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", background: color, color: "#0d1117",
        fontFamily: MONO, fontWeight: 800, fontSize: 11, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{node.index + 1}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: CM.text, textAlign: "center", lineHeight: 1.2 }}>{node.title}</span>
    </div>
  );
}

function TopicNodeBox({ node, done, roadmapColor, onOpen }) {
  const topic = node.topic;
  return (
    <button onClick={onOpen} title={topic.title} style={{
      position: "absolute", left: node.x, top: node.y, transform: "translate(-50%,-50%)",
      width: NODE_W, height: NODE_H, zIndex: 2, cursor: "pointer", textAlign: "left",
      borderRadius: 9, padding: "7px 10px",
      background: done ? CM.greenDim : CM.surface2,
      border: `1.5px solid ${done ? CM.greenBdr : CM.border2}`,
      borderStyle: topic.optional && !done ? "dashed" : "solid",
      display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
      transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!done) { e.currentTarget.style.borderColor = roadmapColor; e.currentTarget.style.background = CM.surface; e.currentTarget.style.boxShadow = `0 0 10px ${roadmapColor}44`; } }}
      onMouseLeave={e => { if (!done) { e.currentTarget.style.borderColor = CM.border2; e.currentTarget.style.background = CM.surface2; e.currentTarget.style.boxShadow = "none"; } }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 15, height: 15, borderRadius: 4, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: done ? CM.green : "transparent",
          border: `1.5px solid ${done ? CM.green : CM.dim}`,
          fontSize: 9, fontWeight: 900, color: "#0d1117",
        }}>{done ? "✓" : ""}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: done ? CM.green : CM.text, lineHeight: 1.25,
          overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{topic.title}</span>
      </div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", paddingLeft: 21 }}>
        {topic.resources.slice(0, 4).map((r, i) => {
          const t = RTYPE[r.type] || RTYPE.article;
          return <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, opacity: 0.9 }} />;
        })}
        <span style={{ fontFamily: MONO, fontSize: 8.5, color: CM.dim, marginLeft: 2 }}>{topic.resources.length} res</span>
      </div>
    </button>
  );
}

function RoadmapCanvas({ stages, roadmapColor, progress, onOpenTopic }) {
  const layout = useMemo(() => layoutRoadmap(stages), [stages]);
  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ position: "relative", width: layout.width, height: layout.height, margin: "0 auto" }}>
        <svg width={layout.width} height={layout.height} style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}>
          {layout.edges.map(e => (
            <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={CM.border2} strokeWidth={1.75}
              strokeDasharray={e.dashed ? "4 4" : undefined} />
          ))}
          {layout.topicNodes.map(n => (
            <circle key={"dot-" + n.id} cx={n.x} cy={n.y - NODE_H / 2} r={2.5} fill={progress[n.id] ? CM.green : CM.border2} />
          ))}
        </svg>

        {layout.stageNodes.map(n => <StageNodeBox key={n.id} node={n} color={roadmapColor} />)}
        {layout.topicNodes.map(n => (
          <TopicNodeBox
            key={n.id} node={n} roadmapColor={roadmapColor}
            done={!!progress[n.id]}
            onOpen={() => onOpenTopic(n.topic, stages[n.stageIndex].title)}
          />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROADMAP DATA
// ══════════════════════════════════════════════════════════════════════════
const T = (id, title, desc, resources, optional) => ({ id, title, desc, resources, optional: !!optional });
const R = (type, label, url) => ({ type, label, url });

const ROADMAPS = {
  "Full Stack": {
    color: CM.accent, icon: "🧩", level: "Beginner → Advanced", duration: "6-9 months",
    description: "Everything you need to build and ship complete web applications — from the browser to the database and the server in between.",
    liveLink: "https://roadmap.sh/full-stack",
    stages: [
      { title: "Internet & Web Basics", note: "Understand what actually happens when a URL loads.", topics: [
        T("fs-http","How the Web Works","DNS, HTTP/HTTPS, browsers, hosting and domains — the foundation everything else sits on.",[
          R("youtube","How the Internet Works — freeCodeCamp","https://www.youtube.com/@freecodecamp"),
          R("article","HTTP overview — MDN","https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"),
          R("docs","roadmap.sh: Internet","https://roadmap.sh/computer-science")]),
        T("fs-git","Git & GitHub","Version control basics: commits, branches, merges, pull requests.",[
          R("youtube","Git & GitHub Crash Course","https://www.youtube.com/@programmingwithmosh"),
          R("cheatsheet","Git Cheat Sheet (PDF)","https://education.github.com/git-cheat-sheet-education.pdf"),
          R("practice","Learn Git Branching","https://learngitbranching.js.org/")]),
      ]},
      { title: "Frontend Foundations", note: "The three languages every browser understands.", topics: [
        T("fs-html","HTML5","Semantic markup, forms, accessibility basics.",[
          R("docs","HTML — MDN","https://developer.mozilla.org/en-US/docs/Web/HTML"),
          R("course","freeCodeCamp: Responsive Web Design","https://www.freecodecamp.org/learn/2022/responsive-web-design/")]),
        T("fs-css","CSS3","Box model, Flexbox, Grid, responsive design.",[
          R("docs","CSS — MDN","https://developer.mozilla.org/en-US/docs/Web/CSS"),
          R("youtube","CSS Crash Course — Traversy Media","https://www.youtube.com/@TraversyMedia"),
          R("practice","Flexbox Froggy","https://flexboxfroggy.com/")]),
        T("fs-js","JavaScript","Variables, functions, DOM, async/await, ES6+.",[
          R("docs","The Modern JS Tutorial","https://javascript.info/"),
          R("youtube","JavaScript Full Course — freeCodeCamp","https://www.youtube.com/@freecodecamp"),
          R("cheatsheet","JS Cheatsheet — devhints","https://devhints.io/js")]),
        T("fs-frameworks","Pick a Framework: React / Vue / Svelte","Component-driven UI, state, props, hooks.",[
          R("docs","React Docs","https://react.dev/learn"),
          R("docs","Vue Docs","https://vuejs.org/guide/introduction.html"),
          R("youtube","React Course — freeCodeCamp","https://www.youtube.com/@freecodecamp")], true),
      ]},
      { title: "Backend & APIs", note: "Server-side logic and how the frontend talks to it.", topics: [
        T("fs-node","Node.js & Express","Build REST APIs, middleware, routing.",[
          R("docs","Node.js Docs","https://nodejs.org/en/docs"),
          R("docs","Express Guide","https://expressjs.com/en/guide/routing.html"),
          R("youtube","Node.js Crash Course — Traversy Media","https://www.youtube.com/@TraversyMedia")]),
        T("fs-api","REST API Design","Resources, status codes, versioning, auth.",[
          R("article","REST API Tutorial","https://restfulapi.net/"),
          R("practice","Postman Learning Center","https://learning.postman.com/")]),
        T("fs-auth","Authentication","Sessions, JWT, OAuth2.",[
          R("article","JWT Introduction","https://jwt.io/introduction"),
          R("youtube","Auth Explained — Fireship","https://www.youtube.com/@Fireship")]),
      ]},
      { title: "Databases", note: "Where the application's data actually lives.", topics: [
        T("fs-sql","SQL & PostgreSQL","Schema design, joins, indexes, transactions.",[
          R("docs","PostgreSQL Tutorial","https://www.postgresql.org/docs/current/tutorial.html"),
          R("practice","SQLZoo","https://sqlzoo.net/")]),
        T("fs-nosql","NoSQL: MongoDB","Documents, collections, aggregation.",[
          R("docs","MongoDB Manual","https://www.mongodb.com/docs/manual/"),
          R("youtube","MongoDB Crash Course — Traversy Media","https://www.youtube.com/@TraversyMedia")], true),
        T("fs-orm","ORMs: Prisma / Sequelize","Type-safe database access from code.",[
          R("docs","Prisma Docs","https://www.prisma.io/docs")]),
      ]},
      { title: "DevOps & Deployment", note: "Get the app in front of real users.", topics: [
        T("fs-docker","Docker Basics","Containerize your app for consistent environments.",[
          R("docs","Docker Get Started","https://docs.docker.com/get-started/"),
          R("youtube","Docker in 100 Seconds — Fireship","https://www.youtube.com/@Fireship")]),
        T("fs-ci","CI/CD","Automated testing and deployment pipelines.",[
          R("docs","GitHub Actions Docs","https://docs.github.com/en/actions")]),
        T("fs-hosting","Hosting & DNS","Deploy to Vercel, Netlify, Render, or a VPS.",[
          R("docs","Vercel Docs","https://vercel.com/docs"),
          R("docs","Render Docs","https://render.com/docs")]),
      ]},
      { title: "Beyond the Basics", note: "What separates a junior from a senior full-stack engineer.", topics: [
        T("fs-testing","Testing","Unit, integration and end-to-end tests.",[
          R("docs","Jest Docs","https://jestjs.io/docs/getting-started"),
          R("docs","Playwright Docs","https://playwright.dev/docs/intro")]),
        T("fs-perf","Performance & Caching","Lazy loading, CDNs, Redis caching.",[
          R("article","Web Performance — web.dev","https://web.dev/learn/performance/")]),
        T("fs-system","System Design Basics","Load balancing, scaling, microservices.",[
          R("youtube","System Design Primer","https://www.youtube.com/@Gkcs"),
          R("docs","System Design Primer (GitHub)","https://github.com/donnemartin/system-design-primer")], true),
      ]},
    ],
  },

  "Frontend": {
    color: CM.purple, icon: "🎨", level: "Beginner → Advanced", duration: "4-6 months",
    description: "Master the browser: markup, styling, JavaScript and the modern frameworks used to build interactive interfaces.",
    liveLink: "https://roadmap.sh/frontend",
    stages: [
      { title: "Core Web Languages", topics: [
        T("fe-html","HTML5 & Semantics","Structure content the way browsers and screen readers expect.",[
          R("docs","HTML — MDN","https://developer.mozilla.org/en-US/docs/Web/HTML"),
          R("practice","freeCodeCamp HTML","https://www.freecodecamp.org/learn/2022/responsive-web-design/")]),
        T("fe-css","CSS: Flexbox & Grid","Modern layout systems for any screen size.",[
          R("youtube","CSS Grid Crash Course — Traversy Media","https://www.youtube.com/@TraversyMedia"),
          R("practice","Grid Garden","https://cssgridgarden.com/")]),
        T("fe-js","JavaScript Fundamentals","Closures, promises, the event loop, DOM manipulation.",[
          R("docs","javascript.info","https://javascript.info/"),
          R("youtube","JS Full Course — freeCodeCamp","https://www.youtube.com/@freecodecamp")]),
        T("fe-ts","TypeScript","Add static types on top of JavaScript.",[
          R("docs","TypeScript Handbook","https://www.typescriptlang.org/docs/handbook/intro.html")], true),
      ]},
      { title: "Version Control & Tooling", topics: [
        T("fe-git","Git & GitHub","Branching, PRs, resolving merge conflicts.",[
          R("cheatsheet","Git Cheat Sheet","https://education.github.com/git-cheat-sheet-education.pdf"),
          R("practice","Learn Git Branching","https://learngitbranching.js.org/")]),
        T("fe-build","Build Tools: Vite / Webpack","Bundling, dev servers, hot reload.",[
          R("docs","Vite Docs","https://vitejs.dev/guide/")]),
        T("fe-pkg","Package Managers","npm, pnpm, yarn and semantic versioning.",[
          R("docs","npm Docs","https://docs.npmjs.com/")]),
      ]},
      { title: "Pick a Framework", note: "Choose one to go deep on.", topics: [
        T("fe-react","React","Components, hooks, state management.",[
          R("docs","React Docs","https://react.dev/learn"),
          R("youtube","React Course — freeCodeCamp","https://www.youtube.com/@freecodecamp")]),
        T("fe-vue","Vue","Reactive templates and the Composition API.",[
          R("docs","Vue Docs","https://vuejs.org/guide/introduction.html")], true),
        T("fe-svelte","Svelte","Compiler-based, no virtual DOM.",[
          R("docs","Svelte Tutorial","https://svelte.dev/tutorial")], true),
        T("fe-angular","Angular","Full-featured opinionated framework for large apps.",[
          R("docs","Angular Docs","https://angular.dev/overview")], true),
      ]},
      { title: "Styling at Scale", topics: [
        T("fe-tailwind","Tailwind CSS","Utility-first styling.",[
          R("docs","Tailwind Docs","https://tailwindcss.com/docs/installation")]),
        T("fe-css-arch","CSS Architecture","BEM, CSS Modules, styled-components.",[
          R("article","CSS Modules — CSS Tricks","https://css-tricks.com/css-modules-part-1-need/")], true),
        T("fe-anim","Animation","Transitions, keyframes, Framer Motion.",[
          R("docs","Framer Motion Docs","https://www.framer.com/motion/")], true),
      ]},
      { title: "State, Testing & Shipping", topics: [
        T("fe-state","State Management","Context, Redux, Zustand, or signals.",[
          R("docs","Redux Toolkit Docs","https://redux-toolkit.js.org/introduction/getting-started")]),
        T("fe-test","Testing","React Testing Library, Playwright, Cypress.",[
          R("docs","Testing Library Docs","https://testing-library.com/docs/")]),
        T("fe-a11y","Accessibility (a11y)","ARIA, keyboard navigation, contrast.",[
          R("docs","Web Accessibility — MDN","https://developer.mozilla.org/en-US/docs/Web/Accessibility")]),
        T("fe-deploy","Deployment","Vercel, Netlify, CDNs.",[
          R("docs","Vercel Docs","https://vercel.com/docs")]),
      ]},
    ],
  },

  "Backend": {
    color: CM.blue, icon: "🗄️", level: "Beginner → Advanced", duration: "5-7 months",
    description: "Servers, APIs, databases and everything that runs behind the scenes to power an application.",
    liveLink: "https://roadmap.sh/backend",
    stages: [
      { title: "Pick a Language", note: "Any of these can build production backends.", topics: [
        T("be-node","Node.js (JavaScript)","Event-driven, single language across the stack.",[
          R("docs","Node.js Docs","https://nodejs.org/en/docs"),
          R("youtube","Node Crash Course — Traversy Media","https://www.youtube.com/@TraversyMedia")]),
        T("be-python","Python (Django / FastAPI)","Readable syntax, huge ecosystem.",[
          R("docs","FastAPI Docs","https://fastapi.tiangolo.com/"),
          R("docs","Django Docs","https://docs.djangoproject.com/en/stable/")], true),
        T("be-go","Go","Fast, simple, great for concurrency.",[
          R("docs","Go Tour","https://go.dev/tour/welcome/1")], true),
        T("be-java","Java (Spring Boot)","Enterprise-grade, strongly typed.",[
          R("docs","Spring Boot Docs","https://spring.io/projects/spring-boot")], true),
      ]},
      { title: "Databases", topics: [
        T("be-sql","Relational DBs: PostgreSQL / MySQL","Schema design, normalization, indexing.",[
          R("docs","PostgreSQL Docs","https://www.postgresql.org/docs/current/tutorial.html"),
          R("practice","SQLZoo","https://sqlzoo.net/")]),
        T("be-nosql","NoSQL: MongoDB / Redis","Document stores and in-memory caching.",[
          R("docs","MongoDB Manual","https://www.mongodb.com/docs/manual/"),
          R("docs","Redis Docs","https://redis.io/docs/latest/")]),
        T("be-orm","ORMs / Query Builders","Prisma, SQLAlchemy, TypeORM.",[
          R("docs","Prisma Docs","https://www.prisma.io/docs")]),
      ]},
      { title: "APIs & Communication", topics: [
        T("be-rest","REST APIs","Resource modeling, status codes, pagination.",[
          R("article","REST API Tutorial","https://restfulapi.net/")]),
        T("be-graphql","GraphQL","Query language for flexible APIs.",[
          R("docs","GraphQL Docs","https://graphql.org/learn/")], true),
        T("be-grpc","gRPC & Message Queues","Service-to-service communication, RabbitMQ/Kafka.",[
          R("docs","gRPC Docs","https://grpc.io/docs/"), R("docs","Kafka Docs","https://kafka.apache.org/documentation/")], true),
      ]},
      { title: "Security & Auth", topics: [
        T("be-auth","Authentication & Authorization","JWT, OAuth2, sessions, RBAC.",[
          R("article","JWT Introduction","https://jwt.io/introduction")]),
        T("be-owasp","Web Security Basics","Injection, XSS, CSRF and how to prevent them.",[
          R("docs","OWASP Top 10","https://owasp.org/www-project-top-ten/")]),
      ]},
      { title: "Scaling & Architecture", topics: [
        T("be-cache","Caching","Redis, CDN caching, cache invalidation strategies.",[
          R("docs","Redis Docs","https://redis.io/docs/latest/")]),
        T("be-micro","Microservices vs Monoliths","Trade-offs of splitting services apart.",[
          R("article","Microservices — martinfowler.com","https://martinfowler.com/articles/microservices.html")], true),
        T("be-design","System Design","Load balancing, sharding, consistency models.",[
          R("docs","System Design Primer (GitHub)","https://github.com/donnemartin/system-design-primer")]),
        T("be-docker","Docker & Deployment","Containerize and ship your services.",[
          R("docs","Docker Get Started","https://docs.docker.com/get-started/")]),
      ]},
    ],
  },

  "DevOps": {
    color: CM.green, icon: "⚙️", level: "Intermediate → Advanced", duration: "5-8 months",
    description: "Bridge development and operations: automate builds, manage infrastructure, and keep systems reliable at scale.",
    liveLink: "https://roadmap.sh/devops",
    stages: [
      { title: "Foundations", topics: [
        T("do-linux","Linux Fundamentals","The shell, file system, permissions, processes.",[
          R("docs","Linux Journey","https://linuxjourney.com/"),
          R("youtube","Linux Crash Course — NetworkChuck","https://www.youtube.com/@NetworkChuck")]),
        T("do-net","Networking Basics","TCP/IP, DNS, load balancers, firewalls.",[
          R("youtube","Networking Fundamentals — NetworkChuck","https://www.youtube.com/@NetworkChuck")]),
        T("do-git","Git & Version Control","Branching strategies for teams.",[
          R("cheatsheet","Git Cheat Sheet","https://education.github.com/git-cheat-sheet-education.pdf")]),
        T("do-script","Scripting: Bash & Python","Automate repetitive operational tasks.",[
          R("docs","Bash Guide","https://mywiki.wooledge.org/BashGuide")]),
      ]},
      { title: "Containers & Orchestration", topics: [
        T("do-docker","Docker","Images, containers, volumes, networking.",[
          R("docs","Docker Get Started","https://docs.docker.com/get-started/"),
          R("cheatsheet","Docker Cheat Sheet","https://devhints.io/docker")]),
        T("do-k8s","Kubernetes","Pods, deployments, services, scaling.",[
          R("docs","Kubernetes Docs","https://kubernetes.io/docs/home/"),
          R("youtube","Kubernetes Crash Course — TechWorld with Nana","https://www.youtube.com/@TechWorldwithNana")]),
        T("do-helm","Helm","Package manager for Kubernetes.",[
          R("docs","Helm Docs","https://helm.sh/docs/")], true),
      ]},
      { title: "CI/CD & Automation", topics: [
        T("do-ci","CI/CD Pipelines","GitHub Actions, GitLab CI, Jenkins.",[
          R("docs","GitHub Actions Docs","https://docs.github.com/en/actions")]),
        T("do-iac","Infrastructure as Code","Terraform, Pulumi, CloudFormation.",[
          R("docs","Terraform Tutorials","https://developer.hashicorp.com/terraform/tutorials")]),
        T("do-ansible","Config Management: Ansible","Automate server configuration at scale.",[
          R("docs","Ansible Docs","https://docs.ansible.com/")], true),
      ]},
      { title: "Cloud Platforms", note: "Pick one major provider to specialize in first.", topics: [
        T("do-aws","AWS","EC2, S3, IAM, VPC, Lambda.",[
          R("docs","AWS Docs","https://docs.aws.amazon.com/"),
          R("course","AWS Skill Builder","https://skillbuilder.aws/")]),
        T("do-gcp","Google Cloud","Compute Engine, GKE, Cloud Functions.",[
          R("docs","GCP Docs","https://cloud.google.com/docs")], true),
        T("do-azure","Microsoft Azure","VMs, AKS, Azure Functions.",[
          R("docs","Azure Docs","https://learn.microsoft.com/en-us/azure/")], true),
      ]},
      { title: "Observability & Reliability", topics: [
        T("do-mon","Monitoring & Logging","Prometheus, Grafana, the ELK stack.",[
          R("docs","Prometheus Docs","https://prometheus.io/docs/introduction/overview/"),
          R("docs","Grafana Docs","https://grafana.com/docs/grafana/latest/")]),
        T("do-sre","SRE Practices","SLOs, SLIs, incident response, on-call.",[
          R("docs","Google SRE Book","https://sre.google/sre-book/table-of-contents/")]),
        T("do-security","DevSecOps","Secrets management, image scanning, least privilege.",[
          R("docs","OWASP DevSecOps Guideline","https://owasp.org/www-project-devsecops-guideline/")], true),
      ]},
    ],
  },

  "AI / Machine Learning": {
    color: CM.teal, icon: "🤖", level: "Intermediate → Advanced", duration: "6-10 months",
    description: "From the math foundations to training and deploying real machine learning and deep learning models.",
    liveLink: "https://roadmap.sh/ai-data-scientist",
    stages: [
      { title: "Math & Programming Foundations", topics: [
        T("ai-py","Python for Data","NumPy, Pandas, Matplotlib.",[
          R("docs","NumPy Quickstart","https://numpy.org/doc/stable/user/quickstart.html"),
          R("docs","Pandas Docs","https://pandas.pydata.org/docs/user_guide/index.html")]),
        T("ai-math","Linear Algebra & Calculus","Vectors, matrices, derivatives, gradients.",[
          R("youtube","Essence of Linear Algebra — 3Blue1Brown","https://www.youtube.com/@3blue1brown"),
          R("course","Khan Academy: Linear Algebra","https://www.khanacademy.org/math/linear-algebra")]),
        T("ai-stats","Statistics & Probability","Distributions, hypothesis testing, Bayes' theorem.",[
          R("youtube","StatQuest with Josh Starmer","https://www.youtube.com/@statquest")]),
      ]},
      { title: "Classical Machine Learning", topics: [
        T("ai-ml-basics","ML Fundamentals","Supervised vs unsupervised, train/test splits, overfitting.",[
          R("course","Kaggle: Intro to Machine Learning","https://www.kaggle.com/learn/intro-to-machine-learning")]),
        T("ai-sklearn","scikit-learn","Regression, classification, clustering in practice.",[
          R("docs","scikit-learn Tutorials","https://scikit-learn.org/stable/tutorial/index.html")]),
        T("ai-eval","Model Evaluation","Precision, recall, ROC curves, cross-validation.",[
          R("article","Model Evaluation — scikit-learn Docs","https://scikit-learn.org/stable/modules/model_evaluation.html")]),
      ]},
      { title: "Deep Learning", topics: [
        T("ai-nn","Neural Networks","Perceptrons, backpropagation, activation functions.",[
          R("youtube","Neural Networks — 3Blue1Brown","https://www.youtube.com/@3blue1brown")]),
        T("ai-pytorch","PyTorch","Build and train models with tensors and autograd.",[
          R("docs","PyTorch Tutorials","https://pytorch.org/tutorials/")]),
        T("ai-tf","TensorFlow / Keras","Alternative deep learning framework.",[
          R("docs","TensorFlow Tutorials","https://www.tensorflow.org/tutorials")], true),
        T("ai-cnn","CNNs & Computer Vision","Image classification, convolutions, pooling.",[
          R("docs","CS231n Notes","https://cs231n.github.io/")]),
      ]},
      { title: "NLP & Modern AI", topics: [
        T("ai-nlp","NLP Basics","Tokenization, embeddings, sequence models.",[
          R("docs","Hugging Face NLP Course","https://huggingface.co/learn/nlp-course")]),
        T("ai-transformers","Transformers & LLMs","Attention mechanisms, fine-tuning, prompting.",[
          R("article","The Illustrated Transformer","https://jalammar.github.io/illustrated-transformer/"),
          R("docs","Hugging Face Transformers Docs","https://huggingface.co/docs/transformers/index")]),
        T("ai-rag","RAG & AI Agents","Retrieval-augmented generation and tool-using agents.",[
          R("docs","LangChain Docs","https://python.langchain.com/docs/introduction/")], true),
      ]},
      { title: "MLOps & Deployment", topics: [
        T("ai-deploy","Model Deployment","Serving models via APIs, batch vs real-time inference.",[
          R("docs","FastAPI Docs","https://fastapi.tiangolo.com/")]),
        T("ai-mlops","MLOps","Experiment tracking, model versioning, pipelines.",[
          R("docs","MLflow Docs","https://mlflow.org/docs/latest/index.html")], true),
        T("ai-ethics","Responsible AI","Bias, fairness, interpretability.",[
          R("article","Responsible AI Practices — Google","https://ai.google/responsibility/responsible-ai-practices/")]),
      ]},
    ],
  },

  "Python Developer": {
    color: CM.blue, icon: "🐍", level: "Beginner → Advanced", duration: "3-5 months",
    description: "A dedicated path through Python itself — syntax to standard library to real backend and automation work.",
    liveLink: "https://roadmap.sh/python",
    stages: [
      { title: "Language Basics", topics: [
        T("py-syntax","Syntax & Data Types","Variables, strings, numbers, lists, dicts, tuples.",[
          R("docs","Python Official Tutorial","https://docs.python.org/3/tutorial/"),
          R("youtube","Python Full Course — freeCodeCamp","https://www.youtube.com/@freecodecamp")]),
        T("py-control","Control Flow","Conditionals, loops, comprehensions.",[
          R("article","Real Python: List Comprehensions","https://realpython.com/list-comprehension-python/")]),
        T("py-func","Functions & Scope","Args, kwargs, closures, decorators.",[
          R("article","Real Python: Decorators","https://realpython.com/primer-on-python-decorators/")]),
      ]},
      { title: "Intermediate Python", topics: [
        T("py-oop","Object-Oriented Python","Classes, inheritance, dunder methods.",[
          R("docs","Python Classes Docs","https://docs.python.org/3/tutorial/classes.html")]),
        T("py-modules","Modules & Packages","Imports, virtual environments, pip.",[
          R("docs","Python Packaging Guide","https://packaging.python.org/en/latest/tutorials/installing-packages/")]),
        T("py-errors","Error Handling","try/except, custom exceptions, context managers.",[
          R("docs","Errors and Exceptions — Python Docs","https://docs.python.org/3/tutorial/errors.html")]),
        T("py-files","Files & I/O","Reading/writing files, working with JSON and CSV.",[
          R("docs","Reading and Writing Files — Python Docs","https://docs.python.org/3/tutorial/inputoutput.html")]),
      ]},
      { title: "Testing & Tooling", topics: [
        T("py-test","Testing: pytest","Unit tests, fixtures, mocking.",[
          R("docs","pytest Docs","https://docs.pytest.org/en/stable/")]),
        T("py-lint","Linting & Formatting","black, ruff, type hints with mypy.",[
          R("docs","mypy Docs","https://mypy.readthedocs.io/en/stable/")], true),
        T("py-async","Async Python","asyncio, coroutines, concurrency.",[
          R("docs","asyncio Docs","https://docs.python.org/3/library/asyncio.html")]),
      ]},
      { title: "Build Something", note: "Apply Python to a real domain.", topics: [
        T("py-web","Web: Django / FastAPI / Flask","Build web apps and APIs.",[
          R("docs","FastAPI Docs","https://fastapi.tiangolo.com/"),
          R("docs","Flask Docs","https://flask.palletsprojects.com/en/latest/")]),
        T("py-data","Data: Pandas & NumPy","Analyze and manipulate structured data.",[
          R("docs","Pandas Docs","https://pandas.pydata.org/docs/user_guide/index.html")], true),
        T("py-automation","Automation & Scripting","Web scraping, file automation, CLI tools.",[
          R("docs","Beautiful Soup Docs","https://www.crummy.com/software/BeautifulSoup/bs4/doc/")], true),
      ]},
      { title: "Ship It", topics: [
        T("py-db","Databases","SQLAlchemy, psycopg2, connecting to Postgres.",[
          R("docs","SQLAlchemy Docs","https://docs.sqlalchemy.org/en/latest/")]),
        T("py-docker","Docker for Python Apps","Containerize a Python service.",[
          R("docs","Docker Get Started","https://docs.docker.com/get-started/")]),
        T("py-deploy","Deployment","Deploy to Render, Railway, or a VPS.",[
          R("docs","Render Docs","https://render.com/docs")]),
      ]},
    ],
  },
};

const ROADMAP_NAMES = Object.keys(ROADMAPS);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function RoadmapVisualizer() {
  const [activeMap, setActiveMap] = useState("Full Stack");
  const [progress, setProgress] = useState({}); // { mapName: { topicId: true } }
  const [panel, setPanel] = useState(null); // { topic, stageTitle }

  const roadmap = ROADMAPS[activeMap];
  const mapProgress = progress[activeMap] || {};

  const totals = useMemo(() => {
    let total = 0, done = 0;
    roadmap.stages.forEach(s => s.topics.forEach(t => {
      total++; if (mapProgress[t.id]) done++;
    }));
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [roadmap, mapProgress]);

  const toggleDone = (topicId) => {
    setProgress(p => ({
      ...p,
      [activeMap]: { ...(p[activeMap] || {}), [topicId]: !(p[activeMap] || {})[topicId] },
    }));
  };

  const resetProgress = () => setProgress(p => ({ ...p, [activeMap]: {} }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${CM.surface};}
        ::-webkit-scrollbar-thumb{background:${CM.border2};border-radius:3px;}
        @keyframes slideIn{from{transform:translateX(24px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        button{font-family:inherit;}
      `}</style>

      <div style={{ background: CM.bg, minHeight: "100vh", color: CM.text, fontFamily: "'Segoe UI',-apple-system,sans-serif" }}>

        {/* ── TOPBAR ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, height: 48, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ffa116,#ff6b00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>⌨</div>
          <NavLink to={"/"}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, color: CM.text }}>CodeMaster</span>
          </NavLink>
          <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px" }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: CM.muted }}>
            <NavLink to={"/explore"} style={{ color: CM.muted, textDecoration: "none" }}>Explore</NavLink> / <span style={{ color: CM.accent }}>Roadmaps</span>
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Badge label="Interactive" color={CM.green} />
            <Badge label={`${ROADMAP_NAMES.length} Roadmaps`} color={CM.accent} />
            <a href="https://roadmap.sh" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Badge label="roadmap.sh ↗" color={CM.purple} />
            </a>
          </div>
        </div>

        {/* ── ROADMAP TABS ── */}
        <div style={{ background: CM.surface, borderBottom: `1px solid ${CM.border}`, display: "flex", overflowX: "auto", padding: "0 4px" }}>
          {ROADMAP_NAMES.map(name => {
            const m = ROADMAPS[name];
            return (
              <button key={name} onClick={() => setActiveMap(name)} style={{
                padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: "transparent", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                color: activeMap === name ? m.color : CM.muted,
                borderBottom: activeMap === name ? `2px solid ${m.color}` : "2px solid transparent",
                fontFamily: MONO, letterSpacing: 0.3, transition: "all 0.15s",
              }}>
                <span>{m.icon}</span>{name}
              </button>
            );
          })}
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "26px 20px 70px" }}>

          {/* ── Roadmap header ── */}
          <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{roadmap.icon}</span>
                  <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0 }}>{activeMap} Roadmap</h2>
                </div>
                <p style={{ fontSize: 12.5, color: CM.muted, lineHeight: 1.6, margin: "0 0 10px", maxWidth: 560 }}>{roadmap.description}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge label={roadmap.level} color={roadmap.color} />
                  <Badge label={`~${roadmap.duration}`} color={CM.blue} />
                  <Badge label={`${totals.total} Topics`} color={CM.dim} bg={CM.surface2} bdr={CM.border2} />
                  <a href={roadmap.liveLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <Badge label="View on roadmap.sh ↗" color={CM.teal} />
                  </a>
                </div>
              </div>

              <div style={{ minWidth: 160 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: CM.dim, letterSpacing: 1 }}>PROGRESS</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: roadmap.color }}>{totals.pct}%</span>
                </div>
                <div style={{ width: 160, height: 7, borderRadius: 4, background: CM.bg, border: `1px solid ${CM.border2}`, overflow: "hidden" }}>
                  <div style={{ width: `${totals.pct}%`, height: "100%", background: roadmap.color, transition: "width 0.3s", boxShadow: `0 0 8px ${roadmap.color}66` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: CM.dim }}>{totals.done}/{totals.total} done</span>
                  <button onClick={resetProgress} style={{ background: "none", border: "none", color: CM.dim, fontFamily: MONO, fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>reset</button>
                </div>
              </div>
            </div>
          </div>

          <SectionLabel color={roadmap.color} right={<span style={{ fontFamily: MONO, fontSize: 10, color: CM.dim }}>click a node ↴</span>}>
            Learning Path
          </SectionLabel>

          {/* ── Connected node-graph roadmap ── */}
          <div style={{ background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 12, padding: "18px 10px" }}>
            <RoadmapCanvas
              stages={roadmap.stages}
              roadmapColor={roadmap.color}
              progress={mapProgress}
              onOpenTopic={(t, stageTitle) => setPanel({ topic: t, stageTitle })}
            />
          </div>

          {/* ── Legend ── */}
          <div style={{ marginTop: 16, background: CM.surface, border: `1px solid ${CM.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: CM.dim, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Resource Key</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(RTYPE).map(([k, t]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: CM.muted, fontFamily: MONO }}>{t.label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px dashed ${CM.border}`, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: CM.muted, fontFamily: MONO }}>Optional topic</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {panel && (
        <TopicPanel
          topic={panel.topic}
          stageTitle={panel.stageTitle}
          roadmapColor={roadmap.color}
          done={!!mapProgress[panel.topic.id]}
          onToggleDone={() => toggleDone(panel.topic.id)}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  );
}