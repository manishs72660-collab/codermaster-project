import { useState } from "react";

const TOPICS = {
  lb: {
    title: "Load Balancer",
    subtitle: "How traffic is distributed across servers",
    icon: "⇄",
    tags: ["Intermediate", "Interview favorite"],
    steps: [
      {
        heading: "What is a Load Balancer?",
        text: "A load balancer sits between clients and a pool of servers. It receives every incoming request and decides which server should handle it — spreading the work so no single server gets overwhelmed.",
        insight: "Think of it as a smart traffic cop: when 10,000 users hit your API at once, the load balancer fans those requests out across your server fleet.",
        diagram: "lb_intro",
      },
      {
        heading: "Round-Robin Distribution",
        text: "The simplest strategy: requests are sent to each server in sequence — Server 1, Server 2, Server 3, then back to Server 1. Every server gets an equal share of traffic, assuming all requests take similar time.",
        insight: "Works great when servers are homogeneous. Breaks down if servers have different capacities or if some requests are much heavier than others.",
        diagram: "lb_roundrobin",
      },
      {
        heading: "Health Checks",
        text: "The load balancer continuously pings each server (e.g. every 5 seconds). If a server fails to respond, the LB removes it from rotation automatically and stops sending traffic to it until it recovers.",
        insight: "This is how zero-downtime deployments work — you can restart a server and the LB gracefully routes around it.",
        diagram: "lb_health",
      },
      {
        heading: "Layer 4 vs Layer 7",
        text: "L4 load balancers work at TCP level — fast but blind to content. L7 load balancers inspect HTTP content and can route based on URL paths, headers, or cookies — powerful but slightly slower. Modern systems like Nginx and AWS ALB are L7.",
        insight: "Interview tip: always ask 'do you need path-based routing?' If yes → L7. If pure throughput and low latency → L4.",
        diagram: "lb_layers",
      },
    ],
  },
  cache: {
    title: "Caching",
    subtitle: "Storing frequently accessed data in fast memory",
    icon: "◈",
    tags: ["Intermediate", "Most popular"],
    steps: [
      {
        heading: "Why Caching?",
        text: "Every DB query takes time — caching stores the result of expensive queries in fast memory (RAM). The next identical request reads from cache in microseconds instead of hitting the database.",
        insight: "A 10ms DB read vs a 0.1ms cache hit — at scale this difference is enormous. Twitter serves ~600k reads/sec, mostly from cache.",
        diagram: "cache_intro",
      },
      {
        heading: "Cache Hit vs Miss",
        text: "A cache hit means the data was found in cache — the request is served instantly. A cache miss means we go to the DB, get the result, store it in cache, then return it.",
        insight: "Cache hit rate is a critical metric. Below 80% and your cache is barely helping. Above 95% and your DB is mostly idle.",
        diagram: "cache_hit",
      },
      {
        heading: "Eviction Policies",
        text: "Cache memory is finite. LRU (Least Recently Used) removes the item not accessed for the longest time. LFU removes the least frequently accessed item. TTL expires items after a set duration.",
        insight: "LRU is the most common default. Use TTL for data that goes stale (weather data) and LFU for hot/cold access patterns.",
        diagram: "cache_evict",
      },
    ],
  },
  cdn: {
    title: "CDN",
    subtitle: "Serving static assets from edge servers near users",
    icon: "◎",
    tags: ["Intermediate", "Popular"],
    steps: [
      {
        heading: "The Problem: Latency by Distance",
        text: "If your origin server is in Mumbai and a user is in New York, every request travels ~14,000 km. A CDN places cached copies of your content at edge nodes worldwide — reducing that to ~200km.",
        insight: "A CDN node in New Jersey serves the same file with ~5ms delay instead of 150ms. For images, CSS, and JS — this is transformative.",
        diagram: "cdn_intro",
      },
      {
        heading: "How CDN Caching Works",
        text: "On a cache miss, the CDN edge fetches from origin, caches it, and serves the user. Future requests hit the cache. The Cache-Control header controls how long the CDN keeps the file.",
        insight: "Set long TTLs (1 year) on versioned assets like main.a3f7b.js. Short TTLs or no caching for HTML pages that change frequently.",
        diagram: "cdn_flow",
      },
    ],
  },
  twitter: {
    title: "Twitter Feed",
    subtitle: "How Twitter generates your personalized timeline",
    icon: "✦",
    tags: ["Popular", "Interview favorite"],
    steps: [
      {
        heading: "The Fan-out Problem",
        text: "When a user tweets, their followers need to see it. If a celebrity has 10M followers and tweets once, do you precompute each follower's feed when the tweet is created, or compute the feed at read time?",
        insight: "Fan-out on Write = fast reads, slow writes. Fan-out on Read = slow reads, fast writes. Twitter uses a hybrid of both.",
        diagram: "twitter_fanout",
      },
      {
        heading: "Twitter's Hybrid Approach",
        text: "For regular users (<10k followers): fan-out on write — the tweet is pushed to each follower's feed cache immediately. For celebrities (10M+ followers): fan-out on read — merging is done when you open the app.",
        insight: "This avoids a single tweet triggering 10 million cache writes. Twitter calls this the 'celebrity problem' internally.",
        diagram: "twitter_hybrid",
      },
    ],
  },
  netflix: {
    title: "Netflix",
    subtitle: "How Netflix delivers video at global scale",
    icon: "▶",
    tags: ["Popular", "Interview favorite"],
    steps: [
      {
        heading: "Microservices Architecture",
        text: "Netflix runs 700+ microservices. When you press play: your app calls the API Gateway → Auth service → Billing service → Playback service → then CDN delivers the video. Each service is independently deployable.",
        insight: "Netflix pioneered microservices. They famously migrated from a monolith after a database corruption in 2008 brought down the entire service.",
        diagram: "netflix_arch",
      },
      {
        heading: "Adaptive Bitrate Streaming",
        text: "Netflix encodes each video into multiple quality tiers (240p to 4K). Your client measures bandwidth every few seconds and switches tiers — so a 4K stream drops gracefully to 720p if your WiFi weakens.",
        insight: "The video is split into 2-10 second segments. Buffer 3-4 ahead. Switch quality between segments. This is the ABR algorithm.",
        diagram: "netflix_abr",
      },
    ],
  },
  uber: {
    title: "Uber",
    subtitle: "Real-time location matching at scale",
    icon: "⬡",
    tags: ["Popular", "Interview favorite"],
    steps: [
      {
        heading: "The Matching Problem",
        text: "Uber needs to match a rider with the nearest available driver in real-time across millions of active users. Drivers send GPS pings every 4 seconds. The system must find all drivers within 2km in under 100ms.",
        insight: "This is a geospatial index problem. Uber uses H3 (hexagonal hierarchical spatial indexing) to divide the Earth into hexagons.",
        diagram: "uber_match",
      },
      {
        heading: "Surge Pricing Algorithm",
        text: "When demand exceeds supply in a hex region, the multiplier increases. Drivers see higher earnings and move toward the area. Riders see higher prices and some cancel — until equilibrium is reached.",
        insight: "The surge multiplier is recalculated every few minutes per region. It's a real-time feedback loop, not a simple formula.",
        diagram: "uber_surge",
      },
    ],
  },
  scale: {
    title: "Scalability",
    subtitle: "Key patterns for every system design interview",
    icon: "↑",
    tags: ["Interview essential"],
    steps: [
      {
        heading: "Horizontal vs Vertical Scaling",
        text: "Vertical scaling = buy a bigger machine (more CPU/RAM). Simple but has a ceiling. Horizontal scaling = add more machines. Requires stateless services and a load balancer in front.",
        insight: "Interview rule: always recommend horizontal scaling + stateless services for production systems. Vertical scaling for quick wins or databases.",
        diagram: "scale_hv",
      },
      {
        heading: "Database Sharding",
        text: "Sharding splits your database into partitions across multiple machines. Each shard holds a subset of the data. Queries go to the right shard based on a shard key.",
        insight: "Choose shard keys carefully — a bad key causes hot spots. User ID is usually good. Timestamp is bad (all new writes go to one shard).",
        diagram: "scale_shard",
      },
      {
        heading: "Message Queues",
        text: "A message queue (Kafka, RabbitMQ) decouples producers from consumers. The API writes jobs to a queue and returns immediately. Workers pull and process jobs asynchronously — absorbing traffic spikes.",
        insight: "Whenever you see 'send an email', 'resize an image', 'process a payment' — these should go through a message queue, not done synchronously.",
        diagram: "scale_mq",
      },
    ],
  },
};

