'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Bitcoin, ExternalLink, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Ad } from '@/lib/types'
import { formatSatoshi } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EmptyState } from '@/components/dashboard/empty-state'

interface SurfAdsClientProps {
  ads: Ad[]
}

type ViewState = 'idle' | 'viewing' | 'completed' | 'error'

export function SurfAdsClient({ ads }: SurfAdsClientProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [viewState, setViewState] = useState<ViewState>('idle')
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [earnedTotal, setEarnedTotal] = useState(0)
  const router = useRouter()

  const currentAd = ads[currentAdIndex]

  const startViewing = useCallback(() => {
    if (!currentAd) return
    setViewState('viewing')
    setTimeLeft(currentAd.view_duration)
    setError(null)
    
    // Open the ad URL in a new window
    window.open(currentAd.url, '_blank', 'noopener,noreferrer')
  }, [currentAd])

  const completeView = useCallback(async () => {
    if (!currentAd) return

    const supabase = createClient()
    
    try {
      const { data, error: viewError } = await supabase
        .rpc('complete_ad_view', {
          p_ad_id: currentAd.id,
        })
        .single()

      if (viewError) throw viewError

      const result = data as { earned_satoshi?: number | string } | null
      const earned = Number(result?.earned_satoshi ?? currentAd.reward_satoshi)
      setEarnedTotal((prev) => prev + earned)
      setViewState('completed')
      toast.success(`Reward credited: ${formatSatoshi(earned)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record view'
      setError(message)
      setViewState('error')
      toast.error(message)
    }
  }, [currentAd])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (viewState === 'viewing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (viewState === 'viewing' && timeLeft === 0) {
      // Complete the view
      completeView()
    }

    return () => clearInterval(interval)
  }, [completeView, viewState, timeLeft])

  const nextAd = () => {
    if (currentAdIndex < ads.length - 1) {
      setCurrentAdIndex((prev) => prev + 1)
      setViewState('idle')
    } else {
      router.refresh()
    }
  }

  if (ads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Surf Ads</h1>
          <p className="text-muted-foreground">View websites and earn Bitcoin</p>
        </div>

        <EmptyState
          icon={AlertCircle}
          title="No ads available"
          description="There are no active campaigns ready for your account right now. Try the faucet or check back after advertisers add budget."
          actionHref="/dashboard/faucet"
          actionLabel="Try Faucet"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Verified viewing queue</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Surf Ads</h1>
          <p className="text-muted-foreground">Open campaign pages, complete the timer, and receive protected ledger credit.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
          <Bitcoin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Earned: {formatSatoshi(earnedTotal)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <Progress value={((currentAdIndex + 1) / ads.length) * 100} className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {currentAdIndex + 1} / {ads.length} ads
        </span>
      </div>

      {/* Current Ad Card */}
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-foreground">{currentAd.title}</CardTitle>
              <CardDescription className="mt-1">
                {currentAd.description || 'View this website to earn rewards'}
              </CardDescription>
            </div>
            <div className="flex w-fit items-center gap-1 rounded-lg border border-primary/20 bg-primary/15 px-3 py-2">
              <Bitcoin className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                +{formatSatoshi(currentAd.reward_satoshi)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6">
            {/* URL Preview */}
            <div className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-muted/35 p-3">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {currentAd.url}
              </span>
            </div>

            {/* View Timer */}
            {viewState === 'viewing' && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-background/50">
                  <svg className="absolute h-full w-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * (currentAd.view_duration - timeLeft)) / currentAd.view_duration}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <Clock className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-bold text-foreground">{timeLeft}s</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Keep the ad tab open until the timer completes
                </p>
              </div>
            )}

            {/* Completed State */}
            {viewState === 'completed' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20 pulse-ring">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">View Completed!</p>
                  <p className="text-sm text-muted-foreground">
                    You earned {formatSatoshi(currentAd.reward_satoshi)}
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {viewState === 'error' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">Error</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {viewState === 'idle' && (
                <Button onClick={startViewing} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Viewing ({currentAd.view_duration}s)
                </Button>
              )}
              {viewState === 'completed' && (
                <Button onClick={nextAd} size="lg">
                  {currentAdIndex < ads.length - 1 ? 'Next Ad' : 'Finish'}
                </Button>
              )}
              {viewState === 'error' && (
                <Button onClick={() => setViewState('idle')} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Click &quot;Start Viewing&quot; to open the ad in a new tab</li>
                <li>Keep the ad tab open until the timer completes</li>
                <li>Your reward will be automatically credited to your balance</li>
                <li>Each ad can only be viewed a limited number of times</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
