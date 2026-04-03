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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card rounded-xl p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={`text-xs font-medium ${trend === 'up' ? 'text-risk-high' : trend === 'down' ? 'text-health' : 'text-muted-foreground'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
      </div>
    </motion.div>
  );
}
