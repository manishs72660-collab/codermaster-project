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
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── tag config (icon + color per tag) ─── */
const TAG_META = {
  general:             { label: 'General',            icon: Sparkles,     color: 'text-white/50',    bg: 'bg-white/[0.04]',   border: 'border-white/10' },
  help:                { label: 'Help',                icon: HelpCircle,   color: 'text-sky-400',     bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
  'contest-discussion':{ label: 'Contest Discussion',  icon: Trophy,       color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'duel-brag':         { label: 'Duel Brag',           icon: Swords,       color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  showcase:            { label: 'Showcase',            icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .font-mono    { font-family: 'JetBrains Mono', monospace; }

        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .noise::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          opacity: 0.55;
        }
        @keyframes glow-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

        .card-shimmer::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.04) 50%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .card-shimmer:hover::before { opacity: 1; }

        @keyframes upvote-pop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
        .upvote-pop { animation: upvote-pop 0.35s ease; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">

        {/* ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-purple-500/[0.04] blur-[130px] rounded-full" />
        </div>

        <Navbar></Navbar>

        {/* ── HERO ── */}
        <div className="relative hero-grid border-b border-white/[0.04] overflow-hidden">
          <div className="max-w-5xl mx-auto px-5 py-14 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full w-fit mb-4">
                <MessageSquare className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.15em]">Community</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-800 text-white tracking-tight leading-[1.1] mb-3">
                Talk shop.<br />
                <span className="text-orange-500">Share the win.</span>
              </h1>
              <p className="text-white/40 text-base max-w-md leading-relaxed">
                Ask for help, discuss contests, brag about a duel, or show off a solution.
              </p>
            </motion.div>
          </div>
          <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-white/[0.04] rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-white/[0.04] rounded-bl-xl pointer-events-none" />
        </div>

        {/* ── MAIN ── */}
        <div className="max-w-5xl mx-auto px-5 py-10 relative z-10">

          {/* ── CONTROLS ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all"
              />
            </div>

            {/* sort toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl">
              <button
                onClick={() => setSort('new')}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                  sort === 'new' ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60")}
              >
                <Clock className="w-3.5 h-3.5" /> New
              </button>
              <button
                onClick={() => setSort('hot')}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                  sort === 'hot' ? "bg-orange-500 text-black" : "text-white/35 hover:text-white/60")}
              >
                <Flame className="w-3.5 h-3.5" /> Hot
              </button>
            </div>

            {/* new post */}
            <button
              onClick={() => (user ? setShowNewPost(true) : navigate('/login'))}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.25)] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          {/* ── TAG FILTERS ── */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            <button
              onClick={() => setTag('all')}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border",
                tag === 'all' ? "bg-white text-black border-white" : "text-white/40 border-white/10 hover:text-white/70 hover:border-white/20"
              )}
            >
              All {total > 0 && <span className="opacity-50">· {total}</span>}
            </button>
            {ALL_TAGS.map((t) => {
              const meta = TAG_META[t];
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                    tag === t ? cn(meta.bg, meta.border, meta.color) : "text-white/35 border-white/10 hover:text-white/60 hover:border-white/20"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {meta.label}
                </button>
              );
            })}
          </div>

          {/* ── FEED ── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white/15" />
              </div>
              <h3 className="font-display text-lg font-700 text-white/30 mb-1">Nothing here yet</h3>
              <p className="text-sm text-white/20 mb-5">Be the first to start a conversation.</p>
              <button
                onClick={() => (user ? setShowNewPost(true) : navigate('/login'))}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> New Post
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <PostCard
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
   POST CARD
══════════════════════════════════════════ */
function PostCard({ post, index, onUpvote, onOpen }) {
  const meta = TAG_META[post.tags?.[0]] || TAG_META.general;
  const Icon = meta.icon;
  const authorName = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      layout
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div
        onClick={onOpen}
        className="card-shimmer group relative flex gap-4 px-5 py-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl hover:bg-white/[0.035] hover:border-white/[0.12] transition-all duration-250 overflow-hidden cursor-pointer"
      >
        {/* upvote column */}
        <button
          onClick={onUpvote}
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-12 h-14 rounded-xl border transition-all",
            post.isUpvoted
              ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
              : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-orange-400 hover:border-orange-500/25"
          )}
        >
          <ArrowBigUp className={cn("w-5 h-5", post.isUpvoted && "fill-orange-400 upvote-pop")} />
          <span className="text-xs font-black">{post.upvoteCount ?? 0}</span>
        </button>

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] px-2 py-0.5 rounded-md border", meta.bg, meta.border, meta.color)}>
              <Icon className="w-2.5 h-2.5" /> {meta.label}
            </span>
            {post.code?.content && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.03] text-white/30">
                <Code2 className="w-2.5 h-2.5" /> Code
              </span>
            )}
          </div>

          <h4 className="text-[15px] font-semibold text-white/85 group-hover:text-white transition-colors truncate mb-1">
            {post.title}
          </h4>

          <p className="text-[13px] text-white/35 line-clamp-2 mb-2 leading-relaxed">
            {post.body}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-white/25">
            <span className="font-semibold text-white/40">{authorName || 'Unknown'}</span>
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0e0e0e] border border-white/[0.08] rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => { onClose(); reset(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-orange-400" />
            </div>

            <h3 className="font-display text-xl font-700 text-white mb-1">New Post</h3>
            <p className="text-white/40 text-sm mb-5">Ask something, start a discussion, or share a win.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* tag select */}
              <div className="flex items-center gap-2 flex-wrap">
                {ALL_TAGS.map((t) => {
                  const m = TAG_META[t];
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTag(t)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                        tag === t ? cn(m.bg, m.border, m.color) : "text-white/35 border-white/10 hover:text-white/60"
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
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all"
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={5000}
                rows={5}
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all resize-none"
              />

              {/* optional code snippet toggle */}
              <button
                type="button"
                onClick={() => setCodeOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                {codeOpen ? 'Remove code snippet' : 'Attach a code snippet'}
              </button>

              {codeOpen && (
                <div className="space-y-2">
                  <select
                    value={codeLang}
                    onChange={(e) => setCodeLang(e.target.value)}
                    className="bg-white/[0.03] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none"
                  >
                    {['javascript', 'python', 'java', 'cpp', 'c', 'go', 'other'].map((l) => (
                      <option key={l} value={l} className="bg-[#0e0e0e]">{l}</option>
                    ))}
                  </select>
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="Paste your code…"
                    rows={6}
                    className="w-full font-mono text-xs bg-black/40 border border-white/[0.1] rounded-xl px-4 py-3 text-emerald-300 placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                  />
                </div>
              )}

              {error && <p className="text-rose-400 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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