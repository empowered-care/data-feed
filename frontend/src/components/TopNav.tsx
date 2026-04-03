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
    <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 hover:bg-muted rounded-md">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-health animate-pulse" />
          HSIL Hackathon 2026
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={markAllRead}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-risk-high text-[10px] text-card rounded-full flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </Button>

        <div className="pl-2 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none">{user?.full_name || user?.email || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {user?.role === 'admin' ? 'Administrator' : 'Viewer'}
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
