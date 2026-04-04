import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  className?: string;
  trend?: 'up' | 'down';
}

export function MetricCard({ title, value, icon, subtitle, className, trend }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn('bg-background/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300', className)}
    >
      {/* Dynamic glow background */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">{value}</p>
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border",
                trend === 'up' ? "bg-risk-high/10 text-risk-high border-risk-high/20" : "bg-health/10 text-health border-health/20"
              )}>
                {trend === 'up' ? '↑' : '↓'} 12%
              </span>
            )}
          </div>
          {subtitle && (
            <p className={cn(
              "text-xs font-bold flex items-center gap-1.5",
              trend === 'up' ? 'text-risk-high' : trend === 'down' ? 'text-health' : 'text-muted-foreground/60'
            )}>
              <span className="w-1 h-1 rounded-full bg-current" />
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-inner ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      
      {/* Interaction line */}
      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}
