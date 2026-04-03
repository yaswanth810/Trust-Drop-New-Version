import { ExternalLink, CheckCircle2, Hash, Clock } from 'lucide-react';
import { getEtherscanUrl, shortenAddress } from '../utils/helpers';
import { motion } from 'framer-motion';

export default function OnChainReceipt({ txHash, amount, timestamp }) {
  if (!txHash) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card" style={{ padding: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} /> On-Chain Receipt
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={11} /> Tx Hash</span>
          <a href={getEtherscanUrl(txHash)} target="_blank" rel="noopener noreferrer"
            className="mono" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 12 }}>
            {shortenAddress(txHash)} <ExternalLink size={10} />
          </a>
        </div>
        {amount && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text3)' }}>Amount</span>
            <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{amount} USDC</span>
          </div>
        )}
        {timestamp && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Time</span>
            <span style={{ color: 'var(--text2)' }}>{new Date(timestamp).toLocaleString()}</span>
          </div>
        )}
      </div>
      <a href={getEtherscanUrl(txHash)} target="_blank" rel="noopener noreferrer"
        style={{
          marginTop: 12, width: '100%', padding: '8px', borderRadius: 'var(--radius)',
          background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none',
        }}>
        View on Polygonscan <ExternalLink size={12} />
      </a>
    </motion.div>
  );
}
