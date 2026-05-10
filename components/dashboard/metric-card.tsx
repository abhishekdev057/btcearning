import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone?: 'primary' | 'success' | 'info' | 'warning'
  className?: string
}

const toneStyles = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  info: 'bg-chart-3/12 text-chart-3',
  warning: 'bg-warning/12 text-warning',
}

export function MetricCard({ title, value, detail, icon: Icon, tone = 'primary', className }: MetricCardProps) {
  return (
    <Card className={cn('glass-panel shine-edge border-border/70', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
            <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', toneStyles[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
