import { motion } from 'framer-motion';
import { Award, Share2 } from 'lucide-react';

const TIERS = [
  { name: 'Bronze Supporter', color: '#D97706', threshold: '$10+', emoji: '🥉' },
  { name: 'Silver Supporter', color: '#9CA3AF', threshold: '$50+', emoji: '🥈' },
  { name: 'Gold Supporter', color: '#FBBF24', threshold: '$100+', emoji: '🥇' },
  { name: 'Platinum Guardian', color: '#A78BFA', threshold: '$500+', emoji: '💎' },
];

export default function BadgeShowcase({ totalDonated = '0', campaignsSupported = 0 }) {
  const totalUSDC = parseFloat(totalDonated);
  const earnedTiers = [];
  if (totalUSDC >= 10) earnedTiers.push(0);
  if (totalUSDC >= 50) earnedTiers.push(1);
  if (totalUSDC >= 100) earnedTiers.push(2);
  if (totalUSDC >= 500) earnedTiers.push(3);

  const handleShare = (tier) => {
    const t = TIERS[tier];
    const text = `Just earned my ${t.name} badge on TrustDrop 🏆\nDonated ${totalDonated} USDC to verified NGO campaigns.\n#Web3ForGood #TrustDrop`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (earnedTiers.length === 0) {
    return (
      <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <Award size={36} style={{ color: 'var(--border2)', margin: '0 auto 10px' }} />
        <h4 style={{ marginBottom: 6 }}>No Badges Earned Yet</h4>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Donate to campaigns to earn NFT supporter badges!</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
          {TIERS.map((t, i) => <span key={i}>{t.emoji} {t.threshold}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} style={{ color: 'var(--accent)' }} /> Your NFT Badges
        </h4>
        <button onClick={() => handleShare(earnedTiers[earnedTiers.length - 1])} className="btn-secondary btn-sm">
          <Share2 size={11} /> Share
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {TIERS.map((tier, i) => {
          const earned = earnedTiers.includes(i);
          return (
            <motion.div key={i} initial={earned ? { opacity: 0, scale: 0.9 } : {}} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              className="card" style={{
                padding: 16, textAlign: 'center', overflow: 'hidden',
                ...(earned
                  ? { borderColor: tier.color + '30' }
                  : { opacity: 0.4, filter: 'grayscale(1)' }),
              }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{tier.emoji}</div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: earned ? tier.color : 'var(--text3)', marginBottom: 2 }}>{tier.name}</h4>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{tier.threshold} USDC</p>
              {earned ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
                  <div><span style={{ fontWeight: 700, color: tier.color, fontSize: 14 }}>{totalDonated}</span><br />USDC</div>
                  <div><span style={{ fontWeight: 700, color: tier.color, fontSize: 14 }}>{campaignsSupported}</span><br />Campaigns</div>
                </div>
              ) : (
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>🔒 Locked</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
