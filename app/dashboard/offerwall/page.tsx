import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Layers, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function OfferwallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const apiKey = process.env.OFFERWALLAPI_API_KEY

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Partner network"
        title="Offerwall"
        description="Complete partner offers, surveys, videos, and quick tasks to earn extra Bitcoin. Rewards post automatically to your ledger."
        icon={Layers}
      />

      {!apiKey ? (
        <EmptyState
          icon={Layers}
          title="Offerwall is not configured yet"
          description="Set OFFERWALLAPI_API_KEY in your environment to enable this page."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            <ShieldCheck className="h-4 w-4" />
            Completions are confirmed server-to-server and credited automatically — no need to refresh or claim manually.
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70">
            <iframe
              src={`https://offerwallapi.com/offerwall/${apiKey}/${user.id}`}
              title="Offerwall"
              scrolling="yes"
              allow="notifications"
              style={{ width: '100%', height: '820px', border: 0, display: 'block' }}
            />
          </div>
        </>
      )}
    </div>
  )
}
