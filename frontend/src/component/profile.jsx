import { useState } from "react";

const user = {
  firstName: "Manish Kumar",
  emailId: "manishsingh3631@gmail.com",
  _id: "6a022dc229f32df978bab060",
  role: "admin",
};

const stats = {
  solved: 247,
  total: 3000,
  easy: { solved: 120, total: 800 },
  medium: { solved: 98, total: 1500 },
  hard: { solved: 29, total: 700 },
  streak: 42,
  ranking: 18420,
  submissions: 614,
  acceptance: "78.3%",
};

const recentActivity = [
  { title: "Two Sum", difficulty: "Easy", status: "Accepted", time: "2h ago", lang: "JavaScript" },
  { title: "Median of Two Sorted Arrays", difficulty: "Hard", status: "Accepted", time: "1d ago", lang: "C++" },
  { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", status: "Wrong Answer", time: "1d ago", lang: "Python" },
  { title: "Valid Parentheses", difficulty: "Easy", status: "Accepted", time: "2d ago", lang: "JavaScript" },
  { title: "Merge K Sorted Lists", difficulty: "Hard", status: "Time Limit Exceeded", time: "3d ago", lang: "Java" },
];

const badges = [
  { icon: "🔥", label: "42-Day Streak" },
  { icon: "⚡", label: "Speed Coder" },
  { icon: "🏆", label: "Top 10%" },
  { icon: "💎", label: "Hard Slayer" },
];

const heatmapData = Array.from({ length: 52 * 7 }, (_, i) => ({
  active: Math.random() > 0.6,
  intensity: Math.floor(Math.random() * 4),
}));

const difficultyColor = { Easy: "#00b8a3", Medium: "#ffc01e", Hard: "#ef4743" };
const statusColor = { Accepted: "#00b8a3", "Wrong Answer": "#ef4743", "Time Limit Exceeded": "#ffc01e" };

function CircleProgress({ value, max, color, size = 110, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2d3a" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("activity");
  const initials = user.firstName.split(" ").map(n => n[0]).join("").toUpperCase();
  const solvedPct = Math.round((stats.solved / stats.total) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e0e0e0", fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "0 0 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #161922; } ::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 3px; }
        .card { background: #161922; border: 1px solid #1e2130; border-radius: 14px; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: all 0.2s; color: #666; }
        .tab-btn.active { background: #1e2130; color: #e0e0e0; }
        .tab-btn:hover:not(.active) { color: #aaa; }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: #1e2130; border: 1px solid #2a2d3a; border-radius: 20px; padding: 5px 13px; font-size: 12px; font-weight: 500; }
        .stat-bar { height: 6px; border-radius: 3px; background: #2a2d3a; overflow: hidden; }
        .stat-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
        .activity-row { display: flex; align-items: center; gap: 14px; padding: 13px 18px; border-bottom: 1px solid #1e2130; transition: background 0.15s; cursor: pointer; }
        .activity-row:last-child { border-bottom: none; }
        .activity-row:hover { background: #1a1d27; }
        .heatmap-cell { width: 10px; height: 10px; border-radius: 2px; }
        .copy-btn { background: none; border: 1px solid #2a2d3a; color: #666; border-radius: 6px; padding: 2px 8px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: 'JetBrains Mono', monospace; }
        .copy-btn:hover { border-color: #7c6af7; color: #7c6af7; }
        .glow { box-shadow: 0 0 0 1px #7c6af730, 0 4px 24px #7c6af718; }
      `}</style>

      {/* Top Nav */}
      <div style={{ background: "#10131a", borderBottom: "1px solid #1e2130", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#7c6af7,#a78bfa)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⌨</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px", color: "#fff" }}>CodeArena</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#7c6af720", color: "#a78bfa", border: "1px solid #7c6af740", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>ADMIN</div>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c6af7,#4f46e5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff" }}>{initials}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 22 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Profile Card */}
          <div className="card glow" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{ width: 86, height: 86, background: "linear-gradient(135deg,#7c6af7,#4f46e5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 30, color: "#fff", margin: "0 auto", border: "3px solid #2a2d3a" }}>
                {initials}
              </div>
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, background: "#00b8a3", borderRadius: "50%", border: "2px solid #161922" }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 19, color: "#fff", letterSpacing: "-0.3px" }}>{user.firstName}</div>
            <div style={{ color: "#555", fontSize: 13, marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>{user.emailId}</div>
            <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <div className="badge" style={{ color: "#a78bfa", borderColor: "#7c6af740" }}>⚙ Admin</div>
              <div className="badge" style={{ color: "#00b8a3", borderColor: "#00b8a330" }}>● Online</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, background: "#0f1117", border: "1px solid #1e2130", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#444", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user._id}</span>
              <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(user._id)}>copy</button>
            </div>
          </div>

          {/* Stats summary */}
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>Platform Stats</div>
            {[
              { label: "Global Ranking", value: `#${stats.ranking.toLocaleString()}`, icon: "🏅" },
              { label: "Submissions", value: stats.submissions, icon: "📤" },
              { label: "Acceptance Rate", value: stats.acceptance, icon: "✅" },
              { label: "Current Streak", value: `${stats.streak} days`, icon: "🔥" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e2130" }}>
                <span style={{ color: "#666", fontSize: 13, display: "flex", gap: 8 }}><span>{s.icon}</span>{s.label}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#c9cdd6" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="card" style={{ padding: "22px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>Badges</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {badges.map(b => (
                <div key={b.label} style={{ background: "#0f1117", border: "1px solid #1e2130", borderRadius: 10, padding: "12px 10px", textAlign: "center", transition: "border-color 0.2s", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#7c6af750"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2130"}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{b.icon}</div>
                  <div style={{ fontSize: 11, color: "#777", fontWeight: 500 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Solved Overview */}
          <div className="card" style={{ padding: "24px 26px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: "0.08em", marginBottom: 20, textTransform: "uppercase" }}>Problems Solved</div>
            <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
              {/* Circle */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <CircleProgress value={stats.solved} max={stats.total} color="#7c6af7" size={120} stroke={10} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stats.solved}</span>
                  <span style={{ fontSize: 11, color: "#555", marginTop: 2 }}>/ {stats.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Bars */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Easy", ...stats.easy, color: "#00b8a3" },
                  { label: "Medium", ...stats.medium, color: "#ffc01e" },
                  { label: "Hard", ...stats.hard, color: "#ef4743" },
                ].map(d => (
                  <div key={d.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: d.color, fontWeight: 600 }}>{d.label}</span>
                      <span style={{ fontSize: 12, color: "#666" }}>{d.solved} <span style={{ color: "#333" }}>/ {d.total}</span></span>
                    </div>
                    <div className="stat-bar">
                      <div className="stat-bar-fill" style={{ width: `${(d.solved / d.total) * 100}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Percent */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 800, background: "linear-gradient(135deg,#7c6af7,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{solvedPct}%</div>
                <div style={{ fontSize: 12, color: "#555" }}>completion</div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" }}>Submission Heatmap</div>
              <div style={{ fontSize: 12, color: "#444" }}>Past year</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateRows: "repeat(7, 10px)", gridAutoFlow: "column", gap: 3, width: "fit-content" }}>
                {heatmapData.map((cell, i) => (
                  <div key={i} className="heatmap-cell" title={cell.active ? `${cell.intensity + 1} submission(s)` : "No activity"}
                    style={{ background: cell.active ? ["#2d2460","#4a3d9a","#6b5bd4","#7c6af7"][cell.intensity] : "#1a1d27" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "#444" }}>Less</span>
              {["#1a1d27","#2d2460","#4a3d9a","#7c6af7"].map(c => (
                <div key={c} className="heatmap-cell" style={{ background: c }} />
              ))}
              <span style={{ fontSize: 11, color: "#444" }}>More</span>
            </div>
          </div>

          {/* Tabs + Content */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 4, padding: "14px 16px 0", borderBottom: "1px solid #1e2130" }}>
              {["activity", "contests", "discuss"].map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}
                  style={{ textTransform: "capitalize" }}>{tab === "activity" ? "Recent Activity" : tab === "contests" ? "Contests" : "Discuss"}</button>
              ))}
            </div>

            {activeTab === "activity" && (
              <div>
                {recentActivity.map((item, i) => (
                  <div key={i} className="activity-row">
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[item.status] || "#555", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#d4d8e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{item.lang} · {item.time}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: difficultyColor[item.difficulty], fontWeight: 500 }}>{item.difficulty}</span>
                      <span style={{ fontSize: 12, color: statusColor[item.status] || "#555", background: `${statusColor[item.status]}15`, padding: "2px 9px", borderRadius: 12, fontWeight: 500 }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "contests" && (
              <div style={{ padding: 40, textAlign: "center", color: "#444" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>No contests participated yet</div>
                <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Join a contest to see your rankings here</div>
              </div>
            )}

            {activeTab === "discuss" && (
              <div style={{ padding: 40, textAlign: "center", color: "#444" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>No discussions yet</div>
                <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Start contributing to the community</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}