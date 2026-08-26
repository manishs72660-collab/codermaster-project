import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import {
  Trash2, Edit, Trophy, Clock, Users, X, Check, Plus, Lock,
  Building2, Eye, ListChecks, GripVertical, CircleCheck, Code2,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import mylogo from "../assets/mylogo.png";
const MAX_QUESTIONS = 20;

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'cpp',        label: 'C++' },
  { value: 'c',          label: 'C' },
  { value: 'java',       label: 'Java' },
  { value: 'go',         label: 'Go' },
  { value: 'sql',        label: 'SQL' },
];

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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blankQuestion = () => ({
  questionText: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOption: 0,
  marks: 1,
  explanation: '',
  code: null, // { language, content } — added on demand via "Add code"
});

export default function AdminManageMcqContests() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isPlatformAdmin = user?.role === 'Admin';

  const [contests, setContests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editQuestions, setEditQuestions] = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [focused, setFocused]     = useState('');
  const [error, setError]         = useState('');

  useEffect(() => { fetchContests(); }, []);

  const fetchContests = () => {
    setLoading(true);
    axiosClient.get('/mcq-contest/all')
      .then(({ data }) => setContests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  /* open edit mode — fetch full question set (with correctOption) since
     /mcq-contest/all never sends question content */
  const startEdit = async (contest) => {
    setEditingId(contest._id);
    setError('');
    setLoadingEdit(true);
    try {
      const { data } = await axiosClient.get(`/mcq-contest/${contest._id}/edit`);
      const c = data.contest;
      setEditForm({
        title: c.title,
        description: c.description,
        startTime: toLocalDatetime(c.startTime),
        endTime: toLocalDatetime(c.endTime),
        isPublic: c.isPublic,
        durationMinutes: c.durationMinutes ?? '',
      });
      setEditQuestions(
        (c.questions || []).map((q) => ({
          questionText: q.questionText,
          options: q.options.map((o) => ({ text: o.text })),
          correctOption: q.correctOption,
          marks: q.marks ?? 1,
          explanation: q.explanation || '',
          code: q.code ? { language: q.code.language || 'javascript', content: q.code.content || '' } : null,
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load contest for editing.');
      setEditingId(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setEditForm({}); setEditQuestions([]); setError('');
  };

  const updateQuestion = (idx, patch) => {
    setEditQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const updateOption = (qIdx, oIdx, text) => {
    setEditQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = q.options.map((o, j) => (j === oIdx ? { text } : o));
      return { ...q, options };
    }));
  };
  const toggleCode = (idx) => {
    setEditQuestions((prev) => prev.map((q, i) =>
      i === idx ? { ...q, code: q.code ? null : { language: 'javascript', content: '' } } : q
    ));
  };
  const updateCode = (idx, patch) => {
    setEditQuestions((prev) => prev.map((q, i) =>
      i === idx ? { ...q, code: { ...q.code, ...patch } } : q
    ));
  };
  const addQuestion = () => {
    if (editQuestions.length >= MAX_QUESTIONS) return;
    setEditQuestions((prev) => [...prev, blankQuestion()]);
  };
  const removeQuestion = (idx) => {
    setEditQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  /* save update */
  const saveEdit = async (id) => {
    setError('');
    if (!editForm.title || !editForm.description || !editForm.startTime || !editForm.endTime) {
      setError('All fields required.'); return;
    }
    if (new Date(editForm.startTime) >= new Date(editForm.endTime)) {
      setError('Start time must be before end time.'); return;
    }
    if (editQuestions.length === 0) {
      setError('At least 1 question is required.'); return;
    }
    for (let i = 0; i < editQuestions.length; i++) {
      const q = editQuestions[i];
      if (!q.questionText.trim()) { setError(`Question ${i + 1}: text is required.`); return; }
      if (q.options.some((o) => !o.text.trim())) { setError(`Question ${i + 1}: all 4 options are required.`); return; }
      if (q.code && !q.code.content.trim()) { setError(`Question ${i + 1}: code block is empty — add code or remove it.`); return; }
    }

    setSaving(true);
    try {
      await axiosClient.put(`/mcq-contest/${id}/update`, {
        title: editForm.title,
        description: editForm.description,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        isPublic: editForm.isPublic,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : null,
        questions: editQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks,
          explanation: q.explanation,
          ...(q.code && q.code.content.trim()
            ? { code: { language: q.code.language, content: q.code.content } }
            : {}),
        })),
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
    if (!window.confirm('Delete this MCQ contest? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await axiosClient.delete(`/mcq-contest/${id}/delete`);
      setContests((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const inputStyle = (name) => ({
    width: '100%',
    background: focused === name ? '#1c2130' : '#0d1117',
    border: `1px solid ${focused === name ? '#22d3ee' : '#21262d'}`,
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
        .adm-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px 0 36px; gap: 8px; position: sticky; top: 0; z-index: 10; }
.adm-logo-img { width: 34px; height: 34px; object-fit: contain; flex-shrink: 0; }
        .adm-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
        .adm-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .adm-topbar-crumb span { color: #22d3ee; }
        .adm-main { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
        .adm-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #22d3ee; background: #0a2226; border: 1px solid #123a3f; border-radius: 4px; padding: 2px 8px; display: inline-block; margin-bottom: 12px; }
        .adm-h1 { font-size: 26px; font-weight: 700; color: #e6edf3; letter-spacing: -0.5px; margin-bottom: 6px; }
        .adm-sub { font-size: 13px; color: #8b949e; line-height: 1.7; }
        .adm-divider { height: 1px; background: #21262d; margin: 32px 0; }
        .adm-create-btn { display: inline-flex; align-items: center; gap: 6px; background: #22d3ee; color: #0d1117; border: none; border-radius: 8px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 8px 16px; transition: all 0.15s; }
        .adm-create-btn:hover { background: #55e0f5; transform: translateY(-1px); }
        .adm-spinner { width: 12px; height: 12px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0d1117; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #161b22; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
      `}</style>

      <div className="adm-root">
     <div className="adm-topbar">
  <NavLink to="/" style={{ display: 'flex', alignItems: 'center' }}>
    <img src={mylogo} alt="CodeMaster logo" className="adm-logo-img" />
  </NavLink>
  <div className="adm-topbar-sep" />
  <span className="adm-topbar-crumb">
    <NavLink to={isPlatformAdmin ? '/admin' : '/collegeadmin'} style={{ color: '#8b949e', textDecoration: 'none' }}>
      {isPlatformAdmin ? 'Admin' : 'College Admin'}
    </NavLink>
    {' / '}<span>Manage MCQ Contests</span>
  </span>
</div>

        <div className="adm-main">
          <span className="adm-tag">MCQ Contest</span>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
            <h1 className="adm-h1">Manage MCQ Contests</h1>
            <button className="adm-create-btn" onClick={() => navigate('/admin/mcq-contest/create')}>
              <Plus size={14} /> Create New
            </button>
          </div>
          <p className="adm-sub">
            {isPlatformAdmin
              ? 'Every MCQ contest across every college, plus global ones. You can edit or delete any of them.'
              : 'Your college\'s MCQ contests, plus global ones. You can edit or delete the ones you created.'}
          </p>

          <div className="adm-divider" />

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <span className="adm-spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: '#22d3ee' }} />
            </div>
          ) : contests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <ListChecks size={40} style={{ color: '#21262d', marginBottom: 16 }} />
              <p style={{ color: '#495366', fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>No MCQ contests yet.</p>
              <button className="adm-create-btn" style={{ marginTop: 16 }} onClick={() => navigate('/admin/mcq-contest/create')}>
                Create First MCQ Contest
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contests.map((contest) => {
                const st = statusLabel(contest);
                const isEditing = editingId === contest._id;
                const isPrivate = contest.isPublic === false;
                const canManage = isPlatformAdmin || contest.isOwner === true;
                const collegeName = contest.collegeId?.Collage_name;

                return (
                  <div key={contest._id} style={{ background: '#161b22', border: `1px solid ${isEditing ? '#123a3f' : '#21262d'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>

                    {/* ── CONTEST ROW ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0a2226', border: '1px solid #123a3f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ListChecks size={18} style={{ color: '#22d3ee' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contest.title}</span>
                            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>{st.text}</span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: isPrivate ? '#22d3ee' : '#495366',
                              background: isPrivate ? '#0a2226' : '#0d1117',
                              border: `1px solid ${isPrivate ? '#123a3f' : '#21262d'}`,
                              borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                            }}>
                              {isPrivate && <Lock size={9} />}
                              {isPrivate ? 'Private' : 'Public'}
                            </span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: collegeName ? '#4493f8' : '#495366',
                              background: collegeName ? '#0d1a2e' : '#0d1117',
                              border: `1px solid ${collegeName ? '#1c2a3a' : '#21262d'}`,
                              borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                            }}>
                              <Building2 size={9} />
                              {collegeName || 'Global'}
                            </span>
                            {!canManage && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: '#8b949e', background: '#161b22', border: '1px solid #21262d',
                                borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                              }}>
                                <Eye size={9} /> View only
                              </span>
                            )}
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
                            <span style={{ fontSize: 11, color: '#8b949e' }}>{contest.totalQuestions ?? 0} questions</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {!canManage ? null : isEditing ? (
                          <>
                            <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #21262d', borderRadius: 7, color: '#8b949e', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                              <X size={12} /> Cancel
                            </button>
                            <button onClick={() => saveEdit(contest._id)} disabled={saving || loadingEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#22d3ee', border: 'none', borderRadius: 7, color: '#0d1117', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                              {saving ? <span className="adm-spinner" /> : <Check size={12} />}
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(contest)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0a2226', border: '1px solid #123a3f', borderRadius: 7, color: '#22d3ee', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#123a3f'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#0a2226'}>
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
                    {isEditing && canManage && (
                      <div style={{ borderTop: '1px solid #21262d', padding: '20px', background: '#0d1117' }}>
                        {loadingEdit ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                            <span className="adm-spinner" style={{ width: 22, height: 22, borderWidth: 3, borderTopColor: '#22d3ee' }} />
                          </div>
                        ) : (
                          <>
                            {error && (
                              <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ff4444', marginBottom: 16 }}>
                                ⚠ {error}
                              </div>
                            )}

                            {/* basics */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, marginBottom: 24 }}>
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
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366', marginBottom: 6 }}>Duration (minutes, optional)</div>
                                  <input type="number" min="1" value={editForm.durationMinutes}
                                    onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                                    placeholder="No per-attempt timer"
                                    style={inputStyle('edit-duration')} onFocus={() => setFocused('edit-duration')} onBlur={() => setFocused('')} />
                                </div>
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
                                          background: editForm.isPublic === val ? '#0a2226' : 'transparent',
                                          color: editForm.isPublic === val ? '#22d3ee' : '#495366',
                                          border: `1px solid ${editForm.isPublic === val ? '#123a3f' : '#21262d'}`,
                                        }}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                  {editForm.isPublic === false && (
                                    <p style={{ fontSize: 10, color: '#495366', marginTop: 6, lineHeight: 1.5 }}>
                                      Existing join code stays the same; a new one is only minted if this contest didn't have one yet.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* questions editor */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#495366' }}>
                                Questions ({editQuestions.length}/{MAX_QUESTIONS})
                              </div>
                              <button onClick={addQuestion} disabled={editQuestions.length >= MAX_QUESTIONS}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0a2226', border: '1px solid #123a3f', borderRadius: 6, color: '#22d3ee', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 700, padding: '5px 10px', cursor: editQuestions.length >= MAX_QUESTIONS ? 'not-allowed' : 'pointer', opacity: editQuestions.length >= MAX_QUESTIONS ? 0.4 : 1 }}>
                                <Plus size={11} /> Add Question
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {editQuestions.map((q, qIdx) => (
                                <div key={qIdx} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 9, padding: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                    <GripVertical size={14} style={{ color: '#30363d', marginTop: 9, flexShrink: 0 }} />
                                    <textarea
                                      value={q.questionText}
                                      onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
                                      placeholder={`Question ${qIdx + 1} text`}
                                      rows={2}
                                      style={{ ...inputStyle(`q-${qIdx}-text`), flex: 1 }}
                                      onFocus={() => setFocused(`q-${qIdx}-text`)} onBlur={() => setFocused('')}
                                    />
                                    <button onClick={() => removeQuestion(qIdx)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', flexShrink: 0, padding: 6 }}>
                                      <Trash2 size={13} />
                                    </button>
                                  </div>

                                  {/* ── optional code block attached to the question ── */}
                                  <div style={{ marginLeft: 24, marginBottom: 10 }}>
                                    {q.code ? (
                                      <div style={{ background: '#0d1117', border: '1px solid #123a3f', borderRadius: 8, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0a2226', borderBottom: '1px solid #123a3f' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Code2 size={12} style={{ color: '#22d3ee' }} />
                                            <select
                                              value={q.code.language}
                                              onChange={(e) => updateCode(qIdx, { language: e.target.value })}
                                              style={{
                                                background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer',
                                                color: '#22d3ee', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
                                              }}
                                            >
                                              {CODE_LANGUAGES.map((l) => (
                                                <option key={l.value} value={l.value} style={{ background: '#0d1117', color: '#e6edf3' }}>
                                                  {l.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <button onClick={() => toggleCode(qIdx)} title="Remove code block"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#495366', padding: 2 }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#495366'}>
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <textarea
                                          value={q.code.content}
                                          onChange={(e) => updateCode(qIdx, { content: e.target.value })}
                                          placeholder={`// paste your ${q.code.language} snippet here…`}
                                          rows={6}
                                          spellCheck={false}
                                          style={{
                                            width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
                                            color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, lineHeight: 1.6,
                                            padding: '10px 12px',
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <button onClick={() => toggleCode(qIdx)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 5,
                                          background: '#0d1117', border: '1px solid #21262d', borderRadius: 6,
                                          color: '#495366', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 700,
                                          padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = '#123a3f'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#495366'; e.currentTarget.style.borderColor = '#21262d'; }}
                                      >
                                        <Code2 size={11} /> Add code
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginLeft: 24, marginBottom: 10 }}>
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} onClick={() => updateQuestion(qIdx, { correctOption: oIdx })}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 8,
                                          border: `1px solid ${q.correctOption === oIdx ? '#00b86b' : '#21262d'}`,
                                          borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
                                          background: q.correctOption === oIdx ? '#0f2a1a' : '#0d1117',
                                        }}>
                                        <CircleCheck size={13} style={{ color: q.correctOption === oIdx ? '#00b86b' : '#30363d', flexShrink: 0 }} />
                                        <input
                                          value={opt.text}
                                          onChange={(e) => { e.stopPropagation(); updateOption(qIdx, oIdx, e.target.value); }}
                                          onClick={(e) => e.stopPropagation()}
                                          placeholder={`Option ${oIdx + 1}`}
                                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <div style={{ display: 'flex', gap: 10, marginLeft: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#495366', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Marks</span>
                                      <input type="number" min="1" value={q.marks}
                                        onChange={(e) => updateQuestion(qIdx, { marks: Math.max(1, Number(e.target.value) || 1) })}
                                        style={{ width: 52, ...inputStyle(`q-${qIdx}-marks`), padding: '4px 8px' }}
                                        onFocus={() => setFocused(`q-${qIdx}-marks`)} onBlur={() => setFocused('')} />
                                    </div>
                                    <input
                                      value={q.explanation}
                                      onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                                      placeholder="Explanation shown after submission (optional)"
                                      style={{ flex: 1, ...inputStyle(`q-${qIdx}-expl`), padding: '4px 8px' }}
                                      onFocus={() => setFocused(`q-${qIdx}-expl`)} onBlur={() => setFocused('')}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
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