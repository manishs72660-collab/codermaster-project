import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { CheckCircle2, XCircle, Clock, Building2, Mail, User, Inbox } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

function CollegeRequests() {
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const load = async (status) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/collage/requests?status=${status}`);
      setRequests(res.data.requests);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const approve = async (id) => {
    setBusyId(id);
    try {
      await axiosClient.post(`/collage/requests/${id}/approve`);
      showToast('College approved — confirmation email sent.');
      await load(tab);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    setBusyId(rejectingId);
    try {
      await axiosClient.post(`/collage/requests/${rejectingId}/reject`, { reason: rejectReason });
      showToast('Request rejected.');
      setRejectingId(null);
      await load(tab);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="cr-root">
      <style>{styles}</style>

      <div className="cr-topbar">
        <div className="cr-logo-icon">⌨</div>
        <span className="cr-logo-text"><NavLink to="/">CodeMaster</NavLink></span>
        <div className="cr-topbar-sep" />
        <span className="cr-topbar-crumb">
          <NavLink to="/admin">Admin /</NavLink> <span>College Requests</span>
        </span>
      </div>

      <div className="cr-main">
        <div className="cr-header">
          <span className="cr-tag"><Inbox size={12} /> Review Queue</span>
          <h1 className="cr-h1">College Requests</h1>
          <p className="cr-sub">
            Self-service registration requests submitted from the public signup page. Approve to create the
            college + admin account, reject to decline.
          </p>
        </div>

        <div className="cr-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`cr-tab ${tab === t.id ? 'cr-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="cr-error">{error}</div>}

        {loading ? (
          <div className="cr-empty">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="cr-empty">
            <Inbox size={24} strokeWidth={1.5} />
            <p>No {tab} requests.</p>
          </div>
        ) : (
          <div className="cr-list">
            {requests.map((r) => (
              <div key={r._id} className="cr-card">
                <div className="cr-card-top">
                  <div className="cr-card-title-row">
                    <Building2 size={15} className="cr-icon-blue" />
                    <span className="cr-card-title">{r.Collage_name}</span>
                    <span className="cr-code">{r.collegeCode}</span>
                  </div>
                  <span className={`cr-status cr-status-${r.status}`}>
                    {r.status === 'pending' && <Clock size={11} />}
                    {r.status === 'approved' && <CheckCircle2 size={11} />}
                    {r.status === 'rejected' && <XCircle size={11} />}
                    {r.status}
                  </span>
                </div>

                <div className="cr-meta">
                  <span className="cr-meta-item">
                    <User size={12} /> {r.adminFirstName} {r.adminLastName || ''}
                  </span>
                  <span className="cr-meta-item">
                    <Mail size={12} /> {r.adminEmail}
                  </span>
                  <span className="cr-meta-item cr-meta-date">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {r.message && <p className="cr-message">{r.message}</p>}

                {r.status === 'rejected' && r.rejectionReason && (
                  <p className="cr-rejection-reason">Reason: {r.rejectionReason}</p>
                )}

                {r.status === 'pending' && (
                  <>
                    {rejectingId === r._id ? (
                      <div className="cr-reject-box">
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="cr-reject-input"
                          autoFocus
                        />
                        <div className="cr-actions">
                          <button
                            className="cr-btn cr-btn-reject"
                            disabled={busyId === r._id}
                            onClick={confirmReject}
                          >
                            {busyId === r._id ? 'Rejecting...' : 'Confirm reject'}
                          </button>
                          <button className="cr-btn cr-btn-ghost" onClick={() => setRejectingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="cr-actions">
                        <button
                          className="cr-btn cr-btn-approve"
                          disabled={busyId === r._id}
                          onClick={() => approve(r._id)}
                        >
                          <CheckCircle2 size={13} />
                          {busyId === r._id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          className="cr-btn cr-btn-reject-outline"
                          disabled={busyId === r._id}
                          onClick={() => openReject(r._id)}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={`cr-toast cr-toast-${toast.kind}`}>{toast.msg}</div>}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cr-root { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', -apple-system, sans-serif; }
  .cr-topbar { background: #161b22; border-bottom: 1px solid #21262d; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 8px; position: sticky; top: 0; z-index: 10; }
  .cr-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #ffa116, #ff6b00); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #0d1117; flex-shrink: 0; }
  .cr-logo-text { font-weight: 700; font-size: 15px; color: #e6edf3; }
  .cr-logo-text a { color: inherit; text-decoration: none; }
  .cr-topbar-sep { width: 1px; height: 20px; background: #21262d; margin: 0 8px; }
  .cr-topbar-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
  .cr-topbar-crumb a { color: inherit; text-decoration: none; }
  .cr-topbar-crumb span { color: #f59e0b; }

  .cr-main { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
  .cr-tag { display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; background: #2a1f0a; border: 1px solid #3a2e0f; border-radius: 4px; padding: 2px 8px; }
  .cr-h1 { font-size: 24px; font-weight: 700; margin-top: 10px; letter-spacing: -0.5px; }
  .cr-sub { font-size: 13px; color: #8b949e; margin-top: 6px; line-height: 1.6; max-width: 560px; }
  .cr-error { background: #2a0f0f; border: 1px solid #3a1a1a; color: #ff8080; font-size: 12px; padding: 10px 14px; border-radius: 6px; margin-top: 20px; }

  .cr-tabs { display: flex; gap: 4px; margin-top: 24px; background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 4px; width: fit-content; }
  .cr-tab { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #8b949e; background: transparent; border: none; border-radius: 6px; padding: 7px 16px; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .cr-tab:hover { color: #e6edf3; }
  .cr-tab-active { background: #21262d; color: #e6edf3; }

  .cr-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #495366; padding: 60px 0; font-size: 13px; }

  .cr-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
  .cr-card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 18px 20px; }

  .cr-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .cr-card-title-row { display: flex; align-items: center; gap: 8px; }
  .cr-icon-blue { color: #4493f8; flex-shrink: 0; }
  .cr-card-title { font-size: 14.5px; font-weight: 700; letter-spacing: -0.2px; }
  .cr-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; background: #0d1117; border: 1px solid #21262d; border-radius: 4px; padding: 2px 7px; }

  .cr-status { display: inline-flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 4px; padding: 3px 8px; }
  .cr-status-pending { color: #ffa116; background: #2a1f0a; border: 1px solid #3a2e0f; }
  .cr-status-approved { color: #6fe0a3; background: #0f2a1a; border: 1px solid #1a3a2a; }
  .cr-status-rejected { color: #ff8080; background: #2a0f0f; border: 1px solid #3a1a1a; }

  .cr-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 10px; }
  .cr-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: #8b949e; }
  .cr-meta-date { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #495366; }

  .cr-message { font-size: 13px; color: #c9d1d9; line-height: 1.6; margin-top: 12px; background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 10px 12px; }
  .cr-rejection-reason { font-size: 12.5px; color: #ff8080; margin-top: 10px; }

  .cr-actions { display: flex; gap: 8px; margin-top: 14px; }
  .cr-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 8px 14px; cursor: pointer; border: 1px solid transparent; transition: opacity 0.15s; }
  .cr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cr-btn-approve { background: #238636; color: #fff; }
  .cr-btn-approve:hover:not(:disabled) { background: #2ea043; }
  .cr-btn-reject-outline { background: transparent; color: #ff8080; border-color: #3a1a1a; }
  .cr-btn-reject-outline:hover:not(:disabled) { background: #2a0f0f; }
  .cr-btn-reject { background: #da3633; color: #fff; }
  .cr-btn-reject:hover:not(:disabled) { background: #f85149; }
  .cr-btn-ghost { background: transparent; color: #8b949e; border-color: #21262d; }
  .cr-btn-ghost:hover { color: #e6edf3; }

  .cr-reject-box { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
  .cr-reject-input { background: #0d1117; border: 1px solid #21262d; border-radius: 6px; padding: 9px 12px; color: #e6edf3; font-size: 13px; outline: none; }
  .cr-reject-input:focus { border-color: #f85149; }

  .cr-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); font-size: 13px; font-weight: 600; padding: 12px 20px; border-radius: 8px; z-index: 50; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  .cr-toast-success { background: #0f2a1a; border: 1px solid #1a3a2a; color: #6fe0a3; }
  .cr-toast-error { background: #2a0f0f; border: 1px solid #3a1a1a; color: #ff8080; }

  @media (max-width: 560px) {
    .cr-meta-date { margin-left: 0; }
  }
`;

export default CollegeRequests;