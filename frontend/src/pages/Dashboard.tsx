import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Users, AlertTriangle, Activity, ArrowUpRight,
  Filter, Download, Search, Clock, TrendingUp, Zap,
  ShieldAlert, MapPin, RefreshCw, ChevronRight
} from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';
import EthiopiaMap from '@/components/EthiopiaMap';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RISK_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981', UNKNOWN: '#6b7280' };

function StatCard({ label, value, sub, icon, color = 'primary', trend }: any) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/70 backdrop-blur-md border border-border/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-border transition-all"
    >
      <div className={cn('p-3 rounded-xl border', colorMap[color])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-black tabular-nums text-foreground leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>}
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full',
          trend === 'up' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500')}>
          <TrendingUp className="h-3 w-3" />
          {trend === 'up' ? 'Rising' : 'Stable'}
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { reports, setReports } = useAppStore();
  const [loading, setLoading] = useState(reports.length === 0);
  const [riskFilter, setRiskFilter] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'last24h' | 'all'>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [setReports]);

  const filteredReports = reports.filter(r => {
    if (timeFilter === 'last24h') {
      const hoursDiff = (Date.now() - new Date(r.created_at || r.timestamp || Date.now()).getTime()) / 3600000;
      if (hoursDiff > 24) return false;
    }
    if (riskFilter !== 'all' && r.risk_analysis?.risk_level !== riskFilter) return false;
    if (locationFilter !== 'all' && r.extracted_data?.location !== locationFilter) return false;
    if (diseaseFilter !== 'all' && (r.risk_analysis?.possible_disease || 'Unidentified') !== diseaseFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match = (r.extracted_data?.location || '').toLowerCase().includes(s) ||
                    (r.risk_analysis?.possible_disease || '').toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const total_reports = filteredReports.length;
  const total_cases = filteredReports.reduce((a, r) => a + (r.extracted_data?.cases || 0), 0);
  const high_risk = filteredReports.filter(r => r.risk_analysis?.risk_level === 'HIGH').length;
  const pending = filteredReports.filter(r => (r.status || 'pending') === 'pending').length;

  const diseases = Array.from(new Set(reports.map(r => r.risk_analysis?.possible_disease || 'Unidentified')));
  const locations = Array.from(new Set(reports.map(r => r.extracted_data?.location || 'Unknown'))).filter(l => l !== 'Unknown');

  const risk_distribution = Object.entries(
    filteredReports.reduce((acc: any, r) => {
      const level = r.risk_analysis?.risk_level || 'UNKNOWN';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  // Aggregate cases by date — deduplicated and sorted chronologically
  const timeline = Object.entries(
    [...filteredReports].reduce((acc: Record<string, number>, r) => {
      const raw = r.created_at || r.timestamp || null;
      const label = raw
        ? new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Unknown';
      acc[label] = (acc[label] || 0) + (r.extracted_data?.cases || 0);
      return acc;
    }, {})
  )
    .map(([date, cases]) => ({ date, cases }))
    .slice(-14); // show last 14 unique days max

  const exportToCSV = () => {
    if (!filteredReports.length) return;
    const headers = ['Location', 'Cases', 'Date', 'Disease', 'Risk Level', 'Status'];
    const rows = filteredReports.map(r => [
      r.extracted_data?.location, r.extracted_data?.cases,
      r.extracted_data?.date || 'N/A', r.risk_analysis?.possible_disease,
      r.risk_analysis?.risk_level, r.status || 'pending'
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `outbreak_export_${Date.now()}.csv`;
    a.click();
  };

  const activeFiltersCount = [riskFilter !== 'all', locationFilter !== 'all', diseaseFilter !== 'all', searchTerm].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Surveillance Feed</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Geospatial Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Regional health monitoring · Ethiopia Disease Surveillance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}
            className="h-9 gap-2 text-xs font-bold rounded-xl border-border/50 hover:bg-muted/50">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={exportToCSV}
            className="h-9 gap-2 text-xs font-bold rounded-xl shadow-sm">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── ALERT BANNER (when high risk detected) ──────── */}
      {high_risk > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 px-5 py-3 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <div className="p-2 rounded-xl bg-red-500/10">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-500">{high_risk} Critical Outbreak{high_risk > 1 ? 's' : ''} Detected</p>
            <p className="text-[11px] text-muted-foreground">Immediate field investigation recommended for HIGH-risk regions.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRiskFilter('HIGH')}
            className="text-red-500 hover:bg-red-500/10 text-xs font-bold gap-1 rounded-xl shrink-0">
            View <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}

      {/* ── KPI STAT STRIP ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Reports" value={total_reports} sub={`${timeFilter === 'last24h' ? 'Last 24h' : 'All time'}`}
          icon={<FileText className="h-5 w-5" />} color="primary" />
        <StatCard label="Total Cases" value={total_cases.toLocaleString()} sub="Cumulative across filters"
          icon={<Users className="h-5 w-5" />} color="amber" trend={total_cases > 50 ? 'up' : undefined} />
        <StatCard label="HIGH Risk Zones" value={high_risk} sub="Require immediate action"
          icon={<AlertTriangle className="h-5 w-5" />} color="red" trend={high_risk > 0 ? 'up' : undefined} />
        <StatCard label="Pending Review" value={pending} sub="Awaiting verification"
          icon={<Clock className="h-5 w-5" />} color="green" />
      </div>

      {/* ── FILTER BAR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-3 bg-background/60 backdrop-blur border border-border/40 rounded-2xl">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="h-4 w-px bg-border/50 hidden sm:block" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search location, disease..."
            className="h-9 w-52 pl-9 pr-3 text-xs rounded-xl bg-muted/30 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Time */}
        <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
          <SelectTrigger className="h-9 w-32 text-xs font-bold bg-muted/30 border-border/40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="last24h">Last 24h</SelectItem>
          </SelectContent>
        </Select>

        {/* Risk */}
        <Select value={riskFilter} onValueChange={(v: any) => setRiskFilter(v)}>
          <SelectTrigger className={cn('h-9 w-32 text-xs font-bold border-border/40 rounded-xl',
            riskFilter !== 'all' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/30')}>
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="HIGH">🔴 HIGH</SelectItem>
            <SelectItem value="MEDIUM">🟡 MEDIUM</SelectItem>
            <SelectItem value="LOW">🟢 LOW</SelectItem>
          </SelectContent>
        </Select>

        {/* Location */}
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="h-9 w-36 text-xs font-bold bg-muted/30 border-border/40 rounded-xl">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Disease */}
        <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
          <SelectTrigger className="h-9 w-40 text-xs font-bold bg-muted/30 border-border/40 rounded-xl">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {diseases.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => { setRiskFilter('all'); setLocationFilter('all'); setDiseaseFilter('all'); setSearchTerm(''); setTimeFilter('all'); }}>
            Clear all
          </Button>
        )}

        <div className="sm:ml-auto text-[10px] font-bold text-muted-foreground">
          {filteredReports.length} of {reports.length} records
        </div>
      </div>

      {/* ── MAIN GRID: MAP + CHARTS ─────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Interactive Map — spans 2 cols */}
        <Card className="lg:col-span-2 border border-border/40 shadow-xl shadow-primary/5 bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/40">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Interactive Surveillance Map
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Click regions to drill into outbreak data</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EthiopiaMap />
          </CardContent>
        </Card>

        {/* Right column: Pie + Trend */}
        <div className="space-y-6">
          {/* Risk Distribution Donut */}
          <Card className="border border-border/40 shadow-lg bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-border/40">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Activity className="h-4 w-4 text-primary" /> Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={risk_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                      paddingAngle={4} dataKey="value" animationBegin={100} animationDuration={900}>
                      {risk_distribution.map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black">{total_reports}</span>
                  <span className="text-[9px] uppercase font-black text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {risk_distribution.map(item => (
                  <button key={item.name}
                    onClick={() => setRiskFilter(item.name as any)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/60 transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RISK_COLORS[item.name as keyof typeof RISK_COLORS] }} />
                    <span className="text-[10px] font-black uppercase">{item.name}</span>
                    <span className="ml-auto text-xs font-black">{item.value}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cases Trend mini chart */}
          <Card className="border border-border/40 shadow-lg bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-border/40">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="h-4 w-4 text-primary" /> Case Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.4)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="cases" stroke="hsl(var(--primary))" fill="url(#caseGrad)" strokeWidth={2.5} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── REPORTS TABLE ───────────────────────────────── */}
      <Card className="border border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Outbreak Intelligence Feed
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredReports.length} records · click any row to open full details
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
              <Activity className="h-8 w-8 animate-pulse text-primary/50" />
              <p className="text-sm font-bold">Loading surveillance data...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
              <FileText className="h-10 w-10 text-muted/20" />
              <p className="text-sm font-bold">No reports match current filters</p>
              <Button variant="outline" size="sm" className="rounded-xl text-xs"
                onClick={() => { setRiskFilter('all'); setLocationFilter('all'); setDiseaseFilter('all'); setSearchTerm(''); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10 text-left">
                    {['Location / Time', 'Condition', 'Classification', 'Cases', 'Risk', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredReports.slice(0, 20).map((r, i) => (
                    <motion.tr
                      key={r.session_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/vault/details/${r.session_id}`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          {r.extracted_data?.location}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {r.created_at ? new Date(r.created_at).toLocaleString() : 'Recently'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tight bg-muted/50 border border-border/40">
                          {r.risk_analysis?.possible_disease || 'Unidentified'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border',
                          r.extracted_data?.classification === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          r.extracted_data?.classification === 'Probable' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-muted text-muted-foreground border-border/40'
                        )}>
                          {r.extracted_data?.classification || 'Suspected'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-xl tabular-nums">{r.extracted_data?.cases}</td>
                      <td className="px-5 py-4"><RiskBadge level={r.risk_analysis?.risk_level} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full',
                            r.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')} />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {r.status === 'approved' ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="icon"
                          className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length > 20 && (
                <div className="px-6 py-4 border-t border-border/40 text-center">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-2"
                    onClick={() => window.location.href = '/vault'}>
                    View all {filteredReports.length} records in Data Vault <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
