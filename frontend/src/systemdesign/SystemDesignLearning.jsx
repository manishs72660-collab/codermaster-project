import { useState, useEffect, useRef } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TOPICS = {
  lb: {
    title: "Load Balancer",
    category: "Infrastructure",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    icon: "⇌",
    difficulty: "Core",
    steps: [
      {
        heading: "What is a Load Balancer?",
        body: "A load balancer sits in front of a server pool and distributes every incoming request across them — so no single machine gets crushed. It's the entry point for your entire service.",
        callout: "Without a load balancer, one server handles everything. Add ten more servers and they're useless — traffic still piles into that first machine.",
        diagram: "lb_overview",
      },
      {
        heading: "Round Robin & Weighted Routing",
        body: "Round Robin cycles requests: S1 → S2 → S3 → S1. Weighted routing lets you send 70% to a beefier server. Least-connections routes to whichever server has fewest active requests right now.",
        callout: "Use Least-Connections when requests have wildly different durations — otherwise a slow query on S1 keeps piling up while S2 sits idle.",
        diagram: "lb_roundrobin",
      },
      {
        heading: "Health Checks",
        body: "The LB pings each server every 5s on /health. Three failures in a row → server pulled from rotation automatically. When it recovers, it eases back in.",
        callout: "This is how zero-downtime deploys work: take a server out, deploy new code, health check passes, traffic flows back. Rolling deploys in one sentence.",
        diagram: "lb_health",
      },
      {
        heading: "L4 vs L7",
        body: "L4 operates at TCP — sees source IP and port, extremely fast. L7 reads HTTP content: URL paths, headers, cookies. L7 can route /api → API servers, /images → image servers.",
        callout: "Always ask in interviews: 'Do you need path-based or header-based routing?' If yes → L7 (Nginx, AWS ALB). If raw throughput matters more → L4 (AWS NLB).",
        diagram: "lb_layers",
      },
    ],
  },
  cache: {
    title: "Caching",
    category: "Performance",
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    icon: "⬡",
    difficulty: "Core",
    steps: [
      {
        heading: "Why Caching Exists",
        body: "Every DB query is a network round-trip plus disk I/O — 5–50ms. A Redis cache read is RAM access — 0.1ms. At Twitter's scale (600k reads/sec), that difference is the entire product.",
        callout: "Cache is a bet: 'this data will be requested again before it changes.' The higher the hit rate, the better the bet.",
        diagram: "cache_why",
      },
      {
        heading: "Hit vs Miss",
        body: "Hit: data found in cache, returned instantly. Miss: fetch from DB, store in cache, return. Hit rate is your north star metric — below 80% your cache barely helps, above 95% the DB is nearly idle.",
        callout: "Thundering herd: 10,000 concurrent cache misses all hammer the DB simultaneously. Fix with request coalescing or a mutex lock on the cache fill.",
        diagram: "cache_hit",
      },
      {
        heading: "Write Strategies",
        body: "Write-through: write to cache and DB simultaneously. Always consistent, slower writes. Write-around: skip cache on write, data comes in on first read. Write-back: write to cache, flush to DB later. Fast, but risky if cache crashes.",
        callout: "Write-back is dangerous for anything financial. Write-through is the safe default. Write-around for write-heavy data that's rarely re-read.",
        diagram: "cache_write",
      },
      {
        heading: "Eviction: LRU, LFU, TTL",
        body: "Cache memory is finite. LRU (Least Recently Used): evict what hasn't been touched longest. LFU: evict what's accessed least frequently. TTL: expire after a set time regardless.",
        callout: "LRU is Redis's default and the right answer 80% of the time. TTL for weather/news data. LFU when you have genuine hot/cold patterns with stable hot items.",
        diagram: "cache_evict",
      },
    ],
  },
  cdn: {
    title: "CDN",
    category: "Performance",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    icon: "◎",
    difficulty: "Core",
    steps: [
      {
        heading: "Distance = Latency",
        body: "Mumbai origin server → New York user = 14,000km ≈ 150ms. CDN edge node in New Jersey → New York user = 200km ≈ 5ms. Static assets (images, CSS, JS) never need to touch your origin again.",
        callout: "CDNs like Cloudflare have 300+ edge nodes. Your content is physically closer to every user on Earth.",
        diagram: "cdn_distance",
      },
      {
        heading: "Cache-Control & TTLs",
        body: "The origin sets Cache-Control headers that tell CDN edges how long to keep a file. max-age=31536000 for hashed assets like main.a3f7b.css. max-age=0 for HTML that changes with every deploy.",
        callout: "The trick: content-hash your asset filenames. Never expire the cache, but change the filename when content changes. Best of both worlds.",
        diagram: "cdn_cache",
      },
    ],
  },
  db: {
    title: "Databases",
    category: "Storage",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.15)",
    icon: "◫",
    difficulty: "Core",
    steps: [
      {
        heading: "SQL vs NoSQL",
        body: "SQL: relational, ACID, structured schema. Best for financial data, complex joins, strong consistency. NoSQL: flexible schema, horizontal scale. MongoDB (documents), Cassandra (wide-column), Redis (key-value).",
        callout: "The real question isn't SQL vs NoSQL — it's 'what are my access patterns?' If you need arbitrary queries on structured data, SQL. If you're always querying by user ID, NoSQL shines.",
        diagram: "db_types",
      },
      {
        heading: "Replication",
        body: "Primary-replica: all writes go to primary, reads spread across replicas. Primary-primary (multi-master): writes accepted anywhere, conflicts resolved. Replication lag is your enemy — a replica may be 50ms behind.",
        callout: "After a write, if the user immediately reads from a replica, they may not see their own write. 'Read your own writes' consistency requires routing that user's reads to the primary for a short window.",
        diagram: "db_replication",
      },
      {
        heading: "Sharding",
        body: "Sharding splits one huge DB into N smaller ones (shards), each on a separate machine. A shard key determines which shard a record goes to. User ID is a good key — timestamp is a terrible one.",
        callout: "Hot shards kill you. If 10% of users generate 80% of traffic, user-ID sharding concentrates load on a few shards. Consider consistent hashing to distribute more evenly.",
        diagram: "db_sharding",
      },
      {
        heading: "Indexes",
        body: "An index is a sorted data structure (usually a B-tree) that lets the DB find rows without scanning the whole table. Composite indexes cover multi-column queries. Covering indexes include all queried columns, avoiding a table lookup entirely.",
        callout: "Every index speeds up reads but slows down writes — the index must be updated on every INSERT/UPDATE. Never index every column. Index what your slowest queries filter by.",
        diagram: "db_indexes",
      },
    ],
  },
  queue: {
    title: "Message Queues",
    category: "Infrastructure",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
    icon: "⇥",
    difficulty: "Core",
    steps: [
      {
        heading: "Decoupling with Queues",
        body: "Without queues: your API calls the email service synchronously — if it's slow, your user waits. With a queue: API drops a job and returns in 1ms. Email worker picks it up asynchronously. Services are decoupled.",
        callout: "Rule of thumb: 'send email', 'resize image', 'process payment notification', 'generate PDF' — any work that doesn't block the user response should be a queue job.",
        diagram: "queue_decouple",
      },
      {
        heading: "Kafka vs RabbitMQ",
        body: "RabbitMQ: broker pushes to consumers, messages deleted after ACK. Perfect for task queues. Kafka: consumers pull at their own pace, messages retained (days/weeks). Perfect for event streaming and audit logs.",
        callout: "Kafka shines when multiple different consumers need the same events — analytics, billing, and notifications can all consume the same user-signup event independently.",
        diagram: "queue_types",
      },
      {
        heading: "At-Least-Once Delivery",
        body: "Queues guarantee at-least-once delivery, not exactly-once. A worker may crash mid-processing, the job re-queues, another worker picks it up. Your consumers must be idempotent — same job processed twice = same result.",
        callout: "Idempotency key pattern: include a unique job ID. Before processing, check 'have I seen this ID?' If yes, skip. This is how Stripe handles duplicate payment requests.",
        diagram: "queue_idempotent",
      },
    ],
  },
  twitter: {
    title: "Twitter / X Feed",
    category: "Real World",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.15)",
    icon: "✦",
    difficulty: "Case Study",
    steps: [
      {
        heading: "The Fan-out Problem",
        body: "User tweets → 10M followers need to see it. Option A: precompute each follower's feed on write (fan-out on write). Option B: compute the feed fresh on every read (fan-out on read). Both scale poorly alone.",
        callout: "Fan-out on write: fast reads, but one celebrity tweet triggers 10M cache writes simultaneously. Fan-out on read: consistent, but every feed load requires 500+ queries merged in real-time.",
        diagram: "twitter_fanout",
      },
      {
        heading: "Twitter's Hybrid Approach",
        body: "Regular users (<10k followers): fan-out on write. Tweet pushed to follower feed caches immediately. Celebrities (10M+ followers): fan-out on read. Their tweets merged in at read time. Threshold is configurable.",
        callout: "This is called the 'celebrity problem.' One tweet from @BarackObama triggering 130M cache writes would crater the system. So their tweets are treated differently.",
        diagram: "twitter_hybrid",
      },
      {
        heading: "Timeline Cache",
        body: "Each user has a timeline cache — a Redis sorted set scored by tweet timestamp. Fan-out on write appends to each follower's cache. On open, the app reads the top 800 tweets from cache, merges celebrity tweets, done.",
        callout: "Twitter caps feed caches at ~800 entries. If you haven't opened Twitter in weeks, your cache is stale — a 'heavy ranker' recomputes it fresh on your next open.",
        diagram: "twitter_cache",
      },
    ],
  },
  netflix: {
    title: "Netflix",
    category: "Real World",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.15)",
    icon: "▶",
    difficulty: "Case Study",
    steps: [
      {
        heading: "700+ Microservices",
        body: "Press play: Client → API Gateway → Auth → Billing → Playback license → Streaming manifest → CDN delivers video. Netflix runs 700+ independently deployable microservices. Each owns its data and scales separately.",
        callout: "Netflix migrated from a monolith after a DB corruption in 2008 took down the entire service for 3 days. Microservices mean one service failing doesn't cascade.",
        diagram: "netflix_arch",
      },
      {
        heading: "Adaptive Bitrate Streaming",
        body: "Video encoded at 5–20 quality tiers (240p to 4K). Split into 2–10 second segments. Client measures bandwidth every few seconds, switches quality between segments. Buffer 3–4 segments ahead at current quality.",
        callout: "The ABR algorithm runs on the client. It's balancing: 'how much buffer do I have, what's my current bandwidth estimate, how fast is it changing?' to pick the highest quality that won't stall.",
        diagram: "netflix_abr",
      },
      {
        heading: "Open Connect CDN",
        body: "Netflix built its own CDN — Open Connect Appliances (OCAs) — placed inside ISP data centers. Popular shows pre-loaded nightly during off-peak hours. 95% of Netflix traffic served from ISP-embedded caches.",
        callout: "Pre-positioning content is the secret. A new season drops, Netflix detects the title is trending in Japan, pre-loads it to Japanese OCAs overnight. When the episode drops, all traffic hits local cache.",
        diagram: "netflix_cdn",
      },
    ],
  },
  uber: {
    title: "Uber",
    category: "Real World",
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    icon: "⬡",
    difficulty: "Case Study",
    steps: [
      {
        heading: "Geospatial Matching",
        body: "Every active driver pings GPS location every 4 seconds. On ride request: find all drivers within 2km, rank by ETA, dispatch nearest. This must complete in under 100ms across millions of moving data points.",
        callout: "Uber uses H3 — Uber's own hexagonal hierarchical spatial index. Earth is divided into hexagons at different resolutions. A hex lookup is O(1) vs scanning every driver.",
        diagram: "uber_geo",
      },
      {
        heading: "Surge Pricing",
        body: "Each H3 hex cell tracks demand (ride requests) vs supply (available drivers) in real-time. When demand/supply ratio exceeds a threshold, the surge multiplier increases for that cell. Recalculated every few minutes.",
        callout: "Surge is a market equilibrium mechanism. Higher prices: some riders cancel (lower demand), some drivers move in (higher supply). The system self-corrects without central control.",
        diagram: "uber_surge",
      },
      {
        heading: "DISCO: Dispatch System",
        body: "DISCO (DIStributed COordination) matches riders to drivers. It's partitioned by geohash — each partition owns a region. Within a partition, matches are deterministic. Partitions don't talk to each other.",
        callout: "This is the scalability insight: geographically partition a global problem into thousands of independent local problems. A ride in Mumbai doesn't need to know about rides in New York.",
        diagram: "uber_dispatch",
      },
    ],
  },
  scale: {
    title: "Scalability",
    category: "Concepts",
    color: "#84cc16",
    glow: "rgba(132,204,22,0.15)",
    icon: "↑",
    difficulty: "Fundamentals",
    steps: [
      {
        heading: "Horizontal vs Vertical",
        body: "Vertical: bigger machine (more CPU/RAM). Simple, no code changes, but has a hard ceiling and single point of failure. Horizontal: more machines. Requires stateless services + load balancer, but scales infinitely.",
        callout: "For databases: vertical first (it's simpler). For application servers: horizontal always. A stateless app server is trivially cloneable. Stateful services (DBs, caches) need more thought.",
        diagram: "scale_hv",
      },
      {
        heading: "CAP Theorem",
        body: "In a distributed system, you can only guarantee 2 of 3: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system survives network splits). You must choose.",
        callout: "Network partitions happen — so really you're choosing: CP (banks, databases) or AP (social feeds, DNS). Most systems choose AP with eventual consistency and tune from there.",
        diagram: "scale_cap",
      },
      {
        heading: "Rate Limiting",
        body: "Token bucket: each user gets N tokens per window, each request burns one. Leaky bucket: requests drain at a fixed rate regardless of bursts. Sliding window log: precise but memory-heavy. Redis counters: simple and fast.",
        callout: "Always rate limit per user AND per IP. A token bucket allows controlled bursting (good for real users). Leaky bucket smooths traffic for downstream services.",
        diagram: "scale_ratelimit",
      },
    ],
  },
};