const TAG_COLORS = {
  "Intermediate": { bg: "#1a2744", text: "#6b9fff" },
  "Interview favorite": { bg: "#1e1a30", text: "#9b8aff" },
  "Most popular": { bg: "#0f2520", text: "#4ecb94" },
  "Popular": { bg: "#0f2520", text: "#4ecb94" },
  "Interview essential": { bg: "#1e1a30", text: "#9b8aff" },
};

// ─── SVG DIAGRAMS ──────────────────────────────────────────────────────────────
function DiagramLBIntro() {
  return (
    <svg viewBox="0 0 560 175" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#6b9fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {/* Clients */}
      {[30, 76, 122].map((y, i) => (
        <g key={i}>
          <rect x="10" y={y} width="80" height="34" rx="6" fill="#1a2744" stroke="#2a3a5c" strokeWidth="0.8" />
          <text x="50" y={y + 21} textAnchor="middle" dominantBaseline="central" fill="#6b9fff" fontSize="12" fontFamily="monospace">Client {i + 1}</text>
        </g>
      ))}
      {/* Flow lines to LB */}
      {[[90,47,195,82],[90,93,195,93],[90,139,195,104]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a5a8a" strokeWidth="1.2" markerEnd="url(#arr)" strokeDasharray="5 3">
          <animate attributeName="strokeDashoffset" from="0" to="-16" dur="1.2s" repeatCount="indefinite"/>
        </line>
      ))}
      {/* Load Balancer */}
      <rect x="195" y="62" width="130" height="60" rx="10" fill="#1e1a40" stroke="#6b55ff" strokeWidth="1.2" />
      <text x="260" y="86" textAnchor="middle" dominantBaseline="central" fill="#c0b8ff" fontSize="13" fontWeight="600" fontFamily="monospace">Load Balancer</text>
      <text x="260" y="104" textAnchor="middle" dominantBaseline="central" fill="#6b5fcc" fontSize="11" fontFamily="monospace">distributes traffic</text>
      {/* Lines from LB to servers */}
      {[[325,78,400,38],[325,90,400,90],[325,102,400,142]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a5a8a" strokeWidth="1.2" markerEnd="url(#arr)" strokeDasharray="5 3">
          <animate attributeName="strokeDashoffset" from="0" to="-16" dur="1.5s" repeatCount="indefinite"/>
        </line>
      ))}
      {/* Servers */}
      {[20,72,124].map((y,i)=>(
        <g key={i}>
          <rect x="400" y={y} width="80" height="34" rx="6" fill="#1a2a1a" stroke="#2a5a3a" strokeWidth="0.8"/>
          <text x="440" y={y+21} textAnchor="middle" dominantBaseline="central" fill="#4ecb94" fontSize="12" fontFamily="monospace">Server {i+1}</text>
        </g>
      ))}
      {/* DB */}
      <rect x="500" y="72" width="52" height="34" rx="6" fill="#1a1a2a" stroke="#3a3a5a" strokeWidth="0.8"/>
      <text x="526" y="93" textAnchor="middle" dominantBaseline="central" fill="#7070aa" fontSize="11" fontFamily="monospace">DB</text>
    </svg>
  );
}

