import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../component/navbar';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

/* ─── data ─── */
const exploreCards = [
  {
    id: 'roadmap',
    tag: 'Path',
    title: 'Structured Roadmap',
    desc: 'A guided, topic-by-topic path from fundamentals to advanced patterns — always know exactly what to learn next.',
    items: ['Beginner to Advanced', 'Topic-wise Tracks', 'Progress Tracking'],
    route: '/explore/roadmap',
  },
  {
    id: 'dsa-visualizer',
    tag: 'Interactive',
    title: 'Visualize DSA Algorithms',
    desc: 'Watch sorting, searching, and graph algorithms animate step-by-step — see the logic, not just the code.',
    items: ['Sorting', 'Graph Traversal', 'Trees', 'DP'],
    route: '/explore/dsa-visualizer',
  },
  {
    id: 'complexity',
    tag: 'Interactive',
    title: 'Visualize Time Complexity',
    desc: 'See how algorithms scale with interactive Big-O growth curves — compare space and runtime side by side.',
    items: ['Big-O', 'Growth Curves', 'Comparisons'],
    route: '/explore/complexity',
  },
  {
    id: 'cheatsheet',
    tag: 'Curated',
    title: 'Cheat Sheets',
    desc: 'Quick-reference sheets for syntax, patterns, and formulas — everything before an interview, on one page.',
    items: ['Patterns', 'Syntax', 'Formulas'],
    route: '/explore/cheatsheet',
  },
  {
    id: 'talk-admin',
    tag: 'Daily',
    title: 'Talk to an Admin',
    desc: 'Stuck on a problem? Start a live chat with an available mentor and get real-time help with your doubts.',
    items: ['Live Chat', '1-on-1 Support'],
    route: '/explore/talkadmin',
    live: true,
  },
];

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Path', value: 'Path' },
  { label: 'Interactive', value: 'Interactive' },
  { label: 'Curated', value: 'Curated' },
  { label: 'Daily', value: 'Daily' },
];

/* ══════════════════════════════════════════
   EXPLORE — matches Homepage's dark dashboard
══════════════════════════════════════════ */
function Explore() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered =
    filter === 'all' ? exploreCards : exploreCards.filter((c) => c.tag === filter);

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

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 2px; }
      `}</style>

      <div className="min-h-screen bg-[#0B0B0C] text-[#EAE8E3] font-body antialiased">
        <Navbar />

        {/* ── hero ── */}
        <div className="subtle-grid border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display font-extrabold text-[2.5rem] sm:text-5xl leading-[1.08] text-white mb-3">
                Explore
              </h1>
              <p className="text-white/45 text-[15px] max-w-md">
                A guided path through fundamentals, live visualizers, and reference material — pick where to start.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* ── filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 flex-wrap mb-6"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>

          {/* ── grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((card, index) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                onClick={() => navigate(card.route)}
                className="group text-left rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.14] transition-colors px-5 py-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-data text-white/30 uppercase tracking-wide">
                    {card.tag}
                  </span>
                  {card.live && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-data text-orange-400/85">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Live
                    </span>
                  )}
                </div>

                <h3 className="font-display text-[17px] font-semibold text-white/90 mb-1.5">
                  {card.title}
                </h3>

                <p className="text-[13px] leading-relaxed text-white/40 mb-4">
                  {card.desc}
                </p>

                <p className="text-[12px] text-white/25 mb-4">
                  {card.items.join(' · ')}
                </p>

                <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-orange-400/90">
                  Explore
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h3 className="font-display text-base font-semibold text-white/65 mb-1">Nothing here</h3>
              <p className="text-xs text-white/30">Try a different filter.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Explore;