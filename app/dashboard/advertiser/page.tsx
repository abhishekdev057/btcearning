import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone, PlusCircle, Eye, Bitcoin, ExternalLink, Play } from 'lucide-react'
import Link from 'next/link'
import { formatSatoshi } from '@/lib/types'
import { ToggleAdStatus } from '@/components/dashboard/toggle-ad-status'
import { MetricCard } from '@/components/dashboard/metric-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function AdvertiserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalAds = ads?.length || 0
  const activeAds = ads?.filter(ad => ad.is_active).length || 0
  const totalViews = ads?.reduce((sum, ad) => sum + (ad.total_views || 0), 0) || 0
  const totalSpent = ads?.reduce((sum, ad) => sum + (ad.total_budget - ad.remaining_budget), 0) || 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Advertiser workspace"
        title="My Campaigns"
        description="Manage budget, pause or resume campaigns, and track delivery across the network."
        icon={Megaphone}
        action={
          <Button asChild className="gap-2">
            <Link href="/dashboard/advertiser/create">
              <PlusCircle className="h-4 w-4" />
              Create Ad
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Campaigns" value={totalAds} detail="Created all-time" icon={Megaphone} />
        <MetricCard title="Active Ads" value={activeAds} detail="Currently serving" icon={Play} tone="success" />
        <MetricCard title="Total Views" value={totalViews.toLocaleString()} detail="Verified completions" icon={Eye} tone="info" />
        <MetricCard title="Total Spent" value={formatSatoshi(totalSpent)} detail="Paid to viewers" icon={Bitcoin} tone="warning" />
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Your Ads</CardTitle>
          <CardDescription>All your advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {!ads || ads.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create your first ad campaign to start getting verified views."
              actionHref="/dashboard/advertiser/create"
              actionLabel="Create Your First Ad"
            />
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="rounded-lg border border-border/60 bg-background/45 p-4 transition-colors hover:border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">{ad.title}</h3>
                        <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                          {ad.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{ad.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{ad.url}</span>
                      </div>
                    </div>
                    <ToggleAdStatus adId={ad.id} isActive={ad.is_active} />
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4 border-t border-border/60 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Reward</p>
                      <p className="text-sm font-medium text-foreground">{formatSatoshi(ad.reward_satoshi)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium text-foreground">{ad.view_duration}s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="text-sm font-medium text-foreground">{ad.total_views}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget Left</p>
                      <p className="text-sm font-medium text-foreground">{formatSatoshi(ad.remaining_budget)}</p>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${ad.total_budget > 0 ? ((ad.total_budget - ad.remaining_budget) / ad.total_budget) * 100 : 0}%` }}
                    />
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
