import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone, PlusCircle, Eye, Bitcoin, ExternalLink, Play } from 'lucide-react'
import Link from 'next/link'
import { formatSatoshi } from '@/lib/types'
import { ToggleAdStatus } from '@/components/dashboard/toggle-ad-status'

export default async function AdvertiserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's ads
  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalAds = ads?.length || 0
  const activeAds = ads?.filter(ad => ad.is_active).length || 0
  const totalViews = ads?.reduce((sum, ad) => sum + (ad.total_views || 0), 0) || 0
  const totalSpent = ads?.reduce((sum, ad) => sum + (ad.total_budget - ad.remaining_budget), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Campaigns</h1>
          <p className="text-muted-foreground">Manage your advertising campaigns</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/advertiser/create">
            <PlusCircle className="h-4 w-4" />
            Create Ad
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Ads</CardTitle>
            <Play className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeAds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <Bitcoin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSatoshi(totalSpent)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Your Ads</CardTitle>
          <CardDescription>All your advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {!ads || ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Megaphone className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">No Campaigns Yet</h3>
              <p className="text-sm text-muted-foreground text-center mt-2 mb-4">
                Create your first ad campaign to start getting views
              </p>
              <Button asChild>
                <Link href="/dashboard/advertiser/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Ad
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="rounded-lg border border-border bg-card p-4">
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
                  
                  <div className="mt-4 grid grid-cols-4 gap-4 border-t border-border pt-4">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
