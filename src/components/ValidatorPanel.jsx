import { approveMilestone } from '../utils/contract';
import { getIPFSUrl } from '../utils/ipfs';
import { getMilestoneStatus, formatUSDC, formatDate, shortenAddress } from '../utils/helpers';
import { CheckCircle, ExternalLink, Eye, Loader2, FileCheck, Users, CheckCircle2, Sprout } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const DOC_TABS = [
  { key: 'invoice', label: 'Invoice', icon: '🧾', field: 'invoiceIPFS' },
  { key: 'photo', label: 'GPS Photo', icon: '📷', field: 'photoIPFS' },
  { key: 'beneficiary', label: 'Beneficiary List', icon: '📋', field: 'beneficiaryIPFS' },
];

function ThreeDocViewer({ milestone, onAllViewed }) {
  const [viewed, setViewed] = useState({});
  const [activeTab, setActiveTab] = useState('invoice');

  const markViewed = (key, hash) => {
    const updated = { ...viewed, [key]: true };
    setViewed(updated);
    const allDocs = DOC_TABS.filter(d => milestone[d.field]);
    if (allDocs.every(d => updated[d.key]) && onAllViewed) onAllViewed();
    window.open(getIPFSUrl(hash), '_blank');
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', borderRadius: 'var(--radius)', background: 'var(--surface2)', padding: 2, marginBottom: 10 }}>
        {DOC_TABS.map(tab => {
          if (!milestone[tab.field]) return null;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                ...(activeTab === tab.key
                  ? { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { background: 'transparent', color: 'var(--text3)' }),
              }}>
              {tab.icon} {tab.label}
              {viewed[tab.key] && <CheckCircle2 size={9} style={{ color: 'var(--green)' }} />}
            </button>
          );
        })}
      </div>
      {DOC_TABS.map(tab => {
        if (!milestone[tab.field] || activeTab !== tab.key) return null;
        return (
          <div key={tab.key} style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tab.icon} {tab.label}
                {viewed[tab.key] && <span style={{ fontSize: 10, background: 'var(--green-bg)', color: 'var(--green)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>✓ Viewed</span>}
              </span>
              <button onClick={() => markViewed(tab.key, milestone[tab.field])}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Eye size={12} /> View on IPFS <ExternalLink size={10} />
              </button>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
        {Object.keys(viewed).length}/{DOC_TABS.filter(d => milestone[d.field]).length} documents reviewed
      </div>
    </div>
  );
}

export default function ValidatorPanel({
  campaign, contract, onUpdate,
  campaignId, campaignTitle, milestoneIndex, milestone: singleMilestone, ngoAddress,
}) {
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [allDocsViewed, setAllDocsViewed] = useState({});
  const isSingleMode = !campaign && singleMilestone;

  const handleApprove = async (cId, mIndex) => {
    try {
      setLoadingIndex(mIndex);
      const tx = await approveMilestone(contract, cId, mIndex);
      toast.loading('Approving milestone...', { id: `approve-${mIndex}` });
      await tx.wait();
      toast.success('Milestone approved! ✓', { id: `approve-${mIndex}` });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.reason || 'Approval failed', { id: `approve-${mIndex}` });
    } finally { setLoadingIndex(null); }
  };

  if (isSingleMode) {
    const status = getMilestoneStatus(singleMilestone);
    const mKey = `${campaignId}-${milestoneIndex}`;
    const canApprove = allDocsViewed[mKey];
    const confirmPct = singleMilestone.beneficiaryCount > 0 ? Math.round((singleMilestone.confirmedCount / singleMilestone.beneficiaryCount) * 100) : 100;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <Link to={`/campaign/${campaignId}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none', fontSize: 14 }}>
              {campaignTitle || `Campaign #${campaignId}`}
            </Link>
            {ngoAddress && (
              <Link to={`/ngo/${ngoAddress}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)', textDecoration: 'none', marginTop: 2 }}>
                <Users size={11} /> {shortenAddress(ngoAddress)}
              </Link>
            )}
          </div>
          <span className={`badge ${status.className}`}>{status.label}</span>
        </div>

        <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--surface2)', marginBottom: 12 }}>
          <h4 style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FileCheck size={13} style={{ color: 'var(--accent)' }} />
            Milestone {(milestoneIndex || 0) + 1}: {singleMilestone.description}
          </h4>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
            <span>{formatUSDC(singleMilestone.fundAmount)} USDC</span>
            <span>Due: {formatDate(singleMilestone.deadline)}</span>
            {singleMilestone.beneficiaryCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sprout size={10} style={{ color: 'var(--green)' }} /> {confirmPct}% confirmed
              </span>
            )}
          </div>
        </div>

        {singleMilestone.invoiceIPFS && (
          <ThreeDocViewer milestone={singleMilestone} onAllViewed={() => setAllDocsViewed(p => ({ ...p, [mKey]: true }))} />
        )}

        {/* Price Check Badges */}
        {singleMilestone.invoiceIPFS && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {singleMilestone.priceCheck !== undefined && (
              <span className={`badge ${singleMilestone.priceCheck === 0 ? 'badge-released' : singleMilestone.priceCheck === 1 ? 'badge-pending' : 'badge-flagged'}`}>
                {singleMilestone.priceCheck === 0 ? '✓ Normal' : singleMilestone.priceCheck === 1 ? '⚠ Warning' : '🚨 Flagged'}
              </span>
            )}
            {singleMilestone.gstNumber && <span className="badge badge-locked">GST: {singleMilestone.gstNumber}</span>}
            {singleMilestone.itemCategory && <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>{singleMilestone.itemCategory} × {singleMilestone.itemQuantity || '?'}</span>}
          </div>
        )}

        {/* Flagged Alert */}
        {singleMilestone.priceCheck === 2 && (
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>🚨 Price Flagged — Above Market Rate</p>
            <p style={{ fontSize: 11, color: 'var(--amber)', opacity: 0.7, marginTop: 2 }}>Review invoice and justification carefully.</p>
            {singleMilestone.justification && (
              <div style={{ marginTop: 6, padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', marginBottom: 2 }}>NGO Justification:</p>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>{singleMilestone.justification}</p>
              </div>
            )}
          </div>
        )}

        {/* Approval progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${((singleMilestone.approvalCount || 0) / 3) * 100}%` }} /></div>
          <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{singleMilestone.approvalCount || 0}/3</span>
        </div>

        <button onClick={() => handleApprove(campaignId, milestoneIndex)}
          disabled={loadingIndex === milestoneIndex || !canApprove}
          className="btn-primary btn-full" style={{ opacity: !canApprove ? 0.5 : 1 }}
          title={!canApprove ? 'Review all 3 documents first' : ''}>
          {loadingIndex === milestoneIndex ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={15} />}
          {canApprove ? 'Approve Milestone' : 'Review All Docs to Approve'}
        </button>
      </motion.div>
    );
  }

  if (!campaign) return null;
  const pendingMilestones = campaign.milestones?.filter(m => m.invoiceIPFS && !m.isApproved && !m.fundsReleased) || [];

  if (pendingMilestones.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>No pending milestones to review.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pendingMilestones.map((ms, i) => {
        const status = getMilestoneStatus(ms);
        const mKey = `${campaign.campaignId}-${ms.index || i}`;
        const canApprove = allDocsViewed[mKey];
        return (
          <motion.div key={ms.index || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <div>
                <h4 style={{ fontSize: 14, marginBottom: 4 }}>Milestone {(ms.index || i) + 1}: {ms.description}</h4>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
                  <span>{formatUSDC(ms.fundAmount)} USDC</span>
                  <span>Due: {formatDate(ms.deadline)}</span>
                </div>
              </div>
              <span className={`badge ${status.className}`}>{status.label}</span>
            </div>
            <ThreeDocViewer milestone={ms} onAllViewed={() => setAllDocsViewed(p => ({ ...p, [mKey]: true }))} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${((ms.approvalCount || 0) / 3) * 100}%` }} /></div>
              <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{ms.approvalCount || 0}/3</span>
            </div>
            <button onClick={() => handleApprove(campaign.campaignId, ms.index || i)}
              disabled={loadingIndex === (ms.index || i) || !canApprove}
              className="btn-primary btn-full" style={{ opacity: !canApprove ? 0.5 : 1 }}>
              {loadingIndex === (ms.index || i) ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={15} />}
              {canApprove ? 'Approve Milestone' : 'Review All Docs to Approve'}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
