import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from '@/components/MetricCard';
import { api } from '@/lib/api';
import { FileText, Users, MapPin, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store/appStore';
import type { SummaryData } from '@/types';

export default function SummaryPage() {
  const { reports } = useAppStore();
  const [summary, setSummary] = useState<SummaryData>({ total_reports: 0, total_cases: 0, locations: [], timestamp: '' });
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
  }, []);

  // Compute breakdown from store reports
  const reports_by_location = Object.entries(reports.reduce((acc: any, r) => {
    if (!acc[r.extracted_data.location]) acc[r.extracted_data.location] = { location: r.extracted_data.location, count: 0, cases: 0 };
    acc[r.extracted_data.location].count++;
    acc[r.extracted_data.location].cases += r.extracted_data.cases;
    return acc;
  }, {})).map(([_, v]) => v as { location: string; count: number; cases: number });

  const total_reports = summary.total_reports || reports.length;
  const total_cases = reports.reduce((acc, r) => acc + r.extracted_data.cases, 0);
  const locations_count = summary.locations?.length || reports_by_location.length;
  const high_risk_locations = reports.filter(r => r.risk_analysis.risk_level === 'HIGH').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Summary</h2>
        <p className="text-sm text-muted-foreground">Comprehensive outbreak statistics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Reports" value={total_reports} icon={<FileText className="h-5 w-5" />} />
        <MetricCard title="Total Cases" value={total_cases} icon={<Users className="h-5 w-5" />} />
        <MetricCard title="High Risk Areas" value={high_risk_locations} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard title="Locations Tracked" value={reports_by_location.length} icon={<MapPin className="h-5 w-5" />} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <h3 className="font-semibold mb-4">Cases by Location</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reports_by_location}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="location" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
            <Bar dataKey="cases" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Location Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Reports</th>
                <th className="px-5 py-3 font-medium">Cases</th>
                <th className="px-5 py-3 font-medium">Avg Cases/Report</th>
              </tr>
            </thead>
            <tbody>
              {reports_by_location.map((loc) => (
                <tr key={loc.location} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{loc.location}</td>
                  <td className="px-5 py-3">{loc.count}</td>
                  <td className="px-5 py-3">{loc.cases}</td>
                  <td className="px-5 py-3">{(loc.cases / loc.count).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="pt-8">
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          {showRaw ? 'Hide' : 'Show'} Raw Analysis Data
        </button>
        {showRaw && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 glass-card p-4 rounded-lg overflow-hidden"
          >
            <pre className="text-[10px] font-mono text-green-400 bg-black/80 p-4 rounded overflow-auto max-h-80">
              {JSON.stringify({ summary, internal_reports: reports }, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
