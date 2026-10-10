import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LedgerRowProps {
  icon: LucideIcon
  iconTone?: 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  title: string
  subtitle?: string
  value?: string
  valueTone?: 'success' | 'warning' | 'destructive' | 'muted'
  badge?: React.ReactNode
  className?: string
}

const iconToneStyles = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  destructive: 'bg-destructive/12 text-destructive',
  info: 'bg-chart-3/12 text-chart-3',
}

const valueToneStyles = {
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
}

export function LedgerRow({
  icon: Icon,
  iconTone = 'primary',
  title,
  subtitle,
  value,
  valueTone = 'muted',
  badge,
  className,
}: LedgerRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border/55 bg-background/45 p-3.5 transition-colors duration-200 hover:border-border',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', iconToneStyles[iconTone])}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            {badge}
          </div>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {value ? <span className={cn('shrink-0 text-sm font-semibold', valueToneStyles[valueTone])}>{value}</span> : null}
    </div>
  )
}
