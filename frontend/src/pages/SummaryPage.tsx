import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Users, MapPin, AlertTriangle, BarChart3,
  TrendingUp, Activity, ChevronRight, Clock, Download,
  Shield, Droplets
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';
import type { SummaryData } from '@/types';

const RISK_COLORS: Record<string, string> = {
  HIGH: '#f43f5e',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
  UNKNOWN: '#6b7280',
};

function StatCard({ label, value, icon, sub, color = 'primary' }: any) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    red:     'bg-red-500/10 text-red-500 border-red-500/20',
    amber:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
    green:   'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/70 border border-border/40 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
    >
      <div className={cn('p-3 rounded-xl border shrink-0', colorMap[color])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-2xl font-black tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const { reports, setReports } = useAppStore();
  const [summary, setSummary] = useState<SummaryData>({ total_reports: 0, total_cases: 0, locations: [], timestamp: '' });

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  // --- Derived Data ---
  const reports_by_location = Object.entries(
    reports.reduce((acc: any, r) => {
      const loc = r.extracted_data?.location || 'Unknown';
      if (!acc[loc]) acc[loc] = { location: loc, count: 0, cases: 0, maxRisk: 'LOW' };
      acc[loc].count++;
      acc[loc].cases += r.extracted_data?.cases || 0;
      const risk = r.risk_analysis?.risk_level || 'LOW';
      if (risk === 'HIGH') acc[loc].maxRisk = 'HIGH';
      else if (risk === 'MEDIUM' && acc[loc].maxRisk !== 'HIGH') acc[loc].maxRisk = 'MEDIUM';
      return acc;
    }, {})
  )
    .map(([, v]) => v as { location: string; count: number; cases: number; maxRisk: string })
    .sort((a, b) => b.cases - a.cases);

  const total_reports = reports.length;
  const total_cases = reports.reduce((a, r) => a + (r.extracted_data?.cases || 0), 0);
  const high_risk = reports.filter(r => r.risk_analysis?.risk_level === 'HIGH').length;
  const locations_count = reports_by_location.length;
  const verified = reports.filter(r => r.status === 'approved').length;
  const pending = reports.filter(r => (r.status || 'pending') === 'pending').length;

  const risk_distribution = Object.entries(
    reports.reduce((acc: any, r) => {
      const l = r.risk_analysis?.risk_level || 'UNKNOWN';
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  const disease_distribution = Object.entries(
    reports.reduce((acc: any, r) => {
      const d = r.risk_analysis?.possible_disease || 'Unidentified';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const exportCSV = () => {
    const rows = [
      ['Location', 'Reports', 'Cases', 'Avg Cases/Report', 'Max Risk'],
      ...reports_by_location.map(l => [
        l.location, l.count, l.cases, (l.cases / l.count).toFixed(1), l.maxRisk
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `summary_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Epidemiological Summary</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Outbreak Intelligence Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aggregated statistics across all monitored zones ·{' '}
            <span className="font-bold">Last synced: {new Date().toLocaleTimeString()}</span>
          </p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border/50 bg-background/70 text-xs font-bold hover:bg-muted/50 transition-all self-start md:self-auto">
          <Download className="h-3.5 w-3.5" /> Export Summary CSV
        </button>
      </div>

      {/* ── KPI STRIP ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={total_reports} sub="All processed records"
          icon={<FileText className="h-4 w-4" />} color="primary" />
        <StatCard label="Total Cases" value={total_cases.toLocaleString()} sub="Cumulative case count"
          icon={<Users className="h-4 w-4" />} color="amber" />
        <StatCard label="HIGH Risk Zones" value={high_risk} sub="Require immediate action"
          icon={<AlertTriangle className="h-4 w-4" />} color="red" />
        <StatCard label="Monitored Regions" value={locations_count} sub="Active geographic zones"
          icon={<MapPin className="h-4 w-4" />} color="green" />
      </div>

      {/* ── STATUS STRIP ────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Verified', value: verified, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pending Review', value: pending, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Avg Cases / Report', value: total_reports > 0 ? (total_cases / total_reports).toFixed(1) : '0', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
        ].map(s => (
          <div key={s.label} className={cn('p-4 rounded-2xl border flex items-center justify-between', s.bg)}>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-black tabular-nums', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── CHART ROW ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Bar chart — full location breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest">Geographic Case Density</h2>
              <p className="text-[9px] text-muted-foreground mt-0.5">Cases vs. Reports by Location</p>
            </div>
            <div className="ml-auto flex items-center gap-3 text-[9px] font-black uppercase text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />Cases</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Reports</span>
            </div>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports_by_location} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                <XAxis dataKey="location" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(37,99,235,0.04)' }}
                  contentStyle={{
                    borderRadius: '12px', border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))', fontSize: '11px', fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="cases" name="Total Cases" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={24} />
                <Bar dataKey="count" name="Report Count" fill="#10b981" radius={[5, 5, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest">Risk Distribution</h2>
          </div>
          <div className="p-5">
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={risk_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                    paddingAngle={4} dataKey="value" animationBegin={100} animationDuration={800}>
                    {risk_distribution.map((entry, i) => (
                      <Cell key={i} fill={RISK_COLORS[entry.name]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black">{total_reports}</span>
                <span className="text-[9px] uppercase font-black text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {risk_distribution.map(r => (
                <div key={r.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/20 border border-border/30">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RISK_COLORS[r.name] }} />
                  <span className="text-[10px] font-black uppercase">{r.name}</span>
                  <span className="ml-auto text-xs font-black">{r.value}</span>
                  <span className="text-[9px] text-muted-foreground">({((r.value / total_reports) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── DISEASE BREAKDOWN ───────────────────── */}
      {disease_distribution.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest">Detected Pathologies</h2>
            <span className="ml-auto text-[9px] font-bold text-muted-foreground">{disease_distribution.length} conditions</span>
          </div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {disease_distribution.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/30">
                <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{d.name}</p>
                  <p className="text-[9px] text-muted-foreground">{d.value} report{d.value !== 1 ? 's' : ''}</p>
                </div>
                <div className="w-10 h-10 relative shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                      strokeDasharray={`${(d.value / total_reports) * 87.96} 87.96`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">
                    {((d.value / total_reports) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── REGIONAL TABLE ──────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
          <MapPin className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest">Regional Impact Analysis</h2>
            <p className="text-[9px] text-muted-foreground">All locations sorted by total case volume</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10 text-left">
                {['#', 'Region / Zone', 'Risk Level', 'Reports', 'Cases', 'Avg / Report', 'Share of Total'].map(h => (
                  <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {reports_by_location.map((loc, i) => {
                const share = total_cases > 0 ? (loc.cases / total_cases) * 100 : 0;
                return (
                  <tr key={loc.location}
                    onClick={() => navigate(`/dashboard`)}
                    className="hover:bg-primary/5 transition-colors cursor-pointer group">
                    <td className="px-5 py-4 text-[10px] font-black text-muted-foreground">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-bold text-foreground group-hover:text-primary transition-colors">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {loc.location}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RiskBadge level={loc.maxRisk} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-muted/40 border border-border/30">{loc.count}</span>
                    </td>
                    <td className="px-5 py-4 text-xl font-black tabular-nums text-foreground">{loc.cases}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-muted-foreground">
                      {(loc.cases / loc.count).toFixed(1)}
                    </td>
                    <td className="px-5 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all',
                            loc.maxRisk === 'HIGH' ? 'bg-red-500' :
                            loc.maxRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(100, share * 2)}%` }} />
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground w-8 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {reports_by_location.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/10">
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-[10px] font-black uppercase text-muted-foreground">TOTALS</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-[10px] font-black">{total_reports}</td>
                  <td className="px-5 py-3 text-base font-black text-primary">{total_cases.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-xs font-black">
                    {total_reports > 0 ? (total_cases / total_reports).toFixed(1) : '0'}
                  </td>
                  <td className="px-5 py-3 text-[10px] font-black text-muted-foreground">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>

      {/* ── RECENT DISEASE REPORTS ──────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest">Most Recent Alerts</h2>
          </div>
          <button onClick={() => navigate('/vault')}
            className="flex items-center gap-1 text-[10px] font-black text-primary hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-border/30">
          {reports.slice(0, 5).map(r => (
            <div key={r.session_id}
              onClick={() => navigate(`/vault/details/${r.session_id}`)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-primary/5 cursor-pointer group transition-colors">
              <RiskBadge level={r.risk_analysis?.risk_level || 'UNKNOWN'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {r.alert?.title || r.risk_analysis?.possible_disease || 'Unknown Alert'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <MapPin className="h-2.5 w-2.5" />{r.extracted_data?.location}
                  <span>·</span>
                  <Users className="h-2.5 w-2.5" />{r.extracted_data?.cases} cases
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-mono text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                </p>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
