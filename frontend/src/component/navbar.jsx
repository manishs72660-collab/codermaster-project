import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User as UserIcon, Code2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { logoutUser } from '../authSlice';

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  console.log(user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled
        ? "border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        : "border-b border-transparent bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Code2 className="w-[18px] h-[18px] text-black" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#050505]" />
            </div>
            <span className="font-display text-[17px] font-800 tracking-tight text-white italic">
              CodeMaster
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/explore', label: 'Explorer' },
              { to: '/contest', label: 'Contests' },
              { to: '/discuss', label: 'Community' },
              {to: '/doubts', label: 'solveqoubt'}
            ].map(({ to, label }) => (
              <NavLink
                key={to} to={to}
                className="px-3.5 py-1.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.18em]">
                  {user?.role === 'Admin' ? 'Grandmaster' : 'Master'}
                </span>
                <span className="text-sm font-semibold text-white leading-tight">
                  {user?.firstName || 'User'}
                </span>
              </div>

              <div className="relative group">
                <NavLink to="/profile">
                  <button className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 hover:border-orange-500/30 transition-all">
                    <UserIcon className="w-4 h-4 text-white/70" />
                  </button>
                </NavLink>
                <div className="absolute right-0 top-full w-2 h-2" />
                <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-[#0e0e0e] border border-white/[0.08] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.7)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Logged in as</p>
                    <p className="text-sm font-semibold text-white">{user?.firstName || 'User'}</p>
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5">
                      {user?.role === 'Admin' ? 'Administrator' : 'User'}
                    </p>
                  </div>
                  <div className="p-2">
                    {user?.role === 'Admin' && (
                      <NavLink to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                        <Code2 className="w-3.5 h-3.5" /> Admin Panel
                      </NavLink>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button className="bg-orange-500 text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <NavLink to='/login'>
                  Connect
              </NavLink>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;