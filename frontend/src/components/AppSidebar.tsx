import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Search,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/process', icon: FileText, label: 'Process Report' },
  { to: '/query', icon: Search, label: 'Query Data' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
];

const bottomNavItems = [
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    ...baseNavItems,
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }]
      : []),
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-500 lg:translate-x-0 lg:static lg:z-auto border-r border-sidebar-border/10 shadow-2xl lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-7 py-8">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tighter leading-none">EMPOWERED</h1>
            <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em] mt-1">Surveillance v2</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
          <div>
            <p className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-sidebar-foreground/20">Operations</p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group',
                      active
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1'
                        : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", active ? "text-primary-foreground" : "text-sidebar-foreground/30")} />
                    {item.label}
                    {active && (
                       <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-white rounded-full -ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-sidebar-foreground/20">Terminal</p>
            <div className="space-y-1">
              {bottomNavItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group',
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground shadow-inner'
                        : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-sidebar-foreground/20")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-sidebar-border/10 bg-black/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/30 border border-sidebar-border/5">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-black text-white text-xs">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tighter">{user?.full_name || 'System User'}</p>
                <p className="text-[9px] font-bold text-sidebar-foreground/40 uppercase tracking-widest leading-none mt-0.5">{user?.role || 'Guest'}</p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
