'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bitcoin, Bell, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { formatSatoshi } from '@/lib/types'
import Link from 'next/link'

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="md:hidden" />

      <div className="hidden min-w-0 flex-1 md:block">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">CryptoBTC command center</p>
        <p className="truncate text-sm text-muted-foreground">Secure earning, campaign budget, and payout activity in one place.</p>
      </div>
      
      {/* Balance Display (Mobile) */}
      <div className="flex items-center gap-2 md:hidden">
        <Bitcoin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {formatSatoshi(profile?.btc_balance || 0)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-border/70 bg-popover/95 p-2">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-foreground">Activity pulse</p>
              <p className="text-xs text-muted-foreground">Live account state and recommended next actions.</p>
            </div>
            <div className="mt-1 space-y-1">
              {[
                { icon: ShieldCheck, title: 'Ledger protection active', detail: 'Rewards are credited through server-side RPCs.' },
                { icon: Clock3, title: 'Faucet checks cooldown', detail: 'One claim per hour is enforced in the database.' },
                { icon: CheckCircle2, title: 'Ready to earn', detail: 'Open Surf Ads or Faucet to continue.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-lg p-2 hover:bg-muted/50">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button asChild size="sm" className="hidden sm:flex">
          <Link href="/dashboard/withdraw">
            Withdraw
          </Link>
        </Button>
      </div>
    </header>
  )
}
