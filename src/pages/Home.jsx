import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns, getPlatformStats } from '../utils/contract';
import CampaignCard from '../components/CampaignCard';
import SkeletonCard from '../components/SkeletonCard';
import DashboardShowcase from '../components/DashboardShowcase';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import {
  Search, Loader2, SlidersHorizontal, X, ArrowUpDown,
  ChevronDown, Lock, CheckCircle2, Banknote, Shield,
  Smartphone, FileText, BarChart3, Clock, Bell,
  Zap, Dice1, IndianRupee, Globe2
} from 'lucide-react';

const CATEGORIES = ['All', 'Relief', 'Education', 'Medical', 'Infrastructure', 'Environment'];
const STATUSES = ['All', 'Active', 'Completed', 'Fully Funded'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recently Created' },
  { value: 'funded', label: 'Most Funded (%)' },
  { value: 'ending', label: 'Ending Soonest' },
  { value: 'donors', label: 'Most Donors' },
];

const ANTI_FRAUD_FEATURES = [
  { icon: Dice1, title: 'Random Validators', desc: 'Validators randomly assigned — NGO never knows who' },
  { icon: Shield, title: 'MATIC Staking', desc: 'Validators stake MATIC — lose it for bad votes' },
  { icon: FileText, title: '3-Doc Proof', desc: 'Invoice + GPS photo + beneficiary list required' },
  { icon: Smartphone, title: 'QR Confirmation', desc: 'Beneficiaries confirm receipt on-chain via QR' },
  { icon: BarChart3, title: 'Market Oracle', desc: 'Invoice prices auto-checked vs govt benchmarks' },
  { icon: IndianRupee, title: 'GST Verify', desc: 'Supplier GST numbers verified live' },
  { icon: Clock, title: 'Challenge Window', desc: '48-hr window for public to dispute approvals' },
  { icon: Bell, title: 'Whistleblower', desc: 'Report fraud anonymously — earn 10% reward' },
];

