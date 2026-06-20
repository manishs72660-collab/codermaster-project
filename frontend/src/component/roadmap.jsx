import { useState, useMemo, useEffect, useRef } from "react";

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

const roadmaps = [
  {
    id: "dsa",
    title: "DSA",
    fullTitle: "Data Structures & Algorithms",
    icon: "DS",
    tagline: "Crack interviews, think in complexity",
    ext: ".algo",
    stages: [
      {
        heading: "Foundations",
        items: [
          { label: "Time & Space Complexity", note: "Big-O, Big-Theta, amortized analysis" },
          { label: "Arrays & Strings", note: "Two pointers, sliding window, prefix sums" },
          { label: "Recursion & Backtracking", note: "Base cases, recursion tree, memo paths" },
          { label: "Searching", note: "Binary search and its many disguises" },
          { label: "Sorting", note: "Merge, quick, counting — know when each wins" },
        ],
      },
      {
        heading: "Core Structures",
        items: [
          { label: "Linked Lists", note: "Singly, doubly, fast/slow pointers" },
          { label: "Stacks & Queues", note: "Monotonic stack, circular queue" },
          { label: "Hash Maps & Sets", note: "Collision handling, load factor" },
          { label: "Trees", note: "BST, traversals, height/balance" },
          { label: "Heaps & Priority Queues", note: "Min/max heap, heapify" },
        ],
      },
      {
        heading: "Graphs",
        items: [
          { label: "Graph Representations", note: "Adjacency list vs matrix" },
          { label: "BFS / DFS", note: "Traversal, connected components" },
          { label: "Shortest Path", note: "Dijkstra, Bellman-Ford, Floyd-Warshall" },
          { label: "Union-Find", note: "Disjoint sets, path compression" },
          { label: "Topological Sort", note: "Kahn's algorithm, cycle detection" },
        ],
      },
      {
        heading: "Advanced Patterns",
        items: [
          { label: "Dynamic Programming", note: "1D/2D DP, state transitions" },
          { label: "Greedy Algorithms", note: "Exchange argument, proof of correctness" },
          { label: "Tries", note: "Prefix trees, autocomplete" },
          { label: "Bit Manipulation", note: "XOR tricks, bitmasking DP" },
          { label: "System Design Basics", note: "For when interviews go beyond DSA" },
        ],
      },
    ],
  },
  {
    id: "fullstack",
    title: "Full Stack",
    fullTitle: "Full Stack Web Development",
    icon: "FS",
    tagline: "From a button click to a deployed server",
    ext: ".stack",
    stages: [
      {
        heading: "Web Foundations",
        items: [
          { label: "HTML & Semantic Markup", note: "Structure that means something" },
          { label: "CSS & Layout", note: "Flexbox, Grid, responsive design" },
          { label: "JavaScript Fundamentals", note: "Closures, async, the event loop" },
          { label: "Git & GitHub", note: "Branching, PRs, rebase vs merge" },
          { label: "DevTools & Debugging", note: "Network tab, breakpoints, console" },
        ],
      },
      {
        heading: "Frontend",
        items: [
          { label: "React Fundamentals", note: "Components, props, state" },
          { label: "Hooks & State Management", note: "useState/useEffect, Context, Redux/Zustand" },
          { label: "Routing", note: "Client-side navigation, dynamic routes" },
          { label: "API Integration", note: "fetch/axios, loading & error states" },
          { label: "Styling Systems", note: "Tailwind, CSS-in-JS, design tokens" },
        ],
      },
      {
        heading: "Backend",
        items: [
          { label: "Node.js & Express", note: "Routing, middleware, error handling" },
          { label: "REST API Design", note: "Resources, status codes, versioning" },
          { label: "Authentication", note: "JWT, sessions, OAuth basics" },
          { label: "Databases", note: "SQL vs NoSQL, schema design" },
          { label: "ORMs / ODMs", note: "Mongoose, Prisma — query without raw SQL" },
        ],
      },
      {
        heading: "Ship It",
        items: [
          { label: "Testing", note: "Unit, integration, e2e basics" },
          { label: "CI/CD", note: "Automated build, test, deploy pipelines" },
          { label: "Docker", note: "Containerize the app, not just code it" },
          { label: "Cloud Deployment", note: "Vercel, Render, AWS basics" },
          { label: "Monitoring & Logging", note: "Know when prod breaks before users tell you" },
        ],
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    fullTitle: "System Design & Architecture",
    icon: "SD",
    tagline: "Design things that survive real traffic",
    ext: ".arch",
    stages: [
      {
        heading: "Core Concepts",
        items: [
          { label: "Scalability Basics", note: "Vertical vs horizontal scaling" },
          { label: "Latency vs Throughput", note: "Know which one you're optimizing" },
          { label: "CAP Theorem", note: "Consistency, availability, partition tolerance" },
          { label: "Load Balancing", note: "Round robin, least connections, health checks" },
        ],
      },
      {
        heading: "Data Layer",
        items: [
          { label: "Database Scaling", note: "Replication, sharding, read replicas" },
          { label: "Caching", note: "Redis, cache invalidation strategies" },
          { label: "Indexing", note: "B-trees, composite indexes, query plans" },
          { label: "Message Queues", note: "Kafka, RabbitMQ — decoupling services" },
        ],
      },
      {
        heading: "Architecture Patterns",
        items: [
          { label: "Microservices", note: "Service boundaries, communication patterns" },
          { label: "API Gateway", note: "Single entry point, rate limiting" },
          { label: "Event-Driven Design", note: "Pub/sub, eventual consistency" },
          { label: "CDN & Edge", note: "Serve content close to the user" },
        ],
      },
      {
        heading: "Case Studies",
        items: [
          { label: "Design a URL Shortener", note: "Classic — hashing, redirects, analytics" },
          { label: "Design a Chat App", note: "WebSockets, message delivery guarantees" },
          { label: "Design a News Feed", note: "Fan-out on write vs read" },
          { label: "Design a Rate Limiter", note: "Token bucket, sliding window" },
        ],
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps",
    fullTitle: "DevOps & Cloud Infrastructure",
    icon: "OP",
    tagline: "Automate the path from code to production",
    ext: ".ops",
    stages: [
      {
        heading: "Foundations",
        items: [
          { label: "Linux & Shell Scripting", note: "Permissions, processes, bash basics" },
          { label: "Networking Basics", note: "DNS, HTTP/S, TCP/IP fundamentals" },
          { label: "Version Control", note: "Git workflows for teams" },
        ],
      },
      {
        heading: "Containers & Orchestration",
        items: [
          { label: "Docker", note: "Images, volumes, multi-stage builds" },
          { label: "Docker Compose", note: "Multi-container local environments" },
          { label: "Kubernetes Basics", note: "Pods, services, deployments" },
          { label: "Helm Charts", note: "Templated K8s configuration" },
        ],
      },
      {
        heading: "Automation",
        items: [
          { label: "CI/CD Pipelines", note: "GitHub Actions, Jenkins, GitLab CI" },
          { label: "Infrastructure as Code", note: "Terraform, Pulumi" },
          { label: "Configuration Management", note: "Ansible basics" },
        ],
      },
      {
        heading: "Operate at Scale",
        items: [
          { label: "Monitoring", note: "Prometheus, Grafana dashboards" },
          { label: "Logging", note: "Centralized logs, ELK stack" },
          { label: "Cloud Providers", note: "AWS/GCP/Azure core services" },
          { label: "Cost Optimization", note: "Right-sizing, spot instances" },
        ],
      },
    ],
  },
  {
    id: "ml",
    title: "Machine Learning",
    fullTitle: "Machine Learning Engineer",
    icon: "ML",
    tagline: "From math to models in production",
    ext: ".model",
    stages: [
      {
        heading: "Math Foundations",
        items: [
          { label: "Linear Algebra", note: "Vectors, matrices, eigenvalues" },
          { label: "Probability & Statistics", note: "Distributions, Bayes' theorem" },
          { label: "Calculus", note: "Gradients, partial derivatives" },
        ],
      },
      {
        heading: "Core ML",
        items: [
          { label: "Python for ML", note: "NumPy, Pandas, data wrangling" },
          { label: "Supervised Learning", note: "Regression, classification, trees" },
          { label: "Unsupervised Learning", note: "Clustering, dimensionality reduction" },
          { label: "Model Evaluation", note: "Precision, recall, cross-validation" },
        ],
      },
      {
        heading: "Deep Learning",
        items: [
          { label: "Neural Network Basics", note: "Forward pass, backprop" },
          { label: "CNNs", note: "Convolutions for vision tasks" },
          { label: "RNNs & Transformers", note: "Sequence modeling, attention" },
          { label: "PyTorch / TensorFlow", note: "Pick one, go deep" },
        ],
      },
      {
        heading: "Production ML",
        items: [
          { label: "Model Deployment", note: "Serving endpoints, batching" },
          { label: "MLOps", note: "Versioning data, models, experiments" },
          { label: "Monitoring Drift", note: "Know when your model goes stale" },
        ],
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobile Dev",
    fullTitle: "Mobile App Development",
    icon: "MB",
    tagline: "Ship to the device in someone's pocket",
    ext: ".app",
    stages: [
      {
        heading: "Foundations",
        items: [
          { label: "Mobile UI Principles", note: "Touch targets, platform conventions" },
          { label: "React Native / Flutter", note: "Pick a cross-platform framework" },
          { label: "Navigation", note: "Stack, tab, drawer navigators" },
        ],
      },
      {
        heading: "App Logic",
        items: [
          { label: "State Management", note: "Local state vs global stores" },
          { label: "Local Storage", note: "AsyncStorage, SQLite on-device" },
          { label: "API & Networking", note: "Offline-first patterns" },
          { label: "Push Notifications", note: "FCM, APNs basics" },
        ],
      },
      {
        heading: "Native Capabilities",
        items: [
          { label: "Camera & Media", note: "Permissions, file handling" },
          { label: "Device Sensors", note: "GPS, accelerometer" },
          { label: "Native Modules", note: "Bridging to platform code" },
        ],
      },
      {
        heading: "Ship It",
        items: [
          { label: "Testing on Devices", note: "Emulators vs real hardware" },
          { label: "App Store Submission", note: "Review guidelines, screenshots" },
          { label: "Crash Reporting", note: "Sentry, Crashlytics" },
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------
   STYLES — same black/orange terminal system as cheat sheet
--------------------------------------------------------- */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .rm-root {
    --bg:        #060606;
    --bg-raised: #0c0c0c;
    --bg-card:   #0e0e0e;
    --bg-inset:  #050505;
    --line:      #1c1c1c;
    --line-soft: #141414;
    --ink:       #e8e6e1;
    --ink-dim:   #6f6f6f;
    --ink-faint: #3d3d3d;
    --orange:    #ff7a18;
    --orange-dim: #ff7a1822;
    --orange-soft:#ff7a1812;
    --green:     #9fb88a;

    min-height: 100vh;
    background:
      radial-gradient(ellipse 900px 500px at 50% -10%, #ff7a1810, transparent 60%),
      var(--bg);
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
    padding: 0 0 80px;
  }

  .rm-root *:focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 2px;
  }

  button { font-family: inherit; }

  /* ---------- Top bar ---------- */
  .rm-topbar {
    border-bottom: 1px solid var(--line);
    background: rgba(6,6,6,0.9);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .rm-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .rm-dots { display: flex; gap: 6px; flex-shrink: 0; }
  .rm-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); }
  .rm-dot.live { background: var(--orange); box-shadow: 0 0 8px var(--orange); }

  .rm-brand {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--ink);
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .rm-brand span { color: var(--orange); }

  .rm-topbar-meta {
    margin-left: auto;
    color: var(--ink-dim);
    font-size: 0.72rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ---------- Header ---------- */
  .rm-header {
    max-width: 1180px;
    margin: 0 auto;
    padding: 56px 24px 36px;
  }

  .rm-header-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--orange);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rm-header-eyebrow::before {
    content: '';
    width: 16px;
    height: 1px;
    background: var(--orange);
  }

  .rm-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.6rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin-bottom: 10px;
  }

  .rm-header p {
    color: var(--ink-dim);
    font-size: 0.92rem;
    max-width: 560px;
    line-height: 1.6;
  }

  .rm-header-stats {
    display: flex;
    gap: 28px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--line-soft);
    flex-wrap: wrap;
  }

  .rm-stat-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--orange);
  }

  .rm-stat-label {
    font-size: 0.68rem;
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  /* ---------- Grid of roadmap cards ---------- */
  .rm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
    max-width: 1180px;
    margin: 0 auto 48px;
    padding: 0 24px;
  }

  .rm-card {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 22px 20px 18px;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
    position: relative;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  .rm-card:hover, .rm-card:focus-visible {
    border-color: var(--orange);
    transform: translateY(-2px);
    background: #0f0f0f;
  }

  .rm-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .rm-card-icon {
    width: 38px;
    height: 38px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 700;
    background: var(--orange-soft);
    color: var(--orange);
    border: 1px solid var(--orange-dim);
    font-family: 'Space Grotesk', sans-serif;
    flex-shrink: 0;
  }

  .rm-card-ext {
    font-size: 0.66rem;
    color: var(--ink-faint);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 2px 6px;
    font-weight: 500;
  }

  .rm-card-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 5px;
    letter-spacing: -0.01em;
  }

  .rm-card-tagline {
    font-size: 0.76rem;
    color: var(--ink-dim);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .rm-card-progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .rm-card-progress-track {
    flex: 1;
    height: 5px;
    background: var(--bg-inset);
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
  }

  .rm-card-progress-fill {
    height: 100%;
    background: var(--orange);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .rm-card-progress-fill.done { background: var(--green); }

  .rm-card-progress-pct {
    font-size: 0.68rem;
    color: var(--orange-dim);
    color: var(--orange);
    font-weight: 600;
    min-width: 30px;
    text-align: right;
  }

  .rm-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid var(--line-soft);
  }

  .rm-card-count {
    font-size: 0.68rem;
    color: var(--ink-faint);
  }

  .rm-card-arrow {
    color: var(--orange);
    font-size: 0.78rem;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.15s ease;
  }

  .rm-card:hover .rm-card-arrow { opacity: 1; transform: translateX(0); }

  /* ---------- Detail view ---------- */
  .rm-detail {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px;
    animation: rmFadeUp 0.25s ease;
  }

  @keyframes rmFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rm-detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 28px 0 24px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .rm-back-btn {
    background: var(--bg-card);
    border: 1px solid var(--line);
    color: var(--ink-dim);
    padding: 8px 14px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 500;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rm-back-btn:hover { border-color: var(--orange); color: var(--orange); }

  .rm-detail-title-wrap h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.02em;
  }

  .rm-detail-title-wrap p {
    color: var(--ink-dim);
    font-size: 0.8rem;
    margin-top: 2px;
  }

  .rm-detail-reset {
    margin-left: auto;
    background: none;
    border: 1px solid var(--line);
    color: var(--ink-faint);
    padding: 7px 12px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.7rem;
    transition: all 0.15s;
  }

  .rm-detail-reset:hover { border-color: #c0392b; color: #e57373; }

  /* progress summary bar */
  .rm-progress-summary {
    padding: 20px 0 28px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 32px;
  }

  .rm-progress-summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .rm-progress-summary-label {
    font-size: 0.74rem;
    color: var(--ink-dim);
    font-weight: 600;
  }

  .rm-progress-summary-pct {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--orange);
  }

  .rm-progress-summary-track {
    height: 8px;
    background: var(--bg-inset);
    border: 1px solid var(--line);
    border-radius: 5px;
    overflow: hidden;
  }

  .rm-progress-summary-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--orange), #ffb168);
    border-radius: 5px;
    transition: width 0.4s ease;
  }

  /* ---------- Path (timeline) ---------- */
  .rm-path {
    position: relative;
    padding-left: 28px;
  }

  .rm-path::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: var(--line);
  }

  .rm-stage {
    position: relative;
    margin-bottom: 36px;
  }

  .rm-stage:last-child { margin-bottom: 0; }

  .rm-stage-marker {
    position: absolute;
    left: -28px;
    top: 0;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 2px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--ink-faint);
    transition: all 0.2s ease;
    z-index: 2;
  }

  .rm-stage-marker.active {
    border-color: var(--orange);
    color: var(--orange);
  }

  .rm-stage-marker.complete {
    border-color: var(--green);
    background: var(--green);
    color: #0a0a0a;
  }

  .rm-stage-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 14px;
  }

  .rm-stage-heading {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ink);
  }

  .rm-stage-count {
    font-size: 0.7rem;
    color: var(--ink-faint);
  }

  .rm-nodes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rm-node {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 13px 15px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: left;
    width: 100%;
  }

  .rm-node:hover { border-color: var(--ink-faint); }

  .rm-node.done {
    border-color: var(--orange-dim);
    background: var(--orange-soft);
  }

  .rm-node-check {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid var(--line-soft);
    background: var(--bg-inset);
    flex-shrink: 0;
    margin-top: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.62rem;
    color: transparent;
    transition: all 0.15s;
  }

  .rm-node.done .rm-node-check {
    background: var(--orange);
    border-color: var(--orange);
    color: #0a0a0a;
  }

  .rm-node-body { flex: 1; min-width: 0; }

  .rm-node-label {
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 3px;
  }

  .rm-node.done .rm-node-label {
    color: var(--ink-dim);
    text-decoration: line-through;
    text-decoration-color: var(--ink-faint);
  }

  .rm-node-note {
    font-size: 0.74rem;
    color: var(--ink-dim);
    line-height: 1.4;
  }

  /* ---------- Footer ---------- */
  .rm-footer {
    max-width: 1180px;
    margin: 40px auto 0;
    padding: 24px 24px 0;
    border-top: 1px solid var(--line);
    color: var(--ink-faint);
    font-size: 0.72rem;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .rm-footer span.accent { color: var(--orange); }

  @media (max-width: 640px) {
    .rm-header h1 { font-size: 1.9rem; }
    .rm-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); padding: 0 16px; }
    .rm-topbar-inner { flex-wrap: wrap; }
    .rm-topbar-meta { display: none; }
    .rm-header { padding: 36px 16px 24px; }
    .rm-detail { padding: 0 16px; }
  }
