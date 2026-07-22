import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { Search, ShieldCheck, X, Code2, Trophy, ExternalLink } from 'lucide-react';

// Swap this for your project's real axios wrapper if the path differs.
import axiosClient from '../utils/axiosClient';

function CollegeAdminDashboard() {
  const { collegeId: collegeIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const collegeId = collegeIdParam || user?.collegeId;

  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/collage/${collegeId}/students`, {
        params: { page, limit: 20, search: search || undefined },
      });
      setStudents(res.data.students);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [collegeId, page, search]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handlePromote = async () => {
    if (!confirmPromote) return;
    setPromoting(true);
    try {
      const res = await axiosClient.patch(`/collage/${collegeId}/students/${confirmPromote._id}/make-admin`);
      setNotice(res.data.message);
      setConfirmPromote(null);
      loadStudents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to promote student');
      setConfirmPromote(null);
    } finally {
      setPromoting(false);
    }
  };

  if (!collegeId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] font-body text-white/40">
        No college is associated with this account.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-body text-[#e5e5e5] antialiased">
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500">
            <Code2 className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[15px] font-800 italic tracking-tight text-white">CodeMaster</span>
        </NavLink>
        <div className="h-5 w-px bg-white/10" />
        <span className="font-mono text-[11px] text-white/30">
          dashboard / <span className="text-orange-400">college-admin</span>
        </span>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <h1 className="font-display text-2xl font-800 tracking-tight text-white">
            Students
          </h1>
          <button
            onClick={() => navigate('/admin/contest/create')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-3.5 py-2 text-xs font-medium text-violet-300 transition-colors hover:border-violet-500/45 hover:bg-violet-500/15"
          >
            <Trophy className="h-3.5 w-3.5" /> Create Contest
          </button>
        </motion.div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 font-mono text-xs text-rose-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3.5 py-2.5 font-mono text-xs text-emerald-300">
            {notice}
          </div>
        )}

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-black/20 py-2 pl-8 pr-3 font-mono text-xs text-white/90 placeholder:text-white/15 focus:border-orange-500/40 focus:outline-none"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/25">Name</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/25">Email</th>
                <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/25">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center font-mono text-xs text-white/20">loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center font-mono text-xs text-white/20">no students found</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="border-b border-white/[0.04] last:border-b-0">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/profile/${s._id}`)}
                        className="inline-flex items-center gap-1.5 font-medium text-orange-300 hover:underline"
                      >
                        {s.firstName} {s.lastName || ''} <ExternalLink className="h-3 w-3 opacity-60" />
                      </button>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-white/40">{s.emailId}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setConfirmPromote(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/15"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Make Admin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 font-mono text-xs text-white/30">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {confirmPromote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setConfirmPromote(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[340px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <span className="font-display text-sm font-700 text-white">Make College Admin</span>
              <button onClick={() => setConfirmPromote(null)} className="text-white/30 hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-relaxed text-white/50">
                Give <span className="font-semibold text-white">{confirmPromote.firstName} {confirmPromote.lastName}</span>{' '}
                ({confirmPromote.emailId}) College Admin access?
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
              <button
                onClick={() => setConfirmPromote(null)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
              >
                {promoting ? 'Promoting...' : 'Make Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollegeAdminDashboard;