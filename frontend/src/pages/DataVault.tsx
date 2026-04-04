import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  MoreHorizontal,
  ExternalLink,
  Shield,
  Droplets,
  Thermometer,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function DataVault() {
  const { reports, setReports } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.extracted_data.location.toLowerCase().includes(search.toLowerCase()) ||
      (r.risk_analysis?.possible_disease || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = !filterRisk || r.risk_analysis?.risk_level === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const exportData = () => {
    if (filteredReports.length === 0) {
      alert("No data available to export with current filters");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredReports, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `epidemiological_archive_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Intelligence Vault
          </h2>
          <p className="text-muted-foreground font-medium">Historical repository of all analyzed epidemiological signals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData} className="gap-2 font-bold uppercase tracking-widest text-[10px] h-10 shadow-sm">
            <Download className="h-4 w-4" /> Export Archive
          </Button>
        </div>
      </div>

      <div className="grid md:flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by location or disease pathology..." 
            className="pl-10 h-12 bg-background/50 border-2 border-border/50 focus:border-primary/50 transition-all rounded-xl font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
             <button
                key={level}
                onClick={() => setFilterRisk(level === 'ALL' ? null : (filterRisk === level ? null : level))}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                  (level === 'ALL' && !filterRisk) || (filterRisk === level)
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
                )}
             >
               {level}
             </button>
           ))}
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border-border/40 shadow-2xl bg-background/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-muted-foreground border-b border-border/50">
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Transmission Date</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Location Hub</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Pathology</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Case Volume</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Threat Level</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Web Context</th>
                <th className="px-6 py-5 text-right font-black uppercase tracking-widest text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredReports.map((r, i) => (
                <motion.tr 
                  key={r.session_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(selectedReport === r.session_id ? null : r.session_id)}
                >
                  <td className="px-6 py-5 whitespace-nowrap font-mono text-[11px] text-muted-foreground font-bold">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{r.extracted_data.location}</div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tighter bg-muted/50">
                      {r.risk_analysis?.possible_disease || 'Unidentified'}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 font-black text-lg tabular-nums">
                    {r.extracted_data.cases}
                  </td>
                  <td className="px-6 py-5">
                    <RiskBadge level={r.risk_analysis?.risk_level} />
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-2">
                        {r.context_research ? (
                          <>
                            <Shield className={cn("h-3.5 w-3.5", r.context_research.conflict_zone ? "text-risk-high" : "text-health")} />
                            <Droplets className="h-3.5 w-3.5 text-primary" />
                            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic font-medium">No Data</span>
                        )}
                     </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground opacity-30">
                      <Database className="h-16 w-16" />
                      <p className="font-black uppercase tracking-widest text-sm">Vault Empty or No Matches Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedReport && reports.find(r => r.session_id === selectedReport) && (() => {
          const report = reports.find(r => r.session_id === selectedReport)!;
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-[2rem] p-8 border-primary/20 shadow-2xl bg-primary/5"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Detailed Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {report.extracted_data.symptoms.map(s => (
                        <Badge key={s} variant="outline" className="font-bold uppercase text-[9px] bg-background border-primary/20 text-primary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">AI Reasoning</p>
                    <p className="text-xs font-medium leading-relaxed italic text-foreground/80">
                      "{report.risk_analysis?.reason}"
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {report.context_research && (
                    <>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shield className="h-3 w-3" /> Environmental Intelligence
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 bg-background rounded-xl border border-border/50">
                              <p className="text-[8px] font-bold text-muted-foreground uppercase">Water Quality</p>
                              <p className="text-[10px] font-black uppercase">{report.context_research.water_quality}</p>
                           </div>
                           <div className="p-3 bg-background rounded-xl border border-border/50">
                              <p className="text-[8px] font-bold text-muted-foreground uppercase">Temp/Environment</p>
                              <p className="text-[10px] font-black uppercase">{report.context_research.temperature}</p>
                           </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Web Narrative Summary</p>
                        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                          {report.context_research.security_status}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-2xl border border-primary/20 shadow-sm">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" /> System Recommendation
                    </p>
                    <ul className="space-y-2">
                      {report.alert?.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-[10px] font-bold leading-tight flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-[9px] font-black uppercase border border-border/50 rounded-xl">
                      View Full File
                    </Button>
                    <Button size="sm" className="flex-1 text-[9px] font-black uppercase rounded-xl">
                      Open in Maps
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
