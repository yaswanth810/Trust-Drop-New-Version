import { motion } from 'framer-motion';

const TIERS = [
  { min: 80, label: 'Highly Trusted', emoji: '🥇', color: '#B45309', gradient: ['#FBBF24', '#F59E0B'] },
  { min: 50, label: 'Trusted', emoji: '🥈', color: '#6B7280', gradient: ['#D1D5DB', '#9CA3AF'] },
  { min: 20, label: 'Building Trust', emoji: '🥉', color: '#D97706', gradient: ['#D97706', '#B45309'] },
  { min: 0, label: 'New / Unverified', emoji: '⚠️', color: '#DC2626', gradient: ['#F87171', '#EF4444'] },
];

function getTier(score) {
  return TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1];
}

export default function TrustScoreBadge({ score = 0, size = 'md', showLabel = true }) {
  const tier = getTier(score);

  const sizes = {
    sm: { svg: 32, radius: 12, stroke: 2, fontSize: 9 },
    md: { svg: 56, radius: 22, stroke: 3, fontSize: 14 },
    lg: { svg: 100, radius: 42, stroke: 3.5, fontSize: 24 },
    xl: { svg: 140, radius: 58, stroke: 5, fontSize: 36 },
  };

  const s = sizes[size] || sizes.md;
  const circ = 2 * Math.PI * s.radius;
  const prog = (score / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: s.svg, height: s.svg, position: 'relative' }}>
        <svg width={s.svg} height={s.svg} viewBox={`0 0 ${s.svg} ${s.svg}`}>
          <circle cx={s.svg / 2} cy={s.svg / 2} r={s.radius} fill="none" stroke="var(--border)" strokeWidth={s.stroke} />
          <motion.circle cx={s.svg / 2} cy={s.svg / 2} r={s.radius} fill="none"
            stroke={tier.color} strokeWidth={s.stroke} strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - prog }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 3px ${tier.color}30)` }} />
          <text x={s.svg / 2} y={s.svg / 2} textAnchor="middle" dominantBaseline="central"
            fill={tier.color} style={{ fontSize: s.fontSize, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
            {score}
          </text>
        </svg>
      </div>
      {showLabel && size !== 'sm' && (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px',
          borderRadius: 'var(--radius-pill)', background: `${tier.color}10`,
          color: tier.color, border: `1px solid ${tier.color}20`,
        }}>
          {tier.emoji} {tier.label}
        </span>
      )}
    </div>
  );
}

export { getTier, TIERS };
