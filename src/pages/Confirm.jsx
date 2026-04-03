import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { confirmBeneficiaryReceipt } from '../utils/contract';
import { CheckCircle2, Loader2, Heart, Shield, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const isTelugu = () => (navigator.language || '').startsWith('te');

const STRINGS = {
  en: {
    title: 'Confirm Aid Receipt', subtitle: 'Confirm you received aid from this campaign',
    button: 'Yes, I received aid ✓', loading: 'Recording on blockchain...',
    success: 'Thank you! Your confirmation is recorded permanently on the blockchain.',
    alreadyConfirmed: 'This receipt has already been confirmed.',
    error: 'Something went wrong. Please try again.',
    noWallet: 'Connect MetaMask or ask your NGO coordinator to confirm on your behalf.',
    coordinatorNote: "If you don't have a crypto wallet, ask your NGO coordinator to scan this QR and confirm.",
    poweredBy: 'Verified on Polygon blockchain',
    campaignLabel: 'Campaign', milestoneLabel: 'Milestone', slotLabel: 'Beneficiary #',
  },
  te: {
    title: 'సహాయం అందుబాటులో ఉందా నిర్ధారించండి', subtitle: 'ఈ ప్రచారం నుండి మీరు సహాయం అందుకున్నారని నిర్ధారించండి',
    button: 'అవును, నేను సహాయం అందుకున్నాను ✓', loading: 'బ్లాక్‌చెయిన్‌లో నమోదు చేస్తోంది...',
    success: 'ధన్యవాదాలు! మీ నిర్ధారణ బ్లాక్‌చెయిన్‌లో శాశ్వతంగా నమోదు చేయబడింది.',
    alreadyConfirmed: 'ఈ రసీదు ఇప్పటికే నిర్ధారించబడింది.',
    error: 'ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    noWallet: 'MetaMask కనెక్ట్ చేయండి.',
    coordinatorNote: 'మీకు క్రిప్టో వాలెట్ లేకపోతే, NGO సమన్వయకర్తను QR స్కాన్ చేయమని అడగండి.',
    poweredBy: 'Polygon బ్లాక్‌చెయిన్‌లో ధృవీకరించబడింది',
    campaignLabel: 'ప్రచారం', milestoneLabel: 'మైలురాయి', slotLabel: 'లబ్ధిదారుడు #',
  },
};

export default function Confirm() {
  const { hash } = useParams();
  const [lang, setLang] = useState(isTelugu() ? 'te' : 'en');
  const [status, setStatus] = useState('idle');
  const [hasWallet, setHasWallet] = useState(false);
  const t = STRINGS[lang];

  const parts = (hash || '').split('-');
  const campaignId = parts[0] || '?', milestoneIndex = parts[1] || '?', slot = parts[2] || '?';

  useEffect(() => { setHasWallet(!!window.ethereum); }, []);

  const handleConfirm = async () => {
    if (!window.ethereum) { toast.error(t.noWallet); return; }
    try {
      setStatus('loading');
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const abiModule = await import('../abi/TrustDrop.json');
      const abi = abiModule.default?.abi || abiModule.default || abiModule.abi;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await confirmBeneficiaryReceipt(contract, Number(campaignId), Number(milestoneIndex), Number(slot));
      await tx.wait();
      setStatus('success');
    } catch (err) {
      if (err.message?.includes('Already confirmed') || err.reason?.includes('Already confirmed')) setStatus('already');
      else { setStatus('error'); toast.error(err.reason || 'Transaction failed'); }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <Toaster position="top-center" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ width: '100%', maxWidth: 420, padding: 32, textAlign: 'center' }}>

        {/* Lang Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer' }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20 }}>Trust<span style={{ color: 'var(--accent)' }}>Drop</span></span>
        </div>

        {status === 'success' ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <CheckCircle2 size={52} style={{ color: 'var(--green)', margin: '0 auto 12px' }} />
            <h3 style={{ marginBottom: 8 }}>{lang === 'en' ? 'Confirmed!' : 'నిర్ధారించబడింది!'}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{t.success}</p>
          </motion.div>
        ) : status === 'already' ? (
          <div>
            <AlertCircle size={44} style={{ color: 'var(--amber)', margin: '0 auto 12px' }} />
            <h3>{t.alreadyConfirmed}</h3>
          </div>
        ) : status === 'error' ? (
          <div>
            <AlertCircle size={44} style={{ color: 'var(--red)', margin: '0 auto 12px' }} />
            <h3 style={{ marginBottom: 12 }}>{t.error}</h3>
            <button onClick={() => setStatus('idle')} className="btn-primary">{lang === 'en' ? 'Try Again' : 'మళ్ళీ ప్రయత్నించండి'}</button>
          </div>
        ) : (
          <>
            <Heart size={40} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
            <h3 style={{ marginBottom: 4 }}>{t.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>{t.subtitle}</p>

            <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 20, textAlign: 'left' }}>
              {[
                { label: t.campaignLabel, value: `#${campaignId}` },
                { label: t.milestoneLabel, value: `#${Number(milestoneIndex) + 1}` },
                { label: t.slotLabel, value: `${Number(slot) + 1}` },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', ...(i < 2 ? { borderBottom: '1px solid var(--border)' } : {}) }}>
                  <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{r.value}</span>
                </div>
              ))}
            </div>

            <button onClick={handleConfirm} disabled={status === 'loading'}
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)', fontWeight: 700, fontSize: 16,
                background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: status === 'loading' ? 0.6 : 1,
              }}>
              {status === 'loading' ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> {t.loading}</> : <>{t.button}</>}
            </button>

            {!hasWallet && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 'var(--radius)', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', fontSize: 12, color: 'var(--amber)', textAlign: 'left' }}>
                {t.coordinatorNote}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
          <Shield size={10} /> {t.poweredBy}
        </div>
      </motion.div>
    </div>
  );
}
