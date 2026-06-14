import React, { useState } from 'react';
import { Plus, Edit, Trash2, ShieldCheck, Video, Trophy, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

function Admin() {
  const [selectedOption, setSelectedOption] = useState(null);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
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
      route: '/admin/makeadmin',
      accent: '#4493f8',
      accentBg: '#0d1a2e',
      accentBorder: '#1c2a3a',
      tag: 'ACCESS',
    },
    {
      id: 'video',
      title: 'Video Problem',
      description: 'Upload and delete editorial videos',
      icon: Video,
      route: '/admin/video',
      accent: '#4493f8',
      accentBg: '#0d1a2e',
      accentBorder: '#1c2a3a',
      tag: 'MEDIA',
    },
    // ── CONTEST CARDS ──
    {
      id: 'contest-create',
      title: 'Create Contest',
      description: 'Schedule a new timed contest with problems and participants',
      icon: Trophy,
      route: '/admin/contest/create',
      accent: '#c084fc',
      accentBg: '#1a0d2e',
      accentBorder: '#2e1a4a',
      tag: 'CONTEST',
    },
    {
      id: 'contest-manage',
      title: 'Manage Contests',
      description: 'Edit, update or delete existing contests',
      icon: Settings,
      route: '/admin/contest/manage',
      accent: '#f472b6',
      accentBg: '#2a0d1a',
      accentBorder: '#3a1a2e',
      tag: 'CONTEST',
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
        .adm-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; color: #e6edf3; }
        .adm-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
        .adm-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; letter-spacing: 0.5px; }
        .adm-topbar-crumb span { color: #ffa116; }

        .adm-main { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }

        .adm-header { margin-bottom: 40px; }
        .adm-header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .adm-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #ffa116; background: #2a1f0a;
          border: 1px solid #3a2e0f; border-radius: 4px; padding: 2px 8px;
        }
        .adm-h1 { font-size: 26px; font-weight: 700; color: #e6edf3; letter-spacing: -0.5px; line-height: 1.2; }
        .adm-sub { font-size: 13px; color: #8b949e; line-height: 1.7; margin-top: 6px; }
        .adm-divider { height: 1px; background: #21262d; margin: 32px 0; }

        /* section label like homepage */
        .adm-section-label {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .adm-section-bar { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }
        .adm-section-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase; color: #495366;
        }
        .adm-section-line { flex: 1; height: 1px; background: #21262d; }

        .adm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 12px;
        }

        .adm-card {
          position: relative;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 10px;
          padding: 22px 20px 20px;
          text-decoration: none;
          color: #e6edf3;
          display: flex; flex-direction: column;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
          overflow: hidden;
          cursor: pointer;
        }
        .adm-card::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--c-accent);
          opacity: 0; transition: opacity 0.15s;
        }
        .adm-card:hover { border-color: var(--c-border); background: var(--c-bg); transform: translateY(-2px); }
        .adm-card:hover::after { opacity: 1; }
        .adm-card:active { transform: translateY(0); }

        .adm-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .adm-icon-box {
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: var(--c-bg); border: 1px solid var(--c-border); flex-shrink: 0;
        }
        .adm-icon-box svg { width: 17px; height: 17px; color: var(--c-accent); }
        .adm-card-op-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 600; letter-spacing: 1.2px;
          color: var(--c-accent); opacity: 0.6; padding-top: 2px;
        }
        .adm-card-title { font-size: 14px; font-weight: 600; color: #e6edf3; margin-bottom: 6px; letter-spacing: -0.2px; }
        .adm-card-desc { font-size: 12px; color: #8b949e; line-height: 1.65; flex: 1; margin-bottom: 20px; }
        .adm-card-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: var(--c-accent); background: var(--c-bg);
          border: 1px solid var(--c-border); border-radius: 6px;
          padding: 5px 12px; width: fit-content;
          transition: gap 0.15s, background 0.15s;
        }
        .adm-card:hover .adm-card-btn { gap: 9px; background: var(--c-border); }
        .adm-card-btn::after { content: '→'; font-size: 12px; }

        .adm-stats {
          display: flex; background: #161b22;
          border: 1px solid #21262d; border-radius: 10px;
          overflow: hidden; margin-top: 32px;
        }
        .adm-stat { flex: 1; padding: 14px 20px; border-right: 1px solid #21262d; display: flex; flex-direction: column; gap: 3px; }
        .adm-stat:last-child { border-right: none; }
        .adm-stat-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #495366; }
        .adm-stat-val { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #e6edf3; line-height: 1; }
        .adm-stat-sub { font-size: 11px; color: #8b949e; font-family: 'JetBrains Mono', monospace; }

        @keyframes adm-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .adm-card { animation: adm-in 0.3s ease both; }
        .adm-card:nth-child(1) { animation-delay: 0.04s; }
        .adm-card:nth-child(2) { animation-delay: 0.08s; }
        .adm-card:nth-child(3) { animation-delay: 0.12s; }
        .adm-card:nth-child(4) { animation-delay: 0.16s; }
        .adm-card:nth-child(5) { animation-delay: 0.20s; }
        .adm-card:nth-child(6) { animation-delay: 0.24s; }
        .adm-card:nth-child(7) { animation-delay: 0.28s; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
      `}</style>

      <div className="adm-root">

        <div className="adm-topbar">
          <div className="adm-logo-icon">⌨</div>
          <span className="adm-logo-text">CodeMaster</span>
          <div className="adm-topbar-sep" />
          <span className="adm-topbar-crumb">Dashboard / <span>Admin</span></span>
        </div>

        <div className="adm-main">

          <div className="adm-header">
            <div className="adm-header-top">
              <span className="adm-tag">Admin Panel</span>
            </div>
            <h1 className="adm-h1">Platform Management</h1>
            <p className="adm-sub">Create, update, and delete problems — manage contests and user permissions.</p>
          </div>

          <div className="adm-divider" />

          {/* Problems section */}
          <div className="adm-section-label">
            <div className="adm-section-bar" style={{ background: '#ffa116' }} />
            <span className="adm-section-text">Problems</span>
            <div className="adm-section-line" />
          </div>

          <div className="adm-grid" style={{ marginBottom: 32 }}>
            {adminOptions.filter(o => !o.id.startsWith('contest')).map((option) => {
              const Icon = option.icon;
              return (
                <NavLink
                  key={option.id}
                  to={option.route}
                  className="adm-card"
                  style={{ '--c-accent': option.accent, '--c-bg': option.accentBg, '--c-border': option.accentBorder }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="adm-card-top">
                    <div className="adm-icon-box"><Icon /></div>
                    <span className="adm-card-op-tag">{option.tag}</span>
                  </div>
                  <div className="adm-card-title">{option.title}</div>
                  <div className="adm-card-desc">{option.description}</div>
                  <span className="adm-card-btn">{option.title}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Contests section */}
          <div className="adm-section-label">
            <div className="adm-section-bar" style={{ background: '#c084fc' }} />
            <span className="adm-section-text">Contests</span>
            <div className="adm-section-line" />
          </div>

          <div className="adm-grid">
            {adminOptions.filter(o => o.id.startsWith('contest')).map((option) => {
              const Icon = option.icon;
              return (
                <NavLink
                  key={option.id}
                  to={option.route}
                  className="adm-card"
                  style={{ '--c-accent': option.accent, '--c-bg': option.accentBg, '--c-border': option.accentBorder }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="adm-card-top">
                    <div className="adm-icon-box"><Icon /></div>
                    <span className="adm-card-op-tag">{option.tag}</span>
                  </div>
                  <div className="adm-card-title">{option.title}</div>
                  <div className="adm-card-desc">{option.description}</div>
                  <span className="adm-card-btn">{option.title}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="adm-stats">
            <div className="adm-stat">
              <span className="adm-stat-label">Operations</span>
              <span className="adm-stat-val">7</span>
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
              <span className="adm-stat-val" style={{ fontSize: 14, paddingTop: 2 }}>CodeMaster</span>
              <span className="adm-stat-sub">v1.0.0</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Admin;