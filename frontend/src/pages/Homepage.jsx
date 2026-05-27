import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  LogOut, 
  User as UserIcon,
  Code2,
  Trophy,
  LayoutGrid,
  ListFilter,
  Circle
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { fetchUserState } from '../userslice';
import { cn } from '../utils/cn';




function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
 //console.log(user); 
 const {stats}=useSelector((state)=>state.userState);
 console.log(stats);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  //console.log(solvedProblems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });
  const[state,setstate]=useState({rank:0});
  const[streak,setstrek]=useState(0);
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/');
        setProblems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching problems:', error);
        setProblems([]);
      }
    };
    fetchProblems();
  }, [user]);

  useEffect(()=>{
     const fetchSolvedProblems = async () => {
      try {
        // Keeping the ID provided in your original snippet
        const { data } = await axiosClient.get(`/code/solveduniqueproblem`);
        console.log(data);
        setSolvedProblems(Array.isArray(data) ? data : []);

      } catch (error) {
        console.error('Error fetching solved problems:', error);
        setSolvedProblems([]);
      }
    };
    fetchSolvedProblems();
  },[])



  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };
const solvedProblemIds = useMemo(() => {
  return new Set(
    solvedProblems.map(
      sp => sp.problemId?._id || sp.problemId || sp._id
    )
  );
}, [solvedProblems]);
  const filteredProblems = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    
    return problems.filter(problem => {
      if (!problem) return false;

      const difficultyMatch = filters.difficulty === 'all' || 
                             (problem.difficulty && problem.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
      
      const tagMatch = filters.tag === 'all' || 
                      (problem.tags && problem.tags.toLowerCase().includes(filters.tag.toLowerCase()));
      
     const statusMatch =
  filters.status === 'all' ||
  (filters.status === 'solved' &&
    solvedProblems.some((sp) => {
      const solvedId =
        sp?.problemId?._id || // { problemId: { _id: ... } }
        sp?.problemId ||      // { problemId: "..." }
        sp?._id;              // { _id: "..." }

      return solvedId && String(solvedId) === String(problem._id);
    })) ||
  (filters.status === 'unsolved' &&
    !solvedProblems.some((sp) => {
      const solvedId =
        sp?.problemId?._id ||
        sp?.problemId ||
        sp?._id;

      return solvedId && String(solvedId) === String(problem._id);
    }));
      
      const searchMatch = !searchQuery || 
                         (problem.title && problem.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return difficultyMatch && tagMatch && statusMatch && searchMatch;
    });
  }, [problems, solvedProblems, filters, searchQuery]);
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans antialiased">
      {/* Immersive Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
     <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    {/* Left Section */}
    <div className="flex items-center gap-8">
      <NavLink to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
          <Code2 className="w-5 h-5 text-black" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white italic">
          CodeMaster
        </span>
      </NavLink>

      <div className="hidden md:flex items-center gap-6">
        <NavLink
          to="/explore"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Explorer
        </NavLink>

        <NavLink
          to="/contest"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Contests
        </NavLink>

        <NavLink
          to="/discuss"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Community
        </NavLink>
      </div>
    </div>

    {/* Right Section */}
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              {user?.role === "admin" ? "Grandmaster" : "Master"}
            </span>
            <span className="text-sm font-medium text-white">
              {user?.firstName || "User"}
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative group">
            {/* Profile Icon */}
            <NavLink to="/profile">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <UserIcon className="w-5 h-5 text-white/70" />
            </button>
          </NavLink>
            {/* Invisible Hover Bridge */}
            <div className="absolute right-0 top-full w-48 h-2"></div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#111111] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
              {/* Header */}
              <div className="p-2 border-b border-white/5">
                <p className="text-xs text-white/40 px-3 py-1">
                  Logged in as
                </p>

                <p className="text-sm font-medium text-white px-3 py-1 truncate">
                  {user?.firstName || "User"}
                </p>

                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest px-3 py-1">
                  {user?.role === "admin" ? "Administrator" : "User"}
                </p>
              </div>

              {/* Menu Items */}
              <div className="p-1">
                {/* Admin Panel - Only for Admin */}
                {user?.role === "admin" && (
                  <NavLink
                    to="/admin"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    Admin Panel
                  </NavLink>
                )}

                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button className="bg-white text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors">
          Connect
        </button>
      )}
    </div>
  </div>
</nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<Trophy className="w-6 h-6 text-orange-500" />}
            label="Rank"
            value={`${stats
?.rank}`}
            color="emerald"
          />
          <StatCard 
            icon={<CheckCircle2 className="w-6 h-6 text-blue-500" />}
            label="Solved"
            value={`${stats
?.total} / ${problems?.length}`}
            color="blue"
          />
          <StatCard 
            icon={<LayoutGrid className="w-6 h-6 text-amber-500" />}
            label="Daily Streak"
            value={`streak day ${streak}`}
            color="amber"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-10 pb-6 border-b border-white/5">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <DropdownFilter 
              icon={<Filter className="w-4 h-4" />}
              value={filters.status}
              onChange={(v) => setFilters({...filters, status: v})}
              options={[
                { label: 'Status: All', value: 'all' },
                { label: 'Status: Solved', value: 'solved' },
                { label: 'Status: Unsolved', value: 'unsolved' },
              ]}
            />
            <DropdownFilter 
              icon={<ListFilter className="w-4 h-4" />}
              value={filters.difficulty}
              onChange={(v) => setFilters({...filters, difficulty: v})}
              options={[
                { label: 'Lvl: All', value: 'all' },
                { label: 'Lvl: Easy', value: 'easy' },
                { label: 'Lvl: Medium', value: 'medium' },
                { label: 'Lvl: Hard', value: 'hard' },
              ]}
            />
            <DropdownFilter 
              icon={<Circle className="w-4 h-4" />}
              value={filters.tag}
              onChange={(v) => setFilters({...filters, tag: v})}
              options={[
                { label: 'Tag: All', value: 'all' },
                { label: 'Tag: Array', value: 'array' },
                { label: 'Tag: Graph', value: 'graph' },
                { label: 'Tag: DP', value: 'dp' },
              ]}
            />
          </div>
        </div>

        {/* Problem Feed */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem, index) => (
                <ProblemCard 
                  key={problem._id} 
                  problem={problem} 
                  isSolved={solvedProblemIds.has(problem._id)}
                  index={index}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center opacity-40"
              >
                <Search className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold">No results found</h3>
                <p className="text-sm">Try adjusting your filters or search keywords.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* UI Helper Components */

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:scale-110 transition-transform duration-500", `text-${color}-500`)}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-white/30 mb-1 uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
    </motion.div>
  );
}

function DropdownFilter({ icon, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-orange transition-colors relative">
      <div className="text-white/30">{icon}</div>
      <select 
        className="bg-transparent text-xs font-semibold focus:outline-none appearance-none cursor-pointer pr-6 text-white/80"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>)}
      </select>
      <ChevronRight className="w-3 h-3 text-white/20 absolute right-3 rotate-90 pointer-events-none" />
    </div>
  );
}

function ProblemCard({ problem, isSolved, index }) {
  return (
     <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      layout
      transition={{ delay: index * 0.02 }}
    >
      <NavLink
        to={`/problem/${problem._id}`}
        className="group relative flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-orange hover:border-orange transition-all duration-300 overflow-hidden"
      >
        {/* Left orange bar only when solved */}
        {isSolved && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 shadow-[2px_0_15px_rgba(249,115,22,0.3)]" />
        )}

        {/* Left Section */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            {/* Title */}
            <h4 className="text-base font-bold group-hover:text-orange-400 transition-colors flex items-center gap-2">
              {problem.title}

              {/* Tick icon only if solved */}
              {isSolved && (
                <CheckCircle2
                  className="w-4 h-4 text-orange-500"
                  strokeWidth={3}
                />
              )}
            </h4>

            {/* Difficulty + Tag + Status */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Difficulty Badge */}
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
                  getDifficultyStyle(problem.difficulty)
                )}
              >
                {problem.difficulty}
              </span>

              {/* Tag */}
              <span className="text-[11px] text-white/30 font-medium tracking-tight">
                #{problem.tags || "General"}
              </span>

              {/* Solved / Unsolved Badge */}
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
                  isSolved
                    ? "text-orange-400 border-orange-500/20 bg-orange-500/10"
                    : "text-white/50 border-white/10 bg-white/5"
                )}
              >
                {isSolved ? "Solved" : "Unsolved"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 font-black">
              Success Rate
            </p>
            {/* <p className="text-xs font-bold text-white/40">74.2%</p> */}
          </div>

          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-black group-hover:rotate-[-5deg] transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </NavLink>
    </motion.div>
  );
}

const getDifficultyStyle = (difficulty) => {
  const d = String(difficulty || '').toLowerCase();
  if (d === 'easy') return 'text-orange-500 border-emerald-500/20 bg-orange-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
  if (d === 'medium') return 'text-amber-500 border-amber-500/20 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
  if (d === 'hard') return 'text-rose-500 border-rose-500/20 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
  return 'text-white/40 border-white/10 bg-white/5';
};

export default Homepage;