export default function Home() {
  const { contract, isConnected } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ totalDonated: '0', campaignCount: 0, milestonesCompleted: 0 });
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'All';
  const categoryFilter = searchParams.get('category') || 'All';
  const sortBy = searchParams.get('sort') || 'newest';

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === '' || value === 'All' || value === 'newest') params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  const activeFilterCount = [
    statusFilter !== 'All' ? 1 : 0, categoryFilter !== 'All' ? 1 : 0,
    sortBy !== 'newest' ? 1 : 0, searchQuery ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    async function fetchData() {
      if (!contract) return;
      setLoading(true);
      try {
        const [campaignData, platformStats] = await Promise.all([
          getAllCampaigns(contract), getPlatformStats(contract),
        ]);
        setCampaigns(campaignData.filter(Boolean));
        setStats(platformStats);
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [contract]);

  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'All') {
      const cat = categoryFilter.toLowerCase();
      result = result.filter(c => `${c.title} ${c.description}`.toLowerCase().includes(cat));
    }
    if (statusFilter !== 'All') {
      result = result.filter(c => {
        const pct = Number(c.totalFunds || 0) > 0 ? (Number(c.raisedFunds || 0) / Number(c.totalFunds || 1)) * 100 : 0;
        const allComplete = c.milestones?.every(m => m.fundsReleased);
        if (statusFilter === 'Active') return !allComplete && pct < 100;
        if (statusFilter === 'Completed') return allComplete;
        if (statusFilter === 'Fully Funded') return pct >= 100;
        return true;
      });
    }
    result.sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      if (sortBy === 'funded') return (Number(b.raisedFunds || 0) / Math.max(Number(b.totalFunds || 1), 1)) - (Number(a.raisedFunds || 0) / Math.max(Number(a.totalFunds || 1), 1));
      if (sortBy === 'ending') return (a.deadline || Infinity) - (b.deadline || Infinity);
      if (sortBy === 'donors') return (b.donorCount || 0) - (a.donorCount || 0);
      return (b.campaignId || 0) - (a.campaignId || 0);
    });
    return result;
  }, [campaigns, searchQuery, statusFilter, categoryFilter, sortBy]);

  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => updateParam('q', searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const statValues = [
    { value: `₹${(Number(stats.totalDonated) / 100).toLocaleString('en-IN')}`, label: 'Tracked on-chain' },
    { value: stats.campaignCount || 0, label: 'Active Campaigns' },
    { value: stats.milestonesCompleted || 0, label: 'Milestones Verified' },
    { value: campaigns.reduce((s, c) => s + (c.donorCount || 0), 0) || 0, label: 'Donors Protected' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ===== SECTION 1: HERO ===== */}
      <section style={{
        background: 'var(--bg)',
        paddingTop: 80, paddingBottom: 60,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '120%', height: '60%',
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(108,92,231,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="page-container" style={{ position: 'relative', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Live pill */}
            <div style={{ marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
              fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em',
            }}>
              <span className="status-dot live" style={{ width: 6, height: 6 }} />
              Live on Polygon Amoy
            </div>

            <h1 style={{ maxWidth: 700, margin: '0 auto 20px' }}>
              Radically transparent{' '}
              <em className="serif-italic" style={{ color: 'var(--accent)' }}>donations.</em>
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Lock NGO funds in smart contracts. Release only when milestones are verified. Every rupee tracked on-chain.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/create" className="btn-dark btn-lg">Start a Campaign</Link>
              <a href="#campaigns" className="btn-secondary btn-lg">Explore Campaigns ↓</a>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 16 }}>
              Are you an NGO? <Link to="/register-ngo" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Register your NGO →</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SECTION 2: STATS STRIP ===== */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '28px 0' }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            {statValues.map((s, i) => (
              <div key={i} style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none', padding: '0 16px' }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: 'var(--text)', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: DASHBOARD SHOWCASE ===== */}
      <section className="page-section" style={{ background: 'var(--bg)' }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ marginBottom: 8 }}>Your campaign. Fully on-chain.</h2>
            <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 540, margin: '0 auto 40px' }}>
              Real-time milestone tracking, validator votes, and IPFS proofs — all verifiable by anyone.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <DashboardShowcase />
          </motion.div>
        </div>
      </section>

      {/* ===== SECTION 4: HOW IT WORKS ===== */}
      <section className="page-section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container" style={{ maxWidth: 1000 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2>How it works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { num: '01', icon: Lock, title: 'Donors lock funds', body: 'USDC sent directly to smart contract. No human can touch it. Zero custody risk.' },
              { num: '02', icon: CheckCircle2, title: 'Validators verify proof', body: 'NGO submits 3-doc proof to IPFS. 5 random validators review invoice, GPS photo, and beneficiary list.' },
              { num: '03', icon: Banknote, title: 'Funds auto-release', body: '3/5 approval triggers instant USDC transfer to NGO wallet. 48-hr challenge window protects against fraud.' },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, color: 'var(--border2)', marginBottom: 8, lineHeight: 1 }}>{step.num}</div>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <step.icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: BUILT FOR INDIA ===== */}
      <section className="page-section" style={{ background: 'var(--bg)' }}>
        <div className="page-container" style={{ maxWidth: 1100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div className="section-label">INDIA-FIRST DESIGN</div>
              <h2 style={{ marginBottom: 16 }}>Built for ₹ donations, not $ crypto.</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
                <p>Donate in rupees via UPI. No crypto wallet needed. Transak converts ₹ → USDC invisibly.</p>
                <p>Full Telugu language support for field NGO workers. Beneficiary QR codes work on any phone — no app required.</p>
                <p>GST verification, DARPAN integration roadmap, and Polygon Amoy for ₹0.01 gas fees.</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['UPI Payments', 'Telugu UI', 'GST Verified', 'Polygon Amoy'].map(p => (
                  <span key={p} className="feature-pill">{p}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { name: 'Vizag Flood Relief', tag: 'EMERGENCY', raised: 850, goal: 1000 },
                { name: 'Rural Medical Camp', tag: 'ACTIVE', raised: 420, goal: 600 },
              ].map((c, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{c.name}</span>
                    <span className={`badge ${c.tag === 'EMERGENCY' ? 'badge-emergency' : 'badge-released'}`} style={{ fontSize: 10, padding: '2px 8px' }}>{c.tag}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                    <span>{c.raised} USDC raised</span>
                    <span>{c.goal} USDC goal</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${(c.raised / c.goal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: TRUST & TECH ===== */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, marginBottom: 24 }}>Secured by battle-tested infrastructure</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            {['Polygon', 'Ethereum', 'IPFS', 'OpenZeppelin', 'Pinata', 'Transak'].map((t, i) => (
              <span key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.02em', transition: 'color 0.15s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: ANTI-FRAUD ===== */}
      <section className="page-section" style={{ background: 'var(--bg)' }}>
        <div className="page-container" style={{ maxWidth: 1100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'flex-start' }}>
            <div>
              <div className="section-label">ANTI-FRAUD SYSTEMS</div>
              <h2>We made fraud <em className="serif-italic" style={{ color: 'var(--accent)' }}>economically irrational.</em></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ANTI_FRAUD_FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="card" style={{ padding: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                  }}>
                    <f.icon size={16} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: CAMPAIGNS LISTING ===== */}
      <section id="campaigns" className="page-section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="page-container">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ marginBottom: 4 }}>Active Campaigns</h2>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>Support transparent, milestone-verified NGO campaigns</p>
          </div>

          {/* Search + Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input type="text" placeholder="Search campaigns..." value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="input-field" style={{ paddingLeft: 40 }}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary btn-sm" style={{ gap: 6 }}>
              <SlidersHorizontal size={14} /> Filters
              {activeFilterCount > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 9, background: 'var(--accent)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => updateParam('category', c)}
                        style={{
                          padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 500,
                          border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                          ...(categoryFilter === c
                            ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                            : { background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }),
                        }}
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateParam('status', s)}
                        style={{
                          padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 500,
                          border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                          ...(statusFilter === s
                            ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                            : { background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }),
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort By</label>
                  <select value={sortBy} onChange={e => updateParam('sort', e.target.value)} className="input-field" style={{ padding: '6px 12px', fontSize: 13 }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Campaigns Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredCampaigns.map((c, i) => (
                <motion.div key={c.campaignId ?? i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Search size={40} style={{ color: 'var(--border2)', margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text2)', marginBottom: 4 }}>No campaigns found</h3>
              <p style={{ fontSize: 14, color: 'var(--text3)' }}>
                {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Be the first to create one'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-secondary btn-sm" style={{ marginTop: 12 }}>Clear Filters</button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== SECTION 9: FINAL CTA ===== */}
      <section style={{
        background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--bg) 60%)',
        borderTop: '1px solid var(--accent-border)',
        padding: '80px 0',
      }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 12 }}>Make every rupee accountable.</h2>
          <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 32px' }}>
            Join the first blockchain-powered NGO transparency platform built for India.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Link to="/create" className="btn-dark btn-lg">Launch TrustDrop →</Link>
            <a href="https://github.com/yaswanth810/Trust-Drop" target="_blank" rel="noopener noreferrer" className="btn-secondary btn-lg">
              Read the docs
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
