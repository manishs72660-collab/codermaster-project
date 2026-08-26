import { useEffect, useState, useCallback } from 'react';
import { useParams, NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { Trophy, Medal, Code2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import mylogo from "../assets/mylogo.png";
// Swap this for your project's real axios wrapper if the path differs.
import axiosClient from '../utils/axiosClient';
import { fetchUserProfile } from '../profileSlice';

// Gold / silver / bronze treatment for the top 3, plain numbered chip
// after that. Returns everything the row needs: an icon (or null), the
// label shown in a tooltip-ish way, and the color classes for the badge.
const medalStyle = (rank) => {
  if (rank === 1) return { icon: Trophy, label: 'Gold',   text: 'text-amber-300',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  glow: 'shadow-[0_0_12px_rgba(252,211,77,0.35)]' };
  if (rank === 2) return { icon: Medal,  label: 'Silver', text: 'text-slate-200',  bg: 'bg-slate-400/15',  border: 'border-slate-400/40',  glow: 'shadow-[0_0_12px_rgba(203,213,225,0.25)]' };
  if (rank === 3) return { icon: Medal,  label: 'Bronze', text: 'text-orange-400', bg: 'bg-orange-600/15', border: 'border-orange-600/40', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]' };
  return { icon: null, label: null, text: 'text-white/40', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', glow: '' };
};

function CollegeLeaderboard() {
  // :collegeId is present when an Admin drills in via /admin/colleges/:collegeId/leaderboard.
  // When a college member hits /collegeadmin/leaderboard (no param), we need
  // their own collegeId. getUserProfile confirms the profile response
  // includes college.id (not just display fields), so that's the reliable
  // source - matching what Navbar.jsx already does to decide whether to
  // show the link in the first place.
  const { collegeId: collegeIdParam } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { data: profileData } = useSelector((state) => state.profile);

  useEffect(() => {
    if (!user?._id || profileData) return;
    dispatch(fetchUserProfile(user._id));
  }, [dispatch, user, profileData]);

  const collegeId = collegeIdParam || user?.collegeId || profileData?.college?.id;

  const [leaderboard, setLeaderboard] = useState([]);
  const [college, setCollege] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/collage/${collegeId}/leaderboard`, {
        params: { page, limit: 20 },
      });
      setLeaderboard(res.data.leaderboard);
      setCollege(res.data.college);
      setTotalPages(res.data.totalPages);
      setTotalStudents(res.data.totalStudents);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [collegeId, page]);

  useEffect(() => { load(); }, [load]);

  // Still resolving profile (collegeId not known yet) - avoid flashing the
  // "no college" message before fetchUserProfile has had a chance to return.
  if (!collegeId && !collegeIdParam && !profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] font-body text-white/40">
        Loading...
      </div>
    );
  }

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
  <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center">
    <img
      src={mylogo}
      alt="CodeMaster logo"
      className="w-full h-full object-contain"
    />
  </div>
  <span className="font-display text-[15px] font-800 italic tracking-tight text-white">CodeMaster</span>
</NavLink>
        <div className="h-5 w-px bg-white/10" />
        <span className="font-mono text-[11px] text-white/30">
          dashboard / <span className="text-amber-400">leaderboard</span>
        </span>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-1 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h1 className="font-display text-2xl font-800 tracking-tight text-white">
              {college ? college.name : 'College'} Leaderboard
            </h1>
          </div>
          {college && (
            <p className="font-mono text-xs text-white/30">
              {college.code} · {totalStudents} member{totalStudents === 1 ? '' : 's'} · ranked by problems solved
            </p>
          )}
        </motion.div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 font-mono text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/25">Rank</th>
                <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/25">Student</th>
                <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/25">Solved</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center font-mono text-xs text-white/20">loading...</td></tr>
              ) : leaderboard.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center font-mono text-xs text-white/20">no members found</td></tr>
              ) : (
                leaderboard.map((entry) => {
                  const medal = medalStyle(entry.rank);
                  const MedalIcon = medal.icon;
                  return (
                    <tr key={entry.userId} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-5 py-3">
                        <span
                          title={medal.label || undefined}
                          className={`inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-lg border px-1.5 font-mono text-xs font-bold ${medal.bg} ${medal.border} ${medal.text} ${medal.glow}`}
                        >
                          {MedalIcon ? <MedalIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> : entry.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white/85">{entry.name}</span>
                          {medal.label && (
                            <span className={`text-[9px] font-black uppercase tracking-wide ${medal.text}`}>
                              {medal.label}
                            </span>
                          )}
                          {entry.role === 'CollageAdmin' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-sky-300">
                              <ShieldCheck className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-white/60">{entry.totalSolved}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 font-mono text-xs text-white/30">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollegeLeaderboard;