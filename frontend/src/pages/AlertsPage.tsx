import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Map, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/RiskBadge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import EthiopiaMap from '@/components/EthiopiaMap';

export default function AlertsPage() {
  const { reports, updateReportStatus, setReports } = useAppStore();

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  const allReports = reports; 
  const pending = allReports.filter((r) => r.status === 'pending');
  const resolved = allReports.filter((r) => r.status !== 'pending');

  const handle = async (id: string, approved: boolean) => {
    try {
      await api.approveReport(id, approved);
      updateReportStatus(id, approved ? 'approved' : 'rejected');
      toast.success(approved ? 'Alert approved' : 'Alert rejected');
    } catch (error) {
      toast.error('Failed to update alert status');
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-risk-high">
            <AlertTriangle className="h-8 w-8" />
            Priority Validation
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Manual verification required for high-severity detections</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-2xl border border-border/50">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Pending Queue</span>
            <span className="text-xl font-black tracking-tight text-risk-high leading-none mt-1">{pending.length} ALERTS</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Live Intelligence Stream</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-health animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Monitoring</span>
            </div>
          </div>

          {pending.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-16 text-center border-dashed border-2">
              <div className="h-16 w-16 bg-health/10 text-health rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-xl font-black tracking-tight">System Baseline Stable</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto font-medium">All intelligence reports have been processed. No urgent validation required at this moment.</p>
            </motion.div>
          )}

          <div className="space-y-4">
            {pending.map((r, i) => (
              <motion.div
                key={r.session_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass-card rounded-3xl p-6 relative group border-l-[6px] transition-all hover:translate-x-1 shadow-sm hover:shadow-xl",
                  r.risk_analysis?.risk_level === 'HIGH' ? 'border-l-risk-high border-risk-high/10' :
                  r.risk_analysis?.risk_level === 'MEDIUM' ? 'border-l-risk-medium border-risk-medium/10' : 'border-l-risk-low border-risk-low/10'
                )}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <RiskBadge level={r.risk_analysis?.risk_level || 'UNKNOWN'} className="px-4 py-1.5" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SID: {r.session_id.slice(0, 8)}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">{r.alert?.title || 'Unknown Outbreak'}</h3>
                      <p className="text-muted-foreground text-sm font-medium mt-2 leading-relaxed italic border-l-2 pl-4 border-border/50">
                        {r.alert?.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="bg-muted/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-border/30">
                        <Map className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-tight">{r.extracted_data?.location || 'Unknown Location'}</span>
                      </div>
                      <div className="bg-muted/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-border/30">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-tight">{r.extracted_data?.cases || 0} CASES</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col justify-end gap-2 shrink-0">
                    <Button 
                      onClick={() => handle(r.session_id, true)} 
                      className="h-12 w-full sm:w-32 rounded-2xl bg-health hover:bg-health/90 text-white font-black shadow-lg shadow-health/20 gap-2 uppercase tracking-widest text-[10px]"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handle(r.session_id, false)} 
                      className="h-12 w-full sm:w-32 rounded-2xl border-2 font-black gap-2 uppercase tracking-widest text-[10px] hover:bg-risk-high hover:text-white hover:border-risk-high transition-all"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden bg-primary shadow-2xl shadow-primary/20 text-white border-none">
             <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
               <Map className="h-32 w-32" />
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black tracking-widest uppercase mb-1">Geospatial Distribution</h3>
               <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-tighter mb-8">Heatmap Analysis</p>
               <EthiopiaMap />
               <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                 <div>
                   <p className="text-[10px] font-black uppercase opacity-60">Total Locations</p>
                   <p className="text-2xl font-black leading-none mt-1">{reports.length > 0 ? [...new Set(reports.map(r => r.extracted_data?.location))].length : 0}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black uppercase opacity-60">System Version</p>
                   <p className="text-2xl font-black leading-none mt-1 uppercase">v2.4.0</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Archive History</h3>
            <div className="space-y-3">
              {resolved.length > 0 ? resolved.slice(0, 5).map((r) => (
                <div key={r.session_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 opacity-70 group hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      r.status === 'approved' ? 'bg-health shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-risk-high shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                    )} />
                    <div>
                      <p className="text-xs font-black tracking-tight leading-none truncate max-w-[150px] uppercase">{r.alert?.title || 'System Log'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1 tracking-tighter">{r.extracted_data?.location || 'Unidentified Region'}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                    r.status === 'approved' ? 'bg-health/10 text-health' : 'bg-risk-high/10 text-risk-high'
                  )}>{r.status}</span>
                </div>
              )) : (
                <p className="text-xs text-center text-muted-foreground italic font-medium">No archived events recorded</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
