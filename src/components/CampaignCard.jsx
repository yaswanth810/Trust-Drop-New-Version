import { Link } from 'react-router-dom';
import { formatUSDC } from '../utils/helpers';
import { Clock, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function CampaignCard({ campaign }) {
  const {
    campaignId, title, description, raisedFunds, totalFunds,
    milestones, isEmergency, donorCount, ngo,
  } = campaign;

  const raised = Number(raisedFunds || 0) / 1_000_000;
  const total = Number(totalFunds || 0) / 1_000_000;
  const pct = total > 0 ? Math.min((raised / total) * 100, 100) : 0;
  const allComplete = milestones?.every((m) => m.fundsReleased);

  // Extract category from description prefix like "[Education]"
  const catMatch = description?.match(/^\[(\w+)\]/);
  const category = catMatch ? catMatch[1] : null;
  const cleanDesc = description?.replace(/^\[\w+\]\s*/, '') || '';

  // Next deadline
  const now = Date.now() / 1000;
  const nextDeadline = milestones?.find(m => !m.fundsReleased && m.deadline > now)?.deadline;
  const daysLeft = nextDeadline ? Math.max(0, Math.ceil((nextDeadline - now) / 86400)) : null;

  return (
    <Link to={`/campaign/${campaignId}`} style={{ textDecoration: 'none' }}>
      <div className="card card-interactive" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px' }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {isEmergency && (
              <span className="badge badge-emergency" style={{ fontSize: 10, padding: '2px 8px' }}>
                <AlertTriangle size={10} /> Emergency
              </span>
            )}
            {category && (
              <span className="badge badge-locked" style={{ fontSize: 10, padding: '2px 8px' }}>
                {category}
              </span>
            )}
            {allComplete && (
              <span className="badge badge-released" style={{ fontSize: 10, padding: '2px 8px' }}>
                Completed
              </span>
            )}
          </div>

          {/* Title */}
          <h4 style={{ marginBottom: 6, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </h4>

          {/* Description */}
          <p style={{
            fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 16,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {cleanDesc}
          </p>

          {/* Progress */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {raised.toLocaleString()} USDC
              </span>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                of {total.toLocaleString()} USDC
              </span>
            </div>
            <div className="progress-bar" style={{ height: 5 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
              <Users size={12} />
              {donorCount || 0} donors
            </span>
            {daysLeft !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
                <Clock size={12} />
                {daysLeft}d left
              </span>
            )}
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
            View <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
