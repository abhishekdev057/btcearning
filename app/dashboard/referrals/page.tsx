import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Copy, Gift, TrendingUp, UserPlus } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'
import { ReferralLinkCopy } from '@/components/dashboard/referral-link-copy'

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile with referral code
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  // Fetch referral stats
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred:profiles!referrals_referred_id_fkey(email, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate total bonus earned
  const totalBonus = referrals?.reduce((sum, r) => sum + (r.bonus_earned || 0), 0) || 0
  const totalReferrals = referrals?.length || 0

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptobtc.app'}/auth/sign-up?ref=${profile?.referral_code || ''}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
        <p className="text-muted-foreground">Invite friends and earn 10% of their earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">People joined via your link</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bonus Earned</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSatoshi(totalBonus)}</div>
            <p className="text-xs text-muted-foreground">From referral commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">10%</div>
            <p className="text-xs text-muted-foreground">Of referral earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Your Referral Link</CardTitle>
          <CardDescription>Share this link with friends to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralLinkCopy link={referralLink} code={profile?.referral_code || ''} />
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Copy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Share Your Link</p>
              <p className="text-sm text-muted-foreground">Copy and share your unique referral link with friends</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Friends Sign Up</p>
              <p className="text-sm text-muted-foreground">When they register using your link, they become your referral</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Earn Commissions</p>
              <p className="text-sm text-muted-foreground">Get 10% of everything your referrals earn from ads and faucet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Your Referrals</CardTitle>
          <CardDescription>People who joined using your link</CardDescription>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {(referral.referred as { email?: string })?.email?.split('@')[0] || 'Anonymous'}***
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">+{formatSatoshi(referral.bonus_earned || 0)}</p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