function DiagramLBRoundRobin() {
  return (
    <svg viewBox="0 0 560 160" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#6b9fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="20" y="58" width="120" height="50" rx="8" fill="#1e1a40" stroke="#6b55ff" strokeWidth="1.2"/>
      <text x="80" y="79" textAnchor="middle" dominantBaseline="central" fill="#c0b8ff" fontSize="13" fontWeight="600" fontFamily="monospace">Load Balancer</text>
      <text x="80" y="97" textAnchor="middle" dominantBaseline="central" fill="#6b5fcc" fontSize="11" fontFamily="monospace">Round robin</text>
      {[[140,68,255,30],[140,83,255,83],[140,98,255,136]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a5a8a" strokeWidth="1.3" markerEnd="url(#arr2)" fill="none"/>
      ))}
      {[["Server A","Req #1, #4, #7…",14],["Server B","Req #2, #5, #8…",64],["Server C","Req #3, #6, #9…",116]].map(([name,sub,y],i)=>(
        <g key={i}>
          <rect x="255" y={y} width="130" height="44" rx="6" fill="#1a2a1a" stroke="#2a5a3a" strokeWidth="0.8"/>
          <text x="320" y={y+16} textAnchor="middle" dominantBaseline="central" fill="#4ecb94" fontSize="12" fontWeight="600" fontFamily="monospace">{name}</text>
          <text x="320" y={y+32} textAnchor="middle" dominantBaseline="central" fill="#2a8a5a" fontSize="11" fontFamily="monospace">{sub}</text>
        </g>
      ))}
      <text x="420" y="88" textAnchor="middle" dominantBaseline="central" fill="#4a6a8a" fontSize="12" fontFamily="monospace">= equal load</text>
    </svg>
  );
}

