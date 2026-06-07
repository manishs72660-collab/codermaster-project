import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

const DuelLeaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [lbRes, statsRes] = await Promise.all([
          axiosClient.get('/duel/leaderboard'),
          axiosClient.get('/duel/stats')
        ]);
        setLeaderboard(lbRes.data);
        setMyStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getRankColor = (i) => {
    if (i === 0) return '#ffd700';
    if (i === 1) return '#c0c0c0';
    if (i === 2) return '#cd7f32';
    return '#484f58';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0e1117' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #1c2535', borderTop: '3px solid #ffa116', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#0e1117', color: '#e6edf3',
      fontFamily: "'Outfit', system-ui, sans-serif", padding: '40px 20px'
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>🏆 Duel Leaderboard</h1>
            <p style={{ color: '#7d8590', fontSize: 13, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>Top players by ELO rating</p>
          </div>
          <button
            onClick={() => navigate('/duel')}
            style={{
              background: 'linear-gradient(135deg, #ffa116, #e08a00)',
              color: '#0e1117', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontWeight: 700, cursor: 'pointer',
              fontSize: 13, fontFamily: "'Outfit', sans-serif"
            }}
          >
            ⚔ New Duel
          </button>
        </div>

        {/* My Stats */}
        {myStats && (
          <div style={{
            background: '#161b22', border: '1px solid rgba(255,161,22,0.3)',
            borderRadius: 14, padding: '20px 24px', marginBottom: 24,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16
          }}>
            {[
              { label: 'Rating', value: myStats.rating, color: '#ffa116' },
              { label: 'Wins', value: myStats.wins, color: '#3fb950' },
              { label: 'Losses', value: myStats.losses, color: '#f85149' },
              { label: 'Win Rate', value: `${myStats.winRate}%`, color: '#388bfd' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, overflow: 'hidden' }}>
          {leaderboard.map((entry, i) => (
            <div key={entry._id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px',
              borderBottom: i < leaderboard.length - 1 ? '1px solid #21262d' : 'none',
              background: i < 3 ? `rgba(${i === 0 ? '255,215,0' : i === 1 ? '192,192,192' : '205,127,50'},0.04)` : 'transparent'
            }}>
              {/* Rank */}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
                fontSize: i < 3 ? 16 : 13,
                color: getRankColor(i),
                background: '#0d1117', border: `1px solid ${getRankColor(i)}30`
              }}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {entry.userId?.firstName || 'Unknown'}
                </div>
                <div style={{ fontSize: 11, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace" }}>
                  {entry.wins}W · {entry.losses}L · {entry.totalDuels} duels
                </div>
              </div>

              {/* Rating */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffa116', fontFamily: "'JetBrains Mono', monospace" }}>
                  {entry.rating}
                </div>
                <div style={{ fontSize: 10, color: '#7d8590', fontFamily: "'JetBrains Mono', monospace" }}>ELO</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DuelLeaderboard;