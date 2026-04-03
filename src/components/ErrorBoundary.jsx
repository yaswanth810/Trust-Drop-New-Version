import { Component } from 'react';
import { Shield, RefreshCw, Globe, AlertTriangle, ArrowRight } from 'lucide-react';

const CHAIN_ID_HEX = '0x13882';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => this.setState({ hasError: false, error: null, errorInfo: null });

  handleSwitchNetwork = async () => {
    if (!window.ethereum) { alert('Please install MetaMask!'); return; }
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      this.handleRetry();
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: CHAIN_ID_HEX, chainName: 'Polygon Amoy', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://rpc-amoy.polygon.technology'], blockExplorerUrls: ['https://amoy.polygonscan.com'] }],
          });
          this.handleRetry();
        } catch (e) { console.error('Failed to add network:', e); }
      }
    }
  };

  handleReload = () => window.location.reload();

  getErrorMessage() {
    const { error } = this.state;
    if (!error) return 'An unexpected error occurred.';
    const msg = error.message || error.toString();
    if (msg.includes('network') || msg.includes('chainId') || msg.includes('chain')) return 'You appear to be on the wrong network. Please switch to Polygon Amoy Testnet.';
    if (msg.includes('MetaMask') || msg.includes('wallet') || msg.includes('ethereum')) return 'Wallet connection error. Please ensure MetaMask is installed and unlocked.';
    if (msg.includes('rejected') || msg.includes('denied')) return 'Transaction was rejected by the user.';
    if (msg.includes('call revert') || msg.includes('execution reverted')) return 'Smart contract call failed.';
    return 'Something went wrong while loading this page.';
  }

  render() {
    if (this.state.hasError) {
      const friendlyMessage = this.getErrorMessage();
      const isNetworkError = friendlyMessage.includes('network') || friendlyMessage.includes('Polygon');

      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
          <div className="card" style={{ padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: 'var(--text)' }}>
                Trust<span style={{ color: 'var(--accent)' }}>Drop</span>
              </span>
            </div>

            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
            </div>

            <h3 style={{ marginBottom: 8 }}>Something went wrong</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 28 }}>{friendlyMessage}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isNetworkError && (
                <button onClick={this.handleSwitchNetwork} className="btn-primary btn-full">
                  <Globe size={16} /> Switch to Polygon Amoy
                </button>
              )}
              <button onClick={this.handleRetry} className="btn-secondary btn-full">
                <RefreshCw size={15} /> Try Again
              </button>
              <button onClick={this.handleReload} style={{
                background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8,
              }}>
                Reload Page <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
