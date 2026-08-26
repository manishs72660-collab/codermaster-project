import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LogOut,
  User as UserIcon,
  Code2,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  Trophy,
} from 'lucide-react';
import mylogo from "../assets/mylogo.png"
import { cn } from '../utils/cn';
import { logoutUser } from '../authSlice';
import { fetchUserProfile } from '../profileSlice';

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  // NOTE: college membership does NOT reliably live on state.auth.user -
  // Homepage.jsx learns about it via a separate fetchUserProfile() call
  // into the `profile` slice (profileData.college), not user.collegeId.
  // Mirror that here rather than trusting user.collegeId, which is why the
  // Leaderboard link wasn't showing before even though role was correct.
  const { data: profileData } = useSelector((s) => s.profile);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch profile (once) if it isn't already loaded - Navbar can mount on
  // pages the user reaches before ever visiting Homepage, so we can't rely
  // on Homepage having already populated this.
  useEffect(() => {
    if (!user?._id || profileData) return;
    dispatch(fetchUserProfile(user._id));
  }, [dispatch, user, profileData]);

  // "Belongs to a college" gate for the Leaderboard link/menu-item below.
  // Mirrors Homepage.jsx's CollegeSpotlight check EXACTLY:
  //   const college = profileData?.college || null;
  //   if (!college?.name) return null;
  // i.e. it's not enough for `college` to be a truthy object (the backend
  // may return `{}` when there's no college) - it must actually have a
  // `name`. OPEN TO ALL COLLEGE MEMBERS now (students + CollageAdmin), not
  // just CollageAdmin - per product decision. Platform Admin never has a
  // collegeId so this naturally stays hidden for them; they browse
  // leaderboards via /admin/colleges/:id instead.
  const college = profileData?.college || null;
  const inCollege = !!college?.name;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close the profile menu on outside click / escape, since it's now
  // click-triggered (not hover) to make room for the richer content below
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    const onClick = (e) => {
      if (!e.target.closest('[data-profile-menu]')) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setMenuOpen(false);
  };

  const roleLabel =
    user?.role === 'Admin' ? 'Grandmaster' : user?.role === 'CollageAdmin' ? 'Faculty' : 'Master';

  const roleAccent =
    user?.role === 'Admin'
      ? { text: 'text-orange-400', dot: 'bg-orange-400', ring: 'from-orange-400 via-amber-300 to-orange-500' }
      : user?.role === 'CollageAdmin'
      ? { text: 'text-sky-400', dot: 'bg-sky-400', ring: 'from-sky-400 via-cyan-300 to-sky-500' }
      : { text: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'from-emerald-400 via-teal-300 to-emerald-500' };

  // rank progress used to draw the dial around the avatar — falls back to a
  // sane default so the ring still reads as "in progress" pre-data
  const rankProgress = Math.min(Math.max(user?.rankProgress ?? 62, 4), 100);

  const initials = (user?.firstName?.[0] || 'U') + (user?.lastName?.[0] || '');

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.06] bg-[#08090b]/85 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.55)]'
          : 'border-b border-transparent bg-gradient-to-b from-[#08090b] to-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* logo */}
        <div className="flex items-center gap-8">
       <NavLink to="/" end className="flex items-center gap-2.5 group">
  <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center">
    <img
      src={mylogo}
      alt="CodeMaster logo"
      className="w-full h-full object-contain"
    />
  </div>
  <span className="font-display text-[17px] font-800 tracking-tight text-white italic">
    CodeMaster
  </span>
</NavLink>

          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/explore', label: 'Explorer' },
              { to: '/contest', label: 'Contests' },
              { to: '/community', label: 'Community' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                // `end` keeps this link from staying "active" once you drill into
                // a nested path (e.g. /community/post/123, /contest/:id, /explore/*).
                end
                className={({ isActive }) =>
                  cn(
                    'relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all',
                    isActive ? 'text-white bg-white/[0.06]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  )
                }
              >
                {label}
              </NavLink>
            ))}

            {user?.role === 'CollageAdmin' && (
              <NavLink
                to="/collegeadmin"
                end
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/[0.08] rounded-lg transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                College Admin
              </NavLink>
            )}

            {/* Only shown when the logged-in user is a CollageAdmin tied to a
                college - regular students and platform Admin never see this. */}
            {inCollege && (
              <NavLink
                to="/collegeadmin/leaderboard"
                end
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/[0.08] rounded-lg transition-all"
              >
                <Trophy className="w-3.5 h-3.5" />
                Leaderboard
              </NavLink>
            )}
          </div>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-2xl border transition-all',
                  menuOpen
                    ? 'bg-white/[0.07] border-white/[0.12]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                )}
              >
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className={cn('text-[9px] font-black uppercase tracking-[0.18em]', roleAccent.text)}>
                    {roleLabel}
                  </span>
                  <span className="text-sm font-semibold text-white">{user?.firstName || 'User'}</span>
                </div>

                {/* rank dial: conic-gradient progress ring drawn around the avatar,
                    doubling as this platform's tiny signature touch */}
                <div className="relative w-9 h-9 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from -90deg, #f97316 ${rankProgress}%, rgba(255,255,255,0.08) ${rankProgress}%)`,
                    }}
                  />
                  <div className="absolute inset-[2px] rounded-full bg-[#08090b] flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-white/80">{initials}</span>
                    )}
                  </div>
                </div>

                <ChevronDown className={cn('w-3.5 h-3.5 text-white/40 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              <div
                className={cn(
                  'absolute right-0 top-[calc(100%+10px)] w-72 origin-top-right rounded-2xl border border-white/[0.08] bg-[#0c0d10]/95 backdrop-blur-xl shadow-[0_28px_60px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-200',
                  menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                )}
              >
                {/* profile header */}
                <div className="relative px-5 pt-5 pb-4 bg-gradient-to-b from-white/[0.04] to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(from -90deg, #f97316 ${rankProgress}%, rgba(255,255,255,0.08) ${rankProgress}%)`,
                        }}
                      />
                      <div className="absolute inset-[2.5px] rounded-full bg-[#0c0d10] flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-bold text-white/85">{initials}</span>
                        )}
                      </div>
                      <div className={cn('absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0c0d10]', roleAccent.dot)} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white truncate">
                        {user?.firstName || 'User'} {user?.lastName || ''}
                      </p>
                      {user?.email && <p className="text-xs text-white/35 truncate">{user.email}</p>}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/[0.06]',
                          roleAccent.text
                        )}
                      >
                        {user?.role === 'Admin' && <ShieldCheck className="w-2.5 h-2.5" />}
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* menu links */}
                <div className="p-2">
                  <NavLink
                    to={`/profile/${user._id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> View Profile
                  </NavLink>

                  {user?.role === 'Admin' && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" /> Admin Panel
                    </NavLink>
                  )}
                  {user?.role === 'CollageAdmin' && (
                    <NavLink
                      to="/collegeadmin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5" /> College Admin
                    </NavLink>
                  )}
                  {inCollege && (
                    <NavLink
                      to="/collegeadmin/leaderboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" /> College Leaderboard
                    </NavLink>
                  )}

                  <div className="h-px bg-white/[0.06] my-1.5" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // A <NavLink> renders an <a>; nesting an <a> inside a <button> is
            // invalid HTML, so the button styling lives directly on the link.
            <NavLink
              to="/login"
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-black px-5 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            >
              Connect
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;