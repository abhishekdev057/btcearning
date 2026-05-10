import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Shield, Bitcoin } from 'lucide-react'
import { formatSatoshi, formatBtc } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Account Information</CardTitle>
          </div>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input value={user.email || ''} disabled className="bg-muted text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">User ID</Label>
            <Input value={user.id} disabled className="bg-muted text-foreground font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Member Since</Label>
            <Input 
              value={new Date(user.created_at).toLocaleDateString()} 
              disabled 
              className="bg-muted text-foreground" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Balance Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Balance Summary</CardTitle>
          </div>
          <CardDescription>Your Bitcoin balance and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold text-foreground">{formatSatoshi(profile?.btc_balance || 0)}</p>
              <p className="text-xs text-muted-foreground">{formatBtc(profile?.btc_balance || 0)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold text-success">{formatSatoshi(profile?.total_earned || 0)}</p>
              <p className="text-xs text-muted-foreground">{formatBtc(profile?.total_earned || 0)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-xl font-bold text-foreground">{formatSatoshi(profile?.total_withdrawn || 0)}</p>
              <p className="text-xs text-muted-foreground">{formatBtc(profile?.total_withdrawn || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Referral Information</CardTitle>
          </div>
          <CardDescription>Your unique referral code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Your Referral Code</Label>
            <Input 
              value={profile?.referral_code || ''} 
              disabled 
              className="bg-muted text-foreground font-mono"
            />
          </div>
          {profile?.referred_by && (
            <div className="space-y-2">
              <Label className="text-foreground">Referred By</Label>
              <Input 
                value={profile.referred_by} 
                disabled 
                className="bg-muted text-foreground font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Demo Platform Notice</p>
            <p>
              This is a demonstration platform. All Bitcoin values shown are simulated 
              and not real cryptocurrency. Do not send real Bitcoin to this platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
