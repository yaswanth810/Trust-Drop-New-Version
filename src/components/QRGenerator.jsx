import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Printer, Copy, CheckCircle2 } from 'lucide-react';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://trustdrop.app';

function QRCode({ value, size = 120 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=fdfcfb&color=1a1a1a&format=svg`;
  return <img src={qrUrl} alt="QR Code" width={size} height={size} style={{ borderRadius: 'var(--radius)' }} />;
}

export default function QRGenerator({ campaignId, milestoneIndex, beneficiaryCount, campaignTitle }) {
  const [copied, setCopied] = useState(-1);
  const printRef = useRef(null);

  if (!beneficiaryCount || beneficiaryCount <= 0) return null;

  const slots = Array.from({ length: beneficiaryCount }, (_, i) => ({
    slot: i, hash: `${campaignId}-${milestoneIndex}-${i}`,
    url: `${BASE_URL}/confirm/${campaignId}-${milestoneIndex}-${i}`,
  }));

  const copyLink = (index, url) => {
    navigator.clipboard.writeText(url);
    setCopied(index);
    setTimeout(() => setCopied(-1), 2000);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>QR Codes - ${campaignTitle}</title>
      <style>body{font-family:system-ui,sans-serif;padding:20px;background:#fff;color:#1a1a1a}
      h1{font-size:18px;margin-bottom:5px}h2{font-size:14px;color:#666;margin-bottom:20px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
      .card{border:1px solid #e5e2dd;border-radius:12px;padding:16px;text-align:center;page-break-inside:avoid}
      .card img{margin:0 auto 8px}.label{font-weight:bold;margin-bottom:4px}
      .url{font-size:8px;color:#999;word-break:break-all}
      .instructions{margin-top:30px;padding:15px;border:1px solid #e5e2dd;border-radius:12px;font-size:12px}
      </style></head><body>
      <h1>🛡️ TrustDrop Beneficiary QR Codes</h1>
      <h2>${campaignTitle} — Milestone ${Number(milestoneIndex) + 1}</h2>
      <div class="grid">${slots.map(s => `
        <div class="card"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(s.url)}" width="100" height="100"/>
        <div class="label">Beneficiary #${s.slot + 1}</div><div class="url">${s.url}</div></div>`).join('')}
      </div>
      <div class="instructions"><h3>📋 Instructions / సూచనలు</h3>
      <p><strong>English:</strong> Each beneficiary should scan their QR code after receiving aid.</p><br/>
      <p><strong>తెలుగు:</strong> ప్రతి లబ్ధిదారుడు సహాయం అందుకున్న తర్వాత QR కోడ్ స్కాన్ చేయాలి.</p></div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QrCode size={18} style={{ color: 'var(--accent)' }} /> Beneficiary QR Codes
        </h3>
        <button onClick={handlePrint} className="btn-secondary btn-sm"><Printer size={12} /> Print</button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
        Milestone {Number(milestoneIndex) + 1} — {beneficiaryCount} beneficiaries
      </p>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
        Each beneficiary scans their QR code to confirm receipt of aid on-chain.
      </p>

      <div ref={printRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {slots.map(s => (
          <div key={s.slot} style={{ padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <QRCode value={s.url} size={90} />
            <p style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>#{s.slot + 1}</p>
            <button onClick={() => copyLink(s.slot, s.url)}
              style={{ marginTop: 4, background: 'none', border: 'none', fontSize: 10, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%' }}>
              {copied === s.slot ? <><CheckCircle2 size={9} style={{ color: 'var(--green)' }} /> Copied!</> : <><Copy size={9} /> Copy Link</>}
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: 14, borderRadius: 'var(--radius)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', fontSize: 12 }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>📋 Instructions</p>
        <p style={{ color: 'var(--text2)', marginBottom: 4 }}><strong>English:</strong> Print and distribute QR codes. Each person scans to confirm receipt.</p>
        <p style={{ color: 'var(--text2)' }}><strong>తెలుగు:</strong> QR కోడ్‌లను ప్రింట్ చేసి పంపిణీ చేయండి.</p>
      </div>
    </motion.div>
  );
}
