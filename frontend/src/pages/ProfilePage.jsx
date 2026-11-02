import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { TriangleAlert, UserX } from 'lucide-react';
import { fetchUserProfile, fetchHeatmap, fetchSkills, fetchRecentSubmissions } from '../profileSlice';
import ProfileHeader from '../component/profile/ProfileHeader';
import StatsCards from '../component/profile/StatsCards';
import BatchesShowcase from '../component/profile/Batchesshowcase';
import SubmissionHeatmap from '../component/profile/SubmissionHeatmap';
import SkillsBreakdown from '../component/profile/SkillsBreakdown';
import RecentSubmissions from '../component/profile/RecentSubmissions';
import Navbar from "../component/navbar"
import Skeleton from '../component/Skeleton';

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
      <div aria-busy="true" className="noise hero-grid relative min-h-screen bg-[#050505] text-[#e5e5e5]">
        <Navbar />
        <div className="relative z-10 mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-64 max-w-full rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid gap-5 lg:grid-cols-5">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl lg:col-span-3" />
          </div>
        </div>
      </div>
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