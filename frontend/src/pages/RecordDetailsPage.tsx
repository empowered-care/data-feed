import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Database, 
  FileText, 
  Shield, 
  Droplets, 
  Thermometer, 
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  Clock,
  Info
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function RecordDetailsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { reports, setReports } = useAppStore();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (reports.length === 0) {
      api.getReports().then(data => {
        setReports(data);
        const found = data.find((r: any) => r.session_id === sessionId);
        setReport(found);
      });
    } else {
      const found = reports.find(r => r.session_id === sessionId);
      setReport(found);
    }
  }, [sessionId, reports, setReports]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="h-12 w-12 text-muted/20 animate-pulse" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Retrieving Intelligence record...</p>
      </div>
    );
  }

  const exportRecordCSV = () => {
    const headers = ["Field", "Value"];
    const rows = [
      ["Session ID", report.session_id],
      ["Location", report.extracted_data.location],
      ["Cases", report.extracted_data.cases],
      ["Date", report.extracted_data.date || "N/A"],
      ["Symptoms", report.extracted_data.symptoms.join(", ")],
      ["Disease Match", report.risk_analysis?.possible_disease || "Unknown"],
      ["Risk Level", report.risk_analysis?.risk_level || "Unknown"],
      ["Validation", report.validation?.valid ? "Valid" : "Invalid"],
      ["Validation Confidence", `${Math.round((report.validation?.confidence || 0) * 100)}%`],
      ["Consensus Reasoning", report.consensus?.final_reasoning || report.risk_analysis?.reason],
      ["Water Quality", report.context_research?.water_quality || "N/A"],
      ["Security Status", report.context_research?.security_status || "N/A"],
      ["Conflict Zone", report.context_research?.conflict_zone ? "Yes" : "No"],
      ["Raw Report", report.raw_report || "N/A"]
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `record_${report.session_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/vault')}
          className="gap-2 font-bold uppercase tracking-widest text-[10px] hover:bg-primary/10 hover:text-primary transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vault
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportRecordCSV}
            className="gap-2 font-black uppercase tracking-widest text-[10px] h-10"
          >
            <Download className="h-4 w-4" /> Export Single CSV
          </Button>
          <Button 
            size="sm" 
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.extracted_data.location)}`, '_blank')}
            className="gap-2 font-black uppercase tracking-widest text-[10px] h-10"
          >
            <ExternalLink className="h-4 w-4" /> View in Maps
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1 uppercase tracking-widest text-[9px]">
              INTEL_ID: {report.session_id.split('-')[0]}
            </Badge>
            <RiskBadge level={report.risk_analysis?.risk_level} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">
            {report.extracted_data.location}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Ingested: {report.created_at ? new Date(report.created_at).toLocaleString() : 'Recently'}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Event Date: {report.extracted_data.date || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Verification Status</div>
          <div className={cn(
            "px-6 py-3 rounded-2xl border-2 flex items-center gap-3 font-black uppercase tracking-widest text-xs shadow-lg",
            report.status === 'approved' ? "bg-health/5 border-health/20 text-health shadow-health/10" : "bg-muted/50 border-border text-muted-foreground"
          )}>
            {report.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            {report.status || 'Pending'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Intelligence Section */}
          <Card className="border-none shadow-2xl shadow-primary/5 bg-background/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Diagnostic Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-l-4 border-primary pl-3">Detected Pathology</p>
                  <p className="text-3xl font-black tracking-tighter text-primary uppercase">
                    {report.risk_analysis?.possible_disease || 'Unidentified'}
                  </p>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Impact Assessment</p>
                    <p className="text-lg font-black">{report.extracted_data.cases} Confirmed Cases</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-l-4 border-primary pl-3">Clinical Signs</p>
                  <div className="flex flex-wrap gap-2">
                    {report.extracted_data.symptoms.map((s: string) => (
                      <Badge key={s} variant="secondary" className="px-4 py-2 rounded-xl font-bold uppercase text-[10px] bg-background border border-border/50">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-l-4 border-primary pl-3">Multi-Agent Consensus Reasoning</p>
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="h-20 w-20 text-primary" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic text-foreground/90 relative z-10">
                    "{report.consensus?.final_reasoning || report.risk_analysis?.reason}"
                  </p>
                  {report.consensus?.average_confidence && (
                    <div className="mt-4 flex items-center gap-2 relative z-10">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${report.consensus.average_confidence}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <span className="text-[10px] font-black text-primary">{Math.round(report.consensus.average_confidence)}% CONFIDENCE</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Data Section (The CSV-like display) */}
          <Card className="border-none shadow-2xl shadow-primary/5 bg-background/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-black text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Database className="h-6 w-6 text-green-500" />
                    Full Signal Record
                  </CardTitle>
                  <CardDescription className="text-white/50 font-bold uppercase text-[9px] tracking-widest mt-1">Raw Spectral Archive Table</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <tbody className="divide-y divide-border/20">
                    {[
                      { key: "INTELLIGENCE_ID", value: report.session_id },
                      { key: "PRIMARY_LOCATION", value: report.extracted_data.location },
                      { key: "CASE_COUNT", value: report.extracted_data.cases },
                      { key: "SIGNAL_DATE", value: report.extracted_data.date || "NULL" },
                      { key: "PATHOLOGY_MATCH", value: report.risk_analysis?.possible_disease || "UNKNOWN" },
                      { key: "THREAT_LEVEL", value: report.risk_analysis?.risk_level || "UNKNOWN" },
                      { key: "VALIDATION_ENGINE", value: report.validation?.valid ? "PASS" : "FAIL" },
                      { key: "CONFIDENCE_SCORE", value: `${Math.round((report.validation?.confidence || 0) * 100)}%` },
                      { key: "RESEARCH_NODE_STATUS", value: report.context_research ? "ACTIVE" : "INACTIVE" },
                      { key: "CONFLICT_ZONE_MARKER", value: report.context_research?.conflict_zone ? "TRUE" : "FALSE" },
                      { key: "WATER_QUALITY_LOG", value: report.context_research?.water_quality || "NO_DATA" },
                    ].map((row, i) => (
                      <tr key={row.key} className={cn(i % 2 === 0 ? "bg-muted/10" : "bg-transparent", "hover:bg-primary/5 transition-colors")}>
                        <td className="px-8 py-4 font-black text-muted-foreground w-1/3 border-r border-border/10 uppercase tracking-tighter">{row.key}</td>
                        <td className="px-8 py-4 text-foreground font-bold">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Raw Signal Text */}
          <Card className="border-none shadow-2xl shadow-primary/5 bg-black/95 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/10">
              <CardTitle className="text-lg font-black text-green-500 uppercase tracking-widest flex items-center gap-3">
                <Zap className="h-5 w-5" />
                Raw Transmission Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-black p-6 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-green-400 overflow-auto max-h-[400px] scrollbar-thin">
                {report.raw_report || "No raw transmission data found in this buffer."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {report.context_research && (
            <Card className="border-none shadow-2xl shadow-primary/5 bg-gradient-to-br from-background to-primary/5 rounded-[2.5rem] border border-primary/10 overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  Environmental Intel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-primary" /> Water
                    </p>
                    <p className="text-[10px] font-black uppercase">{report.context_research.water_quality}</p>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-orange-500" /> Temperature
                    </p>
                    <p className="text-[10px] font-black uppercase">{report.context_research.temperature}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-background rounded-2xl border border-border/50">
                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3 text-primary" /> Web Narrative Context
                  </p>
                  <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                    "{report.context_research.security_status}"
                  </p>
                </div>

                {report.context_research.recent_news?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Recent Headlines</p>
                    <div className="space-y-2">
                      {report.context_research.recent_news.map((news: string, i: number) => (
                        <div key={i} className="flex gap-2 text-[10px] font-medium leading-tight">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                          {news}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-2xl shadow-primary/5 bg-risk-high/5 rounded-[2.5rem] border border-risk-high/10 overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-risk-high">
                <AlertTriangle className="h-5 w-5" />
                Response Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {report.alert?.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex gap-3 p-4 bg-background rounded-2xl border border-risk-high/10 shadow-sm transition-all hover:translate-x-1">
                  <div className="h-6 w-6 rounded-lg bg-risk-high/10 text-risk-high flex items-center justify-center shrink-0 font-black text-[10px]">
                    {i+1}
                  </div>
                  <p className="text-[11px] font-bold leading-tight">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Minimal icons for internal use
function Zap({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 14.899 17.656 3.101a.5.5 0 0 1 .83.518l-3.328 10.28a.5.5 0 0 0 .474.654H20a.5.5 0 0 1 .344.863l-13.656 11.798a.5.5 0 0 1-.83-.518l3.328-10.28a.5.5 0 0 0-.474-.654H4a.5.5 0 0 1-.344-.863Z" />
    </svg>
  );
}
