import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { createNewCampaign } from '../utils/contract';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, Loader2, ArrowLeft, Target, Wallet, Tag, Eye } from 'lucide-react';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const CATEGORIES = ['Relief', 'Education', 'Medical', 'Infrastructure', 'Environment'];

export default function CreateCampaign() {
  const { contract, isConnected, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Relief');
  const [milestones, setMilestones] = useState([
    { description: '', amount: '', deadline: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const addMilestone = () => setMilestones([...milestones, { description: '', amount: '', deadline: '' }]);
  const removeMilestone = (i) => { if (milestones.length > 1) setMilestones(milestones.filter((_, idx) => idx !== i)); };
  const updateMilestone = (i, field, value) => { const u = [...milestones]; u[i][field] = value; setMilestones(u); };

  const totalAmount = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) { connectWallet(); return; }
    if (!title.trim()) { toast.error('Please enter a campaign title'); return; }
    if (!description.trim()) { toast.error('Please enter a description'); return; }
    const invalid = milestones.find(m => !m.description.trim() || !m.amount || parseFloat(m.amount) <= 0 || !m.deadline);
    if (invalid) { toast.error('Please fill in all milestone fields'); return; }

    try {
      setLoading(true);
      const descs = milestones.map(m => m.description);
      const amounts = milestones.map(m => m.amount);
      const deadlines = milestones.map(m => m.deadline);
      const benCounts = milestones.map(() => '0');

      toast.loading('Creating campaign on-chain...', { id: 'create-campaign' });
      const fullDescription = `[${category}] ${description}`;
      const tx = await createNewCampaign(contract, title, fullDescription, descs, amounts, deadlines, benCounts);
      toast.loading('Transaction pending...', { id: 'create-campaign' });
      await tx.wait();
      toast.success('Campaign created successfully! ✓', { id: 'create-campaign' });
      navigate('/');
    } catch (err) {
      console.error('Create campaign error:', err);
      toast.error(err.reason || 'Failed to create campaign', { id: 'create-campaign' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back */}
          <button onClick={() => navigate(-1)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            color: 'var(--text2)', fontSize: 14, cursor: 'pointer', marginBottom: 16,
          }}>
            <ArrowLeft size={16} /> Back
          </button>

          <h2 style={{ marginBottom: 4 }}>Create a Campaign</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32 }}>
            Define your campaign milestones and fund allocation
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
            {/* Left — Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Campaign Details */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Campaign Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Campaign Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Vizag Flood Relief 2025" className="input-field" disabled={loading} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Describe your campaign goals, beneficiaries, and how funds will be used..."
                      className="input-field" rows={4} disabled={loading} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
                      <Tag size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Category
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => setCategory(cat)}
                          style={{
                            padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 500,
                            border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                            ...(category === cat
                              ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                              : { background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }),
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Target size={18} style={{ color: 'var(--accent)' }} /> Milestones
                  </h3>
                  <span style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--text3)' }}>Total: </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{totalAmount.toFixed(2)} USDC</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {milestones.map((milestone, index) => (
                    <motion.div key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      style={{
                        padding: 16, borderRadius: 'var(--radius-lg)',
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                          Milestone {index + 1}
                        </span>
                        {milestones.length > 1 && (
                          <button type="button" onClick={() => removeMilestone(index)} disabled={loading}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      <input type="text" value={milestone.description}
                        onChange={e => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Milestone description" className="input-field" style={{ marginBottom: 10, fontSize: 13 }}
                        disabled={loading} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>Amount (USDC)</label>
                          <input type="number" step="0.01" min="0" value={milestone.amount}
                            onChange={e => updateMilestone(index, 'amount', e.target.value)}
                            placeholder="100" className="input-field" style={{ fontSize: 13 }} disabled={loading} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 500 }}>Deadline</label>
                          <input type="date" value={milestone.deadline}
                            onChange={e => updateMilestone(index, 'deadline', e.target.value)}
                            className="input-field" style={{ fontSize: 13 }} disabled={loading} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button type="button" onClick={addMilestone} disabled={loading}
                  style={{
                    width: '100%', marginTop: 12, padding: '12px', borderRadius: 'var(--radius)',
                    border: '2px dashed var(--border)', background: 'transparent',
                    color: 'var(--text3)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                  <PlusCircle size={15} /> Add Milestone
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary btn-lg btn-full"
                style={{ padding: '14px 24px', fontSize: 15 }}>
                {loading ? (
                  <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Deploying Campaign...</>
                ) : !isConnected ? (
                  <><Wallet size={18} /> Connect Wallet to Create</>
                ) : (
                  <><PlusCircle size={18} /> Deploy Campaign — {totalAmount.toFixed(2)} USDC goal</>
                )}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>≈ 0.002 MATIC gas fee</p>
            </form>

            {/* Right — Live Preview */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--text3)', fontSize: 13, fontWeight: 500 }}>
                <Eye size={14} /> Live Preview
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <span className="badge badge-locked" style={{ fontSize: 10, padding: '2px 8px' }}>{category}</span>
                  </div>
                  <h4 style={{ marginBottom: 6, color: title ? 'var(--text)' : 'var(--text3)' }}>
                    {title || 'Campaign Title'}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 16,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {description || 'Campaign description will appear here...'}
                  </p>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>0 USDC</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>of {totalAmount.toFixed(0)} USDC</span>
                    </div>
                    <div className="progress-bar" style={{ height: 5 }}>
                      <div className="progress-bar-fill" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
                {milestones.filter(m => m.description).length > 0 && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                      Milestones
                    </div>
                    {milestones.filter(m => m.description).map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text2)' }}>
                        <span>{m.description}</span>
                        {m.amount && <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--text3)' }}>{m.amount} USDC</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>0 donors · Just now</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
