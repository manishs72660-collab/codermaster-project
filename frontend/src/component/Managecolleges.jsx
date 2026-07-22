import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Search, Trash2, ExternalLink, X, Building2, Plus, Pencil } from 'lucide-react';

// Swap for your real axios wrapper if the path differs.
import axiosClient from '../utils/axiosClient';

function ManageColleges() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editing, setEditing] = useState(null); // college being edited, or null
  const [editForm, setEditForm] = useState({ Collage_name: '', plan: '', isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (college) => {
    setEditing(college);
    setEditForm({
      Collage_name: college.Collage_name || '',
      plan: college.plan || 'Free',
      isActive: college.isActive !== false,
    });
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await axiosClient.patch(`/collage/${editing._id}`, editForm);
      setEditing(null);
      loadColleges();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update college');
    } finally {
      setSavingEdit(false);
    }
  };

  const loadColleges = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/collage');
      setColleges(res.data.colleges);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadColleges(); }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await axiosClient.delete(`/collage/${confirmDelete._id}`);
      setConfirmDelete(null);
      loadColleges();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete college');
      setConfirmDelete(null);
    }
  };

  const filtered = colleges.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.Collage_name?.toLowerCase().includes(q) ||
      c.collegeCode?.toLowerCase().includes(q) ||
      c.adminEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mc-root">
      <style>{styles}</style>

      <div className="mc-topbar">
        <div className="mc-logo-icon">⌨</div>
        <span className="mc-logo-text"><NavLink to="/">CodeMaster</NavLink></span>
        <div className="mc-topbar-sep" />
        <span className="mc-topbar-crumb"><NavLink to="/admin">Admin /</NavLink> <span>Colleges</span></span>
      </div>

      <div className="mc-main">
        <div className="mc-header">
          <span className="mc-tag">Platform Admin</span>
          <h1 className="mc-h1">Registered Colleges</h1>
          <p className="mc-sub">All colleges on the platform and their admin accounts.</p>
        </div>

        {error && <div className="mc-error">{error}</div>}

        <div className="mc-toolbar">
          <div className="mc-search">
            <Search size={14} />
            <input placeholder="Search by name, code, or admin email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="mc-count">{filtered.length} college{filtered.length === 1 ? '' : 's'}</span>
          <button className="mc-btn-register" onClick={() => navigate('/admin/colleges/register')}>
            <Plus size={14} /> Register College
          </button>
        </div>

        <div className="mc-grid">
          {loading ? (
            <div className="mc-empty">Loading colleges...</div>
          ) : filtered.length === 0 ? (
            <div className="mc-empty">No colleges found.</div>
          ) : (
            filtered.map((c) => (
              <div className="mc-card" key={c._id}>
                <div className="mc-card-top">
                  <div className="mc-icon-box"><Building2 size={17} /></div>
                  <span className={`mc-badge ${c.isActive === false ? 'mc-badge-inactive' : 'mc-badge-active'}`}>
                    {c.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </div>
                <div className="mc-card-title">{c.Collage_name}</div>
                <div className="mc-card-code">{c.collegeCode}</div>

                <div className="mc-card-row">
                  <span className="mc-card-label">Admin</span>
                  <span>{c.adminId ? `${c.adminId.firstName} ${c.adminId.lastName || ''}` : '—'}</span>
                </div>
                <div className="mc-card-row">
                  <span className="mc-card-label">Email</span>
                  <span className="mc-mono">{c.adminId?.emailId || c.adminEmail}</span>
                </div>
                <div className="mc-card-row">
                  <span className="mc-card-label">Plan</span>
                  <span>{c.plan || 'Free'}</span>
                </div>

                <div className="mc-card-actions">
                  <button className="mc-btn-view" onClick={() => navigate(`/admin/colleges/${c._id}`)}>
                    View Dashboard <ExternalLink size={12} />
                  </button>
                  <button className="mc-icon-btn mc-icon-btn-edit" onClick={() => openEdit(c)} title="Edit college">
                    <Pencil size={14} />
                  </button>
                  <button className="mc-icon-btn" onClick={() => setConfirmDelete(c)} title="Delete college">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editing && (
        <div className="mc-modal-overlay" onClick={() => setEditing(null)}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-top">
              <span>Edit college</span>
              <X size={16} onClick={() => setEditing(null)} style={{ cursor: 'pointer' }} />
            </div>

            <label className="mc-edit-field">
              <span>College Name</span>
              <input
                value={editForm.Collage_name}
                onChange={(e) => setEditForm((f) => ({ ...f, Collage_name: e.target.value }))}
              />
            </label>

            <label className="mc-edit-field">
              <span>Plan</span>
              <select
                value={editForm.plan}
                onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
              >
                <option value="Free">Free</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </label>

            <label className="mc-edit-checkbox">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span>College is active</span>
            </label>

            <div className="mc-modal-actions">
              <button className="mc-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="mc-btn-view" style={{ flex: 'none' }} onClick={handleEditSave} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="mc-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-top">
              <span>Delete college</span>
              <X size={16} onClick={() => setConfirmDelete(null)} style={{ cursor: 'pointer' }} />
            </div>
            <p>
              Delete <strong>{confirmDelete.Collage_name}</strong> ({confirmDelete.collegeCode})?
              This permanently removes every student, their submissions, and the admin account. This can't be undone.
            </p>
            <div className="mc-modal-actions">
              <button className="mc-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="mc-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mc-root { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', -apple-system, sans-serif; }
  .mc-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 8px; position: sticky; top: 0; z-index: 10; }
  .mc-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #ffa116, #ff6b00); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117; flex-shrink: 0; }
  .mc-logo-text { font-weight: 700; font-size: 15px; color: #e6edf3; }
  .mc-logo-text a { color: inherit; text-decoration: none; }
  .mc-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
  .mc-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
  .mc-topbar-crumb a { color: inherit; text-decoration: none; }
  .mc-topbar-crumb span { color: #ffa116; }

  .mc-main { max-width: 1080px; margin: 0 auto; padding: 40px 24px 80px; }
  .mc-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #ffa116; background: #2a1f0a; border: 1px solid #3a2e0f; border-radius: 4px; padding: 2px 8px; }
  .mc-h1 { font-size: 24px; font-weight: 700; margin-top: 10px; letter-spacing: -0.5px; }
  .mc-sub { font-size: 13px; color: #8b949e; margin-top: 6px; }
  .mc-error { background: #2a0f0f; border: 1px solid #3a1a1a; color: #ff8080; font-size: 12px; padding: 10px 14px; border-radius: 6px; margin-top: 16px; }

  .mc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 24px 0 16px; flex-wrap: wrap; }
  .mc-search { display: flex; align-items: center; gap: 8px; background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 8px 12px; flex: 1; min-width: 220px; color: #8b949e; }
  .mc-search input { background: transparent; border: none; outline: none; color: #e6edf3; font-size: 13px; width: 100%; }
  .mc-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; white-space: nowrap; }

  .mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .mc-empty { color: #8b949e; padding: 40px; text-align: center; grid-column: 1/-1; }

  .mc-card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; }
  .mc-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .mc-icon-box { width: 34px; height: 34px; border-radius: 8px; background: #0d1117; border: 1px solid #21262d; display: flex; align-items: center; justify-content: center; color: #4493f8; }
  .mc-badge { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px; padding: 3px 8px; }
  .mc-badge-active { color: #00b86b; background: #0f2a1a; border: 1px solid #1a3a2a; }
  .mc-badge-inactive { color: #ff4444; background: #2a0f0f; border: 1px solid #3a1a1a; }
  .mc-card-title { font-size: 15px; font-weight: 600; }
  .mc-card-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; margin: 2px 0 14px; }
  .mc-card-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 5px 0; border-top: 1px solid #1a1f27; }
  .mc-card-label { color: #495366; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; align-self: center; }
  .mc-mono { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #8b949e; }
  .mc-card-actions { display: flex; gap: 8px; margin-top: 16px; }
  .mc-btn-view { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #0d1a2e; border: 1px solid #1c2a3a; color: #4493f8; border-radius: 6px; padding: 8px; font-size: 12px; font-weight: 500; cursor: pointer; }
  .mc-icon-btn { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 8px; color: #ff8080; cursor: pointer; }
  .mc-icon-btn:hover { border-color: #3a1a1a; background: #2a0f0f; }
  .mc-icon-btn-edit { color: #ffa116; }
  .mc-icon-btn-edit:hover { border-color: #3a2e0f; background: #2a1f0a; }

  .mc-btn-register { display: inline-flex; align-items: center; gap: 6px; background: #4493f8; border: none; color: #0d1117; font-weight: 700; font-size: 12.5px; border-radius: 8px; padding: 9px 16px; cursor: pointer; white-space: nowrap; }

  .mc-edit-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #8b949e; margin-bottom: 14px; }
  .mc-edit-field input, .mc-edit-field select { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 8px 10px; color: #e6edf3; font-size: 13px; outline: none; }
  .mc-edit-field input:focus, .mc-edit-field select:focus { border-color: #4493f8; }
  .mc-edit-checkbox { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #e6edf3; margin-bottom: 4px; }

  .mc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
  .mc-modal { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 20px; width: 360px; }
  .mc-modal-top { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 14px; margin-bottom: 12px; }
  .mc-modal p { font-size: 12.5px; color: #8b949e; line-height: 1.6; }
  .mc-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
  .mc-btn-secondary { background: #0d1117; border: 1px solid #21262d; color: #e6edf3; border-radius: 6px; padding: 7px 14px; font-size: 12px; cursor: pointer; }
  .mc-btn-danger { background: #ff4444; border: 1px solid #ff4444; color: #0d1117; font-weight: 600; border-radius: 6px; padding: 7px 14px; font-size: 12px; cursor: pointer; }
`;

export default ManageColleges;