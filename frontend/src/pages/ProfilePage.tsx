import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle2, Shield, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Refresh user data from backend
    api.getMe().then((data) => {
      updateUser(data);
    }).catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold">{user?.full_name || 'User'}</h3>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user?.role === 'admin' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Viewer/Worker'}
                </span>
              </span>
            </div>
            {user?.created_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start">
                <Calendar className="h-3 w-3" />
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-pw">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="old-pw"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 h-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-pw2">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-pw2"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pw2">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-pw2"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  required
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-risk-high">Passwords do not match</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={changingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword}
            className="gap-2 h-11"
          >
            {changingPassword ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Update Password</>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
