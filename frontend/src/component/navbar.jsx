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
  Boxes,
  Terminal,
  Menu,
  X,
  LifeBuoy,
} from 'lucide-react';
import mylogo from "../assets/mylogo.png"
import { cn } from '../utils/cn';
import { logoutUser } from '../authSlice';
import { fetchUserProfile } from '../profileSlice';

// Primary nav links shown on desktop (md+) and inside the mobile menu.
// Kept as one source of truth so the two surfaces can't drift apart.
const NAV_LINKS = [
  { to: '/explore', label: 'Explore' },
  { to: '/contest', label: 'Contests' },
  { to: '/community', label: 'Community' },
  { to: '/design-problems', label: 'System Design', icon: Boxes },
  { to: '/compile', label: 'Compiler', icon: Terminal },
  { to: '/explore/talkadmin', label: 'Talk to Admin', icon: LifeBuoy },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // close the mobile menu on escape, and whenever the viewport grows back
  // past the md breakpoint (so it doesn't stay open if the window is resized)
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileOpen]);

  // Close the mobile menu on route change (any nav link click) rather than
  // per-link, so we don't have to repeat onClick on every entry below.
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const roleLabel =
    user?.role === 'Admin' ? 'Grandmaster' : user?.role === 'CollageAdmin' ? 'Faculty' : 'Master';

  const roleAccent =
    user?.role === 'Admin'
      ? { text: 'text-orange-400', dot: 'bg-orange-400' }
      : user?.role === 'CollageAdmin'
      ? { text: 'text-sky-400', dot: 'bg-sky-400' }
      : { text: 'text-emerald-400', dot: 'bg-emerald-400' };

  // rank progress used to draw the dial around the avatar — falls back to a
  // sane default so the ring still reads as "in progress" pre-data
  const rankProgress = Math.min(Math.max(user?.rankProgress ?? 62, 4), 100);

  const initials = (user?.firstName?.[0] || 'U') + (user?.lastName?.[0] || '');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        .nav-font { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <nav
        className={cn(
          'nav-font sticky top-0 z-50 transition-colors duration-300',
          scrolled
            ? 'border-b border-white/[0.07] bg-[#0B0B0C]/90 backdrop-blur-xl'
            : 'border-b border-transparent bg-[#0B0B0C]'
        )}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* logo */}
          <div className="flex items-center gap-8">
            <NavLink to="/" end className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={mylogo}
                  alt="CodeMaster logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">
                CodeMaster
              </span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  // `end` keeps this link from staying "active" once you drill into
                  // a nested path (e.g. /community/post/123, /contest/:id, /explore/*).
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors',
                      isActive ? 'text-white bg-white/[0.06]' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                    )
                  }
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </NavLink>
              ))}

              {user?.role === 'CollageAdmin' && (
                <NavLink
                  to="/collegeadmin"
                  end
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-sky-400/80 hover:text-sky-300 hover:bg-white/[0.04] rounded-md transition-colors"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-amber-400/80 hover:text-amber-300 hover:bg-white/[0.04] rounded-md transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Leaderboard
                </NavLink>
              )}
            </div>
          </div>

          {/* right */}
          <div className="flex items-center gap-2">
            {/* mobile hamburger — only visible below md, toggles the panel below */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="relative hidden sm:block" data-profile-menu>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={cn(
                    'flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border transition-colors',
                    menuOpen
                      ? 'bg-white/[0.06] border-white/[0.1]'
                      : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.1]'
                  )}
                >
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className={cn('text-[10px] font-medium', roleAccent.text)}>
                      {roleLabel}
                    </span>
                    <span className="text-[13px] font-medium text-white">{user?.firstName || 'User'}</span>
                  </div>

                  {/* rank dial: conic-gradient progress ring drawn around the avatar */}
                  <div className="relative w-8 h-8 shrink-0">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from -90deg, #f97316 ${rankProgress}%, rgba(255,255,255,0.08) ${rankProgress}%)`,
                      }}
                    />
                    <div className="absolute inset-[2px] rounded-full bg-[#0B0B0C] flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-semibold text-white/80">{initials}</span>
                      )}
                    </div>
                  </div>

                  <ChevronDown className={cn('w-3.5 h-3.5 text-white/35 transition-transform', menuOpen && 'rotate-180')} />
                </button>

                <div
                  className={cn(
                    'absolute right-0 top-[calc(100%+8px)] w-64 origin-top-right rounded-xl border border-white/[0.08] bg-[#0B0B0C] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-150',
                    menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
                  )}
                >
                  {/* profile header */}
                  <div className="px-4 pt-4 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 shrink-0">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(from -90deg, #f97316 ${rankProgress}%, rgba(255,255,255,0.08) ${rankProgress}%)`,
                          }}
                        />
                        <div className="absolute inset-[2px] rounded-full bg-[#0B0B0C] flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[13px] font-semibold text-white/85">{initials}</span>
                          )}
                        </div>
                        <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0B0C]', roleAccent.dot)} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-white truncate">
                          {user?.firstName || 'User'} {user?.lastName || ''}
                        </p>
                        {user?.email && <p className="text-[11px] text-white/35 truncate">{user.email}</p>}
                        <span className={cn('inline-flex items-center gap-1 mt-1 text-[11px] font-medium', roleAccent.text)}>
                          {user?.role === 'Admin' && <ShieldCheck className="w-3 h-3" />}
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* menu links */}
                  <div className="p-1.5">
                    <NavLink
                      to={`/profile/${user._id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5" /> View Profile
                    </NavLink>

                    {/* quick links to the two new tools, alongside View Profile */}
                    <NavLink
                      to="/compile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" /> Compiler
                    </NavLink>

                    <NavLink
                      to="/design-problems"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      <Boxes className="w-3.5 h-3.5" /> System Design
                    </NavLink>

                    {user?.role === 'Admin' && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-orange-400 hover:bg-orange-500/[0.08] rounded-lg transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Admin Panel
                      </NavLink>
                    )}
                    {user?.role === 'CollageAdmin' && (
                      <NavLink
                        to="/collegeadmin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-sky-400 hover:bg-sky-500/[0.08] rounded-lg transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5" /> College Admin
                      </NavLink>
                    )}
                    {inCollege && (
                      <NavLink
                        to="/collegeadmin/leaderboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-amber-400 hover:bg-amber-500/[0.08] rounded-lg transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5" /> College Leaderboard
                      </NavLink>
                    )}

                    <div className="h-px bg-white/[0.06] my-1.5" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-400 hover:bg-rose-500/[0.08] rounded-lg transition-colors text-left"
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
                className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              >
                Connect
              </NavLink>
            )}
          </div>
        </div>

        {/* ── MOBILE MENU PANEL ──
            Slides down below the bar on phones/small tablets. Holds the same
            nav links as desktop plus (when logged in) profile actions, since
            the profile-dropdown button itself is hidden below `sm`. */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-out border-b',
            mobileOpen ? 'max-h-[calc(100vh-64px)] opacity-100 border-white/[0.07]' : 'max-h-0 opacity-0 border-transparent'
          )}
        >
          <div className="px-5 py-3 bg-[#0B0B0C] overflow-y-auto max-h-[calc(100vh-64px)]">
            {user && (
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-white/[0.06]">
                <div className="relative w-10 h-10 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from -90deg, #f97316 ${rankProgress}%, rgba(255,255,255,0.08) ${rankProgress}%)`,
                    }}
                  />
                  <div className="absolute inset-[2px] rounded-full bg-[#0B0B0C] flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[12px] font-semibold text-white/85">{initials}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-white truncate">{user?.firstName || 'User'}</p>
                  <span className={cn('text-[11px] font-medium', roleAccent.text)}>{roleLabel}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors',
                      isActive ? 'text-white bg-white/[0.06]' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    )
                  }
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </NavLink>
              ))}

              {user?.role === 'CollageAdmin' && (
                <NavLink
                  to="/collegeadmin"
                  end
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium text-sky-400 hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <GraduationCap className="w-4 h-4" /> College Admin
                </NavLink>
              )}
              {inCollege && (
                <NavLink
                  to="/collegeadmin/leaderboard"
                  end
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium text-amber-400 hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <Trophy className="w-4 h-4" /> Leaderboard
                </NavLink>
              )}
            </div>

            {user ? (
              <>
                <div className="h-px bg-white/[0.06] my-2" />
                <div className="flex flex-col gap-0.5">
                  <NavLink
                    to={`/profile/${user._id}`}
                    onClick={closeMobile}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4" /> View Profile
                  </NavLink>
                  {user?.role === 'Admin' && (
                    <NavLink
                      to="/admin"
                      onClick={closeMobile}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium text-orange-400 hover:bg-orange-500/[0.08] rounded-lg transition-colors"
                    >
                      <Code2 className="w-4 h-4" /> Admin Panel
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium text-rose-400 hover:bg-rose-500/[0.08] rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={closeMobile}
                className="mt-3 flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-black px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
              >
                Connect
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;