import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { donateToCampaign, getDonorBadgeInfo } from '../utils/contract';
import { formatUSDC, isValidUSDCAmount, getEtherscanUrl, fetchINRRate } from '../utils/helpers';
import { X, Wallet, Heart, ExternalLink, Loader2, CheckCircle2, Award, Sparkles, DollarSign, Info, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import TransakWidget from './TransakWidget';

const TIER_NAMES = ['Bronze Supporter', 'Silver Supporter', 'Gold Supporter', 'Platinum Guardian'];
const TIER_COLORS = ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2'];
const TIER_THRESHOLDS = [10, 50, 100, 500];
const TIER_IMAGES = ['/badges/bronze.png', '/badges/silver.png', '/badges/gold.png', '/badges/platinum.png'];

export default function DonateModal({ campaign, isOpen, onClose, onSuccess }) {
  const { contract, nftContract, signer, isConnected, connectWallet, account, usdcBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(null);
  const [prevTier, setPrevTier] = useState(-1);
  const [inrRate, setInrRate] = useState(null);
  const [activeTab, setActiveTab] = useState('upi');

  const quickAmounts = ['5', '10', '25', '50'];

  useEffect(() => { if (isOpen) fetchINRRate().then(setInrRate); }, [isOpen]);

  useEffect(() => {
    async function checkCurrentTier() {
      if (nftContract && account && isOpen) {
        try { const info = await getDonorBadgeInfo(nftContract, account); if (info) setPrevTier(info.highestTier); }
        catch { setPrevTier(-1); }
      }
    }
    checkCurrentTier();
  }, [nftContract, account, isOpen]);

  const inrEquivalent = amount && inrRate && !isNaN(parseFloat(amount))
    ? Math.round(parseFloat(amount) * inrRate).toLocaleString('en-IN') : null;

  const handleDonate = async () => {
    if (!isConnected) { connectWallet(); return; }
    if (!isValidUSDCAmount(amount)) { toast.error('Enter a valid USDC amount'); return; }
    if (parseFloat(amount) > parseFloat(usdcBalance)) { toast.error('Insufficient USDC balance'); return; }
    try {
      setLoading(true); setApproving(true); setBadgeEarned(null);
      toast.loading('Approving USDC...', { id: 'donate' });
      const tx = await donateToCampaign(contract, signer, campaign.campaignId, amount,
        () => { setApproving(false); toast.loading('Confirming donation...', { id: 'donate' }); });
      setTxHash(tx.hash);
      await tx.wait();
      toast.success('Donation confirmed! ✓', { id: 'donate' });
      setSuccess(true);
      if (nftContract && account) {
        try {
          const info = await getDonorBadgeInfo(nftContract, account);
          if (info && info.highestTier > prevTier) {
            const tier = info.highestTier;
            setBadgeEarned({ tier, name: TIER_NAMES[tier], image: TIER_IMAGES[tier], color: TIER_COLORS[tier] });
          }
        } catch {}
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.reason || 'Transaction failed', { id: 'donate' });
    } finally { setLoading(false); setApproving(false); }
  };

  const handleTransakSuccess = () => { toast.success('UPI payment successful!'); setSuccess(true); if (onSuccess) onSuccess(); };

  const handleClose = () => {
    setAmount(''); setTxHash(null); setSuccess(false); setBadgeEarned(null); setApproving(false); setActiveTab('upi'); onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="card" style={{ width: '100%', maxWidth: 440, padding: 24, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>

          <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', zIndex: 10 }}>
            <X size={18} />
          </button>

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {badgeEarned ? (
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <img src={badgeEarned.image} alt={badgeEarned.name} style={{ width: 100, height: 100, borderRadius: 'var(--radius-xl)', boxShadow: `0 0 40px ${badgeEarned.color}40` }} />
                    </motion.div>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                      style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} color="#fff" />
                    </motion.div>
                  </div>
                  <h3 style={{ marginBottom: 4 }}>🎉 Badge Earned!</h3>
                  <p style={{ fontWeight: 700, fontSize: 18, color: badgeEarned.color }}>{badgeEarned.name}</p>
                  <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>You contributed to {campaign.title}</p>
                </motion.div>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <CheckCircle2 size={52} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                  </motion.div>
                  <h3 style={{ marginBottom: 8 }}>Donation Successful!</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12 }}>
                    {amount ? `You contributed ${amount} USDC` : 'Your donation was received'}{inrEquivalent ? ` (≈ ₹${inrEquivalent})` : ''}
                  </p>
                  <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 16, textAlign: 'left' }}>
                    <p style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <Award size={11} style={{ color: 'var(--accent)' }} /> Badge Progress
                    </p>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {TIER_THRESHOLDS.map((t, i) => (
                        <div key={i} style={{ flex: 1 }}>
                          <div className="progress-bar" style={{ height: 4 }}>
                            <div className="progress-bar-fill" style={{ width: prevTier >= i ? '100%' : '0%', backgroundColor: TIER_COLORS[i] }} />
                          </div>
                          <p style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', marginTop: 2 }}>${t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {txHash && (
                <a href={getEtherscanUrl(txHash)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
                  View on Polygonscan <ExternalLink size={12} />
                </a>
              )}
              <button onClick={handleClose} className="btn-primary btn-full" style={{ marginTop: 20 }}>Done</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18 }}>Donate to Campaign</h3>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>{campaign.title}</p>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderRadius: 'var(--radius)', background: 'var(--surface2)', padding: 3, marginBottom: 20 }}>
                {[
                  { key: 'upi', icon: '🇮🇳', label: 'Pay with UPI ₹' },
                  { key: 'crypto', icon: <CreditCard size={13} />, label: 'Pay with Crypto' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      ...(activeTab === tab.key
                        ? { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }
                        : { background: 'transparent', color: 'var(--text3)' }),
                    }}>
                    {typeof tab.icon === 'string' ? <span>{tab.icon}</span> : tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Amount (USDC)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="10.00" className="input-field" style={{ fontSize: 18, fontWeight: 600, paddingRight: 70 }} disabled={loading} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)', fontWeight: 500, fontSize: 13 }}>
                    <DollarSign size={13} /> USDC
                  </span>
                </div>
                {inrEquivalent && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>≈ ₹{inrEquivalent} INR</p>}
              </div>

              {/* Quick Amounts */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {quickAmounts.map(qa => (
                  <button key={qa} onClick={() => setAmount(qa)} disabled={loading}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
                      border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                      ...(amount === qa
                        ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }
                        : { background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }),
                    }}>
                    ${qa}
                  </button>
                ))}
              </div>

              {/* Trust badge */}
              <div style={{ padding: 10, borderRadius: 'var(--radius)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--text2)' }}>Funds locked until milestones are verified by 3 validators</p>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'upi' ? (
                  <motion.div key="upi" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
                    <TransakWidget campaignId={campaign.campaignId} amount={amount} onSuccess={handleTransakSuccess} />
                  </motion.div>
                ) : (
                  <motion.div key="crypto" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', display: 'flex', gap: 8 }}>
                      <Info size={13} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        <p>Pay directly with USDC on <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Polygon Amoy</span>.</p>
                        <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', fontSize: 12, marginTop: 4, display: 'inline-block' }}>
                          Get test tokens →
                        </a>
                      </div>
                    </div>
                    {isConnected && (
                      <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                        Balance: <span style={{ color: 'var(--green)', fontWeight: 600 }}>{usdcBalance} USDC</span>
                      </p>
                    )}
                    <button onClick={handleDonate} disabled={loading || (!isConnected ? false : !isValidUSDCAmount(amount))}
                      className="btn-primary btn-full">
                      {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> {approving ? 'Approving...' : 'Confirming...'}</>
                        : !isConnected ? <><Wallet size={16} /> Connect Wallet</>
                        : <><DollarSign size={16} /> Donate {amount || '0'} USDC</>}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
