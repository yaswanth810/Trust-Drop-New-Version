import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, BarChart3, CheckCircle } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const start = 0;
    const end = parseFloat(target);
    if (end === 0) return;

    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(start + (end - start) * eased);

      if (progress >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [target, isInView, duration]);

  const displayValue = suffix === 'USDC'
    ? count.toFixed(2)
    : Math.round(count);

  return (
    <span ref={ref}>
      {displayValue}{suffix && ` ${suffix}`}
    </span>
  );
}

export default function StatisticsBar({ stats }) {
  const items = [
    {
      icon: TrendingUp,
      label: 'Total Donated',
      value: stats.totalDonated || '0',
      suffix: 'USDC',
      color: 'text-accent',
    },
    {
      icon: BarChart3,
      label: 'Active Campaigns',
      value: stats.campaignCount || 0,
      suffix: '',
      color: 'text-blue-400',
    },
    {
      icon: CheckCircle,
      label: 'Milestones Completed',
      value: stats.milestonesCompleted || 0,
      suffix: '',
      color: 'text-green-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="page-container py-12"
    >
      <div className="glass-card p-1">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-6 ${
                i < items.length - 1 ? 'md:border-r border-b md:border-b-0 border-white/5' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{item.label}</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedCounter target={item.value} suffix={item.suffix} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
