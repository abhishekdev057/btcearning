import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Bitcoin, TrendingUp, BarChart3 } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'

export default async function AdvertiserStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's ads with view counts
  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', user.id)

  // Get view data for all user's ads
  const adIds = ads?.map(ad => ad.id) || []
  const { data: views } = await supabase
    .from('ad_views')
    .select('*')
    .in('ad_id', adIds)
    .order('viewed_at', { ascending: false })

  // Calculate stats
  const totalViews = views?.length || 0
  const totalSpent = views?.reduce((sum, v) => sum + (v.earned_satoshi || 0), 0) || 0
  const averagePerView = totalViews > 0 ? Math.round(totalSpent / totalViews) : 0

  // Group views by date for chart data
  const viewsByDate = views?.reduce((acc, view) => {
    const date = new Date(view.viewed_at).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString()
  })

  const chartData = last7Days.map(date => ({
    date,
    views: viewsByDate[date] || 0
  }))

  // Per-ad stats
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaign Statistics</h1>
        <p className="text-muted-foreground">Track your advertising performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <Bitcoin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSatoshi(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Paid to viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Per View</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSatoshi(averagePerView)}</div>
            <p className="text-xs text-muted-foreground">Average cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{ads?.filter(a => a.is_active).length || 0}</div>
            <p className="text-xs text-muted-foreground">Running now</p>
          </CardContent>
        </Card>
      </div>

      {/* Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Views (Last 7 Days)</CardTitle>
          <CardDescription>Daily view count for your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-end gap-2">
            {chartData.map((day, i) => {
              const maxViews = Math.max(...chartData.map(d => d.views), 1)
              const height = (day.views / maxViews) * 100
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex-1">
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-primary transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{day.views}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-Ad Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Campaign Performance</CardTitle>
          <CardDescription>Breakdown by individual campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {adStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No campaigns yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adStats.map((ad) => {
                const progress = ad.total_budget > 0 
                  ? ((ad.total_budget - ad.remaining_budget) / ad.total_budget) * 100 
                  : 0
                return (
                  <div key={ad.id} className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{ad.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${ad.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
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
                    <div className="h-2 w-full rounded-full bg-muted">
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
