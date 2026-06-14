import { useState } from "react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const user = {
  name: "Arjun Kumar",
  handle: "@arjunkumar",
  email: "arjun.kumar@codemaster.dev",
  location: "India",
  memberSince: "Jan 2023",
  rank: 142,
  streak: 23,
  rating: 1842,
  acceptance: 78,
  totalSolved: 247,
  totalProblems: 700,
  submissions: 312,
  contests: 14,
  solved: { easy: { done: 120, total: 300 }, medium: { done: 98, total: 250 }, hard: { done: 29, total: 150 } },
  skills: ["Python", "JavaScript", "C++", "Dynamic Programming", "Graph Theory", "Binary Search", "Trees", "Greedy"],
  recentSubmissions: [
    { id: 1, title: "Two Sum", tag: "Array", difficulty: "Easy", lang: "Python", time: "2h ago", verdict: "Accepted" },
    { id: 2, title: "Longest Substring Without Repeating Characters", tag: "Sliding Window", difficulty: "Medium", lang: "JavaScript", time: "5h ago", verdict: "Accepted" },
    { id: 3, title: "Median of Two Sorted Arrays", tag: "Binary Search", difficulty: "Hard", lang: "C++", time: "1d ago", verdict: "Wrong Answer" },
    { id: 4, title: "Word Ladder", tag: "BFS", difficulty: "Hard", lang: "Python", time: "2d ago", verdict: "Time Limit" },
    { id: 5, title: "Valid Parentheses", tag: "Stack", difficulty: "Easy", lang: "Python", time: "3d ago", verdict: "Accepted" },
  ],
  badges: [
    { icon: "🔥", label: "Streak 23", color: "#ff6b1a" },
    { icon: "🏆", label: "Top 3%", color: "#ff8c42" },
    { icon: "⚡", label: "Speed", color: "#ff6b1a" },
    { icon: "🔒", label: "Locked", color: "#2a2a2a", locked: true },
  ],
};

// ─── Heatmap Data ─────────────────────────────────────────────────────────────
const heatmapData = [
  0,0,1,0,2,1,0,3,2,1,4,3,2,1,0,1,2,3,4,4,3,2,0,1,
  2,3,4,3,2,1,0,0,1,2,3,4,4,3,2,1,0,1,2,3,3,4,3,2,
  1,0,0,1,2,3,4,4,3,2,1,0,1,2,3,3,4,4,3,2,1,0,0,1,
  2,3,4,4,3,2,1,0,1,2,3,4,
];

const heatColors = ["#1a1209", "#2e1e08", "#4a2e0a", "#7a4a0f", "#ff6b1a"];

// ─── Verdict Config ───────────────────────────────────────────────────────────
const verdictStyle = {
  Accepted:     { bg: "#0d1f0a", color: "#4ade80", border: "#1a4010" },
  "Wrong Answer": { bg: "#1f0a0a", color: "#f87171", border: "#3a1010" },
  "Time Limit": { bg: "#1a1209", color: "#ff6b1a", border: "#2e1e08" },
};

const difficultyColor = { Easy: "#4ade80", Medium: "#ff6b1a", Hard: "#f87171" };

// ─── Circular Progress Ring ───────────────────────────────────────────────────
function RingProgress({ done, total, size = 88, stroke = 6 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (done / total) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1209" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#ff6b1a" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#f5f0e8" }}>{done}</span>
        <span style={{ fontSize: 10, color: "#4a3a2a" }}>/ {total}</span>
      </div>
    </div>
  );
}

