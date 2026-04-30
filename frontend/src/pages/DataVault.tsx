import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function DataVault() {
  const navigate = useNavigate();
  const { reports, setReports } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showDetailedTable, setShowDetailedTable] = useState(false);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Database className="h-7 w-7 text-primary" />
            Surveillance Archive
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Historical records of all processed regional health reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showDetailedTable ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowDetailedTable(!showDetailedTable)} 
            className="gap-2 font-medium text-xs h-10 shadow-sm rounded-xl"
          >
            <Database className="h-4 w-4" /> {showDetailedTable ? "Standard View" : "Detailed View"}
          </Button>
          <Button variant="default" size="sm" onClick={exportData} className="gap-2 font-medium text-xs h-10 shadow-sm rounded-xl">
            <Download className="h-4 w-4" /> Export Archive
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 bg-background/80 backdrop-blur-xl border border-border/40 p-2 rounded-2xl shadow-sm w-full md:w-auto">
        <div className="relative flex-1 sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search locations or conditions..." 
            className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-border/50 hidden sm:block mx-1" />
        <div className="flex items-center gap-1">
           {[
             { label: 'All Levels', value: 'ALL' },
             { label: 'High', value: 'HIGH' },
             { label: 'Medium', value: 'MEDIUM' },
             { label: 'Low', value: 'LOW' }
           ].map(level => (
             <Button
                key={level.value}
                variant={((level.value === 'ALL' && !filterRisk) || (filterRisk === level.value)) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterRisk(level.value === 'ALL' ? null : (filterRisk === level.value ? null : level.value))}
                className={cn(
                  "h-8 rounded-lg text-xs font-medium px-3",
                  ((level.value === 'ALL' && !filterRisk) || (filterRisk === level.value))
                    ? "shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
             >
               {level.label}
             </Button>
           ))}
        </div>
      </div>

      <div className="border-none shadow-xl shadow-border/5 overflow-hidden bg-background/60 backdrop-blur-md border border-border/40 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 text-left text-muted-foreground border-b border-border/40">
                <th className="px-6 py-4 font-semibold text-xs tracking-wide">Date</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wide">Location</th>
                {showDetailedTable ? (
                  <>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Validation</th>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Consensus Notes</th>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Symptoms</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Condition</th>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Cases</th>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Risk Level</th>
                    <th className="px-6 py-4 font-semibold text-xs tracking-wide">Context</th>
                  </>
                )}
                <th className="px-6 py-4 text-right font-semibold text-xs tracking-wide">Details</th>
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
                  
                  {showDetailedTable ? (
                    <>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={cn(
                            "w-fit font-bold uppercase text-[9px]",
                            r.validation?.valid ? "bg-health/10 text-health border-health/20" : "bg-risk-high/10 text-risk-high border-risk-high/20"
                          )}>
                            {r.validation?.valid ? "VALID" : "INVALID"}
                          </Badge>
                          <span className="text-[9px] font-bold text-muted-foreground">{Math.round((r.validation?.confidence || 0) * 100)}% Confidence</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                         <p className="text-[10px] font-medium leading-tight line-clamp-3 italic text-muted-foreground">
                            "{r.consensus?.final_reasoning || r.risk_analysis?.reason}"
                         </p>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {r.extracted_data.symptoms.slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-[8px] font-bold px-1.5 py-0 bg-muted/50">
                                {s}
                              </Badge>
                            ))}
                            {r.extracted_data.symptoms.length > 3 && (
                              <span className="text-[8px] font-bold text-muted-foreground">+{r.extracted_data.symptoms.length - 3} more</span>
                            )}
                         </div>
                      </td>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                  
                  <td className="px-6 py-5 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vault/details/${r.session_id}`);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-50">
                      <Database className="h-10 w-10" />
                      <p className="font-medium text-sm">No archive records found</p>
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
              className="border border-border/40 rounded-2xl p-6 md:p-8 bg-muted/10 shadow-sm"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detailed Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {report.extracted_data.symptoms.map(s => (
                        <Badge key={s} variant="secondary" className="font-medium text-[11px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analysis Notes</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground/80">
                      {report.risk_analysis?.reason}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {report.context_research && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Environmental Context
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 bg-background rounded-xl border border-border/40">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Water Quality</p>
                              <p className="text-xs font-medium mt-0.5">{report.context_research.water_quality}</p>
                           </div>
                           <div className="p-3 bg-background rounded-xl border border-border/40">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Temp/Environment</p>
                              <p className="text-xs font-medium mt-0.5">{report.context_research.temperature}</p>
                           </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Security & Context</p>
                        <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                          {report.context_research.security_status}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-2xl border border-border/40 shadow-sm">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Key Recommendations
                    </p>
                    <ul className="space-y-2.5">
                      {report.alert?.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-xs font-medium leading-tight flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs font-medium rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vault/details/${report.session_id}`);
                      }}
                    >
                      View Full Report
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs font-medium rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.extracted_data.location)}`, '_blank');
                      }}
                    >
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
