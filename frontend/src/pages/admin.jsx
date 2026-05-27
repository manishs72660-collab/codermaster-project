import React, { useState } from 'react';
import { Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router';

function Admin() {
  const [selectedOption, setSelectedOption] = useState(null);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
      color: 'btn-success',
      bgColor: 'bg-success/10',
      route: '/admin/create',
      accent: '#00b86b',
      accentBg: '#0f2a1a',
      accentBorder: '#1a3a2a',
      tag: 'WRITE',
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems and their details',
      icon: Edit,
      color: 'btn-warning',
      bgColor: 'bg-warning/10',
      route: '/admin/update',
      accent: '#ffa116',
      accentBg: '#2a1f0a',
      accentBorder: '#3a2e0f',
      tag: 'EDIT',
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform',
      icon: Trash2,
      color: 'btn-error',
      bgColor: 'bg-error/10',
      route: '/admin/delete',
      accent: '#ff4444',
      accentBg: '#2a0f0f',
      accentBorder: '#3a1a1a',
      tag: 'REMOVE',
    },
    {
      id: 'makeadmin',
      title: 'Make Admin',
      description: 'Grant admin privileges to platform users',
      icon: ShieldCheck,
      color: 'btn-info',
      bgColor: 'bg-info/10',
      route: '/admin/makeadmin',
      accent: '#4493f8',
      accentBg: '#0d1a2e',
      accentBorder: '#1c2a3a',
      tag: 'ACCESS',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adm-root {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
        }

        /* ── TOPBAR (matches homepage nav) ── */
        .adm-topbar {
          background: #161b22;
          border-bottom: 1px solid #21262d;
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .adm-logo-icon {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #0d1117;
          flex-shrink: 0;
        }
        .adm-logo-text {
          font-weight: 700; font-size: 15px; letter-spacing: -0.3px;
          color: #e6edf3;
        }
        .adm-topbar-sep {
          width: 1px; height: 20px;
          background: #21262d; margin: 0 8px;
        }
        .adm-topbar-crumb {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #8b949e; letter-spacing: 0.5px;
        }
        .adm-topbar-crumb span { color: #ffa116; }

        /* ── MAIN ── */
        .adm-main {
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* ── HEADER ── */
        .adm-header { margin-bottom: 40px; }
        .adm-header-top {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
        }
        .adm-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #ffa116;
          background: #2a1f0a;
          border: 1px solid #3a2e0f;
          border-radius: 4px;
          padding: 2px 8px;
        }
        .adm-h1 {
          font-size: 26px; font-weight: 700;
          color: #e6edf3; letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .adm-sub {
          font-size: 13px; color: #8b949e; line-height: 1.7;
          margin-top: 6px;
        }

        /* ── DIVIDER (matches homepage style) ── */
        .adm-divider {
          height: 1px;
          background: #21262d;
          margin: 32px 0;
        }

        /* ── GRID ── */
        .adm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 12px;
        }

        /* ── CARD ── */
        .adm-card {
          position: relative;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 10px;
          padding: 22px 20px 20px;
          text-decoration: none;
          color: #e6edf3;
          display: flex; flex-direction: column;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
          overflow: hidden;
          cursor: pointer;
        }
        .adm-card::after {
          /* subtle top accent line */
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--c-accent);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .adm-card:hover {
          border-color: var(--c-border);
          background: var(--c-bg);
          transform: translateY(-2px);
        }
        .adm-card:hover::after { opacity: 1; }
        .adm-card:active { transform: translateY(0); }

        /* ── CARD TOP ROW ── */
        .adm-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .adm-icon-box {
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: var(--c-bg);
          border: 1px solid var(--c-border);
          flex-shrink: 0;
        }
        .adm-icon-box svg {
          width: 17px; height: 17px;
          color: var(--c-accent);
        }
        .adm-card-op-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600; letter-spacing: 1.2px;
          color: var(--c-accent); opacity: 0.6;
          padding-top: 2px;
        }

        /* ── CARD BODY ── */
        .adm-card-title {
          font-size: 14px; font-weight: 600;
          color: #e6edf3; margin-bottom: 6px;
          letter-spacing: -0.2px;
        }
        .adm-card-desc {
          font-size: 12px; color: #8b949e;
          line-height: 1.65; flex: 1;
          margin-bottom: 20px;
        }

        /* ── CARD CTA ── */
        .adm-card-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: var(--c-accent);
          background: var(--c-bg);
          border: 1px solid var(--c-border);
          border-radius: 6px;
          padding: 5px 12px;
          width: fit-content;
          transition: gap 0.15s ease, background 0.15s ease;
        }
        .adm-card:hover .adm-card-btn {
          gap: 9px;
          background: var(--c-border);
        }
        .adm-card-btn::after { content: '→'; font-size: 12px; }

        /* ── STATS ROW (matches homepage bottom panels) ── */
        .adm-stats {
          display: flex; gap: 0;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 32px;
        }
        .adm-stat {
          flex: 1; padding: 14px 20px;
          border-right: 1px solid #21262d;
          display: flex; flex-direction: column; gap: 3px;
        }
        .adm-stat:last-child { border-right: none; }
        .adm-stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: #495366;
        }
        .adm-stat-val {
          font-size: 18px; font-weight: 700;
          letter-spacing: -0.5px; color: #e6edf3;
          line-height: 1;
        }
        .adm-stat-sub {
          font-size: 11px; color: #8b949e;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── ANIMATION ── */
        @keyframes adm-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .adm-card { animation: adm-in 0.3s ease both; }
        .adm-card:nth-child(1) { animation-delay: 0.04s; }
        .adm-card:nth-child(2) { animation-delay: 0.09s; }
        .adm-card:nth-child(3) { animation-delay: 0.14s; }
        .adm-card:nth-child(4) { animation-delay: 0.19s; }

        /* ── SCROLLBAR (matches homepage) ── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
      `}</style>

      <div className="adm-root">

        {/* Topbar — identical feel to homepage nav */}
        <div className="adm-topbar">
          <div className="adm-logo-icon">⌨</div>
          <span className="adm-logo-text">CodeJudge</span>
          <div className="adm-topbar-sep" />
          <span className="adm-topbar-crumb">
            Dashboard / <span>Admin</span>
          </span>
        </div>

        <div className="adm-main">

          {/* Header */}
          <div className="adm-header">
            <div className="adm-header-top">
              <span className="adm-tag">Admin Panel</span>
            </div>
            <h1 className="adm-h1">Platform Management</h1>
            <p className="adm-sub">Create, update, and delete problems — or manage user access permissions.</p>
          </div>

          <div className="adm-divider" />

          {/* Cards grid */}
          <div className="adm-grid">
            {adminOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <NavLink
                  key={option.id}
                  to={option.route}
                  className="adm-card"
                  style={{
                    '--c-accent': option.accent,
                    '--c-bg':     option.accentBg,
                    '--c-border': option.accentBorder,
                  }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="adm-card-top">
                    <div className="adm-icon-box">
                      <IconComponent />
                    </div>
                    <span className="adm-card-op-tag">{option.tag}</span>
                  </div>

                  <div className="adm-card-title">{option.title}</div>
                  <div className="adm-card-desc">{option.description}</div>

                  <span className="adm-card-btn">{option.title}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Stats bar — same surface + border tokens as homepage panels */}
          <div className="adm-stats">
            <div className="adm-stat">
              <span className="adm-stat-label">Operations</span>
              <span className="adm-stat-val">4</span>
              <span className="adm-stat-sub">available actions</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-label">Access Level</span>
              <span className="adm-stat-val" style={{ color: '#ffa116' }}>Admin</span>
              <span className="adm-stat-sub">full permissions</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-label">Session</span>
              <span className="adm-stat-val" style={{ color: '#00b86b' }}>Active</span>
              <span className="adm-stat-sub">authenticated</span>
            </div>
            <div className="adm-stat">
              <span className="adm-stat-label">Platform</span>
              <span className="adm-stat-val" style={{ fontSize: 14, paddingTop: 2 }}>CodeJudge</span>
              <span className="adm-stat-sub">v1.0.0</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Admin;