const CATEGORIES = {
  Infrastructure: "#3b82f6",
  Performance: "#10b981",
  Storage: "#8b5cf6",
  "Real World": "#ec4899",
  Concepts: "#84cc16",
};

// ─── DIAGRAMS ─────────────────────────────────────────────────────────────────
function Diagram({ id, color }) {
  const diagrams = {
    lb_overview: (
      <svg viewBox="0 0 580 180" style={{width:"100%"}}>
        <defs>
          <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        {/* Clients */}
        {[28,78,128].map((y,i) => (
          <g key={i}>
            <rect x="8" y={y} width="74" height="32" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
            <text x="45" y={y+20} textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="11" fontFamily="system-ui">Client {i+1}</text>
          </g>
        ))}
        {/* Lines to LB */}
        {[[82,44,188,85],[82,94,188,92],[82,144,188,99]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e3a5f" strokeWidth="1" markerEnd="url(#a1)" strokeDasharray="5 3">
            <animate attributeName="strokeDashoffset" from="0" to="-16" dur={`${1+i*0.2}s`} repeatCount="indefinite"/>
          </line>
        ))}
        {/* LB */}
        <rect x="188" y="62" width="130" height="58" rx="10" fill={`rgba(${color==='#3b82f6'?'59,130,246':'16,185,129'},0.08)`} stroke={color} strokeWidth="1.2"/>
        <text x="253" y="84" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="13" fontWeight="600" fontFamily="system-ui">Load Balancer</text>
        <text x="253" y="104" textAnchor="middle" dominantBaseline="central" fill={color} opacity="0.5" fontSize="10" fontFamily="system-ui">nginx / AWS ALB</text>
        {/* Lines to servers */}
        {[[318,80,400,38],[318,90,400,90],[318,100,400,142]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e3a5f" strokeWidth="1" markerEnd="url(#a1)" strokeDasharray="5 3">
            <animate attributeName="strokeDashoffset" from="0" to="-16" dur={`${1.4+i*0.15}s`} repeatCount="indefinite"/>
          </line>
        ))}
        {/* Servers */}
        {[["S1",18],["S2",70],["S3",122]].map(([name,y],i)=>(
          <g key={i}>
            <rect x="400" y={y} width="80" height="32" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
            <circle cx="416" cy={y+16} r="3" fill="#10b981"/>
            <text x="444" y={y+16} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize="11" fontFamily="system-ui">Server {name[1]}</text>
          </g>
        ))}
        {/* DB */}
        <rect x="500" y="70" width="72" height="42" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
        <text x="536" y="95" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="11" fontFamily="system-ui">DB</text>
      </svg>
    ),
    lb_roundrobin: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        <rect x="10" y="55" width="120" height="52" rx="8" fill={`rgba(59,130,246,0.08)`} stroke={color} strokeWidth="1"/>
        <text x="70" y="74" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="12" fontWeight="600" fontFamily="system-ui">Load Balancer</text>
        <text x="70" y="94" textAnchor="middle" dominantBaseline="central" fill={color} opacity="0.5" fontSize="10" fontFamily="system-ui">round robin</text>
        {[["A","#1,#4,#7",12],["B","#2,#5,#8",62],["C","#3,#6,#9",112]].map(([n,req,y],i)=>(
          <g key={n}>
            <line x1="130" y1={80} x2="200" y2={y+18} stroke="#1e3a5f" strokeWidth="1" markerEnd={`url(#a2)`} strokeDasharray="4 2">
              <animate attributeName="strokeDashoffset" from="0" to="-12" dur={`${1+i*0.3}s`} repeatCount="indefinite"/>
            </line>
            <rect x="200" y={y} width="140" height="36" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
            <circle cx="216" cy={y+18} r="3" fill="#10b981"/>
            <text x="238" y={y+14} dominantBaseline="central" fill="#94a3b8" fontSize="11" fontFamily="system-ui">Server {n}</text>
            <text x="238" y={y+28} dominantBaseline="central" fill="#475569" fontSize="10" fontFamily="system-ui">{req}</text>
          </g>
        ))}
        <defs>
          <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        <text x="380" y="83" textAnchor="middle" fill="#334155" fontSize="11" fontFamily="system-ui">equal distribution</text>
      </svg>
    ),
    lb_health: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        <defs>
          <marker id="a3g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
          <marker id="a3r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        <rect x="10" y="55" width="120" height="52" rx="8" fill={`rgba(59,130,246,0.08)`} stroke={color} strokeWidth="1"/>
        <text x="70" y="74" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="12" fontWeight="600" fontFamily="system-ui">Load Balancer</text>
        <text x="70" y="94" textAnchor="middle" dominantBaseline="central" fill={color} opacity="0.5" fontSize="10" fontFamily="system-ui">health checker</text>
        {/* Healthy */}
        {[[18,"S1"],[68,"S2"]].map(([y,n])=>(
          <g key={n}>
            <line x1="130" y1="78" x2="200" y2={y+18} stroke="#10b981" strokeWidth="1" markerEnd="url(#a3g)" strokeDasharray="4 2">
              <animate attributeName="strokeDashoffset" from="0" to="-12" dur="1.2s" repeatCount="indefinite"/>
            </line>
            <rect x="200" y={y} width="130" height="36" rx="6" fill="#022c22" stroke="#10b981" strokeWidth="0.8"/>
            <circle cx="216" cy={y+18} r="3" fill="#10b981"/>
            <text x="228" y={y+14} dominantBaseline="central" fill="#10b981" fontSize="11" fontFamily="system-ui">{n} — healthy</text>
            <text x="228" y={y+28} dominantBaseline="central" fill="#059669" fontSize="10" fontFamily="system-ui">serving traffic</text>
          </g>
        ))}
        {/* Failed */}
        <line x1="130" y1="95" x2="200" y2="126" stroke="#ef4444" strokeWidth="1" markerEnd="url(#a3r)" strokeDasharray="3 2"/>
        <text x="165" y="108" textAnchor="middle" fill="#ef4444" fontSize="14">✕</text>
        <rect x="200" y="108" width="130" height="36" rx="6" fill="#1a0000" stroke="#ef4444" strokeWidth="0.8"/>
        <circle cx="216" cy="126" r="3" fill="#ef4444"/>
        <text x="228" y="122" dominantBaseline="central" fill="#ef4444" fontSize="11" fontFamily="system-ui">S3 — failed</text>
        <text x="228" y="136" dominantBaseline="central" fill="#991b1b" fontSize="10" fontFamily="system-ui">removed from pool</text>
        <text x="360" y="60" fill="#1e293b" fontSize="11" fontFamily="system-ui">ping /health every 5s</text>
        <text x="360" y="128" fill="#1e293b" fontSize="11" fontFamily="system-ui">3 failures → auto-remove</text>
      </svg>
    ),
    lb_layers: (
      <svg viewBox="0 0 580 148" style={{width:"100%"}}>
        {[
          ["L4 — TCP Layer","Sees IP + port only. Extremely fast.\nNo HTTP inspection.",["AWS NLB","HAProxy (L4)"],"#0f172a","#1e293b","#64748b",8],
          ["L7 — HTTP Layer","Reads URL paths, headers, cookies.\nPath-based routing, SSL termination.",["Nginx","AWS ALB","Cloudflare"],"rgba(59,130,246,0.06)",color,"#94a3b8",84],
        ].map(([title,desc,examples,bg,stroke,tc,y])=>(
          <g key={title}>
            <rect x="8" y={y} width="560" height="64" rx="8" fill={bg} stroke={stroke} strokeWidth={y===84?"1.2":"0.8"}/>
            <text x="20" y={y+22} dominantBaseline="central" fill={y===84?color:"#475569"} fontSize="13" fontWeight="600" fontFamily="system-ui">{title}</text>
            <text x="20" y={y+44} dominantBaseline="central" fill={tc} fontSize="11" fontFamily="system-ui">{desc.split("\n")[0]}</text>
            <text x="20" y={y+56} dominantBaseline="central" fill={tc} opacity="0.6" fontSize="11" fontFamily="system-ui">{desc.split("\n")[1]}</text>
            <text x="540" y={y+32} textAnchor="end" dominantBaseline="central" fill={y===84?color:"#334155"} fontSize="11" fontFamily="system-ui">{examples.join(" · ")}</text>
          </g>
        ))}
      </svg>
    ),
    cache_why: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        <defs>
          <marker id="cg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
          <marker id="cb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        <rect x="8" y="58" width="80" height="36" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
        <text x="48" y="78" textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize="12" fontFamily="system-ui">Client</text>
        {/* Cache */}
        <line x1="88" y1="76" x2="158" y2="76" stroke="#10b981" strokeWidth="1" markerEnd="url(#cg)" strokeDasharray="4 2">
          <animate attributeName="strokeDashoffset" from="0" to="-12" dur="1s" repeatCount="indefinite"/>
        </line>
        <rect x="158" y="48" width="110" height="56" rx="8" fill="rgba(16,185,129,0.08)" stroke="#10b981" strokeWidth="1.2"/>
        <text x="213" y="72" textAnchor="middle" dominantBaseline="central" fill="#10b981" fontSize="13" fontWeight="600" fontFamily="system-ui">Cache</text>
        <text x="213" y="90" textAnchor="middle" dominantBaseline="central" fill="#10b981" opacity="0.5" fontSize="10" fontFamily="system-ui">Redis / Memcached</text>
        {/* Cache hit path */}
        <path d="M213 48 C213 16 48 16 48 58" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" fill="none" markerEnd="url(#cg)"/>
        <text x="130" y="10" textAnchor="middle" fill="#059669" fontSize="11" fontFamily="system-ui">hit: 0.1ms ✓</text>
        {/* DB */}
        <line x1="268" y1="76" x2="338" y2="76" stroke="#475569" strokeWidth="1" markerEnd="url(#cb)" fill="none"/>
        <rect x="338" y="48" width="110" height="56" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
        <text x="393" y="72" textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="12" fontWeight="600" fontFamily="system-ui">Database</text>
        <text x="393" y="90" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="10" fontFamily="system-ui">disk I/O: 10–50ms</text>
        <path d="M393 104 C393 136 213 136 213 104" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" fill="none" markerEnd="url(#cb)"/>
        <text x="305" y="152" textAnchor="middle" fill="#334155" fontSize="11" fontFamily="system-ui">miss: store result in cache</text>
      </svg>
    ),
    cache_hit: (
      <svg viewBox="0 0 580 148" style={{width:"100%"}}>
        {[
          {label:"HIT",color:"#10b981",bg:"rgba(16,185,129,0.06)",steps:[["Request","#0f172a","#64748b",8],["Cache ✓","rgba(16,185,129,0.08)","#10b981",130],["0.1ms","rgba(16,185,129,0.1)","#10b981",252]],y:14},
          {label:"MISS",color:"#f59e0b",bg:"rgba(245,158,11,0.06)",steps:[["Request","#0f172a","#64748b",8],["Cache ✗","rgba(127,29,29,0.2)","#ef4444",130],["DB 10ms","#0f172a","#64748b",252],["Cache store","rgba(16,185,129,0.08)","#10b981",390]],y:84},
        ].map(({label,color:lc,bg,steps,y})=>(
          <g key={label}>
            <rect x="4" y={y} width="570" height="54" rx="8" fill={bg} stroke={lc} strokeWidth="0.6"/>
            <text x="16" y={y+30} dominantBaseline="central" fill={lc} fontSize="11" fontWeight="700" fontFamily="system-ui">{label}</text>
            {steps.map(([txt,sbg,stc,x],i)=>(
              <g key={txt}>
                {i > 0 && <line x1={x-8} y1={y+28} x2={x-2} y2={y+28} stroke={lc} strokeWidth="1" opacity="0.4"/>}
                <rect x={x+50} y={y+14} width={txt.length*7+10} height="28" rx="5" fill={sbg} stroke={stc} strokeWidth="0.7"/>
                <text x={x+50+(txt.length*7+10)/2} y={y+28} textAnchor="middle" dominantBaseline="central" fill={stc} fontSize="11" fontFamily="system-ui">{txt}</text>
              </g>
            ))}
          </g>
        ))}
      </svg>
    ),
    cache_write: (
      <svg viewBox="0 0 580 148" style={{width:"100%"}}>
        {[
          ["Write-through","Write to cache + DB together","Always consistent, slower writes","#10b981",10],
          ["Write-around","Skip cache on write","Good for write-heavy, rarely-read data","#f59e0b",62],
          ["Write-back","Write cache, flush DB later","Fastest writes, data loss risk","#ef4444",114],
        ].map(([name,desc1,desc2,c,y])=>(
          <g key={name}>
            <rect x="8" y={y} width="560" height="42" rx="7" fill="#0f172a" stroke="#1e293b" strokeWidth="0.8"/>
            <rect x="8" y={y} width="4" height="42" rx="2" fill={c}/>
            <text x="22" y={y+16} dominantBaseline="central" fill={c} fontSize="12" fontWeight="600" fontFamily="system-ui">{name}</text>
            <text x="22" y={y+32} dominantBaseline="central" fill="#475569" fontSize="11" fontFamily="system-ui">{desc1}</text>
            <text x="560" y={y+24} textAnchor="end" dominantBaseline="central" fill="#334155" fontSize="11" fontFamily="system-ui">{desc2}</text>
          </g>
        ))}
      </svg>
    ),
    cache_evict: (
      <svg viewBox="0 0 580 120" style={{width:"100%"}}>
        {[
          ["LRU","Least Recently Used","Default for Redis","#3b82f6",6],
          ["LFU","Least Frequently Used","Hot/cold patterns","#8b5cf6",202],
          ["TTL","Time To Live","News, weather data","#f59e0b",398],
        ].map(([name,desc,use,c,x])=>(
          <g key={name}>
            <rect x={x} y="8" width="170" height="104" rx="10" fill="rgba(15,23,42,0.8)" stroke={c} strokeWidth="1"/>
            <rect x={x} y="8" width="170" height="36" rx="10" fill={`rgba(${c==='#3b82f6'?'59,130,246':c==='#8b5cf6'?'139,92,246':'245,158,11'},0.15)`}/>
            <rect x={x} y="30" width="170" height="14" fill={`rgba(${c==='#3b82f6'?'59,130,246':c==='#8b5cf6'?'139,92,246':'245,158,11'},0.08)`}/>
            <text x={x+85} y="30" textAnchor="middle" dominantBaseline="central" fill={c} fontSize="16" fontWeight="700" fontFamily="system-ui">{name}</text>
            <text x={x+85} y="66" textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize="11" fontFamily="system-ui">{desc}</text>
            <text x={x+85} y="90" textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize="10" fontFamily="system-ui">{use}</text>
          </g>
        ))}
      </svg>
    ),
    twitter_fanout: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        <defs>
          <marker id="tf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        {/* Tweet */}
        <rect x="8" y="60" width="110" height="40" rx="7" fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1.2"/>
        <text x="63" y="76" textAnchor="middle" dominantBaseline="central" fill="#06b6d4" fontSize="12" fontWeight="600" fontFamily="system-ui">Tweet</text>
        <text x="63" y="92" textAnchor="middle" dominantBaseline="central" fill="#0891b2" fontSize="10" fontFamily="system-ui">10M followers</text>
        {/* Fan-out lines */}
        {[["Write","Precompute all feeds",26,200],["Read","Compute on open",74,200],["Hybrid","Smart blend",122,200]].map(([l,s,y,x])=>(
          <g key={l}>
            <line x1="118" y1="80" x2={x} y2={y+14} stroke="#0e7490" strokeWidth="1" markerEnd="url(#tf)" strokeDasharray="4 2">
              <animate attributeName="strokeDashoffset" from="0" to="-12" dur="1.3s" repeatCount="indefinite"/>
            </line>
            <rect x={x} y={y} width="150" height="28" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="0.8"/>
            <text x={x+12} y={y+10} dominantBaseline="central" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="system-ui">Fan-out on {l}</text>
            <text x={x+12} y={y+22} dominantBaseline="central" fill="#475569" fontSize="10" fontFamily="system-ui">{s}</text>
          </g>
        ))}
        <text x="390" y="36" fill="#164e63" fontSize="11" fontFamily="system-ui">Twitter answer: Hybrid</text>
        <text x="390" y="52" fill="#164e63" fontSize="11" fontFamily="system-ui">Regular users → write fan-out</text>
        <text x="390" y="68" fill="#164e63" fontSize="11" fontFamily="system-ui">Celebrities → read fan-out</text>
      </svg>
    ),
    netflix_arch: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        <defs>
          <marker id="na" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        {[["Client",8],["API Gateway",92],["Auth",210],["Playback",310],["CDN",430]].map(([n,x],i,arr)=>(
          <g key={n}>
            <rect x={x} y="60" width={n==="API Gateway"?80:80} height="36" rx="6" fill={i===0?"#0f172a":"rgba(239,68,68,0.08)"} stroke={i===0?"#1e293b":"#ef4444"} strokeWidth={i===0?0.8:1}/>
            <text x={x+40} y="78" textAnchor="middle" dominantBaseline="central" fill={i===0?"#64748b":"#ef4444"} fontSize="10" fontWeight="600" fontFamily="system-ui">{n}</text>
            {i < arr.length-1 && <line x1={x+(n==="API Gateway"?80:80)} y1="78" x2={arr[i+1][1]} y2="78" stroke="#7f1d1d" strokeWidth="1" markerEnd="url(#na)" strokeDasharray="4 2">
              <animate attributeName="strokeDashoffset" from="0" to="-12" dur={`${1+i*0.2}s`} repeatCount="indefinite"/>
            </line>}
          </g>
        ))}
        <text x="8" y="128" fill="#1e293b" fontSize="11" fontFamily="system-ui">+ Billing · Recommendations · Search · Streaming manifest · Analytics · …700+ services total</text>
        <text x="8" y="148" fill="#1e293b" fontSize="10" fontFamily="system-ui">Each service: independently deployable, owns its own database, scales separately</text>
      </svg>
    ),
    uber_geo: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        {/* Hexagon grid */}
        {[[290,77],[250,100],[330,100],[210,77],[370,77],[250,54],[330,54]].map(([cx,cy],i)=>{
          const r=28, pts = Array.from({length:6},(_,j)=>{const a=j*60-30;return `${cx+r*Math.cos(a*Math.PI/180)},${cy+r*Math.sin(a*Math.PI/180)}`;}).join(" ");
          return <polygon key={i} points={pts} fill={i===0?"rgba(249,115,22,0.15)":"rgba(249,115,22,0.04)"} stroke={i===0?"#f97316":"#431407"} strokeWidth={i===0?1.2:0.6}/>;
        })}
        {/* Driver dots */}
        {[[275,70],[305,82],[285,95]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="4" fill="#f97316">
            <animate attributeName="r" values="4;5;4" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        <circle cx="290" cy="77" r="7" fill="none" stroke="#fbbf24" strokeWidth="1.5">
          <animate attributeName="r" values="7;14;7" dur="2s" repeatCount="indefinite" calcMode="ease-in-out"/>
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="290" y="140" textAnchor="middle" fill="#ea580c" fontSize="11" fontFamily="system-ui">H3 hex cell — GPS update every 4s</text>
        <text x="8" y="20" fill="#431407" fontSize="11" fontFamily="system-ui">H3 geospatial index divides Earth into hexagons</text>
        <text x="8" y="36" fill="#431407" fontSize="11" fontFamily="system-ui">Lookup drivers in a cell: O(1) vs scanning all drivers</text>
      </svg>
    ),
    scale_hv: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        {/* Vertical */}
        <rect x="20" y="16" width="240" height="120" rx="10" fill="#0f172a" stroke="#1e293b" strokeWidth="0.8"/>
        <text x="140" y="36" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600" fontFamily="system-ui">VERTICAL SCALING</text>
        {[["1 big server","+ more CPU, RAM","ceiling exists","❌ single failure",["#334155","#334155","#334155","#374151"]],].map(([...lines])=>(
          lines.map(([t,c],i)=>(
            <text key={i} x="140" y={60+i*22} textAnchor="middle" dominantBaseline="central" fill={typeof t==="string"?t:"#94a3b8"} fontSize="12" fontFamily="system-ui">{lines[0][i] || (typeof lines[i]==="string"?lines[i]:"")}</text>
          ))
        ))}
        {[["1 big server","#94a3b8"],["+ more CPU, RAM","#64748b"],["ceiling exists","#475569"],["❌ single failure","#ef4444"]].map(([txt,clr],i)=>(
          <text key={txt} x="140" y={58+i*22} textAnchor="middle" dominantBaseline="central" fill={clr} fontSize="12" fontFamily="system-ui">{txt}</text>
        ))}
        {/* Horizontal */}
        <rect x="320" y="16" width="240" height="120" rx="10" fill="rgba(132,204,22,0.06)" stroke="#84cc16" strokeWidth="1.2"/>
        <text x="440" y="36" textAnchor="middle" fill="#84cc16" fontSize="11" fontWeight="600" fontFamily="system-ui">HORIZONTAL SCALING</text>
        {[["N smaller servers","+ load balancer","scales infinitely","✓ fault tolerant"],].flat()}
        {[["N smaller servers","#94a3b8"],["+ load balancer","#64748b"],["scales infinitely","#84cc16"],["✓ fault tolerant","#4ade80"]].map(([txt,clr],i)=>(
          <text key={txt} x="440" y={58+i*22} textAnchor="middle" dominantBaseline="central" fill={clr} fontSize="12" fontFamily="system-ui">{txt}</text>
        ))}
        <text x="280" y="80" textAnchor="middle" fill="#334155" fontSize="18" fontFamily="system-ui">vs</text>
      </svg>
    ),
    scale_cap: (
      <svg viewBox="0 0 580 155" style={{width:"100%"}}>
        {/* Triangle */}
        <polygon points="290,16 140,142 440,142" fill="none" stroke="#1e293b" strokeWidth="1"/>
        {[["Consistency",290,26,"#f59e0b"],["Availability",118,148,"#10b981"],["Partition\nTolerance",444,148,"#3b82f6"]].map(([label,x,y,c])=>(
          <g key={label}>
            <circle cx={x} cy={y} r="22" fill={`rgba(${c==='#f59e0b'?'245,158,11':c==='#10b981'?'16,185,129':'59,130,246'},0.12)`} stroke={c} strokeWidth="1"/>
            {label.split("\n").map((line,i)=>(
              <text key={i} x={x} y={y+(i-label.split("\n").length/2+0.5)*14} textAnchor="middle" dominantBaseline="central" fill={c} fontSize="10" fontWeight="600" fontFamily="system-ui">{line}</text>
            ))}
          </g>
        ))}
        <text x="210" y="88" textAnchor="middle" fill="#334155" fontSize="11" fontFamily="system-ui">CP: banks, finance</text>
        <text x="370" y="88" textAnchor="middle" fill="#334155" fontSize="11" fontFamily="system-ui">AP: social feeds</text>
        <text x="290" y="128" textAnchor="middle" fill="#1e293b" fontSize="10" fontFamily="system-ui">Choose 2</text>
      </svg>
    ),
  };
  return diagrams[id] || (
    <svg viewBox="0 0 580 100" style={{width:"100%"}}>
      <rect x="10" y="10" width="560" height="80" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="290" y="55" textAnchor="middle" dominantBaseline="central" fill="#334155" fontSize="13" fontFamily="system-ui">{id}</text>
    </svg>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SystemDesign() {
  const [active, setActive] = useState("lb");
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [filter, setFilter] = useState("All");
  const contentRef = useRef(null);

  const topic = TOPICS[active];
  const current = topic.steps[step];

  const go = (id) => {
    setActive(id);
    setStep(0);
    setAnimKey(k => k + 1);
  };

  const nextStep = () => {
    if (step < topic.steps.length - 1) {
      setStep(s => s + 1);
      setAnimKey(k => k + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setAnimKey(k => k + 1);
    }
  };

  const cats = ["All", ...Object.keys(CATEGORIES)];
  const filtered = Object.entries(TOPICS).filter(([,t]) => filter === "All" || t.category === filter);

  return (
    <div style={{
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      background: "#020617",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: "0",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .topic-row:hover { background: rgba(255,255,255,0.03) !important; }
        .step-btn:hover { opacity: 0.8; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid #0f172a",
        background: "rgba(2,6,23,0.95)",
        backdropFilter: "blur(12px)",
        padding: "0 24px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px",
          }}>⚙</div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            System Design
          </span>
          <span style={{
            fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
            background: "rgba(59,130,246,0.1)", color: "#3b82f6",
            border: "1px solid rgba(59,130,246,0.2)", fontWeight: "500",
          }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {cats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
              border: `1px solid ${filter === cat ? (CATEGORIES[cat] || "#3b82f6") + "66" : "#1e293b"}`,
              background: filter === cat ? `rgba(${cat==="All"?"59,130,246":cat==="Infrastructure"?"59,130,246":cat==="Performance"?"16,185,129":cat==="Storage"?"139,92,246":cat==="Real World"?"236,72,153":"132,204,22"},0.08)` : "transparent",
              color: filter === cat ? (CATEGORIES[cat] || "#3b82f6") : "#475569",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <div style={{
          width: "220px", minWidth: "220px",
          borderRight: "1px solid #0f172a",
          background: "#020617",
          overflowY: "auto",
          padding: "12px 0",
        }}>
          {filtered.map(([id, t]) => (
            <div
              key={id}
              className="topic-row"
              onClick={() => go(id)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 14px", cursor: "pointer",
                background: active === id ? `rgba(${t.color==='#3b82f6'?'59,130,246':t.color==='#10b981'?'16,185,129':t.color==='#f59e0b'?'245,158,11':t.color==='#8b5cf6'?'139,92,246':t.color==='#ec4899'?'236,72,153':t.color==='#06b6d4'?'6,182,212':t.color==='#ef4444'?'239,68,68':t.color==='#f97316'?'249,115,22':'132,204,22'},0.08)` : "transparent",
                borderLeft: `2px solid ${active === id ? t.color : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "15px", opacity: active === id ? 1 : 0.4, minWidth: "18px" }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: "12px", color: active === id ? "#f1f5f9" : "#64748b", fontWeight: active === id ? "600" : "400", lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ fontSize: "10px", color: active === id ? t.color : "#334155", marginTop: "1px" }}>{t.category}</div>
              </div>
              {active === id && (
                <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: t.color, animation: "pulse-dot 2s infinite" }}/>
              )}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topic header */}
          <div style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #0f172a",
            background: `linear-gradient(135deg, ${topic.glow} 0%, transparent 60%)`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: `rgba(${topic.color==='#3b82f6'?'59,130,246':topic.color==='#10b981'?'16,185,129':topic.color==='#f59e0b'?'245,158,11':topic.color==='#8b5cf6'?'139,92,246':topic.color==='#ec4899'?'236,72,153':topic.color==='#06b6d4'?'6,182,212':topic.color==='#ef4444'?'239,68,68':topic.color==='#f97316'?'249,115,22':'132,204,22'},0.15)`,
                    border: `1px solid ${topic.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px",
                  }}>{topic.icon}</div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "-0.02em" }}>{topic.title}</div>
                    <div style={{ fontSize: "10px", color: "#334155", marginTop: "1px" }}>{topic.category} · {topic.difficulty}</div>
                  </div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#334155", fontFamily: "'JetBrains Mono', monospace" }}>
                  {step + 1} / {topic.steps.length}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {topic.steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => { setStep(i); setAnimKey(k => k + 1); }}
                      style={{
                        height: "3px",
                        width: i === step ? "20px" : "8px",
                        borderRadius: "2px",
                        background: i <= step ? topic.color : "#1e293b",
                        cursor: "pointer",
                        transition: "all 0.25s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            key={animKey}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              animation: "slideIn 0.22s ease",
            }}
          >
            {/* Step heading */}
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
                color: topic.color, letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "6px",
              }}>
                <span style={{ opacity: 0.5 }}>◆</span>
                Step {step + 1}
              </div>
              <h2 style={{
                margin: 0, fontSize: "17px", fontWeight: "700",
                color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1.3,
              }}>{current.heading}</h2>
            </div>

            {/* Body text */}
            <p style={{
              margin: 0, fontSize: "13px", color: "#64748b",
              lineHeight: "1.8", letterSpacing: "0.01em",
            }}>{current.body}</p>

            {/* Diagram */}
            <div style={{
              background: "#030712",
              border: "1px solid #0f172a",
              borderRadius: "10px",
              padding: "16px",
              overflow: "hidden",
            }}>
              <div style={{ fontSize: "10px", color: "#1e293b", fontFamily: "'JetBrains Mono', monospace", marginBottom: "10px" }}>
                DIAGRAM / {current.diagram}
              </div>
              <Diagram id={current.diagram} color={topic.color} />
            </div>

            {/* Callout */}
            <div style={{
              background: `linear-gradient(135deg, ${topic.glow} 0%, rgba(2,6,23,0.4) 100%)`,
              border: `1px solid ${topic.color}22`,
              borderLeft: `3px solid ${topic.color}`,
              borderRadius: "8px",
              padding: "14px 16px",
              display: "flex",
              gap: "10px",
            }}>
              <span style={{ fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>💡</span>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: "1.7" }}>{current.callout}</p>
            </div>
          </div>

          {/* Nav */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "1px solid #0f172a",
            background: "#020617",
          }}>
            <button
              className="nav-btn"
              onClick={prevStep}
              disabled={step === 0}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                fontSize: "12px", fontWeight: "500",
                cursor: step === 0 ? "not-allowed" : "pointer",
                border: "1px solid #0f172a",
                background: "transparent",
                color: step === 0 ? "#1e293b" : "#475569",
                fontFamily: "inherit", transition: "all 0.15s",
                opacity: step === 0 ? 0.4 : 1,
              }}
            >← Prev</button>

            {/* Step dots */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {topic.steps.map((s, i) => (
                <button
                  key={i}
                  className="step-btn"
                  onClick={() => { setStep(i); setAnimKey(k => k + 1); }}
                  style={{
                    width: i === step ? "28px" : "6px",
                    height: "6px", borderRadius: "3px",
                    background: i === step ? topic.color : i < step ? `${topic.color}55` : "#1e293b",
                    border: "none", cursor: "pointer",
                    transition: "all 0.25s ease",
                    padding: 0,
                  }}
                />
              ))}
            </div>

            {step < topic.steps.length - 1 ? (
              <button
                className="nav-btn"
                onClick={nextStep}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "8px",
                  fontSize: "12px", fontWeight: "600",
                  cursor: "pointer",
                  border: `1px solid ${topic.color}44`,
                  background: `rgba(${topic.color==='#3b82f6'?'59,130,246':topic.color==='#10b981'?'16,185,129':topic.color==='#f59e0b'?'245,158,11':topic.color==='#8b5cf6'?'139,92,246':topic.color==='#ec4899'?'236,72,153':topic.color==='#06b6d4'?'6,182,212':topic.color==='#ef4444'?'239,68,68':topic.color==='#f97316'?'249,115,22':'132,204,22'},0.08)`,
                  color: topic.color,
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >Next →</button>
            ) : (
              <button
                className="nav-btn"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "8px",
                  fontSize: "12px", fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid rgba(16,185,129,0.3)",
                  background: "rgba(16,185,129,0.08)",
                  color: "#10b981",
                  fontFamily: "inherit",
                }}
              >Complete ✦</button>
            )}
          </div>
        </div>

        {/* Right panel — concept index */}
        <div style={{
          width: "176px", minWidth: "176px",
          borderLeft: "1px solid #0f172a",
          background: "#020617",
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{ fontSize: "9px", color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>On this topic</div>
          {topic.steps.map((s, i) => (
            <div
              key={i}
              onClick={() => { setStep(i); setAnimKey(k => k + 1); }}
              style={{
                padding: "8px 10px",
                borderRadius: "7px",
                background: i === step ? topic.glow : "transparent",
                border: `1px solid ${i === step ? topic.color + "33" : "#0f172a"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                fontSize: "9px", color: i === step ? topic.color : "#1e293b",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: "3px",
              }}>0{i + 1}</div>
              <div style={{
                fontSize: "11px", color: i === step ? "#f1f5f9" : "#334155",
                fontWeight: i === step ? "600" : "400",
                lineHeight: 1.4,
              }}>{s.heading}</div>
            </div>
          ))}

          <div style={{ height: "1px", background: "#0f172a", margin: "4px 0" }}/>
          <div style={{ fontSize: "9px", color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600" }}>Stats</div>
          {[
            [`${Object.keys(TOPICS).length}`, "topics"],
            [`${Object.values(TOPICS).reduce((a,t)=>a+t.steps.length,0)}`, "concepts"],
            ["3", "real systems"],
          ].map(([n, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.02em" }}>{n}</span>
              <span style={{ fontSize: "10px", color: "#0f172a" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}