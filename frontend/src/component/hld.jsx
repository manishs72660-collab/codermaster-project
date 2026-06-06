// src/components/HLDComponents.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ======================== THEME (shared) ========================
const THEME = {
  bg: '#0a0a12',
  cardBg: '#11111f',
  border: '#1f1f2f',
  accent: '#f97316',
  accentDim: '#ea580c',
  text: '#e2e2e8',
  textDim: '#a1a1aa',
  nodeBg: '#18182a',
  wire: '#f97316',
};

// ======================== CARD WRAPPER ========================
const Card = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ backgroundColor: THEME.cardBg, borderColor: THEME.border, padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid', marginBottom: '1rem' }}
  >
    <h2 style={{ color: THEME.accent, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h2>
    {children}
  </motion.div>
);

// ======================== 1. LOAD BALANCER MODULE ========================
export const LoadBalancerModule = () => {
  const [algorithm, setAlgorithm] = useState('round-robin');
  const [serverHealth, setServerHealth] = useState({ s1: true, s2: true, s3: true });
  const [connections, setConnections] = useState({ s1: 0, s2: 0, s3: 0 });
  const [activeServer, setActiveServer] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [simulating, setSimulating] = useState(true);

  useEffect(() => {
    if (!simulating) return;
    const interval = setInterval(() => {
      let selected;
      const healthy = Object.keys(serverHealth).filter(s => serverHealth[s]);
      if (healthy.length === 0) return;
      if (algorithm === 'round-robin') {
        const idx = requestCount % healthy.length;
        selected = healthy[idx];
      } else {
        selected = healthy.reduce((a, b) => (connections[a] < connections[b] ? a : b));
        setConnections(prev => ({ ...prev, [selected]: prev[selected] + 1 }));
        setTimeout(() => setConnections(prev => ({ ...prev, [selected]: Math.max(0, prev[selected] - 1) })), 2000);
      }
      setActiveServer(selected);
      setRequestCount(prev => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [algorithm, serverHealth, connections, requestCount, simulating]);

  useEffect(() => {
    const healthInterval = setInterval(() => {
      setServerHealth(prev => ({
        s1: prev.s1,
        s2: Math.random() > 0.85 ? !prev.s2 : prev.s2,
        s3: Math.random() > 0.85 ? !prev.s3 : prev.s3,
      }));
    }, 10000);
    return () => clearInterval(healthInterval);
  }, []);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text, padding: '1.5rem', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ color: THEME.accent, fontSize: '1.875rem', fontWeight: 'bold' }}>Load Balancer</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setAlgorithm('round-robin')} style={{ background: algorithm === 'round-robin' ? THEME.accent : '#374151', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', border: 'none', color: '#fff', cursor: 'pointer' }}>Round Robin</button>
          <button onClick={() => setAlgorithm('least-connections')} style={{ background: algorithm === 'least-connections' ? THEME.accent : '#374151', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', border: 'none', color: '#fff', cursor: 'pointer' }}>Least Connections</button>
          <button onClick={() => setSimulating(!simulating)} style={{ background: '#374151', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', border: 'none', color: '#fff', cursor: 'pointer' }}>{simulating ? 'Pause' : 'Start'}</button>
        </div>
      </div>

      <Card title="Live Traffic Flow">
        <div style={{ position: 'relative', width: '100%', height: '300px', marginBottom: '1rem' }}>
          <svg viewBox="0 0 800 300" style={{ width: '100%', height: '100%' }}>
            <rect x="30" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
            <text x="70" y="155" fill={THEME.text} fontSize="12" textAnchor="middle">Clients</text>
            <rect x="200" y="120" width="120" height="60" rx="10" fill={THEME.nodeBg} stroke={THEME.accent} strokeWidth="2" />
            <text x="260" y="150" fill={THEME.accent} fontSize="13" fontWeight="bold" textAnchor="middle">Load Balancer</text>
            <text x="260" y="168" fill={THEME.textDim} fontSize="10" textAnchor="middle">{algorithm === 'round-robin' ? 'Round Robin' : 'Least Connections'}</text>
            <rect x="420" y="40" width="100" height="45" rx="8" fill={THEME.nodeBg} stroke={serverHealth.s1 ? '#22c55e' : '#ef4444'} />
            <text x="470" y="68" fill={THEME.text} fontSize="12" textAnchor="middle">Server A</text>
            <rect x="420" y="120" width="100" height="45" rx="8" fill={THEME.nodeBg} stroke={serverHealth.s2 ? '#22c55e' : '#ef4444'} />
            <text x="470" y="148" fill={THEME.text} fontSize="12" textAnchor="middle">Server B</text>
            <rect x="420" y="200" width="100" height="45" rx="8" fill={THEME.nodeBg} stroke={serverHealth.s3 ? '#22c55e' : '#ef4444'} />
            <text x="470" y="228" fill={THEME.text} fontSize="12" textAnchor="middle">Server C</text>
            <rect x="620" y="120" width="100" height="45" rx="8" fill={THEME.nodeBg} stroke={THEME.accentDim} />
            <text x="670" y="148" fill={THEME.text} fontSize="12" textAnchor="middle">Database</text>

            <line x1="110" y1="150" x2="200" y2="150" stroke={THEME.wire} strokeWidth="2" />
            {simulating && <circle r="4" fill={THEME.wire}><animateMotion dur="1s" repeatCount="indefinite" path="M110,150 L200,150" /></circle>}
            <line x1="320" y1="140" x2="420" y2="62" stroke={THEME.wire} strokeWidth="2" />
            <line x1="320" y1="150" x2="420" y2="142" stroke={THEME.wire} strokeWidth="2" />
            <line x1="320" y1="160" x2="420" y2="222" stroke={THEME.wire} strokeWidth="2" />
            {simulating && activeServer === 's1' && <circle r="4" fill={THEME.wire}><animateMotion dur="0.8s" repeatCount="1" fill="freeze" path="M320,140 L420,62" /></circle>}
            {simulating && activeServer === 's2' && <circle r="4" fill={THEME.wire}><animateMotion dur="0.8s" repeatCount="1" fill="freeze" path="M320,150 L420,142" /></circle>}
            {simulating && activeServer === 's3' && <circle r="4" fill={THEME.wire}><animateMotion dur="0.8s" repeatCount="1" fill="freeze" path="M320,160 L420,222" /></circle>}
            <line x1="520" y1="62" x2="620" y2="142" stroke={THEME.wire} strokeWidth="2" />
            <line x1="520" y1="142" x2="620" y2="142" stroke={THEME.wire} strokeWidth="2" />
            <line x1="520" y1="222" x2="620" y2="142" stroke={THEME.wire} strokeWidth="2" />
          </svg>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div>✅ Server A: {serverHealth.s1 ? 'Healthy' : 'Down'} (conn: {connections.s1})</div>
          <div>✅ Server B: {serverHealth.s2 ? 'Healthy' : 'Down'} (conn: {connections.s2})</div>
          <div>✅ Server C: {serverHealth.s3 ? 'Healthy' : 'Down'} (conn: {connections.s3})</div>
        </div>
      </Card>

      <Card title="Step-by-Step Request Flow">
        <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Client sends request to load balancer IP/DNS.</li>
          <li>Load balancer applies <strong>{algorithm}</strong> algorithm to select a healthy backend.</li>
          <li>Round Robin: cycles through servers (A→B→C→A…). Least Connections: picks server with fewest active connections.</li>
          <li>Request forwarded to selected server.</li>
          <li>Server processes (queries DB) and returns response via load balancer to client.</li>
          <li>Health checks every 5s: after 3 failures, server removed; after 2 successes, added back.</li>
        </ol>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <Card title="Real-World Use Cases">
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            <li><strong>Netflix</strong> – Zuul + Eureka + Ribbon</li>
            <li><strong>Google</strong> – Maglev (consistent hashing)</li>
            <li><strong>AWS</strong> – Application Load Balancer (ALB)</li>
            <li><strong>GitHub</strong> – HAProxy + health checks</li>
          </ul>
        </Card>
        <Card title="Advantages & Disadvantages">
          <div><span style={{ color: '#4ade80' }}>✅ Scalability</span> – distribute load</div>
          <div><span style={{ color: '#4ade80' }}>✅ High availability</span> – auto remove failed servers</div>
          <div><span style={{ color: '#f87171' }}>❌ Single point of failure</span> – use multiple LBs + failover</div>
          <div><span style={{ color: '#f87171' }}>❌ Cost & complexity</span></div>
        </Card>
      </div>
    </div>
  );
};

// ======================== 2. MONOLITHIC CODEMASTER ========================
export const MonolithicCodeMaster = () => {
  const [step, setStep] = useState(0);
  const steps = ['User Login', 'Browse Problems', 'Submit Code', 'Compile & Judge', 'Store Result', 'Notify User'];
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s+1)%steps.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text, padding: '1.5rem', borderRadius: '1rem' }}>
      <h1 style={{ color: THEME.accent, fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>CodeMaster Monolithic Architecture</h1>
      <Card title="System Diagram">
        <svg viewBox="0 0 900 450" style={{ width: '100%', height: 'auto' }}>
          <rect x="100" y="20" width="700" height="410" rx="20" fill={THEME.cardBg} stroke={THEME.accent} strokeWidth="1" />
          <text x="450" y="50" fill={THEME.accent} fontSize="16" textAnchor="middle">Monolithic CodeMaster</text>
          <rect x="140" y="80" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="200" y="104" fill={THEME.text} fontSize="11" textAnchor="middle">Auth</text>
          <rect x="280" y="80" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="340" y="104" fill={THEME.text} fontSize="11" textAnchor="middle">User Mgmt</text>
          <rect x="420" y="80" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="480" y="104" fill={THEME.text} fontSize="11" textAnchor="middle">Problems</text>
          <rect x="560" y="80" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="620" y="104" fill={THEME.text} fontSize="11" textAnchor="middle">Code Editor</text>
          <rect x="140" y="150" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="200" y="174" fill={THEME.text} fontSize="11" textAnchor="middle">Compiler</text>
          <rect x="280" y="150" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="340" y="174" fill={THEME.text} fontSize="11" textAnchor="middle">Notifications</text>
          <rect x="420" y="150" width="120" height="40" rx="6" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="480" y="174" fill={THEME.text} fontSize="11" textAnchor="middle">Admin Panel</text>
          <rect x="250" y="250" width="140" height="50" rx="8" fill={THEME.nodeBg} stroke="#22c55e" />
          <text x="320" y="280" fill={THEME.text} fontSize="12" textAnchor="middle">MongoDB</text>
          <rect x="480" y="250" width="140" height="50" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="550" y="280" fill={THEME.text} fontSize="12" textAnchor="middle">Redis Cache</text>
          <line x1="200" y1="120" x2="200" y2="250" stroke={THEME.accent} strokeWidth="1.5" />
          <line x1="340" y1="120" x2="320" y2="250" stroke={THEME.accent} strokeWidth="1.5" />
          <line x1="480" y1="120" x2="550" y2="250" stroke={THEME.accent} strokeWidth="1.5" />
          <line x1="620" y1="120" x2="550" y2="250" stroke={THEME.accent} strokeWidth="1.5" />
          <circle r="5" fill={THEME.accent}>
            <animateMotion dur="2s" repeatCount="indefinite" path="M50,400 L200,100 L320,280 L550,280" />
          </circle>
        </svg>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>Current step: <strong style={{color:THEME.accent}}>{steps[step]}</strong></div>
      </Card>
      <Card title="User Journey">
        <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
          <li>User signs up / logs in</li>
          <li>Fetches problems (cached in Redis)</li>
          <li>Submits code → compiler runs in sandbox</li>
          <li>Result stored in MongoDB, cache invalidated</li>
          <li>Notification sent via WebSocket/email</li>
        </ol>
      </Card>
    </div>
  );
};

// ======================== 3. MICROSERVICES CODEMASTER ========================
export const MicroservicesCodeMaster = () => {
  const [activeService, setActiveService] = useState(null);
  const services = ['Auth', 'User', 'Problem', 'Submission', 'Compiler', 'Contest', 'Leaderboard', 'Notification', 'Discussion', 'Admin', 'Search', 'Analytics'];
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setActiveService(services[idx % services.length]);
      idx++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text, padding: '1.5rem', borderRadius: '1rem' }}>
      <h1 style={{ color: THEME.accent, fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>CodeMaster Microservices Architecture</h1>
      <Card title="Service Mesh + API Gateway">
        <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto' }}>
          <rect x="400" y="20" width="160" height="50" rx="10" fill={THEME.nodeBg} stroke={THEME.accent} strokeWidth="2" />
          <text x="480" y="50" fill={THEME.accent} fontSize="13" textAnchor="middle">API Gateway</text>
          {services.map((s, i) => (
            <g key={s}>
              <rect x={60 + (i%4)*210} y={120 + Math.floor(i/4)*80} width="150" height="45" rx="8" fill={THEME.nodeBg} stroke={activeService === s ? THEME.accent : '#2d2d3d'} />
              <text x={135 + (i%4)*210} y={150 + Math.floor(i/4)*80} fill={THEME.text} fontSize="11" textAnchor="middle">{s}</text>
            </g>
          ))}
          <rect x="750" y="350" width="140" height="45" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="820" y="378" fill={THEME.text} fontSize="11" textAnchor="middle">Kafka Queue</text>
          <line x1="480" y1="70" x2="480" y2="400" stroke={THEME.accent} strokeWidth="1.5" strokeDasharray="4" />
          {activeService && (
            <circle r="5" fill={THEME.accent}>
              <animateMotion dur="0.8s" repeatCount="indefinite" path={`M480,70 L${135 + (services.indexOf(activeService)%4)*210},${150 + Math.floor(services.indexOf(activeService)/4)*80}`} />
            </circle>
          )}
        </svg>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>Active service: <strong style={{color:THEME.accent}}>{activeService || 'none'}</strong></div>
      </Card>
      <Card title="Communication Patterns">
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
          <li>Sync: HTTP/REST + gRPC (API Gateway → services)</li>
          <li>Async: Kafka for submission → compiler, notifications, analytics</li>
          <li>Service discovery via Consul/Eureka</li>
          <li>Circuit breaker (Resilience4j)</li>
        </ul>
      </Card>
    </div>
  );
};

// ======================== 4. PRODUCTION-SCALE SYSTEM ========================
export const ProductionSystem = () => {
  const [step, setStep] = useState(0);
  const steps = ['DNS', 'CDN', 'Load Balancer', 'API Gateway', 'Microservices', 'Cache/DB'];
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s+1)%steps.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: THEME.bg, color: THEME.text, padding: '1.5rem', borderRadius: '1rem' }}>
      <h1 style={{ color: THEME.accent, fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>Production‑Scale System (LeetCode / GitHub)</h1>
      <Card title="End‑to‑End Request Flow">
        <svg viewBox="0 0 1100 300" style={{ width: '100%', height: 'auto' }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={THEME.accent} />
            </marker>
          </defs>
          <rect x="20" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="60" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">User</text>
          <rect x="140" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="180" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">DNS</text>
          <rect x="260" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="300" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">CDN</text>
          <rect x="380" y="130" width="100" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="430" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">Load Balancer</text>
          <rect x="520" y="130" width="100" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="570" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">API Gateway</text>
          <rect x="660" y="130" width="100" height="40" rx="8" fill={THEME.nodeBg} stroke={THEME.accent} />
          <text x="710" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">Microservices</text>
          <rect x="800" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke="#22c55e" />
          <text x="840" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">Cache</text>
          <rect x="920" y="130" width="80" height="40" rx="8" fill={THEME.nodeBg} stroke="#22c55e" />
          <text x="960" y="154" fill={THEME.text} fontSize="10" textAnchor="middle">DB</text>

          <line x1="100" y1="150" x2="140" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="220" y1="150" x2="260" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="340" y1="150" x2="380" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="480" y1="150" x2="520" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="620" y1="150" x2="660" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="760" y1="150" x2="800" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="880" y1="150" x2="920" y2="150" stroke={THEME.accent} strokeWidth="2" markerEnd="url(#arrow)" />

          <circle r="6" fill={THEME.accent}>
            <animateMotion dur="2s" repeatCount="indefinite" path={step === 0 ? "M20,150 L100,150" : step === 1 ? "M140,150 L220,150" : step === 2 ? "M260,150 L340,150" : step === 3 ? "M380,150 L480,150" : step === 4 ? "M520,150 L620,150" : "M660,150 L760,150"} />
          </circle>
        </svg>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>Routing through: <strong style={{color:THEME.accent}}>{steps[step]}</strong></div>
      </Card>
      <Card title="Full Stack Components">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>CDN (CloudFront)</div><div>Route53 (DNS)</div><div>ALB / HAProxy</div>
          <div>Kong Gateway</div><div>EKS (K8s)</div><div>Redis / Memcached</div>
          <div>RDS / DynamoDB</div><div>ElasticSearch</div><div>SQS / Kafka</div>
          <div>S3 Object Storage</div><div>Prometheus + Grafana</div><div>Jenkins CI/CD</div>
        </div>
      </Card>
    </div>
  );
};

// ======================== OPTIONAL: DEMO PAGE (exports all) ========================
export const HLDComponentsDemo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
    <LoadBalancerModule />
    <MonolithicCodeMaster />
    <MicroservicesCodeMaster />
    <ProductionSystem />
  </div>
);