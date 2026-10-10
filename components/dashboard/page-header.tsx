import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, icon: Icon, action, className }: PageHeaderProps) {
  return (
    <section className={cn('relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-5 md:p-7', className)}>
      <div className="pointer-events-none absolute inset-0 ledger-grid opacity-40" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Icon className="size-6" />
            </div>
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  )
}
