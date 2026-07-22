import { motion } from 'motion/react';
import { MapPin, CalendarDays, GitBranch, FileUser } from 'lucide-react';

const ProfileHeader = ({ user }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
  >
    {/* tab bar chrome, consistent with every panel on the page */}
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <div className="ml-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/50">
        <FileUser className="h-3 w-3 text-orange-400" />
        {user.username}.profile
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-white/15">
        <GitBranch className="h-3 w-3" />
        <span className="font-mono text-[10px]">main</span>
      </div>
    </div>

    <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
      <div className="relative shrink-0">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.username}
          className="h-24 w-24 rounded-2xl border border-white/[0.08] object-cover ring-2 ring-orange-500/25 ring-offset-2 ring-offset-[#0a0a0a]"
        />
        <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/30 bg-[#0a0a0a] text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400/70 sm:justify-start justify-center">
          <span>//</span> whoami
        </div>
        <h1 className="font-display mt-1 text-2xl font-800 tracking-tight text-white">
          {user.fullName || user.username}
        </h1>
        <p className="font-mono text-sm text-orange-400/80">@{user.username}</p>

        {user.bio && (
          <p className="mt-2.5 max-w-xl font-mono text-[13px] leading-relaxed text-white/45">
            <span className="text-white/20">// </span>
            {user.bio}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-white/35 sm:justify-start">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/25" />
              {user.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-white/25" />
            joined {new Date(user.joinedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default ProfileHeader;