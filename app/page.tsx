import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BitcoinNetworkVisual } from '@/components/brand/bitcoin-network-visual'
import {
  ArrowRight,
  Bitcoin,
  CheckCircle2,
  Droplets,
  Eye,
  Gauge,
  LockKeyhole,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: platformStats } = await supabase.rpc('get_platform_stats').single()

  const publicStats = platformStats as {
    users_count?: number | string
    ads_count?: number | string
    total_paid_satoshi?: number | string
  } | null

  const stats = {
    users: Number(publicStats?.users_count || 0),
    ads: Number(publicStats?.ads_count || 0),
    paid: Number(publicStats?.total_paid_satoshi || 0),
  }

  const workflows = [
    {
      icon: MousePointerClick,
      title: 'Surf verified campaigns',
      description: 'Open advertiser websites, complete the countdown, and receive satoshi through protected database functions.',
    },
    {
      icon: Droplets,
      title: 'Claim the faucet',
      description: 'Hourly faucet claims use server-side cooldown checks so the reward flow stays fair for every account.',
    },
    {
      icon: Users,
      title: 'Grow referrals',
      description: 'Invite friends and earn commission when their eligible activity posts to the platform ledger.',
    },
    {
      icon: Megaphone,
      title: 'Launch campaigns',
      description: 'Advertisers lock campaign budget, set view rewards, and track performance from a dedicated dashboard.',
    },
  ]

  const trustItems = [
    { icon: LockKeyhole, label: 'Server-side balance ledger' },
    { icon: ShieldCheck, label: 'Row-level security policies' },
    { icon: Gauge, label: 'Cooldown and budget enforcement' },
    { icon: Eye, label: 'Transparent activity history' },
  ]

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Bitcoin className="size-6" />
            </div>
            <span className="text-xl font-bold">CryptoBTC</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10 ledger-grid opacity-45" />
          <div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Earn Bitcoin rewards from ads, faucet claims, and referrals.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              CryptoBTC is a secure paid-to-click workspace for earners and advertisers. Track satoshi rewards, launch budgeted campaigns, and request payouts from one polished command center.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href={user ? '/dashboard' : '/auth/sign-up'}>
                  {user ? 'Open Dashboard' : 'Start Earning'}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#workflows">Explore Workflows</Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="text-2xl font-bold">{stats.users.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="text-2xl font-bold">{stats.ads.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active ads</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="text-2xl font-bold text-primary">{(stats.paid / 100000000).toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">BTC requested</p>
              </div>
            </div>
          </div>

          <BitcoinNetworkVisual />
        </section>

        <section id="workflows" className="border-y border-border/70 bg-muted/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <h2 className="text-3xl font-bold">Built around real earning flows</h2>
                <p className="mt-3 text-muted-foreground">
                  Each action maps to a clear state: available, in progress, completed, pending review, or paid.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {workflows.map((item) => (
                  <Card key={item.title} className="glass-panel transition-transform duration-300 hover:-translate-y-1">
                    <CardContent className="p-5">
                      <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="size-5" />
                      </div>
                      <h3 className="mt-5 font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-6">
            <div className="absolute inset-0 ledger-grid opacity-40" />
            <div className="relative grid gap-3">
              {[
                ['Ad view completed', '+50 sat', 'text-chart-3'],
                ['Faucet claim', '+84 sat', 'text-chart-2'],
                ['Referral bonus', '+13 sat', 'text-success'],
                ['Withdrawal requested', '-10,000 sat', 'text-warning'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Ledger-first by design</h2>
            <p className="mt-4 text-muted-foreground">
              Reward posting, ad budget deduction, faucet cooldowns, and withdrawal requests are centralized in database functions. The browser UI stays fast, but sensitive balance math does not depend on client-side trust.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/50 p-3">
                  <item.icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-8 gap-2">
              <Link href={user ? '/dashboard' : '/auth/sign-up'}>
                Continue to app
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-primary/8 py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Ready to open your Bitcoin rewards workspace?</h2>
              <p className="mt-2 text-muted-foreground">Create an account, confirm email, and start with the dashboard workflows.</p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link href={user ? '/dashboard' : '/auth/sign-up'}>
                Launch CryptoBTC
                <Wallet className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Bitcoin className="size-5 text-primary" />
            <span className="font-semibold">CryptoBTC</span>
          </div>
          <p>2026 CryptoBTC. Reward balances are processed through protected ledger functions.</p>
        </div>
      </footer>
    </div>
  )
}
