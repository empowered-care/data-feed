import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Map as MapIcon, 
  Activity, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import EthiopiaMap from '@/components/EthiopiaMap';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RISK_COLORS = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#10b981', UNKNOWN: '#6b7280' };

export default function Dashboard() {
  const { reports, setReports } = useAppStore();
  const [loading, setLoading] = useState(reports.length === 0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real-world dynamic filtering
  const [timeFilter, setTimeFilter] = useState<'last24h' | 'all'>('last24h');
  const [riskFilter, setRiskFilter] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<'all' | 'Suspected' | 'Probable' | 'Confirmed'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
  
  // Derived filtered reports
  const filteredReports = reports.filter(r => {
    // 1. Time Filter
    if (timeFilter === 'last24h') {
      const now = new Date();
      const reportDate = new Date(r.created_at || r.timestamp || Date.now());
      const hoursDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) return false;
    }

    // 2. Risk Filter
    if (riskFilter !== 'all' && r.risk_analysis?.risk_level !== riskFilter) return false;

    // 3. Status Filter
    if (statusFilter !== 'all' && (r.status || 'pending') !== statusFilter) return false;

    // 4. Disease Filter
    if (diseaseFilter !== 'all' && (r.risk_analysis?.possible_disease || 'Unidentified') !== diseaseFilter) return false;

    // 5. Classification Filter
    if (classFilter !== 'all' && (r.extracted_data?.classification || 'Suspected') !== classFilter) return false;

    // 6. Location Filter
    if (locationFilter !== 'all' && r.extracted_data?.location !== locationFilter) return false;

    // 7. Search Term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const match = (r.extracted_data?.location || '').toLowerCase().includes(search) ||
                    (r.extracted_data?.symptoms || []).some(s => s.toLowerCase().includes(search)) ||
                    (r.risk_analysis?.possible_disease || '').toLowerCase().includes(search);
      if (!match) return false;
    }

    return true;
  });

  // Compute metrics from filtered reports
  const total_reports = filteredReports.length;
  const total_cases = reports.reduce((acc, r) => acc + (r.extracted_data?.cases || 0), 0);
  const active_cases = filteredReports.reduce((acc, r) => acc + (r.extracted_data?.cases || 0), 0);
  const high_risk_locations = filteredReports.filter(r => r.risk_analysis?.risk_level === 'HIGH').length;
  
  const diseases = Array.from(new Set(reports.map(r => r.risk_analysis?.possible_disease || 'Unidentified')));
  const locations = Array.from(new Set(reports.map(r => r.extracted_data?.location || 'Unknown'))).filter(l => l !== 'Unknown');

  // Significant Increase Logic (Monitoring)
  const getSignificantAlert = () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const locationCounts: Record<string, number> = {};
    
    reports.forEach(r => {
      const date = new Date(r.created_at || r.timestamp || Date.now());
      if (date >= sixHoursAgo) {
        const loc = r.extracted_data?.location;
        if (loc && loc !== 'Unknown') {
          locationCounts[loc] = (locationCounts[loc] || 0) + (r.extracted_data?.cases || 0);
        }
      }
    });
    
    const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0) {
      return { location: sorted[0][0], count: sorted[0][1] };
    }
    return null;
  };

  const activeAlert = getSignificantAlert();
  
  const risk_distribution = Object.entries(filteredReports.reduce((acc: any, r) => {
    const level = r.risk_analysis?.risk_level || 'UNKNOWN';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {})).map(([level, count]) => ({ name: level, value: count as number }));

  const timeline = filteredReports.map(r => ({ 
    date: r.extracted_data?.date || (r.created_at || r.timestamp ? new Date(r.created_at || r.timestamp).toLocaleDateString() : 'Today'), 
    cases: r.extracted_data?.cases || 0 
  })).reverse();
      
  const displayReports = filteredReports.slice(0, 15);

  const exportToCSV = () => {
    if (filteredReports.length === 0) {
      alert("No data available to export with current filters");
      return;
    }

    // Define headers
    const headers = ["Location", "Cases", "Report Date", "Disease", "Risk Level", "Status", "Timestamp"];
    
    // Map data
    const rows = filteredReports.map(r => [
      r.extracted_data?.location || "Unknown",
      r.extracted_data?.cases || 0,
      r.extracted_data?.date || "N/A",
      r.risk_analysis?.possible_disease || "Unknown",
      r.risk_analysis?.risk_level || "Unknown",
      r.status || "Pending",
      r.created_at || r.timestamp || "N/A"
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    // Create filename: day_month_year_hour
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const filename = `${day}_${month}_${year}_${hour}_Outbreak_Data.csv`;

    // Download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
              Live Surveillance
            </Badge>
          </div>
          <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Epidemic Intelligence
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Real-time disease outbreak detection & risk analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Search reports..."
              className="h-9 w-[200px] rounded-md border border-border/50 bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Time Filter Toggle */}
          <div className="bg-muted px-1 py-1 rounded-lg flex items-center gap-1 border border-border/50">
            <Button 
               variant={timeFilter === 'last24h' ? 'secondary' : 'ghost'} 
               size="sm" 
               onClick={() => setTimeFilter('last24h')}
               className="h-7 px-3 text-[10px] font-black uppercase tracking-widest"
            >
               <Clock className="h-3 w-3 mr-1.5" />
               Last 24h
            </Button>
            <Button 
               variant={timeFilter === 'all' ? 'secondary' : 'ghost'} 
               size="sm" 
               onClick={() => setTimeFilter('all')}
               className="h-7 px-3 text-[10px] font-black uppercase tracking-widest"
            >
               All Time
            </Button>
          </div>

          {/* Risk Filter Indicator/Action */}
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9 w-[130px] text-[10px] font-black uppercase bg-background border-border/50">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
              <SelectTrigger className="h-9 w-[150px] text-[10px] font-black uppercase bg-background border-border/50">
                <SelectValue placeholder="Disease" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Diseases</SelectItem>
                {diseases.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={(v: any) => setClassFilter(v)}>
              <SelectTrigger className="h-9 w-[130px] text-[10px] font-black uppercase bg-background border-border/50">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Suspected">Suspected</SelectItem>
                <SelectItem value="Probable">Probable</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRiskFilter(riskFilter === 'all' ? 'HIGH' : riskFilter === 'HIGH' ? 'MEDIUM' : 'all')}
              className={cn(
                "h-9 gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                riskFilter !== 'all' && "border-primary/50 bg-primary/5"
              )}
            >
              <Filter className={cn("h-4 w-4", riskFilter !== 'all' && "text-primary")} />
              {riskFilter === 'all' ? 'Risk' : `Risk: ${riskFilter}`}
            </Button>
          </div>

          <Button 
            size="sm" 
            onClick={exportToCSV}
            className="h-9 gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Geospatial Distribution</CardTitle>
                <CardDescription>Visualizing reported cases across regions</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-risk-high" />
                  <span className="text-[10px] font-bold uppercase">Active Hotspots</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EthiopiaMap />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cases Trend</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid hsl(var(--border))', 
                          background: 'hsl(var(--background)/0.8)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cases" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorCases)" 
                        strokeWidth={3}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Risk Profile</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-risk-medium" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2">
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={risk_distribution} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1000}
                      >
                        {risk_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black">{total_reports}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Reports</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  {risk_distribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[item.name as keyof typeof RISK_COLORS] }} />
                      <span className="text-[10px] font-bold uppercase">{item.name}</span>
                      <span className="ml-auto text-xs font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <MetricCard 
            title="Total Historical Cases" 
            value={total_cases} 
            icon={<FileText className="h-5 w-5" />} 
            subtitle="All-time cumulative ingestion" 
            className="shadow-primary/5"
          />
          <MetricCard 
            title="Active Filtered Cases" 
            value={active_cases} 
            icon={<Users className="h-5 w-5" />} 
            subtitle="Cases matching current view/filters" 
            trend="up" 
            className="shadow-primary/5"
          />
          <MetricCard 
            title="Critical Hubs" 
            value={high_risk_locations} 
            icon={<AlertTriangle className="h-5 w-5" />} 
            subtitle="Immediate response zones" 
            trend="up" 
            className="shadow-primary/5"
          />
          <MetricCard 
            title="System Health" 
            value="98.2%" 
            icon={<TrendingUp className="h-5 w-5" />} 
            subtitle="Agent nodes active" 
            className="shadow-primary/5"
          />

          <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <MapIcon className="h-4 w-4" />
                Regional Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {activeAlert ? (
                <>
                  <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                    <span className="font-bold text-primary">{activeAlert.location}</span> region is showing a <span className="font-bold text-risk-high underline decoration-2 underline-offset-2">Significant Increase</span> in reported cases over the last 6 hours.
                  </p>
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="px-0 mt-2 h-auto text-primary text-xs font-bold group-hover:gap-2 transition-all"
                    onClick={() => setLocationFilter(activeAlert.location)}
                  >
                    Investigate Cluster <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                  No significant regional alerts detected in the last 6 hours. System monitoring active.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
          <div>
            <CardTitle className="text-lg font-bold">Surveillance Feed</CardTitle>
            <CardDescription>Latest validated outbreak reports from agents</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider">
            View All Reports
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground bg-muted/20">
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Location Hub</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Pathology</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Cases</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Risk Profile</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {displayReports.length > 0 ? displayReports.map((r, i) => (
                  <motion.tr 
                    key={r.session_id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/vault/details/${r.session_id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">{r.extracted_data.location}</div>
                      <div className="text-[10px] text-muted-foreground">{(r.created_at || r.timestamp) ? new Date(r.created_at || r.timestamp).toLocaleTimeString() : 'Recently'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tighter bg-muted/50">
                        {r.risk_analysis?.possible_disease || 'Unidentified'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn(
                          "font-black text-[9px] uppercase tracking-widest w-fit",
                          r.extracted_data.classification === 'Confirmed' ? "bg-health/10 text-health border-health/20" :
                          r.extracted_data.classification === 'Probable' ? "bg-risk-medium/10 text-risk-medium border-risk-medium/20" :
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {r.extracted_data.classification || 'Suspected'}
                        </Badge>
                        <div className="flex items-center gap-1 opacity-60">
                           <div className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             r.validation?.valid ? "bg-health" : "bg-risk-high"
                           )} />
                           <span className="text-[8px] font-bold uppercase">{r.validation?.valid ? 'Validated' : 'Invalid'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-lg">{r.extracted_data.cases}</td>
                    <td className="px-6 py-4"><RiskBadge level={r.risk_analysis.risk_level} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr className="text-center text-muted-foreground italic">
                    <td colSpan={5} className="py-20">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-muted/20" />
                        <p>No surveillance reports available yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 hover:bg-muted/50 border border-border/50"
        >
          {showRaw ? 'Hide' : 'Show'} Full Raw Data Stream (Kernel)
        </button>
      </div>

      <AnimatePresence>
        {showRaw && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 glass-card p-4 rounded-xl overflow-hidden border border-border/50 bg-black/90 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-mono text-green-500 uppercase font-bold tracking-widest">FULL_DATA_VALIDATE_STRUCTURED_STREAM</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <pre className="text-[10px] font-mono text-green-400 p-4 rounded overflow-auto max-h-96 scrollbar-thin selection:bg-green-500/30">
              {JSON.stringify(filteredReports, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