`;

/* ---------------------------------------------------------
   STORAGE HELPERS (persisted progress, per roadmap)
--------------------------------------------------------- */

const STORAGE_KEY = "roadmap-progress";

async function loadProgress() {
  try {
    const result = await window.storage?.get(STORAGE_KEY);
    if (result?.value) return JSON.parse(result.value);
  } catch {
    /* no saved progress yet */
  }
  return {};
}

async function saveProgress(progress) {
  try {
    await window.storage?.set(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable, fail silently */
  }
}

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */

export default function Roadmap() {
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState({}); // { "dsa::Arrays & Strings": true }
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    loadProgress().then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(progress), 300);
    return () => clearTimeout(saveTimer.current);
  }, [progress, loaded]);

  function nodeKey(roadmapId, label) {
    return `${roadmapId}::${label}`;
  }

  function toggleNode(roadmapId, label) {
    setProgress((prev) => {
      const key = nodeKey(roadmapId, label);
      return { ...prev, [key]: !prev[key] };
    });
  }

  function resetRoadmap(roadmapId) {
    setProgress((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${roadmapId}::`)) delete next[k];
      });
      return next;
    });
  }

  function roadmapStats(rm) {
    const total = rm.stages.reduce((a, s) => a + s.items.length, 0);
    const done = rm.stages.reduce(
      (a, s) => a + s.items.filter((it) => progress[nodeKey(rm.id, it.label)]).length,
      0
    );
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  const overallStats = useMemo(() => {
    const total = roadmaps.reduce(
      (a, rm) => a + rm.stages.reduce((b, s) => b + s.items.length, 0),
      0
    );
    const done = Object.values(progress).filter(Boolean).length;
    return { total, done };
  }, [progress]);

  const sheet = active ? roadmaps.find((r) => r.id === active) : null;
  const sheetStats = sheet ? roadmapStats(sheet) : null;

  // figure out which stage index is "active" (first stage with an incomplete item)
  function stageStatus(rm, stage) {
    const labels = stage.items.map((it) => it.label);
    const doneCount = labels.filter((l) => progress[nodeKey(rm.id, l)]).length;
    if (doneCount === labels.length) return "complete";
    if (doneCount > 0) return "active";
    return "pending";
  }

  return (
    <>
      <style>{styles}</style>
      <div className="rm-root">
        <div className="rm-topbar">
          <div className="rm-topbar-inner">
            <div className="rm-dots">
              <span className="rm-dot" />
              <span className="rm-dot" />
              <span className="rm-dot live" />
            </div>
            <div className="rm-brand">
              dev<span>/</span>roadmaps
            </div>
            <div className="rm-topbar-meta">
              <span className="rm-dot live" style={{ width: 6, height: 6 }} />
              {overallStats.done}/{overallStats.total} topics checked off
            </div>
          </div>
        </div>

        {!active ? (
          <>
            <div className="rm-header">
              <div className="rm-header-eyebrow">structured learning paths</div>
              <h1>Career Roadmaps</h1>
              <p>
                Step-by-step paths for DSA, full stack, and beyond. Check off topics as you learn
                them — your progress saves automatically and picks up right where you left off.
              </p>
              <div className="rm-header-stats">
                <div>
                  <div className="rm-stat-num">{roadmaps.length}</div>
                  <div className="rm-stat-label">Roadmaps</div>
                </div>
                <div>
                  <div className="rm-stat-num">{overallStats.total}</div>
                  <div className="rm-stat-label">Total topics</div>
                </div>
                <div>
                  <div className="rm-stat-num">{overallStats.done}</div>
                  <div className="rm-stat-label">Completed</div>
                </div>
              </div>
            </div>

            <div className="rm-grid">
              {roadmaps.map((rm) => {
                const stats = roadmapStats(rm);
                const isDone = stats.pct === 100;
                return (
                  <button key={rm.id} className="rm-card" onClick={() => setActive(rm.id)}>
                    <div className="rm-card-top">
                      <div className="rm-card-icon">{rm.icon}</div>
                      <div className="rm-card-ext">{rm.ext}</div>
                    </div>
                    <div className="rm-card-title">{rm.title}</div>
                    <div className="rm-card-tagline">{rm.tagline}</div>
                    <div className="rm-card-progress-row">
                      <div className="rm-card-progress-track">
                        <div
                          className={`rm-card-progress-fill${isDone ? " done" : ""}`}
                          style={{ width: `${stats.pct}%` }}
                        />
                      </div>
                      <span className="rm-card-progress-pct">{stats.pct}%</span>
                    </div>
                    <div className="rm-card-footer">
                      <span className="rm-card-count">
                        {stats.done}/{stats.total} topics · {rm.stages.length} stages
                      </span>
                      <span className="rm-card-arrow">view →</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rm-footer">
              <span>click a roadmap to start tracking progress</span>
              <span>progress saves automatically</span>
            </div>
          </>
        ) : (
          <div className="rm-detail">
            <div className="rm-detail-header">
              <button className="rm-back-btn" onClick={() => setActive(null)}>
                ← back
              </button>
              <div className="rm-card-icon">{sheet.icon}</div>
              <div className="rm-detail-title-wrap">
                <h2>{sheet.fullTitle}</h2>
                <p>{sheet.tagline}</p>
              </div>
              <button className="rm-detail-reset" onClick={() => resetRoadmap(sheet.id)}>
                reset progress
              </button>
            </div>

            <div className="rm-progress-summary">
              <div className="rm-progress-summary-row">
                <span className="rm-progress-summary-label">
                  {sheetStats.done} of {sheetStats.total} topics complete
                </span>
                <span className="rm-progress-summary-pct">{sheetStats.pct}%</span>
              </div>
              <div className="rm-progress-summary-track">
                <div
                  className="rm-progress-summary-fill"
                  style={{ width: `${sheetStats.pct}%` }}
                />
              </div>
            </div>

            <div className="rm-path">
              {sheet.stages.map((stage, idx) => {
                const status = stageStatus(sheet, stage);
                const doneInStage = stage.items.filter(
                  (it) => progress[nodeKey(sheet.id, it.label)]
                ).length;
                return (
                  <div className="rm-stage" key={stage.heading}>
                    <div className={`rm-stage-marker ${status}`}>
                      {status === "complete" ? "✓" : idx + 1}
                    </div>
                    <div className="rm-stage-head">
                      <span className="rm-stage-heading">{stage.heading}</span>
                      <span className="rm-stage-count">
                        {doneInStage}/{stage.items.length}
                      </span>
                    </div>
                    <div className="rm-nodes">
                      {stage.items.map((item) => {
                        const isDone = !!progress[nodeKey(sheet.id, item.label)];
                        return (
                          <button
                            key={item.label}
                            className={`rm-node${isDone ? " done" : ""}`}
                            onClick={() => toggleNode(sheet.id, item.label)}
                          >
                            <span className="rm-node-check">{isDone ? "✓" : ""}</span>
                            <span className="rm-node-body">
                              <span className="rm-node-label">{item.label}</span>
                              <span className="rm-node-note">{item.note}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rm-footer">
              <span>
                <span className="accent">{sheet.title}</span> · {sheetStats.total} topics across{" "}
                {sheet.stages.length} stages
              </span>
              <span>click a topic to mark complete</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}