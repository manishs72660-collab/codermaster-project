import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../component/navbar';
import {
  MessageSquare,
  ArrowBigUp,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Trophy,
  Swords,
  FlaskConical,
  Code2,
  Trash2,
  Send,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── tag config (kept identical to Community.jsx) ─── */
const TAG_META = {
  general:             { label: 'General',            icon: Sparkles,     color: 'text-white/50',    bg: 'bg-white/[0.04]',   border: 'border-white/10' },
  help:                { label: 'Help',                icon: HelpCircle,   color: 'text-sky-400',     bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
  'contest-discussion':{ label: 'Contest Discussion',  icon: Trophy,       color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'duel-brag':         { label: 'Duel Brag',           icon: Swords,       color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  showcase:            { label: 'Showcase',            icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
};

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
export default function CommunityPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [post, setPost]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting]         = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/community/posts/${id}`);
      setPost(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); }, [id]);

  const handleUpvotePost = async () => {
    if (!user) return navigate('/login');
    setPost((p) => ({ ...p, isUpvoted: !p.isUpvoted, upvoteCount: p.upvoteCount + (p.isUpvoted ? -1 : 1) }));
    try {
      await axiosClient.post(`/community/posts/${id}/upvote`);
    } catch {
      fetchPost();
    }
  };

  const handleUpvoteComment = async (commentId) => {
    if (!user) return navigate('/login');
    setPost((p) => ({
      ...p,
      comments: p.comments.map((c) => c._id === commentId
        ? { ...c, isUpvoted: !c.isUpvoted, upvoteCount: c.upvoteCount + (c.isUpvoted ? -1 : 1) }
        : c),
    }));
    try {
      await axiosClient.post(`/community/posts/${id}/comments/${commentId}/upvote`);
    } catch {
      fetchPost();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data: newComment } = await axiosClient.post(`/community/posts/${id}/comments`, { body: commentText.trim() });
      setPost((p) => ({ ...p, comments: [...p.comments, { ...newComment, upvoteCount: 0, isUpvoted: false }] }));
      setCommentText('');
    } catch {
      // silent fail, keep the draft so the user doesn't lose it
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setPost((p) => ({ ...p, comments: p.comments.filter((c) => c._id !== commentId) }));
    try {
      await axiosClient.delete(`/community/posts/${id}/comments/${commentId}`);
    } catch {
      fetchPost();
    }
  };

  const handleDeletePost = async () => {
    try {
      await axiosClient.delete(`/community/posts/${id}`);
      navigate('/community');
    } catch {
      // no-op, user stays on page
    }
  };

  const meta = post ? (TAG_META[post.tags?.[0]] || TAG_META.general) : TAG_META.general;
  const Icon = meta.icon;
  const authorName = post?.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : 'Unknown';
  const isAuthor = user && post?.author && (post.author._id === user._id);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        .font-mono    { font-family: 'JetBrains Mono', monospace; }

        .noise::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          opacity: 0.55;
        }
        @keyframes glow-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
        .glow-pulse { animation: glow-pulse 5s ease-in-out infinite; }

        @keyframes upvote-pop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
        .upvote-pop { animation: upvote-pop 0.35s ease; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff12; border-radius: 2px; }
      `}</style>

      <div className="noise min-h-screen bg-[#050505] text-[#e5e5e5] font-body antialiased">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="glow-pulse absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-orange-500/[0.06] blur-[130px] rounded-full" />
          <div className="glow-pulse absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-purple-500/[0.04] blur-[130px] rounded-full" />
        </div>

        <Navbar></Navbar>

        <div className="max-w-3xl mx-auto px-5 py-8 relative z-10">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Community
          </button>

          {loading ? (
            <div className="space-y-4">
              <div className="h-40 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
              <div className="h-24 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            </div>
          ) : notFound || !post ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white/15" />
              </div>
              <h3 className="font-display text-lg font-700 text-white/30 mb-1">Post not found</h3>
              <p className="text-sm text-white/20">It may have been deleted.</p>
            </div>
          ) : (
            <>
              {/* ── POST ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="relative flex gap-4 px-6 py-6 bg-white/[0.015] border border-white/[0.06] rounded-2xl mb-6"
              >
                {/* upvote column */}
                <button
                  onClick={handleUpvotePost}
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] px-2 py-0.5 rounded-md border", meta.bg, meta.border, meta.color)}>
                      <Icon className="w-2.5 h-2.5" /> {meta.label}
                    </span>
                    {isAuthor && (
                      <button
                        onClick={handleDeletePost}
                        className="flex items-center gap-1 text-[11px] font-bold text-white/25 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>

                  <h1 className="font-display text-2xl font-700 text-white mb-3 leading-snug">
                    {post.title}
                  </h1>

                  <p className="text-[14px] text-white/50 leading-relaxed whitespace-pre-wrap mb-4">
                    {post.body}
                  </p>

                  {post.code?.content && (
                    <div className="mb-4 rounded-xl border border-white/[0.08] bg-black/40 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] text-[11px] font-bold text-white/30 uppercase tracking-wide">
                        <Code2 className="w-3.5 h-3.5" /> {post.code.language || 'code'}
                      </div>
                      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                        {post.code.content}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-white/25">
                    <span className="font-semibold text-white/40">{authorName || 'Unknown'}</span>
                    <span>·</span>
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </motion.div>

              {/* ── COMMENTS ── */}
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white/30" />
                <h2 className="font-display text-sm font-700 text-white/60 uppercase tracking-wide">
                  {post.comments.length} Comments
                </h2>
              </div>

              {/* add comment */}
              <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-6">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? 'Add a comment…' : 'Log in to comment'}
                  disabled={!user}
                  maxLength={1000}
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.05] transition-all disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={posting || !commentText.trim() || !user}
                  className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {posting
                    ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </form>

              {/* comment list */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {post.comments.map((c) => {
                    const cAuthorName = c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() : 'Unknown';
                    const isCommentAuthor = user && c.author && (c.author._id === user._id);
                    return (
                      <motion.div
                        key={c._id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        layout
                        className="flex gap-3 px-4 py-3.5 bg-white/[0.015] border border-white/[0.05] rounded-xl"
                      >
                        <button
                          onClick={() => handleUpvoteComment(c._id)}
                          className={cn(
                            "flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-9 h-10 rounded-lg border transition-all",
                            c.isUpvoted
                              ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                              : "bg-white/[0.03] border-white/[0.07] text-white/25 hover:text-orange-400 hover:border-orange-500/25"
                          )}
                        >
                          <ArrowBigUp className={cn("w-3.5 h-3.5", c.isUpvoted && "fill-orange-400")} />
                          <span className="text-[10px] font-black">{c.upvoteCount ?? 0}</span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-bold text-white/50">{cAuthorName || 'Unknown'}</span>
                              <span className="text-white/20">{timeAgo(c.createdAt)}</span>
                            </div>
                            {isCommentAuthor && (
                              <button
                                onClick={() => handleDeleteComment(c._id)}
                                className="text-white/20 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">
                            {c.body}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {post.comments.length === 0 && (
                  <p className="text-center text-sm text-white/20 py-8">No comments yet. Start the conversation.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}