import { motion as Motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  Braces,
  Check,
  Code2,
  Flame,
  Sparkles,
  Swords,
  Trophy,
  UsersRound,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Logo from '../component/Logo';
import './LandingPage.css';

const features = [
  {
    icon: <Code2 size={20} />,
    number: '01',
    title: 'Get sharper at DSA',
    description: 'Build your problem-solving muscle with challenges for every level.',
    link: '/explore',
    label: 'Explore problems',
  },
  {
    icon: <Swords size={20} />,
    number: '02',
    title: 'Make it a duel',
    description: 'Challenge a friend, race the clock, and turn practice into play.',
    link: '/duel',
    label: 'Enter the arena',
  },
  {
    icon: <Trophy size={20} />,
    number: '03',
    title: 'Compete together',
    description: 'Join contests, track your progress, and climb the leaderboard.',
    link: '/contest',
    label: 'View contests',
  },
];

const codeLines = [
  <><span className="landing-code-purple">function</span> <span className="landing-code-blue">levelUp</span>(<span className="landing-code-orange">you</span>) {'{'}</>,
  <>  <span className="landing-code-purple">while</span> (you.<span className="landing-code-blue">keepLearning</span>()) {'{'}</>,
  <>    you.<span className="landing-code-green">solve</span>(<span className="landing-code-orange">"one more"</span>);</>,
  <>    you.<span className="landing-code-green">getStronger</span>();</>,
  <>  {'}'}</>,
  <>  <span className="landing-code-purple">return</span> <span className="landing-code-orange">"unstoppable"</span>;</>,
  <>{'}'}</>,
];

function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-noise" aria-hidden="true" />
      <header className="landing-header">
        <NavLink to="/" className="landing-brand" aria-label="CodeMaster home">
          <Logo size="sm" />
        </NavLink>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">What you can do</a>
          <a href="#about">The platform</a>
        </nav>
        <div className="landing-header-actions">
          <NavLink to="/login" className="landing-login">Log in</NavLink>
          <NavLink to="/signup" className="landing-button landing-button-small">
            Get started <ArrowRight size={15} />
          </NavLink>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <Motion.div
            className="landing-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
           
            YOUR NEXT LEVEL STARTS HERE
          </Motion.div>
          <Motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Think in code.
            <br />
            <span>Grow without</span>
            <br />
            <span className="landing-headline-accent">limits</span>
          </Motion.h1>
          <Motion.p
            className="landing-hero-description"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
          >
            A home for curious minds to practice, compete, and become the kind of
            developer they once looked up to.
          </Motion.p>
          <Motion.div
            className="landing-hero-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34 }}
          >
            <NavLink to="/signup" className="landing-button">
              Start your journey <ArrowRight size={17} />
            </NavLink>
            <a href="#features" className="landing-text-link">
              See what’s inside <ArrowDown size={15} />
            </a>
          </Motion.div>
          <Motion.div
            className="landing-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <div className="landing-proof-icons" aria-hidden="true">
              <span><Braces size={15} /></span>
              <span><Flame size={15} /></span>
              <span><UsersRound size={15} /></span>
            </div>
            <p><strong>One platform.</strong> A whole community of builders.</p>
          </Motion.div>
        </div>

        <Motion.div
          className="landing-hero-art"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-art-orbit landing-art-orbit-one" />
          <div className="landing-art-orbit landing-art-orbit-two" />
          <div className="landing-art-glow" />
          <div className="landing-float-tag landing-float-tag-top">
            <span className="landing-tag-icon"><Zap size={15} /></span>
            <span><strong>Consistency</strong><small>is your superpower</small></span>
          </div>
          <div className="landing-code-card">
            <div className="landing-code-topbar">
              <div className="landing-window-dots"><i /><i /><i /></div>
              <span className="landing-file-name"><Code2 size={13} /> your-next-level.js</span>
              <span className="landing-code-status"><span /> LIVE</span>
            </div>
            <div className="landing-code-body">
              <div className="landing-code-gutter">
                {codeLines.map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}
              </div>
              <pre>{codeLines.map((line, index) => <code key={index}>{line}{'\n'}</code>)}</pre>
              <span className="landing-cursor" aria-hidden="true" />
            </div>
            <div className="landing-code-footer">
              <span><span className="landing-footer-check"><Check size={10} /></span> No setup. Just start.</span>
              <span>JavaScript&nbsp; · &nbsp;Ready</span>
            </div>
          </div>
          <div className="landing-float-tag landing-float-tag-bottom">
            <span className="landing-streak-icon"><Flame size={17} fill="currentColor" /></span>
            <span><strong>Day 01</strong><small>the streak begins</small></span>
            <Sparkles size={16} className="landing-sparkle" />
          </div>
          <div className="landing-art-caption">SMALL STEPS. BIG BREAKTHROUGHS.</div>
        </Motion.div>
      </section>

      <section className="landing-marquee" aria-label="CodeMaster features">
        <div className="landing-marquee-track">
          {[0, 1].map((copy) => (
            <div className="landing-marquee-group" key={copy} aria-hidden={copy === 1}>
              <span>Practice with purpose</span><i />
              <span>Compete with friends</span><i />
              <span>Build real momentum</span><i />
              <span>Become a better you</span><i />
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <div>
            <span className="landing-section-kicker">MADE FOR YOUR MOMENTUM</span>
            <h2>More than practice.<br /><span>Your next chapter.</span></h2>
          </div>
          <p>Everything you need to turn “I should learn that” into “I just built that.”</p>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon, number, title, description, link, label }, index) => (
            <Motion.article
              className="landing-feature-card"
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
            >
              <div className="landing-feature-top">
                <span className="landing-feature-icon">{icon}</span>
                <span className="landing-feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <NavLink to={link} className="landing-feature-link">{label}<ArrowRight size={15} /></NavLink>
            </Motion.article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta" id="about">
        <div className="landing-cta-glow" aria-hidden="true" />
        <span className="landing-section-kicker">THE ONLY WRONG MOVE IS NOT STARTING</span>
        <h2>Your future self<br /><span>is rooting for you.</span></h2>
        <p>Make today the day you write your first line.</p>
        <NavLink to="/signup" className="landing-button">
          Create your free account <ArrowRight size={17} />
        </NavLink>
        <div className="landing-cta-scribble" aria-hidden="true">{'{ }'}</div>
      </section>

      <footer className="landing-footer">
        <Logo size="sm" />
        <p>Made for the ones who keep going. <span>© CodeMaster</span></p>
        <div><NavLink to="/login">Log in</NavLink><NavLink to="/signup">Join CodeMaster</NavLink></div>
      </footer>
    </main>
  );
}

export default LandingPage;
