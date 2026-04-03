import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress, timeAgo, formatUSDC } from '../utils/helpers';
import { Heart, FileCheck, CheckCircle2, Banknote, Activity, ExternalLink } from 'lucide-react';

const EXPLORER_BASE = import.meta.env.VITE_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/';

const EVENT_CONFIG = {
  DonationReceived: { icon: Heart, color: 'var(--red)', bg: 'var(--red-bg)', emoji: '🎉', format: (a) => `${shortenAddress(a.donor)} donated ${formatUSDC(a.amount)} USDC` },
  ProofSubmitted: { icon: FileCheck, color: 'var(--blue)', bg: 'var(--blue-bg)', emoji: '📁', format: (a) => `Proof submitted for Campaign #${a.campaignId?.toString()}` },
  MilestoneApproved: { icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-bg)', emoji: '✅', format: (a) => `Milestone approved for Campaign #${a.campaignId?.toString()}` },
  FundsClaimed: { icon: Banknote, color: 'var(--accent)', bg: 'var(--accent-light)', emoji: '💸', format: (a) => `${formatUSDC(a.amount)} USDC claimed by NGO` },
  CampaignCreated: { icon: Activity, color: 'var(--purple)', bg: 'var(--purple-bg)', emoji: '🆕', format: (a) => `New campaign: #${a.campaignId?.toString()}` },
};

export default function ActivityFeed() {
  const { contract } = useWeb3();
  const [events, setEvents] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const eventsRef = useRef([]);

  useEffect(() => {
    if (!contract) return;
    const addEvent = (type, args, event) => {
      const newEvent = {
        id: `${type}-${Date.now()}-${Math.random()}`, type, args: { ...args },
        timestamp: Math.floor(Date.now() / 1000),
        txHash: event?.log?.transactionHash || event?.transactionHash || '',
      };
      eventsRef.current = [newEvent, ...eventsRef.current].slice(0, 20);
      setEvents([...eventsRef.current]);
    };

    async function loadPastEvents() {
      try {
        const provider = contract.runner?.provider;
        if (!provider) return;
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        for (const eventName of Object.keys(EVENT_CONFIG)) {
          try {
            const filter = contract.filters[eventName]?.();
            if (!filter) continue;
            const logs = await contract.queryFilter(filter, fromBlock, currentBlock);
            logs.forEach(log => {
              eventsRef.current.push({
                id: `${eventName}-${log.transactionHash}-${log.index}`, type: eventName,
                args: log.args ? Object.fromEntries(Object.entries(log.args).filter(([k]) => isNaN(k))) : {},
                timestamp: Math.floor(Date.now() / 1000), txHash: log.transactionHash,
              });
            });
          } catch {}
        }
        eventsRef.current = eventsRef.current.slice(0, 20).sort((a, b) => b.timestamp - a.timestamp);
        setEvents([...eventsRef.current]);
      } catch {}
    }
    loadPastEvents();

    const listeners = [];
    Object.keys(EVENT_CONFIG).forEach(eventName => {
      try {
        const handler = (...allArgs) => {
          const event = allArgs[allArgs.length - 1];
          const args = {};
          if (event?.args) Object.entries(event.args).forEach(([k, v]) => { if (isNaN(k)) args[k] = v; });
          addEvent(eventName, args, event);
        };
        contract.on(eventName, handler);
        listeners.push({ eventName, handler });
        setIsLive(true);
      } catch {}
    });

    return () => { listeners.forEach(({ eventName, handler }) => { try { contract.off(eventName, handler); } catch {} }); };
  }, [contract]);

  return (
    <div style={{ position: 'sticky', top: 80 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
            <Activity size={14} style={{ color: 'var(--accent)' }} /> Live Activity
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <span className={`status-dot ${isLive ? 'live' : 'disconnected'}`} />
            {isLive ? 'Live' : 'Offline'}
          </span>
        </div>

        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Activity size={28} style={{ color: 'var(--border2)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>No activity yet</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Events appear here in real-time</p>
            </div>
          ) : (
            <AnimatePresence>
              {events.map(event => {
                const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.CampaignCreated;
                const Icon = config.icon;
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}
                    style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} style={{ color: config.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, lineHeight: 1.4 }}>{config.emoji} {config.format(event.args)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(event.timestamp)}</span>
                          {event.txHash && (
                            <a href={`${EXPLORER_BASE}${event.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
