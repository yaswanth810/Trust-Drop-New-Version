import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns, reportFraud } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { ShieldAlert, Upload, Loader2, CheckCircle2, ArrowLeft, Lock, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const REASONS = ['Fake invoice', 'Fake photos', 'No actual delivery to beneficiaries', 'Inflated costs', 'Misuse of funds', 'Other'];

export default function Whistleblower() {
  const { contract, account, isConnected, connectWallet } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    if (contract) getAllCampaigns(contract).then(c => setCampaigns(c.filter(x => x && x.isActive)));
  }, [contract]);

  const selectedCampaignObj = campaigns.find(c => c.campaignId === Number(selectedCampaign));
  const milestones = selectedCampaignObj?.milestones || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) { connectWallet(); return; }
    if (!selectedCampaign || !selectedMilestone || !reason) { toast.error('Please fill in all required fields'); return; }
    try {
      setLoading(true);
      let evidenceIPFS = '';
      if (evidenceFile) { toast.loading('Uploading evidence...', { id: 'report' }); evidenceIPFS = await uploadToIPFS(evidenceFile); }
      const fullReason = `${reason}: ${description}`.trim();
      toast.loading('Submitting fraud report (0.001 MATIC stake)...', { id: 'report' });
      const tx = await reportFraud(contract, Number(selectedCampaign), Number(selectedMilestone), evidenceIPFS, fullReason);
      const receipt = await tx.wait();
      const event = receipt.logs?.find(l => l.fragment?.name === 'FraudReported');
      const rId = event?.args?.[3] !== undefined ? Number(event.args[3]) : '—';
      setReportId(rId);
      setSubmitted(true);
      toast.success('Fraud report submitted confidentially!', { id: 'report' });
    } catch (err) {
      console.error('Report error:', err);
      toast.error(err.reason || 'Failed to submit report', { id: 'report' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container" style={{ maxWidth: 680 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {submitted ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <CheckCircle2 size={52} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: 8 }}>Report Submitted</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>
                Your report has been submitted confidentially. Your wallet address is recorded on-chain but not displayed publicly.
              </p>
              {reportId !== null && (
                <div style={{ padding: 16, borderRadius: 'var(--radius)', background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 24, display: 'inline-block' }}>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Report ID</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>#{reportId}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Save to track status</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link to="/my-reports" className="btn-primary">View My Reports</Link>
                <Link to="/" className="btn-secondary">Back to Home</Link>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={22} style={{ color: 'var(--red)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, marginBottom: 2 }}>Report Fraud</h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>Submit a confidential fraud report</p>
                </div>
              </div>

              {/* Privacy Notice */}
              <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', display: 'flex', gap: 10, marginBottom: 24 }}>
                <EyeOff size={15} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--blue)', marginBottom: 2 }}>Anonymous Reporting</p>
                  <p>Your wallet is recorded for reward eligibility but not displayed publicly. Only the contract owner sees reporter addresses.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Campaign *</label>
                  <select value={selectedCampaign} onChange={e => { setSelectedCampaign(e.target.value); setSelectedMilestone(''); }} className="input-field">
                    <option value="">Select a campaign...</option>
                    {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>#{c.campaignId} — {c.title}</option>)}
                  </select>
                </div>

                {selectedCampaignObj && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Milestone *</label>
                    <select value={selectedMilestone} onChange={e => setSelectedMilestone(e.target.value)} className="input-field">
                      <option value="">Select milestone...</option>
                      {milestones.map((m, i) => <option key={i} value={i}>Milestone {i + 1}: {m.description}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Reason *</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} className="input-field">
                    <option value="">Select reason...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Description (optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Provide details about the suspected fraud..." rows={4} className="input-field" style={{ resize: 'none' }} />
                  <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{description.length}/500</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Evidence (optional)</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                    borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s',
                    ...(evidenceFile
                      ? { background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }
                      : { background: 'var(--surface2)', border: '1px solid var(--border)' }),
                  }}>
                    <Upload size={16} style={{ color: 'var(--text3)' }} />
                    <span style={{ fontSize: 13, color: evidenceFile ? 'var(--text)' : 'var(--text2)' }}>
                      {evidenceFile ? evidenceFile.name : 'Upload evidence file (images, PDFs)'}
                    </span>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setEvidenceFile(e.target.files[0])} />
                    {evidenceFile && <CheckCircle2 size={14} style={{ color: 'var(--green)', marginLeft: 'auto' }} />}
                  </label>
                </div>

                {/* Stake Notice */}
                <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--amber)' }}>0.001 MATIC</span> anti-spam stake required. Returned if upheld; forfeited if not.
                  </p>
                </div>

                <button type="submit" disabled={loading || !isConnected} className="btn-primary btn-full btn-lg">
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Submitting...</>
                    : !isConnected ? <>Connect Wallet</>
                    : <><ShieldAlert size={16} /> Submit Report Confidentially</>}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
