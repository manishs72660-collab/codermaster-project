import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import {
  MessageSquare,
  ArrowBigUp,
  Sparkles,
  HelpCircle,
  Trophy,
  Swords,
  FlaskConical,
  Plus,
  X,
  Search,
  Flame,
  Clock,
  Code2,
  Loader2,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── tag config (icon + color per tag) ─── */
const TAG_META = {
  general:              { label: 'General',           icon: Sparkles,     color: 'text-white/50' },
  help:                 { label: 'Help',               icon: HelpCircle,   color: 'text-sky-400' },
  'contest-discussion': { label: 'Contest Discussion',  icon: Trophy,       color: 'text-orange-400' },
  'duel-brag':          { label: 'Duel Brag',           icon: Swords,       color: 'text-purple-400' },
  showcase:             { label: 'Showcase',            icon: FlaskConical, color: 'text-emerald-400' },
};
const ALL_TAGS = Object.keys(TAG_META);

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function Community() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tag, setTag]             = useState('all');
  const [sort, setSort]           = useState('new');
  const [search, setSearch]       = useState('');
  const [total, setTotal]         = useState(0);

  const [showNewPost, setShowNewPost] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/community/posts', {
        params: { tag, sort, search: search || undefined, page: 1, limit: 20 },
      });
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [tag, sort]);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(), 400); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleUpvote = async (e, postId) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    // optimistic update
    setPosts((prev) => prev.map((p) => p._id === postId
      ? { ...p, isUpvoted: !p.isUpvoted, upvoteCount: p.upvoteCount + (p.isUpvoted ? -1 : 1) }
      : p));
    try {
      await axiosClient.post(`/community/posts/${postId}/upvote`);
    } catch {
      fetchPosts(); // revert on failure by refetching truth
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }

        .subtle-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar />

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="font-display font-extrabold text-[2.5rem] sm:text-5xl leading-[1.08] text-white mb-3">
                Talk shop.
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                Ask for help, discuss contests, brag about a duel, or show off a solution.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* ── controls ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors"
              />
            </div>

            {/* sort toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSort('new')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                  sort === 'new' ? 'bg-white/[0.06] text-white/80' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                )}
              >
                <Clock className="w-3.5 h-3.5" /> New
              </button>
              <button
                onClick={() => setSort('hot')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                  sort === 'hot' ? 'bg-orange-500/15 text-orange-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                )}
              >
                <Flame className="w-3.5 h-3.5" /> Hot
              </button>
            </div>

            {/* new post */}
            <button
              onClick={() => (user ? setShowNewPost(true) : navigate('/login'))}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          {/* ── tag filters ── */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 flex-wrap">
            <button
              onClick={() => setTag('all')}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                tag === 'all' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              )}
            >
              All {total > 0 && <span className="text-white/30 font-data ml-0.5">{total}</span>}
            </button>
            {ALL_TAGS.map((t) => {
              const meta = TAG_META[t];
              const Icon = meta.icon;
              const active = tag === t;
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                    active ? 'bg-white/[0.06]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
                    active && meta.color
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {meta.label}
                </button>
              );
            })}
          </div>

          {/* ── feed ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-5 h-5 text-orange-500 spin-slow mb-3" />
              <p className="text-sm text-white/35">Loading posts…</p>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-white/20" />
              </div>
              <h3 className="font-display text-base font-semibold text-white/65 mb-1">Nothing here yet</h3>
              <p className="text-xs text-white/30 mb-5">Be the first to start a conversation.</p>
              <button
                onClick={() => (user ? setShowNewPost(true) : navigate('/login'))}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> New Post
              </button>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.05]">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <PostRow
                    key={post._id}
                    post={post}
                    index={index}
                    onUpvote={(e) => handleUpvote(e, post._id)}
                    onOpen={() => navigate(`/community/post/${post._id}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW POST MODAL ── */}
      <NewPostModal
        open={showNewPost}
        onClose={() => setShowNewPost(false)}
        onCreated={(post) => { setShowNewPost(false); setPosts((prev) => [post, ...prev]); }}
      />
    </>
  );
}

