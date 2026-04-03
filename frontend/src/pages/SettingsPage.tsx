import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, darkMode, toggleDarkMode } = useAppStore();
  const [url, setUrl] = useState(apiBaseUrl);
  const [mockAuth, setMockAuth] = useState(true);

  const save = () => {
    setApiBaseUrl(url);
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure Aegis Lite</p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="api-url">API Base URL</Label>
          <div className="flex gap-2">
            <Input id="api-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8000" />
            <Button onClick={save} className="gap-2 shrink-0">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">The base URL for the Aegis Lite backend API</p>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <Label>Dark Mode</Label>
            <p className="text-xs text-muted-foreground">Toggle dark theme</p>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <Label>Mock Authentication</Label>
            <p className="text-xs text-muted-foreground">Use mock Ethiopia MoH user</p>
          </div>
          <Switch checked={mockAuth} onCheckedChange={setMockAuth} />
        </div>
      </div>
    </div>
  );
}
