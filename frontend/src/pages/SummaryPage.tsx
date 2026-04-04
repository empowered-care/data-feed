import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetricCard } from '@/components/MetricCard';
import { api } from '@/lib/api';
import { FileText, Users, MapPin, AlertTriangle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store/appStore';
import type { SummaryData } from '@/types';

export default function SummaryPage() {
  const { reports, setReports } = useAppStore();
  const [summary, setSummary] = useState<SummaryData>({ total_reports: 0, total_cases: 0, locations: [], timestamp: '' });
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  // Compute breakdown from store reports
  const reports_by_location = Object.entries(reports.reduce((acc: any, r) => {
    const locName = r.extracted_data?.location || 'Unknown';
    if (!acc[locName]) acc[locName] = { location: locName, count: 0, cases: 0 };
    acc[locName].count++;
    acc[locName].cases += (r.extracted_data?.cases || 0);
    return acc;
  }, {})).map(([_, v]) => v as { location: string; count: number; cases: number })
  .sort((a, b) => b.cases - a.cases);

  const total_reports = summary.total_reports || reports.length;
  const total_cases = reports.reduce((acc, r) => acc + (r.extracted_data?.cases || 0), 0);
  const locations_count = reports_by_location.length;
  const high_risk_locations = reports.filter(r => r.risk_analysis?.risk_level === 'HIGH').length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Epidemiological Summary
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Aggregated outbreak statistics across monitored zones</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Synced</p>
          <p className="text-sm font-black tracking-tight">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Intelligence Logs" value={total_reports} icon={<FileText className="h-5 w-5" />} />
        <MetricCard title="Patient Registry" value={total_cases} icon={<Users className="h-5 w-5" />} />
        <MetricCard title="Critical Hotspots" value={high_risk_locations} icon={<AlertTriangle className="h-5 w-5" />} className="border-risk-high/20" />
        <MetricCard title="Monitored Regions" value={locations_count} icon={<MapPin className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-12 glass-card rounded-3xl p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold tracking-tight">Geographic Case Density</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Cases vs. Reports by Location</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports_by_location} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="location" 
                  tick={{ fontSize: 10, fontWeight: '700' }} 
                  stroke="hsl(var(--muted-foreground))" 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: '700' }} 
                  stroke="hsl(var(--muted-foreground))" 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(37,99,235,0.05)' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border))', 
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar dataKey="cases" name="Total Cases" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="count" name="Report Count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-12 glass-card rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-border/50">
            <h3 className="text-xl font-bold tracking-tight">Regional Impact Analysis</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Detailed breakdown of geographic data points</p>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-left text-muted-foreground">
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Region / Zone</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Intelligence Reports</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Confirmed Cases</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Transmission Density</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {reports_by_location.map((loc, i) => (
                  <tr key={loc.location} className="hover:bg-muted/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-bold tracking-tight text-base">{loc.location}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-bold">{loc.count} LOGS</span>
                    </td>
                    <td className="px-8 py-5 font-black text-lg text-primary">{loc.cases}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min(100, (loc.cases / total_cases) * 100 * 2)}%` }} 
                          />
                        </div>
                        <span className="font-black text-xs tracking-tighter">{(loc.cases / loc.count).toFixed(1)} AVG</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-3"
        >
          <div className="h-[1px] w-12 bg-border/50" />
          {showRaw ? 'Conceal Analytic Matrix' : 'Expose Analytic Matrix'}
          <div className="h-[1px] w-12 bg-border/50" />
        </button>
      </div>
      
      <AnimatePresence>
        {showRaw && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 glass-card p-6 rounded-3xl overflow-hidden border-primary/20 shadow-2xl"
          >
            <pre className="text-[10px] font-mono text-green-400 bg-black/90 p-6 rounded-2xl overflow-auto max-h-96 scrollbar-thin border border-white/5">
              {JSON.stringify({ summary, internal_reports: reports }, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
