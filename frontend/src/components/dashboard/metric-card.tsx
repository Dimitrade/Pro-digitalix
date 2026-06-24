import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  sub?: string
  growth?: number
  icon: LucideIcon
  iconColor?: string
  loading?: boolean
}

export function MetricCard({
  title, value, sub, growth, icon: Icon, iconColor = 'text-primary', loading
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-2 rounded-lg bg-primary/10', iconColor.replace('text-', 'bg-').replace('-400', '-400/10').replace('-500', '-500/10'))}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-32 bg-secondary rounded animate-pulse" />
          <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            {growth !== undefined && (
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-full',
                growth >= 0
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-red-400 bg-red-400/10'
              )}>
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
