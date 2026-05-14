'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, Play, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { openSponsorLink, triggerRewardAdEvent } from '@/components/ads/ad-network'

type SponsorTaskAction = 'smartlink' | 'popunder' | 'social' | 'display'

type SponsorTask = {
  id: string
  title: string
  description: string
  duration: number
  action: SponsorTaskAction
}

const SPONSOR_TASKS: SponsorTask[] = [
  {
    id: 'sponsor-route',
    title: 'Sponsor route',
    description: 'Open a sponsor page and complete the short session check.',
    duration: 14,
    action: 'smartlink',
  },
  {
    id: 'offer-display',
    title: 'Offer display',
    description: 'Let the display placement load, then finish the timer.',
    duration: 12,
    action: 'display',
  },
  {
    id: 'social-stream',
    title: 'Social stream',
    description: 'Load the social placement and wait for the activity check.',
    duration: 12,
    action: 'social',
  },
  {
    id: 'bonus-visit',
    title: 'Bonus visit',
    description: 'Trigger a sponsor visit and pass the cooldown check.',
    duration: 15,
    action: 'popunder',
  },
]

function runSponsorAction(task: SponsorTask) {
  switch (task.action) {
    case 'smartlink':
      openSponsorLink(`sponsor-queue-${task.id}`)
      return
    case 'popunder':
      triggerRewardAdEvent(`sponsor-queue-${task.id}`, {
        includePopunder: true,
        includeSocialBar: true,
      })
      return
    case 'social':
      triggerRewardAdEvent(`sponsor-queue-${task.id}`, {
        includePopunder: false,
        includeSocialBar: true,
      })
      return
    case 'display':
      triggerRewardAdEvent(`sponsor-queue-${task.id}`, {
        includePopunder: false,
        includeSocialBar: true,
      })
  }
}

export function SponsorViewQueue({
  title = 'Available sponsor views',
  description = 'Choose a placement, view it, and let the session check finish.',
  className,
  compact = false,
}: {
  title?: string
  description?: string
  className?: string
  compact?: boolean
}) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set())

  const visibleTasks = useMemo(
    () => (compact ? SPONSOR_TASKS.slice(0, 3) : SPONSOR_TASKS),
    [compact],
  )
  const activeTask = useMemo(
    () => visibleTasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, visibleTasks],
  )

  useEffect(() => {
    if (!activeTask) return

    if (timeLeft <= 0) {
      setCompletedIds((current) => {
        const next = new Set(current)
        next.add(activeTask.id)
        return next
      })
      setActiveTaskId(null)
      toast.success('Sponsor check completed')
      return
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [activeTask, timeLeft])

  const startTask = (task: SponsorTask) => {
    if (activeTaskId) return

    runSponsorAction(task)
    setActiveTaskId(task.id)
    setTimeLeft(task.duration)
  }

  return (
    <section className={cn('rounded-xl border border-border/70 bg-card/65 p-5', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Sponsor queue</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          {completedIds.size} checked
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {visibleTasks.map((task) => {
          const isActive = activeTaskId === task.id
          const isCompleted = completedIds.has(task.id)
          const progress = isCompleted
            ? 100
            : isActive
              ? Math.round(((task.duration - timeLeft) / task.duration) * 100)
              : 0

          return (
            <div
              key={task.id}
              className={cn(
                'rounded-lg border border-border/60 bg-background/45 p-4 transition duration-300',
                isActive && 'border-primary/45 bg-primary/10',
                isCompleted && 'border-success/35 bg-success/10',
              )}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
                    isCompleted && 'bg-success/15 text-success',
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="size-5" /> : <Sparkles className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full bg-primary transition-all duration-500',
                          isCompleted && 'bg-success',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/55 px-2 py-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        opens sponsor
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/55 px-2 py-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {isActive ? `${timeLeft}s` : `${task.duration}s`}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/55 px-2 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isCompleted ? 'checked' : 'session check'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                className="mt-4 w-full gap-2"
                variant={isCompleted ? 'secondary' : 'default'}
                onClick={() => startTask(task)}
                disabled={Boolean(activeTaskId) || isCompleted}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Viewed
                  </>
                ) : isActive ? (
                  <>
                    <Clock3 className="h-4 w-4" />
                    Checking
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    View
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