function DiagramLBHealth() {
  return (
    <svg viewBox="0 0 560 175" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="arr3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#6b9fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="20" y="65" width="120" height="50" rx="8" fill="#1e1a40" stroke="#6b55ff" strokeWidth="1.2"/>
      <text x="80" y="85" textAnchor="middle" dominantBaseline="central" fill="#c0b8ff" fontSize="13" fontWeight="600" fontFamily="monospace">Load Balancer</text>
      <text x="80" y="103" textAnchor="middle" dominantBaseline="central" fill="#6b5fcc" fontSize="11" fontFamily="monospace">Health checker</text>
      {/* Ping lines to healthy servers */}
      {[[140,76,238,40],[140,90,238,90]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a5a8a" strokeWidth="1" strokeDasharray="5 3" markerEnd="url(#arr3)" fill="none"/>
      ))}
      {/* Healthy servers */}
      {[["Server A","✓ healthy",16],["Server B","✓ healthy",66]].map(([name,status,y],i)=>(
        <g key={i}>
          <rect x="238" y={y} width="115" height="48" rx="6" fill="#0f2a1f" stroke="#1a5a3a" strokeWidth="0.8"/>
          <text x="295" y={y+18} textAnchor="middle" dominantBaseline="central" fill="#4ecb94" fontSize="12" fontWeight="600" fontFamily="monospace">{name}</text>
          <text x="295" y={y+34} textAnchor="middle" dominantBaseline="central" fill="#2a8a5a" fontSize="11" fontFamily="monospace">{status}</text>
        </g>
      ))}
      {/* Failed line with X */}
      <line x1="140" y1="100" x2="238" y2="136" stroke="#cc3333" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
      <text x="178" y="122" textAnchor="middle" fill="#cc3333" fontSize="18" fontWeight="bold">✕</text>
      {/* Failed server */}
      <rect x="238" y="116" width="115" height="48" rx="6" fill="#2a0f0f" stroke="#5a1a1a" strokeWidth="0.8"/>
      <text x="295" y="134" textAnchor="middle" dominantBaseline="central" fill="#ff5555" fontSize="12" fontWeight="600" fontFamily="monospace">Server C</text>
      <text x="295" y="150" textAnchor="middle" dominantBaseline="central" fill="#aa3333" fontSize="11" fontFamily="monospace">✗ removed</text>
      {/* Labels */}
      <text x="388" y="40" textAnchor="start" fill="#4a6a8a" fontSize="11" fontFamily="monospace">Ping every 5s</text>
      <text x="388" y="88" textAnchor="start" fill="#4a6a8a" fontSize="11" fontFamily="monospace">Traffic routed to</text>
      <text x="388" y="102" textAnchor="start" fill="#4a6a8a" fontSize="11" fontFamily="monospace">healthy servers only</text>
      <text x="388" y="140" textAnchor="start" fill="#aa3333" fontSize="11" fontFamily="monospace">Auto-removed from pool</text>
    </svg>
  );
}

function DiagramLBLayers() {
  return (
    <svg viewBox="0 0 560 165" style={{ width: "100%", display: "block" }}>
      <rect x="20" y="20" width="240" height="58" rx="8" fill="#0f1f3a" stroke="#2a4a7a" strokeWidth="0.8"/>
      <text x="140" y="44" textAnchor="middle" dominantBaseline="central" fill="#6b9fff" fontSize="13" fontWeight="600" fontFamily="monospace">L4 Load Balancer</text>
      <text x="140" y="62" textAnchor="middle" dominantBaseline="central" fill="#3a6aaa" fontSize="11" fontFamily="monospace">TCP/UDP — sees IP + port only</text>
      <rect x="20" y="95" width="240" height="58" rx="8" fill="#1e1a40" stroke="#6b55ff" strokeWidth="1.2"/>
      <text x="140" y="119" textAnchor="middle" dominantBaseline="central" fill="#c0b8ff" fontSize="13" fontWeight="600" fontFamily="monospace">L7 Load Balancer</text>
      <text x="140" y="137" textAnchor="middle" dominantBaseline="central" fill="#6b5fcc" fontSize="11" fontFamily="monospace">HTTP — reads URL, headers, cookies</text>
      {/* L4 features */}
      <text x="280" y="32" textAnchor="start" fill="#4a6a8a" fontSize="11" fontFamily="monospace">Very fast, low overhead</text>
      <text x="280" y="48" textAnchor="start" fill="#4a6a8a" fontSize="11" fontFamily="monospace">No content inspection</text>
      <text x="280" y="64" textAnchor="start" fill="#3a5a8a" fontSize="11" fontFamily="monospace">e.g. AWS NLB, HAProxy</text>
      {/* L7 features */}
      <text x="280" y="108" textAnchor="start" fill="#7a6acc" fontSize="11" fontFamily="monospace">Path-based routing</text>
      <text x="280" y="124" textAnchor="start" fill="#7a6acc" fontSize="11" fontFamily="monospace">SSL termination</text>
      <text x="280" y="140" textAnchor="start" fill="#5a4aaa" fontSize="11" fontFamily="monospace">e.g. Nginx, AWS ALB</text>
    </svg>
  );
}

