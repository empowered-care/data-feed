import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Clock, Calendar, AlertTriangle, CheckCircle2, Loader2,
  UserPlus, Mail, Shield, Activity, RefreshCw, Zap, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 6 AM', value: '0 6 * * *' },
  { label: 'Weekly (Sunday midnight)', value: '0 0 * * 0' },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [cronValue, setCronValue] = useState('0 0 * * *');
  const [customCron, setCustomCron] = useState('');
  const [useCustomCron, setUseCustomCron] = useState(false);

  // Invite user state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'vw'>('vw');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitedList, setInvitedList] = useState<{ email: string; role: string }[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await api.getAnalysisStatus();
      setAnalysisStatus(data);
      if (data.status.schedule) {
        const preset = CRON_PRESETS.find(p => p.value === data.status.schedule);
        if (preset) {
          setCronValue(data.status.schedule);
        } else {
          setUseCustomCron(true);
          setCustomCron(data.status.schedule);
        }
      }
    } catch {
      // Not critical
    } finally {
      setLoadingStatus(false);
    }
  };

  const triggerManualAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      const result = await api.triggerAnalysis();
      toast.success('Full system analysis complete!');
      setAnalysisStatus((prev: any) => ({
        ...prev,
        status: {
          ...prev?.status,
          last_run: result.timestamp,
          last_result: result.result,
          is_running: false,
        },
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const updateSchedule = async () => {
    setSavingSchedule(true);
    const cron = useCustomCron ? customCron : cronValue;
    try {
      const result = await api.updateSchedule(cron);
      toast.success(`Schedule updated! Next run: ${result.next_run}`);
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid cron expression');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await api.inviteUser(inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInvitedList((prev) => [{ email: inviteEmail, role: inviteRole }, ...prev]);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Control Center</h2>
        <p className="text-sm text-muted-foreground">System analysis, scheduling & team management</p>
      </div>

      {/* Status Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Scheduler</p>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${analysisStatus?.is_scheduler_running ? 'bg-health animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="font-semibold">{analysisStatus?.is_scheduler_running ? 'Running' : 'Stopped'}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Last Analysis</p>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="font-semibold text-sm">
            {analysisStatus?.status?.last_run
              ? new Date(analysisStatus.status.last_run).toLocaleString()
              : 'Never'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">Next Scheduled</p>
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <p className="font-semibold text-sm">
            {analysisStatus?.status?.next_run
              ? new Date(analysisStatus.status.next_run).toLocaleString()
              : 'Not scheduled'}
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Manual Analysis */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Manual Analysis</h3>
              <p className="text-xs text-muted-foreground">Run full system analysis comparing all data</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Triggers a complete analysis across all submitted outbreak data, comparing new reports against 
              historical patterns to detect emerging threats and update risk assessments.
            </p>
          </div>

          <Button
            onClick={triggerManualAnalysis}
            disabled={runningAnalysis}
            className="w-full h-11 gap-2 font-semibold"
          >
            {runningAnalysis ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Running Analysis...</>
            ) : (
              <><Play className="h-4 w-4" /> Trigger Full Analysis</>
            )}
          </Button>

          {analysisStatus?.status?.last_result && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-health/5 border border-health/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-health" />
                  <span className="text-sm font-medium text-health">Last Analysis Result</span>
                </div>
                <pre className="text-[10px] font-mono text-muted-foreground max-h-32 overflow-auto">
                  {JSON.stringify(analysisStatus.status.last_result, null, 2)}
                </pre>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Schedule */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Analysis Schedule</h3>
              <p className="text-xs text-muted-foreground">Configure automatic background analysis</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preset Schedule</Label>
              <Select
                value={useCustomCron ? 'custom' : cronValue}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    setUseCustomCron(true);
                  } else {
                    setUseCustomCron(false);
                    setCronValue(v);
                  }
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom cron expression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCustomCron && (
              <div className="space-y-2">
                <Label htmlFor="custom-cron">Custom Cron Expression</Label>
                <Input
                  id="custom-cron"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="*/5 * * * *"
                  className="h-11 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}

            {analysisStatus?.status?.schedule && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  Current: {analysisStatus.status.schedule}
                </span>
              </div>
            )}

            <Button
              onClick={updateSchedule}
              disabled={savingSchedule || (useCustomCron && !customCron)}
              className="w-full h-11 gap-2 font-semibold"
              variant="outline"
            >
              {savingSchedule ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Clock className="h-4 w-4" /> Update Schedule</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Team Invitations */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Invite Team Member</h3>
            <p className="text-xs text-muted-foreground">Send email invitations to new users</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@hospital.com"
              type="email"
              className="pl-10 h-11"
              required
            />
          </div>
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'vw')}>
            <SelectTrigger className="h-11 w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vw">Viewer/Worker</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviteLoading || !inviteEmail} className="h-11 gap-2 shrink-0">
            {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Send Invite
          </Button>
        </form>

        {invitedList.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Invitations</p>
            {invitedList.map((inv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{inv.email}</span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                  {inv.role === 'vw' ? 'Viewer' : 'Admin'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
