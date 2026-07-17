import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Trash2, Edit, Trophy, Clock, Users, X, Check, Plus, Search, Lock } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const toLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const diffColor = (d) => {
  if (d === 'easy')   return '#00b86b';
  if (d === 'medium') return '#ffa116';
  if (d === 'hard')   return '#ff4444';
  return '#8b949e';
};

export default function AdminManageContests() {
  const navigate = useNavigate();

  const [contests, setContests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [allProblems, setAllProblems]   = useState([]);
  const [editProblems, setEditProblems] = useState([]);
  const [probSearch, setProbSearch]     = useState('');
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(null);
  const [focused, setFocused]           = useState('');
  const [error, setError]               = useState('');

  useEffect(() => {
    fetchContests();
    axiosClient.get('/problem/')
      .then(({ data }) => setAllProblems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // NOTE: this requires the backend fix to getAllContests — it must return
  // BOTH public and private contests (previously it filtered to
  // isPublic: true only, which silently hid every private contest from
  // this page, making them impossible to edit or delete).
  const fetchContests = () => {
    setLoading(true);
    axiosClient.get('/contest/all')
      .then(({ data }) => setContests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /* open edit mode */
  const startEdit = (contest) => {
    setEditingId(contest._id);
    setEditForm({
      title: contest.title,
      description: contest.description,
      startTime: toLocalDatetime(contest.startTime),
      endTime: toLocalDatetime(contest.endTime),
      isPublic: contest.isPublic,
    });
    // populate selected problems from contest
    const ids = contest.problems || [];
    const selected = allProblems.filter((p) => ids.includes(p._id) || ids.find((id) => id === p._id || id?._id === p._id));
    setEditProblems(selected.length > 0 ? selected : ids.map((id) => ({ _id: typeof id === 'string' ? id : id._id, title: id?.title || 'Problem', difficulty: id?.difficulty || '' })));
    setError('');
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); setEditProblems([]); setError(''); };

  /* save update */
  const saveEdit = async (id) => {
    setError('');
    if (!editForm.title || !editForm.description || !editForm.startTime || !editForm.endTime) {
      setError('All fields required.'); return;
    }
    if (new Date(editForm.startTime) >= new Date(editForm.endTime)) {
      setError('Start time must be before end time.'); return;
    }
    setSaving(true);
    try {
      await axiosClient.put(`/contest/${id}/update`, {
        ...editForm,
        problems: editProblems.map((p) => p._id),
      });
      cancelEdit();
      fetchContests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const deleteContest = async (id) => {
    if (!window.confirm('Delete this contest? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await axiosClient.delete(`/contest/${id}/delete`);
      setContests((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const filteredForEdit = allProblems.filter(
    (p) => p.title?.toLowerCase().includes(probSearch.toLowerCase()) &&
           !editProblems.find((ep) => ep._id === p._id)
  );

  const inputStyle = (name) => ({
    width: '100%',
    background: focused === name ? '#1c2130' : '#0d1117',
    border: `1px solid ${focused === name ? '#c084fc' : '#21262d'}`,
    borderRadius: 7,
    color: '#e6edf3',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    padding: '8px 12px',
    outline: 'none',
    transition: 'all 0.15s',
    resize: 'none',
  });

  const statusLabel = (c) => {
    const now = new Date();
    if (now < new Date(c.startTime)) return { text: 'Upcoming', color: '#ffa116', bg: '#2a1f0a', border: '#3a2e0f' };
    if (now <= new Date(c.endTime))  return { text: 'Live',     color: '#00b86b', bg: '#0f2a1a', border: '#1a3a2a' };
    return                                  { text: 'Ended',    color: '#495366', bg: '#161b22', border: '#21262d' };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-root { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', -apple-system, sans-serif; }
        .adm-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 8px; position: sticky; top: 0; z-index: 10; }
        .adm-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #ffa116, #ff6b00); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117; }
        .adm-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .adm-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
        .adm-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .adm-topbar-crumb span { color: #c084fc; }
        .adm-main { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
        .adm-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #c084fc; background: #1a0d2e; border: 1px solid #2e1a4a; border-radius: 4px; padding: 2px 8px; display: inline-block; margin-bottom: 12px; }
        .adm-h1 { font-size: 26px; font-weight: 700; color: #e6edf3; letter-spacing: -0.5px; margin-bottom: 6px; }
        .adm-sub { font-size: 13px; color: #8b949e; line-height: 1.7; }
        .adm-divider { height: 1px; background: #21262d; margin: 32px 0; }
        .adm-create-btn { display: inline-flex; align-items: center; gap: 6px; background: #c084fc; color: #0d1117; border: none; border-radius: 8px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 8px 16px; transition: all 0.15s; }
        .adm-create-btn:hover { background: #d09cfa; transform: translateY(-1px); }
        .adm-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0d1117; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #161b22; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
      `}</style>

      <div className="adm-root">
        <div className="adm-topbar">
          <div className="adm-logo-icon">⌨</div>
          <span className="adm-logo-text">CodeMaster</span>
          <div className="adm-topbar-sep" />
          <span className="adm-topbar-crumb">
            <NavLink to="/admin" style={{ color: '#8b949e', textDecoration: 'none' }}>Admin</NavLink>
            {' / '}<span>Manage Contests</span>
          </span>
        </div>

        <div className="adm-main">
          <span className="adm-tag">Contest</span>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
            <h1 className="adm-h1">Manage Contests</h1>
            <button className="adm-create-btn" onClick={() => navigate('/admin/contest/create')}>
              <Plus size={14} /> Create New
            </button>
          </div>
          <p className="adm-sub">Edit, update, or delete existing contests — public and private.</p>

          <div className="adm-divider" />

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <span className="adm-spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: '#c084fc' }} />
            </div>
          ) : contests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Trophy size={40} style={{ color: '#21262d', marginBottom: 16 }} />
              <p style={{ color: '#495366', fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>No contests yet.</p>
              <button className="adm-create-btn" style={{ marginTop: 16 }} onClick={() => navigate('/admin/contest/create')}>
                Create First Contest
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contests.map((contest) => {
                const st = statusLabel(contest);
                const isEditing = editingId === contest._id;
                const isPrivate = contest.isPublic === false;

                return (
                  <div key={contest._id} style={{ background: '#161b22', border: `1px solid ${isEditing ? '#2e1a4a' : '#21262d'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>

                    {/* ── CONTEST ROW ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                        {/* icon */}
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a0d2e', border: '1px solid #2e1a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Trophy size={18} style={{ color: '#c084fc' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contest.title}</span>
                            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>{st.text}</span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: isPrivate ? '#c084fc' : '#495366',
                              background: isPrivate ? '#1a0d2e' : '#0d1117',
                              border: `1px solid ${isPrivate ? '#2e1a4a' : '#21262d'}`,
                              borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                            }}>
                              {isPrivate && <Lock size={9} />}
                              {isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} /> {formatDate(contest.startTime)}
                            </span>
                            <span style={{ fontSize: 11, color: '#495366' }}>→</span>
                            <span style={{ fontSize: 11, color: '#8b949e' }}>{formatDate(contest.endTime)}</span>
                            <span style={{ fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Users size={11} /> {contest.totalParticipants ?? 0}
                            </span>
                            <span style={{ fontSize: 11, color: '#8b949e' }}>{contest.totalProblems ?? 0} problems</span>
                          </div>
                        </div>
                      </div>

                      {/* actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {isEditing ? (
                          <>
                            <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #21262d', borderRadius: 7, color: '#8b949e', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                              <X size={12} /> Cancel
                            </button>
                            <button onClick={() => saveEdit(contest._id)} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#c084fc', border: 'none', borderRadius: 7, color: '#0d1117', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                              {saving ? <span className="adm-spinner" /> : <Check size={12} />}
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(contest)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1a0d2e', border: '1px solid #2e1a4a', borderRadius: 7, color: '#c084fc', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#2e1a4a'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#1a0d2e'}>
                              <Edit size={12} /> Edit
                            </button>
                            <button onClick={() => deleteContest(contest._id)} disabled={deleting === contest._id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2a0f0f', border: '1px solid #3a1a1a', borderRadius: 7, color: '#ff4444', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', opacity: deleting === contest._id ? 0.5 : 1, transition: 'all 0.15s' }}
                              onMouseEnter={(e) => { if (deleting !== contest._id) e.currentTarget.style.background = '#3a1a1a'; }}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#2a0f0f'}>
                              {deleting === contest._id ? <span className="adm-spinner" style={{ borderTopColor: '#ff4444' }} /> : <Trash2 size={12} />}
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── EDIT FORM (expanded) ── */}
                    {isEditing && (
                      <div style={{ borderTop: '1px solid #21262d', padding: '20px', background: '#0d1117' }}>
                        {error && (
                          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ff4444', marginBottom: 16 }}>
                            ⚠ {error}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>

                          {/* left: form fields */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>Title</div>
                              <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                                style={inputStyle('edit-title')} onFocus={() => setFocused('edit-title')} onBlur={() => setFocused('')} />
                            </div>
                            <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>Description</div>
                              <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={3} style={inputStyle('edit-desc')} onFocus={() => setFocused('edit-desc')} onBlur={() => setFocused('')} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>Start Time</div>
                                <input type="datetime-local" value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                                  style={{ ...inputStyle('edit-start'), colorScheme: 'dark' }} onFocus={() => setFocused('edit-start')} onBlur={() => setFocused('')} />
                              </div>
                              <div>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>End Time</div>
                                <input type="datetime-local" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                                  style={{ ...inputStyle('edit-end'), colorScheme: 'dark' }} onFocus={() => setFocused('edit-end')} onBlur={() => setFocused('')} />
                              </div>
                            </div>

                            {/* Visibility toggle in edit mode too */}
                            <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>Visibility</div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {[{ val: true, label: 'Public' }, { val: false, label: 'Private' }].map(({ val, label }) => (
                                  <button
                                    key={label}
                                    onClick={() => setEditForm((f) => ({ ...f, isPublic: val }))}
                                    style={{
                                      flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
                                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
                                      transition: 'all 0.15s',
                                      background: editForm.isPublic === val ? '#1a0d2e' : 'transparent',
                                      color: editForm.isPublic === val ? '#c084fc' : '#495366',
                                      border: `1px solid ${editForm.isPublic === val ? '#2e1a4a' : '#21262d'}`,
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* right: problem picker */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 2 }}>Problems ({editProblems.length})</div>

                            {/* selected */}
                            {editProblems.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 120, overflowY: 'auto' }}>
                                {editProblems.map((p) => (
                                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#161b22', border: '1px solid #21262d', borderRadius: 7 }}>
                                    <span style={{ fontSize: 11, color: '#e6edf3' }}>{p.title}</span>
                                    <button onClick={() => setEditProblems((prev) => prev.filter((ep) => ep._id !== p._id))}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#495366' }}>
                                      <X size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* search + add */}
                            <div style={{ position: 'relative' }}>
                              <Search size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#495366' }} />
                              <input value={probSearch} onChange={(e) => setProbSearch(e.target.value)}
                                placeholder="Add problems..." style={{ ...inputStyle('prob-search'), paddingLeft: 30 }}
                                onFocus={() => setFocused('prob-search')} onBlur={() => setFocused('')} />
                            </div>
                            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {filteredForEdit.slice(0, 20).map((p) => (
                                <div key={p._id} onClick={() => setEditProblems((prev) => [...prev, p])}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#161b22', border: '1px solid #21262d', borderRadius: 7, cursor: 'pointer', transition: 'border-color 0.12s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c084fc'}
                                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#21262d'}>
                                  <span style={{ fontSize: 11, color: '#e6edf3' }}>{p.title}</span>
                                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: diffColor(p.difficulty), textTransform: 'uppercase' }}>{p.difficulty}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}