import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getCampaignById, getDonationAmount, submitProof, triggerRefund, hasExpiredMilestones } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';
import { formatUSDC, calculatePercentage, shortenAddress, getEtherscanAddressUrl, fetchINRRate, formatWithINR } from '../utils/helpers';
import { checkPriceOracle, verifyGST, isValidGSTFormat, formatGSTDisplay, ITEM_CATEGORIES, PRICE_CHECK_LABELS } from '../utils/oracle';
import MilestoneTracker from '../components/MilestoneTracker';
import DonateModal from '../components/DonateModal';
import QRGenerator from '../components/QRGenerator';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Shield, ExternalLink, Users, Target, Upload,
  Loader2, ArrowLeft, Copy, CheckCircle2, AlertTriangle, RotateCcw, DollarSign, Sprout, FileText, Camera, ClipboardList, Lock, Globe2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function CampaignDetailSkeleton() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 40, background: 'var(--bg)' }}>
      <div className="page-container">
        <div className="animate-shimmer" style={{ width: 130, height: 16, borderRadius: 'var(--radius-sm)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 28 }}>
              <div className="animate-shimmer" style={{ width: '70%', height: 28, borderRadius: 'var(--radius-sm)', marginBottom: 12 }} />
              <div className="animate-shimmer" style={{ width: '40%', height: 14, borderRadius: 'var(--radius-sm)', marginBottom: 24 }} />
              <div className="animate-shimmer" style={{ width: '100%', height: 8, borderRadius: 'var(--radius-pill)', marginBottom: 8 }} />
            </div>
            <div className="card" style={{ padding: 28 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div className="animate-shimmer" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="animate-shimmer" style={{ width: '60%', height: 14, borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
                    <div className="animate-shimmer" style={{ width: '100%', height: 6, borderRadius: 'var(--radius-pill)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24, height: 200 }}>
            <div className="animate-shimmer" style={{ width: '100%', height: 44, borderRadius: 'var(--radius)', marginBottom: 12 }} />
            <div className="animate-shimmer" style={{ width: '100%', height: 14, borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreeDocUploadForm({ milestoneIndex, uploading, onSubmit, onCancel }) {
  const [files, setFiles] = useState({ invoice: null, photo: null, beneficiary: null });
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [priceCheck, setPriceCheck] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [justification, setJustification] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstResult, setGstResult] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);

  const docSlots = [
    { key: 'invoice', label: 'Invoice / Receipt', icon: <FileText size={16} style={{ color: 'var(--blue)' }} />, accept: '.pdf,.doc,.docx,.jpg,.png', hint: 'PDF or image of expense invoice' },
    { key: 'photo', label: 'GPS Photo Evidence', icon: <Camera size={16} style={{ color: 'var(--green)' }} />, accept: 'image/*', hint: 'Photo with GPS/location metadata' },
    { key: 'beneficiary', label: 'Beneficiary List', icon: <ClipboardList size={16} style={{ color: 'var(--accent)' }} />, accept: '.pdf,.csv,.xlsx,.doc,.docx', hint: 'List of beneficiaries with signatures' },
  ];

  const uploadedCount = Object.values(files).filter(Boolean).length;
  const allUploaded = uploadedCount === 3;
  const isFlagged = priceCheck?.check === 2;
  const canSubmit = allUploaded && (!isFlagged || justification.length >= 20);

  const handleFile = (key, file) => setFiles(prev => ({ ...prev, [key]: file }));

  const runPriceCheck = async () => {
    if (!category || !amount || !quantity) return;
    setPriceLoading(true);
    const result = await checkPriceOracle(category, parseFloat(amount), parseInt(quantity));
    setPriceCheck(result);
    setPriceLoading(false);
  };

  const runGSTCheck = async () => {
    const clean = gstNumber.replace(/\s/g, '');
    if (clean.length < 15) return;
    setGstLoading(true);
    const result = await verifyGST(clean);
    setGstResult(result);
    setGstLoading(false);
  };

  const handleSubmit = () => {
    const meta = { category, quantity, amount, priceCheck: priceCheck?.check, justification, gstNumber: gstNumber.replace(/\s/g, '') };
    onSubmit(milestoneIndex, files, meta);
  };

  const priceColors = { 0: 'var(--green)', 1: 'var(--amber)', 2: 'var(--red)' };
  const priceBg = { 0: 'var(--green-bg)', 1: 'var(--amber-bg)', 2: 'var(--red-bg)' };
  const priceBorder = { 0: 'var(--green-border)', 1: 'var(--amber-border)', 2: 'var(--red-border)' };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} style={{ color: 'var(--accent)' }} />
          Submit 3-Doc Proof — Milestone {milestoneIndex + 1}
        </h3>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>

      {/* Item Category + Quantity + Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>Item Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input-field" style={{ fontSize: 13 }}>
            <option value="">Select...</option>
            {ITEM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
            onBlur={runPriceCheck} placeholder="e.g. 50" className="input-field" style={{ fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>Total Amount (USDC)</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
            onBlur={runPriceCheck} placeholder="e.g. 500" className="input-field" style={{ fontSize: 13 }} />
        </div>
      </div>

      {/* Price Check */}
      {priceLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}><Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> Checking market rate...</div>}
      {priceCheck && !priceLoading && (
        <div style={{ padding: 12, borderRadius: 'var(--radius)', marginBottom: 16, background: priceBg[priceCheck.check], border: `1px solid ${priceBorder[priceCheck.check]}` }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: priceColors[priceCheck.check], display: 'flex', alignItems: 'center', gap: 6 }}>
            {priceCheck.icon} Price Check: {priceCheck.label}
          </p>
          <p style={{ fontSize: 12, color: priceColors[priceCheck.check], opacity: 0.8, marginTop: 2 }}>{priceCheck.message}</p>
        </div>
      )}

      {isFlagged && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 4 }}>🚨 Mandatory Justification (min 20 chars)</label>
          <textarea value={justification} onChange={e => setJustification(e.target.value)}
            placeholder="Explain why the price exceeds market rate..." className="input-field" rows={3} style={{ fontSize: 13 }} />
          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 2 }}>{justification.length} chars</p>
        </div>
      )}

      {/* GST */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>GST Number (optional)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="text" value={gstNumber} onChange={e => setGstNumber(formatGSTDisplay(e.target.value))}
            onBlur={runGSTCheck} placeholder="27AAP FU093 9F1ZV" maxLength={17}
            className="input-field mono" style={{ fontSize: 13, flex: 1, letterSpacing: '0.05em' }} />
          {gstLoading && <Loader2 size={14} style={{ color: 'var(--text3)', animation: 'spin 0.7s linear infinite' }} />}
        </div>
        {gstResult && (
          <div style={{ marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
            color: gstResult.status === 'invalid_format' ? 'var(--red)' : gstResult.status === 'unavailable' ? 'var(--amber)' : 'var(--green)' }}>
            {gstResult.status === 'invalid_format' ? '✗ Invalid GST format' :
             gstResult.status === 'unavailable' ? '⚠ GST verification unavailable' :
             `✓ GST verified — ${gstResult.businessName || 'Active business'}`}
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(uploadedCount / 3) * 100}%` }} /></div>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{uploadedCount}/3</span>
      </div>

      {/* Upload Slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {docSlots.map(slot => (
          <div key={slot.key} style={{
            padding: 14, borderRadius: 'var(--radius-lg)',
            border: '1px solid', transition: 'all 0.15s',
            ...(files[slot.key]
              ? { background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }
              : { background: 'var(--surface2)', borderColor: 'var(--border)' }),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {slot.icon}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{slot.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{slot.hint}</p>
                </div>
              </div>
              {files[slot.key] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--accent)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{files[slot.key].name}</span>
                  <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
                </div>
              ) : (
                <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: 12 }}>
                  Choose File
                  <input type="file" accept={slot.accept} style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && handleFile(slot.key, e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || uploading} className="btn-primary btn-full"
        style={{ padding: '12px', opacity: (!canSubmit || uploading) ? 0.5 : 1 }}>
        {uploading ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Uploading & Submitting...</>
          : <><Upload size={15} /> Submit 3-Doc Proof</>}
      </button>
    </motion.div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const { contract, account, isConnected } = useWeb3();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [userDonation, setUserDonation] = useState(BigInt(0));
  const [uploading, setUploading] = useState(false);
  const [proofMilestoneIndex, setProofMilestoneIndex] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [inrRate, setInrRate] = useState(null);

  useEffect(() => { fetchINRRate().then(setInrRate); }, []);

  const fetchCampaign = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const data = await getCampaignById(contract, parseInt(id));
      setCampaign(data);
      if (account) {
        const donation = await getDonationAmount(contract, parseInt(id), account);
        setUserDonation(donation);
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  }, [contract, id, account]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const handleSubmitProof = async (milestoneIndex) => setProofMilestoneIndex(milestoneIndex);

  const handle3DocSubmit = async (milestoneIndex, files) => {
    const { invoice, photo, beneficiary } = files;
    if (!invoice || !photo || !beneficiary) { toast.error('All 3 documents are required'); return; }
    try {
      setUploading(true);
      toast.loading('Uploading invoice to IPFS...', { id: 'proof-upload' });
      const invoiceHash = await uploadToIPFS(invoice);
      toast.loading('Uploading GPS photo...', { id: 'proof-upload' });
      const photoHash = await uploadToIPFS(photo);
      toast.loading('Uploading beneficiary list...', { id: 'proof-upload' });
      const beneficiaryHash = await uploadToIPFS(beneficiary);
      toast.success('All 3 docs uploaded!', { id: 'proof-upload' });
      toast.loading('Submitting proof on-chain...', { id: 'proof-submit' });
      const tx = await submitProof(contract, parseInt(id), milestoneIndex, invoiceHash, photoHash, beneficiaryHash);
      await tx.wait();
      toast.success('3-doc proof submitted! ✓', { id: 'proof-submit' });
      setProofMilestoneIndex(null);
      fetchCampaign();
    } catch (err) {
      console.error('Proof error:', err);
      toast.error(err.reason || err.message || 'Failed', { id: 'proof-upload' });
      toast.dismiss('proof-submit');
    } finally { setUploading(false); }
  };

  const handleTriggerRefund = async () => {
    if (!contract || !campaign) return;
    try {
      setRefunding(true);
      toast.loading('Triggering refund...', { id: 'refund' });
      const tx = await triggerRefund(contract, campaign.campaignId);
      await tx.wait();
      toast.success('Refund triggered! ✓', { id: 'refund' });
      fetchCampaign();
    } catch (err) {
      console.error('Refund error:', err);
      toast.error(err.reason || 'Refund failed', { id: 'refund' });
    } finally { setRefunding(false); }
  };

  if (loading) return <CampaignDetailSkeleton />;

  if (!campaign) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Campaign Not Found</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20 }}>Connect your wallet or check the campaign ID</p>
          <Link to="/" className="btn-primary"><ArrowLeft size={15} /> Back to Home</Link>
        </div>
      </div>
    );
  }

  const percentage = calculatePercentage(campaign.raisedFunds, campaign.totalFunds);
  const isNGO = account && campaign.ngoAddress.toLowerCase() === account.toLowerCase();
  const isExpired = hasExpiredMilestones(campaign);
  const catMatch = campaign.description?.match(/^\[(\w+)\]/);
  const category = catMatch ? catMatch[1] : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 40 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--text3)' }}>
          <Link to="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text2)' }}>{campaign.title}</span>
        </div>

        {/* Emergency Banner */}
        {campaign.isEmergency && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--red)' }}>Emergency Campaign — Rapid Response Mode</p>
              <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.7 }}>50% seed released. Faster approval with fewer validators.</p>
            </div>
          </motion.div>
        )}

        {/* Expired Banner */}
        {isExpired && campaign.isActive && !campaign.isFrozen && (
          <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--red)' }}>Deadline Expired — Refund Available</p>
                <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.7 }}>Milestones passed deadline without proof.</p>
              </div>
            </div>
            <button onClick={handleTriggerRefund} disabled={refunding} className="btn-danger btn-sm">
              {refunding ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RotateCcw size={13} />}
              Trigger Refund
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          {/* Left Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Campaign Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {category && <span className="badge badge-locked" style={{ fontSize: 10, padding: '2px 8px' }}>{category}</span>}
                    {campaign.isEmergency && <span className="badge badge-emergency" style={{ fontSize: 10, padding: '2px 8px' }}>Emergency</span>}
                    {isNGO && <span className="badge badge-review" style={{ fontSize: 10, padding: '2px 8px' }}>Your Campaign</span>}
                    {campaign.isFrozen && <span className="badge badge-flagged" style={{ fontSize: 10, padding: '2px 8px' }}>Frozen</span>}
                  </div>
                  <h2 style={{ fontSize: 28, marginBottom: 6 }}>{campaign.title}</h2>
                  <a href={getEtherscanAddressUrl(campaign.ngoAddress)} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>
                    <Shield size={13} /> NGO: <span className="mono">{shortenAddress(campaign.ngoAddress)}</span> <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
                {campaign.description?.replace(/^\[\w+\]\s*/, '')}
              </p>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { label: 'Raised', value: `${formatUSDC(campaign.raisedFunds)} USDC` },
                  { label: 'Target', value: `${formatUSDC(campaign.totalFunds)} USDC` },
                  { label: 'Donors', value: campaign.donorCount || 0 },
                  { label: 'Milestones', value: campaign.milestoneCount },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--surface2)', padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {inrRate && <span style={{ color: 'var(--text3)' }}>(≈ ₹{Math.round(Number(campaign.raisedFunds) / 1e6 * inrRate).toLocaleString('en-IN')})</span>}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{percentage}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
              </div>
            </motion.div>

            {/* Seed Release */}
            {campaign.seedReleased && (
              <div style={{ padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sprout size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--green)' }}>🌱 20% Seed Released</p>
                  <p style={{ fontSize: 12, color: 'var(--green)', opacity: 0.7 }}>Advance released to NGO to begin work.</p>
                </div>
              </div>
            )}

            {/* Milestone Tracker */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <MilestoneTracker milestones={campaign.milestones || []} campaignId={campaign.campaignId} isNGO={isNGO} onSubmitProof={handleSubmitProof} onRefresh={fetchCampaign} />
            </motion.div>

            {/* 3-Doc Upload */}
            <AnimatePresence>
              {proofMilestoneIndex !== null && isNGO && (
                <ThreeDocUploadForm milestoneIndex={proofMilestoneIndex} uploading={uploading}
                  onSubmit={handle3DocSubmit} onCancel={() => setProofMilestoneIndex(null)} />
              )}
            </AnimatePresence>

            {/* QR Generator */}
            {isNGO && campaign.milestones?.map((ms, i) => (
              ms.beneficiaryCount > 0 && !ms.fundsReleased && (
                <QRGenerator key={i} campaignId={campaign.campaignId} milestoneIndex={i}
                  beneficiaryCount={ms.beneficiaryCount} campaignTitle={campaign.title} />
              )
            ))}
          </div>

          {/* Right Sidebar */}
          <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Donate Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={18} style={{ color: 'var(--accent)' }} /> Support This Campaign
              </h3>
              <button onClick={() => setDonateOpen(true)} disabled={!campaign.isActive || campaign.isFrozen}
                className="btn-primary btn-full btn-lg" style={{ marginBottom: 12 }}>
                <DollarSign size={18} />
                {campaign.isFrozen ? 'Campaign Frozen' : 'Donate USDC'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, marginBottom: 16 }}>
                Your USDC is locked in a smart contract and released only when milestones are verified by validators.
              </p>

              {userDonation > BigInt(0) && (
                <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Your Contribution</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>
                    {formatUSDC(userDonation)} USDC
                  </p>
                  {inrRate && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>≈ ₹{Math.round(Number(userDonation) / 1e6 * inrRate).toLocaleString('en-IN')}</p>}
                </div>
              )}

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: Target, label: 'Milestones', value: campaign.milestoneCount },
                  { icon: Shield, label: 'Status', value: campaign.isFrozen ? 'Frozen' : campaign.isActive ? 'Active' : 'Closed',
                    color: campaign.isFrozen ? 'var(--red)' : campaign.isActive ? 'var(--green)' : 'var(--text3)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}><row.icon size={13} /> {row.label}</span>
                    <span style={{ fontWeight: 600, color: row.color || 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: 16, padding: '12px 0 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                  <Lock size={11} /> Funds locked in smart contract
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                  <Globe2 size={11} /> Verifiable on Polygonscan
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <DonateModal campaign={campaign} isOpen={donateOpen} onClose={() => setDonateOpen(false)} onSuccess={fetchCampaign} />
      <Footer />
    </div>
  );
}
