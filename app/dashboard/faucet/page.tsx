'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Bitcoin, Clock, Gift, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatSatoshi } from '@/lib/types'
import useSWR from 'swr'
import { toast } from 'sonner'

const FAUCET_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour
const FAUCET_REWARD_MIN = 10
const FAUCET_REWARD_MAX = 100

export default function FaucetPage() {
  const [isClaiming, setIsClaiming] = useState(false)
  const [lastClaim, setLastClaim] = useState<Date | null>(null)
  const [lastReward, setLastReward] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  const { data: userData, mutate } = useSWR('faucet-data', async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileResult, faucetResult] = await Promise.all([
      supabase.from('profiles').select('btc_balance').eq('id', user.id).single(),
      supabase.from('faucet_claims').select('claimed_at, amount_satoshi')
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .single()
    ])

    return {
      user,
      balance: profileResult.data?.btc_balance || 0,
      lastClaim: faucetResult.data?.claimed_at ? new Date(faucetResult.data.claimed_at) : null,
      lastAmount: faucetResult.data?.amount_satoshi || null
    }
  })

  useEffect(() => {
    if (userData?.lastClaim) {
      setLastClaim(userData.lastClaim)
    }
  }, [userData])

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!lastClaim) {
        setTimeLeft(0)
        return
      }
      const elapsed = Date.now() - lastClaim.getTime()
      const remaining = Math.max(0, FAUCET_COOLDOWN_MS - elapsed)
      setTimeLeft(remaining)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [lastClaim])

  const canClaim = timeLeft === 0

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const claimFaucet = async () => {
    setIsClaiming(true)
    setError(null)
    setLastReward(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: claimError } = await supabase
        .rpc('claim_faucet')
        .single()

      if (claimError) throw claimError

      const result = data as { amount_satoshi?: number | string } | null
      const reward = Number(result?.amount_satoshi ?? 0)
      setLastReward(reward)
      setLastClaim(new Date())
      mutate()
      toast.success(`Faucet claimed: ${formatSatoshi(reward)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to claim faucet'
      setError(message)
      toast.error(message)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/70 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Hourly reward station</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Faucet</h1>
        <p className="text-muted-foreground">Claim a protected reward every hour. Cooldown is enforced server-side.</p>
      </div>

      {/* Main Faucet Card */}
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-chart-2/10 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-chart-2/25 bg-chart-2/15 pulse-ring">
            <Droplets className="h-10 w-10 text-chart-2" />
          </div>
          <CardTitle className="text-2xl text-foreground">Free Bitcoin Faucet</CardTitle>
          <CardDescription>
            Claim {FAUCET_REWARD_MIN} - {FAUCET_REWARD_MAX} satoshi every hour
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-6">
          {/* Reward Display */}
          {lastReward !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/15 px-4 py-2">
              <Gift className="h-5 w-5 text-success" />
              <span className="text-lg font-bold text-success">
                +{formatSatoshi(lastReward)} claimed!
              </span>
            </div>
          )}

          {/* Timer or Claim Button */}
          {!canClaim ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>Next claim available in:</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/50 px-6 py-4 font-mono text-4xl font-bold text-foreground">
                {formatTimeLeft(timeLeft)}
              </div>
              <p className="text-sm text-muted-foreground">
                Come back later to claim more free Bitcoin!
              </p>
            </div>
          ) : (
            <Button 
              onClick={claimFaucet} 
              disabled={isClaiming}
              size="lg"
              className="gap-2 text-lg px-8 py-6"
            >
              <Droplets className="h-5 w-5" />
              {isClaiming ? 'Claiming...' : 'Claim Now'}
            </Button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Current Balance */}
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-4 py-2">
            <Bitcoin className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Your balance:</span>
            <span className="font-medium text-foreground">
              {formatSatoshi(userData?.balance || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">How the Faucet Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
            <p>Click the claim button when the timer reaches zero</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
            <p>Receive a random amount between {FAUCET_REWARD_MIN}-{FAUCET_REWARD_MAX} satoshi</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
            <p>Wait 1 hour before claiming again</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</div>
            <p>Invite friends to earn 10% bonus from their faucet claims!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
