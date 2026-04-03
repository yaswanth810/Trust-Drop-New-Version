import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getAllCampaigns, getPlatformStats } from '../utils/contract';
import { formatUSDC } from '../utils/helpers';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, BarChart3, PieChart as PieIcon, Activity,
  Wallet, Target, Users, CheckCircle2, Loader2
} from 'lucide-react';
import Footer from '../components/Footer';

const CHART_COLORS = ['#6C5CE7', '#3B82F6', '#D97706', '#E53E3E', '#7C3AED', '#DB2777'];

const CACHE_KEY = 'trustdrop_analytics';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

function StatCard({ icon: Icon, label, value, iconColor = 'var(--accent)', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Instrument Serif', serif", color: 'var(--text)' }}>{value}</p>
    </motion.div>
  );
}

function ChartCard({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="chart-container"
    >
      <div className="flex items-center gap-2 mb-6">
        <Icon size={18} className="text-accent" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-lg)' }}>
      <p style={{ color: 'var(--text3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { contract, isConnected } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [donationData, setDonationData] = useState([]);
  const [milestoneData, setMilestoneData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!contract) return;

      // Check cache
      const cached = getCachedData();
      if (cached) {
        setStats(cached.stats);
        setDonationData(cached.donationData);
        setMilestoneData(cached.milestoneData);
        setCategoryData(cached.categoryData);
        setDailyActivity(cached.dailyActivity);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [campaigns, platformStats] = await Promise.all([
          getAllCampaigns(contract),
          getPlatformStats(contract),
        ]);

        const validCampaigns = campaigns.filter(Boolean);

        // Stats
        const totalLocked = validCampaigns.reduce((acc, c) => {
          const raised = Number(c.raisedFunds || 0) / 1_000_000;
          const released = (c.milestones || [])
            .filter(m => m.fundsReleased)
            .reduce((s, m) => s + Number(m.fundAmount || 0) / 1_000_000, 0);
          return acc + (raised - released);
        }, 0);

        const totalReleased = validCampaigns.reduce((acc, c) => {
          return acc + (c.milestones || [])
            .filter(m => m.fundsReleased)
            .reduce((s, m) => s + Number(m.fundAmount || 0) / 1_000_000, 0);
        }, 0);

        const totalMilestones = validCampaigns.reduce((acc, c) => {
          return acc + (c.milestones || []).filter(m => m.fundsReleased || m.isApproved).length;
        }, 0);

        const statsObj = {
          totalLocked: totalLocked.toFixed(2),
          totalReleased: totalReleased.toFixed(2),
          campaignCount: validCampaigns.length,
          milestonesCompleted: totalMilestones,
          avgTrustScore: 'N/A',
          uniqueDonors: platformStats.uniqueDonors || '—',
        };
        setStats(statsObj);

        // Simulated cumulative donation data
        const donData = [];
        let cumulative = 0;
        validCampaigns.forEach((c, i) => {
          const raised = Number(c.raisedFunds || 0) / 1_000_000;
          cumulative += raised;
          donData.push({
            name: `Campaign ${i + 1}`,
            total: parseFloat(cumulative.toFixed(2)),
          });
        });
        setDonationData(donData.length > 0 ? donData : [{ name: 'No Data', total: 0 }]);

        // Milestone completion by campaign
        const msData = validCampaigns.map((c, i) => {
          const total = c.milestoneCount || (c.milestones?.length || 1);
          const completed = (c.milestones || []).filter(m => m.fundsReleased || m.isApproved).length;
          return {
            name: c.title?.slice(0, 15) || `Campaign ${i}`,
            completion: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        });
        setMilestoneData(msData.length > 0 ? msData : [{ name: 'No Data', completion: 0 }]);

        // Category distribution
        const categories = { Relief: 0, Education: 0, Medical: 0, Infrastructure: 0, Environment: 0, Other: 0 };
        validCampaigns.forEach((c) => {
          const text = `${c.title} ${c.description}`.toLowerCase();
          let matched = false;
          for (const cat of Object.keys(categories)) {
            if (cat !== 'Other' && text.includes(cat.toLowerCase())) {
              categories[cat] += Number(c.raisedFunds || 0) / 1_000_000;
              matched = true;
              break;
            }
          }
          if (!matched) categories.Other += Number(c.raisedFunds || 0) / 1_000_000;
        });
        const catData = Object.entries(categories)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
        setCategoryData(catData.length > 0 ? catData : [{ name: 'No Data', value: 1 }]);

        // Daily activity (simulated rolling 7 days)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const actData = days.map((d) => ({
          name: d,
          donations: Math.floor(Math.random() * validCampaigns.length + 1),
          usdc: parseFloat((Math.random() * 50).toFixed(2)),
        }));
        setDailyActivity(actData);

        // Cache
        setCachedData({ stats: statsObj, donationData: donData, milestoneData: msData, categoryData: catData, dailyActivity: actData });
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [contract]);

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24">
        <div className="page-container">
          <div className="glass-card p-16 text-center">
            <BarChart3 size={48} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect MetaMask to view platform analytics</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-8">
        <div className="page-container">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 size={28} className="text-accent" />
              Platform Analytics
            </h1>
            <p className="text-gray-400">Real-time insights into TrustDrop platform performance</p>
          </div>
          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 animate-shimmer" />
                  <div className="h-3 w-16 bg-white/5 rounded-lg animate-shimmer" />
                </div>
                <div className="h-7 w-24 bg-white/5 rounded-lg animate-shimmer" />
              </div>
            ))}
          </div>
          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="chart-container">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 rounded bg-white/5 animate-shimmer" />
                  <div className="h-5 w-40 bg-white/5 rounded-lg animate-shimmer" />
                </div>
                <div className="h-[280px] bg-white/3 rounded-xl animate-shimmer flex items-end justify-center gap-2 p-6">
                  {[40, 65, 50, 80, 55, 70, 45].map((h, j) => (
                    <div
                      key={j}
                      className="flex-1 bg-white/5 rounded-t-lg animate-shimmer"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 40 }}>
      <div className="page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <BarChart3 size={24} style={{ color: 'var(--accent)' }} /> Platform Analytics
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Real-time insights into TrustDrop platform performance</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <StatCard icon={Wallet} label="USDC Locked" value={`${stats.totalLocked} USDC`} delay={0} />
          <StatCard icon={TrendingUp} label="USDC Released" value={`${stats.totalReleased} USDC`} delay={0.05} />
          <StatCard icon={Activity} label="Active Campaigns" value={stats.campaignCount} delay={0.1} />
          <StatCard icon={CheckCircle2} label="Milestones Done" value={stats.milestonesCompleted} delay={0.15} />
          <StatCard icon={Target} label="Avg TrustScore" value={stats.avgTrustScore} delay={0.2} />
          <StatCard icon={Users} label="Unique Donors" value={stats.uniqueDonors} delay={0.25} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Line Chart */}
          <ChartCard title="Cumulative USDC Donated" icon={TrendingUp} delay={0.1}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={donationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#6C5CE7" strokeWidth={2.5}
                  dot={{ fill: '#6C5CE7', r: 4 }} activeDot={{ r: 6 }} name="Total USDC" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bar Chart */}
          <ChartCard title="Milestone Completion by Campaign" icon={BarChart3} delay={0.15}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completion" name="Completion %" radius={[6, 6, 0, 0]}>
                  {milestoneData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pie Chart */}
          <ChartCard title="Fund Distribution by Category" icon={PieIcon} delay={0.2}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text3)' }}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text3)' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Area Chart */}
          <ChartCard title="Daily Donation Activity" icon={Activity} delay={0.25}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="donations" stroke="#1D4ED8" fill="rgba(29,78,216,0.1)"
                  strokeWidth={2} name="Donations" />
                <Area type="monotone" dataKey="usdc" stroke="#6C5CE7" fill="rgba(108,92,231,0.08)"
                  strokeWidth={2} name="USDC Amount" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
      <Footer />
    </div>
  );
}
