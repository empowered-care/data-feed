import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Moon, Sun, LogOut, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Props {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: Props) {
  const { darkMode, toggleDarkMode, notifications, markAllRead } = useAppStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 h-20 bg-background/60 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-8 gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-muted/50 border border-border/50 text-[10px] font-black uppercase tracking-widest text-primary">
          <span className="w-2 h-2 rounded-full bg-health animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          Neural Link Active
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-10 w-10 rounded-xl hover:bg-primary/5 transition-all">
          {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl relative hover:bg-primary/5 transition-all"
          onClick={markAllRead}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-risk-high rounded-full ring-2 ring-background animate-bounce" />
          )}
        </Button>

        <div className="pl-4 border-l border-border/50 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/50 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-black leading-none tracking-tight">{user?.full_name || 'System User'}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {user?.role || 'operator'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-risk-high focus:text-risk-high">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