function DiagramCacheIntro() {
  return (
    <svg viewBox="0 0 560 165" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="ca" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#4ecb94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="10" y="66" width="80" height="36" rx="6" fill="#1a2744" stroke="#2a3a5c" strokeWidth="0.8"/>
      <text x="50" y="88" textAnchor="middle" dominantBaseline="central" fill="#6b9fff" fontSize="12" fontFamily="monospace">Client</text>
      <line x1="90" y1="84" x2="155" y2="84" stroke="#3a5a8a" strokeWidth="1.2" markerEnd="url(#ca)" fill="none" strokeDasharray="5 3">
        <animate attributeName="strokeDashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite"/>
      </line>
      <rect x="155" y="54" width="115" height="60" rx="8" fill="#0f2a1a" stroke="#1a6a4a" strokeWidth="1"/>
      <text x="212" y="79" textAnchor="middle" dominantBaseline="central" fill="#4ecb94" fontSize="13" fontWeight="600" fontFamily="monospace">Cache</text>
      <text x="212" y="97" textAnchor="middle" dominantBaseline="central" fill="#2a8a5a" fontSize="11" fontFamily="monospace">Redis / Memcached</text>
      {/* Cache hit path */}
      <path d="M212 54 C212 22 50 22 50 66" stroke="#4ecb94" strokeWidth="1.2" strokeDasharray="5 3" fill="none" markerEnd="url(#ca)"/>
      <text x="130" y="14" textAnchor="middle" fill="#2a8a5a" fontSize="11" fontFamily="monospace">cache hit: ~0.1ms</text>
      {/* Miss */}
      <line x1="270" y1="84" x2="336" y2="84" stroke="#4a6a8a" strokeWidth="1.2" markerEnd="url(#ca)" fill="none"/>
      <rect x="336" y="54" width="100" height="60" rx="8" fill="#1a1a2a" stroke="#2a2a5a" strokeWidth="0.8"/>
      <text x="386" y="79" textAnchor="middle" dominantBaseline="central" fill="#7a7acc" fontSize="13" fontWeight="600" fontFamily="monospace">Database</text>
      <text x="386" y="97" textAnchor="middle" dominantBaseline="central" fill="#4a4a8a" fontSize="11" fontFamily="monospace">~10ms query</text>
      {/* Store back */}
      <path d="M386 54 C386 130 212 130 212 114" stroke="#3a4a6a" strokeWidth="1" strokeDasharray="4 3" fill="none" markerEnd="url(#ca)"/>
      <text x="305" y="152" textAnchor="middle" fill="#3a5a7a" fontSize="11" fontFamily="monospace">store result in cache</text>
    </svg>
  );
}

function DiagramCacheHit() {
  return (
    <svg viewBox="0 0 560 162" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="ch" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#4ecb94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <marker id="cm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#6b9fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <text x="20" y="22" fill="#c0b8ff" fontSize="12" fontWeight="600" fontFamily="monospace">Cache hit path</text>
      {[["Request","#1a2744","#6b9fff",20],["Cache ✓","#0f2a1a","#4ecb94",112],["Return 0.1ms","#0a1f0a","#2ecb74",204]].map(([label,bg,color,x],i)=>(
        <g key={i}><rect x={x} y="32" width={i===2?120:80} height="32" rx="5" fill={bg} stroke={color} strokeWidth="0.8"/>
        <text x={x+(i===2?60:40)} y="52" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="11" fontFamily="monospace">{label}</text></g>
      ))}
      <line x1="100" y1="48" x2="112" y2="48" stroke="#4ecb94" strokeWidth="1.2" markerEnd="url(#ch)" fill="none"/>
      <line x1="192" y1="48" x2="204" y2="48" stroke="#4ecb94" strokeWidth="1.2" markerEnd="url(#ch)" fill="none"/>
      <text x="20" y="105" fill="#c0b8ff" fontSize="12" fontWeight="600" fontFamily="monospace">Cache miss path</text>
      {[["Request","#1a2744","#6b9fff",20],["Cache ✗","#2a0f0f","#ff5555",112],["DB 10ms","#1a1a2a","#7a7acc",204],["Store cache","#0f2a1a","#4ecb94",330]].map(([label,bg,color,x],i)=>(
        <g key={i}><rect x={x} y="115" width={i===3?120:80} height="32" rx="5" fill={bg} stroke={color} strokeWidth="0.8"/>
        <text x={x+(i===3?60:40)} y="135" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="11" fontFamily="monospace">{label}</text></g>
      ))}
      <line x1="100" y1="131" x2="112" y2="131" stroke="#6b9fff" strokeWidth="1.2" markerEnd="url(#cm)" fill="none"/>
      <line x1="192" y1="131" x2="204" y2="131" stroke="#6b9fff" strokeWidth="1.2" markerEnd="url(#cm)" fill="none"/>
      <line x1="284" y1="131" x2="330" y2="131" stroke="#6b9fff" strokeWidth="1.2" markerEnd="url(#cm)" fill="none"/>
    </svg>
  );
}

