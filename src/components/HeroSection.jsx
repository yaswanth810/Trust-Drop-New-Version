import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { ArrowRight, Shield, Globe, Lock } from 'lucide-react';

export default function HeroSection() {
  const { connectWallet, isConnected } = useWeb3();

  return (
    <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Subtle ambient gradient orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(108,92,231,0.06) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '55%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)' }} />
      </div>

      {/* Fine grid pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(var(--text3) 1px, transparent 1px), linear-gradient(90deg, var(--text3) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      <div className="page-container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {/* Trust Badge */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              borderRadius: 'var(--radius-pill)', background: 'var(--accent-light)',
              border: '1px solid var(--accent-border)', marginBottom: 32,
            }}>
            <Shield size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>Blockchain-Verified Transparency</span>
          </motion.div>

          {/* Main Heading */}
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Every Rupee.<br />
            Tracked. Trusted.<br />
            <span className="gradient-text">Transparent.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text2)', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Blockchain-powered NGO fund transparency platform. Donate with confidence, 
            knowing every milestone is verified by independent validators.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {!isConnected ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={connectWallet} className="btn-primary btn-lg"
                style={{ boxShadow: '0 6px 20px rgba(108,92,231,0.35)', fontSize: 16 }}>
                Connect Wallet <ArrowRight size={17} />
              </motion.button>
            ) : (
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                href="#campaigns" className="btn-primary btn-lg" style={{ fontSize: 16 }}>
                Browse Campaigns <ArrowRight size={17} />
              </motion.a>
            )}
            <a href="#how-it-works" className="btn-secondary btn-lg" style={{ fontSize: 16 }}>
              How It Works
            </a>
          </div>

          {/* UPI Badge */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px',
              borderRadius: 'var(--radius-pill)', background: 'var(--surface)',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            }}>
            <span style={{ fontSize: 16 }}>🇮🇳</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Donate in ₹ via UPI</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>No crypto needed</span>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 64, maxWidth: 900, margin: '64px auto 0' }}>
          {[
            { icon: Lock, title: 'Funds Locked', desc: 'Donations are held in smart contracts until milestones are verified' },
            { icon: Shield, title: 'Validator Verified', desc: '3/5 independent validators must approve before any funds release' },
            { icon: Globe, title: 'Fully Transparent', desc: 'Every transaction is recorded on-chain and publicly verifiable' },
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="card" style={{ padding: 24, textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <feature.icon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{feature.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