/* ══════════════════════════════════════════
   POST ROW
══════════════════════════════════════════ */
function PostRow({ post, index, onUpvote, onOpen }) {
  const meta = TAG_META[post.tags?.[0]] || TAG_META.general;
  const Icon = meta.icon;
  const authorName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      layout
      transition={{ delay: (index % 20) * 0.02, duration: 0.18 }}
    >
      <div
        onClick={onOpen}
        className="group flex gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer"
      >
        {/* upvote column */}
        <button
          onClick={onUpvote}
          className={cn(
            'flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-11 h-12 rounded-lg border transition-colors',
            post.isUpvoted
              ? 'bg-orange-500/15 border-orange-500/25 text-orange-400'
              : 'bg-white/[0.02] border-white/[0.08] text-white/30 hover:text-orange-400 hover:border-orange-500/20'
          )}
        >
          <ArrowBigUp className={cn('w-4.5 h-4.5', post.isUpvoted && 'fill-orange-400')} />
          <span className="text-[11px] font-data">{post.upvoteCount ?? 0}</span>
        </button>

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', meta.color)}>
              <Icon className="w-3 h-3" /> {meta.label}
            </span>
            {post.code?.content && (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/25">
                <Code2 className="w-3 h-3" /> Code
              </span>
            )}
          </div>

          <h4 className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate mb-1">
            {post.title}
          </h4>

          <p className="text-[13px] text-white/35 line-clamp-2 mb-2 leading-relaxed">
            {post.body}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-white/25">
            <span className="font-medium text-white/40">{authorName || 'Unknown'}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {post.commentCount ?? 0} comments
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   NEW POST MODAL
══════════════════════════════════════════ */
function NewPostModal({ open, onClose, onCreated }) {
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [tag, setTag]           = useState('general');
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  const BODY_LIMIT = 200;

  const reset = () => {
    setTitle(''); setBody(''); setTag('general');
    setCodeOpen(false); setCodeLang('javascript'); setCodeContent('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await axiosClient.post('/community/posts', {
        title: title.trim(),
        body: body.trim(),
        tags: [tag],
        code: codeOpen && codeContent.trim() ? { language: codeLang, content: codeContent } : undefined,
      });
      reset();
      onCreated(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => { onClose(); reset(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B0B0C] border border-white/[0.08] rounded-xl p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => { onClose(); reset(); }}
              className="absolute top-4 right-4 w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-2.5 text-orange-400/80">
              <MessageSquare className="w-4 h-4" />
              <span className="text-[12px] font-medium text-white/40">New post</span>
            </div>

            <h3 className="font-display text-lg font-bold text-white mb-1">Share something</h3>
            <p className="text-white/40 text-[13px] mb-5">Ask something, start a discussion, or share a win.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* tag select */}
              <div className="flex items-center gap-1 flex-wrap">
                {ALL_TAGS.map((t) => {
                  const m = TAG_META[t];
                  const Icon = m.icon;
                  const active = tag === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTag(t)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                        active ? 'bg-white/[0.06]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
                        active && m.color
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  );
                })}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={150}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors"
              />

              <div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, BODY_LIMIT))}
                  placeholder="What's on your mind?"
                  maxLength={BODY_LIMIT}
                  rows={5}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className={cn(
                    'text-[11px] font-data tabular-nums',
                    body.length >= BODY_LIMIT ? 'text-rose-400' : 'text-white/20'
                  )}>
                    {body.length}/{BODY_LIMIT}
                  </span>
                </div>
              </div>

              {/* optional code snippet toggle */}
              <button
                type="button"
                onClick={() => setCodeOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-white/40 hover:text-white transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                {codeOpen ? 'Remove code snippet' : 'Attach a code snippet'}
              </button>

              {codeOpen && (
                <div className="space-y-2">
                  <select
                    value={codeLang}
                    onChange={(e) => setCodeLang(e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-white/70 focus:outline-none"
                  >
                    {['javascript', 'python', 'java', 'cpp', 'c', 'go', 'other'].map((l) => (
                      <option key={l} value={l} className="bg-[#0B0B0C]">{l}</option>
                    ))}
                  </select>
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="Paste your code…"
                    rows={6}
                    className="w-full font-data text-xs bg-black/30 border border-white/[0.08] rounded-lg px-4 py-3 text-emerald-300/90 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors resize-none"
                  />
                </div>
              )}

              {error && <p className="text-rose-400 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 spin-slow" />
                  : <Plus className="w-4 h-4" />}
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}