function DiagramCacheEvict() {
  return (
    <svg viewBox="0 0 560 140" style={{ width: "100%", display: "block" }}>
      {[
        ["LRU","Evict least recently used","Best default choice","#1a2744","#6b9fff",10],
        ["LFU","Evict least frequently used","Hot/cold patterns","#1a2030","#9b8aff",196],
        ["TTL","Expire after fixed time","Stale data (news, weather)","#0f2a1a","#4ecb94",382],
      ].map(([title,sub,note,bg,color,x])=>(
        <g key={title}>
          <rect x={x} y="20" width="156" height="64" rx="8" fill={bg} stroke={color} strokeWidth="0.8"/>
          <text x={x+78} y="44" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="14" fontWeight="700" fontFamily="monospace">{title}</text>
          <text x={x+78} y="66" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="10" fontFamily="monospace" opacity="0.7">{sub}</text>
          <text x={x+78} y="104" textAnchor="middle" fill={color} fontSize="11" fontFamily="monospace" opacity="0.5">{note}</text>
        </g>
      ))}
    </svg>
  );
}

function DiagramCDNIntro() {
  return (
    <svg viewBox="0 0 560 165" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="cdna" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#4ecb94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      {/* Origin */}
      <rect x="220" y="60" width="110" height="48" rx="8" fill="#1a1a2a" stroke="#2a2a5a" strokeWidth="0.8"/>
      <text x="275" y="80" textAnchor="middle" dominantBaseline="central" fill="#7a7acc" fontSize="12" fontWeight="600" fontFamily="monospace">Origin Server</text>
      <text x="275" y="98" textAnchor="middle" dominantBaseline="central" fill="#4a4a8a" fontSize="11" fontFamily="monospace">Mumbai, India</text>
      {/* Edges */}
      {[["CDN Edge","New York",20],["CDN Edge","London",74],["CDN Edge","Singapore",124]].map(([t,c,y])=>(
        <g key={c}>
          <rect x="10" y={y} width="100" height="40" rx="6" fill="#0f1f3a" stroke="#1a3a6a" strokeWidth="0.8"/>
          <text x="60" y={y+16} textAnchor="middle" dominantBaseline="central" fill="#6b9fff" fontSize="11" fontWeight="600" fontFamily="monospace">{t}</text>
          <text x="60" y={y+30} textAnchor="middle" dominantBaseline="central" fill="#3a6aaa" fontSize="11" fontFamily="monospace">{c}</text>
        </g>
      ))}
      {/* Dashed lines to origin */}
      {[[110,40,218,76],[110,94,218,84],[110,144,218,96]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a3a6a" strokeWidth="0.8" strokeDasharray="4 3" fill="none"/>
      ))}
      {/* Users */}
      {[["US users",20],["EU users",74],["SEA users",124]].map(([label,y])=>(
        <g key={label}>
          <rect x="440" y={y} width="90" height="40" rx="6" fill="#1a2744" stroke="#2a3a5c" strokeWidth="0.8"/>
          <text x="485" y={y+24} textAnchor="middle" dominantBaseline="central" fill="#6b9fff" fontSize="11" fontFamily="monospace">{label}</text>
        </g>
      ))}
      {/* User to edge flows */}
      {[[440,40,112,40],[440,94,112,94],[440,144,112,144]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a5a8a" strokeWidth="1.2" markerEnd="url(#cdna)" fill="none" strokeDasharray="5 3">
          <animate attributeName="strokeDashoffset" from="0" to="-16" dur={`${1.2+i*0.3}s`} repeatCount="indefinite"/>
        </line>
      ))}
      <text x="275" y="150" textAnchor="middle" fill="#3a5a7a" fontSize="11" fontFamily="monospace">~5ms each vs ~150ms to origin</text>
    </svg>
  );
}

