import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { uploadToIPFS } from '../utils/ipfs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, FileText, Globe, Hash, Tag, Loader2,
  CheckCircle2, Info, ArrowRight, Shield
} from 'lucide-react';
import Footer from '../components/Footer';

const CATEGORIES = ['Relief', 'Education', 'Medical', 'Infrastructure', 'Environment'];

export default function RegisterNGO() {
  const { contract, account, isConnected, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mission: '',
    website: '',
    darpanId: '',
    category: 'Relief',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mission' && value.length > 200) return;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) return toast.error('Connect wallet first');
    if (!form.name.trim()) return toast.error('Organisation name is required');
    if (!form.mission.trim()) return toast.error('Mission statement is required');

    try {
      setLoading(true);
      toast.loading('Uploading profile to IPFS...', { id: 'ngo-reg' });

      // 1. Upload metadata JSON to IPFS
      const metadata = {
        name: form.name.trim(),
        mission: form.mission.trim(),
        website: form.website.trim(),
        darpanId: form.darpanId.trim(),
        category: form.category,
        registeredBy: account,
        registeredAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const file = new File([blob], 'ngo-profile.json', { type: 'application/json' });
      const ipfsHash = await uploadToIPFS(file);

      if (!ipfsHash) throw new Error('IPFS upload failed');

      toast.loading('Registering on blockchain...', { id: 'ngo-reg' });

      // 2. Call registerNGO on contract
      const tx = await contract.registerNGO(ipfsHash);
      await tx.wait();

      toast.success('NGO registered successfully!', { id: 'ngo-reg' });
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.reason || err.message || 'Registration failed';
      toast.error(msg.length > 80 ? msg.slice(0, 80) + '...' : msg, { id: 'ngo-reg' });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100 }}>
        <div className="page-container" style={{ maxWidth: 520, textAlign: 'center' }}>
          <div className="card" style={{ padding: 48 }}>
            <Building2 size={40} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8 }}>Register Your NGO</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
              Connect your wallet to register your organisation on-chain.
            </p>
            <button onClick={connectWallet} className="btn-primary btn-lg" style={{ margin: '0 auto' }}>
              Connect Wallet <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100 }}>
        <div className="page-container" style={{ maxWidth: 520, textAlign: 'center' }}>
          <motion.div className="card" style={{ padding: 48 }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={28} style={{ color: 'var(--green)' }} />
            </div>
            <h2 style={{ marginBottom: 8 }}>NGO Registered!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8 }}>
              Your organisation has been registered on the blockchain.
            </p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>
              A <strong style={{ color: 'var(--accent)' }}>Verified NGO ✓</strong> badge will appear on your campaigns after admin approval.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => navigate('/create')} className="btn-primary">
                Create Campaign <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary">
                Home
              </button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100 }}>
      <div className="page-container" style={{ maxWidth: 600 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Building2 size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 style={{ fontSize: 28 }}>Register Your NGO</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
              Create an on-chain identity for your organisation to start campaigns.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: 28 }}>
              {/* Organisation Name */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={13} /> Organisation Name *
                </label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="input-field" placeholder="e.g. Helping Hands Foundation"
                  required />
              </div>

              {/* Mission Statement */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> Mission Statement *</span>
                  <span style={{ fontWeight: 400, color: 'var(--text3)' }}>{form.mission.length}/200</span>
                </label>
                <textarea name="mission" value={form.mission} onChange={handleChange}
                  className="input-field" placeholder="Briefly describe your organisation's mission..."
                  maxLength={200} required style={{ minHeight: 80 }} />
              </div>

              {/* Website */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe size={13} /> Website URL
                </label>
                <input name="website" type="url" value={form.website} onChange={handleChange}
                  className="input-field" placeholder="https://yourorganisation.org" />
              </div>

              {/* DARPAN ID */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Hash size={13} /> DARPAN ID
                  <span style={{ position: 'relative', cursor: 'help' }} title="DARPAN is India's government NGO registration portal (ngo.darpan.gov.in). Providing your DARPAN ID helps verify your organisation.">
                    <Info size={12} style={{ color: 'var(--text3)' }} />
                  </span>
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text3)' }}>(optional)</span>
                </label>
                <input name="darpanId" value={form.darpanId} onChange={handleChange}
                  className="input-field" placeholder="e.g. AP/2024/0123456" />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={13} /> Category *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))}
                      style={{
                        padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 500,
                        border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                        background: form.category === cat ? 'var(--accent)' : 'var(--surface)',
                        color: form.category === cat ? '#fff' : 'var(--text2)',
                        borderColor: form.category === cat ? 'var(--accent)' : 'var(--border)',
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div style={{
                display: 'flex', gap: 8, padding: 12, borderRadius: 'var(--radius)',
                background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
                fontSize: 12, color: 'var(--accent)', marginBottom: 20,
              }}>
                <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Your profile data is stored on IPFS and linked on-chain. Admin verification adds a <strong>Verified ✓</strong> badge to your campaigns.</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Registering...</>
                ) : (
                  <>Register NGO <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
