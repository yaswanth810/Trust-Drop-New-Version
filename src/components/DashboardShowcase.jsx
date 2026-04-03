import { CheckCircle2, Clock, Lock, Shield, ExternalLink } from 'lucide-react';

const milestones = [
  { title: 'Purchase 500 food kits from local supplier', amount: '200', status: 'released', badge: 'Released' },
  { title: 'Transport kits to flood zone via truck', amount: '100', status: 'review', badge: 'In Review' },
  { title: 'Distribute to 500 families in 3 villages', amount: '200', status: 'locked', badge: 'Locked' },
];

const statusIcon = {
  released: <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />,
  review: <Clock size={16} style={{ color: 'var(--blue)' }} />,
  locked: <Lock size={14} style={{ color: 'var(--text3)' }} />,
};

const badgeStyle = {
  released: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' },
  review: { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)' },
  locked: { background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' },
};

export default function DashboardShowcase() {
  return (
    <div style={{
      maxWidth: 780, margin: '0 auto',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* Mock Top Bar */}
      <div style={{
        background: 'var(--text)', padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color="#fff" />
          <span style={{ color: '#fff', fontFamily: "'Instrument Serif', serif", fontSize: 14 }}>
            Trust<span style={{ color: '#4ADE80' }}>Drop</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['Home', 'Campaigns', 'Validator'].map(l => (
            <span key={l} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}>{l}</span>
          ))}
          <span style={{
            fontSize: 10, fontFamily: "'DM Mono', monospace",
            color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)',
            padding: '3px 8px', borderRadius: 'var(--radius-pill)',
          }}>0xBE90...34D</span>
        </div>
      </div>

      {/* Campaign Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            Vizag Flood Relief 2025
          </span>
          <span className="badge badge-emergency" style={{ fontSize: 10, padding: '2px 8px' }}>🚨 EMERGENCY</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
          NGO: 0xBE90...34D · Polygon Amoy
        </span>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid var(--border)',
      }}>
        {[
          { label: 'Total Raised', value: '850 USDC' },
          { label: 'Target', value: '1,000 USDC' },
          { label: 'Validators', value: '3/5 ✓' },
          { label: 'Time Left', value: '6 days' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '14px 16px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>85%</span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: '85%' }} />
        </div>
      </div>

      {/* Milestones */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {milestones.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius)',
              background: 'var(--surface2)',
            }}>
              {statusIcon[m.status]}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.title}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', fontFamily: "'DM Mono', monospace" }}>{m.amount} USDC</span>
              <span className="badge" style={{ ...badgeStyle[m.status], fontSize: 10, padding: '2px 8px' }}>{m.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {[
          { label: 'View on Polygonscan', icon: ExternalLink },
          { label: 'IPFS Proof', icon: ExternalLink },
          { label: 'Challenge', icon: Shield },
        ].map((a, i) => (
          <span key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 500, color: 'var(--accent)',
            cursor: 'pointer',
          }}>
            {a.label} <a.icon size={10} />
          </span>
        ))}
      </div>
    </div>
  );
}
