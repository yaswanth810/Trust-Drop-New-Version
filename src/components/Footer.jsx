import { Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '40px 0 32px',
      marginTop: 80,
    }}>
      <div className="page-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, marginBottom: 32 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, background: 'var(--accent)', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: 'var(--text)' }}>
                Trust<span style={{ color: 'var(--accent)' }}>Drop</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 260, lineHeight: 1.6 }}>
              Blockchain-powered NGO fund transparency. Every rupee tracked on Polygon.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>Platform</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>Home</Link>
                <Link to="/create" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>Create Campaign</Link>
                <Link to="/validator" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>Validator Dashboard</Link>
                <Link to="/analytics" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>Analytics</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>Resources</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://amoy.polygonscan.com/address/0xEe993650Aa439206D2ec0725413AfE3B9e74b37C" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Contract <ExternalLink size={10} />
                </a>
                <a href="https://github.com/yaswanth810/Trust-Drop" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  GitHub <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 20,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            © 2026 TrustDrop. Built on Polygon Amoy.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
              fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            }}>
              <span className="status-dot live" style={{ width: 5, height: 5 }} />
              Polygon Amoy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