// ─── Diff Bar ─────────────────────────────────────────────────────────────────
function DiffBar({ label, done, total, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color }}>{label}</span>
        <span style={{ color: "#4a3a2a" }}>{done}/{total}</span>
      </div>
      <div style={{ height: 4, background: "#1a1209", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round((done / total) * 100)}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("Overview");
  const tabs = ["Overview", "Submissions", "Solutions", "Contests"];

  const styles = {
    root: {
      background: "#0a0805",
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#c9b99a",
    },
    topbar: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 32px", background: "#0d0b08",
      borderBottom: "1px solid #1e1508",
      position: "sticky", top: 0, zIndex: 100,
    },
    logo: { fontSize: 16, fontWeight: 600, color: "#f5f0e8", letterSpacing: ".02em" },
    logoAccent: { color: "#ff6b1a" },
    navLink: { fontSize: 12, color: "#4a3a2a", cursor: "pointer", letterSpacing: ".04em", padding: "4px 0", transition: "color .2s" },
    navLinkActive: { fontSize: 12, color: "#ff6b1a", cursor: "pointer", letterSpacing: ".04em", padding: "4px 0", borderBottom: "1px solid #ff6b1a" },
    heroBg: {
      background: "#0d0b08", padding: "32px 32px 0",
      borderBottom: "1px solid #1e1508", position: "relative", overflow: "hidden",
    },
    gridOverlay: {
      position: "absolute", inset: 0,
      backgroundImage: "linear-gradient(#1e1508 1px, transparent 1px), linear-gradient(90deg, #1e1508 1px, transparent 1px)",
      backgroundSize: "40px 40px", opacity: 0.5,
    },
    avatar: {
      width: 88, height: 88, borderRadius: "50%",
      background: "#1a1209", border: "2px solid #2e1e08",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 30, fontWeight: 600, color: "#ff6b1a", flexShrink: 0,
    },
    tag: (bg, color, border) => ({
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, padding: "3px 10px", borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`, letterSpacing: ".03em",
    }),
    tab: (active) => ({
      fontSize: 12, padding: "10px 20px", cursor: "pointer",
      color: active ? "#ff6b1a" : "#4a3a2a",
      borderBottom: active ? "2px solid #ff6b1a" : "2px solid transparent",
      letterSpacing: ".04em", transition: "color .2s",
      background: "transparent", border: "none", fontFamily: "inherit",
    }),
    body: {
      padding: "24px 32px",
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
      maxWidth: 1100, margin: "0 auto",
    },
    card: {
      background: "#0d0b08", border: "1px solid #1e1508",
      borderRadius: 12, padding: "20px 22px",
    },
    cardFull: {
      background: "#0d0b08", border: "1px solid #1e1508",
      borderRadius: 12, padding: "20px 22px", gridColumn: "1 / -1",
    },
    cardTitle: {
      fontSize: 11, color: "#4a3a2a", letterSpacing: ".08em",
      marginBottom: 16, textTransform: "uppercase",
    },
    statBox: {
      flex: 1, textAlign: "center", padding: 14,
      background: "#0a0805", borderRadius: 8, border: "1px solid #1e1508",
    },
    bigNum: (color = "#f5f0e8") => ({ fontSize: 26, fontWeight: 600, color }),
    numSub: { fontSize: 11, color: "#4a3a2a", marginTop: 3 },
    subItem: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "1px solid #140e05",
    },
    subTitle: { fontSize: 13, color: "#d4c4a8", marginBottom: 3, fontWeight: 500 },
    subMeta: { fontSize: 11, color: "#3a2a1a" },
    skill: {
      fontSize: 12, padding: "5px 12px", borderRadius: 8,
      background: "#110d06", border: "1px solid #1e1508", color: "#6a5040",
    },
    badgeBox: (color, locked) => ({
      width: 48, height: 48, borderRadius: 10, margin: "0 auto 6px",
      background: locked ? "#0d0b08" : "#1a1209",
      border: `1px solid ${locked ? "#1e1508" : "#2e1e08"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22,
    }),
    editBtn: {
      background: "#1a1209", color: "#ff6b1a",
      border: "1px solid #2e1e08", padding: "8px 16px",
      borderRadius: 8, fontSize: 12, cursor: "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
      marginBottom: 6,
    },
    viewAllBtn: {
      width: "100%", background: "#0a0805", color: "#4a3a2a",
      border: "1px solid #1e1508", padding: 10, borderRadius: 8,
      fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 14,
    },
    heatmapGrid: {
      display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3,
    },
    heatCell: (level) => ({
      height: 12, borderRadius: 2, background: heatColors[level],
    }),
  };

  return (
    <div style={styles.root}>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Topbar */}
      <div style={styles.topbar}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>Code</span>Master
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Problems", "Contest", "Profile", "Discuss"].map(n => (
            <span key={n} style={n === "Profile" ? styles.navLinkActive : styles.navLink}>{n}</span>
          ))}
        </div>
        <div style={{ ...styles.avatar, width: 34, height: 34, fontSize: 13 }}>AK</div>
      </div>

      {/* Hero */}
      <div style={styles.heroBg}>
        <div style={styles.gridOverlay} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}>
            <div style={{ position: "relative" }}>
              <div style={styles.avatar}>AK</div>
              <div style={{
                position: "absolute", bottom: 4, right: 4,
                width: 14, height: 14, borderRadius: "50%",
                background: "#4ade80", border: "2px solid #0d0b08",
              }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#f5f0e8", marginBottom: 2 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "#4a3a2a", marginBottom: 10 }}>
                {user.handle} · Member since {user.memberSince}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={styles.tag("#1a1209", "#ff6b1a", "#2e1e08")}>🏆 Rank #{user.rank}</span>
                <span style={styles.tag("#0a1a08", "#4ade80", "#0f3010")}>🔥 {user.streak}-day streak</span>
                <span style={styles.tag("#1a1209", "#ff8c42", "#2e1e08")}>⚡ Expert</span>
                <span style={styles.tag("#110d06", "#4a3a2a", "#1e1508")}>📍 {user.location}</span>
              </div>
            </div>
            <button style={styles.editBtn}>✏ Edit profile</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e1508", marginTop: 24 }}>
            {tabs.map(t => (
              <button key={t} style={styles.tab(activeTab === t)} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Problems Solved */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Problems solved</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <RingProgress done={user.totalSolved} total={user.totalProblems} />
            <div style={{ flex: 1 }}>
              <DiffBar label="Easy" done={user.solved.easy.done} total={user.solved.easy.total} color="#4ade80" />
              <DiffBar label="Medium" done={user.solved.medium.done} total={user.solved.medium.total} color="#ff6b1a" />
              <DiffBar label="Hard" done={user.solved.hard.done} total={user.solved.hard.total} color="#f87171" />
            </div>
          </div>
        </div>

        {/* Performance */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Performance</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={styles.statBox}>
              <div style={styles.bigNum("#ff6b1a")}>#{user.rank}</div>
              <div style={styles.numSub}>Global rank</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.bigNum("#4ade80")}>{user.acceptance}%</div>
              <div style={styles.numSub}>Acceptance</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { num: user.submissions, label: "Submissions" },
              { num: user.contests, label: "Contests" },
              { num: user.rating, label: "Rating", color: "#ff6b1a" },
            ].map(s => (
              <div key={s.label} style={{ ...styles.statBox }}>
                <div style={styles.bigNum(s.color || "#f5f0e8")}>{s.num}</div>
                <div style={styles.numSub}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Heatmap */}
        <div style={styles.cardFull}>
          <div style={styles.cardTitle}>Activity — last 84 days</div>
          <div style={styles.heatmapGrid}>
            {heatmapData.map((lvl, i) => (
              <div key={i} style={styles.heatCell(lvl)} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "#4a3a2a" }}>Less</span>
            {heatColors.map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 11, color: "#4a3a2a" }}>More</span>
          </div>
        </div>

        {/* Recent Submissions */}
        <div style={styles.cardFull}>
          <div style={styles.cardTitle}>Recent submissions</div>
          {user.recentSubmissions.map((s, i) => {
            const vs = verdictStyle[s.verdict] || verdictStyle["Accepted"];
            const isLast = i === user.recentSubmissions.length - 1;
            return (
              <div key={s.id} style={{ ...styles.subItem, ...(isLast ? { borderBottom: "none" } : {}) }}>
                <div>
                  <div style={styles.subTitle}>{s.title}</div>
                  <div style={styles.subMeta}>
                    {s.tag} · <span style={{ color: difficultyColor[s.difficulty] }}>{s.difficulty}</span> · {s.lang} · {s.time}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 5, fontWeight: 500,
                  background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`,
                }}>{s.verdict}</span>
              </div>
            );
          })}
          <button style={styles.viewAllBtn}>View all submissions →</button>
        </div>

        {/* Skills */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {user.skills.map(s => (
              <span key={s} style={styles.skill}>{s}</span>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Badges</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {user.badges.map(b => (
              <div key={b.label} style={{ textAlign: "center" }}>
                <div style={styles.badgeBox(b.color, b.locked)}>{b.icon}</div>
                <div style={{ fontSize: 11, color: b.locked ? "#2a1e12" : "#4a3a2a" }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}