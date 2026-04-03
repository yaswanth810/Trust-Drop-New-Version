import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns } from '../utils/contract';
import { shortenAddress } from '../utils/helpers';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Target, Wallet, TrendingUp, CheckCircle2, Clock, Loader2,
  ExternalLink, Users, Building2, Globe, Hash, Tag, BadgeCheck, Shield
} from 'lucide-react';
import Footer from '../components/Footer';

export default function NgoProfile() {
  const { address } = useParams();
  const { contract, trustScoreContract } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [ngoStats, setNgoStats] = useState({});
  const [trustScore, setTrustScore] = useState(0);
  const [ngoMeta, setNgoMeta] = useState(null);
  const [ngoOnChain, setNgoOnChain] = useState({ isRegistered: false, isVerified: false });

  useEffect(() => {
    async function fetchNgoData() {
      if (!contract || !address) return;
      setLoading(true);
      try {
        // Fetch NGO profile from contract
        try {
          const isRegistered = await contract.isRegisteredNGO(address);
          if (isRegistered) {
            const profile = await contract.getNGOProfile(address);
            setNgoOnChain({ isRegistered: true, isVerified: profile.isVerified });
            // Fetch IPFS metadata
            if (profile.ipfsMetadataHash) {
              try {
                const res = await fetch(`https://gateway.pinata.cloud/ipfs/${profile.ipfsMetadataHash}`);
                const data = await res.json();
                setNgoMeta(data);
              } catch {}
            }
          }
        } catch {}

        // Fetch campaigns
        const allCampaigns = await getAllCampaigns(contract);
        const ngoCampaigns = allCampaigns.filter(Boolean).filter(c => c.ngoAddress?.toLowerCase() === address.toLowerCase());
        setCampaigns(ngoCampaigns);

        let totalRaised = 0, totalMilestones = 0, completedMilestones = 0, onTimeMilestones = 0, completedCampaigns = 0;
        ngoCampaigns.forEach(c => {
          totalRaised += Number(c.raisedFunds || 0) / 1_000_000;
          const ms = c.milestones || [];
          totalMilestones += ms.length;
          const done = ms.filter(m => m.fundsReleased || m.isApproved);
          completedMilestones += done.length;
          onTimeMilestones += done.length;
          if (ms.every(m => m.fundsReleased)) completedCampaigns++;
        });

        let score = 0;
        if (trustScoreContract) {
          try { score = Number(await trustScoreContract.getTrustScore(address)); }
          catch { score = Math.min(onTimeMilestones * 10 + completedCampaigns * 20, 100); }
        } else { score = Math.min(onTimeMilestones * 10 + completedCampaigns * 20, 100); }
        setTrustScore(score);

        setNgoStats({
          totalRaised: totalRaised.toFixed(4), campaignCount: ngoCampaigns.length,
          completedCampaigns, totalMilestones, completedMilestones,
          completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        });
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    }
    fetchNgoData();
  }, [contract, address]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const statCards = [
    { icon: TrendingUp, color: 'var(--accent)', value: `${ngoStats.totalRaised} USDC`, label: 'Total Raised' },
    { icon: Target, color: 'var(--accent)', value: ngoStats.campaignCount, label: 'Campaigns' },
    { icon: CheckCircle2, color: 'var(--green)', value: `${ngoStats.completionRate}%`, label: 'Milestone Rate' },
    { icon: Wallet, color: 'var(--blue)', value: ngoStats.completedCampaigns, label: 'Completed' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Campaigns
        </Link>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TrustScoreBadge score={trustScore} size="xl" />
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ margin: 0 }}>{ngoMeta?.name || 'NGO Profile'}</h2>
                {ngoOnChain.isVerified && (
                  <span className="badge badge-released" style={{ fontSize: 11 }}>
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
                {ngoOnChain.isRegistered && !ngoOnChain.isVerified && (
                  <span className="badge badge-locked" style={{ fontSize: 11 }}>
                    <Building2 size={12} /> Registered
                  </span>
                )}
              </div>

              <a href={`https://amoy.polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer"
                className="mono" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', wordBreak: 'break-all', marginBottom: 12 }}>
                {address} <ExternalLink size={11} />
              </a>

              {/* IPFS Metadata Details */}
              {ngoMeta && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: 14, borderRadius: 'var(--radius)', background: 'var(--surface2)' }}>
                  {ngoMeta.mission && (
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      "{ngoMeta.mission}"
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {ngoMeta.category && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text2)' }}>
                        <Tag size={11} style={{ color: 'var(--accent)' }} /> {ngoMeta.category}
                      </span>
                    )}
                    {ngoMeta.website && (
                      <a href={ngoMeta.website} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                        <Globe size={11} /> Website
                      </a>
                    )}
                    {ngoMeta.darpanId && (
                      <a href={`https://ngodarpan.gov.in/index.php/home/statewise_ngo/search_result_ngo?state=&district=&ngo_type=&ngo_name=&unique_id=${ngoMeta.darpanId}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>
                        <Hash size={11} /> DARPAN: {ngoMeta.darpanId}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {statCards.map((s, i) => (
                  <div key={i} className="card" style={{ padding: 14, textAlign: 'center' }}>
                    <s.icon size={16} style={{ color: s.color, margin: '0 auto 6px' }} />
                    <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', serif" }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Campaign History */}
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock size={18} style={{ color: 'var(--accent)' }} /> Campaign History
        </h3>

        {campaigns.length === 0 ? (
          <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
            <Users size={36} style={{ color: 'var(--border2)', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>No campaigns found for this NGO</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map((campaign, i) => {
              const raised = Number(campaign.raisedFunds || 0) / 1_000_000;
              const total = Number(campaign.totalFunds || 0) / 1_000_000;
              const pct = total > 0 ? Math.round((raised / total) * 100) : 0;
              const allComplete = (campaign.milestones || []).every(m => m.fundsReleased);
              return (
                <motion.div key={campaign.campaignId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/campaign/${campaign.campaignId}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-interactive" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ marginBottom: 4 }}>{campaign.title}</h4>
                          <p style={{ fontSize: 13, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{campaign.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                          <span className={`badge ${allComplete ? 'badge-released' : 'badge-review'}`}>
                            {allComplete ? 'Completed' : 'Active'}
                          </span>
                          <p style={{ fontSize: 12, marginTop: 6, fontFamily: "'DM Mono', monospace", color: 'var(--text2)' }}>
                            {raised.toFixed(2)} / {total.toFixed(2)} USDC
                          </p>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 10 }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
