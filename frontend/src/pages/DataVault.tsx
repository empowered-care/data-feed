import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Database, Search, Download, ChevronRight, Shield,
  Droplets, Thermometer, AlertCircle, FileText, Clock,
  MapPin, Activity, TrendingUp, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DataVault() {
  const navigate = useNavigate();
  const { reports, setReports } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'cases' | 'risk'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, [setReports]);

  const RISK_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };

  const filteredReports = reports
    .filter(r => {
      const matchSearch =
        r.extracted_data.location.toLowerCase().includes(search.toLowerCase()) ||
        (r.risk_analysis?.possible_disease || '').toLowerCase().includes(search.toLowerCase());
      const matchRisk = !filterRisk || r.risk_analysis?.risk_level === filterRisk;
      const matchStatus = !filterStatus || (r.status || 'pending') === filterStatus;
      return matchSearch && matchRisk && matchStatus;
    })
    .sort((a, b) => {
      let val = 0;
      if (sortField === 'cases') val = (a.extracted_data.cases || 0) - (b.extracted_data.cases || 0);
      else if (sortField === 'risk') val = (RISK_ORDER[a.risk_analysis?.risk_level || 'UNKNOWN']) - (RISK_ORDER[b.risk_analysis?.risk_level || 'UNKNOWN']);
      else val = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return sortDir === 'desc' ? -val : val;
    });

  const totalCases = filteredReports.reduce((s, r) => s + (r.extracted_data.cases || 0), 0);
  const highRiskCount = filteredReports.filter(r => r.risk_analysis?.risk_level === 'HIGH').length;
  const pendingCount = filteredReports.filter(r => (r.status || 'pending') === 'pending').length;
  const verifiedCount = filteredReports.filter(r => r.status === 'approved').length;

  const exportData = () => {
    if (!filteredReports.length) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredReports, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `vault_export_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === 'desc' ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronUp className="h-3 w-3 text-primary" />)
      : <ChevronDown className="h-3 w-3 text-muted-foreground/30" />;

  return (
    <div className="space-y-6 pb-12">

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Epidemiological Archive</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Surveillance Data Vault</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete historical record of all processed outbreak intelligence</p>
        </div>
        <Button size="sm" onClick={exportData} className="h-9 gap-2 text-xs font-bold rounded-xl shadow-sm self-start md:self-auto">
          <Download className="h-3.5 w-3.5" /> Export Archive
        </Button>
      </div>

      {/* ── STATS STRIP ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: filteredReports.length, icon: <FileText className="h-4 w-4" />, color: 'text-primary bg-primary/10 border-primary/20' },
          { label: 'Total Cases', value: totalCases.toLocaleString(), icon: <TrendingUp className="h-4 w-4" />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
          { label: 'HIGH Risk', value: highRiskCount, icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
          { label: 'Pending Review', value: pendingCount, icon: <Clock className="h-4 w-4" />, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-background/70 border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={cn('p-2.5 rounded-xl border', s.color)}>{s.icon}</div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-xl font-black tabular-nums">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── FILTER BAR ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-3 bg-background/60 backdrop-blur border border-border/40 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search location or condition..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/30 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="h-4 w-px bg-border/50 hidden sm:block" />

        {/* Risk filter pills */}
        <div className="flex items-center gap-1">
          {[
            { label: 'All', value: null, dot: 'bg-muted-foreground' },
            { label: '🔴 HIGH', value: 'HIGH', dot: 'bg-red-500' },
            { label: '🟡 MED', value: 'MEDIUM', dot: 'bg-amber-500' },
            { label: '🟢 LOW', value: 'LOW', dot: 'bg-emerald-500' },
          ].map(({ label, value }) => (
            <button key={label}
              onClick={() => setFilterRisk(filterRisk === value ? null : value)}
              className={cn(
                'h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                filterRisk === value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              )}>
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border/50 hidden sm:block" />

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {[
            { label: 'Any Status', value: null },
            { label: '✓ Verified', value: 'approved' },
            { label: '⏳ Pending', value: 'pending' },
          ].map(({ label, value }) => (
            <button key={label}
              onClick={() => setFilterStatus(filterStatus === value ? null : value)}
              className={cn(
                'h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                filterStatus === value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'
              )}>
              {label}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto text-[10px] font-bold text-muted-foreground whitespace-nowrap">
          {filteredReports.length} of {reports.length} records
        </div>
      </div>

      {/* ── MAIN TABLE ─────────────────────────────── */}
      <div className="border border-border/40 rounded-2xl overflow-hidden bg-background/60 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10 text-left">
                <th className="px-5 py-3.5">
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Date <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condition</th>
                <th className="px-5 py-3.5">
                  <button onClick={() => toggleSort('cases')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Cases <SortIcon field="cases" />
                  </button>
                </th>
                <th className="px-5 py-3.5">
                  <button onClick={() => toggleSort('risk')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Risk <SortIcon field="risk" />
                  </button>
                </th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Context</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Database className="h-10 w-10 text-muted/20" />
                      <p className="font-bold text-sm">No records match current filters</p>
                      <button onClick={() => { setSearch(''); setFilterRisk(null); setFilterStatus(null); }}
                        className="text-xs font-bold text-primary hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.map((r, i) => {
                const isExpanded = expandedId === r.session_id;
                const riskLevel = r.risk_analysis?.risk_level || 'UNKNOWN';
                const isVerified = r.status === 'approved';

                return (
                  <>
                    <motion.tr
                      key={r.session_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className={cn(
                        'group transition-colors cursor-pointer',
                        isExpanded ? 'bg-primary/5' : 'hover:bg-muted/30'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : r.session_id)}
                    >
                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                          {r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-black text-foreground group-hover:text-primary transition-colors text-sm">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {r.extracted_data.location}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                          {r.session_id.split('-')[0]}
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="px-5 py-4">
                        <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tight bg-muted/50 border border-border/40">
                          {r.risk_analysis?.possible_disease || 'Unidentified'}
                        </Badge>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.extracted_data.symptoms.slice(0, 2).map(s => (
                            <span key={s} className="text-[8px] px-1.5 py-0.5 bg-muted/40 rounded-md font-bold text-muted-foreground border border-border/30">
                              {s}
                            </span>
                          ))}
                          {r.extracted_data.symptoms.length > 2 && (
                            <span className="text-[8px] text-muted-foreground/60 font-bold">+{r.extracted_data.symptoms.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Cases */}
                      <td className="px-5 py-4">
                        <span className="text-2xl font-black tabular-nums text-foreground">{r.extracted_data.cases}</span>
                        <div className="text-[9px] uppercase font-bold text-muted-foreground">cases</div>
                      </td>

                      {/* Risk */}
                      <td className="px-5 py-4"><RiskBadge level={riskLevel} /></td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isVerified
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <div className="h-4 w-4 rounded-full border-2 border-amber-500/50 border-dashed animate-spin" style={{ animationDuration: '3s' }} />
                          }
                          <span className={cn('text-[10px] font-black uppercase tracking-wide',
                            isVerified ? 'text-emerald-600' : 'text-amber-500')}>
                            {isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {Math.round((r.validation?.confidence || 0) * 100)}% validated
                        </div>
                      </td>

                      {/* Context icons */}
                      <td className="px-5 py-4">
                        {r.context_research ? (
                          <div className="flex items-center gap-2">
                            <div title={r.context_research.conflict_zone ? 'Conflict Zone' : 'Stable Region'}
                              className={cn('p-1.5 rounded-lg', r.context_research.conflict_zone ? 'bg-red-500/10' : 'bg-emerald-500/10')}>
                              <Shield className={cn('h-3 w-3', r.context_research.conflict_zone ? 'text-red-500' : 'text-emerald-500')} />
                            </div>
                            <div title={`Water: ${r.context_research.water_quality}`} className="p-1.5 rounded-lg bg-blue-500/10">
                              <Droplets className="h-3 w-3 text-blue-500" />
                            </div>
                            <div title={`Temp: ${r.context_research.temperature}`} className="p-1.5 rounded-lg bg-orange-500/10">
                              <Thermometer className="h-3 w-3 text-orange-500" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">No data</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/vault/details/${r.session_id}`); }}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Open full record">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center transition-all',
                            isExpanded ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded inline preview */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr key={`${r.session_id}-expanded`}>
                          <td colSpan={8} className="p-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden bg-primary/3 border-t border-primary/10"
                            >
                              <div className="p-6 grid md:grid-cols-3 gap-6">
                                {/* Analysis */}
                                <div className="space-y-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Activity className="h-3 w-3 text-primary" /> AI Analysis
                                  </p>
                                  <p className="text-xs font-medium leading-relaxed text-foreground/80 italic">
                                    "{r.risk_analysis?.reason || 'No analysis available'}"
                                  </p>
                                </div>

                                {/* Context */}
                                <div className="space-y-3">
                                  {r.context_research ? (
                                    <>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Shield className="h-3 w-3 text-primary" /> Environmental Data
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {[
                                          { label: 'Water', value: r.context_research.water_quality, icon: <Droplets className="h-3 w-3 text-blue-500" /> },
                                          { label: 'Temp', value: r.context_research.temperature, icon: <Thermometer className="h-3 w-3 text-orange-500" /> },
                                        ].map(d => (
                                          <div key={d.label} className="p-2.5 bg-background rounded-xl border border-border/40">
                                            <div className="flex items-center gap-1 mb-1">{d.icon}<span className="text-[9px] font-black uppercase text-muted-foreground">{d.label}</span></div>
                                            <p className="text-[10px] font-bold">{d.value}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No environmental context available.</p>
                                  )}
                                </div>

                                {/* Recommendations + CTA */}
                                <div className="space-y-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 text-red-500" /> Key Actions
                                  </p>
                                  <ul className="space-y-1.5">
                                    {(r.alert?.recommendations || []).slice(0, 3).map((rec, i) => (
                                      <li key={i} className="flex items-start gap-2 text-[10px] font-medium leading-tight">
                                        <span className="h-4 w-4 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black shrink-0">{i + 1}</span>
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                  <Button size="sm" className="w-full h-9 rounded-xl text-xs font-black gap-2 mt-2"
                                    onClick={() => navigate(`/vault/details/${r.session_id}`)}>
                                    Open Full Intelligence Report <ChevronRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredReports.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40 bg-muted/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground">
              Showing {filteredReports.length} records · {verifiedCount} verified · {pendingCount} pending
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">
              Click any row to preview · <span className="text-primary">↗</span> to open full report
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
