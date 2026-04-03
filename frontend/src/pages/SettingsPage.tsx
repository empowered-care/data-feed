import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Server, Moon, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, darkMode, toggleDarkMode } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const [url, setUrl] = useState(apiBaseUrl);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setHasChanges(val !== apiBaseUrl);
  };

  const save = () => {
    setApiBaseUrl(url);
    setHasChanges(false);
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your Empowered Care environment</p>
      </div>

      {/* API Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">API Connection</h3>
            <p className="text-xs text-muted-foreground">Backend server endpoint</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-url">API Base URL</Label>
          <div className="flex gap-2">
            <Input
              id="api-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="http://localhost:8000"
              className="h-11"
            />
            <Button
              onClick={save}
              disabled={!hasChanges}
              className="gap-2 shrink-0 h-11"
            >
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">The base URL for the Empowered Care backend API</p>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Appearance</h3>
            <p className="text-xs text-muted-foreground">Customize the interface look</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 border border-border">
          <div>
            <Label className="font-medium">Dark Mode</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">System Info</h3>
            <p className="text-xs text-muted-foreground">About this instance</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Status', isAuthenticated ? 'Authenticated' : 'Not authenticated'],
            ['Role', user?.role === 'admin' ? 'Administrator' : user?.role === 'vw' ? 'Viewer/Worker' : '—'],
            ['API Target', apiBaseUrl],
            ['Version', '1.0.0'],
          ].map(([label, value]) => (
            <div key={label} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
              <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
