import axiosClient from "../utils/axiosClient";
import { useState, useEffect } from 'react';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/code/solveproblem/${problemId}`);
        setSubmissions(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch submission history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problemId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusStyle = (status) => {
    switch (status) {
      case 'accepted': return { color: '#00b86b', bg: '#0d2218', bdr: '#1a3a2a', label: 'Accepted',     icon: '✓' };
      case 'wrong':    return { color: '#ff4444', bg: '#1a0808', bdr: '#3a1a1a', label: 'Wrong Answer', icon: '✗' };
      case 'error':    return { color: '#ffa116', bg: '#1e1608', bdr: '#3a2e0f', label: 'Error',        icon: '⚠' };
      case 'pending':  return { color: '#4493f8', bg: '#0a1220', bdr: '#1c2a3a', label: 'Pending',      icon: '…' };
      default:         return { color: '#8b949e', bg: '#161b22', bdr: '#21262d', label: status,         icon: '?' };
    }
  };

  const langStyle = (lang) => {
    const map = {
      python:     { color: '#ffa116', bg: '#1e1608' },
      javascript: { color: '#ffd700', bg: '#1e1c08' },
      cpp:        { color: '#4493f8', bg: '#0a1220' },
      java:       { color: '#ff4444', bg: '#1a0808' },
      typescript: { color: '#4493f8', bg: '#0a1220' },
      go:         { color: '#2dd4bf', bg: '#071518' },
      rust:       { color: '#ff8c42', bg: '#1a0e08' },
      c:          { color: '#c084fc', bg: '#120d1e' },
    };
    return map[lang?.toLowerCase()] || { color: '#8b949e', bg: '#161b22' };
  };

  const formatMemory = (memory) => {
    if (!memory && memory !== 0) return '—';
    if (memory < 1024) return `${memory} KB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs  = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)   return 'just now';
    if (diffMins < 60)  return `${diffMins}m ago`;
    if (diffHrs  < 24)  return `${diffHrs}h ago`;
    if (diffDays < 7)   return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const accepted = submissions.filter(s => s.status === 'accepted').length;
  const acceptRate = submissions.length ? Math.round((accepted / submissions.length) * 100) : 0;
  const bestRuntime = submissions.filter(s=>s.status==='accepted' && s.runtime).map(s=>s.runtime).sort((a,b)=>a-b)[0];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, flexDirection:'column', gap:14 }}>
        <div className="sh-spinner" />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#495366' }}>
          Loading submissions…
        </span>
      </div>
    </>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <>
      <style>{STYLES}</style>
      <div style={{ margin:20, background:'#1a0808', border:'1px solid #3a1a1a', borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:18 }}>✗</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#ff4444' }}>{error}</span>
      </div>
    </>
  );

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="sh-root">

        {/* Header */}
        <div className="sh-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:14, borderRadius:2, background:'#ffa116', flexShrink:0 }} />
            <span className="sh-header-title">Submission History</span>
          </div>
          <span className="sh-count">{submissions.length} submission{submissions.length!==1?'s':''}</span>
        </div>

        {/* Stats strip */}
        {submissions.length > 0 && (
          <div className="sh-stats">
            {[
              { label:'Total',       val: submissions.length, color:'#e6edf3' },
              { label:'Accepted',    val: accepted,           color:'#00b86b' },
              { label:'Accept Rate', val: `${acceptRate}%`,  color: acceptRate>=50?'#00b86b':'#ff4444' },
              { label:'Best Runtime',val: bestRuntime ? `${bestRuntime}s` : '—', color:'#4493f8' },
            ].map(s=>(
              <div key={s.label} className="sh-stat">
                <div className="sh-stat-val" style={{ color:s.color }}>{s.val}</div>
                <div className="sh-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {submissions.length === 0 ? (
          <div className="sh-empty">
            <div className="sh-empty-icon">◈</div>
            <div className="sh-empty-title">No submissions yet</div>
            <div className="sh-empty-sub">Submit your solution to see history here</div>
          </div>
        ) : (

          /* Table */
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  {['#','Language','Status','Runtime','Memory','Test Cases','Submitted',''].map(h=>(
                    <th key={h} className="sh-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => {
                  const st  = statusStyle(sub.status);
                  const ls  = langStyle(sub.language);
                  const isHov = hoveredRow === sub._id;
                  return (
                    <tr key={sub._id}
                      className="sh-tr"
                      onMouseEnter={()=>setHoveredRow(sub._id)}
                      onMouseLeave={()=>setHoveredRow(null)}
                      style={{ background: isHov ? '#1c2130' : 'transparent', borderLeft: isHov ? `2px solid ${st.color}` : '2px solid transparent' }}
                    >
                      {/* # */}
                      <td className="sh-td" style={{ color:'#495366', fontFamily:"'JetBrains Mono',monospace", fontSize:11, width:32 }}>{i+1}</td>

                      {/* Language */}
                      <td className="sh-td">
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:ls.color, background:ls.bg, borderRadius:5, padding:'2px 9px' }}>
                          {sub.language}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="sh-td">
                        <span className="sh-status-badge" style={{ color:st.color, background:st.bg, border:`1px solid ${st.bdr}` }}>
                          <span style={{ fontSize:10 }}>{st.icon}</span>
                          {st.label}
                        </span>
                      </td>

                      {/* Runtime */}
                      <td className="sh-td">
                        <span className="sh-mono" style={{ color: sub.status==='accepted'?'#00b86b':'#8b949e' }}>
                          {sub.runtime ? `${sub.runtime}s` : '—'}
                        </span>
                      </td>

                      {/* Memory */}
                      <td className="sh-td">
                        <span className="sh-mono" style={{ color:'#8b949e' }}>
                          {formatMemory(sub.memory)}
                        </span>
                      </td>

                      {/* Test cases */}
                      <td className="sh-td">
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span className="sh-mono" style={{ color: sub.testCasesPassed===sub.testCasesTotal?'#00b86b':sub.testCasesPassed>0?'#ffa116':'#8b949e' }}>
                            {sub.testCasesPassed}/{sub.testCasesTotal}
                          </span>
                          {/* mini bar */}
                          <div style={{ width:36, height:3, background:'#21262d', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:2, width:`${sub.testCasesTotal?(sub.testCasesPassed/sub.testCasesTotal)*100:0}%`, background: sub.testCasesPassed===sub.testCasesTotal?'#00b86b':'#ffa116' }} />
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="sh-td">
                        <span className="sh-mono" style={{ color:'#495366', fontSize:10 }} title={new Date(sub.createdAt).toLocaleString()}>
                          {formatDate(sub.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="sh-td">
                        <button className="sh-code-btn"
                          onClick={()=>setSelectedSubmission(sub)}
                          style={{ borderColor: isHov ? st.color : '#21262d', color: isHov ? st.color : '#8b949e' }}>
                          &lt;/&gt; Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {selectedSubmission && (() => {
        const st = statusStyle(selectedSubmission.status);
        const ls = langStyle(selectedSubmission.language);
        return (
          <div className="sh-modal-overlay" onClick={()=>setSelectedSubmission(null)}>
            <div className="sh-modal" onClick={e=>e.stopPropagation()}>

              {/* Modal header */}
              <div className="sh-modal-hdr">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:3, height:16, borderRadius:2, background:st.color, flexShrink:0 }} />
                  <span style={{ fontWeight:700, fontSize:14, letterSpacing:-0.2 }}>Submission Details</span>
                </div>
                <button className="sh-close-btn" onClick={()=>setSelectedSubmission(null)}>✕</button>
              </div>

              {/* Meta badges */}
              <div className="sh-modal-meta">
                <span className="sh-status-badge" style={{ color:st.color, background:st.bg, border:`1px solid ${st.bdr}` }}>
                  <span>{st.icon}</span> {st.label}
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:ls.color, background:ls.bg, borderRadius:5, padding:'3px 10px' }}>
                  {selectedSubmission.language}
                </span>
                {[
                  { label:'Runtime', val: selectedSubmission.runtime ? `${selectedSubmission.runtime}s` : '—', color:'#00b86b' },
                  { label:'Memory',  val: formatMemory(selectedSubmission.memory), color:'#4493f8' },
                  { label:'Passed',  val: `${selectedSubmission.testCasesPassed}/${selectedSubmission.testCasesTotal}`, color:'#ffa116' },
                ].map(b=>(
                  <span key={b.label} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:b.color, background:b.color+'18', border:`1px solid ${b.color}40`, borderRadius:6, padding:'3px 10px' }}>
                    {b.label}: <strong>{b.val}</strong>
                  </span>
                ))}
                <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#495366' }}>
                  {formatDate(selectedSubmission.createdAt)}
                </span>
              </div>

              {/* Error message */}
              {selectedSubmission.errorMessage && (
                <div style={{ margin:'0 20px 14px', background:'#1a0808', border:'1px solid #3a1a1a', borderRadius:8, padding:'10px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#ff4444', lineHeight:1.6 }}>
                  <div style={{ color:'#ff6b6b', fontSize:10, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Error</div>
                  {selectedSubmission.errorMessage}
                </div>
              )}

              {/* Code block */}
              <div className="sh-modal-code-wrap">
                <div className="sh-code-toolbar">
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'#495366', letterSpacing:1, textTransform:'uppercase' }}>Source Code</span>
                  <button className="sh-copy-btn" onClick={()=>navigator.clipboard?.writeText(selectedSubmission.code)}>
                    ⎘ Copy
                  </button>
                </div>
                <div className="sh-code-body">
                  {/* Line numbers + code */}
                  <div style={{ display:'flex' }}>
                    <div className="sh-line-nums">
                      {(selectedSubmission.code||'').split('\n').map((_,i)=>(
                        <div key={i}>{i+1}</div>
                      ))}
                    </div>
                    <pre className="sh-code-pre"><code>{selectedSubmission.code}</code></pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sh-modal-footer">
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#495366' }}>
                  {(selectedSubmission.code||'').split('\n').length} lines
                </span>
                <button className="sh-close-btn-main" onClick={()=>setSelectedSubmission(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .sh-root {
    background: #0d1117;
    color: #e6edf3;
    font-family: 'Segoe UI', -apple-system, sans-serif;
    min-height: 200px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #21262d;
  }

  /* scrollbar */
  .sh-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .sh-root ::-webkit-scrollbar-track { background: #161b22; }
  .sh-root ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

  /* HEADER */
  .sh-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; background: #0d1117;
    border-bottom: 1px solid #21262d;
  }
  .sh-header-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; color: #495366;
  }
  .sh-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: #495366;
  }

  /* STATS */
  .sh-stats {
    display: flex; background: #161b22;
    border-bottom: 1px solid #21262d;
  }
  .sh-stat {
    flex: 1; padding: 12px 16px;
    border-right: 1px solid #21262d; text-align: center;
  }
  .sh-stat:last-child { border-right: none; }
  .sh-stat-val {
    font-size: 18px; font-weight: 800;
    letter-spacing: -0.5px; line-height: 1; margin-bottom: 3px;
  }
  .sh-stat-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; color: #495366;
    letter-spacing: 1px; text-transform: uppercase;
  }

  /* EMPTY */
  .sh-empty {
    padding: 60px 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .sh-empty-icon { font-size: 32px; color: #30363d; }
  .sh-empty-title { font-size: 14px; font-weight: 600; color: #495366; }
  .sh-empty-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #30363d; }

  /* TABLE */
  .sh-table-wrap { overflow-x: auto; }
  .sh-table { width: 100%; border-collapse: collapse; }
  .sh-th {
    padding: 9px 14px; text-align: left;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; font-weight: 700;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: #495366; background: #161b22;
    border-bottom: 1px solid #21262d;
    white-space: nowrap;
  }
  .sh-tr { transition: background 0.12s; }
  .sh-td {
    padding: 10px 14px;
    border-bottom: 1px solid #21262d;
    vertical-align: middle;
    white-space: nowrap;
  }
  .sh-tr:last-child .sh-td { border-bottom: none; }

  /* BADGES */
  .sh-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 9px; border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  }
  .sh-mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 500;
  }

  /* CODE BUTTON */
  .sh-code-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 600;
    padding: 4px 12px; border-radius: 6px;
    background: transparent; cursor: pointer;
    border: 1px solid #21262d; color: #8b949e;
    transition: all 0.15s; letter-spacing: 0.3px;
  }
  .sh-code-btn:hover { background: #1c2130; }

  /* SPINNER */
  .sh-spinner {
    width: 28px; height: 28px;
    border: 2px solid #21262d; border-top-color: #ffa116;
    border-radius: 50%; animation: sh-spin 0.7s linear infinite;
  }
  @keyframes sh-spin { to { transform: rotate(360deg); } }

  /* MODAL OVERLAY */
  .sh-modal-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.72);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    backdrop-filter: blur(3px);
    animation: sh-fadein 0.18s ease;
  }
  @keyframes sh-fadein { from{opacity:0} to{opacity:1} }

  /* MODAL */
  .sh-modal {
    background: #0d1117; border: 1px solid #21262d;
    border-radius: 14px; width: 100%; max-width: 820px;
    max-height: 88vh; display: flex; flex-direction: column;
    overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    animation: sh-modal-in 0.22s cubic-bezier(.22,1,.36,1);
  }
  @keyframes sh-modal-in { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:none} }

  .sh-modal-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; background: #161b22;
    border-bottom: 1px solid #21262d; flex-shrink: 0;
  }
  .sh-modal-meta {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 12px 20px; border-bottom: 1px solid #21262d;
    background: #0d1117; flex-shrink: 0;
  }

  /* CODE VIEW */
  .sh-modal-code-wrap { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
  .sh-code-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; background: #161b22;
    border-bottom: 1px solid #21262d; flex-shrink: 0;
  }
  .sh-copy-btn {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    font-weight: 600; color: #8b949e; background: transparent;
    border: 1px solid #21262d; border-radius: 5px;
    padding: 3px 10px; cursor: pointer; transition: all 0.15s;
  }
  .sh-copy-btn:hover { border-color: #ffa116; color: #ffa116; }

  .sh-code-body {
    flex: 1; overflow: auto; background: #0d1117;
  }
  .sh-code-body::-webkit-scrollbar { width: 5px; height: 5px; }
  .sh-code-body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

  .sh-line-nums {
    padding: 14px 12px 14px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; line-height: 1.7;
    color: #30363d; text-align: right;
    border-right: 1px solid #21262d;
    user-select: none; flex-shrink: 0; min-width: 44px;
  }
  .sh-code-pre {
    flex: 1; padding: 14px 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; line-height: 1.7;
    color: #c9d1d9; margin: 0;
    white-space: pre; overflow-x: visible;
  }

  .sh-modal-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; background: #161b22;
    border-top: 1px solid #21262d; flex-shrink: 0;
  }
  .sh-close-btn {
    background: none; border: none; color: #495366;
    cursor: pointer; font-size: 14px; padding: 2px 6px;
    transition: color 0.15s;
  }
  .sh-close-btn:hover { color: #e6edf3; }
  .sh-close-btn-main {
    background: #161b22; border: 1px solid #21262d;
    border-radius: 7px; color: #e6edf3;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 600;
    padding: 7px 20px; cursor: pointer;
    transition: all 0.15s; letter-spacing: 0.3px;
  }
  .sh-close-btn-main:hover { border-color: #ffa116; color: #ffa116; }
`;

export default SubmissionHistory;