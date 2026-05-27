import { useState } from "react";

const FAQS = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and click 'Forgot Password'. Enter your registered email and we'll send a reset link within a few minutes.",
  },
  {
    q: "Can I use CodeMaster for free?",
    a: "Yes! CodeMaster has a generous free tier with access to 200+ problems, DSA visualizations, and daily challenges. Premium unlocks all 2400+ problems and advanced features.",
  },
  {
    q: "How does the ranking system work?",
    a: "Your global rank is calculated based on problems solved, difficulty weights, submission accuracy, and consistency streak. It updates in real-time after each accepted submission.",
  },
  {
    q: "Which programming languages are supported?",
    a: "We support Python, JavaScript, C++, Java, TypeScript, Go, Rust, and C. More languages are being added — drop us a request below!",
  },
  {
    q: "How do I report a bug in a problem?",
    a: "Use the 'Report' button on any problem page, or send us the problem ID + description via the contact form. Our team reviews all reports within 24 hours.",
  },
  {
    q: "Is there a mobile app?",
    a: "A mobile app is on our roadmap! Currently CodeMaster is fully responsive and works great in mobile browsers. Sign up to get notified when the app launches.",
  },
];

const SOCIAL = [
  { name: "GitHub",   icon: "⌥", handle: "@codemaster-dev",  url: "#", color: "#e6edf3" },
  { name: "Twitter",  icon: "✦", handle: "@codemasterio",    url: "#", color: "#4493f8" },
  { name: "Discord",  icon: "◈", handle: "discord.gg/cm",    url: "#", color: "#c084fc" },
  { name: "LinkedIn", icon: "◉", handle: "CodeMaster",       url: "#", color: "#00b86b" },
];

