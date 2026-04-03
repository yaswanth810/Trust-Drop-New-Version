import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUSDC, formatDate } from '../utils/helpers';
import { claimReleasedFunds, challengeMilestone } from '../utils/contract';
import { getIPFSUrl } from '../utils/ipfs';
import { useWeb3 } from '../context/Web3Context';
import {
  CheckCircle2, Clock, Upload, ExternalLink, AlertCircle,
  Lock, ShieldAlert, Timer, AlertTriangle, Loader2, Sprout
} from 'lucide-react';
import toast from 'react-hot-toast';

function StatusIcon({ milestone }) {
  const s = { flexShrink: 0 };
  if (milestone.challenged) return <ShieldAlert size={18} style={{ ...s, color: 'var(--amber)' }} />;
  if (milestone.fundsClaimed) return <CheckCircle2 size={18} style={{ ...s, color: 'var(--green)' }} />;
  if (milestone.isApproved && !milestone.fundsClaimed) return <Timer size={18} style={{ ...s, color: 'var(--amber)' }} />;
  if (milestone.isApproved) return <CheckCircle2 size={18} style={{ ...s, color: 'var(--accent)' }} />;
  if (milestone.invoiceIPFS) return <Upload size={18} style={{ ...s, color: 'var(--blue)' }} />;
  return <Clock size={18} style={{ ...s, color: 'var(--text3)' }} />;
}

function CountdownTimer({ releaseAfter }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = releaseAfter - now;
      if (diff <= 0) { setTimeLeft('Ready to claim'); return; }
      const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [releaseAfter]);

  const isReady = releaseAfter - Math.floor(Date.now() / 1000) <= 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
      borderRadius: 'var(--radius)', fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 600,
      background: isReady ? 'var(--green-bg)' : 'var(--amber-bg)',
      color: isReady ? 'var(--green)' : 'var(--amber)',
    }}>
      <Timer size={12} /> {isReady ? '✓ Ready to claim' : `Release in: ${timeLeft}`}
    </div>
  );
}

