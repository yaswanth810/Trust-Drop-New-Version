import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns, getDonationAmount } from '../utils/contract';
import { formatEth, calculatePercentage, getMilestoneStatus } from '../utils/helpers';
import Footer from '../components/Footer';
import BadgeShowcase from '../components/BadgeShowcase';
import { motion } from 'framer-motion';
import { Heart, Wallet, Loader2, Target, ArrowRight } from 'lucide-react';

export default function MyDonations() {
  const { contract, account, isConnected, connectWallet } = useWeb3();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDonated, setTotalDonated] = useState('0');

  useEffect(() => {
    async function fetchDonations() {
      if (!contract || !account) { setLoading(false); return; }
      try {
        setLoading(true);
        const allCampaigns = await getAllCampaigns(contract);
        const userDonations = [];
        let total = BigInt(0);
        for (const campaign of allCampaigns) {
          if (!campaign) continue;
          const amount = await getDonationAmount(contract, campaign.campaignId, account);
          if (amount > BigInt(0)) { userDonations.push({ ...campaign, userDonation: amount }); total += amount; }
        }
        setDonations(userDonations);
        setTotalDonated(formatEth(total));
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    }
    fetchDonations();
  }, [contract, account]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container" style={{ maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Heart size={24} style={{ color: 'var(--accent)' }} /> My Donations
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>Track your contributions and their impact</p>
          </div>

          {!isConnected ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <Wallet size={40} style={{ color: 'var(--text3)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8 }}>Connect Your Wallet</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Connect MetaMask to view your donation history</p>
              <button onClick={connectWallet} className="btn-primary"><Wallet size={16} /> Connect Wallet</button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : donations.length > 0 ? (
            <>
              {/* Summary */}
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>Total Donated</p>
                    <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', serif", color: 'var(--accent)' }}>{totalDonated} USDC</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>Campaigns Supported</p>
                    <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', serif", color: 'var(--text)' }}>{donations.length}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <BadgeShowcase totalDonated={totalDonated} campaignsSupported={donations.length} />
              </div>

              {/* Donation List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {donations.map((donation, index) => {
                  const percentage = calculatePercentage(donation.raisedFunds, donation.totalFunds);
                  const completedMilestones = donation.milestones ? donation.milestones.filter(m => m.isApproved || m.fundsReleased).length : 0;
                  return (
                    <motion.div key={donation.campaignId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Link to={`/campaign/${donation.campaignId}`} style={{ textDecoration: 'none' }}>
                        <div className="card card-interactive" style={{ padding: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                            <div>
                              <h4 style={{ marginBottom: 4 }}>{donation.title}</h4>
                              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Campaign #{donation.campaignId}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: "'DM Mono', monospace", fontSize: 15 }}>{formatEth(donation.userDonation)} USDC</p>
                              <p style={{ fontSize: 11, color: 'var(--text3)' }}>your contribution</p>
                            </div>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                              <span>{formatEth(donation.raisedFunds)} / {formatEth(donation.totalFunds)} USDC</span>
                              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{percentage}%</span>
                            </div>
                            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${percentage}%` }} /></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                              <Target size={13} /> {completedMilestones}/{donation.milestoneCount} milestones
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                              View <ArrowRight size={12} />
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                            {donation.milestones?.map((m, i) => (
                              <div key={i} style={{
                                flex: 1, height: 4, borderRadius: 2,
                                background: m.fundsReleased ? 'var(--green)' : m.isApproved ? 'var(--accent)' : m.ipfsHash ? 'var(--blue)' : 'var(--surface3)',
                              }} title={`${getMilestoneStatus(m).label}: ${m.description}`} />
                            ))}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <Heart size={40} style={{ color: 'var(--border2)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8 }}>No Donations Yet</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>You haven't donated to any campaigns yet</p>
              <Link to="/" className="btn-primary">Browse Campaigns <ArrowRight size={14} /></Link>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
