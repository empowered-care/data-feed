import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Database, FileText, Shield, Droplets, Thermometer,
  AlertTriangle, CheckCircle2, Download, ExternalLink, MapPin,
  Clock, Info, Zap, Activity, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 220;
  const isLong = text.length > LIMIT;
  return (
    <div>
      <p className="text-sm font-medium leading-relaxed text-foreground/85">
        {expanded || !isLong ? text : `${text.slice(0, LIMIT)}…`}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show Less</> : <><ChevronDown className="h-3 w-3" /> Read More</>}
        </button>
      )}
    </div>
  );
}

function Section({ title, icon, children, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-background/70 border border-border/40 rounded-2xl overflow-hidden shadow-sm', className)}>
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/40 bg-muted/10">
        <span className="text-primary">{icon}</span>
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function RecordDetailsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { reports, setReports } = useAppStore();
  const [report, setReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reports.length === 0) {
      api.getReports().then(data => {
        setReports(data);
        setReport(data.find((r: any) => r.session_id === sessionId));
      });
    } else {
      setReport(reports.find(r => r.session_id === sessionId));
    }
  }, [sessionId, reports, setReports]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="h-10 w-10 text-muted/20 animate-pulse" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading record...</p>
      </div>
    );
  }

  const exportRecordCSV = () => {
    const rows = [
      ['Field', 'Value'],
      ['Session ID', report.session_id],
      ['Location', report.extracted_data.location],
      ['Cases', report.extracted_data.cases],
      ['Date', report.extracted_data.date || 'N/A'],
      ['Symptoms', report.extracted_data.symptoms.join(', ')],
      ['Disease Match', report.risk_analysis?.possible_disease || 'Unknown'],
      ['Risk Level', report.risk_analysis?.risk_level || 'Unknown'],
      ['Validation', report.validation?.valid ? 'Valid' : 'Invalid'],
      ['Confidence', `${Math.round((report.validation?.confidence || 0) * 100)}%`],
      ['Raw Report', report.raw_report || 'N/A'],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `record_${report.session_id}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const copyRaw = () => {
    const cleaned = (report.raw_report || '').split('\n').map((l: string) => l.trim().replace(/\s{2,}/g, ' ')).filter(Boolean).join('\n');
    navigator.clipboard.writeText(cleaned);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskLevel = report.risk_analysis?.risk_level || 'UNKNOWN';
  const isVerified = report.status === 'approved';
  const confidence = Math.round(report.consensus?.average_confidence || (report.validation?.confidence || 0) * 100);

  // Parse consensus reasoning into individual agent opinions
  const reasoningText = report.consensus?.final_reasoning || report.risk_analysis?.reason || '';
  const reasoningPoints = reasoningText
    .replace(/Consensus reached from multiple perspectives:\s*/i, '')
    .split(' | ')
    .map((s: string) => {
      const m = s.match(/^(HIGH|MEDIUM|LOW|UNKNOWN):\s*(.*)/is);
      return m ? { level: m[1].toUpperCase(), text: m[2].trim() } : { level: null, text: s.trim() };
    })
    .filter((p: any) => p.text);

  const levelStyle = (level: string | null) => {
    if (level === 'HIGH') return { border: 'border-l-red-500', badge: 'bg-red-500/10 text-red-500 border-red-500/30' };
    if (level === 'MEDIUM') return { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    if (level === 'LOW') return { border: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    return { border: 'border-l-border', badge: 'bg-muted text-muted-foreground border-border' };
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">

      {/* ── TOP NAV ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/vault')}
          className="gap-2 text-xs font-bold hover:bg-muted/50 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back to Vault
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportRecordCSV}
            className="gap-2 text-xs font-bold rounded-xl h-9">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm"
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.extracted_data.location)}`, '_blank')}
            className="gap-2 text-xs font-bold rounded-xl h-9">
            <ExternalLink className="h-3.5 w-3.5" /> View in Maps
          </Button>
        </div>
      </div>

      {/* ── HERO HEADER ─────────────────────────── */}
      <div className="bg-background/70 border border-border/40 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                ID: {report.session_id.split('-')[0]}
              </span>
              <RiskBadge level={riskLevel} />
              <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border flex items-center gap-1',
                isVerified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                {isVerified ? <CheckCircle2 className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                {isVerified ? 'Verified' : 'Pending Review'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{report.extracted_data.location}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Ingested: {report.created_at ? new Date(report.created_at).toLocaleString() : 'Recently'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Event Date: {report.extracted_data.date || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Confidence meter */}
          <div className="shrink-0 flex flex-col items-center gap-2 px-6 py-4 bg-muted/30 rounded-2xl border border-border/40 min-w-[140px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">AI Confidence</p>
            <p className="text-4xl font-black text-primary tabular-nums">{confidence}%</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn('h-full rounded-full', confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-red-500')} />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Diagnostic Extraction */}
          <Section title="Diagnostic Extraction" icon={<FileText className="h-4 w-4" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Detected Pathology</p>
                  <p className="text-2xl font-black text-primary">{report.risk_analysis?.possible_disease || 'Unidentified'}</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/40">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Reported Cases</p>
                  <p className="text-3xl font-black tabular-nums">{report.extracted_data.cases}</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/40">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Classification</p>
                  <p className="text-sm font-bold">{report.extracted_data.classification || 'Suspected'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Clinical Signs</p>
                  <div className="flex flex-wrap gap-2">
                    {report.extracted_data.symptoms.map((s: string) => (
                      <Badge key={s} variant="secondary"
                        className="px-3 py-1.5 rounded-xl font-bold text-[10px] bg-background border border-border/50">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/40">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Validation Engine</p>
                  <div className="flex items-center gap-2">
                    {report.validation?.valid
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <Info className="h-5 w-5 text-red-500" />}
                    <span className={cn('text-sm font-black',
                      report.validation?.valid ? 'text-emerald-600' : 'text-red-500')}>
                      {report.validation?.valid ? 'PASSED' : 'FAILED'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {Math.round((report.validation?.confidence || 0) * 100)}%
                    </span>
                  </div>
                  {report.validation?.issues?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {report.validation.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />{issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Analysis & Consensus */}
          <Section title="Multi-Agent Analysis & Consensus" icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-3">
              {reasoningPoints.length > 0 ? reasoningPoints.map((point: any, i: number) => {
                const style = levelStyle(point.level);
                return (
                  <div key={i} className={cn('border-l-4 pl-4 py-3 pr-4 bg-muted/10 rounded-r-xl', style.border)}>
                    <div className="flex items-start gap-3">
                      {point.level && (
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 mt-0.5', style.badge)}>
                          {point.level}
                        </span>
                      )}
                      <ExpandableText text={point.text} />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground italic">No consensus reasoning available.</p>
              )}
            </div>
            {report.consensus?.average_confidence && (
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${report.consensus.average_confidence}%` }}
                    className="h-full bg-primary" />
                </div>
                <span className="text-xs font-black text-primary whitespace-nowrap">{Math.round(report.consensus.average_confidence)}% Overall Confidence</span>
              </div>
            )}
          </Section>

          {/* Data Record Table */}
          <Section title="Full Signal Record" icon={<Database className="h-4 w-4" />}>
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border/30">
                  {[
                    { key: 'Intelligence ID', value: report.session_id },
                    { key: 'Location', value: report.extracted_data.location },
                    { key: 'Case Count', value: report.extracted_data.cases },
                    { key: 'Event Date', value: report.extracted_data.date || '—' },
                    { key: 'Pathology Match', value: report.risk_analysis?.possible_disease || 'Unknown' },
                    { key: 'Threat Level', value: report.risk_analysis?.risk_level || 'Unknown' },
                    { key: 'Validation Result', value: report.validation?.valid ? '✅ PASS' : '❌ FAIL' },
                    { key: 'Confidence Score', value: `${Math.round((report.validation?.confidence || 0) * 100)}%` },
                    { key: 'Research Node', value: report.context_research ? 'Active' : 'Inactive' },
                    { key: 'Conflict Zone', value: report.context_research?.conflict_zone ? 'Yes ⚠️' : 'No' },
                    { key: 'Water Quality', value: report.context_research?.water_quality || '—' },
                    { key: 'Temperature', value: report.context_research?.temperature || '—' },
                  ].map((row, i) => (
                    <tr key={row.key} className={cn('hover:bg-primary/5 transition-colors', i % 2 === 0 ? 'bg-muted/5' : '')}>
                      <td className="px-4 py-3 font-black text-muted-foreground w-2/5 border-r border-border/30 text-[10px] uppercase tracking-wider">{row.key}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{String(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Raw Transmission */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-xs font-black uppercase tracking-widest text-green-500">Raw Transmission Stream</span>
              </div>
              <button onClick={copyRaw}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border',
                  copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700')}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-5 font-mono text-[11px] leading-relaxed text-green-400 overflow-auto max-h-80">
              {report.raw_report
                ? report.raw_report.split('\n').map((l: string) => l.trim().replace(/\s{2,}/g, ' ')).filter(Boolean).join('\n\n')
                : 'No raw transmission data in this buffer.'}
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ─────────────────────────── */}
        <div className="space-y-6">

          {/* Environmental Intel */}
          {report.context_research && (
            <Section title="Environmental Intel" icon={<Shield className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Water Quality', value: report.context_research.water_quality, icon: <Droplets className="h-3.5 w-3.5 text-blue-500" />, color: 'text-blue-600' },
                    { label: 'Temperature', value: report.context_research.temperature, icon: <Thermometer className="h-3.5 w-3.5 text-orange-500" />, color: 'text-orange-600' },
                  ].map(d => (
                    <div key={d.label} className="p-3 bg-muted/20 rounded-xl border border-border/40">
                      <div className="flex items-center gap-1 mb-1">{d.icon}<span className="text-[9px] font-black uppercase text-muted-foreground">{d.label}</span></div>
                      <p className="text-xs font-bold">{d.value || '—'}</p>
                    </div>
                  ))}
                </div>

                <div className={cn('flex items-center gap-3 p-3 rounded-xl border',
                  report.context_research.conflict_zone ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20')}>
                  <Shield className={cn('h-4 w-4 shrink-0', report.context_research.conflict_zone ? 'text-red-500' : 'text-emerald-500')} />
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Security Status</p>
                    <p className={cn('text-xs font-bold', report.context_research.conflict_zone ? 'text-red-600' : 'text-emerald-600')}>
                      {report.context_research.conflict_zone ? 'Active Conflict Zone' : 'Stable Region'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1.5">Security Narrative</p>
                  <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                    "{report.context_research.security_status}"
                  </p>
                </div>

                {report.context_research.recent_news?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2">Recent Headlines</p>
                    <div className="space-y-2">
                      {report.context_research.recent_news.map((news: string, i: number) => (
                        <div key={i} className="flex gap-2 text-[10px] font-medium leading-snug text-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {news}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Response Protocols */}
          {report.alert?.recommendations?.length > 0 && (
            <Section title="Response Protocols" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="space-y-2">
                {report.alert.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors">
                    <div className="h-5 w-5 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 font-black text-[9px]">
                      {i + 1}
                    </div>
                    <p className="text-xs font-medium leading-snug">{rec}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Alert Summary */}
          {report.alert && (
            <Section title="Alert Summary" icon={<Info className="h-4 w-4" />}>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Alert Title</p>
                  <p className="text-sm font-bold">{report.alert.title}</p>
                </div>
                {report.alert.message && (
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Message</p>
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed">{report.alert.message}</p>
                  </div>
                )}
                {report.alert.why_urgent && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Why Urgent</p>
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed">{report.alert.why_urgent}</p>
                  </div>
                )}
                {report.alert.prevention_strategy && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Prevention Strategy</p>
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed">{report.alert.prevention_strategy}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
