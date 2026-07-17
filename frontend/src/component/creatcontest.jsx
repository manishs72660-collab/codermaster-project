import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Trophy, Plus, X, Search, KeyRound, Copy, Check, MessageCircle } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function AdminCreateContest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isPublic: true,
  });
  const [allProblems, setAllProblems]       = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [problemSearch, setProblemSearch]   = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [focused, setFocused]               = useState('');

  // Holds the full contest object returned by POST /contest/create,
  // including joinCode for private contests. Without capturing this,
  // the join code is generated on the server but never shown to the
  // admin anywhere.
  const [createdContest, setCreatedContest] = useState(null);
  const [codeCopied, setCodeCopied]         = useState(false);

  /* fetch all problems for picker */
  useEffect(() => {
    axiosClient.get('/problem/')
      .then(({ data }) => setAllProblems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filteredProblems = allProblems.filter((p) =>
    p.title?.toLowerCase().includes(problemSearch.toLowerCase()) &&
    !selectedProblems.find((sp) => sp._id === p._id)
  );

  const addProblem = (p) => setSelectedProblems((prev) => [...prev, p]);
  const removeProblem = (id) => setSelectedProblems((prev) => prev.filter((p) => p._id !== id));

  const resetForm = () => {
    setSuccess(false);
    setCreatedContest(null);
    setCodeCopied(false);
    setForm({ title: '', description: '', startTime: '', endTime: '', isPublic: true });
    setSelectedProblems([]);
  };

  const handleSubmit = async () => {
    setError('');
    const { title, description, startTime, endTime } = form;
    if (!title || !description || !startTime || !endTime) {
      setError('All fields are required.'); return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.'); return;
    }
    if (selectedProblems.length === 0) {
      setError('Add at least one problem to the contest.'); return;
    }

    setSubmitting(true);
    try {
      const { data } = await axiosClient.post('/contest/create', {
        ...form,
        problems: selectedProblems.map((p) => p._id),
      });
      setCreatedContest(data.contest);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create contest.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdContest?.joinCode) return;
    navigator.clipboard.writeText(createdContest.joinCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Opens WhatsApp (app or web) with a pre-filled message containing
  // the contest name and join code. No API key or backend call needed —
  // wa.me/?text= just deep-links into WhatsApp's own share flow and lets
  // the admin pick who to send it to.
  const handleShareWhatsApp = () => {
    if (!createdContest?.joinCode) return;
    const message =
      `Join my contest "${createdContest.title}" on CodeMaster!\n` +
      `Invite code: ${createdContest.joinCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const diffColor = (d) => {
    if (d === 'easy')   return '#00b86b';
    if (d === 'medium') return '#ffa116';
    if (d === 'hard')   return '#ff4444';
    return '#8b949e';
  };

  const inputStyle = (name) => ({
    width: '100%',
    background: focused === name ? '#1c2130' : '#161b22',
    border: `1px solid ${focused === name ? '#c084fc' : '#21262d'}`,
    borderRadius: 8,
    color: '#e6edf3',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    padding: '10px 14px',
    outline: 'none',
    transition: 'all 0.15s',
    resize: 'none',
  });

  if (success) {
    const isPrivate = createdContest?.isPublic === false;

    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#0f2a1a', border: '1px solid #1a3a2a', borderRadius: 16, padding: '40px 32px', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#00b86b', marginBottom: 8 }}>Contest Created!</div>
          <p style={{ fontSize: 13, color: '#8b949e', marginBottom: isPrivate ? 20 : 24 }}>
            {isPrivate
              ? 'Your private contest is live. Share the invite code below with participants.'
              : 'Your contest has been scheduled successfully.'}
          </p>

          {isPrivate && createdContest?.joinCode && (
            <div style={{
              background: '#1a0d2e', border: '1px solid #2e1a4a', borderRadius: 12,
              padding: '16px 18px', marginBottom: 24, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc' }}>
                <KeyRound size={14} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                  Invite Code
                </span>
              </div>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700,
                color: '#e9d5ff', letterSpacing: '0.35em', margin: 0,
              }}>
                {createdContest.joinCode}
              </p>

              {/* Copy + WhatsApp share actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handleCopyCode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: '1px solid #2e1a4a', borderRadius: 7,
                    color: '#c084fc', fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                    fontWeight: 700, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                  {codeCopied ? 'Copied' : 'Copy Code'}
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#25D366', border: '1px solid #25D366', borderRadius: 7,
                    color: '#0d1117', fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                    fontWeight: 700, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <MessageCircle size={12} />
                  Share on WhatsApp
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={resetForm}
              style={{ background: '#1a3a2a', border: '1px solid #1a3a2a', borderRadius: 8, color: '#00b86b', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, padding: '8px 18px', cursor: 'pointer' }}>
              Create Another
            </button>
            <button onClick={() => navigate('/admin/contest/manage')}
              style={{ background: '#c084fc', border: 'none', borderRadius: 8, color: '#0d1117', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, padding: '8px 18px', cursor: 'pointer' }}>
              Manage Contests →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-root { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', -apple-system, sans-serif; }
        .adm-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 8px; position: sticky; top: 0; z-index: 10; }
        .adm-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #ffa116, #ff6b00); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117; flex-shrink: 0; }
        .adm-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .adm-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
        .adm-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .adm-topbar-crumb span { color: #c084fc; }
        .adm-main { max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }
        .adm-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #c084fc; background: #1a0d2e; border: 1px solid #2e1a4a; border-radius: 4px; padding: 2px 8px; display: inline-block; margin-bottom: 12px; }
        .adm-h1 { font-size: 26px; font-weight: 700; color: #e6edf3; letter-spacing: -0.5px; margin-bottom: 6px; }
        .adm-sub { font-size: 13px; color: #8b949e; line-height: 1.7; }
        .adm-divider { height: 1px; background: #21262d; margin: 32px 0; }
        .adm-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; align-items: start; }
        .adm-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
        .adm-card-hdr { padding: 14px 20px; border-bottom: 1px solid #21262d; background: #0d1117; display: flex; align-items: center; gap: 8px; }
        .adm-card-hdr-dot { width: 5px; height: 5px; border-radius: 50%; }
        .adm-card-hdr-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #495366; }
        .adm-card-body { padding: 22px 20px; display: flex; flex-direction: column; gap: 16px; }
        .adm-field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #495366; margin-bottom: 6px; }
        .adm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .adm-submit-btn { width: 100%; padding: 11px; background: #c084fc; color: #0d1117; border: none; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .adm-submit-btn:hover:not(:disabled) { background: #d09cfa; transform: translateY(-1px); }
        .adm-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-error { background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.2); border-radius: 8px; padding: 10px 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #ff4444; }
        .adm-spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0d1117; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .prob-search { width: 100%; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; fontFamily: "'JetBrains Mono', monospace"; fontSize: 12px; padding: '8px 12px 8px 36px'; outline: none; transition: border-color 0.15s; }
        .prob-search:focus { border-color: #c084fc; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #161b22; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        @media (max-width: 700px) { .adm-grid { grid-template-columns: 1fr; } .adm-field-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="adm-root">
        <div className="adm-topbar">
          <div className="adm-logo-icon">⌨</div>
          <span className="adm-logo-text">CodeMaster</span>
          <div className="adm-topbar-sep" />
          <span className="adm-topbar-crumb">
            <NavLink to="/admin" style={{ color: '#8b949e', textDecoration: 'none' }}>Admin</NavLink>
            {' / '}<span>Create Contest</span>
          </span>
        </div>

        <div className="adm-main">
          <span className="adm-tag">Contest</span>
          <h1 className="adm-h1">Create New Contest</h1>
          <p className="adm-sub">Schedule a timed contest, add problems, and publish it for participants.</p>

          <div className="adm-divider" />

          <div className="adm-grid">

            {/* ── LEFT: FORM ── */}
            <div className="adm-card">
              <div className="adm-card-hdr">
                <div className="adm-card-hdr-dot" style={{ background: '#c084fc' }} />
                <span className="adm-card-hdr-title">Contest Details</span>
              </div>
              <div className="adm-card-body">

                {/* Title */}
                <div>
                  <div className="adm-field-label">Contest Title *</div>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. CodeMaster Round 1"
                    style={inputStyle('title')}
                    onFocus={() => setFocused('title')} onBlur={() => setFocused('')}
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="adm-field-label">Description *</div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the contest, rules, and prizes..."
                    rows={4}
                    style={inputStyle('description')}
                    onFocus={() => setFocused('description')} onBlur={() => setFocused('')}
                  />
                </div>

                {/* Start + End time */}
                <div className="adm-field-row">
                  <div>
                    <div className="adm-field-label">Start Time *</div>
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      style={{ ...inputStyle('startTime'), colorScheme: 'dark' }}
                      onFocus={() => setFocused('startTime')} onBlur={() => setFocused('')}
                    />
                  </div>
                  <div>
                    <div className="adm-field-label">End Time *</div>
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      style={{ ...inputStyle('endTime'), colorScheme: 'dark' }}
                      onFocus={() => setFocused('endTime')} onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <div className="adm-field-label">Visibility</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: true, label: 'Public' }, { val: false, label: 'Private' }].map(({ val, label }) => (
                      <button
                        key={label}
                        onClick={() => setForm((f) => ({ ...f, isPublic: val }))}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                          transition: 'all 0.15s',
                          background: form.isPublic === val ? '#1a0d2e' : 'transparent',
                          color: form.isPublic === val ? '#c084fc' : '#495366',
                          border: `1px solid ${form.isPublic === val ? '#2e1a4a' : '#21262d'}`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.isPublic === false && (
                    <p style={{ marginTop: 6, fontSize: 10.5, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <KeyRound size={11} />
                      A one-time invite code will be generated after you create this contest.
                    </p>
                  )}
                </div>

                {/* Selected problems count */}
                <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b949e' }}>Problems selected</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: selectedProblems.length > 0 ? '#c084fc' : '#495366' }}>
                    {selectedProblems.length}
                  </span>
                </div>

                {error && <div className="adm-error">⚠ {error}</div>}

                <button className="adm-submit-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><span className="adm-spinner" /> Creating…</> : <>🏆 Create Contest</>}
                </button>
              </div>
            </div>

            {/* ── RIGHT: PROBLEM PICKER ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Selected problems */}
              {selectedProblems.length > 0 && (
                <div className="adm-card">
                  <div className="adm-card-hdr">
                    <div className="adm-card-hdr-dot" style={{ background: '#00b86b' }} />
                    <span className="adm-card-hdr-title">Selected ({selectedProblems.length})</span>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {selectedProblems.map((p) => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 7 }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#e6edf3', fontWeight: 600 }}>{p.title}</span>
                          <span style={{ marginLeft: 8, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: diffColor(p.difficulty), textTransform: 'uppercase' }}>{p.difficulty}</span>
                        </div>
                        <button onClick={() => removeProblem(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#495366', display: 'flex', alignItems: 'center' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem search & picker */}
              <div className="adm-card">
                <div className="adm-card-hdr">
                  <div className="adm-card-hdr-dot" style={{ background: '#ffa116' }} />
                  <span className="adm-card-hdr-title">Add Problems</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#495366' }} />
                    <input
                      value={problemSearch}
                      onChange={(e) => setProblemSearch(e.target.value)}
                      placeholder="Search problems..."
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: '8px 12px 8px 32px', outline: 'none' }}
                    />
                  </div>

                  {/* list */}
                  <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {filteredProblems.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: '#495366', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                        {allProblems.length === 0 ? 'Loading problems…' : 'No problems found'}
                      </div>
                    ) : filteredProblems.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => addProblem(p)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 7, cursor: 'pointer', transition: 'border-color 0.12s' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c084fc'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#21262d'}
                      >
                        <div>
                          <span style={{ fontSize: 12, color: '#e6edf3', fontWeight: 500 }}>{p.title}</span>
                          <span style={{ marginLeft: 8, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: diffColor(p.difficulty), textTransform: 'uppercase' }}>{p.difficulty}</span>
                        </div>
                        <Plus size={13} style={{ color: '#495366', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}