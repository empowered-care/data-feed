import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Search,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/process', icon: FileText, label: 'Process Report' },
  { to: '/query', icon: Search, label: 'Query Data' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="p-1.5 bg-primary rounded-lg">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold tracking-tight">Empowered Care</h1>
            <p className="text-[10px] text-sidebar-foreground/60">Multi-Agent Outbreak Detection</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex gap-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ethiopian-green" />
              <span className="w-2.5 h-2.5 rounded-full bg-ethiopian-gold" />
              <span className="w-2.5 h-2.5 rounded-full bg-ethiopian-red" />
            </div>
            <span className="text-sidebar-foreground/50">HSIL Hackathon 2026 • Addis Ababa</span>
          </div>
        </div>
      </aside>
    </>
  );
}
