import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, MapPin, Users,
  Clock, Shield, Activity, ChevronRight, Bell, BellOff,
  Filter, ExternalLink, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/RiskBadge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import EthiopiaMap from '@/components/EthiopiaMap';

export default function AlertsPage() {
  const navigate = useNavigate();
  const { reports, updateReportStatus, setReports } = useAppStore();
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  const pending = reports
    .filter(r => (r.status || 'pending') === 'pending')
    .filter(r => !filterRisk || r.risk_analysis?.risk_level === filterRisk)
    .sort((a, b) => {
      const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (order[b.risk_analysis?.risk_level || 'LOW'] || 0) - (order[a.risk_analysis?.risk_level || 'LOW'] || 0);
    });

  const resolved = reports.filter(r => r.status && r.status !== 'pending');
  const highCount = reports.filter(r => (r.status || 'pending') === 'pending' && r.risk_analysis?.risk_level === 'HIGH').length;
  const totalPending = reports.filter(r => (r.status || 'pending') === 'pending').length;

  const handle = async (id: string, approved: boolean) => {
    setProcessing(id);
    try {
      await api.approveReport(id, approved);
      updateReportStatus(id, approved ? 'approved' : 'rejected');
      toast.success(approved ? '✅ Alert verified and approved' : '🚫 Alert rejected');
      setExpandedId(null);
    } catch {
      toast.error('Failed to update alert status');
    } finally {
      setProcessing(null);
    }
  };

  const riskColor = (level?: string) => {
    if (level === 'HIGH') return 'border-l-red-500 bg-red-500/3';
    if (level === 'MEDIUM') return 'border-l-amber-500 bg-amber-500/3';
    return 'border-l-emerald-500 bg-emerald-500/3';
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── PAGE HEADER ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {totalPending > 0
              ? <Bell className="h-4 w-4 text-red-500 animate-bounce" />
              : <BellOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Alert Review Queue
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Priority Validation Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and approve outbreak alerts requiring manual verification</p>
        </div>

        {/* KPI badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className={cn('px-4 py-2 rounded-xl border flex items-center gap-2',
            highCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-muted/30 border-border/40')}>
            <AlertTriangle className={cn('h-4 w-4', highCount > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground">Critical</p>
              <p className={cn('text-xl font-black leading-none', highCount > 0 ? 'text-red-500' : 'text-foreground')}>{highCount}</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl border border-border/40 bg-muted/30 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground">Pending</p>
              <p className="text-xl font-black leading-none text-amber-500">{totalPending}</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl border border-border/40 bg-muted/30 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground">Resolved</p>
              <p className="text-xl font-black leading-none text-emerald-500">{resolved.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ───────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Left: Alert Queue (3 cols) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Filter:</span>
            {[
              { label: 'All', value: null },
              { label: '🔴 HIGH', value: 'HIGH' },
              { label: '🟡 MEDIUM', value: 'MEDIUM' },
              { label: '🟢 LOW', value: 'LOW' },
            ].map(f => (
              <button key={String(f.value)} onClick={() => setFilterRisk(f.value)}
                className={cn('h-7 px-3 rounded-lg text-[10px] font-black uppercase border transition-all',
                  filterRisk === f.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60')}>
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] font-bold text-muted-foreground">{pending.length} alerts</span>
          </div>

          {/* Empty state */}
          {pending.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-20 bg-background/70 border border-dashed border-border/50 rounded-2xl text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-black text-base">All Clear</p>
                <p className="text-sm text-muted-foreground mt-1">No pending alerts requiring review{filterRisk ? ` at ${filterRisk} risk` : ''}.</p>
              </div>
              {filterRisk && (
                <button onClick={() => setFilterRisk(null)}
                  className="text-xs font-bold text-primary hover:underline">Clear filter</button>
              )}
            </motion.div>
          )}

          {/* Alert cards */}
          <div className="space-y-3">
            {pending.map((r, i) => {
              const isExpanded = expandedId === r.session_id;
              const isProcessing = processing === r.session_id;
              return (
                <motion.div key={r.session_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    'border-l-4 bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all',
                    riskColor(r.risk_analysis?.risk_level)
                  )}>

                  {/* Card header — always visible */}
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.session_id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <RiskBadge level={r.risk_analysis?.risk_level || 'UNKNOWN'} />
                          <span className="text-[9px] font-mono font-bold text-muted-foreground">
                            #{r.session_id.slice(0, 8)}
                          </span>
                          {r.risk_analysis?.risk_level === 'HIGH' && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                              <Zap className="h-2.5 w-2.5" /> Urgent
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-base leading-tight text-foreground">
                          {r.alert?.title || 'Unknown Outbreak Alert'}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <MapPin className="h-3 w-3 text-primary" />
                            {r.extracted_data?.location || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <Users className="h-3 w-3 text-primary" />
                            {r.extracted_data?.cases || 0} cases
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <Clock className="h-3 w-3 text-primary" />
                            {r.created_at ? new Date(r.created_at).toLocaleString() : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform', isExpanded && 'rotate-90')} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border/30"
                      >
                        <div className="p-5 space-y-4 bg-muted/10">

                          {/* Alert message */}
                          {r.alert?.message && (
                            <div className="p-3 bg-background rounded-xl border border-border/40">
                              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Alert Message</p>
                              <p className="text-xs font-medium leading-relaxed text-foreground/80 italic">"{r.alert.message}"</p>
                            </div>
                          )}

                          {/* Symptoms + Disease */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-background rounded-xl border border-border/40">
                              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1.5">Detected Pathology</p>
                              <p className="text-sm font-black text-primary">{r.risk_analysis?.possible_disease || 'Unidentified'}</p>
                            </div>
                            <div className="p-3 bg-background rounded-xl border border-border/40">
                              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1.5">Classification</p>
                              <p className="text-sm font-bold">{r.extracted_data?.classification || 'Suspected'}</p>
                            </div>
                          </div>

                          {/* Symptoms */}
                          {r.extracted_data?.symptoms?.length > 0 && (
                            <div>
                              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1.5">Clinical Signs</p>
                              <div className="flex flex-wrap gap-1.5">
                                {r.extracted_data.symptoms.map((s: string) => (
                                  <span key={s} className="px-2.5 py-1 text-[10px] font-bold bg-background border border-border/50 rounded-lg">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Reason */}
                          {r.risk_analysis?.reason && (
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 flex items-center gap-1">
                                <Activity className="h-2.5 w-2.5 text-primary" /> AI Analysis
                              </p>
                              <p className="text-xs font-medium leading-relaxed text-foreground/80">
                                {r.risk_analysis.reason.length > 200
                                  ? r.risk_analysis.reason.slice(0, 200) + '…'
                                  : r.risk_analysis.reason}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              onClick={() => handle(r.session_id, true)}
                              disabled={isProcessing}
                              className="flex-1 h-10 rounded-xl font-black text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              {isProcessing ? 'Processing...' : 'Approve & Verify'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handle(r.session_id, false)}
                              disabled={isProcessing}
                              className="flex-1 h-10 rounded-xl font-black text-xs gap-2 border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                            <button
                              onClick={() => navigate(`/vault/details/${r.session_id}`)}
                              className="h-10 w-10 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/60 flex items-center justify-center transition-colors"
                              title="View full record">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Map + Archive (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Map */}
          <div className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-widest">Geospatial Distribution</h2>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-muted-foreground">Live</span>
              </div>
            </div>
            <EthiopiaMap />
            <div className="px-5 py-3 border-t border-border/40 grid grid-cols-2 gap-3 bg-muted/5">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Active Locations</p>
                <p className="text-xl font-black text-foreground">{[...new Set(reports.map(r => r.extracted_data?.location))].filter(Boolean).length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Total Reports</p>
                <p className="text-xl font-black text-foreground">{reports.length}</p>
              </div>
            </div>
          </div>

          {/* Resolved archive */}
          <div className="bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-muted/10">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-widest">Review History</h2>
              <span className="ml-auto text-[9px] font-bold text-muted-foreground">{resolved.length} resolved</span>
            </div>
            <div className="p-4 space-y-2">
              {resolved.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground italic py-6">No resolved alerts yet</p>
              ) : resolved.slice(0, 8).map(r => (
                <div key={r.session_id}
                  onClick={() => navigate(`/vault/details/${r.session_id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className={cn('w-2 h-2 rounded-full shrink-0',
                    r.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                      {r.alert?.title || 'System Log'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.extracted_data?.location}</p>
                  </div>
                  <span className={cn(
                    'text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border shrink-0',
                    r.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                  )}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