function DiagramGeneric({ title }) {
  return (
    <svg viewBox="0 0 560 120" style={{ width: "100%", display: "block" }}>
      <rect x="160" y="20" width="240" height="80" rx="10" fill="#1a1a2a" stroke="#2a2a5a" strokeWidth="0.8"/>
      <text x="280" y="65" textAnchor="middle" dominantBaseline="central" fill="#4a4a8a" fontSize="13" fontFamily="monospace">{title}</text>
    </svg>
  );
}

const DIAGRAM_MAP = {
  lb_intro: <DiagramLBIntro />,
  lb_roundrobin: <DiagramLBRoundRobin />,
  lb_health: <DiagramLBHealth />,
  lb_layers: <DiagramLBLayers />,
  cache_intro: <DiagramCacheIntro />,
  cache_hit: <DiagramCacheHit />,
  cache_evict: <DiagramCacheEvict />,
  cdn_intro: <DiagramCDNIntro />,
  cdn_flow: <DiagramGeneric title="CDN cache flow" />,
  twitter_fanout: <DiagramGeneric title="Fan-out on write" />,
  twitter_hybrid: <DiagramGeneric title="Hybrid fan-out" />,
  netflix_arch: <DiagramGeneric title="Netflix microservices" />,
  netflix_abr: <DiagramGeneric title="Adaptive bitrate streaming" />,
  uber_match: <DiagramGeneric title="H3 geospatial matching" />,
  uber_surge: <DiagramGeneric title="Surge pricing feedback loop" />,
  scale_hv: <DiagramGeneric title="Horizontal vs vertical scaling" />,
  scale_shard: <DiagramGeneric title="Database sharding" />,
  scale_mq: <DiagramGeneric title="Message queue decoupling" />,
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SystemDesignLearning() {
  const [activeTopic, setActiveTopic] = useState("lb");
  const [step, setStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const topic = TOPICS[activeTopic];
  const currentStep = topic.steps[step];
  const totalSteps = topic.steps.length;

  const selectTopic = (id) => {
    setActiveTopic(id);
    setStep(0);
  };

  const NAV = [
    { group: "Core Concepts", items: [["lb","⇄","Load Balancer"],["cache","◈","Caching"],["cdn","◎","CDN"]] },
    { group: "Real-world Systems", items: [["twitter","✦","Twitter Feed"],["netflix","▶","Netflix"],["uber","⬡","Uber"]] },
    { group: "Interview Prep", items: [["scale","↑","Scalability"]] },
  ];

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      background: "#0a0e1a",
      minHeight: "100vh",
      color: "#c0c8e0",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6b9fff", boxShadow: "0 0 8px #6b9fff" }} />
            <span style={{ fontSize: "20px", fontWeight: "700", color: "#e0e8ff", letterSpacing: "-0.02em" }}>
              System Design
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#3a5a8a", marginTop: "2px", marginLeft: "18px" }}>
            Interactive visual walkthroughs
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["All topics", "Interview mode"].map((label) => (
            <button key={label} style={{
              fontSize: "11px", padding: "6px 12px",
              borderRadius: "6px", border: "0.5px solid #1e3a5a",
              background: "transparent", color: "#4a7aaa", cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.02em",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: "flex", gap: "0",
        border: "0.5px solid #1a2a3a",
        borderRadius: "14px", overflow: "hidden",
        minHeight: "540px",
      }}>
        {/* Sidebar */}
        <div style={{
          width: "210px", minWidth: "210px",
          background: "#0d1220",
          borderRight: "0.5px solid #1a2a3a",
          padding: "16px 0",
          display: "flex", flexDirection: "column", gap: "0",
        }}>
          {NAV.map(({ group, items }) => (
            <div key={group}>
              <div style={{
                fontSize: "10px", fontWeight: "600", color: "#2a4a6a",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "10px 16px 6px",
              }}>{group}</div>
              {items.map(([id, icon, label]) => (
                <div key={id} onClick={() => selectTopic(id)} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 16px", cursor: "pointer",
                  fontSize: "13px",
                  color: activeTopic === id ? "#c0d8ff" : "#4a6a8a",
                  background: activeTopic === id ? "#0f1f38" : "transparent",
                  borderLeft: `2px solid ${activeTopic === id ? "#6b9fff" : "transparent"}`,
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: "14px", opacity: activeTopic === id ? 1 : 0.5 }}>{icon}</span>
                  {label}
                </div>
              ))}
              <div style={{ height: "0.5px", background: "#1a2a3a", margin: "8px 16px" }} />
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0c1018" }}>
          {/* Topic header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "0.5px solid #1a2a3a",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "22px", color: "#6b9fff", lineHeight: 1 }}>{topic.icon}</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#e0e8ff" }}>{topic.title}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#3a5a8a", marginBottom: "8px" }}>{topic.subtitle}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {topic.tags.map((tag) => {
                  const c = TAG_COLORS[tag] || { bg: "#1a2744", text: "#6b9fff" };
                  return (
                    <span key={tag} style={{
                      fontSize: "10px", padding: "3px 9px",
                      borderRadius: "20px", fontWeight: "600",
                      background: c.bg, color: c.text,
                      letterSpacing: "0.04em",
                    }}>{tag}</span>
                  );
                })}
              </div>
            </div>
            {/* Step progress */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", minWidth: "80px" }}>
              <span style={{ fontSize: "11px", color: "#2a4a6a" }}>Step {step + 1} of {totalSteps}</span>
              <div style={{ display: "flex", gap: "5px" }}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} onClick={() => setStep(i)} style={{
                    width: "8px", height: "8px", borderRadius: "50%", cursor: "pointer",
                    background: i < step ? "#6b9fff" : i === step ? "#c0d8ff" : "#1a2a3a",
                    boxShadow: i === step ? "0 0 6px #6b9fff" : "none",
                    transition: "all 0.2s",
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Step content */}
          <div key={`${activeTopic}-${step}`} style={{
            flex: 1, padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: "14px",
            overflowY: "auto",
            animation: "fadeUp 0.25s ease",
          }}>
            <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            {/* Heading */}
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#c0d8ff", letterSpacing: "-0.01em" }}>
              {currentStep.heading}
            </div>

            {/* Explanation */}
            <div style={{ fontSize: "13px", color: "#5a7aaa", lineHeight: "1.75" }}>
              {currentStep.text}
            </div>

            {/* Diagram */}
            {currentStep.diagram && (
              <div style={{
                background: "#0a0f1c",
                border: "0.5px solid #1a2a3a",
                borderRadius: "10px",
                padding: "16px",
                overflow: "hidden",
              }}>
                {DIAGRAM_MAP[currentStep.diagram] || <DiagramGeneric title={currentStep.diagram} />}
              </div>
            )}

            {/* Insight callout */}
            {currentStep.insight && (
              <div style={{
                background: "#0d1a2a",
                border: "0.5px solid #1a3a5a",
                borderLeft: "3px solid #6b9fff",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex", gap: "10px", alignItems: "flex-start",
              }}>
                <span style={{ color: "#6b9fff", fontSize: "14px", marginTop: "1px" }}>💡</span>
                <div style={{ fontSize: "12px", color: "#4a7aaa", lineHeight: "1.65" }}>
                  {currentStep.insight}
                </div>
              </div>
            )}
          </div>

          {/* Step navigation */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "0.5px solid #1a2a3a",
            background: "#0d1220",
          }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "7px",
                fontSize: "12px", fontWeight: "600", cursor: step === 0 ? "not-allowed" : "pointer",
                border: "0.5px solid #1a2a3a",
                background: "transparent", color: step === 0 ? "#1e3a5a" : "#4a7aaa",
                fontFamily: "inherit", letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}
            >
              ← Previous
            </button>

            {/* Step pills */}
            <div style={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} onClick={() => setStep(i)} style={{
                  width: i === step ? "24px" : "8px", height: "8px",
                  borderRadius: "4px", cursor: "pointer",
                  background: i === step ? "#6b9fff" : i < step ? "#2a4a7a" : "#1a2a3a",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>

            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "7px",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  border: "0.5px solid #6b9fff",
                  background: "#0f1f38", color: "#6b9fff",
                  fontFamily: "inherit", letterSpacing: "0.02em",
                  transition: "all 0.15s",
                }}
              >
                Next →
              </button>
            ) : (
              <button
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "7px",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  border: "0.5px solid #4ecb94",
                  background: "#0a2a1a", color: "#4ecb94",
                  fontFamily: "inherit", letterSpacing: "0.02em",
                }}
              >
                Practice ✦
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div style={{ display: "flex", gap: "24px", marginTop: "14px", padding: "0 2px" }}>
        {[
          ["7", "Topics"],
          ["20+", "Concepts"],
          ["Step-by-step", "Walkthroughs"],
          ["Interview", "Ready"],
        ].map(([val, label]) => (
          <div key={label} style={{ fontSize: "11px", color: "#2a4a6a" }}>
            <span style={{ color: "#3a6aaa", fontWeight: "700" }}>{val}</span>{" "}
            <span style={{ color: "#1e3a5a" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}