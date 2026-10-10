import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Copy, Gift, TrendingUp, UserPlus } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'
import { ReferralLinkCopy } from '@/components/dashboard/referral-link-copy'
import { PageHeader } from '@/components/dashboard/page-header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { LedgerRow } from '@/components/dashboard/ledger-row'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred:profiles!referrals_referred_id_fkey(email, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const totalBonus = referrals?.reduce((sum, r) => sum + (r.bonus_earned || 0), 0) || 0
  const totalReferrals = referrals?.length || 0

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptobtc.app'}/auth/sign-up?ref=${profile?.referral_code || ''}`

  const steps = [
    { icon: Copy, title: 'Share Your Link', description: 'Copy and share your unique referral link with friends' },
    { icon: UserPlus, title: 'Friends Sign Up', description: 'When they register using your link, they become your referral' },
    { icon: Gift, title: 'Earn Commissions', description: 'Get 10% of everything your referrals earn from ads and faucet' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Referral program"
        title="Grow your network"
        description="Invite friends and earn 10% of their earnings, automatically credited to your ledger."
        icon={Users}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Referrals" value={totalReferrals} detail="People joined via your link" icon={Users} tone="info" />
        <MetricCard title="Total Bonus Earned" value={formatSatoshi(totalBonus)} detail="From referral commissions" icon={Gift} />
        <MetricCard title="Commission Rate" value="10%" detail="Of referral earnings" icon={TrendingUp} tone="success" />
      </div>

      <Card className="glass-panel shine-edge">
        <CardHeader>
          <CardTitle className="text-foreground">Your Referral Link</CardTitle>
          <CardDescription>Share this link with friends to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralLinkCopy link={referralLink} code={profile?.referral_code || ''} />
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-lg border border-border/60 bg-background/45 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Your Referrals</CardTitle>
          <CardDescription>People who joined using your link</CardDescription>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No referrals yet"
              description="Share your link to start earning commission on their activity!"
            />
          ) : (
            <div className="space-y-2">
              {referrals.map((referral) => (
                <LedgerRow
                  key={referral.id}
                  icon={UserPlus}
                  iconTone="info"
                  title={`${(referral.referred as { email?: string })?.email?.split('@')[0] || 'Anonymous'}***`}
                  subtitle={`Joined ${new Date(referral.created_at).toLocaleDateString()}`}
                  value={`+${formatSatoshi(referral.bonus_earned || 0)}`}
                  valueTone="success"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
