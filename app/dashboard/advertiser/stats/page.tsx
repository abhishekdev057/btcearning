import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Bitcoin, TrendingUp, BarChart3 } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'
import { MetricCard } from '@/components/dashboard/metric-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyState } from '@/components/dashboard/empty-state'
import { CampaignViewsChart } from '@/components/dashboard/campaign-views-chart'

export default async function AdvertiserStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', user.id)

  const adIds = ads?.map(ad => ad.id) || []
  const { data: views } = await supabase
    .from('ad_views')
    .select('*')
    .in('ad_id', adIds)
    .order('viewed_at', { ascending: false })

  const totalViews = views?.length || 0
  const totalSpent = views?.reduce((sum, v) => sum + (v.earned_satoshi || 0), 0) || 0
  const averagePerView = totalViews > 0 ? Math.round(totalSpent / totalViews) : 0

  const viewsByDate = views?.reduce((acc, view) => {
    const date = new Date(view.viewed_at).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const chartData = last7Days.map((date) => ({
    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
    views: viewsByDate[date.toLocaleDateString()] || 0,
  }))

  const adStats = ads?.map(ad => {
    const adViews = views?.filter(v => v.ad_id === ad.id) || []
    return {
      ...ad,
      viewCount: adViews.length,
      spent: adViews.reduce((sum, v) => sum + (v.earned_satoshi || 0), 0)
    }
  }).sort((a, b) => b.viewCount - a.viewCount) || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="Campaign Statistics"
        description="Track verified views, spend, and delivery across every campaign."
        icon={BarChart3}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Views" value={totalViews.toLocaleString()} detail="All time" icon={Eye} tone="info" />
        <MetricCard title="Total Spent" value={formatSatoshi(totalSpent)} detail="Paid to viewers" icon={Bitcoin} />
        <MetricCard title="Avg. Per View" value={formatSatoshi(averagePerView)} detail="Average cost" icon={TrendingUp} tone="success" />
        <MetricCard title="Active Campaigns" value={ads?.filter(a => a.is_active).length || 0} detail="Running now" icon={BarChart3} tone="warning" />
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Views (Last 7 Days)</CardTitle>
          <CardDescription>Daily verified view count across your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignViewsChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Campaign Performance</CardTitle>
          <CardDescription>Breakdown by individual campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {adStats.length === 0 ? (
            <EmptyState icon={BarChart3} title="No campaigns yet" description="Launch a campaign to start seeing performance data here." />
          ) : (
            <div className="space-y-4">
              {adStats.map((ad) => {
                const progress = ad.total_budget > 0
                  ? ((ad.total_budget - ad.remaining_budget) / ad.total_budget) * 100
                  : 0
                return (
                  <div key={ad.id} className="rounded-lg border border-border/60 bg-background/45 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-foreground">{ad.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${ad.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {ad.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium text-foreground">{ad.viewCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-medium text-foreground">{formatSatoshi(ad.spent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium text-foreground">{formatSatoshi(ad.remaining_budget)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reward</p>
                        <p className="font-medium text-foreground">{formatSatoshi(ad.reward_satoshi)}/view</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.toFixed(0)}% budget used
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
