export default function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 16px' }}>
        <div className="animate-shimmer" style={{ width: 80, height: 20, borderRadius: 'var(--radius-pill)', marginBottom: 12 }} />
        <div className="animate-shimmer" style={{ width: '80%', height: 18, borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
        <div className="animate-shimmer" style={{ width: '60%', height: 14, borderRadius: 'var(--radius-sm)', marginBottom: 20 }} />
        <div className="animate-shimmer" style={{ width: '100%', height: 5, borderRadius: 'var(--radius-pill)', marginBottom: 8 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="animate-shimmer" style={{ width: 80, height: 14, borderRadius: 'var(--radius-sm)' }} />
          <div className="animate-shimmer" style={{ width: 60, height: 14, borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
        <div className="animate-shimmer" style={{ width: 120, height: 14, borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );
}
