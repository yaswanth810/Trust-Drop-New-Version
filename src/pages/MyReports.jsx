import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getMyFraudReports } from '../utils/contract';
import { getIPFSUrl } from '../utils/ipfs';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Clock, CheckCircle2, XCircle, ExternalLink, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatusBadge({ report }) {
  if (!report.resolved) return <span className="badge badge-pending"><Clock size={10} /> Pending Review</span>;
  if (report.upheld) return <span className="badge badge-released"><CheckCircle2 size={10} /> Upheld — Reward Earned</span>;
  return <span className="badge badge-flagged"><XCircle size={10} /> Rejected</span>;
}

export default function MyReports() {
  const { contract, account, isConnected, connectWallet } = useWeb3();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (contract && account) { setLoading(true); const r = await getMyFraudReports(contract, account); setReports(r); setLoading(false); }
      else setLoading(false);
    }
    load();
  }, [contract, account]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container" style={{ maxWidth: 800 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={22} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 24 }}>My Fraud Reports</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>Track the status of your submitted reports</p>
            </div>
          </div>

          {!isConnected ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <AlertTriangle size={40} style={{ color: 'var(--amber)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8 }}>Connect Your Wallet</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Connect your wallet to view your fraud reports</p>
              <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
            </div>
          ) : loading ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>Loading your reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <ShieldAlert size={40} style={{ color: 'var(--border2)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8 }}>No Reports</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>You haven't submitted any fraud reports yet.</p>
              <Link to="/report" className="btn-primary">Report Fraud</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map((report, i) => (
                <motion.div key={report.reportId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="card" style={{
                    padding: 20,
                    borderLeft: `3px solid ${report.upheld ? 'var(--green)' : report.resolved ? 'var(--red)' : 'var(--amber)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <FileText size={14} style={{ color: 'var(--accent)' }} /> Report #{report.reportId}
                        </h4>
                        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                          Campaign #{report.campaignId} · Milestone {report.milestoneIndex + 1}
                        </p>
                      </div>
                      <StatusBadge report={report} />
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 10 }}>{report.reason}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
                      <span>Stake: {Number(report.stakedAmount) / 1e18} MATIC</span>
                      {report.evidenceIPFS && (
                        <a href={getIPFSUrl(report.evidenceIPFS)} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          View Evidence <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    {report.upheld && report.resolved && (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 'var(--radius)', background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>🎉 Report Upheld — 10% Reward Earned</p>
                        <p style={{ fontSize: 11, color: 'var(--green)', opacity: 0.7, marginTop: 2 }}>Reward automatically transferred to your wallet.</p>
                      </div>
                    )}
                    {!report.upheld && report.resolved && (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 'var(--radius)', background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                        <p style={{ fontSize: 12, color: 'var(--red)' }}>Report not upheld. 0.001 MATIC stake forfeited.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