const SUPPORT_CARDS = [
  {
    icon: "⚡",
    title: "Instant Help",
    desc: "Browse our docs and community answers for immediate solutions.",
    label: "View Docs",
    accent: "#ffa116",
    bg: "#1e1608",
    bdr: "#3a2e0f",
  },
  {
    icon: "◎",
    title: "Community",
    desc: "Ask questions, share solutions, and help others in our Discord.",
    label: "Join Discord",
    accent: "#c084fc",
    bg: "#120d1e",
    bdr: "#2a1a3a",
  },
  {
    icon: "◈",
    title: "Email Support",
    desc: "Get a personal reply from our team within 24 hours.",
    label: "support@codemaster.io",
    accent: "#4493f8",
    bg: "#0a1220",
    bdr: "#1c2a3a",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General Question", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [focused, setFocused] = useState(null);

  const subjects = ["General Question", "Bug Report", "Feature Request", "Billing", "Account Issue", "Problem Error"];

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name    = "Name is required";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email  = "Valid email required";
    if (!form.message.trim())                     e.message = "Message cannot be empty";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSending(true);
    await new Promise(r => setTimeout(r, 1600));
    setSending(false);
    setSent(true);
  };

  const fieldStyle = (name) => ({
    width: "100%",
    background: focused === name ? "#1c2130" : "#161b22",
    border: `1px solid ${errors[name] ? "#ff4444" : focused === name ? "#ffa116" : "#21262d"}`,
    borderRadius: 8,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    padding: "10px 14px",
    outline: "none",
    transition: "all 0.15s",
    resize: "none",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ct-root {
          min-height: 100vh;
          background: #0d1117;
          color: #e6edf3;
          font-family: 'Segoe UI', -apple-system, sans-serif;
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #161b22; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

        /* ── TOPBAR ── */
        .ct-topbar {
          height: 48px; background: #161b22;
          border-bottom: 1px solid #21262d;
          display: flex; align-items: center;
          padding: 0 20px; gap: 8px;
          position: sticky; top: 0; z-index: 20;
        }
        .ct-logo-icon {
          width: 28px; height: 28px; border-radius: 6px;
          background: linear-gradient(135deg, #ffa116, #ff6b00);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #0d1117;
        }
        .ct-logo-text { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .ct-sep { width: 1px; height: 20px; background: #21262d; margin: 0 4px; }
        .ct-crumb { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8b949e; }
        .ct-crumb span { color: #ffa116; }
        .ct-topbar-badge {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          font-weight: 600; letter-spacing: 1px;
          color: #00b86b; background: #0f2a1a;
          border: 1px solid #1a3a2a; border-radius: 20px;
          padding: 2px 10px; display: flex; align-items: center; gap: 5px;
        }
        .ct-topbar-badge::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: #00b86b; box-shadow: 0 0 6px #00b86b;
          animation: ct-pulse 2s ease-in-out infinite;
        }
        @keyframes ct-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }

        /* ── HERO ── */
        .ct-hero {
          max-width: 960px; margin: 0 auto;
          padding: 56px 24px 0;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
        }
        .ct-hero-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase;
          color: #ffa116; background: #1e1608;
          border: 1px solid #3a2e0f; border-radius: 4px;
          padding: 3px 12px; margin-bottom: 20px;
        }
        .ct-hero-h1 {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 400; line-height: 1.15;
          letter-spacing: -0.02em; color: #f1f5f9;
          margin-bottom: 14px;
        }
        .ct-hero-h1 em { font-style: italic; color: #ffa116; }
        .ct-hero-sub {
          font-size: 14px; color: #8b949e; line-height: 1.75;
          max-width: 460px; margin-bottom: 40px;
        }

        /* ── SUPPORT CARDS ROW ── */
        .ct-support-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px; width: 100%;
          margin-bottom: 0;
        }
        .ct-support-card {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; padding: 18px 16px;
          display: flex; flex-direction: column; gap: 8px;
          transition: border-color 0.15s, transform 0.18s;
          cursor: pointer; text-align: left;
          position: relative; overflow: hidden;
        }
        .ct-support-card::after {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: var(--sc-accent);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.22s ease;
        }
        .ct-support-card:hover { border-color: var(--sc-bdr); transform: translateY(-2px); }
        .ct-support-card:hover::after { transform: scaleX(1); }
        .ct-sc-icon {
          width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; background: var(--sc-bg);
          border: 1px solid var(--sc-bdr);
          color: var(--sc-accent);
        }
        .ct-sc-title { font-size: 13px; font-weight: 700; }
        .ct-sc-desc  { font-size: 11px; color: #8b949e; line-height: 1.6; flex: 1; }
        .ct-sc-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: var(--sc-accent);
          display: flex; align-items: center; gap: 5px;
        }
        .ct-sc-label::after { content: '→'; transition: transform 0.15s; }
        .ct-support-card:hover .ct-sc-label::after { transform: translateX(3px); }

        /* ── MAIN LAYOUT ── */
        .ct-main {
          max-width: 960px; margin: 0 auto;
          padding: 0 24px 80px;
        }
        .ct-divider { height: 1px; background: #21262d; margin: 40px 0 32px; }

        /* ── SECTION LABEL ── */
        .ct-sec-label {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .ct-sec-label-bar { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }
        .ct-sec-label-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase; color: #495366;
        }
        .ct-sec-label-line { flex: 1; height: 1px; background: #21262d; }

        /* ── FORM + INFO GRID ── */
        .ct-form-grid {
          display: grid; grid-template-columns: 1.1fr 0.9fr;
          gap: 20px; align-items: start;
        }

        /* ── FORM CARD ── */
        .ct-form-card {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 12px; overflow: hidden;
        }
        .ct-form-card-header {
          padding: 14px 20px; border-bottom: 1px solid #21262d;
          background: #0d1117; display: flex; align-items: center; gap: 8px;
        }
        .ct-form-header-dot { width: 5px; height: 5px; border-radius: 50%; background: #ffa116; }
        .ct-form-header-title {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #495366;
        }
        .ct-form-body { padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; }

        .ct-field-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: #495366; margin-bottom: 5px;
        }
        .ct-field-error {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #ff4444; margin-top: 4px;
        }
        .ct-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .ct-submit-btn {
          width: 100%; padding: 11px;
          background: #ffa116; color: #0d1117;
          border: none; border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.5px;
          transition: all 0.15s; display: flex;
          align-items: center; justify-content: center; gap: 8px;
        }
        .ct-submit-btn:hover:not(:disabled) { background: #ffb347; transform: translateY(-1px); }
        .ct-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .ct-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ct-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0d1117; border-radius: 50%;
          animation: ct-spin 0.7s linear infinite;
        }
        @keyframes ct-spin { to { transform: rotate(360deg); } }

        /* ── SUCCESS ── */
        .ct-success {
          background: #0f2a1a; border: 1px solid #1a3a2a;
          border-radius: 12px; padding: 40px 24px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 12px;
        }
        .ct-success-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: #1a3a2a; border: 2px solid #00b86b;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          box-shadow: 0 0 24px #00b86b44;
        }
        .ct-success-h { font-size: 18px; font-weight: 700; color: #00b86b; }
        .ct-success-p { font-size: 13px; color: #8b949e; line-height: 1.65; max-width: 300px; }

        /* ── INFO SIDE ── */
        .ct-info-side { display: flex; flex-direction: column; gap: 14px; }

        .ct-info-card {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; overflow: hidden;
        }
        .ct-info-card-hdr {
          padding: 11px 16px; border-bottom: 1px solid #21262d;
          background: #0d1117;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          color: #495366; display: flex; align-items: center; gap: 7px;
        }
        .ct-info-card-dot { width: 5px; height: 5px; border-radius: 50%; }
        .ct-info-card-body { padding: 14px 16px; }

        /* Social links */
        .ct-social-list { display: flex; flex-direction: column; gap: 8px; }
        .ct-social-row {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 12px; border-radius: 8px;
          background: #0d1117; border: 1px solid #21262d;
          text-decoration: none; color: #e6edf3;
          transition: border-color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .ct-social-row:hover { border-color: var(--sc-color); background: #161b22; }
        .ct-social-icon {
          width: 32px; height: 32px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
          background: var(--sc-bg); border: 1px solid var(--sc-bdr);
          color: var(--sc-color);
        }
        .ct-social-name { font-size: 13px; font-weight: 600; }
        .ct-social-handle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #495366; margin-top: 1px;
        }
        .ct-social-arrow { margin-left: auto; color: #495366; font-size: 13px; transition: transform 0.15s, color 0.15s; }
        .ct-social-row:hover .ct-social-arrow { transform: translateX(3px); color: var(--sc-color); }

        /* Response time card */
        .ct-response-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #21262d; border-radius: 8px; overflow: hidden; }
        .ct-rt-cell { background: #0d1117; padding: 12px 14px; }
        .ct-rt-val { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; line-height: 1; margin-bottom: 3px; }
        .ct-rt-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #495366; letter-spacing: 1px; text-transform: uppercase; }

        /* ── FAQ ── */
        .ct-faq-list { display: flex; flex-direction: column; gap: 8px; }
        .ct-faq-item {
          background: #161b22; border: 1px solid #21262d;
          border-radius: 10px; overflow: hidden;
          transition: border-color 0.15s;
        }
        .ct-faq-item.open { border-color: #3a2e0f; }
        .ct-faq-q {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; cursor: pointer;
          font-size: 13px; font-weight: 600; color: #e6edf3;
          user-select: none;
          transition: color 0.15s;
          gap: 12px;
        }
        .ct-faq-item.open .ct-faq-q { color: #ffa116; }
        .ct-faq-chevron {
          font-size: 11px; color: #495366; flex-shrink: 0;
          transition: transform 0.2s, color 0.15s;
          font-family: 'JetBrains Mono', monospace;
        }
        .ct-faq-item.open .ct-faq-chevron { transform: rotate(180deg); color: #ffa116; }
        .ct-faq-a {
          padding: 0 18px; max-height: 0; overflow: hidden;
          font-size: 13px; color: #8b949e; line-height: 1.75;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        .ct-faq-item.open .ct-faq-a { max-height: 200px; padding: 0 18px 16px; }
        .ct-faq-divider { height: 1px; background: #21262d; margin: 0 18px; }
        .ct-faq-item.open .ct-faq-divider { background: #3a2e0f; }

        /* ── ANIMATIONS ── */
        @keyframes ct-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ct-hero     { animation: ct-fadein 0.4s ease both 0.05s; }
        .ct-sup-row  { animation: ct-fadein 0.4s ease both 0.15s; }
        .ct-form-grid{ animation: ct-fadein 0.4s ease both 0.1s; }
        .ct-faq-wrap { animation: ct-fadein 0.4s ease both 0.15s; }

        @media (max-width: 700px) {
          .ct-form-grid  { grid-template-columns: 1fr; }
          .ct-support-row{ grid-template-columns: 1fr; }
          .ct-field-row  { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ct-root">

        {/* TOPBAR */}
        <div className="ct-topbar">
          <div className="ct-logo-icon">⌨</div>
          <span className="ct-logo-text">CodeMaster</span>
          <div className="ct-sep" />
          <span className="ct-crumb">Home / <span>Contact</span></span>
          <div className="ct-topbar-badge">Support Online</div>
        </div>

        {/* HERO */}
        <div className="ct-hero">
          <div className="ct-hero-tag">Get In Touch</div>
          <h1 className="ct-hero-h1">
            We're here to <em>help you</em><br />
            every step of the way
          </h1>
          <p className="ct-hero-sub">
            Have a question, found a bug, or want to suggest a feature?
            Our team usually responds within a few hours.
          </p>

          {/* Support cards */}
          <div className="ct-support-row ct-sup-row">
            {SUPPORT_CARDS.map((c) => (
              <div key={c.title} className="ct-support-card" style={{ "--sc-accent": c.accent, "--sc-bg": c.bg, "--sc-bdr": c.bdr }}>
                <div className="ct-sc-icon">{c.icon}</div>
                <div className="ct-sc-title">{c.title}</div>
                <div className="ct-sc-desc">{c.desc}</div>
                <div className="ct-sc-label">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div className="ct-main">
          <div className="ct-divider" />

          {/* Section label */}
          <div className="ct-sec-label">
            <div className="ct-sec-label-bar" style={{ background: "#ffa116" }} />
            <span className="ct-sec-label-text">Send a Message</span>
            <div className="ct-sec-label-line" />
          </div>

          {/* Form + Info */}
          <div className="ct-form-grid">

            {/* FORM */}
            <div className="ct-form-card">
              <div className="ct-form-card-header">
                <div className="ct-form-header-dot" />
                <span className="ct-form-header-title">Contact Form</span>
                <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#495366" }}>
                  All fields required*
                </span>
              </div>

              {sent ? (
                <div className="ct-form-body">
                  <div className="ct-success">
                    <div className="ct-success-icon">✓</div>
                    <div className="ct-success-h">Message Sent!</div>
                    <p className="ct-success-p">
                      Thanks for reaching out. We've received your message and will reply to <strong style={{ color: "#e6edf3" }}>{form.email}</strong> within 24 hours.
                    </p>
                    <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "General Question", message: "" }); }}
                      style={{ marginTop: 8, background: "#1a3a2a", border: "1px solid #1a3a2a", borderRadius: 7, color: "#00b86b", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, padding: "7px 18px", cursor: "pointer" }}>
                      Send Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ct-form-body">
                  {/* Name + Email */}
                  <div className="ct-field-row">
                    <div>
                      <div className="ct-field-label">Your Name</div>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Arjun Sharma"
                        style={fieldStyle("name")}
                        onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                      />
                      {errors.name && <div className="ct-field-error">⚠ {errors.name}</div>}
                    </div>
                    <div>
                      <div className="ct-field-label">Email Address</div>
                      <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="arjun@email.com"
                        style={fieldStyle("email")}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      />
                      {errors.email && <div className="ct-field-error">⚠ {errors.email}</div>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <div className="ct-field-label">Subject</div>
                    <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      style={{ ...fieldStyle("subject"), cursor: "pointer" }}>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <div className="ct-field-label">Message</div>
                    <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Describe your question or issue in detail…"
                      rows={5}
                      style={fieldStyle("message")}
                      onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      {errors.message
                        ? <div className="ct-field-error">⚠ {errors.message}</div>
                        : <span />}
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: form.message.length > 400 ? "#ff4444" : "#495366" }}>
                        {form.message.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button className="ct-submit-btn" onClick={handleSubmit} disabled={sending}>
                    {sending ? (
                      <><div className="ct-spinner" /> Sending…</>
                    ) : (
                      <>↑ Send Message</>
                    )}
                  </button>

                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#495366", textAlign: "center" }}>
                    We respect your privacy. No spam, ever.
                  </p>
                </div>
              )}
            </div>

            {/* INFO SIDE */}
            <div className="ct-info-side">

              {/* Response times */}
              <div className="ct-info-card">
                <div className="ct-info-card-hdr">
                  <div className="ct-info-card-dot" style={{ background: "#00b86b" }} />
                  Response Times
                </div>
                <div className="ct-info-card-body">
                  <div className="ct-response-grid">
                    {[
                      { val: "< 2h",   label: "Email (avg)",    color: "#00b86b" },
                      { val: "< 5min", label: "Discord",        color: "#c084fc" },
                      { val: "24h",    label: "Bug Reports",    color: "#ffa116" },
                      { val: "48h",    label: "Feature Req.",   color: "#4493f8" },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="ct-rt-cell">
                        <div className="ct-rt-val" style={{ color }}>{val}</div>
                        <div className="ct-rt-label">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="ct-info-card">
                <div className="ct-info-card-hdr">
                  <div className="ct-info-card-dot" style={{ background: "#4493f8" }} />
                  Find Us Online
                </div>
                <div className="ct-info-card-body">
                  <div className="ct-social-list">
                    {SOCIAL.map((s) => (
                      <a key={s.name} href={s.url} className="ct-social-row"
                        style={{ "--sc-color": s.color, "--sc-bg": s.color + "18", "--sc-bdr": s.color + "40" }}>
                        <div className="ct-social-icon">{s.icon}</div>
                        <div>
                          <div className="ct-social-name">{s.name}</div>
                          <div className="ct-social-handle">{s.handle}</div>
                        </div>
                        <div className="ct-social-arrow">→</div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Office hours */}
              <div className="ct-info-card">
                <div className="ct-info-card-hdr">
                  <div className="ct-info-card-dot" style={{ background: "#ffa116" }} />
                  Support Hours
                </div>
                <div className="ct-info-card-body">
                  {[
                    ["Mon – Fri", "9 AM – 8 PM IST", "#00b86b"],
                    ["Saturday",  "10 AM – 4 PM IST", "#ffa116"],
                    ["Sunday",    "Community Only",   "#495366"],
                  ].map(([day, time, color]) => (
                    <div key={day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #21262d" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#8b949e" }}>{day}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color }}>{time}</span>
                    </div>
                  ))}
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#495366", marginTop: 10, lineHeight: 1.6 }}>
                    Timezone: IST (UTC+5:30). For urgent issues outside hours, use Discord.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="ct-divider" />

          {/* FAQ */}
          <div className="ct-faq-wrap">
            <div className="ct-sec-label">
              <div className="ct-sec-label-bar" style={{ background: "#c084fc" }} />
              <span className="ct-sec-label-text">Frequently Asked Questions</span>
              <div className="ct-sec-label-line" />
            </div>

            <div className="ct-faq-list">
              {FAQS.map((faq, i) => (
                <div key={i} className={`ct-faq-item${openFaq === i ? " open" : ""}`}>
                  <div className="ct-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className="ct-faq-chevron">▼</span>
                  </div>
                  <div className="ct-faq-divider" />
                  <div className="ct-faq-a">{faq.a}</div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{
              marginTop: 28, background: "#161b22",
              border: "1px solid #21262d", borderRadius: 12,
              padding: "24px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 6 }}>
                  Still have questions?
                </div>
                <div style={{ fontSize: 13, color: "#8b949e" }}>
                  Can't find your answer? Our team is ready to help.
                </div>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{
                  background: "#ffa116", color: "#0d1117", border: "none",
                  borderRadius: 8, padding: "10px 22px",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  letterSpacing: 0.3,
                }}
                onMouseEnter={e => { e.target.style.background = "#ffb347"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background = "#ffa116"; e.target.style.transform = "none"; }}
              >
                ↑ Contact Us →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}