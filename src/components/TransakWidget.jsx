import { useWeb3 } from '../context/Web3Context';
import { Zap, ExternalLink, IndianRupee, Shield, Loader2, AlertCircle } from 'lucide-react';
import { fetchINRRate } from '../utils/helpers';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const TRANSAK_API_KEY = import.meta.env.VITE_TRANSAK_API_KEY;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function TransakWidget({ campaignId, amount, onSuccess }) {
  const { account } = useWeb3();
  const [inrRate, setInrRate] = useState(83);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchINRRate().then(r => r && setInrRate(r)); }, []);

  const fiatAmount = amount && !isNaN(parseFloat(amount))
    ? Math.round(parseFloat(amount) * inrRate) : Math.round(10 * inrRate);

  const openTransakWidget = async () => {
    if (!TRANSAK_API_KEY) {
      toast.error('Transak API key not configured');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Generating secure payment link...', { id: 'transak' });

      // Call backend proxy to get secure widget URL
      const res = await fetch('/api/transak/widget-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account || CONTRACT_ADDRESS,
          fiatAmount,
          extraParams: {
            defaultCryptoCurrency: 'USDC',
            network: 'polygon',
            fiatCurrency: 'INR',
            defaultFiatAmount: fiatAmount.toString(),
            productsAvailed: 'BUY',
          },
        }),
      });

      const data = await res.json();

      if (data.widgetUrl) {
        toast.success('Opening payment window...', { id: 'transak' });
        window.open(data.widgetUrl, '_blank', 'width=450,height=700,toolbar=no,menubar=no');
      } else {
        console.error('Transak response:', data);
        toast.error(data.error || 'Failed to generate payment URL', { id: 'transak' });
      }
    } catch (err) {
      console.error('Transak error:', err);
      toast.error('Failed to connect to payment service', { id: 'transak' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Conversion Preview */}
      <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>
          <span>You Pay</span><span>You Get</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={14} style={{ color: 'var(--amber)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 17, fontFamily: "'DM Mono', monospace" }}>₹{fiatAmount.toLocaleString('en-IN')}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>INR via UPI</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border2)' }} />
            <div style={{ width: 20, height: 1, background: 'var(--border2)' }} />
            <Zap size={11} style={{ color: 'var(--accent)' }} />
            <div style={{ width: 20, height: 1, background: 'var(--border2)' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border2)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'right' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 17, fontFamily: "'DM Mono', monospace" }}>≈ {amount || (fiatAmount / inrRate).toFixed(2)} USDC</p>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>On Polygon</p>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>$</div>
          </div>
        </div>
      </div>

      {/* UPI Pay Button */}
      <button onClick={openTransakWidget} disabled={!TRANSAK_API_KEY || loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 15,
          background: 'linear-gradient(135deg, var(--accent), #5A4BD6)', color: '#fff',
          border: 'none', cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 14px rgba(108,92,231,0.3)', transition: 'opacity 0.15s',
          opacity: (!TRANSAK_API_KEY || loading) ? 0.6 : 1,
        }}>
        {loading ? (
          <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Generating secure link...</>
        ) : (
          <><span style={{ fontSize: 18 }}>🇮🇳</span> Pay ₹{fiatAmount.toLocaleString('en-IN')} with UPI <ExternalLink size={13} style={{ opacity: 0.6 }} /></>
        )}
      </button>

      {!TRANSAK_API_KEY && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', fontSize: 11, color: 'var(--amber)' }}>
          <AlertCircle size={12} /> Add VITE_TRANSAK_API_KEY and TRANSAK_API_SECRET to .env
        </div>
      )}

      {/* Trust note */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
        <Shield size={9} /> Powered by Transak · Secure session-based widget
      </div>
    </div>
  );
}
