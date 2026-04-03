import { motion } from 'framer-motion';
import { FileText, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { useAppStore } from '@/store/appStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RISK_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981', UNKNOWN: '#6b7280' };

export default function Dashboard() {
  const { reports } = useAppStore();
  
  // Compute metrics from real reports
  const total_reports = reports.length;
  const total_cases = reports.reduce((acc, r) => acc + r.extracted_data.cases, 0);
  const high_risk_locations = reports.filter(r => r.risk_analysis.risk_level === 'HIGH').length;
  
  const risk_distribution = Object.entries(reports.reduce((acc: any, r) => {
    acc[r.risk_analysis.risk_level] = (acc[r.risk_analysis.risk_level] || 0) + 1;
    return acc;
  }, {})).map(([level, count]) => ({ level, count: count as number }));

  const timeline = reports.map(r => ({ date: r.extracted_data.date || 'Today', cases: r.extracted_data.cases }));
      
  const displayReports = reports.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Outbreak monitoring overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Reports" value={total_reports} icon={<FileText className="h-5 w-5" />} subtitle="+12 this week" trend="up" />
        <MetricCard title="Total Cases" value={total_cases} icon={<Users className="h-5 w-5" />} subtitle="+47 this week" trend="up" />
        <MetricCard title="High Risk Locations" value={high_risk_locations} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Requires attention" trend="up" />
        <MetricCard title="Risk Score (avg)" value="0.56" icon={<TrendingUp className="h-5 w-5" />} subtitle="Medium" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Cases Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Area type="monotone" dataKey="cases" stroke="#2563eb" fill="url(#caseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={risk_distribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={80} label={({ level, count }) => `${level}: ${count}`}>
                {risk_distribution.map((entry) => (
                  <Cell key={entry.level} fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Recent Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Cases</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayReports.length > 0 ? displayReports.map((r) => (
                <tr key={r.session_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{r.extracted_data.location}</td>
                  <td className="px-5 py-3">{r.extracted_data.cases}</td>
                  <td className="px-5 py-3"><RiskBadge level={r.risk_analysis.risk_level} /></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium capitalize ${r.status === 'pending' ? 'text-risk-medium' : r.status === 'approved' ? 'text-health' : 'text-risk-high'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr className="text-center text-muted-foreground italic">
                  <td colSpan={4} className="py-8">No reports processed yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
