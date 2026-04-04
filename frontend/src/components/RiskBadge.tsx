import { cn } from '@/lib/utils';

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  const lvl = level?.toUpperCase() || 'UNKNOWN';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase border shadow-sm transition-all duration-300 hover:scale-105',
        lvl === 'HIGH' && 'bg-risk-high/15 text-risk-high border-risk-high/30 shadow-risk-high/5',
        lvl === 'MEDIUM' && 'bg-risk-medium/15 text-risk-medium border-risk-medium/30 shadow-risk-medium/5',
        lvl === 'LOW' && 'bg-risk-low/15 text-risk-low border-risk-low/30 shadow-risk-low/5',
        !['HIGH', 'MEDIUM', 'LOW'].includes(lvl) && 'bg-muted/50 text-muted-foreground border-border/50',
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-2",
        lvl === 'HIGH' && 'bg-risk-high animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        lvl === 'MEDIUM' && 'bg-risk-medium animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]',
        lvl === 'LOW' && 'bg-risk-low',
        !['HIGH', 'MEDIUM', 'LOW'].includes(lvl) && 'bg-muted-foreground',
      )} />
      {lvl}
    </span>
  );
}
