import { Menu, Bell, Moon, Sun, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';

interface Props {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: Props) {
  const { darkMode, toggleDarkMode, notifications, markAllRead } = useAppStore();
  const unread = notifications.filter((n) => !n.read).length;

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

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none">Ethiopia MoH</p>
            <p className="text-[10px] text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
