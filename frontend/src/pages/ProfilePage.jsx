import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { Loader2, TriangleAlert, UserX } from 'lucide-react';
import { fetchUserProfile, fetchHeatmap, fetchSkills, fetchRecentSubmissions } from '../profileSlice';
import ProfileHeader from '../component/profile/ProfileHeader';
import StatsCards from '../component/profile/StatsCards';
import BatchesShowcase from '../component/profile/BatchesShowcase';
import SubmissionHeatmap from '../component/profile/SubmissionHeatmap';
import SkillsBreakdown from '../component/profile/SkillsBreakdown';
import RecentSubmissions from '../component/profile/RecentSubmissions';
import Navbar from "../component/navbar"

const CenterState = ({ icon: Icon, tone, children }) => (
  <div className="noise hero-grid relative flex min-h-screen items-center justify-center bg-[#050505] font-body text-[#e5e5e5]">
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="glow-pulse absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.06] blur-[130px]" />
      <div className="glow-pulse absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
    </div>
    <div className={`relative z-10 flex flex-col items-center gap-3 font-mono text-sm ${tone}`}>
      <Icon className="h-5 w-5" />
      {children}
    </div>
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const { data, heatmap, skills, submissions, loading, error } = useSelector((s) => s.profile) || {};

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchUserProfile(userId));
    dispatch(fetchHeatmap({ userId, year: new Date().getFullYear() }));
    dispatch(fetchSkills(userId));
    dispatch(fetchRecentSubmissions({ userId, page: 1, limit: 10 }));
  }, [userId, dispatch]);

  if (!userId)
    return (
      <CenterState icon={UserX} tone="text-white/40">
        // no user specified
      </CenterState>
    );

  if (loading && !data)
    return (
      <CenterState icon={Loader2} tone="text-white/40">
        <Loader2 className="hidden" />
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-orange-400" />
          loading profile...
        </span>
      </CenterState>
    );

  if (error)
    return (
      <CenterState icon={TriangleAlert} tone="text-rose-400">
        // {error}
      </CenterState>
    );

  if (!data)
    return (
      <CenterState icon={UserX} tone="text-white/40">
        // profile not found
      </CenterState>
    );

  return (
    <div className="noise hero-grid relative min-h-screen bg-[#050505] font-body text-[#e5e5e5] antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="glow-pulse absolute top-[-15%] left-[-8%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.06] blur-[130px]" />
        <div className="glow-pulse absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
      </div>
    <Navbar></Navbar>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 sm:py-12"
      >
        <ProfileHeader user={data} />
        <StatsCards stats={data.stats} />
        <BatchesShowcase heatmap={heatmap} stats={data.stats} />
        <SubmissionHeatmap heatmap={heatmap} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SkillsBreakdown skills={skills} />
          </div>
          <div className="lg:col-span-3">
            <RecentSubmissions submissions={submissions} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;