function ChallengeForm({ campaignId, milestoneIndex, onChallenged }) {
  const { contract } = useWeb3();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const reasons = ['Proof documents appear fraudulent', 'Beneficiary count does not match', 'GPS location inconsistent', 'Invoice amounts do not match', 'Other concerns'];

  const handleChallenge = async () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    try {
      setLoading(true);
      toast.loading('Submitting challenge...', { id: 'challenge' });
      const tx = await challengeMilestone(contract, campaignId, milestoneIndex);
      await tx.wait();
      toast.success('Challenge submitted!', { id: 'challenge' });
      if (onChallenged) onChallenged();
    } catch (err) { toast.error(err.reason || 'Challenge failed', { id: 'challenge' }); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: 'none', border: 'none', fontSize: 11, color: 'var(--text3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
      }}>
        <AlertTriangle size={10} /> Raise Concern
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{ marginTop: 10, padding: 12, borderRadius: 'var(--radius)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <ShieldAlert size={12} /> Challenge this milestone
      </p>
      <select value={reason} onChange={e => setReason(e.target.value)} className="input-field" style={{ fontSize: 12, marginBottom: 8 }}>
        <option value="">Select reason...</option>
        {reasons.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleChallenge} disabled={loading} style={{
          flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', background: 'var(--amber)', color: '#fff',
          fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          {loading ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <ShieldAlert size={12} />}
          Challenge (0.001 MATIC)
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary btn-sm" style={{ fontSize: 12 }}>Cancel</button>
      </div>
    </motion.div>
  );
}

export default function MilestoneTracker({ milestones, campaignId, isNGO, onSubmitProof, onRefresh }) {
  const { contract } = useWeb3();
  const [claimingIndex, setClaimingIndex] = useState(-1);

  const handleClaim = async (index) => {
    try {
      setClaimingIndex(index);
      toast.loading('Claiming released funds...', { id: 'claim' });
      const tx = await claimReleasedFunds(contract, campaignId, index);
      await tx.wait();
      toast.success('Funds claimed! ✓', { id: 'claim' });
      if (onRefresh) onRefresh();
    } catch (err) { toast.error(err.reason || 'Claim failed', { id: 'claim' }); }
    finally { setClaimingIndex(-1); }
  };

  const stepColors = (ms) => {
    if (ms.challenged) return { border: 'var(--amber)', bg: 'var(--amber-bg)' };
    if (ms.fundsClaimed) return { border: 'var(--green)', bg: 'var(--green-bg)' };
    if (ms.isApproved) return { border: 'var(--accent)', bg: 'var(--accent-light)' };
    if (ms.invoiceIPFS) return { border: 'var(--blue)', bg: 'var(--blue-bg)' };
    return { border: 'var(--border2)', bg: 'var(--surface2)' };
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Lock size={18} style={{ color: 'var(--accent)' }} /> Milestone Tracker
      </h3>

      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const now = Math.floor(Date.now() / 1000);
        const canClaim = milestone.isApproved && !milestone.fundsClaimed && !milestone.challenged && milestone.releaseAfter > 0 && now >= milestone.releaseAfter;
        const inChallengeWindow = milestone.isApproved && !milestone.fundsClaimed && !milestone.challenged && milestone.releaseAfter > 0 && now < milestone.releaseAfter;
        const confirmPct = milestone.beneficiaryCount > 0 ? Math.round((milestone.confirmedCount / milestone.beneficiaryCount) * 100) : 100;
        const colors = stepColors(milestone);

        return (
          <motion.div key={index} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }} style={{ display: 'flex', gap: 14 }}>
            {/* Stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${colors.border}`, background: colors.bg,
              }}>
                <StatusIcon milestone={milestone} />
              </div>
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 40,
                  background: milestone.fundsClaimed ? 'var(--green)' : milestone.isApproved ? 'var(--accent)' : 'var(--border)',
                  opacity: milestone.fundsClaimed || milestone.isApproved ? 0.4 : 1,
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
              <div style={{
                padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--surface2)', border: '1px solid var(--border)',
                ...(milestone.challenged ? { borderColor: 'var(--amber-border)' } : {}),
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 2 }}>Milestone {index + 1}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>{milestone.description}</p>
                  </div>
                  {milestone.challenged ? <span className="badge badge-pending">🛑 Under Review</span>
                    : milestone.fundsClaimed ? <span className="badge badge-released">✓ Claimed</span>
                    : milestone.isApproved ? <span className="badge badge-review">⏳ Approved</span>
                    : milestone.invoiceIPFS ? <span className="badge badge-locked">📄 Proof Submitted</span>
                    : <span className="badge" style={{ background: 'var(--surface3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>Pending</span>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11} /> {formatUSDC(milestone.fundAmount)} USDC</span>
                  {milestone.deadline > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Due: {formatDate(milestone.deadline)}</span>}
                  {milestone.beneficiaryCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sprout size={11} style={{ color: 'var(--green)' }} /> {milestone.confirmedCount}/{milestone.beneficiaryCount} ({confirmPct}%)
                    </span>
                  )}
                </div>

                {/* 3-doc proof links */}
                {milestone.invoiceIPFS && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {[
                      { label: 'Invoice', hash: milestone.invoiceIPFS, icon: '🧾' },
                      { label: 'GPS Photo', hash: milestone.photoIPFS, icon: '📷' },
                      { label: 'Beneficiary List', hash: milestone.beneficiaryIPFS, icon: '📋' },
                    ].filter(d => d.hash).map(doc => (
                      <a key={doc.label} href={getIPFSUrl(doc.hash)} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                          borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)',
                          fontSize: 12, color: 'var(--accent)', textDecoration: 'none', transition: 'background 0.15s',
                        }}>
                        <span>{doc.icon}</span> {doc.label} <ExternalLink size={10} style={{ marginLeft: 'auto' }} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Approval progress */}
                {milestone.invoiceIPFS && !milestone.fundsClaimed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(milestone.approvalCount / 3) * 100}%` }} /></div>
                    <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{milestone.approvalCount}/3</span>
                  </div>
                )}

                {inChallengeWindow && <CountdownTimer releaseAfter={milestone.releaseAfter} />}

                {canClaim && isNGO && (
                  <button onClick={() => handleClaim(index)} disabled={claimingIndex === index}
                    className="btn-primary btn-full btn-sm" style={{ marginTop: 10 }}>
                    {claimingIndex === index ? <><Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Claiming...</>
                      : <><CheckCircle2 size={13} /> Claim Released Funds</>}
                  </button>
                )}

                {inChallengeWindow && !isNGO && <ChallengeForm campaignId={campaignId} milestoneIndex={index} onChallenged={onRefresh} />}

                {isNGO && !milestone.invoiceIPFS && !milestone.isApproved && (
                  <button onClick={() => onSubmitProof?.(index)} className="btn-primary btn-sm" style={{ marginTop: 10 }}>
                    <Upload size={13} /> Submit 3-Doc Proof
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
