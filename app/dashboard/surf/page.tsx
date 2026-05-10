import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SurfAdsClient } from '@/components/dashboard/surf-ads-client'

export default async function SurfAdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's already viewed ads
  const { data: viewedAds } = await supabase
    .from('ad_views')
    .select('ad_id')
    .eq('user_id', user.id)

  const viewedAdIds = viewedAds?.map(v => v.ad_id) || []

  // Fetch available ads that user hasn't reached max views
  const { data: availableAds } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .gt('remaining_budget', 0)
    .order('reward_satoshi', { ascending: false })

  // Filter out ads user has already viewed max times
  const adsToShow = availableAds?.filter(ad => {
    const viewCount = viewedAdIds.filter(id => id === ad.id).length
    return viewCount < ad.max_views_per_user
  }) || []

  return <SurfAdsClient ads={adsToShow} />
}
