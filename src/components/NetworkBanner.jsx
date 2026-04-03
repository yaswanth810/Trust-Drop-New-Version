import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { AlertTriangle, X } from 'lucide-react';

const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '80002');
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || 'Polygon Amoy';

export default function NetworkBanner() {
  const { isConnected } = useWeb3();
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isConnected || !window.ethereum) return;
    const check = async () => {
      const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      setWrongNetwork(chainId !== TARGET_CHAIN_ID);
    };
    check();
    window.ethereum.on('chainChanged', check);
    return () => window.ethereum?.removeListener('chainChanged', check);
  }, [isConnected]);

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + TARGET_CHAIN_ID.toString(16) }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x' + TARGET_CHAIN_ID.toString(16),
            chainName: CHAIN_NAME,
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com'],
          }],
        });
      }
    }
  };

  if (!wrongNetwork || !isConnected || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
      background: 'var(--amber-bg)', borderBottom: '1px solid var(--amber-border)',
      padding: '10px 0',
    }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--amber)' }}>
          Please switch to {CHAIN_NAME} to use TrustDrop.
        </p>
        <button onClick={switchNetwork} className="btn-primary btn-sm" style={{ background: 'var(--amber)', fontSize: 12, padding: '4px 12px' }}>
          Switch Network
        </button>
        <button onClick={() => setDismissed(true)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--amber)', padding: 4,
        }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
