import React, { useState, useMemo, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import mylogo from "../assets/mylogo.png";
import {
  X,
  PlayCircle,
  BookOpen,
  Code2,
  Server,
  Layers,
  Cloud,
  ShieldHalf,
  Terminal,
  CircleDot,
  Check,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CodeMaster Color Palette (matches ComplexityVisualizer / Navbar)  */
/* ------------------------------------------------------------------ */

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
  green:     "#00b86b",
  red:       "#ff4444",
  blue:      "#4493f8",
  purple:    "#c084fc",
  teal:      "#2dd4bf",
  pink:      "#ff5fa6",
  sky:       "#38bdf8",
};

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3, whiteSpace: "nowrap",
      display: "inline-block",
    }}>{label}</span>
  );
}

/* ------------------------------------------------------------------ */
/*  TRACK DATA — each track is a DAG of levels. Nodes list `parents`  */
/*  by id; the layout engine positions levels top-to-bottom and       */
/*  spreads sibling nodes horizontally, roadmap.sh style.             */
/* ------------------------------------------------------------------ */

const TRACKS = {
  fullstack: {
    label: "Full Stack",
    icon: Code2,
    color: CM.green,
    tagline: "Ship the whole product, front to back",
    levels: [
      [{ id: "fs_web", label: "HTML / CSS / JS", parents: [] }],
      [{ id: "fs_git", label: "Git & GitHub", parents: ["fs_web"] }],
      [
        { id: "fs_front", label: "Frontend Framework", parents: ["fs_git"] },
        { id: "fs_back", label: "Backend Runtime", parents: ["fs_git"] },
      ],
      [{ id: "fs_db", label: "Databases", parents: ["fs_front", "fs_back"] }],
      [{ id: "fs_api", label: "REST / GraphQL APIs", parents: ["fs_db"] }],
      [{ id: "fs_auth", label: "Authentication", parents: ["fs_api"] }],
      [{ id: "fs_docker", label: "Docker", parents: ["fs_auth"] }],
      [{ id: "fs_cicd", label: "CI / CD", parents: ["fs_docker"] }],
      [{ id: "fs_cloud", label: "Cloud Deployment", parents: ["fs_cicd"] }],
      [{ id: "fs_monitor", label: "Monitoring & Logs", parents: ["fs_cloud"] }],
    ],
  },

  frontend: {
    label: "Frontend",
    icon: Layers,
    color: CM.sky,
    tagline: "Everything that renders in the browser",
    levels: [
      [{ id: "fe_html", label: "HTML", parents: [] }],
      [{ id: "fe_css", label: "CSS", parents: ["fe_html"] }],
      [{ id: "fe_js", label: "JavaScript", parents: ["fe_css"] }],
      [{ id: "fe_git", label: "Git & GitHub", parents: ["fe_js"] }],
      [
        { id: "fe_react", label: "React", parents: ["fe_git"] },
        { id: "fe_vue", label: "Vue", parents: ["fe_git"] },
        { id: "fe_angular", label: "Angular", parents: ["fe_git"] },
        { id: "fe_svelte", label: "Svelte", parents: ["fe_git"] },
      ],
      [
        {
          id: "fe_state",
          label: "State Management",
          parents: ["fe_react", "fe_vue", "fe_angular", "fe_svelte"],
        },
      ],
      [{ id: "fe_ts", label: "TypeScript", parents: ["fe_state"] }],
      [{ id: "fe_build", label: "Vite / Webpack", parents: ["fe_ts"] }],
      [{ id: "fe_test", label: "Testing", parents: ["fe_build"] }],
      [{ id: "fe_perf", label: "Performance", parents: ["fe_test"] }],
      [{ id: "fe_deploy", label: "Deploy & Host", parents: ["fe_perf"] }],
    ],
  },

  backend: {
    label: "Backend",
    icon: Server,
    color: CM.purple,
    tagline: "Servers, data, and the logic behind the API",
    levels: [
      [
        { id: "be_node", label: "Node.js", parents: [] },
        { id: "be_python", label: "Python", parents: [] },
        { id: "be_go", label: "Go", parents: [] },
        { id: "be_java", label: "Java", parents: [] },
      ],
      [
        {
          id: "be_framework",
          label: "Web Framework",
          parents: ["be_node", "be_python", "be_go", "be_java"],
        },
      ],
      [{ id: "be_rest", label: "REST APIs", parents: ["be_framework"] }],
      [
        { id: "be_sql", label: "PostgreSQL", parents: ["be_rest"] },
        { id: "be_nosql", label: "MongoDB", parents: ["be_rest"] },
        { id: "be_cache", label: "Redis", parents: ["be_rest"] },
      ],
      [
        {
          id: "be_auth",
          label: "Auth (JWT / OAuth)",
          parents: ["be_sql", "be_nosql", "be_cache"],
        },
      ],
      [{ id: "be_graphql", label: "GraphQL", parents: ["be_auth"] }],
      [{ id: "be_queue", label: "Message Queues", parents: ["be_graphql"] }],
      [{ id: "be_test", label: "Testing", parents: ["be_queue"] }],
      [{ id: "be_docker", label: "Docker", parents: ["be_test"] }],
      [{ id: "be_deploy", label: "CI / CD & Deploy", parents: ["be_docker"] }],
    ],
  },

  devops: {
    label: "DevOps",
    icon: Cloud,
    color: CM.accent,
    tagline: "Build, ship, and run infrastructure at scale",
    levels: [
      [{ id: "do_linux", label: "Linux Fundamentals", parents: [] }],
      [{ id: "do_net", label: "Networking Basics", parents: ["do_linux"] }],
      [{ id: "do_git", label: "Git", parents: ["do_net"] }],
      [{ id: "do_script", label: "Bash / Python Scripting", parents: ["do_git"] }],
      [{ id: "do_docker", label: "Docker", parents: ["do_script"] }],
      [{ id: "do_k8s", label: "Kubernetes", parents: ["do_docker"] }],
      [
        { id: "do_gh", label: "GitHub Actions", parents: ["do_k8s"] },
        { id: "do_jenkins", label: "Jenkins", parents: ["do_k8s"] },
        { id: "do_gitlab", label: "GitLab CI", parents: ["do_k8s"] },
      ],
      [
        {
          id: "do_terraform",
          label: "Terraform",
          parents: ["do_gh", "do_jenkins", "do_gitlab"],
        },
        {
          id: "do_ansible",
          label: "Ansible",
          parents: ["do_gh", "do_jenkins", "do_gitlab"],
        },
      ],
      [
        { id: "do_aws", label: "AWS", parents: ["do_terraform", "do_ansible"] },
        { id: "do_gcp", label: "GCP", parents: ["do_terraform", "do_ansible"] },
        { id: "do_azure", label: "Azure", parents: ["do_terraform", "do_ansible"] },
      ],
      [
        {
          id: "do_monitor",
          label: "Monitoring & Logs",
          parents: ["do_aws", "do_gcp", "do_azure"],
        },
      ],
      [{ id: "do_secops", label: "DevSecOps Basics", parents: ["do_monitor"] }],
    ],
  },

  cyber: {
    label: "Cybersecurity",
    icon: ShieldHalf,
    color: CM.pink,
    tagline: "Defend systems, networks, and data",
    levels: [
      [{ id: "cy_net", label: "Networking Fundamentals", parents: [] }],
      [{ id: "cy_os", label: "OS Fundamentals", parents: ["cy_net"] }],
      [{ id: "cy_sec", label: "Security Fundamentals", parents: ["cy_os"] }],
      [{ id: "cy_crypto", label: "Cryptography", parents: ["cy_sec"] }],
      [{ id: "cy_web", label: "Web Security (OWASP)", parents: ["cy_crypto"] }],
      [{ id: "cy_netsec", label: "Network Security", parents: ["cy_web"] }],
      [
        { id: "cy_nmap", label: "Nmap", parents: ["cy_netsec"] },
        { id: "cy_burp", label: "Burp Suite", parents: ["cy_netsec"] },
        { id: "cy_msf", label: "Metasploit", parents: ["cy_netsec"] },
      ],
      [
        {
          id: "cy_wireshark",
          label: "Wireshark",
          parents: ["cy_nmap", "cy_burp", "cy_msf"],
        },
      ],
      [{ id: "cy_kali", label: "Kali Linux", parents: ["cy_wireshark"] }],
      [{ id: "cy_grc", label: "Compliance & GRC", parents: ["cy_kali"] }],
      [{ id: "cy_cert", label: "Certifications", parents: ["cy_grc"] }],
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  RESOURCE LIBRARY — description + learning links per node id       */
/* ------------------------------------------------------------------ */

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const RESOURCES = {
  fs_web: { desc: "The three languages every product on the web is built from — structure, style, and behavior.", youtube: yt("HTML CSS JavaScript full course"), docs: "https://developer.mozilla.org/en-US/docs/Web", docsLabel: "MDN Web Docs" },
  fs_git: { desc: "Track changes and collaborate with a team using branches, commits, and pull requests.", youtube: yt("git and github full course"), docs: "https://docs.github.com/en/get-started", docsLabel: "GitHub Docs" },
  fs_front: { desc: "Pick a component-based framework to build interactive, stateful user interfaces.", youtube: yt("react js full course"), docs: "https://react.dev/learn", docsLabel: "React Docs" },
  fs_back: { desc: "Run JavaScript on the server to handle requests, business logic, and data.", youtube: yt("node.js express full course"), docs: "https://nodejs.org/en/docs", docsLabel: "Node.js Docs" },
  fs_db: { desc: "Store and query application data reliably, relationally or as flexible documents.", youtube: yt("postgresql mongodb crash course"), docs: "https://www.postgresql.org/docs/", docsLabel: "PostgreSQL Docs" },
  fs_api: { desc: "Design the contract your frontend and backend use to exchange data.", youtube: yt("rest api graphql explained"), docs: "https://graphql.org/learn/", docsLabel: "GraphQL Docs" },
  fs_auth: { desc: "Verify who a user is and control what they're allowed to do.", youtube: yt("jwt oauth authentication explained"), docs: "https://jwt.io/introduction", docsLabel: "JWT.io Guide" },
  fs_docker: { desc: "Package your app and its dependencies into a portable, reproducible container.", youtube: yt("docker tutorial for beginners"), docs: "https://docs.docker.com/get-started/", docsLabel: "Docker Docs" },
  fs_cicd: { desc: "Automatically test and ship code every time you push, with no manual steps.", youtube: yt("ci cd pipeline tutorial github actions"), docs: "https://docs.github.com/en/actions", docsLabel: "GitHub Actions Docs" },
  fs_cloud: { desc: "Put your app on infrastructure the world can reach, reliably and at scale.", youtube: yt("deploy full stack app to cloud"), docs: "https://vercel.com/docs", docsLabel: "Vercel Docs" },
  fs_monitor: { desc: "Know when something breaks before your users tell you.", youtube: yt("application monitoring logging tutorial"), docs: "https://grafana.com/docs/", docsLabel: "Grafana Docs" },

  fe_html: { desc: "The markup language that structures every web page ever built.", youtube: yt("html full course for beginners"), docs: "https://developer.mozilla.org/en-US/docs/Web/HTML", docsLabel: "MDN HTML" },
  fe_css: { desc: "Style layout, color, and responsiveness — flexbox and grid are non-negotiable.", youtube: yt("css flexbox grid full course"), docs: "https://developer.mozilla.org/en-US/docs/Web/CSS", docsLabel: "MDN CSS" },
  fe_js: { desc: "The language that makes pages interactive: DOM, events, async, and beyond.", youtube: yt("javascript full course for beginners"), docs: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", docsLabel: "MDN JavaScript" },
  fe_git: { desc: "Version control basics: commits, branches, merges, and working with a remote.", youtube: yt("git github crash course"), docs: "https://docs.github.com/en/get-started", docsLabel: "GitHub Docs" },
  fe_react: { desc: "A component-based library for building UIs out of reusable, composable pieces.", youtube: yt("react js full course"), docs: "https://react.dev/learn", docsLabel: "React Docs" },
  fe_vue: { desc: "An approachable, incrementally adoptable framework with a gentle learning curve.", youtube: yt("vue js full course"), docs: "https://vuejs.org/guide/introduction.html", docsLabel: "Vue Docs" },
  fe_angular: { desc: "A full-featured, opinionated framework built for large enterprise applications.", youtube: yt("angular full course"), docs: "https://angular.dev/overview", docsLabel: "Angular Docs" },
  fe_svelte: { desc: "A compiler that turns components into tiny, framework-free vanilla JS.", youtube: yt("svelte full course"), docs: "https://svelte.dev/docs", docsLabel: "Svelte Docs" },
  fe_state: { desc: "Manage data that's shared across components without prop-drilling chaos.", youtube: yt("redux zustand state management tutorial"), docs: "https://redux.js.org/introduction/getting-started", docsLabel: "Redux Docs" },
  fe_ts: { desc: "Add static types to JavaScript to catch bugs before they ship.", youtube: yt("typescript full course"), docs: "https://www.typescriptlang.org/docs/", docsLabel: "TypeScript Docs" },
  fe_build: { desc: "Bundle, transpile, and optimize your code for a fast production build.", youtube: yt("vite webpack tutorial"), docs: "https://vitejs.dev/guide/", docsLabel: "Vite Docs" },
  fe_test: { desc: "Write unit and end-to-end tests so refactors don't silently break things.", youtube: yt("jest cypress testing tutorial"), docs: "https://jestjs.io/docs/getting-started", docsLabel: "Jest Docs" },
  fe_perf: { desc: "Shrink bundle size, lazy-load, and profile renders for a snappy UI.", youtube: yt("web performance optimization tutorial"), docs: "https://web.dev/learn/performance", docsLabel: "web.dev Performance" },
  fe_deploy: { desc: "Ship your static site or SPA to a CDN with zero-downtime deploys.", youtube: yt("deploy react app vercel netlify"), docs: "https://vercel.com/docs", docsLabel: "Vercel Docs" },

  be_node: { desc: "A JavaScript runtime for building fast, event-driven servers.", youtube: yt("node.js full course"), docs: "https://nodejs.org/en/docs", docsLabel: "Node.js Docs" },
  be_python: { desc: "A readable, batteries-included language popular for APIs and data.", youtube: yt("python for backend development full course"), docs: "https://docs.python.org/3/", docsLabel: "Python Docs" },
  be_go: { desc: "A compiled, concurrent language built by Google for fast networked services.", youtube: yt("go golang full course"), docs: "https://go.dev/doc/", docsLabel: "Go Docs" },
  be_java: { desc: "A mature, strongly-typed language that powers a huge share of enterprise backends.", youtube: yt("java spring boot full course"), docs: "https://spring.io/guides", docsLabel: "Spring Docs" },
  be_framework: { desc: "A framework that handles routing, middleware, and requests for you.", youtube: yt("express django fastapi framework tutorial"), docs: "https://expressjs.com/", docsLabel: "Express Docs" },
  be_rest: { desc: "The standard architecture for stateless, resource-oriented HTTP APIs.", youtube: yt("rest api design tutorial"), docs: "https://restfulapi.net/", docsLabel: "RESTful API Guide" },
  be_sql: { desc: "A powerful open-source relational database for structured, transactional data.", youtube: yt("postgresql full course"), docs: "https://www.postgresql.org/docs/", docsLabel: "PostgreSQL Docs" },
  be_nosql: { desc: "A flexible, document-oriented database that scales horizontally with ease.", youtube: yt("mongodb full course"), docs: "https://www.mongodb.com/docs/", docsLabel: "MongoDB Docs" },
  be_cache: { desc: "An in-memory store for caching, sessions, and rate limiting at speed.", youtube: yt("redis crash course"), docs: "https://redis.io/docs/latest/", docsLabel: "Redis Docs" },
  be_auth: { desc: "Authenticate requests with tokens and delegate identity with OAuth providers.", youtube: yt("jwt oauth authentication backend tutorial"), docs: "https://jwt.io/introduction", docsLabel: "JWT.io Guide" },
  be_graphql: { desc: "Let clients query exactly the data shape they need, nothing more.", youtube: yt("graphql full course"), docs: "https://graphql.org/learn/", docsLabel: "GraphQL Docs" },
  be_queue: { desc: "Decouple services and handle spikes with asynchronous message brokers.", youtube: yt("rabbitmq kafka message queue tutorial"), docs: "https://kafka.apache.org/documentation/", docsLabel: "Kafka Docs" },
  be_test: { desc: "Unit and integration test your endpoints so deploys stay boring.", youtube: yt("backend api testing tutorial"), docs: "https://jestjs.io/docs/getting-started", docsLabel: "Jest Docs" },
  be_docker: { desc: "Containerize your service so it runs the same everywhere, every time.", youtube: yt("docker for backend developers tutorial"), docs: "https://docs.docker.com/get-started/", docsLabel: "Docker Docs" },
  be_deploy: { desc: "Automate build, test, and release so shipping is a single push.", youtube: yt("ci cd deploy backend tutorial"), docs: "https://docs.github.com/en/actions", docsLabel: "GitHub Actions Docs" },

  do_linux: { desc: "The operating system that runs almost every server on the internet.", youtube: yt("linux for devops full course"), docs: "https://linuxjourney.com/", docsLabel: "Linux Journey" },
  do_net: { desc: "DNS, TCP/IP, load balancers — the plumbing every deployment depends on.", youtube: yt("networking basics for devops"), docs: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work", docsLabel: "MDN Networking" },
  do_git: { desc: "Version control for infrastructure code, not just application code.", youtube: yt("git for devops tutorial"), docs: "https://git-scm.com/doc", docsLabel: "Git Docs" },
  do_script: { desc: "Automate repetitive ops tasks with shell and Python scripts.", youtube: yt("bash scripting full course"), docs: "https://www.gnu.org/software/bash/manual/bash.html", docsLabel: "Bash Manual" },
  do_docker: { desc: "Package services into containers that behave identically everywhere.", youtube: yt("docker full course for devops"), docs: "https://docs.docker.com/get-started/", docsLabel: "Docker Docs" },
  do_k8s: { desc: "Orchestrate, scale, and self-heal containers across a cluster of machines.", youtube: yt("kubernetes full course"), docs: "https://kubernetes.io/docs/home/", docsLabel: "Kubernetes Docs" },
  do_gh: { desc: "Run CI/CD pipelines directly from your GitHub repository.", youtube: yt("github actions full course"), docs: "https://docs.github.com/en/actions", docsLabel: "GitHub Actions Docs" },
  do_jenkins: { desc: "A veteran, plugin-driven automation server for build pipelines.", youtube: yt("jenkins pipeline tutorial"), docs: "https://www.jenkins.io/doc/", docsLabel: "Jenkins Docs" },
  do_gitlab: { desc: "Built-in CI/CD pipelines tightly integrated with GitLab repos.", youtube: yt("gitlab ci cd tutorial"), docs: "https://docs.gitlab.com/ee/ci/", docsLabel: "GitLab CI Docs" },
  do_terraform: { desc: "Define cloud infrastructure as versioned, repeatable code.", youtube: yt("terraform full course"), docs: "https://developer.hashicorp.com/terraform/docs", docsLabel: "Terraform Docs" },
  do_ansible: { desc: "Agentless configuration management to provision and configure servers.", youtube: yt("ansible full course"), docs: "https://docs.ansible.com/", docsLabel: "Ansible Docs" },
  do_aws: { desc: "The largest cloud provider — compute, storage, networking, and more.", youtube: yt("aws full course for beginners"), docs: "https://docs.aws.amazon.com/", docsLabel: "AWS Docs" },
  do_gcp: { desc: "Google's cloud platform, strong in data, ML, and Kubernetes tooling.", youtube: yt("google cloud platform full course"), docs: "https://cloud.google.com/docs", docsLabel: "GCP Docs" },
  do_azure: { desc: "Microsoft's cloud platform, deeply integrated with enterprise tooling.", youtube: yt("azure fundamentals full course"), docs: "https://learn.microsoft.com/en-us/azure/", docsLabel: "Azure Docs" },
  do_monitor: { desc: "Collect metrics and logs so you see problems before users do.", youtube: yt("prometheus grafana monitoring tutorial"), docs: "https://prometheus.io/docs/introduction/overview/", docsLabel: "Prometheus Docs" },
  do_secops: { desc: "Bake security scanning and policy checks directly into the pipeline.", youtube: yt("devsecops fundamentals tutorial"), docs: "https://owasp.org/www-project-devsecops-guideline/", docsLabel: "OWASP DevSecOps Guide" },

  cy_net: { desc: "Understand how packets, ports, and protocols actually move data.", youtube: yt("networking fundamentals for cybersecurity"), docs: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work", docsLabel: "MDN Networking" },
  cy_os: { desc: "How Linux and Windows manage processes, permissions, and users.", youtube: yt("operating system fundamentals security"), docs: "https://linuxjourney.com/", docsLabel: "Linux Journey" },
  cy_sec: { desc: "Core principles: confidentiality, integrity, availability, and risk thinking.", youtube: yt("cybersecurity fundamentals full course"), docs: "https://www.cisa.gov/topics/cybersecurity-best-practices", docsLabel: "CISA Best Practices" },
  cy_crypto: { desc: "Encryption, hashing, and signatures — the math that keeps secrets secret.", youtube: yt("cryptography full course"), docs: "https://cryptobook.nakov.com/", docsLabel: "Practical Cryptography" },
  cy_web: { desc: "The most common web vulnerabilities and how attackers exploit them.", youtube: yt("owasp top 10 explained"), docs: "https://owasp.org/www-project-top-ten/", docsLabel: "OWASP Top 10" },
  cy_netsec: { desc: "Firewalls, IDS/IPS, and segmentation to keep networks defensible.", youtube: yt("network security fundamentals"), docs: "https://www.cisa.gov/topics/cybersecurity-best-practices", docsLabel: "CISA Best Practices" },
  cy_nmap: { desc: "The standard tool for network discovery and port scanning.", youtube: yt("nmap tutorial for beginners"), docs: "https://nmap.org/book/man.html", docsLabel: "Nmap Docs" },
  cy_burp: { desc: "An interception proxy for testing and exploiting web applications.", youtube: yt("burp suite tutorial"), docs: "https://portswigger.net/burp/documentation", docsLabel: "PortSwigger Docs" },
  cy_msf: { desc: "A framework for developing and running exploits against target systems.", youtube: yt("metasploit tutorial for beginners"), docs: "https://docs.metasploit.com/", docsLabel: "Metasploit Docs" },
  cy_wireshark: { desc: "Capture and inspect raw network traffic packet by packet.", youtube: yt("wireshark tutorial for beginners"), docs: "https://www.wireshark.org/docs/", docsLabel: "Wireshark Docs" },
  cy_kali: { desc: "A Linux distribution pre-loaded with penetration testing tools.", youtube: yt("kali linux full course"), docs: "https://www.kali.org/docs/", docsLabel: "Kali Docs" },
  cy_grc: { desc: "Governance, risk, and compliance frameworks orgs are measured against.", youtube: yt("governance risk compliance grc explained"), docs: "https://www.iso.org/isoiec-27001-information-security.html", docsLabel: "ISO 27001 Overview" },
  cy_cert: { desc: "Industry certifications that validate your skills to employers.", youtube: yt("security+ ceh oscp certification roadmap"), docs: "https://www.comptia.org/certifications/security", docsLabel: "CompTIA Security+" },
};

/* ------------------------------------------------------------------ */
/*  LAYOUT ENGINE                                                     */
/* ------------------------------------------------------------------ */

const CANVAS_W = 1120;
const NODE_W = 196;
const NODE_H = 58;
const LEVEL_GAP = 148;
const TOP_PAD = 70;
const SIB_GAP = 224;

function layoutTrack(levels) {
  const positioned = {};
  const nodes = [];

  levels.forEach((levelNodes, li) => {
    const count = levelNodes.length;
    const totalW = (count - 1) * SIB_GAP;
    const startX = CANVAS_W / 2 - totalW / 2;
    const y = TOP_PAD + li * LEVEL_GAP;

    levelNodes.forEach((n, idx) => {
      const x = startX + idx * SIB_GAP;
      const pos = { ...n, x, y, level: li };
      positioned[n.id] = pos;
      nodes.push(pos);
    });
  });

  const edges = [];
  nodes.forEach((n) => {
    n.parents.forEach((pid) => {
      const p = positioned[pid];
      if (p) edges.push({ from: p, to: n });
    });
  });

  const height = TOP_PAD + (levels.length - 1) * LEVEL_GAP + NODE_H + 60;
  return { nodes, edges, width: CANVAS_W, height };
}

/* ------------------------------------------------------------------ */
/*  UI SUBCOMPONENTS                                                  */
/* ------------------------------------------------------------------ */

function GridBackdrop({ color }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(${color}14 1px, transparent 1px), linear-gradient(90deg, ${color}14 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 90%)",
      }}
    />
  );
}

function Edge({ edge, color }) {
  const x1 = edge.from.x;
  const y1 = edge.from.y + NODE_H / 2;
  const x2 = edge.to.x;
  const y2 = edge.to.y - NODE_H / 2;
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeOpacity="0.45"
      strokeLinecap="round"
      strokeDasharray="1 8"
      className="roadmap-edge"
    />
  );
}

function Node({ node, color, onSelect, isDone }) {
  return (
    <button
      onClick={() => onSelect(node)}
      className="absolute flex items-center gap-2.5 rounded-xl px-4 text-left transition-transform duration-150 group"
      style={{
        left: node.x - NODE_W / 2,
        top: node.y - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        background: CM.surface,
        border: `1px solid ${color}3d`,
        boxShadow: `0 0 0 0 ${color}00`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 22px -4px ${color}80`;
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00`;
        e.currentTarget.style.borderColor = `${color}3d`;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span
        className="flex h-2 w-2 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span
        className="text-[13px] leading-tight truncate"
        style={{ color: CM.text, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {node.label}
      </span>
    </button>
  );
}

function ResourceModal({ node, track, onClose }) {
  const r = RESOURCES[node.id] || {};
  const color = track.color;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,5,8,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: CM.bg, border: `1px solid ${color}55` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid ${color}2a`, background: `${color}0f` }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-2 w-2 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-2 w-2 rounded-full" style={{ background: "#28c840" }} />
            <span
              className="ml-2 text-[11px] uppercase tracking-widest"
              style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {track.label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: CM.text, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {node.label}
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: CM.muted }}>
            {r.desc}
          </p>

          <div className="flex flex-col gap-3">
            <a
              href={r.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
              style={{ background: "#1a1006", border: "1px solid #ff000033" }}
            >
              <span className="flex items-center gap-3 text-sm font-medium" style={{ color: "#ff5c5c" }}>
                <PlayCircle size={18} /> Watch on YouTube
              </span>
              <ArrowRight size={16} style={{ color: "#ff5c5c99" }} />
            </a>

            <a
              href={r.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
              style={{ background: `${color}12`, border: `1px solid ${color}40` }}
            >
              <span className="flex items-center gap-3 text-sm font-medium" style={{ color }}>
                <BookOpen size={18} /> {r.docsLabel || "Documentation"}
              </span>
              <ArrowRight size={16} style={{ color: `${color}99` }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */

export default function RoadmapExplorer() {
  const [activeId, setActiveId] = useState("fullstack");
  const [selectedNode, setSelectedNode] = useState(null);
  const scrollRef = useRef(null);
  const location = useLocation();

  const track = TRACKS[activeId];
  const layout = useMemo(() => layoutTrack(track.levels), [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeId]);

  const nodeCount = layout.nodes.length;

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: CM.bg,
        fontFamily: "'Inter', ui-sans-serif, system-ui",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        .roadmap-edge { animation: dashflow 16s linear infinite; }
        @keyframes dashflow { to { stroke-dashoffset: -400; } }
        .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: ${CM.border2}; border-radius: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── NAVBAR (CodeMaster design system) ── */}
      <div style={{
        background: CM.surface,
        borderBottom: `1px solid ${CM.border}`,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div style={{
  height: 48,
  display: "flex",
  alignItems: "center",
  padding: "0 20px 0 36px",
  gap: 10,
  maxWidth: 1280,
  margin: "0 auto",
}}>
  <NavLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
    <img
      src={mylogo}
      alt="CodeMaster logo"
      style={{ width: 34, height: 34, objectFit: "contain" }}
    />
  </NavLink>

  <div style={{ width: 1, height: 20, background: CM.border, margin: "0 4px", flexShrink: 0 }} />

  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: CM.muted, whiteSpace: "nowrap" }}>
    <NavLink to="/explore" style={{ color: CM.muted, textDecoration: "none" }}>
      Explore
    </NavLink>
    {" / "}
    <span style={{ color: CM.accent }}>Roadmap</span>
  </span>
</div>

        {/* Track tabs (styled as second nav row, like the language strip) */}
        <div style={{
          display: "flex",
          overflowX: "auto",
          padding: "0 20px",
          borderTop: `1px solid ${CM.border}`,
          maxWidth: 1280,
          margin: "0 auto",
        }}>
          {Object.entries(TRACKS).map(([id, t]) => {
            const Icon = t.icon;
            const active = id === activeId;
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  whiteSpace: "nowrap",
                  color: active ? t.color : CM.muted,
                  borderBottom: active ? `2px solid ${t.color}` : "2px solid transparent",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 0.3,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: CM.dim, fontFamily: "'JetBrains Mono', monospace" }}
          >
            choose_a_track()
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold mb-2 tracking-tight"
            style={{ color: CM.text, fontFamily: "'JetBrains Mono', monospace" }}
          >
            Engineering Learning Paths
          </h1>
          <p className="text-sm max-w-xl" style={{ color: CM.muted }}>
            Pick a track, follow the wired-up path, and tap any node to pull up its
            YouTube playlist and official docs.
          </p>
        </div>

        {/* Editor-style window chrome around the graph */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${CM.border}`, background: CM.bg }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${CM.border}`, background: CM.surface }}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
              <span
                className="ml-3 text-xs"
                style={{ color: CM.dim, fontFamily: "'JetBrains Mono', monospace" }}
              >
                ~/roadmaps/{activeId}
              </span>
            </div>
            <span
              className="text-[11px]"
              style={{ color: track.color, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {nodeCount} nodes
            </span>
          </div>

          <div
            ref={scrollRef}
            className="relative overflow-auto scrollbar-thin"
            style={{ maxHeight: "70vh" }}
          >
            <GridBackdrop color={track.color} />
            <div
              className="relative"
              style={{ width: layout.width, height: layout.height, margin: "0 auto" }}
            >
              <svg
                width={layout.width}
                height={layout.height}
                className="absolute inset-0"
                style={{ pointerEvents: "none" }}
              >
                {layout.edges.map((e, i) => (
                  <Edge key={i} edge={e} color={track.color} />
                ))}
              </svg>
              {layout.nodes.map((n) => (
                <Node key={n.id} node={n} color={track.color} onSelect={setSelectedNode} />
              ))}
            </div>
          </div>
        </div>

        {/* Legend / footer strip */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs" style={{ color: CM.dim }}>
          <span className="flex items-center gap-2">
            <CircleDot size={13} style={{ color: track.color }} /> {track.tagline}
          </span>
          <span className="flex items-center gap-2">
            <Check size={13} /> Tap any node for a YouTube playlist + official docs
          </span>
        </div>
      </main>

      {selectedNode && (
        <ResourceModal node={selectedNode} track={track} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}