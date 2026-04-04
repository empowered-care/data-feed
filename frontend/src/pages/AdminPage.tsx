import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Clock, Calendar, AlertTriangle, CheckCircle2, Loader2,
  UserPlus, Mail, Shield, Activity, RefreshCw, Zap, Timer,
  Trash2, Users, Search, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import EthiopiaMap from '@/components/EthiopiaMap';
import { cn } from "@/lib/utils";
const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 6 AM', value: '0 6 * * *' },
  { label: 'Weekly (Sunday midnight)', value: '0 0 * * 0' },
];

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [cronExpression, setCronExpression] = useState('');

  // Team Management state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'vw' | 'data_entry'>('data_entry');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStatus();
    fetchUsers();
  }, []);

  const fetchStatus = async () => {
    try {
      const status = await api.getAnalysisStatus();
      setAnalysisStatus(status);
      setCronExpression(status?.next_run_cron || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleManualAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      const res = await api.triggerAnalysis();
      toast.success(res.message || 'Analysis started successfully');
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start analysis');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!cronExpression.trim()) return;
    setSavingSchedule(true);
    try {
      await api.updateCronSchedule(cronExpression);
      toast.success('Analysis schedule updated');
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await api.inviteUser(inviteEmail, inviteRole, window.location.origin);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      // In a real system, the invite list would be updated by the server. 
      // For this app, let's refresh the whole list.
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (!window.confirm(`Are you sure you want to remove ${userToDelete.full_name || userToDelete.email}? They will immediately lose all access.`)) {
      return;
    }

    try {
      await api.deleteUser(userToDelete.id);
      toast.success('User removed from clinical staff');
      setUsers(users.filter(u => u.id !== userToDelete.id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage analysis engine, scheduling, and system access.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Analysis Engines */}
        <div className="lg:col-span-12 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
             {/* Analysis Control */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Risk Management Engine</h3>
                  <p className="text-sm text-muted-foreground">Force re-analysis of all records</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Engine Status</span>
                  {analysisStatus?.is_running ? (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-bold animate-pulse">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-bold">IDLE</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Last run: <span className="text-foreground font-medium">{analysisStatus?.last_run ? new Date(analysisStatus.last_run).toLocaleString() : 'Never'}</span>
                </div>
              </div>

              <Button 
                onClick={handleManualAnalysis} 
                className="w-full h-12 rounded-xl text-md font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={runningAnalysis || analysisStatus?.is_running}
              >
                {runningAnalysis ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Trigger Global Re-Analysis
              </Button>
            </motion.div>

            {/* Scheduler Control */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Timer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Automation Scheduler</h3>
                  <p className="text-sm text-muted-foreground">Adjust background processing intervals</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cron Expression</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={cronExpression} 
                      onChange={(e) => setCronExpression(e.target.value)}
                      placeholder="* * * * *"
                      className="font-mono h-11"
                    />
                    <Button onClick={handleUpdateSchedule} disabled={savingSchedule} className="h-11 px-4">
                      {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CRON_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setCronExpression(p.value)}
                      className="text-left px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted text-[10px] font-bold uppercase tracking-tight border border-border/50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-1 gap-8">
            {/* User Management */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Clinical Staff & Access</h3>
                    <p className="text-sm text-muted-foreground">Invite or remove authorized system users</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative w-64 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-9 h-10 w-full rounded-xl bg-background/50" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-12 gap-10">
                {/* Invite Form */}
                <div className="md:col-span-4 space-y-6">
                  <div className="p-5 rounded-2xl bg-muted/10 border border-border/40 space-y-5">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <UserPlus className="h-4 w-4 text-primary" /> Send New Invitation
                    </div>
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <Input 
                          id="invite-email"
                          type="email" 
                          value={inviteEmail} 
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="staff@hospital.com"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Role</Label>
                        <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="data_entry">Data Entry Operator</SelectItem>
                            <SelectItem value="vw">Viewer / Worker</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={inviteLoading} className="w-full h-11 rounded-xl font-bold gap-2 mt-2">
                        {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Send Access Email
                      </Button>
                    </form>
                  </div>
                </div>

                {/* User List */}
                <div className="md:col-span-8">
                  <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="col-span-6">Team Member</div>
                      <div className="col-span-4">Role / Permissions</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {loadingUsers ? (
                         <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-3">
                           <Loader2 className="h-4 w-4 animate-spin" /> Loading team list...
                         </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                          No team members found.
                        </div>
                      ) : (
                        filteredUsers.map((u) => (
                          <div key={u.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                            <div className="col-span-6 min-w-0">
                              <p className="font-bold text-sm truncate">{u.full_name || 'Pending Invitation'}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <div className="col-span-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                u.role === 'admin' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                                u.role === 'data_entry' ? "bg-primary/10 text-primary border-primary/20" : 
                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              )}>
                                {u.role === 'admin' && <Shield className="h-3 w-3" />}
                                {u.role === 'data_entry' && <ClipboardList className="h-3 w-3" />}
                                {u.role === 'vw' && <Activity className="h-3 w-3" />}
                                {u.role === 'admin' ? 'Admin' : u.role === 'data_entry' ? 'Data Entry' : 'Viewer'}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              {u.id !== currentUser?.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 mr-[-8px] text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold uppercase text-muted-foreground italic px-2">You</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Outbreak Heatmap Preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Regional Risk Calibration</h3>
                <p className="text-sm text-muted-foreground">Adjust risk weights based on geographic disease trends in Ethiopia</p>
              </div>
            </div>
            
            <div className="aspect-[16/9] w-full bg-background/50 rounded-2xl border border-border/50 overflow-hidden relative group">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 to-transparent flex items-end p-8">
                <div className="space-y-2">
                  <p className="text-lg font-bold">Heatmap Integration</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Interactive region-by-region risk weighting dashboard. Click on regions to adjust their clinical suspicion score based on current local outbreaks.
                  </p>
                </div>
              </div>
              <EthiopiaMap />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
