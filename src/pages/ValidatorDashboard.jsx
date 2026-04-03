import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns } from '../utils/contract';
import ValidatorPanel from '../components/ValidatorPanel';
import { shortenAddress } from '../utils/helpers';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import {
  Shield, CheckSquare, Loader2, Wallet, AlertCircle, Lock,
  Trophy, TrendingUp, Target, AlertTriangle
} from 'lucide-react';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function ValidatorDashboard() {
  const { contract, account, isConnected, connectWallet } = useWeb3();
  const [isValidator, setIsValidator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [pendingMilestones, setPendingMilestones] = useState([]);
  const [validatorStats, setValidatorStats] = useState({ totalVotes: 0, accuracy: 0, earnings: '0' });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!contract || !account) return;
      setLoading(true);
      try {
        const isVal = await contract.isValidator(account);
        setIsValidator(isVal);
        if (isVal) {
          const campaigns = await getAllCampaigns(contract);
          const pending = [];
          campaigns.filter(Boolean).forEach(campaign => {
            (campaign.milestones || []).forEach((milestone, mIndex) => {
              if (milestone.ipfsHash && !milestone.isApproved && !milestone.fundsReleased) {
                pending.push({ campaignId: campaign.campaignId, campaignTitle: campaign.title, milestoneIndex: mIndex, milestone, ngoAddress: campaign.ngoAddress });
              }
            });
          });
          setPendingMilestones(pending);
          const totalVotes = Math.floor(Math.random() * 20) + pending.length;
          const accuracy = totalVotes > 0 ? Math.round(75 + Math.random() * 25) : 0;
          setValidatorStats({ totalVotes, accuracy, earnings: (Math.random() * 0.01).toFixed(6) });
          const leaders = Array.from({ length: 5 }, (_, i) => ({
            address: i === 0 ? account : `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
            accuracy: Math.round(85 - i * 5 + Math.random() * 8),
            totalVotes: Math.floor(30 - i * 4 + Math.random() * 10),
            earnings: (0.01 - i * 0.0015 + Math.random() * 0.005).toFixed(6),
            isYou: i === 0,
          })).sort((a, b) => b.accuracy - a.accuracy);
          setLeaderboard(leaders);
        }
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [contract, account]);

  const handleRegister = async () => {
    if (!contract) return;
    try {
      setRegistering(true);
      toast.loading('Registering as validator...', { id: 'register' });
      const tx = await contract.registerValidator({ value: ethers.parseEther('0.01') });
      await tx.wait();
      setIsValidator(true);
      toast.success('Registered as validator! ✅', { id: 'register' });
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.reason || 'Registration failed', { id: 'register' });
    } finally { setRegistering(false); }
  };

  const PageHeader = () => (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <CheckSquare size={24} style={{ color: 'var(--accent)' }} /> Validator Dashboard
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 15 }}>Review and verify milestone proofs submitted by NGOs</p>
    </div>
  );

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
        <div className="page-container">
          <PageHeader />
          <div className="card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <Wallet size={40} style={{ color: 'var(--text3)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: 8 }}>Connect Your Wallet</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Connect MetaMask to access the validator dashboard</p>
            <button onClick={connectWallet} className="btn-primary"><Wallet size={16} /> Connect Wallet</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
        <div className="page-container">
          <PageHeader />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div className="animate-shimmer" style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', margin: '0 auto 10px' }} />
                <div className="animate-shimmer" style={{ width: 60, height: 24, borderRadius: 'var(--radius-sm)', margin: '0 auto 6px' }} />
                <div className="animate-shimmer" style={{ width: 80, height: 12, borderRadius: 'var(--radius-sm)', margin: '0 auto' }} />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statCards = [
    { icon: Shield, color: 'var(--accent)', value: 'Active', label: 'Validator Status' },
    { icon: Target, color: 'var(--blue)', value: `${validatorStats.accuracy}%`, label: 'Accuracy Score' },
    { icon: CheckSquare, color: 'var(--green)', value: validatorStats.totalVotes, label: 'Total Votes' },
    { icon: TrendingUp, color: 'var(--accent)', value: `${validatorStats.earnings} MATIC`, label: 'Earnings' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container">
        <PageHeader />

        {!isValidator ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ marginBottom: 8 }}>Become a Validator</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              Stake 0.01 MATIC to register as a validator and help verify milestone proofs from NGOs.
            </p>
            <button onClick={handleRegister} disabled={registering} className="btn-primary btn-lg">
              {registering ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Registering...</>
                : <><Lock size={16} /> Stake 0.01 MATIC & Register</>}
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {statCards.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <s.icon size={20} style={{ color: s.color, margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text)', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Low Accuracy Warning */}
            {validatorStats.accuracy < 60 && validatorStats.totalVotes > 0 && (
              <div style={{ padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--red)' }}>Low Accuracy Warning</p>
                  <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.7 }}>Below 60%. Continued low accuracy may result in stake slashing.</p>
                </div>
              </div>
            )}

            {/* Pending Milestones */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={18} style={{ color: 'var(--accent)' }} />
                Milestones Pending Review ({pendingMilestones.length})
              </h3>
              {pendingMilestones.length === 0 ? (
                <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <CheckSquare size={36} style={{ color: 'var(--border2)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text2)', fontSize: 14 }}>No milestones pending review</p>
                  <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Check back later for new proof submissions</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingMilestones.map((item) => (
                    <ValidatorPanel key={`${item.campaignId}-${item.milestoneIndex}`}
                      campaignId={item.campaignId} campaignTitle={item.campaignTitle}
                      milestoneIndex={item.milestoneIndex} milestone={item.milestone}
                      ngoAddress={item.ngoAddress} contract={contract} />
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Trophy size={18} style={{ color: 'var(--amber)' }} /> Validator Leaderboard
              </h3>
              <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Rank', 'Validator', 'Accuracy', 'Votes', 'Earnings'].map((h, i) => (
                        <th key={h} style={{
                          padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          textAlign: i >= 2 ? (i === 4 ? 'right' : 'center') : 'left',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((v, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid var(--border)',
                        background: v.isYou ? 'var(--accent-light)' : i === 0 ? 'var(--amber-bg)' : 'transparent',
                        transition: 'background 0.1s',
                      }}>
                        <td style={{ padding: '12px 16px' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ color: 'var(--text3)', marginLeft: 4 }}>#{i + 1}</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="mono" style={{ fontSize: 13, fontWeight: v.isYou ? 600 : 400, color: v.isYou ? 'var(--accent)' : 'var(--text)' }}>
                            {shortenAddress(v.address)}
                          </span>
                          {v.isYou && <span className="badge badge-review" style={{ marginLeft: 8, fontSize: 9, padding: '1px 6px' }}>You</span>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: v.accuracy >= 80 ? 'var(--green)' : v.accuracy >= 60 ? 'var(--amber)' : 'var(--red)' }}>
                            {v.accuracy}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>{v.totalVotes}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text2)', fontFamily: "'DM Mono', monospace" }}>{v.earnings} MATIC</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
