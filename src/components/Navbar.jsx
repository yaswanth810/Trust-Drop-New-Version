import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { useTheme } from '../context/ThemeContext';
import { shortenAddress } from '../utils/helpers';
import {
  Shield, Menu, X, Home, PlusCircle, CheckSquare,
  BarChart3, Moon, Sun, Globe, Wallet, ChevronDown,
  Copy, CheckCircle2, ShieldAlert, Heart
} from 'lucide-react';

export default function Navbar() {
  const { account, isConnected, connectWallet, balance, usdcBalance, loading, pendingProofCount } = useWeb3();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdown, setWalletDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/create', label: 'Create Campaign', icon: PlusCircle },
    { to: '/validator', label: 'Validator', icon: CheckSquare, badge: pendingProofCount },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/my-donations', label: 'My Donations', icon: Heart, requiresAuth: true },
    { to: '/report', label: 'Report Fraud', icon: ShieldAlert, requiresAuth: true },
  ];

  const isActive = (path) => location.pathname === path;

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 'var(--nav-height)',
        background: theme === 'dark' ? 'rgba(13,13,18,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="page-container" style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
            
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{
                width: 34, height: 34,
                background: 'var(--accent)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={18} color="#fff" />
              </div>
              <span style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.01em',
              }}>
                Trust<span style={{ color: 'var(--accent)' }}>Drop</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                 className="hidden md:flex">
              {navLinks.map((link) => {
                if (link.requiresAuth && !isConnected) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: 'var(--radius)',
                      fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                      color: isActive(link.to) ? 'var(--text)' : 'var(--text2)',
                      background: isActive(link.to) ? 'var(--surface2)' : 'transparent',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive(link.to)) {
                        e.currentTarget.style.color = 'var(--text)';
                        e.currentTarget.style.background = 'var(--surface2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive(link.to)) {
                        e.currentTarget.style.color = 'var(--text2)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <link.icon size={15} />
                    {link.label}
                    {link.badge > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        minWidth: 16, height: 16, borderRadius: 8,
                        background: 'var(--red)', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px',
                      }}>
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              
              {/* Language Toggle */}
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'te' : 'en')}
                style={{
                  padding: '6px 10px', borderRadius: 'var(--radius)',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text2)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Globe size={13} />
                {i18n.language === 'en' ? 'తె' : 'EN'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  padding: '6px', borderRadius: 'var(--radius)',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', width: 34, height: 34,
                }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Wallet */}
              {isConnected ? (
                <div style={{ position: 'relative' }} className="hidden md:block">
                  <button
                    onClick={() => setWalletDropdown(!walletDropdown)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 12px 6px 10px',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span className="status-dot connected" />
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 13,
                      color: 'var(--text)', fontWeight: 500,
                    }}>
                      {shortenAddress(account)}
                    </span>
                    <ChevronDown size={13} style={{ color: 'var(--text3)' }} />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {walletDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        style={{
                          position: 'absolute', top: '100%', right: 0, marginTop: 6,
                          width: 240, background: 'var(--surface)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                        }}
                        onMouseLeave={() => setWalletDropdown(false)}
                      >
                        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                            Balances
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text2)' }}>USDC</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{usdcBalance}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                            <span style={{ color: 'var(--text2)' }}>MATIC</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{parseFloat(balance).toFixed(3)}</span>
                          </div>
                        </div>
                        <div style={{ padding: 8 }}>
                          <button onClick={copyAddress} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 'var(--radius)',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {copied ? <CheckCircle2 size={14} style={{ color: 'var(--green)' }} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy Address'}
                          </button>
                          <Link to="/my-donations" style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 'var(--radius)',
                            color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                            textDecoration: 'none', transition: 'background 0.1s',
                          }}
                          onClick={() => setWalletDropdown(false)}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Heart size={14} />
                            My Donations
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button onClick={connectWallet} disabled={loading} className="btn-primary btn-sm" style={{ gap: 6 }}>
                  {loading ? <span className="spinner" /> : <><Wallet size={15} /><span className="hidden sm:inline">Connect Wallet</span></>}
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
                style={{
                  padding: 6, background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: 'var(--nav-height)' }} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: 'var(--nav-height)', left: 0, right: 0, zIndex: 49,
              background: theme === 'dark' ? 'rgba(17,17,16,0.95)' : 'rgba(247,246,242,0.95)',
              backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <div className="page-container" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navLinks.map((link) => {
                if (link.requiresAuth && !isConnected) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 'var(--radius)',
                      fontSize: 14, fontWeight: 500, textDecoration: 'none',
                      color: isActive(link.to) ? 'var(--text)' : 'var(--text2)',
                      background: isActive(link.to) ? 'var(--surface2)' : 'transparent',
                    }}
                  >
                    <link.icon size={18} />
                    {link.label}
                    {link.badge > 0 && (
                      <span style={{
                        marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 10,
                        background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              {isConnected && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 16px', marginTop: 4,
                  borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
                }}>
                  <span className="status-dot connected" />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                    {shortenAddress(account)}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>
                    {usdcBalance} USDC
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
