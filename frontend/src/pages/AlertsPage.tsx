import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/RiskBadge';
import { useAppStore } from '@/store/appStore';
import { mockReports } from '@/lib/mockData';
import { toast } from 'sonner';

export default function AlertsPage() {
  const { reports, updateReportStatus } = useAppStore();
  const allReports = reports.length > 0 ? reports : mockReports;
  const pending = allReports.filter((r) => r.status === 'pending');
  const resolved = allReports.filter((r) => r.status !== 'pending');

  const handle = (id: string, approved: boolean) => {
    updateReportStatus(id, approved ? 'approved' : 'rejected');
    toast.success(approved ? 'Alert approved' : 'Alert rejected');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alerts & Validation</h2>
        <p className="text-sm text-muted-foreground">Review and approve high-risk outbreak alerts</p>
      </div>

      {pending.length === 0 && (
        <div className="glass-card rounded-xl p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-health mx-auto mb-3" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending alerts require review.</p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map((r, i) => (
          <motion.div
            key={r.session_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-5 border-l-4 ${
              r.risk_analysis.risk_level === 'HIGH' ? 'border-l-risk-high' :
              r.risk_analysis.risk_level === 'MEDIUM' ? 'border-l-risk-medium' : 'border-l-risk-low'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{r.alert.title}</h3>
                  <RiskBadge level={r.risk_analysis.risk_level} />
                </div>
                <p className="text-sm text-muted-foreground">{r.alert.message}</p>
                <p className="text-xs text-muted-foreground">{r.extracted_data.location} • {r.extracted_data.cases} cases</p>
              </div>
              {r.human_validation_required && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handle(r.session_id, true)} className="gap-1.5 bg-health hover:bg-health/90 text-health-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handle(r.session_id, false)} className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resolved</h3>
          <div className="space-y-2">
            {resolved.map((r) => (
              <div key={r.session_id} className="glass-card rounded-xl p-4 flex items-center justify-between opacity-70">
                <div>
                  <p className="text-sm font-medium">{r.alert.title}</p>
                  <p className="text-xs text-muted-foreground">{r.extracted_data.location}</p>
                </div>
                <span className={`text-xs font-semibold capitalize ${r.status === 'approved' ? 'text-health' : 'text-risk-high'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
