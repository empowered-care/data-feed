import { cn } from '@/lib/utils';

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        level === 'HIGH' && 'bg-risk-high/10 text-risk-high',
        level === 'MEDIUM' && 'bg-risk-medium/10 text-risk-medium',
        level === 'LOW' && 'bg-risk-low/10 text-risk-low',
        !['HIGH', 'MEDIUM', 'LOW'].includes(level) && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {level}
    </span>
  );
}
