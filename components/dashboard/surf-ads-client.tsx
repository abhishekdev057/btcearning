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
import { AdSlot, openSponsorLink, triggerRewardAdEvent } from '@/components/ads/ad-network'
import { SponsorViewQueue } from '@/components/ads/sponsor-view-queue'

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

  const startViewing = useCallback((adIndex = currentAdIndex) => {
    const adToView = ads[adIndex]
    if (!adToView) return

    setCurrentAdIndex(adIndex)
    setViewState('viewing')
    setTimeLeft(adToView.view_duration)
    setError(null)

    // Open the ad URL in a new window
    window.open(adToView.url, '_blank', 'noopener,noreferrer')
    triggerRewardAdEvent('surf-start')
  }, [ads, currentAdIndex])

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
      triggerRewardAdEvent('surf-complete', { includePopunder: false })
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

        <div className="hidden justify-center sm:flex">
          <AdSlot variant="leaderboard" />
        </div>

        <SponsorViewQueue
          title="Sponsor views are ready"
          description="Network sponsor checks are available right now for users."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_178px]">
          <AdSlot variant="native" />
          <div className="hidden xl:block">
            <AdSlot variant="skyscraper" />
          </div>
        </div>
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

      <div className="hidden justify-center sm:flex">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <Progress value={((currentAdIndex + 1) / ads.length) * 100} className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {currentAdIndex + 1} / {ads.length} ads
        </span>
      </div>

      <section className="rounded-xl border border-border/70 bg-card/65 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Available ads</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Campaign list</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick any campaign and run the timer check before reward credit.</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            {ads.length} ready
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad, index) => {
            const isCurrent = index === currentAdIndex
            const isViewing = isCurrent && viewState === 'viewing'
            const isCompleted = isCurrent && viewState === 'completed'

            return (
              <div
                key={ad.id}
                className={`rounded-lg border p-4 transition duration-300 ${
                  isCurrent
                    ? 'border-primary/45 bg-primary/10'
                    : 'border-border/60 bg-background/45 hover:border-primary/35'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{ad.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {ad.description || 'Open this sponsor page and complete the timer.'}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    +{formatSatoshi(ad.reward_satoshi)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/55 px-2 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {ad.view_duration}s
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/55 px-2 py-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {isCompleted ? 'checked' : 'timer check'}
                  </span>
                </div>

                <Button
                  type="button"
                  className="mt-4 w-full gap-2"
                  onClick={() => startViewing(index)}
                  disabled={viewState === 'viewing'}
                  variant={isCompleted ? 'secondary' : 'default'}
                >
                  {isViewing ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Viewing
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Viewed
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

      {/* Current Ad Card */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_178px]">
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
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {currentAd.url}
                </span>
              </div>

              {/* View Timer */}
              {viewState === 'viewing' && (
                <div className="flex w-full flex-col items-center gap-4">
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
                      <Clock className="mb-1 h-6 w-6 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{timeLeft}s</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
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
              <div className="flex flex-wrap justify-center gap-4">
                {viewState === 'idle' && (
                  <Button onClick={() => startViewing()} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    Start Viewing ({currentAd.view_duration}s)
                  </Button>
                )}
                {viewState === 'completed' && (
                  <>
                    <Button onClick={nextAd} size="lg">
                      {currentAdIndex < ads.length - 1 ? 'Next Ad' : 'Finish'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => openSponsorLink('surf-completed')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Sponsor
                    </Button>
                  </>
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

        <div className="hidden xl:block">
          <div className="sticky top-24">
            <AdSlot variant="skyscraper" />
          </div>
        </div>
      </div>

      {viewState === 'completed' && <AdSlot variant="native" />}

      <SponsorViewQueue
        compact
        title="More sponsor views"
        description="Extra sponsor checks stay available between campaign views."
      />

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
