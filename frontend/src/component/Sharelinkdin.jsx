const ShareOnLinkedIn = ({ problem, runtime, memory, language }) => {
  const text = `🎉 Just solved "${problem?.title}" (${problem?.difficulty}) on CodeMaster!\n\n⚡ Runtime: ${runtime}s | 💾 Memory: ${memory}KB | 🔤 ${language}\n\n#DSA #Coding #Programming #${language}`;

  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    `https://codemaster.dev/problems/${problem?._id}`
  )}&summary=${encodeURIComponent(text)}`;

  return (
    <button
      onClick={() => window.open(shareUrl, '_blank', 'width=600,height=600')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#0A66C2', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        padding: '9px 18px', fontSize: 13, fontWeight: 700,
        fontFamily: "'Outfit', system-ui, sans-serif",
        boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
        transition: 'all 0.16s', marginTop: 16,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#004182';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 6px 22px rgba(10,102,194,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#0A66C2';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,102,194,0.35)';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Share on LinkedIn
    </button>
  );
};

export default ShareOnLinkedIn;