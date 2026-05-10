import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import {
  ArrowRight,
  Bitcoin,
  Droplets,
  History,
  Megaphone,
  MousePointerClick,
  Play,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { formatBtc, formatSatoshi } from '@/lib/types'
import { AdSlot } from '@/components/ads/ad-network'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [profileResult, adsCountResult, transactionsResult, referralsResult, campaignResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('ads').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('referrals').select('id', { count: 'exact' }).eq('referrer_id', user.id),
    supabase.from('ads').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const availableAds = adsCountResult.count || 0
  const recentTransactions = transactionsResult.data || []
  const totalReferrals = referralsResult.count || 0
  const totalCampaigns = campaignResult.count || 0

  const { data: lastFaucet } = await supabase
    .from('faucet_claims')
    .select('claimed_at')
    .eq('user_id', user.id)
    .order('claimed_at', { ascending: false })
    .limit(1)
    .single()

  const faucetCooldown = 60 * 60 * 1000
  const lastClaimTime = lastFaucet?.claimed_at ? new Date(lastFaucet.claimed_at).getTime() : 0
  const faucetAvailable = Date.now() - lastClaimTime >= faucetCooldown

  const quickActions = [
    {
      title: 'Surf Ads',
      description: `${availableAds} campaign${availableAds === 1 ? '' : 's'} available`,
      icon: MousePointerClick,
      href: '/dashboard/surf',
      tone: 'primary',
    },
    {
      title: 'Faucet',
      description: faucetAvailable ? 'Ready to claim' : 'Cooldown active',
      icon: Droplets,
      href: '/dashboard/faucet',
      tone: 'success',
    },
    {
      title: 'Referrals',
      description: `${totalReferrals} active referral${totalReferrals === 1 ? '' : 's'}`,
      icon: Users,
      href: '/dashboard/referrals',
      tone: 'info',
    },
    {
      title: 'Withdraw',
      description: 'Request payout review',
      icon: Wallet,
      href: '/dashboard/withdraw',
      tone: 'warning',
    },
  ] as const

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ad_view': return <Play className="h-4 w-4 text-chart-3" />
      case 'faucet': return <Droplets className="h-4 w-4 text-chart-2" />
      case 'referral_bonus': return <Users className="h-4 w-4 text-success" />
      case 'withdrawal': return <Wallet className="h-4 w-4 text-warning" />
      case 'ad_deposit': return <Megaphone className="h-4 w-4 text-primary" />
      default: return <Bitcoin className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-5 md:p-7">
        <div className="absolute inset-0 ledger-grid opacity-50" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Account overview</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              Welcome back{profile?.username ? `, ${profile.username}` : ''}.
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Your earning flows, advertiser budget, referral momentum, and payout activity are tracked in one protected ledger.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current balance</p>
            <p className="mt-2 text-3xl font-bold text-primary">{formatSatoshi(profile?.btc_balance || 0)}</p>
            <p className="text-sm text-muted-foreground">{formatBtc(profile?.btc_balance || 0)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Balance" value={formatSatoshi(profile?.btc_balance || 0)} detail={formatBtc(profile?.btc_balance || 0)} icon={Bitcoin} />
        <MetricCard title="Earned" value={formatSatoshi(profile?.total_earned || 0)} detail="All-time credited rewards" icon={TrendingUp} tone="success" />
        <MetricCard title="Withdrawn" value={formatSatoshi(profile?.total_withdrawn || 0)} detail="Submitted payout volume" icon={Wallet} tone="warning" />
        <MetricCard title="Network" value={totalReferrals} detail={`${totalCampaigns} advertiser campaign${totalCampaigns === 1 ? '' : 's'}`} icon={Users} tone="info" />
      </div>

      <div className="hidden justify-center sm:flex">
        <AdSlot variant="leaderboard" />
      </div>

      <div className="grid gap-7 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="glass-panel">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Next best actions</CardTitle>
                <CardDescription>Jump into the workflow with the highest momentum.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/surf">
                  Surf
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="group rounded-xl border border-border/70 bg-background/45 p-4 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-muted/35">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <action.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest ledger entries from your account.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/history">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={History}
                title="No ledger activity yet"
                description="Start with Surf Ads or Faucet and your rewards will appear here."
                actionHref="/dashboard/surf"
                actionLabel="Find Ads"
              />
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/55 bg-background/45 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize text-foreground">{tx.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.amount_satoshi >= 0 ? 'text-success' : 'text-warning'}`}>
                      {tx.amount_satoshi >= 0 ? '+' : ''}{formatSatoshi(tx.amount_satoshi)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdSlot variant="native" />

      <Card className="glass-panel overflow-hidden">
        <CardContent className="grid gap-6 p-5 md:grid-cols-3 md:p-6">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold">Reward system health</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Faucet cooldowns, ad campaign budgets, referral commissions, and payout requests are handled by database functions for a cleaner production path.
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-muted/35 p-3">
              <span className="text-muted-foreground">Faucet</span>
              <span className={faucetAvailable ? 'text-success' : 'text-warning'}>
                {faucetAvailable ? 'Ready' : 'Cooling down'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/35 p-3">
              <span className="text-muted-foreground">Ad queue</span>
              <span className="text-primary">{availableAds} available</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/35 p-3">
              <span className="text-muted-foreground">Ledger</span>
              <span className="text-success">Protected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
