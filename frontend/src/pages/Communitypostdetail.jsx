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
  Loader2,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { cn } from '../utils/cn';

/* ─── tag config (kept identical to Community.jsx) ─── */
const TAG_META = {
  general:              { label: 'General',           icon: Sparkles,     color: 'text-white/50' },
  help:                 { label: 'Help',               icon: HelpCircle,   color: 'text-sky-400' },
  'contest-discussion': { label: 'Contest Discussion',  icon: Trophy,       color: 'text-orange-400' },
  'duel-brag':          { label: 'Duel Brag',           icon: Swords,       color: 'text-purple-400' },
  showcase:             { label: 'Showcase',            icon: FlaskConical, color: 'text-emerald-400' },
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-data { font-family: 'IBM Plex Mono', monospace; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 0.8s linear infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar />

        <div className="max-w-3xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Community
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="w-5 h-5 text-orange-500 spin-slow mb-3" />
              <p className="text-sm text-white/35">Loading post…</p>
            </div>
          ) : notFound || !post ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-white/20" />
              </div>
              <h3 className="font-display text-base font-semibold text-white/65 mb-1">Post not found</h3>
              <p className="text-xs text-white/30">It may have been deleted.</p>
            </div>
          ) : (
            <>
              {/* ── POST ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 px-6 py-6 rounded-xl border border-white/[0.08] bg-white/[0.02] mb-6"
              >
                {/* upvote column */}
                <button
                  onClick={handleUpvotePost}
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', meta.color)}>
                      <Icon className="w-3.5 h-3.5" /> {meta.label}
                    </span>
                    {isAuthor && (
                      <button
                        onClick={handleDeletePost}
                        className="flex items-center gap-1 text-[11px] font-medium text-white/25 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>

                  <h1 className="font-display text-xl font-bold text-white mb-3 leading-snug">
                    {post.title}
                  </h1>

                  <p className="text-[14px] text-white/50 leading-relaxed whitespace-pre-wrap mb-4">
                    {post.body}
                  </p>

                  {post.code?.content && (
                    <div className="mb-4 rounded-lg border border-white/[0.08] bg-black/30 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] text-[11px] font-medium text-white/30">
                        <Code2 className="w-3.5 h-3.5" /> {post.code.language || 'code'}
                      </div>
                      <pre className="p-4 text-xs font-data text-emerald-300/90 overflow-x-auto whitespace-pre">
                        {post.code.content}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[12px] text-white/30">
                    <span className="font-medium text-white/45">{authorName || 'Unknown'}</span>
                    <span>·</span>
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </motion.div>

              {/* ── COMMENTS ── */}
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white/30" />
                <h2 className="text-[13px] font-medium text-white/50">
                  {post.comments.length} Comments
                </h2>
              </div>

              {/* add comment */}
              <form onSubmit={handleAddComment} className="flex flex-col gap-1.5 mb-6">
                <div className="flex items-start gap-3">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 200))}
                    placeholder={user ? 'Add a comment…' : 'Log in to comment'}
                    disabled={!user}
                    maxLength={200}
                    className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim() || !user}
                    className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {posting
                      ? <Loader2 className="w-4 h-4 spin-slow" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {user && (
                  <span className={cn(
                    'self-end text-[11px] font-data tabular-nums pr-1',
                    commentText.length >= 200 ? 'text-rose-400' : 'text-white/20'
                  )}>
                    {commentText.length}/200
                  </span>
                )}
              </form>

              {/* comment list */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {post.comments.map((c) => {
                    const cAuthorName = c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() : 'Unknown';
                    const isCommentAuthor = user && c.author && (c.author._id === user._id);
                    return (
                      <motion.div
                        key={c._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        layout
                        className="flex gap-3 px-4 py-3.5"
                      >
                        <button
                          onClick={() => handleUpvoteComment(c._id)}
                          className={cn(
                            'flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-9 h-9 rounded-md border transition-colors',
                            c.isUpvoted
                              ? 'bg-orange-500/15 border-orange-500/25 text-orange-400'
                              : 'bg-white/[0.02] border-white/[0.08] text-white/25 hover:text-orange-400 hover:border-orange-500/20'
                          )}
                        >
                          <ArrowBigUp className={cn('w-3.5 h-3.5', c.isUpvoted && 'fill-orange-400')} />
                          <span className="text-[10px] font-data">{c.upvoteCount ?? 0}</span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-medium text-white/50">{cAuthorName || 'Unknown'}</span>
                              <span className="text-white/25">{timeAgo(c.createdAt)}</span>
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
                  <p className="text-center text-sm text-white/25 py-8">No comments yet. Start the conversation.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}